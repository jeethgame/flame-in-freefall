"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { predict } from "@/lib/api";
import type { PredictResult } from "@/lib/types";
import RiskGauge from "@/components/RiskGauge";
import UCurveChart from "@/components/UCurveChart";

const FlameCompareScene = dynamic(() => import("@/components/three/FlameCompareScene"), { ssr: false });

const GRAVITY_OPTS = [
  { value: 0,    label: "0G" },
  { value: 0.16, label: "LUNAR" },
  { value: 0.38, label: "MARS" },
  { value: 1.0,  label: "EARTH" },
];
const FUEL_OPTS = ["Solid", "Liquid", "Gas", "Aerosol"];
const PRESETS: Record<string, { o2: number; pressure: number; gravity: number; label: string }> = {
  iss:       { o2: 21,  pressure: 14.7, gravity: 0,    label: "ISS" },
  moon_base: { o2: 34,  pressure: 10.2, gravity: 0.16, label: "MOON" },
  spacesuit: { o2: 100, pressure: 4.3,  gravity: 0.16, label: "SUIT" },
  mars:      { o2: 26,  pressure: 10.2, gravity: 0.38, label: "MARS" },
  earth:     { o2: 21,  pressure: 14.7, gravity: 1.0,  label: "EARTH" },
};

export default function SimulatorPage() {
  const [o2, setO2] = useState(21);
  const [pressure, setPressure] = useState(14.7);
  const [airflow, setAirflow] = useState(5);
  const [co2, setCo2] = useState(0);
  const [he, setHe] = useState(0);
  const [gravity, setGravity] = useState(0);
  const [fuelPhase, setFuelPhase] = useState("Solid");
  const [result, setResult] = useState<PredictResult | null>(null);
  const [error, setError] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        setError(false);
        const res = await predict({
          o2_percent: o2, pressure_psi: pressure, airflow_cm_s: airflow,
          co2_diluent_pct: co2, he_diluent_pct: he, gravity_g: gravity, fuel_phase: fuelPhase,
        });
        setResult(res);
      } catch { setError(true); }
    }, 300);
    return () => clearTimeout(debounce.current);
  }, [o2, pressure, airflow, co2, he, gravity, fuelPhase]);

  function applyPreset(id: string) {
    const p = PRESETS[id];
    setO2(p.o2); setPressure(p.pressure); setGravity(p.gravity);
  }

  return (
    <div>
      {/* Header */}
      <div className="sec-header" style={{ marginBottom: 4 }}>
        <span className="sec-num">03</span>
        <span>FLAMMABILITY &amp; SUPPRESSION SIMULATOR</span>
      </div>
      <p style={{ color: "var(--label)", fontSize: 10, marginBottom: 16, letterSpacing: "0.06em" }}>
        GRADIENTBOOSTING MODEL · PHYSICALLY-CALIBRATED PSI DATA · 5,000 SYNTHETIC TRAINING ROWS
      </p>

      {/* Presets */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em" }}>PRESETS:</span>
        {Object.entries(PRESETS).map(([id, p]) => (
          <button
            key={id}
            onClick={() => applyPreset(id)}
            style={{
              background: "var(--card)", border: "1px solid var(--border-dim)",
              borderRadius: 3, padding: "3px 8px", fontSize: 9, fontWeight: 600,
              color: "var(--text)", cursor: "pointer", fontFamily: "var(--mono)",
              letterSpacing: "0.08em",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 3D Flame Comparison Viewport */}
      <div className="mc-card" style={{ height: 420, marginBottom: 16, position: "relative", padding: 0, overflow: "hidden" }}>
        <FlameCompareScene o2Percent={o2} pressurePsi={pressure} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16 }}>
        {/* ── Left Column: Controls + Results ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Sliders */}
          <div className="mc-card">
            <div className="sec-header" style={{ marginBottom: 10 }}>
              <span className="sec-num">▸</span>
              <span>ENVIRONMENTAL VARIABLES</span>
            </div>
            <SliderRow label="O₂ CONCENTRATION" unit="%" value={o2} min={15} max={100} onChange={setO2} />
            <SliderRow label="CABIN PRESSURE" unit="PSI" value={pressure} min={4.3} max={14.7} step={0.1} onChange={setPressure} />
            <SliderRow label="FORCED AIRFLOW" unit="CM/S" value={airflow} min={0} max={30} onChange={setAirflow} />
            <SliderRow label="CO₂ DILUENT" unit="%" value={co2} min={0} max={30} onChange={setCo2} />
            <SliderRow label="HE DILUENT" unit="%" value={he} min={0} max={20} onChange={setHe} />

            {/* Gravity */}
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>GRAVITY REGIME</span>
              <div style={{ display: "flex", gap: 4 }}>
                {GRAVITY_OPTS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGravity(g.value)}
                    style={{
                      background: gravity === g.value ? "var(--teal-glow)" : "transparent",
                      border: `1px solid ${gravity === g.value ? "var(--teal-dim)" : "var(--border)"}`,
                      color: gravity === g.value ? "var(--teal)" : "var(--label)",
                      borderRadius: 3, padding: "2px 8px", fontSize: 9, fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--mono)", letterSpacing: "0.08em",
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fuel */}
            <div>
              <span style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>FUEL PHASE</span>
              <div style={{ display: "flex", gap: 4 }}>
                {FUEL_OPTS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFuelPhase(f)}
                    style={{
                      background: fuelPhase === f ? "var(--amber-glow)" : "transparent",
                      border: `1px solid ${fuelPhase === f ? "#8a6e20" : "var(--border)"}`,
                      color: fuelPhase === f ? "var(--amber)" : "var(--label)",
                      borderRadius: 3, padding: "2px 8px", fontSize: 9, fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--mono)", letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {error ? (
            <div className="mc-alert red" style={{ fontSize: 10 }}>
              ⚠ BACKEND OFFLINE — RUN: python -m uvicorn main:app --port 8000
            </div>
          ) : result && (
            <div className="mc-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <RiskGauge score={result.risk_score} label={result.risk_label} />
              <div style={{ width: "100%", marginTop: 4 }}>
                <div className="leader-row">
                  <span className="lr-label">FLAME SPREAD RATE</span>
                  <span className="lr-dots" />
                  <span className="lr-value teal">{result.flame_spread_mm_s.toFixed(2)} MM/S</span>
                </div>
                <div className="leader-row">
                  <span className="lr-label">MIN. EXTINCTION O₂ (LOC)</span>
                  <span className="lr-dots" />
                  <span className="lr-value amber">{result.extinction_loc_pct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Chart + Notes ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="mc-card">
            {result ? (
              <UCurveChart
                points={result.u_curve_points}
                extinctionLoc={result.extinction_loc_pct}
                currentAirflow={airflow}
              />
            ) : (
              <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--label)", fontSize: 10 }}>
                AWAITING DATA...
              </div>
            )}
          </div>

          <div className="mc-card">
            <div className="sec-header" style={{ marginBottom: 6 }}>
              <span className="sec-num">i</span>
              <span>PHYSICS NOTES</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--text)", lineHeight: 1.7 }}>
              <div className="leader-row" style={{ borderBottom: "1px solid var(--border-dim)", paddingBottom: 4, marginBottom: 4 }}>
                <span className="lr-label" style={{ color: "var(--teal)" }}>0G &amp; LUNAR (&lt;0.25G)</span>
                <span className="lr-dots" />
                <span className="lr-value" style={{ fontSize: 9, color: "var(--text)", fontWeight: 400 }}>DIFFUSION-LIMITED</span>
              </div>
              <p style={{ marginBottom: 6, color: "var(--label)", fontSize: 9 }}>
                NO BUOYANCY → RADIATIVE QUENCH AT ~0 CM/S · PEAK SPREAD 4–8 CM/S · BLOWOFF &gt;15 CM/S
              </p>
              <div className="leader-row" style={{ borderBottom: "1px solid var(--border-dim)", paddingBottom: 4, marginBottom: 4 }}>
                <span className="lr-label" style={{ color: "var(--amber)" }}>MARS &amp; EARTH (≥0.25G)</span>
                <span className="lr-dots" />
                <span className="lr-value" style={{ fontSize: 9, color: "var(--text)", fontWeight: 400 }}>BUOYANCY-DRIVEN</span>
              </div>
              <p style={{ marginBottom: 6, color: "var(--label)", fontSize: 9 }}>
                NATURAL CONVECTION ~15–30 CM/S SUSTAINS FLAMES AT 0 FORCED AIRFLOW · RISK MONOTONIC
              </p>
              <div className="mc-alert amber" style={{ marginTop: 6, fontSize: 9 }}>
                ⚠ MOON BASE 34% O₂: &gt;40% HIGHER FLAMMABILITY PER SAFFIRE · PARTIAL-G USES E-FIELD + 0G/1G BOUNDS (LUCI/FM2 PENDING)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, unit, value, min, max, step, onChange }: {
  label: string; unit: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.08em" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--value)", fontFamily: "var(--mono)" }}>
          {typeof step === "number" && step < 1 ? value.toFixed(1) : value}
          <span style={{ fontSize: 9, color: "var(--label)", marginLeft: 3 }}>{unit}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step ?? 1}
        value={value} onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}
