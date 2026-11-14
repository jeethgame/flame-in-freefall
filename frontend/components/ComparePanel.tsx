"use client";
import type { Experiment } from "@/lib/types";
import Badge from "./ui/Badge";

interface ComparePanelProps {
  experiments: Experiment[];
  onClose: () => void;
}

const ROWS: { key: keyof Experiment; label: string }[] = [
  { key: "experimental_objective", label: "OBJECTIVE" },
  { key: "fuel_material", label: "FUEL MATERIAL" },
  { key: "fuel_geometry", label: "FUEL GEOMETRY" },
  { key: "o2_percent_min", label: "O₂ MIN (%)" },
  { key: "o2_percent_max", label: "O₂ MAX (%)" },
  { key: "pressure_psi_range", label: "PRESSURE (PSI)" },
  { key: "airflow_cm_s_min", label: "AIRFLOW MIN (CM/S)" },
  { key: "airflow_cm_s_max", label: "AIRFLOW MAX (CM/S)" },
  { key: "gravity_regime", label: "GRAVITY REGIME" },
  { key: "varied_parameters", label: "VARIED PARAMETERS" },
  { key: "constant_parameters", label: "CONSTANT PARAMETERS" },
  { key: "instrumentation", label: "INSTRUMENTATION" },
  { key: "spacecraft_safety_impact", label: "SAFETY IMPACT" },
];

function renderVal(v: unknown): React.ReactNode {
  if (Array.isArray(v)) {
    return v.map((item, i) => (
      <span key={i} style={{ display: "block", fontSize: 11, color: "var(--text-bright)" }}>{String(item)}</span>
    ));
  }
  if (v == null) return <span style={{ color: "var(--label)" }}>—</span>;
  return <span style={{ fontSize: 11, color: "var(--text-bright)" }}>{String(v)}</span>;
}

export default function ComparePanel({ experiments, onClose }: ComparePanelProps) {
  if (!experiments.length) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(8,12,18,0.92)", zIndex: 100,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        overflowY: "auto", padding: "32px 16px",
      }}
      onClick={onClose}
    >
      <div
        className="mc-card"
        style={{ width: "100%", maxWidth: 1100, padding: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="sec-header" style={{ margin: 0 }}>
            <span className="sec-num">⇔</span>
            EXPERIMENT COMPARISON
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "1px solid var(--border)", borderRadius: 3,
              color: "var(--label)", cursor: "pointer", padding: "2px 8px", fontSize: 10,
              letterSpacing: "0.08em",
            }}
          >
            ESC · CLOSE
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{
                  padding: "6px 10px", textAlign: "left", fontSize: 9, color: "var(--label)",
                  borderBottom: "1px solid var(--border)", letterSpacing: "0.1em",
                  textTransform: "uppercase", width: 140,
                }}>
                  FIELD
                </th>
                {experiments.map((exp) => (
                  <th key={exp.psi_id} style={{ padding: "6px 10px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Badge label={exp.psi_id} variant="teal" />
                        <Badge label={exp.hardware_rack} variant="muted" />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--value)" }}>{exp.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(({ key, label }) => (
                <tr key={key} style={{ borderBottom: "1px solid var(--border-dim)" }}>
                  <td style={{
                    padding: "6px 10px", fontSize: 9, color: "var(--label)", fontWeight: 600,
                    verticalAlign: "top", letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    {label}
                  </td>
                  {experiments.map((exp) => (
                    <td key={exp.psi_id} style={{ padding: "6px 10px", verticalAlign: "top" }}>
                      {renderVal(exp[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
