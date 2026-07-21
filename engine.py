
# Baseline constraints and scaling limits
# Checked with clinical team: protects against extreme outlier data throwing off total scores.
METRIC_LIMITS = {
    "patient_volume": {"min": 500.0, "max": 3000.0, "higher_is_better": True},
    "calculated_smr": {"min": 0.5, "max": 1.5, "higher_is_better": False}, 
    "discharge_home_rate": {"min": 50.0, "max": 95.0, "higher_is_better": True},
    "nurse_staffing_ratio": {"min": 2.0, "max": 10.0, "higher_is_better": False},
    "intensivists_staffing": {"min": 0.0, "max": 100.0, "higher_is_better": True},
    "expert_consults": {"min": 50.0, "max": 100.0, "higher_is_better": True},
    "public_transparency": {"min": 0.0, "max": 100.0, "higher_is_better": True},
    "hcahps_score": {"min": 60.0, "max": 100.0, "higher_is_better": True}
}

def normalize_metric(val, min_val, max_val, higher_is_better=True):
    """Maps raw metrics to a clean 0-100 percentage."""
    if max_val == min_val:
        return 50.0
    
    if higher_is_better:
        score = ((val - min_val) / (max_val - min_val)) * 100
    else:
        # Invert: lower raw values (e.g., lower SMR or fewer patients/nurse) mean a better score
        score = ((max_val - val) / (max_val - min_val)) * 100
        
    return float(max(0.0, min(100.0, score)))


def apply_delta_simulation(target, baseline):
    """
    Predicts relative changes (deltas) instead of absolute raw outcomes.
    This prevents the ML model's baseline inaccuracies from corrupting the real data.
    """
    # Calculate staffing delta (fewer patients per nurse = positive staff_change = improvement)
    staff_change = baseline["nurse_staffing_ratio"] - target["nurse_staffing_ratio"]
    
    # Staffing improvements drive down SMR. Cap delta at ±0.15 to prevent unrealistic leaps.
    smr_delta = max(-0.15, min(0.15, -0.05 * staff_change))
    simulated_smr = max(0.4, min(1.8, baseline["calculated_smr"] + smr_delta))
    
    # Competing outcome flow: lives saved directly increase discharges home
    smr_improvement = baseline["calculated_smr"] - simulated_smr
    discharge_delta = smr_improvement * 12.5 
    
    simulated_discharge = max(40.0, min(99.0, baseline["discharge_home_rate"] + discharge_delta))
    
    return {
        "calculated_smr": round(simulated_smr, 3),
        "discharge_home_rate": round(simulated_discharge, 2)
    }


def calculate_category_score(metrics_dict, weights_dict):
    """
    Safely calculates a category score even if some metrics (like expert certificates) 
    are missing (None). It dynamically scales the remaining weights to sum to 100%.
    """
    active_scores = {}
    active_weights = {}
    
    # 1. Filter out missing metrics
    for key, weight in weights_dict.items():
        val = metrics_dict.get(key)
        if val is not None:  # The hospital actually has this metric/certificate
            active_scores[key] = val
            active_weights[key] = weight
            
    # If a hospital has absolutely no metrics in this category, return a safe fallback
    if not active_weights:
        return 50.0 
        
    # 2. Re-normalize the weights to equal 1.0 (100%)
    total_active_weight = sum(active_weights.values())
    normalized_weights = {k: w / total_active_weight for k, w in active_weights.items()}
    
    # 3. Calculate the final weighted score
    final_score = sum(active_scores[k] * normalized_weights[k] for k in active_scores)
    return final_score


def evaluate_hospital(target_overrides=None):
    # Historical department baseline (Cardiology example)
    # Expected deaths baseline is baked into SMR, shielding the score from patient-complexity gaming.
    baseline = {
        "patient_volume": 1200,
        "calculated_smr": 1.10,
        "discharge_home_rate": 72.0,
        "nurse_staffing_ratio": 6.5,
        "intensivists_staffing": 70.0,
        "expert_consults": 80.0,
        "public_transparency": 85.0,
        "hcahps_score": 75.0
    }
    
    target = baseline.copy()
    if target_overrides:
        target.update(target_overrides)
        
    # Get changes using the Delta approach
    simulated_outcomes = apply_delta_simulation(target, baseline)
    
    current_metrics = {
        "patient_volume": target["patient_volume"],
        "calculated_smr": simulated_outcomes["calculated_smr"],
        "discharge_home_rate": simulated_outcomes["discharge_home_rate"],
        "nurse_staffing_ratio": target["nurse_staffing_ratio"],
        "intensivists_staffing": target["intensivists_staffing"],
        "expert_consults": target["expert_consults"],
        "public_transparency": target["public_transparency"],
        "hcahps_score": target["hcahps_score"]
    }
    
    # Calculate individual scores
    scores = {}
    for key, val in current_metrics.items():
        limits = METRIC_LIMITS[key]
        scores[key] = normalize_metric(
            val=val,
            min_val=limits["min"],
            max_val=limits["max"],
            higher_is_better=limits["higher_is_better"]
        )
            
    # Category Card Grouping (isolates shocks to prevent dashboard-wide crashes)
    clinical_outcomes = calculate_category_score(scores, {
        "calculated_smr": 0.60,
        "discharge_home_rate": 0.40
    })
    
    op_structure = calculate_category_score(scores, {
        "patient_volume": 0.20,
        "nurse_staffing_ratio": 0.50,
        "intensivists_staffing": 0.30
    })
    
    care_processes = calculate_category_score(scores, {
        "expert_consults": 0.50,
        "public_transparency": 0.50
    })
    
    patient_experience = calculate_category_score(scores, {
        "hcahps_score": 1.00
    })
    
    # Aggregate Master Score
    final_composite = (
        (clinical_outcomes * 0.35) + 
        (op_structure * 0.25) + 
        (care_processes * 0.20) + 
        (patient_experience * 0.20)
    )
    
    return {
        "overall_composite": round(final_composite, 1),
        "category_cards": {
            "Clinical_Outcomes": round(clinical_outcomes, 1),
            "Operational_Structure": round(op_structure, 1),
            "Care_Processes": round(care_processes, 1),
            "Patient_Experience": round(patient_experience, 1)
        },
        "individual_percentages": {k: round(v, 1) for k, v in scores.items()},
        "raw_metrics": current_metrics
    }