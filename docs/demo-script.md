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
6. Register a user with a target role.
7. Open Resume, confirm or adjust the target role, then upload a known-good PDF or TXT resume.
8. Show ATS score, missing skills, and deterministic suggestions.
9. Open Jobs to show filtered curated listings.
10. Open Top Matches to show role-aware recommendations based on the latest resume.
11. Open Notes, generate notes for a topic, and reopen the saved note from history.
12. Mention that Notes requires a valid OpenAI API key and will show a clear error if AI is unavailable.
13. Open `http://localhost:8000/docs` and `http://localhost:8000/health`.
