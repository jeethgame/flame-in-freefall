"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Box, Paper, Typography, Slider, Button, ButtonGroup, Chip,
  ToggleButtonGroup, ToggleButton, Alert, Grid,
} from "@mui/material";
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
  const [gravity, setGravity] = useState<number>(0);
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
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        <Chip label="03" size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: "0.6rem" }} />
        <Typography variant="h6">FLAMMABILITY & SUPPRESSION SIMULATOR</Typography>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        GRADIENTBOOSTING MODEL · PHYSICALLY-CALIBRATED PSI DATA · 5,000 SYNTHETIC TRAINING ROWS
      </Typography>

      {/* Presets */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="overline">PRESETS:</Typography>
        <ButtonGroup size="small">
          {Object.entries(PRESETS).map(([id, p]) => (
            <Button key={id} variant="outlined" onClick={() => applyPreset(id)}>{p.label}</Button>
          ))}
        </ButtonGroup>
      </Box>

      {/* 3D Viewport */}
      <Paper sx={{ height: 420, mb: 2, p: 0, overflow: "hidden", position: "relative" }}>
        <FlameCompareScene o2Percent={o2} pressurePsi={pressure} />
      </Paper>

      <Grid container spacing={2}>
        {/* Left: Controls + Results */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 1.25, mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
              <Chip label="▸" size="small" variant="outlined" color="primary" sx={{ height: 18 }} />
              <Typography variant="h6">ENVIRONMENTAL VARIABLES</Typography>
            </Box>

            <SliderRow label="O₂ CONCENTRATION" unit="%" value={o2} min={15} max={100} onChange={setO2} />
            <SliderRow label="CABIN PRESSURE" unit="PSI" value={pressure} min={4.3} max={14.7} step={0.1} onChange={setPressure} />
            <SliderRow label="FORCED AIRFLOW" unit="CM/S" value={airflow} min={0} max={30} onChange={setAirflow} />
            <SliderRow label="CO₂ DILUENT" unit="%" value={co2} min={0} max={30} onChange={setCo2} />
            <SliderRow label="HE DILUENT" unit="%" value={he} min={0} max={20} onChange={setHe} />

            <Typography variant="overline" sx={{ display: "block", mt: 1, mb: 0.5 }}>GRAVITY REGIME</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={gravity}
              onChange={(_, v) => { if (v !== null) setGravity(v); }}
            >
              {GRAVITY_OPTS.map((g) => (
                <ToggleButton key={g.value} value={g.value}>{g.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="overline" sx={{ display: "block", mt: 1, mb: 0.5 }}>FUEL PHASE</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={fuelPhase}
              onChange={(_, v) => { if (v !== null) setFuelPhase(v); }}
              sx={{
                "& .Mui-selected": {
                  color: "warning.main !important",
                  borderColor: "warning.dark !important",
                  borderLeft: "2px solid",
                  borderLeftColor: "warning.main !important",
                },
              }}
            >
              {FUEL_OPTS.map((f) => (
                <ToggleButton key={f} value={f}>{f}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Paper>

          {error ? (
            <Alert severity="error" variant="outlined" sx={{ fontSize: "0.65rem" }}>
              BACKEND OFFLINE — RUN: python -m uvicorn main:app --port 8000
            </Alert>
          ) : result && (
            <Paper sx={{ p: 1.25, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <RiskGauge score={result.risk_score} label={result.risk_label} />
              <Box sx={{ width: "100%", mt: 0.5 }}>
                <MetricRow label="FLAME SPREAD RATE" value={`${result.flame_spread_mm_s.toFixed(2)} MM/S`} color="primary.main" />
                <MetricRow label="MIN. EXTINCTION O₂ (LOC)" value={`${result.extinction_loc_pct.toFixed(1)}%`} color="warning.main" />
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Right: Chart + Notes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 1.25, mb: 1.5 }}>
            {result ? (
              <UCurveChart points={result.u_curve_points} extinctionLoc={result.extinction_loc_pct} currentAirflow={airflow} />
            ) : (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="body2">AWAITING DATA...</Typography>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
              <Chip label="i" size="small" variant="outlined" color="primary" sx={{ height: 18 }} />
              <Typography variant="h6">PHYSICS NOTES</Typography>
            </Box>

            <MetricRow label="0G & LUNAR (<0.25G)" value="DIFFUSION-LIMITED" color="primary.main" />
            <Typography variant="caption" sx={{ display: "block", mb: 0.75 }}>
              NO BUOYANCY → RADIATIVE QUENCH AT ~0 CM/S · PEAK SPREAD 4–8 CM/S · BLOWOFF &gt;15 CM/S
            </Typography>

            <MetricRow label="MARS & EARTH (≥0.25G)" value="BUOYANCY-DRIVEN" color="warning.main" />
            <Typography variant="caption" sx={{ display: "block", mb: 0.75 }}>
              NATURAL CONVECTION ~15–30 CM/S SUSTAINS FLAMES AT 0 FORCED AIRFLOW · RISK MONOTONIC
            </Typography>

            <Alert severity="warning" variant="outlined" sx={{ fontSize: "0.6rem", mt: 0.75 }}>
              MOON BASE 34% O₂: &gt;40% HIGHER FLAMMABILITY PER SAFFIRE · PARTIAL-G USES E-FIELD + 0G/1G BOUNDS (LUCI/FM2 PENDING)
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function SliderRow({ label, unit, value, min, max, step, onChange }: {
  label: string; unit: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void;
}) {
  const display = typeof step === "number" && step < 1 ? value.toFixed(1) : String(value);
  return (
    <Box sx={{ mb: 1.25 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.25 }}>
        <Typography variant="overline">{label}</Typography>
        <Typography variant="body1" sx={{ fontWeight: 700, color: "text.primary", fontFeatureSettings: "'tnum'" }}>
          {display}<Typography component="span" variant="caption" sx={{ ml: 0.5 }}>{unit}</Typography>
        </Typography>
      </Box>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(_, v) => onChange(v as number)}
        size="small"
      />
    </Box>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, py: 0.25 }}>
      <Typography variant="overline" sx={{ whiteSpace: "nowrap" }}>{label}</Typography>
      <Box sx={{ flex: 1, borderBottom: "1px dotted", borderColor: "divider", mb: 0.4 }} />
      <Typography variant="body1" sx={{ fontWeight: 600, color, fontFeatureSettings: "'tnum'", whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );
}
