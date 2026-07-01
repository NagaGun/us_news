import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

#Mock Training Data Generation
np.random.seed(42)
num_hospitals = 100

#Continuous Predictor Inputs
volumes = np.random.randint(500, 2000, size=num_hospitals)
nurse_headcounts = np.random.randint(80, 400, size=num_hospitals)
intensivist_hours = np.random.randint(30, 100, size=num_hospitals)
icu_beds = np.random.randint(10, 50, size=num_hospitals)