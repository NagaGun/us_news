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
    Note: ml_models.py is trained on a synthetic/simulated dataset of 100 Bay Area hospitals
    using Random Forest and Linear Regression models. Its predictions demonstrate ML-based
    operational outcome forecasting and are illustrative rather than clinically validated.

    Body:
    {
        "patient_volume": number (optional),
        "intensivists_staffing": number (optional),
        "nurse_magnet": 0 | 1 (optional),
        "public_transparency": number (optional)
    }

    Returns:
    {
        "predicted_raw": { ... },
        "predicted_scores": { ... },
        "notes": string
    }
    """
    data = request.get_json(silent=True) or {}
    baseline_hospital = HOSPITAL_DATA.get("Cardiology", {}).get("my_hospital", {}).copy()

    # Merge default hospital values with incoming request payload overrides
    input_state = {
        "patient_volume": float(data.get("patient_volume", baseline_hospital.get("patient_volume", 600))),
        "nurse_staffing_ratio": float(data.get("nurse_staffing_ratio", baseline_hospital.get("nurse_staffing_ratio", 6.5))),
        "nurse_magnet": int(data.get("nurse_magnet", baseline_hospital.get("nurse_magnet", 0))),
        "intensivists_staffing": float(data.get("intensivists_staffing", baseline_hospital.get("intensivists_staffing", 40.0))),
        "expert_consults": float(data.get("expert_consults", baseline_hospital.get("expert_consults", 85.0))),
        "public_transparency": float(data.get("public_transparency", baseline_hospital.get("public_transparency", 92.0))),
        "hcahps_score": float(data.get("hcahps_score", baseline_hospital.get("hcahps_score", 75.0)))
    }

    try:
        # 1. Execute Random Forest + Linear Regression predictions from ml_models.py
        raw_predictions = predict_all_submetrics(input_state)

        # 2. Reconcile unit mismatch: convert mortality_survival_index (~75-100%, higher=better)
        # into calculated_smr (0.5-1.5 ratio, lower=better) via linear transformation
        surv_index = raw_predictions.get("mortality_survival_index", 90.0)
        derived_smr = max(0.5, min(1.5, round(1.0 + (90.0 - surv_index) / 20.0, 3)))
        raw_predictions["calculated_smr"] = derived_smr

        # 3. Normalize predicted metric values into 0-100 scores using engine.py METRIC_LIMITS
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

        # Also normalize mortality_survival_index directly on 75-100 scale for explicit visibility
        if "mortality_survival_index" in raw_predictions:
            val = raw_predictions["mortality_survival_index"]
            predicted_scores["mortality_survival_index"] = float(max(0.0, min(100.0, ((val - 75.0) / (100.0 - 75.0)) * 100)))

        notes = (
            "ml_models.py is trained on synthetic/simulated hospital state data (100 Bay Area hospitals) "
            "using Random Forest and Linear Regression models. Predictions are illustrative. "
            "Reconciliation: mortality_survival_index (~75-100%, higher=better) was mapped to "
            "calculated_smr (0.5-1.5 ratio, lower=better) via formula `1.0 + (90.0 - survival_index)/20.0` "
            "to enable scoring against engine.py METRIC_LIMITS."
        )

        return jsonify({
            "predicted_raw": raw_predictions,
            "predicted_scores": predicted_scores,
            "notes": notes
        }), 200

    except Exception as e:
        return jsonify({"error": f"ML prediction execution failed: {str(e)}"}), 500


@app.route("/api/hospitals/compare", methods=["GET"])
def compare():
    """
    GET /api/hospitals/compare?dept=Cancer
    Returns mock hospital comparison data for the given department.
    """
    dept = request.args.get("dept", "Cancer")
    dept_data = HOSPITAL_DATA.get(dept, HOSPITAL_DATA.get("Cancer"))
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

