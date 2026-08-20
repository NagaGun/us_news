# engine.py
"""
Scoring and normalisation engine.

METRIC_LIMITS and scoring weights are sourced from synthetic_augmentor.py so
they stay in sync with the Excel definition file. A small fallback dict is
retained for the case where the augmentor fails to load (e.g. Excel missing).

FLAT COMPOSITE SCORING
  Uses BACKEND_METRIC_WEIGHTS (weights already sum to ~1.0 across all 12
  metrics). The old nested category-weight math is removed.

STATIC METRICS
  trauma_center and public_transparency are pass-through inputs — not
  simulated by apply_delta_simulation.
"""
from __future__ import annotations

from typing import Optional

# ---------------------------------------------------------------------------
# Import from synthetic_augmentor (with graceful fallback)
# ---------------------------------------------------------------------------

try:
    from synthetic_augmentor import (
        BACKEND_METRIC_LIMITS,
        BACKEND_METRIC_WEIGHTS,
        AUGMENTOR_LOAD_ERROR,
        SYNTHETIC_HOSPITAL_DATA,
    )
    _AUGMENTOR_OK = AUGMENTOR_LOAD_ERROR is None
except Exception as _exc:  # noqa: BLE001
    _AUGMENTOR_OK = False
    BACKEND_METRIC_LIMITS = {}
    BACKEND_METRIC_WEIGHTS = {}
    SYNTHETIC_HOSPITAL_DATA = {}

# ---------------------------------------------------------------------------
# Which canonical keys are "lower is better" (inverted normalisation)
# ---------------------------------------------------------------------------

HIGHER_IS_BETTER: dict[str, bool] = {
    "calculated_smr":           False,   # lower SMR = fewer deaths = better
    "discharge_home_rate":      True,
    "patient_volume":           True,
    "advanced_tech_adoption":   True,
    "nurse_staffing_ratio":     True,
    "nurse_magnet":             True,
    "intensivists_staffing":    True,
    "patient_services_diversity": True,
    "trauma_center":            True,
    "expert_consults":          True,
    "public_transparency":      True,
    "hcahps_score":             True,
}

# ---------------------------------------------------------------------------
# METRIC_LIMITS: built from augmentor if available, else hardcoded fallback
# ---------------------------------------------------------------------------

_FALLBACK_LIMITS: dict[str, dict] = {
    "calculated_smr":           {"min": 0.5,  "max": 1.5,   "higher_is_better": False},
    "discharge_home_rate":      {"min": 40.0, "max": 99.0,  "higher_is_better": True},
    "patient_volume":           {"min": 200.0,"max": 2000.0,"higher_is_better": True},
    "advanced_tech_adoption":   {"min": 0.0,  "max": 100.0, "higher_is_better": True},
    "nurse_staffing_ratio":     {"min": 0.5,  "max": 8.0,   "higher_is_better": True},
    "nurse_magnet":             {"min": 0.0,  "max": 1.0,   "higher_is_better": True},
    "intensivists_staffing":    {"min": 4.0,  "max": 24.0,  "higher_is_better": True},
    "patient_services_diversity":{"min": 50.0,"max": 100.0, "higher_is_better": True},
    "trauma_center":            {"min": 0.0,  "max": 1.0,   "higher_is_better": True},
    "expert_consults":          {"min": 65.0, "max": 100.0, "higher_is_better": True},
    "public_transparency":      {"min": 50.0, "max": 100.0, "higher_is_better": True},
    "hcahps_score":             {"min": 50.0, "max": 100.0, "higher_is_better": True},
}

if _AUGMENTOR_OK and BACKEND_METRIC_LIMITS:
    METRIC_LIMITS: dict[str, dict] = {
        k: {
            "min": float(v[0]),
            "max": float(v[1]),
            "higher_is_better": HIGHER_IS_BETTER.get(k, True),
        }
        for k, v in BACKEND_METRIC_LIMITS.items()
    }
else:
    METRIC_LIMITS = _FALLBACK_LIMITS


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def normalize_metric(
    val: float,
    min_val: float,
    max_val: float,
    higher_is_better: bool = True,
) -> float:
    """Map a raw metric value to a 0-100 score."""
    if max_val == min_val:
        return 50.0
    if higher_is_better:
        score = ((val - min_val) / (max_val - min_val)) * 100.0
    else:
        score = ((max_val - val) / (max_val - min_val)) * 100.0
    return float(max(0.0, min(100.0, score)))


def calculate_flat_composite(scores: dict[str, float]) -> float:
    """Flat weighted composite using BACKEND_METRIC_WEIGHTS.

    Weights (from the Excel, via synthetic_augmentor) already sum to ~1.0, so
    the result is naturally on a 0-100 scale.  trauma_center is excluded from
    the composite (it is a static structural input, not a scored KPI).
    """
    if not _AUGMENTOR_OK or not BACKEND_METRIC_WEIGHTS:
        # Fallback: equal-weight average of available scores
        vals = [v for k, v in scores.items() if k != "trauma_center"]
        return float(sum(vals) / len(vals)) if vals else 0.0

    total = 0.0
    weight_sum = 0.0
    for key, info in BACKEND_METRIC_WEIGHTS.items():
        if key == "trauma_center":
            continue
        if key in scores:
            total += scores[key] * info["weight"]
            weight_sum += info["weight"]

    if weight_sum == 0.0:
        return 0.0
    # Renormalise in case some metrics were missing (weights sum to ~1.0, scores are already 0-100)
    return float(total / weight_sum)


# ---------------------------------------------------------------------------
# Delta simulation (used by /api/simulate — independent of ML prediction)
# ---------------------------------------------------------------------------

def apply_delta_simulation(
    target: dict,
    baseline: dict,
) -> dict:
    """Predict relative outcome changes from a staffing adjustment.

    Operates on delta rather than absolute values to keep the simulate
    endpoint honest about its limited scope (it only models staffing-driven
    outcome changes, not the full ML suite).
    """
    staff_change = (
        baseline["nurse_staffing_ratio"] - target["nurse_staffing_ratio"]
    )
    smr_delta = max(-0.15, min(0.15, -0.05 * staff_change))
    simulated_smr = max(0.4, min(1.8, baseline["calculated_smr"] + smr_delta))

    smr_improvement = baseline["calculated_smr"] - simulated_smr
    discharge_delta = smr_improvement * 12.5
    simulated_discharge = max(
        40.0, min(99.0, baseline["discharge_home_rate"] + discharge_delta)
    )

    return {
        "calculated_smr": round(simulated_smr, 3),
        "discharge_home_rate": round(simulated_discharge, 2),
    }


# ---------------------------------------------------------------------------
# evaluate_hospital — used by /api/simulate
# ---------------------------------------------------------------------------

def evaluate_hospital(target_overrides: Optional[dict] = None, department_id: str = "cardiology") -> dict:
    """Score a hospital state using the delta simulation + flat composite.

    baseline values are taken from the specified department's synthetic
    'my_hospital' row if the augmentor loaded; otherwise the hardcoded fallback
    is used.
    """
    dept_key = str(department_id).lower()
    if _AUGMENTOR_OK and dept_key in SYNTHETIC_HOSPITAL_DATA:
        _src = SYNTHETIC_HOSPITAL_DATA[dept_key]["my_hospital"]
    elif _AUGMENTOR_OK and "cardiology" in SYNTHETIC_HOSPITAL_DATA:
        _src = SYNTHETIC_HOSPITAL_DATA["cardiology"]["my_hospital"]
    else:
        _src = {}

    if _src:
        baseline = {
            "patient_volume":        float(_src.get("patient_volume", 1200)),
            "calculated_smr":        float(_src.get("calculated_smr", 1.10)),
            "discharge_home_rate":   float(_src.get("discharge_home_rate", 72.0)),
            "nurse_staffing_ratio":  float(_src.get("nurse_staffing_ratio", 3.5)),
            "intensivists_staffing": float(_src.get("intensivists_staffing", 18.0)),
            "expert_consults":       float(_src.get("expert_consults", 80.0)),
            "public_transparency":   float(_src.get("public_transparency", 85.0)),
            "hcahps_score":          float(_src.get("hcahps_score", 75.0)),
            "advanced_tech_adoption":float(_src.get("advanced_tech_adoption", 60.0)),
            "patient_services_diversity": float(_src.get("patient_services_diversity", 75.0)),
            "nurse_magnet":          float(_src.get("nurse_magnet", 0)),
            "trauma_center":         float(_src.get("trauma_center", 0)),
        }
    else:
        baseline = {
            "patient_volume": 1200,
            "calculated_smr": 1.10,
            "discharge_home_rate": 72.0,
            "nurse_staffing_ratio": 3.5,
            "intensivists_staffing": 18.0,
            "expert_consults": 80.0,
            "public_transparency": 85.0,
            "hcahps_score": 75.0,
            "advanced_tech_adoption": 60.0,
            "patient_services_diversity": 75.0,
            "nurse_magnet": 0.0,
            "trauma_center": 0.0,
        }

    target = baseline.copy()
    if target_overrides:
        target.update(target_overrides)

    simulated_outcomes = apply_delta_simulation(target, baseline)

    current_metrics = {**target, **simulated_outcomes}

    # Normalise each metric to 0-100
    scores: dict[str, float] = {}
    for key, val in current_metrics.items():
        if key in METRIC_LIMITS:
            lim = METRIC_LIMITS[key]
            scores[key] = normalize_metric(
                val=val,
                min_val=lim["min"],
                max_val=lim["max"],
                higher_is_better=lim["higher_is_better"],
            )

    composite = calculate_flat_composite(scores)

    # Component breakdown (grouped for the API response, not used for scoring)
    component_scores: dict[str, list[float]] = {}
    weight_source = BACKEND_METRIC_WEIGHTS if _AUGMENTOR_OK else {}
    for key, score in scores.items():
        if key == "trauma_center":
            continue
        comp = weight_source.get(key, {}).get("component", "Other")
        component_scores.setdefault(comp, []).append(score)

    component_averages = {
        comp: round(sum(vals) / len(vals), 1)
        for comp, vals in component_scores.items()
    }

    try:
        from ml_models import predict_all_submetrics
        ml_res = predict_all_submetrics(current_metrics, department_id=dept_key)
        ood_assessment = ml_res.get("ood_assessment")
    except Exception:
        ood_assessment = None

    return {
        "overall_composite": round(composite, 1),
        "component_averages": component_averages,
        "individual_percentages": {k: round(v, 1) for k, v in scores.items()},
        "raw_metrics": current_metrics,
        "ood_assessment": ood_assessment,
    }