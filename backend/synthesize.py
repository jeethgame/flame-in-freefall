"""
synthesize.py — AI synthesis & ranking engine.
Uses Gemini or OpenAI if key is present; deterministic local fallback otherwise.
"""
import json
import os
import pathlib
import sqlite3
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DB_PATH = pathlib.Path(__file__).parent / "psi.db"

MISSION_PRESETS = {
    "iss":       {"label": "ISS Cabin",          "o2_pct": 21,  "pressure_psi": 14.7, "gravity_g": 0,    "note": "0g microgravity baseline"},
    "moon_base": {"label": "Moon Base / Rover",  "o2_pct": 34,  "pressure_psi": 10.2, "gravity_g": 0.16, "note": ">40% higher flammability vs Earth sea level"},
    "spacesuit": {"label": "Spacesuit Airlock",  "o2_pct": 100, "pressure_psi": 4.3,  "gravity_g": 0.16, "note": "Pure O2 — extreme ignition risk, cool flames possible at trace HC contamination"},
    "mars":      {"label": "Mars Habitat",        "o2_pct": 26,  "pressure_psi": 10.2, "gravity_g": 0.38, "note": "Partial gravity; true 3/8g PSI data pending (FM2). Uses E-FIELD + 0g/1g bounds."},
    "earth":     {"label": "Earth Sea Level",     "o2_pct": 21,  "pressure_psi": 14.7, "gravity_g": 1.0,  "note": "1g reference baseline"},
}

# Keyword relevance map: words in question -> experiment names likely relevant
KEYWORD_MAP = {
    "smoke": ["SAME", "DAFT", "SPICE"],
    "dust": ["DAFT"],
    "lunar": ["ACME E-FIELD", "ACME CFI-G", "DAFT", "Saffire", "BASS-II"],
    "moon": ["ACME E-FIELD", "ACME CFI-G", "DAFT", "Saffire", "BASS-II"],
    "mars": ["ACME E-FIELD", "Saffire"],
    "liquid": ["FLEX", "FLEX-2", "CFI"],
    "droplet": ["FLEX", "FLEX-2", "CFI"],
    "cool flame": ["CFI", "FLEX", "ACME CFI-G"],
    "cool": ["CFI", "FLEX", "ACME CFI-G"],
    "solid": ["BASS", "BASS-II", "Saffire"],
    "material": ["BASS", "BASS-II", "Saffire"],
    "fabric": ["Saffire", "BASS"],
    "wire": ["BASS-II", "SAME"],
    "suppression": ["FLEX", "FLEX-2", "BASS", "BASS-II"],
    "co2": ["FLEX", "FLEX-2", "BASS-II"],
    "helium": ["FLEX", "FLEX-2"],
    "extinguish": ["FLEX", "FLEX-2", "BASS", "BASS-II"],
    "detection": ["SAME", "DAFT"],
    "detector": ["SAME", "DAFT"],
    "soot": ["SPICE", "SLICE"],
    "liftoff": ["SLICE", "SPICE"],
    "electric": ["ACME E-FIELD"],
    "partial gravity": ["ACME E-FIELD"],
    "inside-out": ["ACME CFI-G"],
    "high o2": ["ACME CFI-G", "Saffire"],
    "large scale": ["Saffire"],
    "spread": ["BASS", "BASS-II", "Saffire", "ACME E-FIELD"],
    "burning rate": ["ACME BRE", "BASS"],
    "ventilation": ["SPICE", "SLICE", "Saffire"],
    "airflow": ["SPICE", "SLICE", "BASS"],
    "iss": ["BASS", "SAME", "SPICE", "FLEX"],
    "spacesuit": ["ACME CFI-G"],
}


def _load_all_experiments():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM experiments").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def _local_rank(query: str, preset_id: Optional[str], top_k: int):
    experiments = _load_all_experiments()
    preset = MISSION_PRESETS.get(preset_id or "") if preset_id else None
    scores = {}

    for exp in experiments:
        score = 0.0
        name = exp["name"]

        # Gravity match scoring
        if preset:
            g = preset["gravity_g"]
            regime = exp["gravity_regime"].lower()
            if g == 0 and "0g" in regime:
                score += 30
            elif 0 < g < 0.5 and ("e-field" in regime or "partial" in regime.lower() or "0g" in regime):
                score += 25
            elif g >= 1.0 and "1g" in regime:
                score += 20
            # O2 overlap
            o2_target = preset["o2_pct"]
            o2_min = exp["o2_percent_min"] or 0
            o2_max = exp["o2_percent_max"] or 100
            if o2_min <= o2_target <= o2_max:
                score += 20
            elif abs(o2_target - o2_max) < 10:
                score += 10

        # Keyword match from free text question
        q_lower = query.lower() if query else ""
        for keyword, relevant_names in KEYWORD_MAP.items():
            if keyword in q_lower and name in relevant_names:
                score += 15

        # Fuel phase match
        if preset_id in ("moon_base", "spacesuit") and exp["fuel_phase"] in ("Solid", "Gas"):
            score += 10
        if preset_id == "iss" and exp["hardware_rack"] in ("MSG Flow Duct", "CIR - MDCA"):
            score += 8

        scores[exp["psi_id"]] = score

    ranked = sorted(experiments, key=lambda e: scores[e["psi_id"]], reverse=True)[:top_k]

    results = []
    for exp in ranked:
        raw_score = scores[exp["psi_id"]]
        # Normalize to 0–100
        max_possible = 100
        relevance = min(100, int(raw_score / max_possible * 100 + 40))
        takeaway = _make_takeaway(exp, preset)
        results.append({
            "psi_id": exp["psi_id"],
            "name": exp["name"],
            "full_name": exp["full_name"],
            "relevance_score": relevance,
            "takeaway": takeaway,
            "citation": f"{exp['name']} ({exp['psi_id']}) — {exp['hardware_rack']}",
            "key_findings_excerpt": exp["key_findings"][:300] + "..." if len(exp["key_findings"]) > 300 else exp["key_findings"],
            "spacecraft_safety_impact": exp["spacecraft_safety_impact"],
        })
    return results


def _make_takeaway(exp: dict, preset: Optional[dict]) -> str:
    name = exp["name"]
    impact = exp["spacecraft_safety_impact"]
    if preset:
        label = preset["label"]
        return f"For {label}: {impact[:220]}{'...' if len(impact) > 220 else ''}"
    return impact[:280] + ("..." if len(impact) > 280 else "")


async def _gemini_rank(query: str, preset_id: Optional[str], top_k: int, experiments_summary: str):
    import httpx
    api_key = os.environ.get("GEMINI_API_KEY")
    preset = MISSION_PRESETS.get(preset_id or "")
    preset_text = json.dumps(preset, indent=2) if preset else "None"
    prompt = f"""You are a NASA fire safety expert. Given the following PSI microgravity combustion experiments, rank the top {top_k} most relevant ones for the mission context below. Return a JSON array with fields: psi_id, name, relevance_score (0-100), takeaway (2 sentences), spacecraft_safety_impact.

Mission context: {preset_text}
User question: {query or "General fire safety ranking"}

Experiments:
{experiments_summary}

Return ONLY the JSON array, no markdown."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
        resp.raise_for_status()
        text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        # Strip markdown code fences if present
        text = text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        return json.loads(text)


async def rank(query: str = "", preset_id: Optional[str] = None, top_k: int = 5):
    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if gemini_key or openai_key:
        try:
            experiments = _load_all_experiments()
            summary = "\n".join(
                f"- {e['psi_id']} | {e['name']} | O2: {e['o2_percent_min']}–{e['o2_percent_max']}% | Gravity: {e['gravity_regime']} | Fuel: {e['fuel_phase']}"
                for e in experiments
            )
            if gemini_key:
                llm_results = await _gemini_rank(query, preset_id, top_k, summary)
                # Enrich with full fields from local DB
                exp_map = {e["psi_id"]: e for e in experiments}
                enriched = []
                for r in llm_results[:top_k]:
                    exp = exp_map.get(r.get("psi_id"), {})
                    enriched.append({
                        **r,
                        "citation": f"{exp.get('name', r.get('name', ''))} ({r.get('psi_id', '')}) — {exp.get('hardware_rack', '')}",
                        "key_findings_excerpt": (exp.get("key_findings", "")[:300] + "...") if exp.get("key_findings") else "",
                    })
                return enriched
        except Exception as e:
            print(f"LLM synthesis failed ({e}), falling back to local ranking.")

    return _local_rank(query, preset_id, top_k)
