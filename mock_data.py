# mock_data.py

HOSPITAL_DATA = {
    "Cardiology": {
        "peer_group": [
            {
                "hospital_id": "STAN-01",
                "name": "Stanford Health Care Tri-Valley",
                "patient_volume": 1200,
                "mortality_survival_index": 92.5,
                "discharge_home_rate": 85.0,
                "nurse_staffing_ratio": 4.5,  # patients per nurse
                "nurse_magnet": 1,           # Binary (1=Yes, 0=No)
                "intensivists_staffing": 80.0, # hours/bed
                "expert_consults": 88.0,
                "public_transparency": 95.0,
                "hcahps_score": 88.0
            },
            {
                "hospital_id": "SRRMC-02",
                "name": "San Ramon Regional Medical Center",
                "patient_volume": 850,
                "mortality_survival_index": 89.0,
                "discharge_home_rate": 79.0,
                "nurse_staffing_ratio": 5.2,
                "nurse_magnet": 0,
                "intensivists_staffing": 65.0,
                "expert_consults": 75.0,
                "public_transparency": 90.0,
                "hcahps_score": 82.0
            },
            {
                "hospital_id": "KP-03",
                "name": "Kaiser Permanente Dublin",
                "patient_volume": 1500,
                "mortality_survival_index": 95.0,
                "discharge_home_rate": 88.0,
                "nurse_staffing_ratio": 4.0,
                "nurse_magnet": 1,
                "intensivists_staffing": 85.0,
                "expert_consults": 92.0,
                "public_transparency": 98.0,
                "hcahps_score": 90.0
            }
        ],
        "my_hospital": {
            "hospital_id": "DUMMY-99",
            "name": "Bay Area Community Hospital",
            "patient_volume": 600,
            "mortality_survival_index": 82.0,  # Red (Underperforming)
            "discharge_home_rate": 70.0,         # Red (Underperforming)
            "nurse_staffing_ratio": 6.5,         # Red (Worse ratio)
            "nurse_magnet": 0,
            "intensivists_staffing": 40.0,       # Red
            "expert_consults": 85.0,             # Okay
            "public_transparency": 92.0,         # Good
            "hcahps_score": 75.0                 # Low
        }
    }
}