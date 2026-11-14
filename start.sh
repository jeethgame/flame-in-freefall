#!/bin/bash
set -e

echo "=== Flame in Freefall + FIRE-X — Starting ==="

cd backend
pip install -r requirements.txt -q

echo "[1/3] Seeding databases..."
python seed_db.py

echo "[2/3] Training ML model (if needed)..."
python ml_model.py

echo "[3/3] Starting merged API server..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Open http://localhost:8000 in your browser
