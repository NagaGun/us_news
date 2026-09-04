// src/components/HospitalScoreCalculator.tsx
import React, { useState } from "react";
import { predictHospitalScore, HospitalMetricsInput, PredictResponse } from "../services/api";

export function HospitalScoreCalculator() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  const samplePayload: HospitalMetricsInput = {
    patient_volume: 1200,
    calculated_smr: 1.1,
    discharge_home_rate: 72.0,
    nurse_staffing_ratio: 3.5,
    intensivists_staffing: 18.0,
    expert_consults: 80.0,
    public_transparency: 85.0,
    hcahps_score: 75.0,
    advanced_tech_adoption: 60.0,
    patient_services_diversity: 75.0,
    nurse_magnet: 0.0,
    trauma_center: 0.0,
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictHospitalScore(samplePayload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch score");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" style={{ padding: "20px" }}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Hospital Composite Score Simulator</h2>
        <p className="text-sm text-slate-500 mb-6">
          Invokes the AWS Lambda serverless prediction endpoint with strong TypeScript typing.
        </p>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Calculating..." : "Run Assessment"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            <p style={{ color: "red" }}>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4" style={{ marginTop: "20px" }}>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <h3 className="text-lg font-bold text-emerald-900">
                Overall Composite: {result.overall_composite}
              </h3>
              {result.ood_assessment && (
                <p className="text-xs text-emerald-700 font-mono mt-1">
                  OOD Status: {result.ood_assessment}
                </p>
              )}
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs font-mono">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalScoreCalculator;
