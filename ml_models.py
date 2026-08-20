# ml_models.py
"""
ML models for hospital metric prediction.

Training data comes from synthetic_augmentor.SYNTHETIC_TRAINING_DATA (60
per-department synthetic hospitals with realistic joint covariance).
Models and OOD Guards are trained per department.

CANONICAL KEYS:
  calculated_smr          – mortality index (lower = better)
  intensivists_staffing   – ICU specialist staffing level
"""
from __future__ import annotations

from typing import Dict, Any
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

from synthetic_augmentor import SYNTHETIC_TRAINING_DATA, AUGMENTOR_LOAD_ERROR
from ood_guard import (
    OodGuard,
    fit_ood_guard,
    assess_ood_confidence,
    nearest_neighbor_fallback,
)

if AUGMENTOR_LOAD_ERROR:
    raise ImportError(
        f"ml_models.py cannot train: synthetic_augmentor.py failed to load — "
        f"{AUGMENTOR_LOAD_ERROR}"
    )

# ---------------------------------------------------------------------------
# Train per-department model suites and OOD Guards
# ---------------------------------------------------------------------------

DEPARTMENT_MODELS: Dict[str, Dict[str, Any]] = {}
DEPARTMENT_OOD_GUARDS: Dict[str, OodGuard] = {}

np.random.seed(42)

for dept_id, df in SYNTHETIC_TRAINING_DATA.items():
    volumes = df["patient_volume"].values
    nurse_ratios = df["nurse_staffing_ratio"].values
    intensivists = df["intensivists_staffing"].values
    smr = df["calculated_smr"].values
    discharge = df["discharge_home_rate"].values
    tech = df["advanced_tech_adoption"].values
    services = df["patient_services_diversity"].values
    consults = df["expert_consults"].values
    hcahps = df["hcahps_score"].values

    X_outcomes = np.column_stack((volumes, nurse_ratios, intensivists))
    X_structure = np.column_stack((volumes, intensivists))

    # Fit RF models
    model_smr = RandomForestRegressor(n_estimators=100, random_state=42)
    model_smr.fit(X_outcomes, smr)

    model_discharge = RandomForestRegressor(n_estimators=100, random_state=42)
    model_discharge.fit(X_outcomes, discharge)

    model_tech_adoption = RandomForestRegressor(n_estimators=100, random_state=42)
    model_tech_adoption.fit(X_structure, tech)

    model_services_diversity = RandomForestRegressor(n_estimators=100, random_state=42)
    model_services_diversity.fit(X_structure, services)

    # Fit Linear models
    model_staffing_ratio = LinearRegression()
    model_staffing_ratio.fit(volumes.reshape(-1, 1), nurse_ratios)

    model_expert_consults = LinearRegression()
    model_expert_consults.fit(volumes.reshape(-1, 1), consults)

    model_hcahps = LinearRegression()
    model_hcahps.fit(nurse_ratios.reshape(-1, 1), hcahps)

    # Fit OOD Guard
    ood_guard = fit_ood_guard(
        X_train=X_outcomes,
        feature_keys=["patient_volume", "nurse_staffing_ratio", "intensivists_staffing"],
        rf_model=model_smr,
    )

    dept_key = dept_id.lower()
    DEPARTMENT_MODELS[dept_key] = {
        "model_smr": model_smr,
        "model_discharge": model_discharge,
        "model_tech_adoption": model_tech_adoption,
        "model_services_diversity": model_services_diversity,
        "model_staffing_ratio": model_staffing_ratio,
        "model_expert_consults": model_expert_consults,
        "model_hcahps": model_hcahps,
        "y_smr": smr,
        "y_discharge": discharge,
        "X_outcomes": X_outcomes,
        "X_structure": X_structure,
        "volumes": volumes,
        "nurse_ratios": nurse_ratios,
        "consults": consults,
        "hcahps": hcahps,
    }
    DEPARTMENT_OOD_GUARDS[dept_key] = ood_guard


# ---------------------------------------------------------------------------
# Master prediction interface
# ---------------------------------------------------------------------------

def predict_all_submetrics(current_state: dict, department_id: str = "cardiology") -> dict:
    """Run the hospital's current state through the department's trained ML suite."""
    dept_key = str(department_id).lower()
    if dept_key not in DEPARTMENT_MODELS:
        dept_key = "cardiology" if "cardiology" in DEPARTMENT_MODELS else next(iter(DEPARTMENT_MODELS.keys()))

    models = DEPARTMENT_MODELS[dept_key]
    guard = DEPARTMENT_OOD_GUARDS[dept_key]

    vol = float(current_state["patient_volume"])
    intensivists = float(current_state["intensivists_staffing"])
    nurse_magnet = int(current_state.get("nurse_magnet", 0))

    # 1. Linear models — immediate structural dependencies
    predicted_ratio = float(models["model_staffing_ratio"].predict([[vol]])[0])
    predicted_consults = float(models["model_expert_consults"].predict([[vol]])[0])

    # 2. HCAHPS driven by staffing ratio
    predicted_hcahps = float(models["model_hcahps"].predict([[predicted_ratio]])[0])

    # 3. Structure models
    X_struct = np.array([[vol, intensivists]])
    predicted_tech = float(models["model_tech_adoption"].predict(X_struct)[0])
    predicted_services = float(models["model_services_diversity"].predict(X_struct)[0])

    # 4. OOD assessment on full outcome feature vector
    X_outcome_query = np.array([[vol, predicted_ratio, intensivists]])
    ood_result = assess_ood_confidence(guard, models["X_outcomes"], X_outcome_query)

    # 5. Outcome models — or nearest-neighbour fallback if out_of_range
    if ood_result["level"] == "out_of_range":
        predicted_smr = nearest_neighbor_fallback(guard, models["y_smr"], X_outcome_query)
        predicted_discharge = nearest_neighbor_fallback(guard, models["y_discharge"], X_outcome_query)
    else:
        predicted_smr = float(models["model_smr"].predict(X_outcome_query)[0])
        predicted_discharge = float(models["model_discharge"].predict(X_outcome_query)[0])

    # 6. Nurse Magnet bonus
    if nurse_magnet == 1:
        predicted_hcahps += 3.0
        predicted_discharge += 2.0

    return {
        "calculated_smr": round(max(0.4, predicted_smr), 3),
        "discharge_home_rate": round(min(99.0, max(40.0, predicted_discharge)), 1),
        "patient_volume": vol,
        "advanced_tech_adoption": round(min(100.0, max(0.0, predicted_tech)), 1),
        "nurse_staffing_ratio": round(max(0.5, predicted_ratio), 2),
        "nurse_magnet": nurse_magnet,
        "intensivists_staffing": intensivists,
        "patient_services_diversity": round(min(100.0, max(0.0, predicted_services)), 1),
        "trauma_center": current_state.get("trauma_center", 0),
        "expert_consults": round(min(100.0, max(0.0, predicted_consults)), 1),
        "public_transparency": float(current_state.get("public_transparency", 82.0)),
        "hcahps_score": round(min(100.0, max(0.0, predicted_hcahps)), 1),
        "ood_assessment": ood_result,
    }


def evaluate_models(department_id: str = "cardiology", test_size: float = 0.25, random_state: int = 42) -> dict:
    """Train/test split and report R² for each ML model in a department."""
    dept_key = str(department_id).lower()
    if dept_key not in DEPARTMENT_MODELS:
        dept_key = next(iter(DEPARTMENT_MODELS.keys()))

    df = SYNTHETIC_TRAINING_DATA[dept_key]
    volumes = df["patient_volume"].values
    nurse_ratios = df["nurse_staffing_ratio"].values
    intensivists = df["intensivists_staffing"].values
    smr = df["calculated_smr"].values
    discharge = df["discharge_home_rate"].values
    tech = df["advanced_tech_adoption"].values
    services = df["patient_services_diversity"].values
    consults = df["expert_consults"].values
    hcahps = df["hcahps_score"].values

    X_outcomes = np.column_stack((volumes, nurse_ratios, intensivists))
    X_structure = np.column_stack((volumes, intensivists))

    results: list[tuple[str, float]] = []

    def _eval_rf(X: np.ndarray, y: np.ndarray, name: str) -> None:
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        m = RandomForestRegressor(n_estimators=100, random_state=random_state)
        m.fit(X_tr, y_tr)
        results.append((name, r2_score(y_te, m.predict(X_te))))

    def _eval_lr(X: np.ndarray, y: np.ndarray, name: str) -> None:
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        m = LinearRegression()
        m.fit(X_tr, y_tr)
        results.append((name, r2_score(y_te, m.predict(X_te))))

    _eval_rf(X_outcomes, smr, "calculated_smr")
    _eval_rf(X_outcomes, discharge, "discharge_home_rate")
    _eval_rf(X_structure, tech, "advanced_tech_adoption")
    _eval_rf(X_structure, services, "patient_services_diversity")
    _eval_lr(volumes.reshape(-1, 1), nurse_ratios, "nurse_staffing_ratio")
    _eval_lr(volumes.reshape(-1, 1), consults, "expert_consults")
    _eval_lr(nurse_ratios.reshape(-1, 1), hcahps, "hcahps_score")

    print(f"Model evaluation results for department '{dept_key}' (R² on test split):")
    for name, score in results:
        print(f"  - {name}: {score:.3f}")

    return dict(results)


if __name__ == "__main__":
    evaluate_models()
