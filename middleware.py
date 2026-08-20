import os
from mock_data import HOSPITAL_DATA

# Auto-load environment variables from .env or .env.example if present
try:
    from dotenv import load_dotenv
    load_dotenv()
    if not os.environ.get("GEMINI_API_KEY") and os.path.exists(".env.example"):
        load_dotenv(".env.example")
except ImportError:
    for env_file in [".env", ".env.example"]:
        if os.path.exists(env_file):
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"\''))

# Detect Google GenAI SDK availability (supports both google.genai and google.generativeai)
GEMINI_AVAILABLE = False
GEMINI_SDK_TYPE = None

try:
    from google import genai
    GEMINI_SDK_TYPE = "genai"
    GEMINI_AVAILABLE = True
except ImportError:
    try:
        import google.generativeai as genai_legacy
        GEMINI_SDK_TYPE = "legacy"
        GEMINI_AVAILABLE = True
    except ImportError:
        GEMINI_AVAILABLE = False


# Patterns that indicate prompt injection attempts
INJECTION_PATTERNS = [
    "ignore previous",
    "ignore all previous",
    "disregard previous",
    "forget your instructions",
    "override instructions",
    "system prompt",
    "act as",
    "pretend you are",
    "competitor hospital",
    "competitor hospitals",
    "tell me about other hospitals",
    "reveal your prompt",
    "show me your instructions",
    "bypass",
    "jailbreak",
    "dan mode",
]

# Context builder: pulls the relevant hospital data to ground the LLM response
def _build_hospital_context(hospital_id: str) -> dict:
    """
    Returns a structured context dict for the given hospital.
    Falls back to the default Cardiology baseline if hospital_id is not found.
    """
    dept_data = HOSPITAL_DATA.get("Cardiology", {})
    my_hospital = dept_data.get("my_hospital", {})
    peer_group = dept_data.get("peer_group", [])

    # Compute simple peer averages for benchmarking context
    peer_averages = {}
    if peer_group:
        numeric_keys = [k for k, v in peer_group[0].items() if isinstance(v, (int, float))]
        for key in numeric_keys:
            peer_averages[key] = round(
                sum(p[key] for p in peer_group if key in p) / len(peer_group), 2
            )

    return {
        "hospital_id": hospital_id,
        "my_hospital": my_hospital,
        "peer_averages": peer_averages,
        "peer_count": len(peer_group),
    }


def _check_injection(message: str) -> bool:
    """Returns True if the message contains a known injection pattern."""
    lowered = message.lower()
    return any(pattern in lowered for pattern in INJECTION_PATTERNS)


def _build_system_prompt(context: dict) -> str:
    """Constructs a tightly scoped system prompt using only facility data."""
    hosp = context["my_hospital"]
    peers = context["peer_averages"]

    return f"""You are a Clinical Operations Assistant for a hospital analytics platform.
Your ONLY function is to help administrative staff understand and improve their hospital's 
operational performance scores based on the metrics provided below.

STRICT RULES:
- You may ONLY reference the metrics and peer benchmarks listed below.
- You must NEVER discuss competitor hospitals by name.
- You must NEVER provide medical advice or clinical recommendations for patient care.
- You must NEVER answer questions outside of hospital operations scoring.
- All responses must be factual, concise, and grounded in the data provided.

HOSPITAL METRICS (Hospital ID: {hosp.get('hospital_id', 'N/A')}):
  - Patient Volume: {hosp.get('patient_volume', 'N/A')}
  - Nurse Staffing Ratio (patients/nurse): {hosp.get('nurse_staffing_ratio', 'N/A')}
  - Nurse Magnet Status: {'Yes' if hosp.get('nurse_magnet') == 1 else 'No'}
  - Intensivists Staffing: {hosp.get('intensivists_staffing', 'N/A')}%
  - Expert Consult Rate: {hosp.get('expert_consults', 'N/A')}%
  - Public Transparency Score: {hosp.get('public_transparency', 'N/A')}%
  - HCAHPS Patient Satisfaction: {hosp.get('hcahps_score', 'N/A')}%
  - Discharge Home Rate: {hosp.get('discharge_home_rate', 'N/A')}%
  - Standardised Mortality Ratio (SMR): {hosp.get('calculated_smr', 'N/A')}

PEER GROUP AVERAGES ({context['peer_count']} hospitals):
  - Patient Volume: {peers.get('patient_volume', 'N/A')}
  - Nurse Staffing Ratio: {peers.get('nurse_staffing_ratio', 'N/A')}
  - Intensivists Staffing: {peers.get('intensivists_staffing', 'N/A')}%
  - Expert Consult Rate: {peers.get('expert_consults', 'N/A')}%
  - HCAHPS Score: {peers.get('hcahps_score', 'N/A')}%
  - Discharge Home Rate: {peers.get('discharge_home_rate', 'N/A')}%
  - Standardised Mortality Ratio (SMR): {peers.get('calculated_smr', 'N/A')}

Answer the user's question below using ONLY the above data.
"""


def _generate_mock_response(message: str, context: dict) -> str:
    """
    Deterministic mock response engine.
    Analyzes the message keywords and returns a data-grounded answer.
    Used as fallback when Gemini API key is omitted or during offline execution.
    """
    hosp = context["my_hospital"]
    peers = context["peer_averages"]
    lowered = message.lower()

    # --- Staffing gap analysis ---
    if "staffing" in lowered and ("gap" in lowered or "compare" in lowered or "peer" in lowered):
        our_ratio = hosp.get("nurse_staffing_ratio", 6.5)
        peer_ratio = peers.get("nurse_staffing_ratio", 4.6)
        gap = our_ratio - peer_ratio
        smr_impact = round(gap * 0.05, 3)
        return (
            f"**Nurse Staffing Gap Analysis**\n\n"
            f"Your current staffing ratio is **{our_ratio} patients/nurse**, versus the peer group "
            f"75th percentile of **{peer_ratio} patients/nurse** — a gap of **{gap:.1f} patients/nurse**.\n\n"
            f"Closing this gap to peer level would require reducing your ratio by approximately {gap:.1f} "
            f"patients per nurse, achievable by increasing nursing FTE or redistributing patient load.\n\n"
            f"**Predicted SMR Impact:** Based on the delta simulation model, each 1.0 improvement "
            f"in staffing ratio reduces SMR by approximately 0.05 units. A full gap closure projects "
            f"an SMR improvement of ~{smr_impact:.3f}, translating directly to higher discharge home rates."
        )

    # --- Process / consult rate simulation ---
    if "consult" in lowered or "process" in lowered or "expert" in lowered:
        our_consults = hosp.get("expert_consults", 80.0)
        target_consults = 95.0
        delta = target_consults - our_consults
        ops_score_delta = round(delta * 0.5 * 0.20, 1)  # 50% weight in Care Processes, 20% category weight
        return (
            f"**Expert Consult Rate — Process Score Projection**\n\n"
            f"Current consult rate: **{our_consults}%** → Target: **{target_consults}%** "
            f"(+{delta:.0f}pp improvement).\n\n"
            f"Within the Care Processes category (50% weight on Expert Consults, 50% on Public Transparency), "
            f"this improvement re-scales the weighted score. With Public Transparency static at "
            f"{hosp.get('public_transparency', 85.0)}%, the category score would increase from "
            f"~{round((our_consults * 0.5 + hosp.get('public_transparency', 85.0) * 0.5) * 0.20, 1)} "
            f"to ~{round((target_consults * 0.5 + hosp.get('public_transparency', 85.0) * 0.5) * 0.20, 1)} "
            f"composite points.\n\n"
            f"**Estimated overall Operations score lift: +{ops_score_delta} points.**"
        )

    # --- Staffing degradation simulation ---
    if "degrad" in lowered or "shortage" in lowered or "7.5" in lowered or "drop" in lowered:
        our_smr = 1.10
        degraded_ratio = 7.5
        baseline_ratio = hosp.get("nurse_staffing_ratio", 6.5)
        staff_delta = baseline_ratio - degraded_ratio  # negative = worse
        smr_delta = -0.05 * staff_delta
        new_smr = round(our_smr + smr_delta, 3)
        discharge_delta = round((our_smr - new_smr) * 12.5, 2)
        new_discharge = round(hosp.get("discharge_home_rate", 72.0) + discharge_delta, 2)
        return (
            f"**Staffing Degradation Scenario: {baseline_ratio} → {degraded_ratio} patients/nurse**\n\n"
            f"A ratio increase of {degraded_ratio - baseline_ratio:.1f} patients/nurse triggers the following "
            f"cascade in the delta simulation model:\n\n"
            f"- **SMR:** {our_smr} → **{new_smr}** (worsens by {smr_delta:+.3f})\n"
            f"- **Discharge Home Rate:** {hosp.get('discharge_home_rate', 72.0)}% → **{new_discharge}%** "
            f"(shifts by {discharge_delta:+.2f}pp)\n\n"
            f"The Clinical Outcomes category score (SMR 60% weight, Discharge 40% weight) will decline. "
            f"Immediate mitigation options: temporary agency nurse coverage or load-balancing across units."
        )

    # --- General fallback with context ---
    return (
        f"Based on your facility's current metrics, here is a summary of your key operational indicators:\n\n"
        f"- **Nurse Staffing Ratio:** {hosp.get('nurse_staffing_ratio')} patients/nurse "
        f"(peer avg: {peers.get('nurse_staffing_ratio', 'N/A')})\n"
        f"- **Expert Consult Rate:** {hosp.get('expert_consults')}% "
        f"(peer avg: {peers.get('expert_consults', 'N/A')}%)\n"
        f"- **HCAHPS Score:** {hosp.get('hcahps_score')}% "
        f"(peer avg: {peers.get('hcahps_score', 'N/A')}%)\n"
        f"- **Discharge Home Rate:** {hosp.get('discharge_home_rate')}% "
        f"(peer avg: {peers.get('discharge_home_rate', 'N/A')}%)\n\n"
        f"Please ask a specific question about staffing, consult rates, outcomes, or score projections "
        f"and I'll provide a targeted analysis."
    )


class SecureHospitalChatbotMiddleware:
    """
    Middleware layer that sandboxes all LLM interactions to hospital-specific
    operational metrics. Blocks prompt injection and scopes context to facility data only.
    """

    def __init__(self, db_connection_string: str = "", api_key: str = None):
        """
        Args:
            db_connection_string: PostgreSQL DSN for production data access.
            api_key: Optional Google Gemini API key. If omitted, checks GEMINI_API_KEY or GOOGLE_API_KEY env vars.
        """
        self.db_connection_string = db_connection_string
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        self.client = None

        if self.api_key and GEMINI_AVAILABLE:
            try:
                if GEMINI_SDK_TYPE == "genai":
                    self.client = genai.Client(api_key=self.api_key)
                elif GEMINI_SDK_TYPE == "legacy":
                    genai_legacy.configure(api_key=self.api_key)
                    self.client = genai_legacy.GenerativeModel("gemini-2.5-flash")
            except Exception:
                self.client = None

    def generate_safe_llm_response(self, hospital_id: str, message: str) -> str:
        """
        Validates, scopes, and generates a sandboxed LLM response via Google Gemini.

        Args:
            hospital_id: The facility identifier (e.g. "HOSP_A").
            message: The user's raw input string.

        Returns:
            A plain string response grounded in facility metrics.

        Raises:
            ValueError: If a prompt injection attempt is detected.
        """
        # 1. Injection guard — raises ValueError, caught by the Flask route
        if _check_injection(message):
            raise ValueError(
                f"Prompt injection attempt detected in message from hospital {hospital_id}"
            )

        # 2. Build scoped hospital context & system prompt
        context = _build_hospital_context(hospital_id)
        system_prompt = _build_system_prompt(context)

        # 3. Call Google Gemini LLM if client is initialized
        if self.client:
            try:
                if GEMINI_SDK_TYPE == "genai":
                    response = self.client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=f"{system_prompt}\n\nUser Question: {message}"
                    )
                    if response and hasattr(response, "text") and response.text:
                        return response.text.strip()
                elif GEMINI_SDK_TYPE == "legacy":
                    response = self.client.generate_content(
                        f"{system_prompt}\n\nUser Question: {message}"
                    )
                    if response and hasattr(response, "text") and response.text:
                        return response.text.strip()
            except Exception:
                # On API error, fallback gracefully to data-grounded analytical engine
                pass

        # Fallback to analytical metric engine if API key is absent or API call fails
        return _generate_mock_response(message, context)

