# FirstJob

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

FirstJob is a comprehensive campus placement and hiring workspace exclusively designed for college students. Driven by an asynchronous backend and a feature-isolated frontend architecture, the platform guides students from profile readiness to resume review, role recommendations, eligible job discovery, and interview prep. Simultaneously, it empowers recruiters to source candidates and campus admins to manage student verification.

## Architecture Overview

At its core, FirstJob employs a modern decoupled ecosystem:
- **Client App (SPA)**: Built with React, TypeScript, and Vite. Domain logic is compartmentalized by feature (`resume`, `jobs`, `prep`, `applications`, `recruiter`, `admin`) to keep placement workflows modular and maintain a dense, utilitarian UI.
- **RESTful API**: Engineered using Python and FastAPI, serving low-latency asynchronous responses through Uvicorn. Business logic is strictly segregated into dedicated core Services, isolating route controllers from operational orchestration.
- **Persistence Layer**: Powered by MongoDB, utilizing the continuous, non-blocking asynchronous `Motor` driver.
- **Local AI Prep Generation**: The prep module uses the notes service and a local Ollama model with strict JSON schema validation, ensuring the app either returns structured prep material or a clear provider error.

## Key Features

- **Decoupled Stateless Auth & RBAC**: Secure JWT authentication featuring role-based access control for Students, Recruiters, and Campus Admins.
- **Student Verification Gateway**: Registration natively checks emails against a dynamic, admin-controlled College Domain Allowlist to guarantee exclusivity.
- **Eligibility-Aware Job Marketplace**: Jobs function as true campus placement opportunities with hard constraints on degree, graduation year, branches, and CGPA requirements.
- **Multi-Factor Recommendation Engine**: Scores and surfaces jobs dynamically based on skill overlap, ATS parse results, role alignment, and strict academic eligibility gates.
- **End-to-End Application Pipeline**: Students can track their application statuses and round history seamlessly.
- **Prep Engine**: Generates highly contextual interview preparation material (Flashcards, STAR stories) automatically mapped to a student's missing skills or target role.
- **Supply-Side MVP (Recruiters & Admins)**: Recruiters can post tailored jobs and manage candidate shortlists. Admins can verify students and manage participating campus domains.
- **Automated API Contracts**: Natively generated interactive OpenAPI specifications.

---

## Local Development Setup

### Prerequisites
Before running the local services, ensure your development environment has:
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB Server** (Running locally on port `27017`)
- **Ollama** with a local model available for prep generation

### 1. Database Setup
Ensure the background service for your local MongoDB instance is active. Network traffic routes to `mongodb://localhost:27017` by default.

### 2. Ollama Setup

Open a terminal before starting the backend:

```powershell
# 1. Verify Ollama is installed and available in your terminal
ollama --version

# 2. Pull the model used by the prep generator
ollama pull llama3.2

# 3. Run the model once to warm it up
ollama run llama3.2

# 4. Verify the local Ollama HTTP API is reachable
(Invoke-WebRequest -Method POST -Uri http://localhost:11434/api/generate -Body '{"model":"llama3.2","prompt":"Write 3 short prep notes on operating systems","stream":false}').Content
```

*After checking the `ollama run` output, press `Ctrl+C` to exit the interactive session.*

### 3. Backend Service Pipeline

Open a terminal at the root of the project:

```bash
# 1. Navigate into the backend directory
cd backend

# 2. Create and activate an isolated virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# 3. Install the required Python dependencies
python -m pip install -r requirements.txt

# 4. Create your local environment configuration
copy .env.example .env

# 5. Populate the database with the initial job indexing
python scripts/seed_jobs.py

# 6. Start the FastAPI server
python -m uvicorn app.main:app --reload
```
*The backend API will initialize at [http://localhost:8000](http://localhost:8000).*

### 4. Frontend Client Pipeline

Open a separate terminal session at the root of the project:

```bash
# 1. Navigate into the frontend directory
cd frontend

# 2. Install the Node modules
npm install

# 3. Create your local environment configuration
copy .env.example .env

# 4. Start the Vite development server
npm run dev
```
*The Client SPA will initialize at [http://localhost:5173](http://localhost:5173).*

---

## Application URLs
Once both servers are actively running in their respective shells:
- **Client Interface**: [http://localhost:5173](http://localhost:5173)
- **OpenAPI Schema (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **System Healthcheck Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)

## License
Distributed under the MIT License. See `LICENSE` for more information.
