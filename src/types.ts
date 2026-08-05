/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MetricCategory = 'Outcome' | 'Structure' | 'Process' | 'Patient Exp';

export interface MetricDefinition {
  id: string;
  name: string;
  category: MetricCategory;
  description: string;
  unit: string;
  min: number;
  max: number;
  weightInCategory: number; // Percentage, e.g., 40 means 40% weight within the category
  inverted?: boolean; // If true, lower raw values score higher (e.g. number of deaths, nurse-to-patient ratio)
}

export interface MetricValue {
  metricId: string;
  hospitalValue: number;
  // Peer target is defined per peer group and per department
}

export interface DepartmentData {
  id: string;
  name: string;
  iconName: string;
  description: string;
  // Baseline scores for each metric under this department
  metrics: { [metricId: string]: number };
}

export interface PeerGroup {
  id: string;
  name: string;
  description: string;
  // Multipliers or modifiers applied to target values
  targetModifier: number; // e.g., 1.0 for Statewide Avg, 0.9 for Regional Peers, 1.15 for National Top 10%
}

export interface CategoryWeights {
  Outcome: number; // e.g., 30%
  Structure: number; // e.g., 25%
  Process: number; // e.g., 25%
  'Patient Exp': number; // e.g., 20%
}
