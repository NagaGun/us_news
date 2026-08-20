/**
 * src/backendSimulation.ts
 *
 * Backend integration layer for metric translation, API payload formatting,
 * and the useBackendSimulation React hook.
 */

import { useState, useCallback, useRef } from 'react';
import { DEPARTMENTS } from './data';

// 1. Metric ID translation map
export const METRIC_ID_MAP: Record<string, string> = {
  mortality_survival: 'calculated_smr',
  discharge_home: 'discharge_home_rate',
  patient_volume: 'patient_volume',
  advanced_tech: 'advanced_tech_adoption',
  nurse_staffing: 'nurse_staffing_ratio',
  nurse_magnet: 'nurse_magnet',
  intensivists: 'intensivists_staffing',
  patient_services: 'patient_services_diversity',
  trauma_readiness: 'trauma_center',
  specialist_consults: 'expert_consults',
  public_transparency: 'public_transparency',
  hcahps_experience: 'hcahps_score',
};

export const REVERSE_METRIC_ID_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(METRIC_ID_MAP).map(([fe, be]) => [be, fe])
);

export interface OodAssessment {
  level: 'confident' | 'caution' | 'out_of_range';
  score?: number;
  flags?: string[];
  scores?: Record<string, number | null>;
  message: string;
}

export interface BackendSimulationResponse {
  rawMetrics: Record<string, number>;
  scores: Record<string, number>;
  oodAssessment: OodAssessment | null;
  overallComposite?: number;
}

export function getExpectedDeathsForDept(deptId: string): number {
  const dept = DEPARTMENTS.find((d) => d.id === deptId) || DEPARTMENTS[0];
  return dept.metrics.mortality_survival ?? 8;
}

// 2. toBackendPayload
export function toBackendPayload(
  departmentId: string,
  activeValues: Record<string, number>
) {
  const overrides: Record<string, number> = {};
  for (const [feKey, val] of Object.entries(activeValues)) {
    const beKey = METRIC_ID_MAP[feKey];
    if (beKey !== undefined) {
      overrides[beKey] = val;
    }
  }
  return {
    department_id: departmentId,
    target_overrides: overrides,
  };
}

// 3. fromBackendResponse
export function fromBackendResponse(
  data: any,
  deptId: string
): BackendSimulationResponse {
  const raw = data.simulated?.raw_metrics || data.predicted_raw || {};
  const scores = data.simulated?.individual_percentages || data.predicted_scores || {};
  const oodAssessment: OodAssessment | null =
    data.ood_assessment || data.simulated?.ood_assessment || null;

  const expectedDeaths = getExpectedDeathsForDept(deptId);
  const frontendRaw: Record<string, number> = {};

  for (const [beKey, val] of Object.entries(raw)) {
    const feKey = REVERSE_METRIC_ID_MAP[beKey];
    if (feKey) {
      if (feKey === 'mortality_survival') {
        // displayed_deaths = calculated_smr * expected_deaths
        frontendRaw[feKey] = Math.round(Number(val) * expectedDeaths);
      } else {
        frontendRaw[feKey] = Number(val);
      }
    }
  }

  const frontendScores: Record<string, number> = {};
  for (const [beKey, val] of Object.entries(scores)) {
    const feKey = REVERSE_METRIC_ID_MAP[beKey];
    if (feKey) {
      frontendScores[feKey] = Number(val);
    }
  }

  return {
    rawMetrics: frontendRaw,
    scores: frontendScores,
    oodAssessment,
    overallComposite: data.simulated?.overall_composite,
  };
}

// 4. React Hook
export function useBackendSimulation(departmentId: string) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<BackendSimulationResponse | null>(null);
  const pendingRef = useRef<boolean>(false);

  const runSimulation = useCallback(
    async (activeValues: Record<string, number>) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const payload = toBackendPayload(departmentId, activeValues);
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Simulation request failed with status ${res.status}`);
        }

        const data = await res.json();
        const parsed = fromBackendResponse(data, departmentId);
        setLastResult(parsed);
      } catch (err: any) {
        setError(err.message || 'Simulation execution failed');
      } finally {
        setLoading(false);
        pendingRef.current = false;
      }
    },
    [departmentId]
  );

  const resetResult = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    lastResult,
    runSimulation,
    resetResult,
  };
}
