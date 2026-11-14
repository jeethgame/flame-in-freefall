"""
ml_model.py — Train and persist the flammability prediction models.
Run directly to regenerate model.pkl from scratch.
Physically calibrated synthetic dataset (~5000 rows).
"""
import numpy as np
import joblib
import pathlib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

MODEL_PATH = pathlib.Path(__file__).parent / "model.pkl"
RNG = np.random.default_rng(42)


def _risk(o2, pressure_psi, airflow, co2_pct, he_pct, gravity_g, fuel_enc):
    """Physically calibrated risk score 0–100.
    Per Saffire: 34% O2 at 10.2 psi gives >40% higher flammability than 21% O2 at 14.7 psi.
    Fire chemistry responds primarily to O2 mole fraction (quadratic), with a weak
    pressure boost (more moles at higher P). Pressure alone does NOT offset O2%.
    """
    # O2 mole fraction is the dominant driver (Saffire-validated)
    o2_factor = (o2 / 21.0) ** 1.45
    if o2 >= 95:
        o2_factor = 8.0
    # Pressure effect is weak: ~sqrt scaling (more oxygen moles but also more inert)
    pressure_factor = (pressure_psi / 14.7) ** 0.3
    # U-shaped airflow: peak at 5–7 cm/s in 0g, monotonic in 1g
    if gravity_g < 0.1:
        airflow_factor = 1.0 - 0.5 * abs(airflow - 6) / (airflow + 1)
    else:
        airflow_factor = 0.7 + 0.3 * min(airflow / 10, 1.5)
    # Diluents reduce risk
    diluent_suppression = 1 - 0.012 * co2_pct - 0.008 * he_pct
    diluent_suppression = max(0.1, diluent_suppression)
    # Gravity: 0g has lower peak spread but no buoyancy quench
    gravity_factor = 0.8 + 0.2 * gravity_g if gravity_g <= 1 else 1.0
    # Fuel type: 0=Gas 1=Liquid 2=Solid 3=Aerosol
    fuel_factor = [0.85, 0.95, 1.1, 0.7][min(fuel_enc, 3)]
    base = 35 * o2_factor * pressure_factor * airflow_factor * diluent_suppression * gravity_factor * fuel_factor
    return float(np.clip(base + RNG.normal(0, 2), 0, 100))


def _flame_spread(o2, pressure_psi, airflow, co2_pct, he_pct, gravity_g, fuel_enc):
    """Flame spread rate in mm/s — U-shaped vs airflow in 0g/Lunar; monotonic in Mars/1g.
    Fix: threshold at 0.25g — below that, buoyancy is negligible so low-flow radiative
    quenching applies. At >= 0.25g natural convection (~15-30 cm/s effective) keeps
    flames alive at 0 forced airflow, so the base never goes to zero.
    """
    if gravity_g < 0.25:
        # 0g and Lunar (0.16g): U-curve from ACME/BASS data
        u_shape = max(0, airflow * (25 - airflow) / 60) if airflow <= 25 else 0
        base = 1.5 * u_shape
    else:
        # Mars (0.38g) and Earth (1g): buoyancy-driven convection means 0 forced airflow
        # is still flammable; monotonically increases with forced flow up to blowoff
        base = 0.3 * min(airflow, 20) + 0.5
    o2_boost = 1 + (o2 - 21) * 0.08
    diluent_drop = max(0.1, 1 - 0.015 * co2_pct - 0.01 * he_pct)
    pressure_effect = pressure_psi / 14.7
    result = base * o2_boost * diluent_drop * pressure_effect * (1 + 0.1 * fuel_enc)
    return float(np.clip(result + RNG.normal(0, 0.3), 0, 25))


def _extinction_loc(o2, pressure_psi, airflow, co2_pct, he_pct, gravity_g, fuel_enc):
    """Minimum O2 for sustained combustion (LOC %)."""
    # 0g LOC is higher than 1g LOC
    base_loc = 15 + 3 * (1 - gravity_g)
    # CO2 raises LOC (heat absorber)
    loc = base_loc + 1.2 * co2_pct / 5 + 0.8 * he_pct / 5
    # Elevated pressure lowers LOC slightly
    loc *= (14.7 / max(pressure_psi, 1)) ** 0.15
    # Gas fuels have lower LOC than solid fuels
    fuel_adjustment = [-1.5, 0, 1.5, 0][min(fuel_enc, 3)]
    loc += fuel_adjustment
    return float(np.clip(loc + RNG.normal(0, 0.5), 8, 24))


FUEL_ENC = {"Gas": 0, "Liquid": 1, "Solid": 2, "Aerosol": 3, "Partial-Gravity": 1}


def generate_dataset(n=5000):
    rows = []
    fuel_phases = list(FUEL_ENC.keys())
    for _ in range(n):
        o2 = float(RNG.uniform(15, 100))
        pressure = float(RNG.choice([4.3, 7.3, 10.2, 14.7, 21.8]))
        airflow = float(RNG.uniform(0, 30))
        co2 = float(RNG.uniform(0, 30))
        he = float(RNG.uniform(0, 20))
        gravity = float(RNG.choice([0.0, 0.16, 0.38, 1.0]))
        fuel_phase = RNG.choice(fuel_phases)
        fuel_enc = FUEL_ENC[fuel_phase]
        rows.append({
            "o2_percent": o2,
            "pressure_psi": pressure,
            "airflow_cm_s": airflow,
            "co2_diluent_pct": co2,
            "he_diluent_pct": he,
            "gravity_g": gravity,
            "fuel_phase_enc": float(fuel_enc),
            "risk_score": _risk(o2, pressure, airflow, co2, he, gravity, fuel_enc),
            "flame_spread_mm_s": _flame_spread(o2, pressure, airflow, co2, he, gravity, fuel_enc),
            "extinction_loc_pct": _extinction_loc(o2, pressure, airflow, co2, he, gravity, fuel_enc),
        })
    return rows


FEATURE_COLS = ["o2_percent", "pressure_psi", "airflow_cm_s", "co2_diluent_pct", "he_diluent_pct", "gravity_g", "fuel_phase_enc"]
TARGET_COLS = ["risk_score", "flame_spread_mm_s", "extinction_loc_pct"]


def train():
    print("Generating synthetic training data...")
    data = generate_dataset(5000)
    X = np.array([[row[c] for c in FEATURE_COLS] for row in data])
    models = {}
    for target in TARGET_COLS:
        y = np.array([row[target] for row in data])
        pipe = Pipeline([
            ("scaler", StandardScaler()),
            ("gbr", GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.05, random_state=42)),
        ])
        pipe.fit(X, y)
        models[target] = pipe
        print(f"  Trained model for '{target}'")
    joblib.dump({"models": models, "feature_cols": FEATURE_COLS, "fuel_enc": FUEL_ENC}, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


def load_models():
    return joblib.load(MODEL_PATH)


def predict(o2_percent, pressure_psi, airflow_cm_s, co2_diluent_pct, he_diluent_pct, gravity_g, fuel_phase):
    bundle = load_models()
    fuel_enc = bundle["fuel_enc"].get(fuel_phase, 1)
    x = np.array([[o2_percent, pressure_psi, airflow_cm_s, co2_diluent_pct, he_diluent_pct, gravity_g, fuel_enc]])
    return {
        "risk_score": float(np.clip(bundle["models"]["risk_score"].predict(x)[0], 0, 100)),
        "flame_spread_mm_s": float(np.clip(bundle["models"]["flame_spread_mm_s"].predict(x)[0], 0, 25)),
        "extinction_loc_pct": float(np.clip(bundle["models"]["extinction_loc_pct"].predict(x)[0], 8, 24)),
    }


def u_curve_points(o2_percent, pressure_psi, co2_diluent_pct, he_diluent_pct, gravity_g, fuel_phase, n=12):
    """Return flame_spread_mm_s vs airflow_cm_s for plotting the U-curve."""
    airflow_range = np.linspace(0, 30, n)
    points = []
    for airflow in airflow_range:
        result = predict(o2_percent, pressure_psi, float(airflow), co2_diluent_pct, he_diluent_pct, gravity_g, fuel_phase)
        points.append({"airflow_cm_s": round(float(airflow), 1), "flame_spread_mm_s": round(result["flame_spread_mm_s"], 2)})
    return points


if __name__ == "__main__":
    if MODEL_PATH.exists():
        print(f"model.pkl already exists at {MODEL_PATH}. Delete it to retrain.")
    else:
        train()
