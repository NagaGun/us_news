# mock_data.py

HOSPITAL_DATA = {
    "Cancer": {
        "peer_group": [
            {
                "hospital_id": "STAN-01",
                "name": "Riverside Care Network",
                "patient_volume": 790,
                "mortality_survival_index": 93.0,
                "discharge_home_rate": 80.5,
                "nurse_staffing_ratio": 2.75,
                "nurse_magnet": 1,
                "intensivists_staffing": 18.0,
                "expert_consults": 88.0,
                "public_transparency": 92.0,
                "hcahps_score": 76.0
            },
            {
                "hospital_id": "SRRMC-02",
                "name": "St. Augustine Systems",
                "patient_volume": 910,
                "mortality_survival_index": 95.2,
                "discharge_home_rate": 84.0,
                "nurse_staffing_ratio": 3.10,
                "nurse_magnet": 1,
                "intensivists_staffing": 20.0,
                "expert_consults": 82.0,
                "public_transparency": 88.0,
                "hcahps_score": 79.5
            },
            {
                "hospital_id": "KP-03",
                "name": "Pacific Union Health",
                "patient_volume": 805,
                "mortality_survival_index": 90.1,
                "discharge_home_rate": 76.2,
                "nurse_staffing_ratio": 2.60,
                "nurse_magnet": 0,
                "intensivists_staffing": 14.0,
                "expert_consults": 91.0,
                "public_transparency": 96.0,
                "hcahps_score": 72.4
            },
            {
                "hospital_id": "UCSF-101",
                "name": "UCSF Health Medical Center",
                "patient_volume": 1100,
                "mortality_survival_index": 96.5,
                "discharge_home_rate": 85.0,
                "nurse_staffing_ratio": 3.5,
                "nurse_magnet": 1,
                "intensivists_staffing": 24.0,
                "expert_consults": 95.0,
                "public_transparency": 98.0,
                "hcahps_score": 85.0
            },
            {
                "hospital_id": "SUTT-204",
                "name": "Sutter Health CPMC",
                "patient_volume": 860,
                "mortality_survival_index": 93.5,
                "discharge_home_rate": 81.5,
                "nurse_staffing_ratio": 2.9,
                "nurse_magnet": 1,
                "intensivists_staffing": 19.0,
                "expert_consults": 89.0,
                "public_transparency": 93.0,
                "hcahps_score": 78.0
            },
            {
                "hospital_id": "JMH-308",
                "name": "John Muir Health Walnut Creek",
                "patient_volume": 770,
                "mortality_survival_index": 92.5,
                "discharge_home_rate": 79.5,
                "nurse_staffing_ratio": 2.7,
                "nurse_magnet": 1,
                "intensivists_staffing": 16.0,
                "expert_consults": 87.0,
                "public_transparency": 91.0,
                "hcahps_score": 75.0
            },
            {
                "hospital_id": "VC-506",
                "name": "ValleyCare Community Network",
                "patient_volume": 750,
                "mortality_survival_index": 91.8,
                "discharge_home_rate": 77.5,
                "nurse_staffing_ratio": 2.55,
                "nurse_magnet": 0,
                "intensivists_staffing": 15.0,
                "expert_consults": 86.0,
                "public_transparency": 90.0,
                "hcahps_score": 73.5
            },
            {
                "hospital_id": "NAT-TOP10",
                "name": "National Top 10% Benchmark",
                "patient_volume": 1250,
                "mortality_survival_index": 97.5,
                "discharge_home_rate": 88.0,
                "nurse_staffing_ratio": 3.8,
                "nurse_magnet": 1,
                "intensivists_staffing": 24.0,
                "expert_consults": 98.0,
                "public_transparency": 99.0,
                "hcahps_score": 88.0
            }
        ],
        "my_hospital": {
            "hospital_id": "DUMMY-99",
            "name": "Metropolitan Hospital",
            "patient_volume": 850,
            "mortality_survival_index": 91.5,
            "discharge_home_rate": 78.0,
            "nurse_staffing_ratio": 2.80,
            "nurse_magnet": 1,
            "intensivists_staffing": 16.0,
            "expert_consults": 89.0,
            "public_transparency": 94.0,
            "hcahps_score": 71.0
        }
    },
    "Cardiology": {
        "peer_group": [
            {
                "hospital_id": "STAN-01",
                "name": "Stanford Health Care Tri-Valley",
                "patient_volume": 1200,
                "mortality_survival_index": 92.5,
                "discharge_home_rate": 85.0,
                "nurse_staffing_ratio": 4.5,
                "nurse_magnet": 1,
                "intensivists_staffing": 80.0,
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
            },
            {
                "hospital_id": "UCSF-101",
                "name": "UCSF Health Medical Center",
                "patient_volume": 1600,
                "mortality_survival_index": 97.0,
                "discharge_home_rate": 89.5,
                "nurse_staffing_ratio": 3.8,
                "nurse_magnet": 1,
                "intensivists_staffing": 92.0,
                "expert_consults": 96.0,
                "public_transparency": 99.0,
                "hcahps_score": 91.0
            },
            {
                "hospital_id": "SUTT-204",
                "name": "Sutter Health CPMC",
                "patient_volume": 1300,
                "mortality_survival_index": 94.0,
                "discharge_home_rate": 86.5,
                "nurse_staffing_ratio": 4.2,
                "nurse_magnet": 1,
                "intensivists_staffing": 82.0,
                "expert_consults": 90.0,
                "public_transparency": 94.0,
                "hcahps_score": 85.0
            }
        ],
        "my_hospital": {
            "hospital_id": "DUMMY-99",
            "name": "Bay Area Community Hospital",
            "patient_volume": 600,
            "mortality_survival_index": 82.0,
            "discharge_home_rate": 70.0,
            "nurse_staffing_ratio": 6.5,
            "nurse_magnet": 0,
            "intensivists_staffing": 40.0,
            "expert_consults": 85.0,
            "public_transparency": 92.0,
            "hcahps_score": 75.0
        }
    }
}