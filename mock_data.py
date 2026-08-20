# mock_data.py
"""
Hospital comparison data.

Attempts to import SYNTHETIC_HOSPITAL_DATA from synthetic_augmentor.py
(which covers all 10 departments with data derived from Synthetic_Data.xlsx).
Falls back to the hardcoded baseline if the augmentor fails to load (e.g.
Excel file missing, dependency not installed).

The exported HOSPITAL_DATA keeps the same shape as before so server.py and
middleware.py need no structural changes:
  HOSPITAL_DATA[dept_id] = { "my_hospital": {...}, "peer_group": [...] }

Department keys match src/data.ts DEPARTMENTS ids exactly:
  cancer, cardiology, dige, endo, specialty, neuro, respi, ortho, urology, geriatrics

Note: mortality_survival_index has been removed. The canonical key is
calculated_smr everywhere (synthetic_augmentor.py, ml_models.py, engine.py).
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Attempt synthetic import
# ---------------------------------------------------------------------------

_synthetic_loaded = False
try:
    from synthetic_augmentor import SYNTHETIC_HOSPITAL_DATA, AUGMENTOR_LOAD_ERROR

    if not AUGMENTOR_LOAD_ERROR and SYNTHETIC_HOSPITAL_DATA:
        HOSPITAL_DATA = SYNTHETIC_HOSPITAL_DATA
        _synthetic_loaded = True
except Exception:  # noqa: BLE001
    pass

# ---------------------------------------------------------------------------
# Hardcoded fallback (two departments only — used when augmentor unavailable)
# ---------------------------------------------------------------------------

if not _synthetic_loaded:
    HOSPITAL_DATA = {
        "cancer": {
            "peer_group": [
                {
                    "hospital_id": "STAN-01",
                    "name": "Riverside Care Network",
                    "patient_volume": 790,
                    "calculated_smr": 0.88,
                    "discharge_home_rate": 80.5,
                    "nurse_staffing_ratio": 2.75,
                    "nurse_magnet": 1,
                    "intensivists_staffing": 18.0,
                    "expert_consults": 88.0,
                    "public_transparency": 92.0,
                    "hcahps_score": 76.0,
                    "advanced_tech_adoption": 80.0,
                    "patient_services_diversity": 82.0,
                    "trauma_center": 1,
                },
                {
                    "hospital_id": "UCSF-101",
                    "name": "UCSF Health Medical Center",
                    "patient_volume": 1100,
                    "calculated_smr": 0.82,
                    "discharge_home_rate": 85.0,
                    "nurse_staffing_ratio": 3.5,
                    "nurse_magnet": 1,
                    "intensivists_staffing": 24.0,
                    "expert_consults": 95.0,
                    "public_transparency": 98.0,
                    "hcahps_score": 85.0,
                    "advanced_tech_adoption": 95.0,
                    "patient_services_diversity": 90.0,
                    "trauma_center": 1,
                },
            ],
            "my_hospital": {
                "hospital_id": "DUMMY-99",
                "name": "Metropolitan Hospital",
                "patient_volume": 850,
                "calculated_smr": 0.95,
                "discharge_home_rate": 78.0,
                "nurse_staffing_ratio": 2.80,
                "nurse_magnet": 1,
                "intensivists_staffing": 16.0,
                "expert_consults": 89.0,
                "public_transparency": 94.0,
                "hcahps_score": 71.0,
                "advanced_tech_adoption": 75.0,
                "patient_services_diversity": 80.0,
                "trauma_center": 1,
            },
        },
        "cardiology": {
            "peer_group": [
                {
                    "hospital_id": "STAN-01",
                    "name": "Stanford Health Care Tri-Valley",
                    "patient_volume": 1200,
                    "calculated_smr": 0.86,
                    "discharge_home_rate": 85.0,
                    "nurse_staffing_ratio": 4.5,
                    "nurse_magnet": 1,
                    "intensivists_staffing": 22.0,
                    "expert_consults": 88.0,
                    "public_transparency": 95.0,
                    "hcahps_score": 88.0,
                    "advanced_tech_adoption": 90.0,
                    "patient_services_diversity": 85.0,
                    "trauma_center": 1,
                },
                {
                    "hospital_id": "UCSF-101",
                    "name": "UCSF Health Medical Center",
                    "patient_volume": 1600,
                    "calculated_smr": 0.78,
                    "discharge_home_rate": 89.5,
                    "nurse_staffing_ratio": 3.8,
                    "nurse_magnet": 1,
                    "intensivists_staffing": 24.0,
                    "expert_consults": 96.0,
                    "public_transparency": 99.0,
                    "hcahps_score": 91.0,
                    "advanced_tech_adoption": 95.0,
                    "patient_services_diversity": 88.0,
                    "trauma_center": 1,
                },
            ],
            "my_hospital": {
                "hospital_id": "DUMMY-99",
                "name": "Bay Area Community Hospital",
                "patient_volume": 600,
                "calculated_smr": 1.15,
                "discharge_home_rate": 70.0,
                "nurse_staffing_ratio": 3.2,
                "nurse_magnet": 0,
                "intensivists_staffing": 14.0,
                "expert_consults": 85.0,
                "public_transparency": 92.0,
                "hcahps_score": 75.0,
                "advanced_tech_adoption": 60.0,
                "patient_services_diversity": 72.0,
                "trauma_center": 0,
            },
        },
    }