#!/bin/bash
set -e

echo "=== Flame in Freefall — Starting ==="

# Backend
echo "[1/4] Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q

echo "[2/4] Seeding database..."
python seed_db.py

echo "[3/4] Training ML model (if needed)..."
python ml_model.py

echo "[4/4] Starting servers..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== Ready ==="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
