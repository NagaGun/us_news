# ml_models.py
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

# DATA GENERATION + Simulating historical state registry data for 100 Bay Area hospitals
np.random.seed(42)
num_hospitals = 100

# Continuous Predictor Inputs
volumes = np.random.randint(500, 2000, size=num_hospitals)
nurse_headcount = np.random.randint(80, 400, size=num_hospitals)
icu_beds = np.random.randint(10, 50, size=num_hospitals)
intensivist_hours = np.random.randint(30, 100, size=num_hospitals)

# Calculate derived operational features
raw_staffing_ratios = volumes / (nurse_headcount * 0.5)  # Patients per nurse ratio

# Target Outcomes with realistic statistical variance
# Mortality is noisy and Discharge to home is non-linear
mortality_noise = np.random.normal(90, 4, size=num_hospitals)
discharge_noise = 75 + (raw_staffing_ratios * -2.5) + np.random.normal(0, 3, size=num_hospitals)


# Random Forest Models to smooth out low-volume noise
X_outcomes = np.column_stack((volumes, raw_staffing_ratios, intensivist_hours))

model_mortality = RandomForestRegressor(n_estimators=50, random_state=42)
model_mortality.fit(X_outcomes, mortality_noise)

model_discharge = RandomForestRegressor(n_estimators=50, random_state=42)
model_discharge.fit(X_outcomes, discharge_noise)

# Linear Relationships
# Volume drives staffing ratios linearly
model_staffing_ratio = LinearRegression()
model_staffing_ratio.fit(volumes.reshape(-1, 1), raw_staffing_ratios)

# Random Forest to manage bias/noisy reporting
# Tech adoption and services diversity based on Volume and Intensive infrastructure
X_structure = np.column_stack((volumes, icu_beds))
tech_adoption_scores = 50 + (volumes * 0.02) + np.random.randint(-10, 10, size=num_hospitals)
services_diversity_scores = 60 + (icu_beds * 0.8) + np.random.randint(-15, 15, size=num_hospitals)

model_tech_adoption = RandomForestRegressor(n_estimators=50, random_state=42)
model_tech_adoption.fit(X_structure, tech_adoption_scores)

model_services_diversity = RandomForestRegressor(n_estimators=50, random_state=42)
model_services_diversity.fit(X_structure, services_diversity_scores)

# PROCESS & PATIENT EXP (Linear Models):

# Volume drives Expert Consults and HCAHPS
model_expert_consults = LinearRegression()
expert_consult_rates = 70 + (volumes * 0.01) + np.random.normal(0, 2, size=num_hospitals)
model_expert_consults.fit(volumes.reshape(-1, 1), expert_consult_rates)

model_hcahps = LinearRegression()
# More patients per nurse explicitly drops patient satisfaction linearly
hcahps_scores = 95 - (raw_staffing_ratios * 2.5) + np.random.normal(0, 1, size=num_hospitals)
model_hcahps.fit(raw_staffing_ratios.reshape(-1, 1), hcahps_scores)



# MASTER PREDICTION INTERFACE FOR THE BACKEND

def predict_all_submetrics(current_state):
    """
    Takes the current raw dictionary of your hospital, runs it through 
    the trained ML suite, and updates all dependent values.
    """
    vol = current_state["patient_volume"]
    
    # 1. Run Linear Models for immediate structural dependencies
    predicted_ratio = float(model_staffing_ratio.predict([[vol]])[0])
    predicted_consults = float(model_expert_consults.predict([[vol]])[0])
    
    # 2. Run HCAHPS based on the newly calculated staffing ratio
    predicted_hcahps = float(model_hcahps.predict([[predicted_ratio]])[0])
    
    # 3. Run Tree models for complex administrative assets (assume baseline ICU beds = 25)
    X_struct_input = [[vol, 25]]
    predicted_tech = float(model_tech_adoption.predict(X_struct_input)[0])
    predicted_services = float(model_services_diversity.predict(X_struct_input)[0])
    
    # 4. Run Tree models for clinical outcomes using updated operational variables
    X_outcome_input = [[vol, predicted_ratio, current_state["intensivists_staffing"]]]
    predicted_mortality = float(model_mortality.predict(X_outcome_input)[0])
    predicted_discharge = float(model_discharge.predict(X_outcome_input)[0])
    
    # Apply dynamic multiplier boosts if Nurse Magnet Status is active
    if current_state["nurse_magnet"] == 1:
        predicted_hcahps += 5.0
        predicted_discharge += 3.0

    return {
        "patient_volume": vol,
        "mortality_survival_index": round(predicted_mortality, 1),
        "discharge_home_rate": round(predicted_discharge, 1),
        "nurse_staffing_ratio": round(predicted_ratio, 2),
        "nurse_magnet": current_state["nurse_magnet"],
        "advanced_tech_adoption": round(predicted_tech, 1),
        "intensivists_staffing": current_state["intensivists_staffing"],
        "patient_services_diversity": round(predicted_services, 1),
        "expert_consults": round(predicted_consults, 1),
        "public_transparency": current_state["public_transparency"], # Kept static as independent
        "hcahps_score": round(min(100.0, predicted_hcahps), 1)
    }