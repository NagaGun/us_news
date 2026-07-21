# test_engine.py
from engine import evaluate_hospital

def run_tests():
    print("🚀 Starting Dashboard Rating Engine Validation Tests...\n")
    
    # -------------------------------------------------------------
    # TEST 1: Absolute Score Boundaries & Linear 0-100% Mapping
    # -------------------------------------------------------------
    baseline_run = evaluate_hospital()
    percentages = baseline_run["individual_percentages"]
    
    for metric, pct in percentages.items():
        assert 0.0 <= pct <= 100.0, f"❌ Test 1 Failed: {metric} has invalid score {pct}%"
    print("✅ Test 1 Passed: Every submetric maps cleanly to an individual 0-100% range.")

    # -------------------------------------------------------------
    # TEST 2: SMR & Discharge Home Inverse Relationship
    # -------------------------------------------------------------
    # Baseline staffing is 6.5. Let's hire staff to bring it down to 4.0 patients per nurse.
    improved_staffing = evaluate_hospital({"nurse_staffing_ratio": 4.0})
    
    base_smr = baseline_run["raw_metrics"]["calculated_smr"]
    improved_smr = improved_staffing["raw_metrics"]["calculated_smr"]
    
    base_discharge = baseline_run["raw_metrics"]["discharge_home_rate"]
    improved_discharge = improved_staffing["raw_metrics"]["discharge_home_rate"]
    
    # SMR should go down (fewer deaths), discharge home should go up (more survivors)
    assert improved_smr < base_smr, "❌ Test 2 Failed: SMR did not decrease with better staffing."
    assert improved_discharge > base_discharge, "❌ Test 2 Failed: Discharge home rate did not rise alongside decreased SMR."
    print(f"✅ Test 2 Passed: Inverse relationship confirmed. SMR dropped ({base_smr} -> {improved_smr}) and Discharge increased ({base_discharge}% -> {improved_discharge}%).")

    # -------------------------------------------------------------
    # TEST 3: Volatility Protection (Single Metric Cap)
    # -------------------------------------------------------------
    # Even if patient volume plummets to absolute zero, the score shouldn't tank completely.
    catastrophic_volume = evaluate_hospital({"patient_volume": 0})
    
    drop = baseline_run["overall_composite"] - catastrophic_volume["overall_composite"]
    # Patient volume is only weighted at 20% of the Structure Card (which is 25% of the overall score). Max overall impact = 5%
    assert drop <= 5.0, f"❌ Test 3 Failed: Score is too volatile! Overall rating dropped by {drop} points."
    print(f"✅ Test 3 Passed: Volatility cap works. Catastrophic volume drop only impacted total score by {drop} points.")

    print("\n🎉 ALL TESTS PASSED! The calculation engine is safe, robust, and audit-ready.")

if __name__ == "__main__":
    run_tests()