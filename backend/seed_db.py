"""
seed_db.py — Creates psi.db from psi_data.json and optionally ingests CSVs from ../data/raw_psi/
"""
import json
import sqlite3
import os
import csv
import pathlib

DB_PATH = pathlib.Path(__file__).parent / "psi.db"
JSON_PATH = pathlib.Path(__file__).parent / "psi_data.json"
RAW_CSV_DIR = pathlib.Path(__file__).parent.parent / "data" / "raw_psi"


def create_tables(conn: sqlite3.Connection):
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS experiments (
        psi_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        full_name TEXT,
        hardware_rack TEXT,
        fuel_phase TEXT,
        experimental_objective TEXT,
        fuel_material TEXT,
        fuel_geometry TEXT,
        o2_percent_min REAL,
        o2_percent_max REAL,
        pressure_psi_range TEXT,
        airflow_cm_s_min REAL,
        airflow_cm_s_max REAL,
        diluents TEXT,
        gravity_regime TEXT,
        varied_parameters TEXT,
        constant_parameters TEXT,
        instrumentation TEXT,
        key_findings TEXT,
        spacecraft_safety_impact TEXT,
        earth_spinoff_application TEXT
    );

    CREATE TABLE IF NOT EXISTS experiment_runs (
        run_id INTEGER PRIMARY KEY AUTOINCREMENT,
        psi_id TEXT REFERENCES experiments(psi_id),
        o2_percent REAL,
        pressure_psi REAL,
        airflow_cm_s REAL,
        co2_diluent_pct REAL DEFAULT 0,
        he_diluent_pct REAL DEFAULT 0,
        gravity_g REAL DEFAULT 0,
        flame_spread_mm_s REAL,
        extinction_loc_pct REAL,
        risk_score REAL,
        outcome TEXT
    );
    """)
    conn.commit()


def seed_experiments(conn: sqlite3.Connection):
    with open(JSON_PATH) as f:
        experiments = json.load(f)
    for exp in experiments:
        conn.execute("""
        INSERT OR REPLACE INTO experiments VALUES (
            :psi_id, :name, :full_name, :hardware_rack, :fuel_phase,
            :experimental_objective, :fuel_material, :fuel_geometry,
            :o2_percent_min, :o2_percent_max, :pressure_psi_range,
            :airflow_cm_s_min, :airflow_cm_s_max,
            :diluents, :gravity_regime,
            :varied_parameters, :constant_parameters, :instrumentation,
            :key_findings, :spacecraft_safety_impact, :earth_spinoff_application
        )
        """, {
            **exp,
            "diluents": json.dumps(exp.get("diluents", [])),
            "varied_parameters": json.dumps(exp.get("varied_parameters", [])),
            "constant_parameters": json.dumps(exp.get("constant_parameters", [])),
            "instrumentation": json.dumps(exp.get("instrumentation", [])),
        })
    conn.commit()
    print(f"Seeded {len(experiments)} experiments.")


def ingest_raw_csvs(conn: sqlite3.Connection):
    if not RAW_CSV_DIR.exists():
        return
    files = list(RAW_CSV_DIR.glob("*.csv"))
    if not files:
        print("No CSVs found in data/raw_psi/ — skipping CSV ingest.")
        return

    for csv_path in files:
        # Expect filename like PSI-69_FLEX_runs.csv with columns matching experiment_runs
        psi_id = csv_path.stem.split("_")[0].upper()
        rows_inserted = 0
        with open(csv_path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    conn.execute("""
                    INSERT INTO experiment_runs
                        (psi_id, o2_percent, pressure_psi, airflow_cm_s,
                         co2_diluent_pct, he_diluent_pct, gravity_g,
                         flame_spread_mm_s, extinction_loc_pct, risk_score, outcome)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        psi_id,
                        float(row.get("o2_percent", 21)),
                        float(row.get("pressure_psi", 14.7)),
                        float(row.get("airflow_cm_s", 0)),
                        float(row.get("co2_diluent_pct", 0)),
                        float(row.get("he_diluent_pct", 0)),
                        float(row.get("gravity_g", 0)),
                        float(row["flame_spread_mm_s"]) if row.get("flame_spread_mm_s") else None,
                        float(row["extinction_loc_pct"]) if row.get("extinction_loc_pct") else None,
                        float(row["risk_score"]) if row.get("risk_score") else None,
                        row.get("outcome"),
                    ))
                    rows_inserted += 1
                except (ValueError, KeyError) as e:
                    print(f"  Skipping row in {csv_path.name}: {e}")
        conn.commit()
        print(f"  Ingested {rows_inserted} runs from {csv_path.name}")


if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    create_tables(conn)
    seed_experiments(conn)
    ingest_raw_csvs(conn)
    conn.close()
    print(f"Database ready: {DB_PATH}")
