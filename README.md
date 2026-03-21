# FirstJob

FastAPI + React + MongoDB for interview demo.

## Stack
- Backend: Python, FastAPI, Motor (MongoDB), JWT auth
- Frontend: React, TypeScript, React Router, Axios
- Data: MongoDB local
- AI: OpenAI API for notes (with fallback content)

## Implemented Features
- Email/password registration and login with access JWT
- Resume upload (`.pdf` and `.txt`) with deterministic ATS-style scoring
- Seeded jobs listing with filters and computed top matches
- AI notes generation with schema-validated output and saved history
- Swagger docs and health endpoint

## Project Structure
- `backend/` FastAPI API server
- `frontend/` React app

## Local Setup

### 1) Start MongoDB
Run a local MongoDB instance on `mongodb://localhost:27017`.

### 2) Backend
```bash
# 1. Navigate into the backend directory
cd backend

# 2. (Optional but recommended) Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# 3. Install the required Python dependencies
python -m pip install -r requirements.txt

# 4. Create your local environment file
copy .env.example .env

# 5. Populate the database with the initial dummy jobs
python scripts/seed_jobs.py

# 6. Start the FastAPI server
python -m uvicorn app.main:app --reload
```

### 3) Frontend
```bash
# 1. Navigate into the frontend directory
cd frontend

# 2. Install the Node modules
npm install

# 3. Create your local environment file
copy .env.example .env

# 4. Start the Vite development server
npm run dev
```

## Demo URLs
- Frontend: `http://localhost:5173`
- Backend docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
