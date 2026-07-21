# server.py
# Flask backend for the Operations Assistant chatbot.
# Runs on port 5000 alongside the Vite dev server on port 3000.

from flask import Flask, request, jsonify
from flask_cors import CORS
from middleware import SecureHospitalChatbotMiddleware
from engine import evaluate_hospital

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


@app.route("/api/health", methods=["GET"])
def health():
    """Simple liveness check."""
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(port=5000, debug=True)
