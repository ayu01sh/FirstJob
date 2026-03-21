# FirstJob MVP

FastAPI + React + MongoDB MVP for interview demo.

## Stack
- Backend: Python, FastAPI, Motor (MongoDB), JWT auth
- Frontend: React, TypeScript, React Router, Axios
- Data: MongoDB local
- AI: OpenAI API for notes (with fallback content)

## Implemented MVP Features
- Email/password registration and login with access JWT
- Resume upload (`.pdf` and `.txt`) with deterministic ATS-style scoring
- Seeded jobs listing with filters and computed top matches
- AI notes generation with schema-validated output and saved history
- Swagger docs and health endpoint

## Project Structure
- `backend/` FastAPI API server
- `frontend/` React app
- `docs/api-contract.md` API contract
- `docs/demo-script.md` interview demo walkthrough

## Local Setup

### 1) Start MongoDB
Run a local MongoDB instance on `mongodb://localhost:27017`.

### 2) Backend
```bash
cd backend
python -m pip install -r requirements.txt
copy .env.example .env
python scripts/seed_jobs.py
python -m uvicorn app.main:app --reload
```

### 3) Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Demo URLs
- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
