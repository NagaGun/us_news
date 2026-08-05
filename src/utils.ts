/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricDefinition, PeerGroup } from './types';
import { METRIC_DEFINITIONS, BASELINE_TARGETS, CATEGORY_WEIGHTS } from './data';

/**
 * Normalizes a metric value to a 0-100 scale based on its min/max boundaries.
 * If the metric is already a percentage or 0-100 rating, returns the value directly.
 */
export function getNormalizedScore(metric: MetricDefinition, value: number): number {
  const { min, max, inverted } = metric;
  if (metric.unit === 'boolean') {
    // Boolean: 1 = adopted/yes = 100, 0 = not adopted/no = 0
    return value >= 0.5 ? 100 : 0;
  }
  if (min === max) return 50;
  if (inverted) {
    // Lower value = better: invert the scale
    const score = ((max - value) / (max - min)) * 100;
    return Math.max(0, Math.min(100, score));
  }
  if (min === 0 && max === 100) {
    return Math.max(0, Math.min(100, value));
  }
  const score = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculates the target value for a metric under a selected peer group.
 * The target is computed from the baseline target modified by the peer group multiplier.
 * It is clamped to stay within the metric's min/max bounds.
 */
export function getPeerTargetValue(metric: MetricDefinition, baseTarget: number, modifier: number): number {
  const adjusted = baseTarget * modifier;
  // Make sure target stays within reasonable clinical bounds
  return Math.max(metric.min, Math.min(metric.max, parseFloat(adjusted.toFixed(2))));
}

/**
 * Calculates the percentage variance between the hospital value and the target value.
 */
export function getVariance(value: number, target: number, inverted?: boolean): number {
  if (target === 0 && !inverted) return 0;
  if (inverted) {
    // For inverted metrics (lower is better), positive variance = fewer than target (good)
    if (target === 0) return 0;
    const variance = ((target - value) / target) * 100;
    return parseFloat(variance.toFixed(1));
  }
  const variance = ((value - target) / target) * 100;
  return parseFloat(variance.toFixed(1));
}

/**
 * Formats a raw value to look highly professional based on its units.
 */
export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'boolean') {
    return value >= 0.5 ? 'Yes' : 'No';
  }
  if (unit === '#') {
    return `${Math.round(value)} deaths`;
  }
  if (unit === '%') {
    return `${value.toFixed(1)}%`;
  }
  if (unit === 'FTE') {
    return `${value.toFixed(2)} FTE`;
  }
  if (unit === 'hr/d') {
    return `${value.toFixed(1)} hrs/day`;
  }
  if (unit === 'pts') {
    return value.toLocaleString();
  }
  if (unit === '/100') {
    return `${value.toFixed(0)}/100`;
  }
  return value.toFixed(1);
}

/**
 * Calculates the category scores and overall composite score based on current active values.
 */
export function calculateScores(
  activeValues: { [metricId: string]: number },
  peerGroup: PeerGroup,
  departmentTargets: { [metricId: string]: number } // Target baselines for the department (e.g. from BASELINE_TARGETS or modified)
) {
  const categorySums: { [category: string]: { weightedScore: number; totalWeight: number } } = {
    Outcome: { weightedScore: 0, totalWeight: 0 },
    Structure: { weightedScore: 0, totalWeight: 0 },
    Process: { weightedScore: 0, totalWeight: 0 },
    'Patient Exp': { weightedScore: 0, totalWeight: 0 },
  };

  const metricResults = METRIC_DEFINITIONS.map((metric) => {
    const hospitalValue = activeValues[metric.id] ?? metric.min;
    
    // Get baseline target for this metric (fall back to standard targets if missing in department targets)
    const baseTarget = departmentTargets[metric.id] ?? BASELINE_TARGETS[metric.id];
    const peerTarget = getPeerTargetValue(metric, baseTarget, peerGroup.targetModifier);
    
    const variance = getVariance(hospitalValue, peerTarget, metric.inverted);
    const rawNormalizedScore = getNormalizedScore(metric, hospitalValue);
    // Score relative to target benchmark (targetModifier):
    // Higher targetModifier (e.g. 1.12 National Top 10%) represents a tougher benchmark, so score is scaled relative to the peer target.
    const normalizedHospitalScore = Math.max(0, Math.min(100, parseFloat((rawNormalizedScore / peerGroup.targetModifier).toFixed(1))));
    
    // Track category weights and scores
    const categoryInfo = categorySums[metric.category];
    if (categoryInfo) {
      categoryInfo.weightedScore += normalizedHospitalScore * (metric.weightInCategory / 100);
      categoryInfo.totalWeight += metric.weightInCategory;
    }

    return {
      metric,
      hospitalValue,
      peerTarget,
      variance,
      normalizedHospitalScore,
    };
  });

  // Calculate final category scores out of 100
  const categoryScores: { [category: string]: number } = {
    Outcome: 0,
    Structure: 0,
    Process: 0,
    'Patient Exp': 0,
  };

  Object.keys(categorySums).forEach((category) => {
    const info = categorySums[category];
    categoryScores[category] = parseFloat(info.weightedScore.toFixed(1));
  });

  // Calculate Overall Composite Score out of 100
  const compositeScore = 
    (categoryScores.Outcome * CATEGORY_WEIGHTS.Outcome +
     categoryScores.Structure * CATEGORY_WEIGHTS.Structure +
     categoryScores.Process * CATEGORY_WEIGHTS.Process +
     categoryScores['Patient Exp'] * CATEGORY_WEIGHTS['Patient Exp']) / 100;

  return {
    categoryScores,
    compositeScore: parseFloat(compositeScore.toFixed(1)),
    metricResults,
  };
}
