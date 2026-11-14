"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Box, Paper, Typography, TextField, Button, Chip, Alert,
  Card, CardActionArea, CardContent, CircularProgress, Stack,
} from "@mui/material";
import { Send, Info } from "@mui/icons-material";
import { InputAdornment } from "@mui/material";
import { synthesize, getMissionPresets } from "@/lib/api";
import type { MissionPreset, SynthesisResult } from "@/lib/types";

const LunarHabitatScene = dynamic(() => import("@/components/three/LunarHabitatScene"), { ssr: false });

function scoreColor(s: number) {
  if (s >= 80) return "primary.main";
  if (s >= 60) return "warning.main";
  return "text.disabled";
}

export default function RankerPage() {
  const [presets, setPresets] = useState<MissionPreset[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState<SynthesisResult[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getMissionPresets().then(setPresets).catch(() => {}); }, []);

  async function runSynthesize(presetId?: string, q?: string) {
    setLoading(true); setError(null);
    try {
      const res = await synthesize({ preset_id: presetId, question: q, top_k: 6 });
      setResults(res.results); setWarnings(res.warnings);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  function selectPreset(id: string) {
    setActivePreset(id); setQuestion(""); runSynthesize(id);
  }

  function submitQuestion() {
    if (!question.trim()) return;
    setActivePreset(null); runSynthesize(undefined, question);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Chip label="02" size="small" variant="outlined" color="primary" sx={{ fontWeight: 700 }} />
        <Typography variant="h6">MISSION SAFETY RANKER</Typography>
      </Box>
      <Typography variant="body2" sx={{ mb: 2 }}>
        SELECT A MISSION ENVIRONMENT OR SUBMIT AN ENGINEERING QUERY. AI RANKS RELEVANT PSI INVESTIGATIONS.
      </Typography>

      {/* Presets */}
      <Typography variant="overline" sx={{ mb: 1, display: "block" }}>MISSION ENVIRONMENT PRESETS</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 0.75, mb: 2 }}>
        {presets.map((p) => {
          const active = activePreset === p.id;
          return (
            <Card
              key={p.id}
              sx={{
                borderLeft: active ? "2px solid" : "2px solid transparent",
                borderLeftColor: active ? "primary.main" : "transparent",
              }}
            >
              <CardActionArea onClick={() => selectPreset(p.id)} sx={{ p: 1.25 }}>
                <Typography variant="body1" sx={{
                  fontWeight: 700, mb: 1,
                  color: active ? "primary.main" : "text.primary",
                  letterSpacing: "0.06em",
                }}>
                  {p.label.toUpperCase()}
                </Typography>

                <Stack spacing={0.25}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption">O2</Typography>
                    <Typography variant="body2" sx={{
                      fontWeight: 600, fontFeatureSettings: "'tnum'",
                      color: p.o2_pct >= 34 ? "error.main" : "primary.main",
                    }}>
                      {p.o2_pct}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption">PRESSURE</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFeatureSettings: "'tnum'" }}>
                      {p.pressure_psi} psi
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption">GRAVITY</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFeatureSettings: "'tnum'" }}>
                      {p.gravity_g}g
                    </Typography>
                  </Box>
                </Stack>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      {/* Query input */}
      <Paper sx={{ p: 1.25, mb: 2 }}>
        <Typography variant="overline" sx={{ mb: 1, display: "block" }}>ENGINEERING QUERY</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitQuestion()}
            placeholder="e.g. CO2 suppression at reduced gravity"
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            size="small"
            onClick={submitQuestion}
            disabled={!question.trim() || loading}
            endIcon={<Send sx={{ fontSize: 12 }} />}
            sx={{ px: 2 }}
          >
            QUERY
          </Button>
        </Stack>
      </Paper>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {warnings.map((w, i) => (
            <Alert
              key={i}
              severity={w.startsWith("⚠") ? "warning" : "info"}
              variant="outlined"
              sx={{ py: 0 }}
              icon={<Info sx={{ fontSize: 14 }} />}
            >
              <Typography variant="body2" sx={{ color: "inherit" }}>
                {w.replace(/^[⚠ℹ]\s*/, "")}
              </Typography>
            </Alert>
          ))}
        </Stack>
      )}

      {/* Results */}
      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 3, color: "text.disabled" }}>
          <CircularProgress size={14} color="primary" />
          <Typography variant="body2">RANKING PSI EXPERIMENTS...</Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" variant="outlined">
          {error}. VERIFY BACKEND: python -m uvicorn main:app --port 8000
        </Alert>
      ) : results.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {/* Ranked results */}
          <Box>
            <Typography variant="overline" sx={{ mb: 1.25, display: "block" }}>
              TOP RELEVANT INVESTIGATIONS · {results.length} RESULTS
            </Typography>
            <Stack spacing={0.75}>
              {results.map((r, i) => (
                <Paper key={r.psi_id} sx={{ p: 1.25, display: "grid", gridTemplateColumns: "48px 1fr", gap: 1.5 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                    <Typography variant="caption">RANK</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                      {String(i + 1).padStart(2, "0")}
                    </Typography>
                    <Box sx={{ width: 36, height: 36, position: "relative", mt: 0.5 }}>
                      <svg viewBox="0 0 40 40" width={36} height={36}>
                        <circle cx={20} cy={20} r={16} fill="none" stroke="#1e293b" strokeWidth={2} />
                        <circle cx={20} cy={20} r={16} fill="none" strokeWidth={2}
                          stroke={r.relevance_score >= 80 ? "#06B6D4" : r.relevance_score >= 60 ? "#F59E0B" : "#475569"}
                          strokeDasharray={`${(r.relevance_score / 100) * 100.5} 100.5`}
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      <Typography variant="caption" sx={{
                        position: "absolute", inset: 0, display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 700, fontSize: "0.6rem",
                        color: r.relevance_score >= 80 ? "primary.main" : r.relevance_score >= 60 ? "warning.main" : "text.disabled",
                      }}>
                        {r.relevance_score}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75, flexWrap: "wrap" }}>
                      <Chip label={r.psi_id} size="small" color="primary" variant="outlined" />
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{r.name}</Typography>
                      <Typography variant="body2">{r.full_name}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>{r.takeaway}</Typography>
                    {r.key_findings_excerpt && (
                      <Box sx={{ bgcolor: "background.default", p: 1, mb: 1, borderLeft: 2, borderColor: "divider" }}>
                        <Typography variant="overline" sx={{ mb: 0.5, display: "block", fontSize: "0.5rem" }}>KEY FINDINGS</Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{r.key_findings_excerpt}</Typography>
                      </Box>
                    )}
                    <Typography variant="caption">SRC: {r.citation}</Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>

          {/* 3D viewport */}
          <Paper sx={{ position: "relative", minHeight: 450, p: 0, overflow: "hidden" }}>
            <LunarHabitatScene />
          </Paper>
        </Box>
      ) : (
        <Paper sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 0.5 }}>AWAITING INPUT</Typography>
          <Typography variant="body2">SELECT A MISSION PRESET OR SUBMIT A QUERY TO RANK PSI EXPERIMENTS</Typography>
        </Paper>
      )}
    </Box>
  );
}
