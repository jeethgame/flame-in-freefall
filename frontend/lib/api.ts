import type { Experiment, MissionPreset, PredictResult, SynthesizeResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${path}: ${res.status} — ${text}`);
  }
  return res.json() as Promise<T>;
}

export function getExperiments(params?: {
  rack?: string;
  fuel_phase?: string;
  o2_min?: number;
  o2_max?: number;
}): Promise<Experiment[]> {
  const qs = new URLSearchParams();
  if (params?.rack) qs.set("rack", params.rack);
  if (params?.fuel_phase) qs.set("fuel_phase", params.fuel_phase);
  if (params?.o2_min != null) qs.set("o2_min", String(params.o2_min));
  if (params?.o2_max != null) qs.set("o2_max", String(params.o2_max));
  const q = qs.toString();
  return apiFetch<Experiment[]>(`/experiments${q ? `?${q}` : ""}`);
}

export function getExperiment(psiId: string): Promise<Experiment> {
  return apiFetch<Experiment>(`/experiments/${psiId}`);
}

export function compareExperiments(ids: string[]): Promise<{
  experiments: Experiment[];
  comparison_matrix: Record<string, Record<string, unknown>>;
}> {
  return apiFetch("/compare", { method: "POST", body: JSON.stringify({ ids }) });
}

export function getMissionPresets(): Promise<MissionPreset[]> {
  return apiFetch<MissionPreset[]>("/mission-presets");
}

export function predict(params: {
  o2_percent: number;
  pressure_psi: number;
  airflow_cm_s: number;
  co2_diluent_pct: number;
  he_diluent_pct: number;
  gravity_g: number;
  fuel_phase: string;
}): Promise<PredictResult> {
  return apiFetch<PredictResult>("/predict", { method: "POST", body: JSON.stringify(params) });
}

export function synthesize(params: {
  preset_id?: string;
  question?: string;
  top_k?: number;
}): Promise<SynthesizeResponse> {
  return apiFetch<SynthesizeResponse>("/synthesize", { method: "POST", body: JSON.stringify(params) });
}
