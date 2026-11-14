"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Box, Paper, Typography, TextField, ToggleButtonGroup, ToggleButton,
  Slider, Button, Chip, Alert, CircularProgress, Stack,
} from "@mui/material";
import { Search, CompareArrows, CheckCircle } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import { getExperiments } from "@/lib/api";
import type { Experiment } from "@/lib/types";
import ComparePanel from "@/components/ComparePanel";

const FlowDuctScene = dynamic(() => import("@/components/three/FlowDuctScene"), { ssr: false });

const RACKS = ["MSG Flow Duct", "CIR - MDCA", "CIR - ACME", "Free-Flyer / Cabin"];
const PHASES = ["Solid", "Liquid", "Gas", "Aerosol"];

function rackColor(rack: string): "primary" | "warning" | "error" | "default" {
  if (rack.includes("ACME")) return "error";
  if (rack.includes("MDCA")) return "warning";
  if (rack.includes("MSG")) return "primary";
  return "default";
}

export default function ExplorerPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRack, setFilterRack] = useState("");
  const [filterPhase, setFilterPhase] = useState("");
  const [o2Min, setO2Min] = useState(15);
  const [o2Max, setO2Max] = useState(85);
  const [searchText, setSearchText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState<Experiment[] | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExperiments({
        rack: filterRack || undefined,
        fuel_phase: filterPhase || undefined,
        o2_min: o2Min,
        o2_max: o2Max,
      });
      setExperiments(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [filterRack, filterPhase, o2Min, o2Max]);

  useEffect(() => { load(); }, [load]);

  const filtered = searchText
    ? experiments.filter((e) => {
        const q = searchText.toLowerCase();
        return e.name.toLowerCase().includes(q) || e.psi_id.toLowerCase().includes(q) ||
          e.experimental_objective.toLowerCase().includes(q) || e.fuel_material.toLowerCase().includes(q);
      })
    : experiments;

  function toggleSelect(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  async function openCompare() {
    if (selected.length < 2) return;
    try {
      const { compareExperiments } = await import("@/lib/api");
      const result = await compareExperiments(selected);
      setComparing(result.experiments);
    } catch (e) {
      alert("Compare failed: " + String(e));
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Chip label="01" size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
        <Typography variant="h6">PSI INVESTIGATION MATRIX</Typography>
        <Typography variant="caption" sx={{ ml: "auto" }}>
          {filtered.length} INVESTIGATION{filtered.length !== 1 ? "S" : ""}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 2, alignItems: "start" }}>
        {/* Left: filters + table */}
        <Box>
          <Paper sx={{ p: 1.25, mb: 1.5 }}>
            <Typography variant="overline" sx={{ mb: 1, display: "block" }}>FILTERS</Typography>

            <TextField
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="SEARCH BY NAME, ID, OBJECTIVE, FUEL..."
              fullWidth
              size="small"
              sx={{ mb: 1.25 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 14, color: "text.disabled" }} /></InputAdornment>,
              }}
            />

            <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
              <Box>
                <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>HARDWARE RACK</Typography>
                <ToggleButtonGroup
                  value={filterRack}
                  exclusive
                  onChange={(_, v) => setFilterRack(v ?? "")}
                  size="small"
                >
                  <ToggleButton value="">ALL</ToggleButton>
                  {RACKS.map(r => (
                    <ToggleButton key={r} value={r}>
                      {r.replace("Free-Flyer / Cabin", "FREE-FLYER")}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>FUEL PHASE</Typography>
                <ToggleButtonGroup
                  value={filterPhase}
                  exclusive
                  onChange={(_, v) => setFilterPhase(v ?? "")}
                  size="small"
                >
                  <ToggleButton value="">ALL</ToggleButton>
                  {PHASES.map(p => <ToggleButton key={p} value={p}>{p.toUpperCase()}</ToggleButton>)}
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ minWidth: 200 }}>
                <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>
                  O₂ RANGE: <Box component="span" sx={{ color: "primary.main" }}>{o2Min}%</Box> — <Box component="span" sx={{ color: "primary.main" }}>{o2Max}%</Box>
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Slider value={o2Min} min={15} max={85} onChange={(_, v) => setO2Min(v as number)} />
                  <Slider value={o2Max} min={15} max={100} onChange={(_, v) => setO2Max(v as number)} />
                </Stack>
              </Box>
            </Box>
          </Paper>

          {/* Compare bar */}
          {selected.length > 0 && (
            <Alert
              severity="info"
              variant="outlined"
              sx={{ mb: 1.5, py: 0.5 }}
              action={
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" onClick={() => setSelected([])}>CLEAR</Button>
                  <Button size="small" variant="contained" onClick={openCompare} disabled={selected.length < 2} startIcon={<CompareArrows sx={{ fontSize: 12 }} />}>
                    COMPARE
                  </Button>
                </Stack>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selected.length} SELECTED — {selected.join(" · ")}
              </Typography>
            </Alert>
          )}

          {/* Table */}
          {loading ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress size={18} sx={{ color: "primary.main" }} />
            </Box>
          ) : error ? (
            <Alert severity="error" variant="outlined">
              {error}. Run: uvicorn main:app --port 8000
            </Alert>
          ) : (
            <Box>
              {/* Header row */}
              <Box sx={{
                display: "grid", gridTemplateColumns: "70px 100px 160px 1fr 90px 90px 80px 50px",
                gap: 1, px: 1.75, py: 0.75, borderBottom: 1, borderColor: "divider",
              }}>
                {["PSI ID", "NAME", "RACK", "FUEL MATERIAL", "O₂ RANGE", "AIRFLOW", "GRAVITY", "SEL"].map(h => (
                  <Typography key={h} variant="overline" sx={{ fontSize: "0.55rem" }}>{h}</Typography>
                ))}
              </Box>

              {filtered.map((exp) => {
                const isSel = selected.includes(exp.psi_id);
                return (
                  <Box
                    key={exp.psi_id}
                    onClick={() => toggleSelect(exp.psi_id)}
                    sx={{
                      display: "grid", gridTemplateColumns: "70px 100px 160px 1fr 90px 90px 80px 50px",
                      gap: 1, px: 1.75, py: 0.75, cursor: "pointer",
                      bgcolor: "background.paper",
                      borderLeft: isSel ? "2px solid" : "2px solid transparent",
                      borderLeftColor: isSel ? "primary.main" : "transparent",
                      borderBottom: 1, borderColor: "divider",
                      alignItems: "center",
                      "&:hover": { bgcolor: "#0E1525" },
                    }}
                  >
                    <Chip label={exp.psi_id} size="small" color={rackColor(exp.hardware_rack)} variant="outlined" />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{exp.name}</Typography>
                    <Typography variant="body2">{exp.hardware_rack}</Typography>
                    <Typography variant="body2" noWrap>{exp.fuel_material}</Typography>
                    <Typography variant="body1" sx={{ color: "primary.main", fontWeight: 600, fontFeatureSettings: "'tnum'" }}>
                      {exp.o2_percent_min}–{exp.o2_percent_max}%
                    </Typography>
                    <Typography variant="body2" sx={{ fontFeatureSettings: "'tnum'" }}>
                      {exp.airflow_cm_s_min}–{exp.airflow_cm_s_max}
                    </Typography>
                    <Chip label={exp.gravity_regime} size="small" variant="outlined" sx={{ fontSize: "0.5rem" }} />
                    <Box sx={{ textAlign: "center" }}>
                      {isSel && <CheckCircle sx={{ fontSize: 14, color: "primary.main" }} />}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Right: 3D viewport */}
        <Paper sx={{ position: "sticky", top: 72, minHeight: 500, p: 0, overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, pt: 1.25 }}>
            <Chip label="3D" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            <Typography variant="h6" sx={{ fontSize: "0.65rem" }}>MICROGRAVITY SCIENCE GLOVEBOX (MSG)</Typography>
          </Box>
          <FlowDuctScene />
        </Paper>
      </Box>

      {comparing && <ComparePanel experiments={comparing} onClose={() => setComparing(null)} />}
    </Box>
  );
}
