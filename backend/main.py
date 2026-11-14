"""
main.py — FastAPI backend for Flame in Freefall dashboard.
Endpoints: experiments, compare, mission-presets, predict, synthesize
"""
import json
import pathlib
import sqlite3
from typing import List, Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import ml_model
import synthesize

DB_PATH = pathlib.Path(__file__).parent / "psi.db"
MODEL_PATH = pathlib.Path(__file__).parent / "model.pkl"

app = FastAPI(title="Flame in Freefall API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _parse_json_field(value):
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    return value


def _enrich(row: dict) -> dict:
    for field in ("diluents", "varied_parameters", "constant_parameters", "instrumentation"):
        if field in row:
            row[field] = _parse_json_field(row[field])
    return row


# ── GET /api/experiments ─────────────────────────────────────────────────────

@app.get("/api/experiments")
def list_experiments(
    rack: Optional[str] = Query(None),
    fuel_phase: Optional[str] = Query(None),
    o2_min: Optional[float] = Query(None),
    o2_max: Optional[float] = Query(None),
):
    conn = get_db()
    q = "SELECT * FROM experiments WHERE 1=1"
    params = []
    if rack:
        q += " AND hardware_rack = ?"
        params.append(rack)
    if fuel_phase:
        q += " AND fuel_phase = ?"
        params.append(fuel_phase)
    if o2_min is not None:
        q += " AND o2_percent_max >= ?"
        params.append(o2_min)
    if o2_max is not None:
        q += " AND o2_percent_min <= ?"
        params.append(o2_max)
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [_enrich(dict(r)) for r in rows]


# ── GET /api/experiments/{psi_id} ────────────────────────────────────────────

@app.get("/api/experiments/{psi_id}")
def get_experiment(psi_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM experiments WHERE psi_id = ?", (psi_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"{psi_id} not found")
    return _enrich(dict(row))


# ── POST /api/compare ────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    ids: List[str] = Field(..., min_length=2, max_length=4)

COMPARE_FIELDS = [
    "psi_id", "name", "hardware_rack", "fuel_phase",
    "experimental_objective", "fuel_material", "fuel_geometry",
    "o2_percent_min", "o2_percent_max", "pressure_psi_range",
    "airflow_cm_s_min", "airflow_cm_s_max", "diluents", "gravity_regime",
    "varied_parameters", "constant_parameters", "instrumentation",
    "key_findings", "spacecraft_safety_impact",
]

@app.post("/api/compare")
def compare_experiments(req: CompareRequest):
    conn = get_db()
    placeholders = ",".join("?" * len(req.ids))
    rows = conn.execute(
        f"SELECT * FROM experiments WHERE psi_id IN ({placeholders})", req.ids
    ).fetchall()
    conn.close()
    if not rows:
        raise HTTPException(status_code=404, detail="No experiments found for given IDs")
    experiments = [_enrich(dict(r)) for r in rows]
    # Build field-keyed comparison matrix
    matrix = {}
    for field in COMPARE_FIELDS:
        matrix[field] = {exp["psi_id"]: exp.get(field) for exp in experiments}
    return {"experiments": experiments, "comparison_matrix": matrix}


# ── GET /api/mission-presets ─────────────────────────────────────────────────

@app.get("/api/mission-presets")
def mission_presets():
    return [
        {"id": k, **v} for k, v in synthesize.MISSION_PRESETS.items()
    ]


# ── POST /api/predict ────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    o2_percent: float = Field(21.0, ge=5, le=100)
    pressure_psi: float = Field(14.7, ge=1, le=30)
    airflow_cm_s: float = Field(5.0, ge=0, le=50)
    co2_diluent_pct: float = Field(0.0, ge=0, le=50)
    he_diluent_pct: float = Field(0.0, ge=0, le=50)
    gravity_g: float = Field(0.0, ge=0, le=1)
    fuel_phase: str = Field("Solid")

@app.post("/api/predict")
def predict(req: PredictRequest):
    if not MODEL_PATH.exists():
        ml_model.train()
    result = ml_model.predict(
        req.o2_percent, req.pressure_psi, req.airflow_cm_s,
        req.co2_diluent_pct, req.he_diluent_pct, req.gravity_g, req.fuel_phase
    )
    u_curve = ml_model.u_curve_points(
        req.o2_percent, req.pressure_psi,
        req.co2_diluent_pct, req.he_diluent_pct,
        req.gravity_g, req.fuel_phase
    )
    risk = result["risk_score"]
    if risk < 30:
        risk_label = "LOW"
    elif risk < 60:
        risk_label = "MODERATE"
    elif risk < 80:
        risk_label = "HIGH"
    else:
        risk_label = "CRITICAL"
    return {
        **result,
        "risk_label": risk_label,
        "u_curve_points": u_curve,
    }


# ── POST /api/synthesize ─────────────────────────────────────────────────────

class SynthesizeRequest(BaseModel):
    preset_id: Optional[str] = None
    question: Optional[str] = None
    top_k: int = Field(5, ge=1, le=13)

@app.post("/api/synthesize")
async def synthesize_handler(req: SynthesizeRequest):
    results = await synthesize.rank(
        query=req.question or "",
        preset_id=req.preset_id,
        top_k=req.top_k,
    )
    preset = synthesize.MISSION_PRESETS.get(req.preset_id or "") if req.preset_id else None
    warnings = []
    if preset:
        if preset["o2_pct"] >= 34:
            warnings.append(f"⚠ {preset['label']}: O2 ≥ 34% — material flammability >40% higher than Earth sea level (Saffire data)")
        if preset["o2_pct"] >= 90:
            warnings.append("⚠ Pure or near-pure O2: trace hydrocarbon contamination may sustain cool flames (ACME CFI-G data)")
        if preset.get("gravity_g", 1) in (0.16, 0.38):
            warnings.append("ℹ True lunar/Martian PSI gravity data pending (LUCI, FM2 experiments). Results use ACME E-FIELD + 0g/1g bounds.")
    return {"results": results, "preset": preset, "warnings": warnings}


# ── Health check ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_ready": MODEL_PATH.exists(), "db_ready": DB_PATH.exists()}
