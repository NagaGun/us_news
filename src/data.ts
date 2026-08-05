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

export const ADVANCED_TECH_ITEMS = [
  "Ablation of Barrett's esophagus",
  'Assistive technology center',
  'Computer tomography CE scanner',
  'Computer assisted orthopedic surgery',
  'Diagnostic radioisotope services',
  'Electrodiagnostic services',
  'Endoscopic retrograde cholangiopancreatography',
];

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  // --- OUTCOME ---
  {
    id: 'mortality_survival',
    name: 'Number of Deaths',
    category: 'Outcome',
    description: 'Risk-adjusted number of avoidable inpatient deaths per quarter. Lower values indicate better clinical performance and fewer preventable outcomes.',
    unit: '#',
    min: 0,
    max: 50,
    weightInCategory: 60,
    inverted: true, // Fewer deaths = better score
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
    description: 'Adoption of specific advanced clinical technologies. Each selected capability contributes incrementally to the department score.',
    unit: 'checkboxes',
    min: 0,
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
    description: 'Whether the department is certified and equipped to handle extreme emergency trauma transfers and critical interventions.',
    unit: 'boolean',
    min: 0,
    max: 1,
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
      mortality_survival: 12,    // # deaths/qtr — statewide target: 10 (slightly over)
      discharge_home: 78.0,     // Statewide target: 82.0 (Underperforming)
      patient_volume: 850,      // Statewide target: 700 (Outperforming)
      advanced_tech: 100,       // Adopted
      nurse_staffing: 2.8,      // Statewide target: 3.2 (Underperforming)
      nurse_magnet: 82,         // Statewide target: 80 (Outperforming)
      intensivists: 16,         // Statewide target: 18 (Underperforming)
      patient_services: 92,     // Statewide target: 85 (Outperforming)
      trauma_readiness: 1,      // Certified
      specialist_consults: 89.0,
      public_transparency: 94,
      hcahps_experience: 71,
    },
  },
  {
    id: 'cardiology',
    name: 'Cardiology (Heart)',
    iconName: 'Heart',
    description: 'Cardiovascular care, advanced surgical valve repairs, heart failure clinics, and coronary interventions.',
    metrics: {
      mortality_survival: 6,     // # deaths/qtr — statewide target: 8 (outperforming)
      discharge_home: 84.5,
      patient_volume: 1250,
      advanced_tech: 100,          // Adopted
      nurse_staffing: 3.0,
      nurse_magnet: 88,
      intensivists: 20,
      patient_services: 78,
      trauma_readiness: 1,       // Certified
      specialist_consults: 82.0,
      public_transparency: 72,
      hcahps_experience: 68,
    },
  },
  {
    id: 'dige',
    name: 'DIGE (Digestive)',
    iconName: 'Activity',
    description: 'Gastroenterology, digestive organ disorders, robotic GI surgery, and metabolic clinical pathways.',
    metrics: {
      mortality_survival: 5,     // # deaths/qtr — statewide target: 7 (outperforming)
      discharge_home: 89.0,
      patient_volume: 520,
      advanced_tech: 0,          // Not adopted
      nurse_staffing: 2.1,
      nurse_magnet: 74,
      intensivists: 12,
      patient_services: 85,
      trauma_readiness: 0,       // Not certified
      specialist_consults: 91.0,
      public_transparency: 88,
      hcahps_experience: 82,
    },
  },
  {
    id: 'endo',
    name: 'Endo (Endocrinology)',
    iconName: 'Thermometer',
    description: 'Diabetes clinical centers, metabolic diagnostics, endocrine system malignancies, and hormonal research.',
    metrics: {
      mortality_survival: 3,     // # deaths/qtr — statewide target: 5 (outperforming)
      discharge_home: 92.0,
      patient_volume: 380,
      advanced_tech: 0,          // Not adopted
      nurse_staffing: 1.8,
      nurse_magnet: 85,
      intensivists: 8,
      patient_services: 94,
      trauma_readiness: 0,       // Not certified
      specialist_consults: 76.0,
      public_transparency: 90,
      hcahps_experience: 79,
    },
  },
  {
    id: 'specialty',
    name: 'Specialty Medicine',
    iconName: 'Sparkles',
    description: 'Multi-specialty orphan disease diagnostic units, dermatology, immunology, and rare syndrome management.',
    metrics: {
      mortality_survival: 9,     // # deaths/qtr — statewide target: 8 (slightly over)
      discharge_home: 80.0,
      patient_volume: 310,
      advanced_tech: 100,          // Adopted
      nurse_staffing: 3.4,
      nurse_magnet: 91,
      intensivists: 24,
      patient_services: 96,
      trauma_readiness: 1,       // Certified
      specialist_consults: 94.0,
      public_transparency: 65,
      hcahps_experience: 70,
    },
  },
  {
    id: 'neuro',
    name: 'Neuro (Neurology)',
    iconName: 'Brain',
    description: 'Stroke response intervention units, epilepsy monitoring, neurosurgery, and neurodegenerative therapeutics.',
    metrics: {
      mortality_survival: 16,    // # deaths/qtr — statewide target: 12 (underperforming)
      discharge_home: 74.0,
      patient_volume: 680,
      advanced_tech: 100,          // Adopted
      nurse_staffing: 2.9,
      nurse_magnet: 80,
      intensivists: 18,
      patient_services: 82,
      trauma_readiness: 1,       // Certified
      specialist_consults: 85.0,
      public_transparency: 92,
      hcahps_experience: 72,
    },
  },
  {
    id: 'respi',
    name: 'Respi (Respiratory)',
    iconName: 'Wind',
    description: 'Pulmonary medicine, chronic obstructive disease therapy, mechanical ventilator weaning, and asthma clinics.',
    metrics: {
      mortality_survival: 11,    // # deaths/qtr
      discharge_home: 81.0,
      patient_volume: 950,
      advanced_tech: 100,          // Adopted
      nurse_staffing: 2.4,
      nurse_magnet: 78,
      intensivists: 14,
      patient_services: 80,
      trauma_readiness: 0,       // Not certified
      specialist_consults: 88.0,
      public_transparency: 80,
      hcahps_experience: 74,
    },
  },
  {
    id: 'ortho',
    name: 'Orthopedics & Joint Care',
    iconName: 'Bone',
    description: 'Joint replacement centers, spine surgical pathways, sports medicine, trauma rehabilitation, and rheumatology.',
    metrics: {
      mortality_survival: 4,     // # deaths/qtr
      discharge_home: 88.5,
      patient_volume: 1100,
      advanced_tech: 100,          // Adopted
      nurse_staffing: 2.9,
      nurse_magnet: 85,
      intensivists: 12,
      patient_services: 86,
      trauma_readiness: 1,       // Certified
      specialist_consults: 90.0,
      public_transparency: 92,
      hcahps_experience: 81,
    },
  },
  {
    id: 'urology',
    name: 'Urology & Renal Care',
    iconName: 'Activity',
    description: 'Kidney disease management, robotic prostate surgery, urologic oncology, and inpatient hemodialysis clinical pathways.',
    metrics: {
      mortality_survival: 8,     // # deaths/qtr
      discharge_home: 86.0,
      patient_volume: 640,
      advanced_tech: 100,          // Adopted
      nurse_staffing: 2.6,
      nurse_magnet: 82,
      intensivists: 14,
      patient_services: 88,
      trauma_readiness: 0,       // Not certified
      specialist_consults: 87.0,
      public_transparency: 89,
      hcahps_experience: 78,
    },
  },
  {
    id: 'geriatrics',
    name: 'Geriatrics & Senior Care',
    iconName: 'Users',
    description: 'Comprehensive acute senior care units, memory disorders, inpatient frailty assessment, and palliative clinical medicine.',
    metrics: {
      mortality_survival: 14,    // # deaths/qtr
      discharge_home: 72.0,
      patient_volume: 890,
      advanced_tech: 0,          // Not adopted
      nurse_staffing: 3.2,
      nurse_magnet: 88,
      intensivists: 16,
      patient_services: 95,
      trauma_readiness: 1,       // Certified
      specialist_consults: 93.0,
      public_transparency: 94,
      hcahps_experience: 83,
    },
  },
];

// Reference standard/baseline targets used before applying the Peer Group target modifier
export const BASELINE_TARGETS: { [metricId: string]: number } = {
  mortality_survival: 8,    // Target: 8 deaths/qtr or fewer (lower is better)
  discharge_home: 83.0,
  patient_volume: 650,
  advanced_tech: 100,       // Target: fully adopted
  nurse_staffing: 2.8,
  nurse_magnet: 80,
  intensivists: 16,
  patient_services: 82,
  trauma_readiness: 1,      // Target: certified (1 = yes)
  specialist_consults: 85.0,
  public_transparency: 82,
  hcahps_experience: 75,
};
