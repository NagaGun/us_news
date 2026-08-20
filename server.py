# server.py
# Flask backend for the Operations Assistant chatbot.
# Runs on port 5000 alongside the Vite dev server on port 3000.

from flask import Flask, request, jsonify
from flask_cors import CORS
from middleware import SecureHospitalChatbotMiddleware
from engine import evaluate_hospital, normalize_metric, METRIC_LIMITS
from ml_models import predict_all_submetrics
from mock_data import HOSPITAL_DATA

app = Flask(__name__)
CORS(app)  # Allow requests from the Vite dev server origin

# Initialize middleware (stub DB connection string — replace with real DSN in production)
DB_CONNECTION_STRING = "postgresql://user:password@localhost:5432/hospital_db"
chatbot_middleware = SecureHospitalChatbotMiddleware(db_connection_string=DB_CONNECTION_STRING)

FALLBACK_RESPONSE = (
    "I cannot answer that question. My access is strictly sandboxed to our "
    "facility's metrics and aggregated peer benchmarks."
)


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    POST /api/chat
    Body: { "message": string, "hospital_id": string (optional, default "HOSP_A") }
    Returns: { "response": string }
    """
    data = request.get_json(silent=True)

    # --- Payload validation ---
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON payload"}), 400

    message = data.get("message", "").strip()
    if not message:
        return jsonify({"error": "Field 'message' is required and cannot be empty"}), 400

    hospital_id = data.get("hospital_id", "HOSP_A")

    # --- Middleware call with strict error sandboxing ---
    try:
        response_text = chatbot_middleware.generate_safe_llm_response(hospital_id, message)
        return jsonify({"response": response_text}), 200

    except ValueError:
        # Prompt injection detected
        return jsonify({"response": FALLBACK_RESPONSE}), 200

    except TimeoutError:
        # Database or LLM timeout
        return jsonify({"response": FALLBACK_RESPONSE}), 200

    except Exception:
        # Catch-all: never surface raw system errors to the client
        return jsonify({"response": FALLBACK_RESPONSE}), 200


@app.route("/api/simulate", methods=["GET", "POST"])
def simulate():
    """
    GET /api/simulate
    POST /api/simulate
    Body: { "target_overrides": { "nurse_staffing_ratio": 5.0, ... } }
          OR { "nurse_staffing_ratio": 5.0, ... }
    Returns: { "baseline": dict, "simulated": dict, "is_simulated": bool }
    """
    target_overrides = {}
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        if "target_overrides" in data and isinstance(data["target_overrides"], dict):
            target_overrides = data["target_overrides"]
        elif isinstance(data, dict):
            target_overrides = data

    try:
        baseline_result = evaluate_hospital()
        simulated_result = evaluate_hospital(target_overrides) if target_overrides else baseline_result

        return jsonify({
            "baseline": baseline_result,
            "simulated": simulated_result,
            "is_simulated": bool(target_overrides)
        }), 200
    except Exception as e:
        return jsonify({"error": f"Simulation execution failed: {str(e)}"}), 500


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    POST /api/predict
    Note: ml_models.py is trained on synthetic hospital state data (60 synthetic hospitals per department)
    using Random Forest, Linear Regression, and an OOD (Out-Of-Distribution) Guard suite per department.

    Body:
    {
        "department_id": string (optional, default "cardiology"),
        "patient_volume": number (optional),
        "intensivists_staffing": number (optional),
        "nurse_magnet": 0 | 1 (optional),
        "public_transparency": number (optional),
        "trauma_center": 0 | 1 (optional)
    }

    Returns:
    {
        "predicted_raw": { ... },
        "predicted_scores": { ... },
        "ood_assessment": { "level": "confident" | "caution" | "out_of_range", "score": number, ... },
        "notes": string
    }
    """
    data = request.get_json(silent=True) or {}
    dept_id = str(data.get("department_id", "cardiology")).lower()
    cardio_data = HOSPITAL_DATA.get(dept_id, HOSPITAL_DATA.get("cardiology", HOSPITAL_DATA.get("Cardiology", {})))
    baseline_hospital = cardio_data.get("my_hospital", {}).copy()

    # Merge default hospital values with incoming request payload overrides
    input_state = {
        "patient_volume": float(data.get("patient_volume", baseline_hospital.get("patient_volume", 600))),
        "nurse_staffing_ratio": float(data.get("nurse_staffing_ratio", baseline_hospital.get("nurse_staffing_ratio", 3.5))),
        "nurse_magnet": int(data.get("nurse_magnet", baseline_hospital.get("nurse_magnet", 0))),
        "intensivists_staffing": float(data.get("intensivists_staffing", baseline_hospital.get("intensivists_staffing", 18.0))),
        "expert_consults": float(data.get("expert_consults", baseline_hospital.get("expert_consults", 85.0))),
        "public_transparency": float(data.get("public_transparency", baseline_hospital.get("public_transparency", 82.0))),
        "hcahps_score": float(data.get("hcahps_score", baseline_hospital.get("hcahps_score", 75.0))),
        "trauma_center": int(data.get("trauma_center", baseline_hospital.get("trauma_center", 0)))
    }

    try:
        # 1. Execute Random Forest + Linear Regression + OOD Guard predictions from ml_models.py
        raw_predictions = predict_all_submetrics(input_state, department_id=dept_id)
        ood_assessment = raw_predictions.pop("ood_assessment", None)

        # 2. Normalize predicted metric values into 0-100 scores using engine.py METRIC_LIMITS
        predicted_scores = {}
        for key, val in raw_predictions.items():
            if key in METRIC_LIMITS:
                limits = METRIC_LIMITS[key]
                predicted_scores[key] = normalize_metric(
                    val=val,
                    min_val=limits["min"],
                    max_val=limits["max"],
                    higher_is_better=limits["higher_is_better"]
                )

        notes = (
            "ml_models.py is trained on synthetic hospital state data (60 hospitals across 10 departments) "
            "using Random Forest and Linear Regression models with a multi-layer OOD (Out-Of-Distribution) Guard per department. "
            "Canonical outcome key: calculated_smr (lower = better)."
        )

        return jsonify({
            "predicted_raw": raw_predictions,
            "predicted_scores": predicted_scores,
            "ood_assessment": ood_assessment,
            "notes": notes
        }), 200

    except Exception as e:
        return jsonify({"error": f"ML prediction execution failed: {str(e)}"}), 500


@app.route("/api/hospitals/compare", methods=["GET"])
def compare():
    """
    GET /api/hospitals/compare?dept=cancer
    Returns mock/synthetic hospital comparison data for the given department.
    """
    dept = request.args.get("dept", "cancer").lower()
    dept_data = HOSPITAL_DATA.get(dept)
    if not dept_data:
        for k, v in HOSPITAL_DATA.items():
            if k.lower() == dept:
                dept_data = v
                break
    if not dept_data:
        dept_data = next(iter(HOSPITAL_DATA.values()))

    return jsonify({
        "department": dept,
        "my_hospital": dept_data["my_hospital"],
        "peer_group": dept_data["peer_group"]
    }), 200


@app.route("/api/health", methods=["GET"])
def health():
    """Simple liveness check."""
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(port=5000, debug=True)
