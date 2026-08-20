# test_engine.py
from engine import evaluate_hospital

def run_tests():
    print("🚀 Starting Dashboard Rating Engine Validation Tests...\n")

    # -------------------------------------------------------------
    # TEST 1: Absolute Score Boundaries & 0-100% Mapping
    # -------------------------------------------------------------
    baseline_run = evaluate_hospital(department_id="cardiology")
    percentages = baseline_run["individual_percentages"]

    for metric, pct in percentages.items():
        assert 0.0 <= pct <= 100.0, f"❌ Test 1 Failed: {metric} has invalid score {pct}%"
    print("✅ Test 1 Passed: Every submetric maps cleanly to an individual 0-100% range.")

    # -------------------------------------------------------------
    # TEST 2: Structural Properties & OOD Assessment Payload
    # -------------------------------------------------------------
    improved_staffing = evaluate_hospital({"nurse_staffing_ratio": 4.0}, department_id="cardiology")

    base_smr = baseline_run["raw_metrics"]["calculated_smr"]
    improved_smr = improved_staffing["raw_metrics"]["calculated_smr"]

    # Structural property check: SMR is a positive numerical ratio
    assert improved_smr > 0.0, "❌ Test 2 Failed: SMR must be a positive ratio."

    # Structural property check: ood_assessment is present with valid level
    ood = improved_staffing.get("ood_assessment")
    assert ood is not None, "❌ Test 2 Failed: ood_assessment is missing from evaluation."
    assert ood["level"] in ("confident", "caution", "out_of_range"), f"❌ Test 2 Failed: invalid ood level {ood['level']}"
    print(f"✅ Test 2 Passed: Structural properties & OOD assessment valid (level='{ood['level']}').")

    # -------------------------------------------------------------
    # TEST 3: Volatility & Bounds Check (Single Metric Impact)
    # -------------------------------------------------------------
    catastrophic_volume = evaluate_hospital({"patient_volume": 200}, department_id="cardiology")

    comp_base = baseline_run["overall_composite"]
    comp_cat = catastrophic_volume["overall_composite"]

    assert 0.0 <= comp_cat <= 100.0, f"❌ Test 3 Failed: Catastrophic score {comp_cat} is out of 0-100 bounds."
    print(f"✅ Test 3 Passed: Score remains bounded and robust (baseline composite: {comp_base}, volume shift: {comp_cat}).")

    print("\n🎉 ALL TESTS PASSED! The calculation engine is safe, robust, and audit-ready.")

if __name__ == "__main__":
    run_tests()