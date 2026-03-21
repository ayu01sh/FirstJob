import asyncio
import json

import pytest
from fastapi import HTTPException

import app.api.v1.auth as auth_api
import app.services.notes as notes_service
from app.core.config import settings
from app.core.security import hash_password
from app.schemas.auth import LoginRequest, ProfileUpdateRequest, RegisterRequest
from app.schemas.notes import NoteGenerateRequest
from app.services.matching import compute_matches, relevant_job_skills
from app.services.resume import analyze_resume


class FakeUsersCollection:
    def __init__(self, docs: list[dict] | None = None):
        self.docs = docs or []

    async def find_one(self, query: dict):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return doc
        return None

    async def insert_one(self, doc: dict):
        self.docs.append(doc)
        return {"inserted_id": doc["_id"]}

    async def update_one(self, query: dict, update: dict):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                for path, value in update.get("$set", {}).items():
                    cursor = doc
                    parts = path.split(".")
                    for part in parts[:-1]:
                        cursor = cursor.setdefault(part, {})
                    cursor[parts[-1]] = value
                return {"matched_count": 1}
        return {"matched_count": 0}


class FakeDB:
    def __init__(self, users: list[dict] | None = None):
        self.users = FakeUsersCollection(users)


def test_resume_analysis_is_deterministic():
    text = """
    John Doe
    john@example.com
    9999999999
    Education
    Projects
    Skills
    - React
    - FastAPI
    - MongoDB
    """
    seeded = {"react", "fastapi", "mongodb", "typescript"}
    a = analyze_resume(text, "Frontend Developer", seeded)
    b = analyze_resume(text, "Frontend Developer", seeded)
    assert a["ats_score"] == b["ats_score"]
    assert a["suggestions"] == b["suggestions"]


def test_resume_analysis_missing_skills_stay_role_relevant():
    jobs = [
        {"_id": "1", "title": "Frontend Intern", "skills_required": ["React", "TypeScript", "CSS"]},
        {"_id": "2", "title": "Backend Intern", "skills_required": ["Python", "Django", "SQL"]},
    ]
    relevant_skills = relevant_job_skills(jobs, "Frontend Developer")
    result = analyze_resume(
        """
        Jane Doe
        jane@example.com
        8888888888
        Education
        Projects
        Skills
        - React
        - CSS
        """,
        "Frontend Developer",
        relevant_skills,
    )

    assert "typescript" in result["missing_skills"]
    assert "django" not in result["missing_skills"]
    assert "sql" not in result["missing_skills"]


def test_matching_returns_top_items():
    jobs = [
        {"_id": "1", "title": "Frontend Intern", "company": "A", "skills_required": ["React", "JavaScript"]},
        {"_id": "2", "title": "Backend Intern", "company": "B", "skills_required": ["Python", "FastAPI"]},
    ]
    items = compute_matches(jobs, ["react", "javascript"], "Frontend Developer")
    assert len(items) > 0
    assert items[0]["job_id"] == "1"


def test_matching_returns_empty_without_skills():
    jobs = [{"_id": "1", "title": "Frontend Intern", "company": "A", "skills_required": ["React", "JavaScript"]}]
    assert compute_matches(jobs, [], "Frontend Developer") == []


def test_matching_filters_zero_score_items():
    jobs = [{"_id": "1", "title": "Backend Intern", "company": "A", "skills_required": ["Python", "FastAPI"]}]
    assert compute_matches(jobs, ["react"], "Frontend Developer") == []


def test_register_rejects_duplicate_email(monkeypatch):
    db = FakeDB(
        [
            {
                "_id": "existing",
                "email": "user@example.com",
                "password_hash": hash_password("password123"),
                "profile": {"target_role": "Frontend Developer", "skills": []},
            }
        ]
    )
    monkeypatch.setattr(auth_api, "get_db", lambda: db)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            auth_api.register(
                RegisterRequest(email="user@example.com", password="password123", target_role="Frontend Developer")
            )
        )

    assert exc.value.status_code == 400


def test_login_rejects_invalid_password(monkeypatch):
    db = FakeDB(
        [
            {
                "_id": "existing",
                "email": "user@example.com",
                "password_hash": hash_password("password123"),
                "profile": {"target_role": "Frontend Developer", "skills": []},
            }
        ]
    )
    monkeypatch.setattr(auth_api, "get_db", lambda: db)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(auth_api.login(LoginRequest(email="user@example.com", password="wrongpass")))

    assert exc.value.status_code == 401


def test_profile_update_persists_target_role_and_skills(monkeypatch):
    current_user = {
        "_id": "existing",
        "email": "user@example.com",
        "password_hash": hash_password("password123"),
        "profile": {"target_role": "Frontend Developer", "skills": []},
    }
    db = FakeDB([current_user])
    monkeypatch.setattr(auth_api, "get_db", lambda: db)

    result = asyncio.run(
        auth_api.update_profile(
            ProfileUpdateRequest(target_role="Backend Developer", skills=["Python", " FastAPI ", "Python"]),
            current_user=current_user,
        )
    )

    assert result["data"]["target_role"] == "Backend Developer"
    assert result["data"]["skills"] == ["FastAPI", "Python"]


def test_generate_notes_requires_openai_key(monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", "")

    with pytest.raises(notes_service.NotesServiceError) as exc:
        asyncio.run(
            notes_service.generate_notes(
                NoteGenerateRequest(topic="Operating Systems", level="beginner", format="outline")
            )
        )

    assert exc.value.code == "AI_NOT_CONFIGURED"
    assert exc.value.status_code == 503


def test_generate_notes_returns_valid_content(monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", "test-key")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "output_text": json.dumps(
                    {
                        "title": "Operating Systems Basics",
                        "summary": "Core intro",
                        "sections": [{"heading": "Intro", "points": ["One", "Two"]}],
                        "key_points": ["Kernel basics"],
                        "flashcards": [{"question": "What is an OS?", "answer": "It manages hardware and software"}],
                    }
                )
            }

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, headers: dict, json: dict):
            assert url.endswith("/v1/responses")
            assert headers["Authorization"] == "Bearer test-key"
            assert json["text"]["format"]["type"] == "json_schema"
            return FakeResponse()

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    result = asyncio.run(
        notes_service.generate_notes(
            NoteGenerateRequest(topic="Operating Systems", level="beginner", format="flashcards")
        )
    )

    assert result.title == "Operating Systems Basics"
    assert len(result.flashcards) == 1


def test_generate_notes_raises_on_invalid_payload(monkeypatch):
    monkeypatch.setattr(settings, "openai_api_key", "test-key")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"output_text": "not-json"}

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, headers: dict, json: dict):
            return FakeResponse()

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(notes_service.NotesServiceError) as exc:
        asyncio.run(
            notes_service.generate_notes(
                NoteGenerateRequest(topic="Databases", level="intermediate", format="outline")
            )
        )

    assert exc.value.code == "NOTES_GENERATION_FAILED"
    assert exc.value.status_code == 502
