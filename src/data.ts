/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricDefinition, DepartmentData, PeerGroup, CategoryWeights } from './types';

export const CATEGORY_WEIGHTS: CategoryWeights = {
  Outcome: 30,
  Structure: 25,
  Process: 25,
  'Patient Exp': 20,
};

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // --- OUTCOME ---
  {
    id: 'mortality_survival',
    name: 'Mortality Survival Index',
    category: 'Outcome',
    description: 'Risk-adjusted mortality survival rate representing avoidable mortality events compared to baseline standards.',
    unit: '%',
    min: 75,
    max: 100,
    weightInCategory: 60,
  },
  {
    id: 'discharge_home',
    name: 'Discharge to Home Rate',
    category: 'Outcome',
    description: 'Percentage of patients discharged directly to home or self-care, reflecting successful inpatient rehabilitation and care transition.',
    unit: '%',
    min: 60,
    max: 100,
    weightInCategory: 40,
  },
  // --- STRUCTURE ---
  {
    id: 'patient_volume',
    name: 'Patient Volume Index',
    category: 'Structure',
    description: 'Volume of specialized admissions, indicating clinical depth, expertise levels, and procedural experience.',
    unit: 'pts',
    min: 200,
    max: 1500,
    weightInCategory: 15,
  },
  {
    id: 'advanced_tech',
    name: 'Advanced Tech Adoption',
    category: 'Structure',
    description: 'Availability of state-of-the-art diagnostic, surgical, and therapeutic technologies in the department.',
    unit: '/100',
    min: 40,
    max: 100,
    weightInCategory: 15,
  },
  {
    id: 'nurse_staffing',
    name: 'Nurse Staffing Level',
    category: 'Structure',
    description: 'Ratio of full-time equivalent (FTE) registered nurses to inpatient days, indicating care intensity.',
    unit: 'FTE',
    min: 1.0,
    max: 4.5,
    weightInCategory: 20,
  },
  {
    id: 'nurse_magnet',
    name: 'Nurse Magnet Alignment',
    category: 'Structure',
    description: 'Alignment with Magnet Recognition standards for nursing excellence, leadership, and professional practice.',
    unit: '%',
    min: 50,
    max: 100,
    weightInCategory: 10,
  },
  {
    id: 'intensivists',
    name: 'Intensivists Staffing',
    category: 'Structure',
    description: 'Dedicated critical care specialists coverage in department intensive care or step-down units.',
    unit: 'hr/d',
    min: 4,
    max: 24,
    weightInCategory: 15,
  },
  {
    id: 'patient_services',
    name: 'Patient Services Diversity',
    category: 'Structure',
    description: 'Availability of patient support programs, social services, translators, and customized care pathways.',
    unit: '/100',
    min: 50,
    max: 100,
    weightInCategory: 15,
  },
  {
    id: 'trauma_readiness',
    name: 'Trauma Center Readiness',
    category: 'Structure',
    description: 'Department capacity to handle extreme emergency trauma transfers and critical clinical interventions.',
    unit: '/100',
    min: 30,
    max: 100,
    weightInCategory: 10,
  },
  // --- PROCESS ---
  {
    id: 'specialist_consults',
    name: 'Expert Specialist Consults',
    category: 'Process',
    description: 'Percentage of complex cases receiving multidisciplinary specialist consultation within 24 hours of admission.',
    unit: '%',
    min: 65,
    max: 100,
    weightInCategory: 50,
  },
  {
    id: 'public_transparency',
    name: 'Public Transparency Index',
    category: 'Process',
    description: 'Adherence to voluntary quality registries and active reporting of department outcomes to public databases.',
    unit: '/100',
    min: 50,
    max: 100,
    weightInCategory: 50,
  },
  // --- PATIENT EXPERIENCE ---
  {
    id: 'hcahps_experience',
    name: 'HCAHPS Patient Score',
    category: 'Patient Exp',
    description: 'Hospital Consumer Assessment of Healthcare Providers and Systems (HCAHPS) patient-reported satisfaction score.',
    unit: '%',
    min: 50,
    max: 100,
    weightInCategory: 100,
  },
];

export const PEER_GROUPS: PeerGroup[] = [
  {
    id: 'regional_peers',
    name: 'Regional Peers',
    description: 'Comparison with local hospitals of similar bed capacity and geographical reach.',
    targetModifier: 0.90, // Target values are slightly lower
  },
  {
    id: 'statewide_avg',
    name: 'Statewide Avg',
    description: 'Comparison against statewide academic and non-academic healthcare averages.',
    targetModifier: 1.00, // Standard baseline target
  },
  {
    id: 'national_top',
    name: 'National Top 10%',
    description: 'Comparison against elite national healthcare institutions and clinical leaders.',
    targetModifier: 1.12, // High targets!
  },
];

// Department configuration: contains the hospital's baseline scores AND standard targets (at statewide level)
export const DEPARTMENTS: DepartmentData[] = [
  {
    id: 'cancer',
    name: 'Cancer (Oncology)',
    iconName: 'ShieldAlert',
    description: 'Comprehensive oncology and bone marrow transplant clinical services, oncology nursing, and precision diagnostics.',
    metrics: {
      mortality_survival: 91.5,   // Statewide target: 93.0 (Underperforming)
      discharge_home: 78.0,      // Statewide target: 82.0 (Underperforming)
      patient_volume: 850,       // Statewide target: 700 (Outperforming)
      advanced_tech: 85,         // Statewide target: 75 (Outperforming)
      nurse_staffing: 2.8,       // Statewide target: 3.2 (Underperforming)
      nurse_magnet: 82,          // Statewide target: 80 (Outperforming)
      intensivists: 16,          // Statewide target: 18 (Underperforming)
      patient_services: 92,      // Statewide target: 85 (Outperforming)
      trauma_readiness: 65,      // Statewide target: 70 (Underperforming)
      specialist_consults: 89.0, // Statewide target: 85.0 (Outperforming)
      public_transparency: 94,   // Statewide target: 90 (Outperforming)
      hcahps_experience: 71,     // Statewide target: 75 (Underperforming)
    },
  },
  {
    id: 'cardiology',
    name: 'Cardiology (Heart)',
    iconName: 'Heart',
    description: 'Cardiovascular care, advanced surgical valve repairs, heart failure clinics, and coronary interventions.',
    metrics: {
      mortality_survival: 95.2,   // Statewide target: 94.0 (Outperforming)
      discharge_home: 84.5,      // Statewide target: 86.0 (Underperforming)
      patient_volume: 1250,      // Statewide target: 1000 (Outperforming)
      advanced_tech: 92,         // Statewide target: 85 (Outperforming)
      nurse_staffing: 3.0,       // Statewide target: 3.5 (Underperforming)
      nurse_magnet: 88,          // Statewide target: 85 (Outperforming)
      intensivists: 20,          // Statewide target: 18 (Outperforming)
      patient_services: 78,      // Statewide target: 80 (Underperforming)
      trauma_readiness: 90,      // Statewide target: 85 (Outperforming)
      specialist_consults: 82.0, // Statewide target: 88.0 (Underperforming)
      public_transparency: 72,   // Statewide target: 80 (Underperforming)
      hcahps_experience: 68,     // Statewide target: 76 (Underperforming)
    },
  },
  {
    id: 'dige',
    name: 'DIGE (Digestive)',
    iconName: 'Activity',
    description: 'Gastroenterology, digestive organ disorders, robotic GI surgery, and metabolic clinical pathways.',
    metrics: {
      mortality_survival: 96.0,   // Statewide target: 95.0 (Outperforming)
      discharge_home: 89.0,      // Statewide target: 87.0 (Outperforming)
      patient_volume: 520,       // Statewide target: 600 (Underperforming)
      advanced_tech: 70,         // Statewide target: 78 (Underperforming)
      nurse_staffing: 2.1,       // Statewide target: 2.5 (Underperforming)
      nurse_magnet: 74,          // Statewide target: 80 (Underperforming)
      intensivists: 12,          // Statewide target: 12 (Met)
      patient_services: 85,      // Statewide target: 80 (Outperforming)
      trauma_readiness: 55,      // Statewide target: 60 (Underperforming)
      specialist_consults: 91.0, // Statewide target: 85.0 (Outperforming)
      public_transparency: 88,   // Statewide target: 85 (Outperforming)
      hcahps_experience: 82,     // Statewide target: 78 (Outperforming)
    },
  },
  {
    id: 'endo',
    name: 'Endo (Endocrinology)',
    iconName: 'Thermometer',
    description: 'Diabetes clinical centers, metabolic diagnostics, endocrine system malignancies, and hormonal research.',
    metrics: {
      mortality_survival: 97.8,   // Statewide target: 97.0 (Outperforming)
      discharge_home: 92.0,      // Statewide target: 91.0 (Outperforming)
      patient_volume: 380,       // Statewide target: 450 (Underperforming)
      advanced_tech: 60,         // Statewide target: 70 (Underperforming)
      nurse_staffing: 1.8,       // Statewide target: 2.2 (Underperforming)
      nurse_magnet: 85,          // Statewide target: 80 (Outperforming)
      intensivists: 8,           // Statewide target: 10 (Underperforming)
      patient_services: 94,      // Statewide target: 85 (Outperforming)
      trauma_readiness: 40,      // Statewide target: 50 (Underperforming)
      specialist_consults: 76.0, // Statewide target: 82.0 (Underperforming)
      public_transparency: 90,   // Statewide target: 85 (Outperforming)
      hcahps_experience: 79,     // Statewide target: 77 (Outperforming)
    },
  },
  {
    id: 'specialty',
    name: 'Specialty Medicine',
    iconName: 'Sparkles',
    description: 'Multi-specialty orphan disease diagnostic units, dermatology, immunology, and rare syndrome management.',
    metrics: {
      mortality_survival: 92.0,   // Statewide target: 94.0 (Underperforming)
      discharge_home: 80.0,      // Statewide target: 85.0 (Underperforming)
      patient_volume: 310,       // Statewide target: 300 (Outperforming)
      advanced_tech: 95,         // Statewide target: 85 (Outperforming)
      nurse_staffing: 3.4,       // Statewide target: 3.0 (Outperforming)
      nurse_magnet: 91,          // Statewide target: 85 (Outperforming)
      intensivists: 24,          // Statewide target: 20 (Outperforming)
      patient_services: 96,      // Statewide target: 88 (Outperforming)
      trauma_readiness: 78,      // Statewide target: 80 (Underperforming)
      specialist_consults: 94.0, // Statewide target: 90.0 (Outperforming)
      public_transparency: 65,   // Statewide target: 80 (Underperforming)
      hcahps_experience: 70,     // Statewide target: 76 (Underperforming)
    },
  },
  {
    id: 'neuro',
    name: 'Neuro (Neurology)',
    iconName: 'Brain',
    description: 'Stroke response intervention units, epilepsy monitoring, neurosurgery, and neurodegenerative therapeutics.',
    metrics: {
      mortality_survival: 89.5,   // Statewide target: 91.0 (Underperforming)
      discharge_home: 74.0,      // Statewide target: 78.0 (Underperforming)
      patient_volume: 680,       // Statewide target: 600 (Outperforming)
      advanced_tech: 88,         // Statewide target: 80 (Outperforming)
      nurse_staffing: 2.9,       // Statewide target: 3.2 (Underperforming)
      nurse_magnet: 80,          // Statewide target: 82 (Underperforming)
      intensivists: 18,          // Statewide target: 16 (Outperforming)
      patient_services: 82,      // Statewide target: 84 (Underperforming)
      trauma_readiness: 85,      // Statewide target: 80 (Outperforming)
      specialist_consults: 85.0, // Statewide target: 88.0 (Underperforming)
      public_transparency: 92,   // Statewide target: 85 (Outperforming)
      hcahps_experience: 72,     // Statewide target: 75 (Underperforming)
    },
  },
  {
    id: 'respi',
    name: 'Respi (Respiratory)',
    iconName: 'Wind',
    description: 'Pulmonary medicine, chronic obstructive disease therapy, mechanical ventilator weaning, and asthma clinics.',
    metrics: {
      mortality_survival: 93.0,   // Statewide target: 92.0 (Outperforming)
      discharge_home: 81.0,      // Statewide target: 83.0 (Underperforming)
      patient_volume: 950,       // Statewide target: 800 (Outperforming)
      advanced_tech: 75,         // Statewide target: 80 (Underperforming)
      nurse_staffing: 2.4,       // Statewide target: 2.8 (Underperforming)
      nurse_magnet: 78,          // Statewide target: 80 (Underperforming)
      intensivists: 14,          // Statewide target: 16 (Underperforming)
      patient_services: 80,      // Statewide target: 80 (Met)
      trauma_readiness: 70,      // Statewide target: 75 (Underperforming)
      specialist_consults: 88.0, // Statewide target: 85.0 (Outperforming)
      public_transparency: 80,   // Statewide target: 80 (Met)
      hcahps_experience: 74,     // Statewide target: 74 (Met)
    },
  },
];

// Reference standard/baseline targets used before applying the Peer Group target modifier
export const BASELINE_TARGETS: { [metricId: string]: number } = {
  mortality_survival: 93.5,
  discharge_home: 83.0,
  patient_volume: 650,
  advanced_tech: 80,
  nurse_staffing: 2.8,
  nurse_magnet: 80,
  intensivists: 16,
  patient_services: 82,
  trauma_readiness: 75,
  specialist_consults: 85.0,
  public_transparency: 82,
  hcahps_experience: 75,
};
