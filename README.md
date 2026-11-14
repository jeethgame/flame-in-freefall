# Flame in Freefall

**SI-Powered Fire Safety Insights from Microgravity Combustion Data**

2026 NASA Space Apps Challenge Submission

---

## What It Does

An interactive dashboard that makes decades of NASA Physical Sciences Informatics (PSI) microgravity combustion data accessible to aerospace engineers, researchers, and students. It:

- **Compares 13 NASA ISS combustion investigations** across hardware racks, fuel types, and environmental conditions
- **Ranks experiments by mission relevance** for ISS, Lunar Base, Spacesuit Airlock, Mars Habitat, and Earth environments
- **Predicts flammability risk** using a ML model trained on physically-calibrated PSI data
- **Synthesizes hardware design recommendations** for next-gen fire detection, suppression, and material selection
- **Highlights Earth spinoff technologies** from microgravity combustion research

## Quick Start

### Option A: One Command (Linux/macOS/Git Bash)

```bash
cd flame-in-freefall
bash start.sh
```

### Option B: Two Terminals (Windows / any OS)

**Terminal 1 — Backend:**
```bash
cd flame-in-freefall/backend
pip install -r requirements.txt
python seed_db.py
python ml_model.py
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd flame-in-freefall/frontend
npm install --legacy-peer-deps
npm run dev
```

### Option C: Docker

```bash
cd flame-in-freefall
docker compose up --build
```

Open **http://localhost:3000**

## Architecture

```
Backend (FastAPI, port 8000)          Frontend (Next.js, port 3000)
├── psi.db (SQLite)                   ├── /explorer  — PSI Investigation Matrix
├── model.pkl (scikit-learn)          ├── /ranker    — Mission Safety Ranker
├── 6 API routes                      ├── /simulator — Flammability Simulator
│   GET  /api/experiments             ├── /hardware  — Hardware Insights
│   GET  /api/experiments/{id}        └── /spinoffs  — Earth Spinoffs
│   POST /api/compare
│   GET  /api/mission-presets
│   POST /api/predict
│   POST /api/synthesize
└── AI synthesis (Gemini/OpenAI
    or local deterministic fallback)
```

## PSI Investigations Covered

| PSI ID | Name | Hardware Rack | Fuel Phase |
|--------|------|---------------|------------|
| PSI-25 | BASS | MSG Flow Duct | Solid |
| PSI-26 | BASS-II | MSG Flow Duct | Solid |
| PSI-11 | SPICE | MSG Flow Duct | Gas |
| PSI-13 | SLICE | MSG Flow Duct | Gas |
| PSI-69 | FLEX | CIR - MDCA | Liquid |
| PSI-70 | FLEX-2 | CIR - MDCA | Liquid |
| PSI-100 | CFI | CIR - MDCA | Liquid |
| PSI-101 | ACME E-FIELD | CIR - ACME | Gas |
| PSI-102 | ACME BRE | CIR - ACME | Gas |
| PSI-159 | ACME CFI-G | CIR - ACME | Gas |
| PSI-50 | SAME / SAME-R | Free-Flyer / Cabin | Aerosol |
| PSI-51 | DAFT / DAFT-2 | Free-Flyer / Cabin | Aerosol |
| PSI-80 | Saffire I/II/III | Free-Flyer / Cabin | Solid |

## Mission Presets

| Preset | O₂ | Pressure | Gravity | Key Risk |
|--------|-----|----------|---------|----------|
| ISS Cabin | 21% | 14.7 psi | 0g | Diffusion-limited fires |
| Moon Base | 34% | 10.2 psi | 1/6g | >40% higher flammability |
| Spacesuit | 100% | 4.3 psi | 1/6g | Extreme ignition risk |
| Mars Habitat | 26% | 10.2 psi | 3/8g | Partial-g data pending |
| Earth | 21% | 14.7 psi | 1g | Reference baseline |

## ML Model

GradientBoostingRegressor trained on 5,000 physically-calibrated synthetic rows.

**Features:** O₂%, pressure, airflow, CO₂ diluent, He diluent, gravity, fuel phase

**Predictions:** Risk Score (0–100), Flame Spread Rate (mm/s), Extinction LOC (%)

**Key physics embedded:**
- U-shaped flammability corridor in 0g (radiative quenching ↔ peak ↔ convective blowoff)
- Buoyancy-driven convection sustains flames at 0 forced airflow in ≥0.25g
- O₂ effect scales quadratically above 21%
- CO₂ diluent 1.4× more effective than N₂ per mole

## Optional: AI-Enhanced Synthesis

Set one key in `backend/.env` for LLM-powered experiment ranking:

```
GEMINI_API_KEY=your-key-here
```

Without a key, the deterministic local ranking engine works fully offline.

## Data Sources

- [NASA PSI Database](https://psi.nasa.gov/physci/repo)
- Drop real NASA CSVs in `data/raw_psi/` and run `python seed_db.py` to ingest

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLite, scikit-learn
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Recharts, Lucide
- **AI:** Gemini/OpenAI (optional) with deterministic local fallback

## Scope Note

This dashboard covers microgravity combustion experiments relevant to spacecraft cabin fire safety. High-velocity rocket propulsion combustion is excluded per the PSI challenge scope (it is gravity-independent).

## License

MIT
