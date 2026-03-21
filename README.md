# FirstJob

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

FirstJob is a highly concurrent, decoupled platform designed to guide fresh graduates from resume synthesis to job discovery and skill formulation. Driven by an asynchronous backend and a feature-isolated frontend architecture, the platform strictly adheres to separation of concerns and guarantees operational resiliency gracefully scaling under load.

## Architecture Overview

At its core, FirstJob employs a modern decoupled ecosystem:
- **Client App (SPA)**: Built with React, TypeScript, and Vite. Domain logic is compartmentalized by feature (`resume`, `jobs`, `notes`) to drastically reduce coupling and enforce modularity.
- **RESTful API**: Engineered using Python and FastAPI, serving low-latency asynchronous responses through Uvicorn. Business logic is strictly segregated into dedicated core Services, isolating route controllers from operational orchestration.
- **Persistence Layer**: Powered by MongoDB, utilizing the continuous, non-blocking asynchronous `Motor` driver.
- **Resilient Integrations**: The Generative Note module delegates processing asynchronously to external APIs. A built-in gracefully degrading fallback guarantees 100% service uptime even upon third-party API token failures or rate limit triggers.

## Key Features

- **Decoupled Stateless Auth**: Secure JWT role-based authentication leveraging bcrypt password cryptography.
- **Deterministic ATS-Scoring Engine**: A custom algorithmic service that parses resumes (`.pdf` and `.txt`) to generate reproducible heuristic scores based on structural constraints, job overlays, and skill densities.
- **Algorithmic Matchmaking**: Correlates seeded database jobs dynamically against extracted parsed resume matrices.
- **Fault-Tolerant Generative Services**: Enforces strict `JSON_SCHEMA` payload validation for AI outputs to eliminate structural hallucination.
- **Automated API Contracts**: Natively generated interactive OpenAPI specifications ensuring immediate synchronization with internal Pydantic route models.

---

## Local Development Setup

### Prerequisites
Before running the local services, ensure your development environment has:
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB Server** (Running locally on port `27017`)

### 1. Database Setup
Ensure the background service for your local MongoDB instance is active. Network traffic routes to `mongodb://localhost:27017` by default.

### 2. Backend Service Pipeline

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

### 3. Frontend Client Pipeline

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
