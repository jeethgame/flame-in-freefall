"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface UCurveChartProps {
  points: Array<{ airflow_cm_s: number; flame_spread_mm_s: number }>;
  extinctionLoc: number;
  currentAirflow: number;
}

export default function UCurveChart({ points, extinctionLoc, currentAirflow }: UCurveChartProps) {
  return (
    <div>
      <div className="sec-header" style={{ marginBottom: 8 }}>
        <span className="sec-num">U</span>
        <span>FLAME SPREAD VS AIRFLOW</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--label)" }}>
          LOC: {extinctionLoc.toFixed(1)}% O₂
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={points} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="airflow_cm_s"
            tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
            label={{ value: "AIRFLOW (CM/S)", position: "insideBottom", offset: -2, fill: "#475569", fontSize: 9 }}
          />
          <YAxis
            tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
            label={{ value: "MM/S", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 9 }}
          />
          <Tooltip
            contentStyle={{ background: "#111820", border: "1px solid #1e293b", borderRadius: 3, fontSize: 11, fontFamily: "JetBrains Mono" }}
            labelFormatter={(v) => `${v} cm/s`}
            formatter={(v: unknown) => [`${Number(v).toFixed(2)} mm/s`, "SPREAD"]}
          />
          <ReferenceLine x={currentAirflow} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: "▼", fill: "#F59E0B", fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="flame_spread_mm_s"
            stroke="#06B6D4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#06B6D4", stroke: "#111820", strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 9, color: "var(--label)", marginTop: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        0G: NEAR-ZERO → RADIATIVE QUENCH · PEAK 4–8 CM/S · HIGH → BLOWOFF
      </p>
    </div>
  );
}
