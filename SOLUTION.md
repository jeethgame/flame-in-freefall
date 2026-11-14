# Our Solution

**Flame in Freefall** is an interactive mission-control-style dashboard that unifies 13 NASA PSI microgravity combustion investigations into a single, queryable platform for aerospace engineers, researchers, and students.

### What it does

1. **PSI Investigation Matrix** — Browse, filter, and compare all 13 experiments side-by-side across hardware racks (MSG, CIR-MDCA, CIR-ACME, Saffire), fuel types, O₂ ranges, airflow conditions, and instrumentation.

2. **Mission Safety Ranker** — Select a mission environment (ISS, Moon Base, Spacesuit Airlock, Mars Habitat, Earth) or ask a free-text engineering question. An AI engine ranks the most relevant PSI experiments with safety warnings and citations.

3. **Flammability Simulator** — Adjust O₂ concentration (15–100%), cabin pressure, airflow velocity, diluent gases, and gravity regime via interactive sliders. A GradientBoosting ML model trained on physically-calibrated PSI data predicts ignition risk, flame spread rate, and extinction thresholds in real time — including the microgravity U-shaped flammability corridor.

4. **Hardware Insights** — Actionable engineering recommendations for fire detection (SAME/DAFT dust-vs-smoke discrimination), suppression systems (FLEX CO₂/He thresholds), and cabin material & ventilation design (Saffire, SPICE, ACME).

5. **Earth Spinoffs** — Traces how ISS combustion research produced fine-water-mist extinguishers, advanced smoke detectors, and firefighter gear standards used worldwide today.

### Key technical decisions

- **Partial-gravity bounding**: Since true Lunar/Martian PSI data doesn't exist yet, we use ACME E-FIELD electric-field flame data to interpolate between 0g and 1g bounds — clearly flagged in the UI.
- **Offline-first**: The AI synthesis engine works fully without external API keys via a deterministic local ranking fallback. No demo failures.
- **Physically calibrated ML**: The model embeds real combustion physics — buoyancy-driven vs diffusion-limited regimes, O₂ mole fraction scaling validated against Saffire's >40% flammability increase at 34% O₂.

### Tech stack

Python FastAPI + SQLite + scikit-learn (backend) · Next.js + TypeScript + Recharts (frontend)
