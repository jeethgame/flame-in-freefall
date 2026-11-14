"""
FLAME IN FREEFALL + FIRE-X — Merged FastAPI Backend
Combines FIRE-X 892-experiment data service with our ML prediction & AI synthesis engine.
"""
import os
import sys
import json
import time
import random
import pathlib
import sqlite3
import logging
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Local imports (our ML + synthesis modules)
import ml_model
import synthesize

# FIRE-X imports (data service + combustion engine)
from data_service import (
    get_stats, query_experiments, get_experiment_by_id,
    compare_experiments as firex_compare, calculate_mission_scenario, get_investigation_rankings
)
from nasa_combustion_engine import combustion_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("firex_merged")

BASE_DIR = pathlib.Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend-firex"
IMAGES_DIR = BASE_DIR / "images"
HARDWARE_DIR = BASE_DIR / "hardware"
DB_PATH = pathlib.Path(__file__).parent / "psi.db"
MODEL_PATH = pathlib.Path(__file__).parent / "model.pkl"

app = FastAPI(title="Flame in Freefall + FIRE-X API", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic Models
# ═══════════════════════════════════════════════════════════════════════════════

class CompareRequest(BaseModel):
    experiment_ids: List[str] = Field(..., min_length=1, max_length=4)

class PredictRequest(BaseModel):
    o2_percent: float = Field(21.0, ge=5, le=100)
    pressure_psi: float = Field(14.7, ge=1, le=30)
    airflow_cm_s: float = Field(5.0, ge=0, le=50)
    co2_diluent_pct: float = Field(0.0, ge=0, le=50)
    he_diluent_pct: float = Field(0.0, ge=0, le=50)
    gravity_g: float = Field(0.0, ge=0, le=1)
    fuel_phase: str = Field("Solid")

class SynthesizeRequest(BaseModel):
    preset_id: Optional[str] = None
    question: Optional[str] = None
    top_k: int = Field(5, ge=1, le=13)

class SolidSpreadRequest(BaseModel):
    material: str = "PMMA (Cast Acrylic)"
    flow_velocity_cms: float = 8.0
    oxygen_pct: float = 21.0
    pressure_kpa: float = 101.3

class DropletExtinctionRequest(BaseModel):
    fuel: str = "n-Heptane Droplet"
    d0_mm: float = 2.5
    oxygen_pct: float = 21.0
    pressure_kpa: float = 101.3
    co2_pct: float = 0.0
    he_pct: float = 0.0

class TelemetryNodeBridgeRequest(BaseModel):
    gas_ppm: float = 45.0
    smoke_density_pct: float = 2.5
    raw_adc: int = 180
    nominal_o2_pct: float = 21.0
    nominal_pressure_kpa: float = 101.3
    target_material: str = "PMMA (Cast Acrylic)"

class SensorDataPayload(BaseModel):
    device_id: str = "ESP32-FIREX-01"
    raw_smoke_adc: int = 180
    gas_ppm: float = 45.0
    smoke_density_pct: float = 2.5
    ambient_temp_c: Optional[float] = 23.4
    estimated_o2_pct: Optional[float] = 20.9
    simulated: Optional[bool] = False

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    language: str = "en"
    page_context: Optional[Dict[str, Any]] = None

class AskAIRequest(BaseModel):
    prompt: str
    language: str = "en"
    page_context: Optional[Dict[str, Any]] = None


# ═══════════════════════════════════════════════════════════════════════════════
# FIRE-X Data Routes (892 canonical experiments)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Flame in Freefall + FIRE-X Merged API",
        "version": "3.0.0",
        "canonical_records": 892,
        "ml_model_ready": MODEL_PATH.exists(),
        "psi_db_ready": DB_PATH.exists(),
    }

@app.get("/api/stats")
def get_platform_stats():
    try:
        return {"success": True, "data": get_stats()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/experiments")
def get_experiments(
    query: Optional[str] = Query(None), family: Optional[str] = Query(None),
    fuel: Optional[str] = Query(None), outcome: Optional[str] = Query(None),
    min_o2: Optional[float] = Query(None), max_o2: Optional[float] = Query(None),
    page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("experiment_id"), sort_dir: str = Query("ASC"),
    # Legacy params from our old API
    rack: Optional[str] = Query(None), fuel_phase: Optional[str] = Query(None),
    o2_min: Optional[float] = Query(None), o2_max: Optional[float] = Query(None),
):
    try:
        return {"success": True, "data": query_experiments(
            query=query, family=family, fuel=fuel or fuel_phase, outcome=outcome,
            min_o2=min_o2 or o2_min, max_o2=max_o2 or o2_max,
            page=page, limit=limit, sort_by=sort_by, sort_dir=sort_dir
        )}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/experiments/{experiment_id}")
def get_single_experiment(experiment_id: str):
    try:
        exp = get_experiment_by_id(experiment_id)
        if not exp:
            raise HTTPException(status_code=404, detail="Experiment not found")
        return {"success": True, "data": exp}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/compare")
def compare_selected_experiments(req: CompareRequest):
    try:
        return {"success": True, "data": firex_compare(req.experiment_ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mission-scenario/{scenario_id}")
def get_scenario_metrics(scenario_id: str, custom_o2: Optional[float] = Query(None), custom_pressure: Optional[float] = Query(None)):
    try:
        return {"success": True, "data": calculate_mission_scenario(scenario_id, custom_o2=custom_o2, custom_pressure=custom_pressure)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/investigation-rankings")
def get_rankings_default(environment: str = Query("lunar_habitat")):
    try:
        return {"success": True, "data": get_investigation_rankings(environment)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/investigation-rankings/{environment_id}")
def get_rankings_by_env(environment_id: str):
    try:
        return {"success": True, "data": get_investigation_rankings(environment_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# NASA Combustion Engine Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/combustion/summary")
def get_combustion_engine_summary():
    try:
        return {"success": True, "data": combustion_engine.get_dataset_summary()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/combustion/predict-solid-flame-spread")
def predict_solid_flame_spread_api(req: SolidSpreadRequest):
    try:
        return {"success": True, "data": combustion_engine.predict_solid_flame_spread(
            material=req.material, flow_velocity_cms=req.flow_velocity_cms,
            oxygen_pct=req.oxygen_pct, pressure_kpa=req.pressure_kpa
        )}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/combustion/predict-droplet-extinction")
def predict_droplet_extinction_api(req: DropletExtinctionRequest):
    try:
        return {"success": True, "data": combustion_engine.predict_droplet_combustion(
            fuel=req.fuel, d0_mm=req.d0_mm, oxygen_pct=req.oxygen_pct,
            pressure_kpa=req.pressure_kpa, co2_pct=req.co2_pct, he_pct=req.he_pct
        )}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/combustion/telemetry-node-bridge")
def telemetry_node_bridge_api(req: TelemetryNodeBridgeRequest):
    try:
        return {"success": True, "data": combustion_engine.process_physical_telemetry_node(
            gas_ppm=req.gas_ppm, smoke_density_pct=req.smoke_density_pct,
            raw_adc=req.raw_adc, nominal_o2_pct=req.nominal_o2_pct,
            nominal_pressure_kpa=req.nominal_pressure_kpa, target_material=req.target_material
        )}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# Our ML Prediction & AI Synthesis Routes
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/mission-presets")
def mission_presets():
    return [{"id": k, **v} for k, v in synthesize.MISSION_PRESETS.items()]

@app.post("/api/predict")
def predict(req: PredictRequest):
    if not MODEL_PATH.exists():
        ml_model.train()
    result = ml_model.predict(
        req.o2_percent, req.pressure_psi, req.airflow_cm_s,
        req.co2_diluent_pct, req.he_diluent_pct, req.gravity_g, req.fuel_phase
    )
    u_curve = ml_model.u_curve_points(
        req.o2_percent, req.pressure_psi, req.co2_diluent_pct,
        req.he_diluent_pct, req.gravity_g, req.fuel_phase
    )
    risk = result["risk_score"]
    risk_label = "LOW" if risk < 30 else "MODERATE" if risk < 60 else "HIGH" if risk < 80 else "CRITICAL"
    return {**result, "risk_label": risk_label, "u_curve_points": u_curve}

@app.post("/api/synthesize")
async def synthesize_handler(req: SynthesizeRequest):
    results = await synthesize.rank(query=req.question or "", preset_id=req.preset_id, top_k=req.top_k)
    preset = synthesize.MISSION_PRESETS.get(req.preset_id or "") if req.preset_id else None
    warnings = []
    if preset:
        if preset["o2_pct"] >= 34:
            warnings.append("CAUTION " + preset["label"] + ": O2 >= 34% — material flammability >40% higher than Earth sea level (Saffire data)")
        if preset["o2_pct"] >= 90:
            warnings.append("CAUTION Pure or near-pure O2: trace hydrocarbon contamination may sustain cool flames (ACME CFI-G data)")
        if preset.get("gravity_g", 1) in (0.16, 0.38):
            warnings.append("NOTE True lunar/Martian PSI gravity data pending (LUCI, FM2 experiments). Results use ACME E-FIELD + 0g/1g bounds.")
    return {"results": results, "preset": preset, "warnings": warnings}


# ═══════════════════════════════════════════════════════════════════════════════
# AI Chat (stub — works if OPENAI_API_KEY set, else returns helpful error)
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/chat-assistant")
def chat_with_assistant(req: ChatRequest, request: Request):
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "success": True,
            "response": "AI chat requires an API key. Set OPENAI_API_KEY or GEMINI_API_KEY in backend/.env. "
                        "Meanwhile, use the Mission Ranker or Simulator tabs for data-driven insights."
        }
    try:
        from ai_service import query_ai_assistant
        messages_payload = [{"role": m["role"], "content": m["content"]} for m in req.messages]
        return query_ai_assistant(messages=messages_payload, language=req.language, page_context=req.page_context)
    except ImportError:
        return {"success": True, "response": "AI service module not available. Set OPENAI_API_KEY in .env."}
    except Exception as e:
        return {"success": True, "response": f"AI service error: {str(e)}. Check your API key."}

@app.post("/api/ask-ai")
def ask_ai_single(req: AskAIRequest, request: Request):
    return chat_with_assistant(
        ChatRequest(messages=[{"role": "user", "content": req.prompt}], language=req.language, page_context=req.page_context),
        request
    )


# ═══════════════════════════════════════════════════════════════════════════════
# IoT Sensor Simulation (ESP32 hardware demo)
# ═══════════════════════════════════════════════════════════════════════════════

LATEST_SENSOR_STATE = {
    "connected": False, "last_seen_epoch": 0, "device_id": "ESP32-FIREX-01",
    "status": "SEARCHING", "status_en": "Searching for IoT Device...",
    "raw_smoke_adc": 0, "gas_ppm": 0.0, "smoke_density_pct": 0.0,
    "ambient_temp_c": 24.0, "estimated_o2_pct": 21.0,
    "fire_hazard_index": 0.0, "hazard_level": "STANDBY",
    "advisory_en": "Searching for physical ESP32 on network.",
    "telemetry_packets_received": 0, "is_simulated": False, "sim_mode": None, "history": []
}

SIM_BASELINES = {
    "connect": {"adc": 185, "gas": 42.0, "smoke": 3.1, "temp": 23.6, "o2": 21.0},
    "trigger": {"adc": 1450, "gas": 520.0, "smoke": 64.5, "temp": 28.4, "o2": 21.4},
    "reset": {"adc": 170, "gas": 38.0, "smoke": 1.8, "temp": 23.4, "o2": 20.9},
}

def evaluate_sensor_hazard(gas_ppm, smoke_pct, o2_pct):
    x_o2 = (o2_pct or 21.0) / 100.0
    oef = (x_o2 / 0.21) ** 1.5
    fhi_base = 5.1 * oef
    gas_penalty = max(0.0, (gas_ppm - 60.0) / 75.0)
    smoke_penalty = max(0.0, smoke_pct * 0.12)
    fhi = min(10.0, max(1.0, round(fhi_base + gas_penalty + smoke_penalty, 1)))
    if fhi < 3.5:
        return fhi, "LOW", "Atmosphere stable."
    elif fhi < 6.8:
        return fhi, "NOMINAL", "Standard spacecraft baseline."
    elif fhi < 8.8:
        return fhi, "ELEVATED", "WARNING: Combustible gas/smoke surge detected!"
    else:
        return fhi, "CRITICAL", "CRITICAL: Smoke & gas exceeding threshold!"

@app.post("/api/sensor-data")
def receive_iot_sensor_data(payload: SensorDataPayload):
    now = time.time()
    fhi, lvl, adv = evaluate_sensor_hazard(payload.gas_ppm, payload.smoke_density_pct, payload.estimated_o2_pct or 21.0)
    LATEST_SENSOR_STATE.update({
        "connected": True, "is_simulated": bool(payload.simulated),
        "last_seen_epoch": now, "device_id": payload.device_id,
        "status": "HAZARD_ALERT" if lvl in ("ELEVATED", "CRITICAL") else "ONLINE",
        "status_en": f"{'[DEMO] ' if payload.simulated else ''}{'HAZARD ALERT' if lvl in ('ELEVATED', 'CRITICAL') else 'Connected (Live)'}",
        "raw_smoke_adc": payload.raw_smoke_adc, "gas_ppm": round(payload.gas_ppm, 1),
        "smoke_density_pct": round(payload.smoke_density_pct, 1),
        "ambient_temp_c": round(payload.ambient_temp_c or 24.0, 1),
        "estimated_o2_pct": round(payload.estimated_o2_pct or 21.0, 1),
        "fire_hazard_index": fhi, "hazard_level": lvl, "advisory_en": adv,
    })
    LATEST_SENSOR_STATE["telemetry_packets_received"] += 1
    history = LATEST_SENSOR_STATE.get("history", [])
    history.append({"timestamp": time.strftime("%H:%M:%S", time.localtime(now)), "gas_ppm": round(payload.gas_ppm, 1), "smoke_pct": round(payload.smoke_density_pct, 1), "fhi": fhi})
    if len(history) > 30:
        history.pop(0)
    LATEST_SENSOR_STATE["history"] = history
    return {"success": True, "data": LATEST_SENSOR_STATE}

@app.get("/api/sensor-live")
def get_live_sensor_telemetry():
    now = time.time()
    sim_mode = LATEST_SENSOR_STATE.get("sim_mode")
    if LATEST_SENSOR_STATE.get("is_simulated") and sim_mode in SIM_BASELINES:
        if now - LATEST_SENSOR_STATE.get("last_seen_epoch", 0) >= 1.1:
            base = SIM_BASELINES[sim_mode]
            jitter = 50 if sim_mode == "trigger" else 7
            receive_iot_sensor_data(SensorDataPayload(
                device_id="ESP32-DEMO", raw_smoke_adc=max(80, base["adc"] + random.randint(-jitter, jitter)),
                gas_ppm=max(15, round(base["gas"] + random.uniform(-jitter/3, jitter/3), 1)),
                smoke_density_pct=max(0.4, round(base["smoke"] + random.uniform(-2, 2), 1)),
                ambient_temp_c=base["temp"], estimated_o2_pct=base["o2"], simulated=True
            ))
    elif now - LATEST_SENSOR_STATE.get("last_seen_epoch", 0) > 10 and LATEST_SENSOR_STATE["connected"]:
        LATEST_SENSOR_STATE.update({"connected": False, "status": "SEARCHING", "status_en": "Searching for IoT Device..."})
    return {"success": True, "data": LATEST_SENSOR_STATE}

@app.post("/api/sensor-simulate")
def simulate_sensor(action: str = Query("trigger", pattern="^(trigger|reset|connect|disconnect)$")):
    if action == "disconnect":
        LATEST_SENSOR_STATE.update({"connected": False, "is_simulated": False, "sim_mode": None, "status": "SEARCHING", "history": []})
        return {"success": True, "action": action, "data": LATEST_SENSOR_STATE}
    LATEST_SENSOR_STATE["sim_mode"] = action
    base = SIM_BASELINES.get(action, SIM_BASELINES["connect"])
    receive_iot_sensor_data(SensorDataPayload(
        device_id="ESP32-DEMO", raw_smoke_adc=base["adc"], gas_ppm=base["gas"],
        smoke_density_pct=base["smoke"], ambient_temp_c=base["temp"],
        estimated_o2_pct=base["o2"], simulated=True
    ))
    return {"success": True, "action": action, "data": LATEST_SENSOR_STATE}


# ═══════════════════════════════════════════════════════════════════════════════
# Static Files + HTML Page Routes (FIRE-X frontend)
# ═══════════════════════════════════════════════════════════════════════════════

if IMAGES_DIR.exists():
    app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")

if FRONTEND_DIR.exists():
    # /static/ mount — the HTML references /static/css/, /static/js/ etc.
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static_frontend")
    # Serve locales at both paths
    locales_dir = FRONTEND_DIR / "locales"
    if locales_dir.exists():
        app.mount("/locales", StaticFiles(directory=str(locales_dir)), name="locales")

PAGE_MAP = {
    "/": "index.html", "/analytics": "analytics.html", "/explorer": "explorer.html",
    "/simulator": "simulator.html", "/hardware": "hardware.html",
    "/ai": "ai.html", "/about": "about.html",
}

def serve_page(filename: str):
    path = FRONTEND_DIR / filename
    if path.exists():
        return FileResponse(str(path), media_type="text/html", headers={"Cache-Control": "no-cache"})
    index = FRONTEND_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index), media_type="text/html")
    return JSONResponse({"error": "Page not found"}, status_code=404)

@app.get("/")
def home():
    return serve_page("index.html")

@app.get("/analytics")
def analytics():
    return serve_page("analytics.html")

@app.get("/explorer")
def explorer():
    return serve_page("explorer.html")

@app.get("/simulator")
def simulator():
    return serve_page("simulator.html")

@app.get("/hardware")
def hardware_page():
    return serve_page("hardware.html")

@app.get("/ai")
def ai_page():
    return serve_page("ai.html")

@app.get("/about")
def about_page():
    return serve_page("about.html")

@app.get("/3d_viewer.html")
def viewer_3d():
    return serve_page("3d_viewer.html")

# CSS/JS/images static mount LAST so it doesn't shadow API routes
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
