// src/services/api.ts

// Type definition for your input metrics
export interface HospitalMetricsInput {
  patient_volume: number;
  calculated_smr: number;
  discharge_home_rate: number;
  nurse_staffing_ratio: number;
  intensivists_staffing: number;
  expert_consults: number;
  public_transparency: number;
  hcahps_score: number;
  advanced_tech_adoption: number;
  patient_services_diversity: number;
  nurse_magnet: number;
  trauma_center: number;
}

// Type definition for the prediction response
export interface PredictResponse {
  overall_composite: number;
  component_averages: Record<string, number>;
  individual_percentages: Record<string, number>;
  raw_metrics: Record<string, number>;
  ood_assessment: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ak14l22oqg.execute-api.us-east-2.amazonaws.com";

export async function predictHospitalScore(data: HospitalMetricsInput): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const result: PredictResponse = await response.json();
  return result;
}
