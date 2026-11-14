export interface Experiment {
  psi_id: string;
  name: string;
  full_name: string;
  hardware_rack: string;
  fuel_phase: string;
  experimental_objective: string;
  fuel_material: string;
  fuel_geometry: string;
  o2_percent_min: number;
  o2_percent_max: number;
  pressure_psi_range: string;
  airflow_cm_s_min: number;
  airflow_cm_s_max: number;
  diluents: string[];
  gravity_regime: string;
  varied_parameters: string[];
  constant_parameters: string[];
  instrumentation: string[];
  key_findings: string;
  spacecraft_safety_impact: string;
  earth_spinoff_application: string;
}

export interface MissionPreset {
  id: string;
  label: string;
  o2_pct: number;
  pressure_psi: number;
  gravity_g: number;
  note: string;
}

export interface PredictResult {
  risk_score: number;
  risk_label: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  flame_spread_mm_s: number;
  extinction_loc_pct: number;
  u_curve_points: Array<{ airflow_cm_s: number; flame_spread_mm_s: number }>;
}

export interface SynthesisResult {
  psi_id: string;
  name: string;
  full_name: string;
  relevance_score: number;
  takeaway: string;
  citation: string;
  key_findings_excerpt: string;
  spacecraft_safety_impact: string;
}

export interface SynthesizeResponse {
  results: SynthesisResult[];
  preset: MissionPreset | null;
  warnings: string[];
}
