import asyncio

import pytest
from fastapi import HTTPException

import app.api.v1.auth as auth_api
import app.api.v1.notes as notes_api
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
    def __init__(self, users: list[dict] | None = None, notes: list[dict] | None = None):
        self.users = FakeUsersCollection(users)
        self.notes = FakeNotesCollection(notes)


class FakeDeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class FakeNotesCollection:
    def __init__(self, docs: list[dict] | None = None):
        self.docs = docs or []

    async def find_one(self, query: dict):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return doc
        return None

    async def delete_one(self, query: dict):
        for index, doc in enumerate(self.docs):
            if all(doc.get(key) == value for key, value in query.items()):
                self.docs.pop(index)
                return FakeDeleteResult(1)
        return FakeDeleteResult(0)


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
    items = compute_matches(jobs, ["react", "javascript"], "Frontend Developer", {}, None)
    assert len(items) > 0
    assert items[0]["job_id"] == "1"


def test_matching_returns_empty_without_skills():
    jobs = [{"_id": "1", "title": "Frontend Intern", "company": "A", "skills_required": ["React", "JavaScript"]}]
    assert compute_matches(jobs, [], "Frontend Developer", {}, None) == []


def test_matching_filters_zero_score_items():
    jobs = [{"_id": "1", "title": "Backend Intern", "company": "A", "skills_required": ["Python", "FastAPI"]}]
    assert compute_matches(jobs, ["react"], "Frontend Developer", {}, None) == []


def test_register_rejects_duplicate_email(monkeypatch):
    db = FakeDB(
        [
            {
                "_id": "existing",
                "email": "user@example.com",
                "password_hash": hash_password("password123"),
                "profile": {"name": "Existing User", "target_role": "Frontend Developer", "skills": []},
            }
        ]
    )
    monkeypatch.setattr(auth_api, "get_db", lambda: db)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            auth_api.register(
                RegisterRequest(
                    email="user@example.com",
                    password="password123",
                    target_role="Frontend Developer",
                    name="Existing User",
                )
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
                "profile": {"name": "Existing User", "target_role": "Frontend Developer", "skills": []},
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
        "profile": {"name": "Ayush", "target_role": "Frontend Developer", "skills": []},
    }
    db = FakeDB([current_user])
    monkeypatch.setattr(auth_api, "get_db", lambda: db)

    result = asyncio.run(
        auth_api.update_profile(
            ProfileUpdateRequest(
                name="Ayush Srivastava",
                target_role="Backend Developer",
                skills=["aws", " docker ", "fastapi", "git", "java", "mongodb", "python", "react", "sql"],
            ),
            current_user=current_user,
        )
    )

    assert result["data"]["name"] == "Ayush Srivastava"
    assert result["data"]["target_role"] == "Backend Developer"
    assert result["data"]["skills"] == ["AWS", "Docker", "FastAPI", "Git", "Java", "MongoDB", "Python", "React", "SQL"]


def test_profile_update_allows_blank_name(monkeypatch):
    current_user = {
        "_id": "existing",
        "email": "user@example.com",
        "password_hash": hash_password("password123"),
        "profile": {"name": "Ayush", "target_role": "Frontend Developer", "skills": []},
    }
    db = FakeDB([current_user])
    monkeypatch.setattr(auth_api, "get_db", lambda: db)

    result = asyncio.run(
        auth_api.update_profile(
            ProfileUpdateRequest(name="", target_role="Backend Developer", skills=[]),
            current_user=current_user,
        )
    )

    assert result["data"]["name"] == ""


def test_me_normalizes_existing_skill_casing():
    current_user = {
        "_id": "existing",
        "email": "user@example.com",
        "profile": {
            "name": "Ayush",
            "target_role": "Backend Developer",
            "skills": ["aws", "docker", "fastapi", "git", "java", "mongodb", "python", "react", "sql"],
        },
    }

    result = asyncio.run(auth_api.me(current_user=current_user))

    assert result["data"]["skills"] == ["AWS", "Docker", "FastAPI", "Git", "Java", "MongoDB", "Python", "React", "SQL"]


def test_delete_note_removes_saved_note(monkeypatch):
    current_user = {"_id": "user-1", "email": "user@example.com"}
    db = FakeDB(
        notes=[
            {
                "_id": "note-1",
                "user_id": "user-1",
                "topic": "Operating Systems",
                "generated_content": {},
                "created_at": "2026-03-21T00:00:00Z",
            }
        ]
    )
    monkeypatch.setattr(notes_api, "get_db", lambda: db)

    result = asyncio.run(notes_api.delete_note("note-1", current_user=current_user))

    assert result["data"]["id"] == "note-1"
    assert db.notes.docs == []


def test_delete_note_raises_when_missing(monkeypatch):
    current_user = {"_id": "user-1", "email": "user@example.com"}
    db = FakeDB(notes=[])
    monkeypatch.setattr(notes_api, "get_db", lambda: db)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(notes_api.delete_note("note-404", current_user=current_user))

    assert exc.value.status_code == 404


def test_generate_notes_returns_ollama_content(monkeypatch):
    monkeypatch.setattr(settings, "ollama_model", "llama3.2")
    monkeypatch.setattr(settings, "ollama_base_url", "http://localhost:11434")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "message": {
                    "content": """```json
                    {"title":"Computer Networks Notes","summary":"Networking basics","sections":[{"heading":"Layers","points":["OSI","TCP/IP"]}],"key_points":["Packets"],"flashcards":[{"question":"What is TCP?","answer":"A transport protocol"}]}
                    ```"""
                }
            }

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, json: dict, headers: dict | None = None):
            assert url.endswith("/api/chat")
            assert json["model"] == "llama3.2"
            assert json["format"]["type"] == "object"
            return FakeResponse()

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    result = asyncio.run(
        notes_service.generate_notes(
            NoteGenerateRequest(topic="Computer Networks", level="beginner", format="flashcards")
        )
    )

    assert result.title == "Computer Networks Notes"
    assert result.flashcards[0].question == "What is TCP?"


def test_generate_notes_raises_on_invalid_ollama_payload(monkeypatch):
    monkeypatch.setattr(settings, "ollama_model", "llama3.2")

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"message": {"content": "not-json"}}

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, json: dict):
            return FakeResponse()

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(notes_service.NotesServiceError) as exc:
        asyncio.run(
            notes_service.generate_notes(NoteGenerateRequest(topic="Databases", level="intermediate", format="outline"))
        )

    assert exc.value.code == "OLLAMA_INVALID_JSON"
    assert "Ollama returned notes" in exc.value.message


def test_generate_notes_maps_missing_ollama_model_to_friendly_message(monkeypatch):
    monkeypatch.setattr(settings, "ollama_model", "llama3.2")

    class FakeResponse:
        def __init__(self):
            self.status_code = 404

        def raise_for_status(self):
            request = notes_service.httpx.Request("POST", "http://localhost:11434/api/chat")
            response = notes_service.httpx.Response(
                404,
                request=request,
                json={"error": "model 'llama3.2' not found"},
            )
            raise notes_service.httpx.HTTPStatusError("model missing", request=request, response=response)

        def json(self):
            return {}

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, json: dict):
            return FakeResponse()

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(notes_service.NotesServiceError) as exc:
        asyncio.run(
            notes_service.generate_notes(NoteGenerateRequest(topic="Operating Systems", level="beginner", format="outline"))
        )

    assert exc.value.code == "OLLAMA_MODEL_MISSING"
    assert "not installed" in exc.value.message.lower()


def test_generate_notes_maps_connection_errors_to_friendly_message(monkeypatch):
    monkeypatch.setattr(settings, "ollama_base_url", "http://localhost:11434")

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, json: dict):
            request = notes_service.httpx.Request("POST", url)
            raise notes_service.httpx.ConnectError("connection refused", request=request)

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(notes_service.NotesServiceError) as exc:
        asyncio.run(
            notes_service.generate_notes(
                NoteGenerateRequest(topic="Computer Networks", level="beginner", format="flashcards")
            )
        )

    assert exc.value.code == "OLLAMA_UNREACHABLE"
    assert "http://localhost:11434" in exc.value.message


def test_generate_notes_maps_timeouts_to_friendly_message(monkeypatch):
    monkeypatch.setattr(settings, "ollama_timeout_seconds", 120)

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url: str, json: dict):
            request = notes_service.httpx.Request("POST", url)
            raise notes_service.httpx.ReadTimeout("timed out", request=request)

    monkeypatch.setattr(notes_service.httpx, "AsyncClient", FakeAsyncClient)

    with pytest.raises(notes_service.NotesServiceError) as exc:
        asyncio.run(
            notes_service.generate_notes(
                NoteGenerateRequest(topic="Operating Systems", level="beginner", format="outline")
            )
        )

    assert exc.value.code == "OLLAMA_TIMEOUT"
    assert exc.value.status_code == 504
    assert "increase OLLAMA_TIMEOUT_SECONDS" in exc.value.message
