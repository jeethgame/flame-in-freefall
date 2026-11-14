"use client";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { getExperiments } from "@/lib/api";
import type { Experiment } from "@/lib/types";
import ComparePanel from "@/components/ComparePanel";

const FlowDuctScene = dynamic(() => import("@/components/three/FlowDuctScene"), { ssr: false });

const RACKS = ["MSG Flow Duct", "CIR - MDCA", "CIR - ACME", "Free-Flyer / Cabin"];
const PHASES = ["Solid", "Liquid", "Gas", "Aerosol"];

function tagVariant(rack: string) {
  if (rack.includes("ACME")) return "red";
  if (rack.includes("MDCA")) return "amber";
  if (rack.includes("MSG")) return "teal";
  return "muted";
}

function phaseVariant(p: string) {
  return p === "Solid" ? "amber" : p === "Liquid" ? "teal" : p === "Gas" ? "teal" : "muted";
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
        return e.name.toLowerCase().includes(q) ||
          e.psi_id.toLowerCase().includes(q) ||
          e.experimental_objective.toLowerCase().includes(q) ||
          e.fuel_material.toLowerCase().includes(q);
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
    <div>
      {/* Section header */}
      <div className="sec-header" style={{ marginBottom: 16 }}>
        <span className="sec-num">01</span>
        PSI INVESTIGATION MATRIX
        <span style={{ marginLeft: "auto", color: "var(--label)", fontSize: 9 }}>
          {filtered.length} INVESTIGATION{filtered.length !== 1 ? "S" : ""}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, alignItems: "start" }}>
      {/* ── Left column: filters + table ── */}
      <div>

      {/* Filters panel */}
      <div className="mc-card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ color: "var(--label)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
            FILTERS
          </span>
        </div>

        {/* Search */}
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="SEARCH BY NAME, ID, OBJECTIVE, FUEL..."
          style={{
            width: "100%", padding: "6px 10px", marginBottom: 10,
            background: "var(--bg)", border: "1px solid var(--border-dim)", borderRadius: 3,
            color: "var(--text-bright)", fontSize: 10, letterSpacing: "0.05em",
            outline: "none", fontFamily: "var(--mono)",
          }}
        />

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Rack */}
          <div>
            <div style={{ color: "var(--label)", fontSize: 9, letterSpacing: "0.1em", marginBottom: 4, fontWeight: 600 }}>HARDWARE RACK</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Chip label="ALL" active={!filterRack} onClick={() => setFilterRack("")} />
              {RACKS.map(r => <Chip key={r} label={r.replace("Free-Flyer / Cabin", "FREE-FLYER")} active={filterRack === r} onClick={() => setFilterRack(r === filterRack ? "" : r)} />)}
            </div>
          </div>

          {/* Phase */}
          <div>
            <div style={{ color: "var(--label)", fontSize: 9, letterSpacing: "0.1em", marginBottom: 4, fontWeight: 600 }}>FUEL PHASE</div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Chip label="ALL" active={!filterPhase} onClick={() => setFilterPhase("")} />
              {PHASES.map(p => <Chip key={p} label={p.toUpperCase()} active={filterPhase === p} onClick={() => setFilterPhase(p === filterPhase ? "" : p)} />)}
            </div>
          </div>

          {/* O2 range */}
          <div style={{ minWidth: 200 }}>
            <div style={{ color: "var(--label)", fontSize: 9, letterSpacing: "0.1em", marginBottom: 4, fontWeight: 600 }}>
              O₂ RANGE: <span style={{ color: "var(--teal)" }}>{o2Min}%</span> — <span style={{ color: "var(--teal)" }}>{o2Max}%</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="range" min={15} max={85} value={o2Min} onChange={(e) => setO2Min(Number(e.target.value))} style={{ flex: 1 }} />
              <input type="range" min={15} max={100} value={o2Max} onChange={(e) => setO2Max(Number(e.target.value))} style={{ flex: 1 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Compare bar */}
      {selected.length > 0 && (
        <div className="mc-alert teal" style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10 }}>◈ {selected.length} SELECTED — {selected.join(" · ")}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setSelected([])} style={ghostBtn}>CLEAR</button>
            <button onClick={openCompare} disabled={selected.length < 2} style={primaryBtn}>COMPARE</button>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--label)", fontSize: 10 }}>LOADING INVESTIGATIONS...</div>
      ) : error ? (
        <div className="mc-alert red">⚠ {error}. Run: uvicorn main:app --port 8000</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "70px 100px 160px 1fr 90px 90px 80px 60px",
            gap: 8, padding: "6px 14px",
            color: "var(--label)", fontSize: 9, letterSpacing: "0.1em", fontWeight: 600,
            textTransform: "uppercase", borderBottom: "1px solid var(--border)",
          }}>
            <span>PSI ID</span>
            <span>NAME</span>
            <span>RACK</span>
            <span>FUEL MATERIAL</span>
            <span>O₂ RANGE</span>
            <span>AIRFLOW</span>
            <span>GRAVITY</span>
            <span style={{ textAlign: "center" }}>SEL</span>
          </div>

          {filtered.map((exp) => {
            const isSel = selected.includes(exp.psi_id);
            return (
              <div
                key={exp.psi_id}
                onClick={() => toggleSelect(exp.psi_id)}
                style={{
                  display: "grid", gridTemplateColumns: "70px 100px 160px 1fr 90px 90px 80px 60px",
                  gap: 8, padding: "8px 14px", cursor: "pointer",
                  background: isSel ? "var(--teal-glow)" : "var(--card)",
                  borderLeft: isSel ? "2px solid var(--teal)" : "2px solid transparent",
                  borderBottom: "1px solid var(--border-dim)",
                  transition: "background 0.1s",
                  alignItems: "center",
                }}
              >
                <span className={`mc-tag ${tagVariant(exp.hardware_rack)}`}>{exp.psi_id}</span>
                <span style={{ color: "var(--text-bright)", fontWeight: 600, fontSize: 11 }}>{exp.name}</span>
                <span style={{ color: "var(--label)", fontSize: 10 }}>{exp.hardware_rack}</span>
                <span style={{ color: "var(--text)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {exp.fuel_material}
                </span>
                <span style={{ color: "var(--teal)", fontSize: 11, fontWeight: 600 }}>
                  {exp.o2_percent_min}–{exp.o2_percent_max}%
                </span>
                <span style={{ color: "var(--text)", fontSize: 10 }}>
                  {exp.airflow_cm_s_min}–{exp.airflow_cm_s_max}
                </span>
                <span className={`mc-tag muted`} style={{ fontSize: 8 }}>{exp.gravity_regime}</span>
                <span style={{ textAlign: "center" }}>
                  {isSel && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 16, height: 16, borderRadius: 2,
                      background: "var(--teal)", color: "var(--bg)",
                      fontSize: 9, fontWeight: 700,
                    }}>
                      {selected.indexOf(exp.psi_id) + 1}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      </div>

      {/* ── Right column: 3D viewport ── */}
      <div className="mc-card" style={{ position: "relative", minHeight: 500, padding: 0, overflow: "hidden", position: "sticky", top: 80 }}>
        <div className="sec-header" style={{ padding: "10px 14px 0", marginBottom: 0 }}>
          <span className="sec-num">3D</span>
          MICROGRAVITY SCIENCE GLOVEBOX (MSG)
        </div>
        <FlowDuctScene />
      </div>

      </div>{/* end grid */}

      {comparing && <ComparePanel experiments={comparing} onClose={() => setComparing(null)} />}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--teal-glow)" : "transparent",
        border: `1px solid ${active ? "var(--teal-dim)" : "var(--border-dim)"}`,
        color: active ? "var(--teal)" : "var(--label)",
        borderRadius: 2, padding: "2px 8px", fontSize: 9, cursor: "pointer",
        fontFamily: "var(--mono)", fontWeight: 600, letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </button>
  );
}

const ghostBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid var(--border)", color: "var(--label)",
  borderRadius: 2, padding: "3px 10px", fontSize: 9, cursor: "pointer",
  fontFamily: "var(--mono)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
};
const primaryBtn: React.CSSProperties = {
  background: "var(--teal-glow)", border: "1px solid var(--teal-dim)", color: "var(--teal)",
  borderRadius: 2, padding: "3px 10px", fontSize: 9, cursor: "pointer",
  fontFamily: "var(--mono)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
};
