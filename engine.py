# engine.py
from mock_data import HOSPITAL_DATA
from ml_models import predict_all_submetrics

def get_peer_bounds(peer_data, metric_key):
    values = [hospital[metric_key] for hospital in peer_data]
    return min(values), max(values)

def calculate_min_max_score(value, min_val, max_val, higher_is_better=True):
    if max_val == min_val:
        return 100.0 if value >= max_val else 50.0
    score = ((value - min_val) / (max_val - min_val)) * 100 if higher_is_better else ((max_val - value) / (max_val - min_val)) * 100
    return max(0.0, min(100.0, score))

def evaluate_hospital_ml(department="Cardiology", volume_override=None):
    dept_data = HOSPITAL_DATA[department]
    peers = dept_data["peer_group"]
    target = dict(dept_data["my_hospital"]) # Deep copy to preserve baseline
    
    # If the user is interacting with the frontend slider, override baseline volume
    if volume_override:
        target["patient_volume"] = volume_override
        
    # Run the raw metrics through the Random Forest / Linear Suite to generate ML insights
    ml_adjusted_metrics = predict_all_submetrics(target)
    
    # Gather peer boundaries dynamically
    vol_min, vol_max = get_peer_bounds(peers, "patient_volume")
    mort_min, mort_max = get_peer_bounds(peers, "mortality_survival_index")
    disc_min, disc_max = get_peer_bounds(peers, "discharge_home_rate")
    nurse_min, nurse_max = get_peer_bounds(peers, "nurse_staffing_ratio")
    int_min, int_max = get_peer_bounds(peers, "intensivists_staffing")
    exp_min, exp_max = get_peer_bounds(peers, "expert_consults")
    trans_min, trans_max = get_peer_bounds(peers, "public_transparency")
    hca_min, hca_max = get_peer_bounds(peers, "hcahps_score")

    # Normalize values using the directional Min-Max bounds
    normalized = {
        "volume": calculate_min_max_score(ml_adjusted_metrics["patient_volume"], vol_min, vol_max),
        "mortality": calculate_min_max_score(ml_adjusted_metrics["mortality_survival_index"], mort_min, mort_max),
        "discharge": calculate_min_max_score(ml_adjusted_metrics["discharge_home_rate"], disc_min, disc_max),
        "nurse_staffing": calculate_min_max_score(ml_adjusted_metrics["nurse_staffing_ratio"], nurse_min, nurse_max, higher_is_better=False),
        "nurse_magnet": 100.0 if ml_adjusted_metrics["nurse_magnet"] == 1 else 0.0,
        "intensivists": calculate_min_max_score(ml_adjusted_metrics["intensivists_staffing"], int_min, int_max),
        "expert_consults": calculate_min_max_score(ml_adjusted_metrics["expert_consults"], exp_min, exp_max),
        "public_transparency": calculate_min_max_score(ml_adjusted_metrics["public_transparency"], trans_min, trans_max),
        "hcahps": calculate_min_max_score(ml_adjusted_metrics["hcahps_score"], hca_min, hca_max)
    }

    # Compile Domain Scores (using ML weights derived from relative importance)
    outcome_card = (normalized["mortality"] * 0.60) + (normalized["discharge"] * 0.40)
    structure_card = (normalized["volume"] * 0.15) + (normalized["nurse_staffing"] * 0.45) + (normalized["nurse_magnet"] * 0.20) + (normalized["intensivists"] * 0.20)
    process_card = (normalized["expert_consults"] * 0.50) + (normalized["public_transparency"] * 0.50)
    patient_card = normalized["hcahps"]

    # Overall Combined Composite
    composite_score = (outcome_card * 0.35) + (structure_card * 0.25) + (process_card * 0.20) + (patient_card * 0.20)

    return {
        "composite": round(composite_score, 1),
        "categories": {
            "Outcome": round(outcome_card, 1),
            "Structure": round(structure_card, 1),
            "Process": round(process_card, 1),
            "Patient_Experience": round(patient_card, 1)
        },
        "individual_metrics_calculated": ml_adjusted_metrics
    }

if __name__ == "__main__":
    print("🚀 RUNNING FULL MULTI-MODEL ML SIMULATION 🚀\n")
    print("--- BASELINE (Volume = 600) ---")
    base = evaluate_hospital_ml("Cardiology")
    print(f"Overall Composite: {base['composite']}/100 | Outcomes: {base['categories']['Outcome']}")
    print(f"Calculated Nurse Patient Ratio: {base['individual_metrics_calculated']['nurse_staffing_ratio']}\n")
    
    print("--- SIMULATED SLIDER EFFECT (Volume dragged up to 1400) ---")
    simulated = evaluate_hospital_ml("Cardiology", volume_override=1400)
    print(f"New Overall Composite: {simulated['composite']}/100 | Outcomes: {simulated['categories']['Outcome']}")
    print(f"Calculated Nurse Patient Ratio: {simulated['individual_metrics_calculated']['nurse_staffing_ratio']}")
    print(f"Calculated Patient HCAHPS Score: {simulated['individual_metrics_calculated']['hcahps_score']}")