# FirstJob 7-Minute Demo Script

1. Start MongoDB locally.
2. Start backend:
   - `cd backend`
   - `python -m uvicorn app.main:app --reload`
3. Seed jobs in a second terminal:
   - `cd backend`
   - `python scripts/seed_jobs.py`
4. Start frontend:
   - `cd frontend`
   - `npm run dev`
5. Open app at `http://localhost:5173`.
6. Register a user with target role.
7. Upload a known-good PDF or TXT resume and show ATS score + suggestions.
8. Open Jobs and then Top Matches to show deterministic recommendations.
9. Open Notes, generate notes for a topic, and show notes history.
10. Open `http://localhost:8000/docs` and `http://localhost:8000/health`.
