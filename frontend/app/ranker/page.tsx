"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { synthesize, getMissionPresets } from "@/lib/api";
import type { MissionPreset, SynthesisResult } from "@/lib/types";

const LunarHabitatScene = dynamic(() => import("@/components/three/LunarHabitatScene"), { ssr: false });

function scoreColor(s: number) {
  if (s >= 80) return "var(--teal)";
  if (s >= 60) return "var(--amber)";
  return "var(--label)";
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
    <div>
      {/* Header */}
      <div className="sec-header" style={{ marginBottom: 4 }}>
        <span className="sec-num">02</span>
        MISSION SAFETY RANKER
      </div>
      <p style={{ color: "var(--text)", fontSize: 11, marginBottom: 20 }}>
        SELECT A MISSION ENVIRONMENT OR SUBMIT AN ENGINEERING QUERY. AI RANKS RELEVANT PSI INVESTIGATIONS.
      </p>

      {/* ── Mission Presets ───────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>
          MISSION ENVIRONMENT PRESETS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 }}>
          {presets.map((p) => {
            const active = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => selectPreset(p.id)}
                className="mc-card"
                style={{
                  cursor: "pointer", textAlign: "left",
                  borderColor: active ? "var(--teal-dim)" : "var(--border-dim)",
                  background: active ? "var(--card-alt)" : "var(--card)",
                }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 700, marginBottom: 8,
                  color: active ? "var(--teal)" : "var(--text-bright)",
                  letterSpacing: "0.06em",
                }}>
                  {p.label.toUpperCase()}
                </div>
                <div className="leader-row">
                  <span className="lr-label">O2</span>
                  <span className="lr-dots" />
                  <span className={`lr-value ${p.o2_pct >= 34 ? "red" : "teal"}`}>{p.o2_pct}%</span>
                </div>
                <div className="leader-row">
                  <span className="lr-label">PRESSURE</span>
                  <span className="lr-dots" />
                  <span className="lr-value">{p.pressure_psi} psi</span>
                </div>
                <div className="leader-row">
                  <span className="lr-label">GRAVITY</span>
                  <span className="lr-dots" />
                  <span className="lr-value">{p.gravity_g}g</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Free text query ───────────────────────────── */}
      <div className="mc-card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>
          ENGINEERING QUERY
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitQuestion()}
            placeholder="e.g. CO2 suppression at reduced gravity"
            style={{
              flex: 1, padding: "7px 10px",
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 3, color: "var(--value)", fontSize: 11,
              fontFamily: "var(--mono)", outline: "none",
              letterSpacing: "0.03em",
            }}
          />
          <button
            onClick={submitQuestion}
            disabled={!question.trim() || loading}
            style={{
              background: "var(--teal-glow)", border: "1px solid var(--teal-dim)",
              color: "var(--teal)", borderRadius: 3, padding: "7px 14px",
              cursor: "pointer", fontSize: 10, fontWeight: 700,
              fontFamily: "var(--mono)", letterSpacing: "0.1em",
            }}
          >
            QUERY
          </button>
        </div>
      </div>

      {/* ── Warnings ──────────────────────────────────── */}
      {warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
          {warnings.map((w, i) => (
            <div key={i} className={`mc-alert ${w.startsWith("⚠") ? "amber" : "teal"}`}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>
                {w.startsWith("⚠") ? "CAUTION" : "NOTE"}
              </span>
              <span>{w.replace(/^[⚠ℹ]\s*/, "")}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Results ───────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 24, color: "var(--label)" }}>
          <Loader2 size={14} className="spin" color="var(--teal)" />
          <span style={{ fontSize: 11, letterSpacing: "0.08em" }}>RANKING PSI EXPERIMENTS...</span>
        </div>
      ) : error ? (
        <div className="mc-alert red">
          CONSOLE ERROR — {error}. VERIFY BACKEND: python -m uvicorn main:app --port 8000
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Left: ranked results */}
          <div>
            <div style={{
              fontSize: 9, color: "var(--label)", letterSpacing: "0.1em",
              fontWeight: 600, marginBottom: 10,
            }}>
              TOP RELEVANT INVESTIGATIONS · {results.length} RESULTS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {results.map((r, i) => (
                <div key={r.psi_id} className="mc-card" style={{
                  display: "grid", gridTemplateColumns: "52px 1fr", gap: 12,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", fontWeight: 600 }}>RANK</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-bright)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div style={{ marginTop: 4, width: 40, height: 40, position: "relative" }}>
                      <svg viewBox="0 0 40 40" width={40} height={40}>
                        <circle cx={20} cy={20} r={16} fill="none" stroke="var(--border)" strokeWidth={2} />
                        <circle cx={20} cy={20} r={16} fill="none" stroke={scoreColor(r.relevance_score)} strokeWidth={2} strokeDasharray={`${(r.relevance_score / 100) * 100.5} 100.5`} strokeLinecap="round" transform="rotate(-90 20 20)" />
                      </svg>
                      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: scoreColor(r.relevance_score) }}>
                        {r.relevance_score}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="mc-tag teal">{r.psi_id}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-bright)" }}>{r.name}</span>
                      <span style={{ fontSize: 10, color: "var(--label)" }}>{r.full_name}</span>
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.6, marginBottom: 8 }}>{r.takeaway}</p>
                    {r.key_findings_excerpt && (
                      <div style={{ background: "var(--bg)", borderRadius: 3, padding: "8px 10px", marginBottom: 8, borderLeft: "2px solid var(--border)" }}>
                        <div style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>KEY FINDINGS</div>
                        <p style={{ fontSize: 10, color: "var(--text)", lineHeight: 1.6 }}>{r.key_findings_excerpt}</p>
                      </div>
                    )}
                    <div style={{ fontSize: 9, color: "var(--label)", letterSpacing: "0.06em" }}>SRC: {r.citation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Lunar Habitat viewport */}
          <div className="mc-card" style={{ position: "relative", minHeight: 450, padding: 0, overflow: "hidden" }}>
            <LunarHabitatScene />
          </div>
        </div>
      ) : (
        <div className="mc-card" style={{ textAlign: "center", padding: 32, color: "var(--label)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", fontWeight: 600 }}>
            AWAITING INPUT
          </div>
          <div style={{ fontSize: 11, marginTop: 6, color: "var(--text)" }}>
            SELECT A MISSION PRESET OR SUBMIT A QUERY TO RANK PSI EXPERIMENTS
          </div>
        </div>
      )}
    </div>
  );
}
