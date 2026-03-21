import json
import re

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.notes import GeneratedContent, NoteGenerateRequest


NOTES_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["title", "summary", "sections", "key_points", "flashcards"],
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "sections": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["heading", "points"],
                "properties": {
                    "heading": {"type": "string"},
                    "points": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
            },
        },
        "key_points": {
            "type": "array",
            "items": {"type": "string"},
        },
        "flashcards": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["question", "answer"],
                "properties": {
                    "question": {"type": "string"},
                    "answer": {"type": "string"},
                },
            },
        },
    },
}


class NotesServiceError(Exception):
    def __init__(self, message: str, code: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def _friendly_ollama_message(message: str) -> tuple[str, str]:
    lowered = message.lower()
    if "connection refused" in lowered or "failed to establish a new connection" in lowered or "all connection attempts failed" in lowered:
        return (
            f"Ollama is not reachable at {settings.ollama_base_url}. Start Ollama and make sure the API is available there.",
            "OLLAMA_UNREACHABLE",
        )
    if "not found" in lowered and settings.ollama_model.lower() in lowered:
        return (
            f"The Ollama model '{settings.ollama_model}' is not installed. Pull it first or change OLLAMA_MODEL.",
            "OLLAMA_MODEL_MISSING",
        )
    if "not found" in lowered or "404" in lowered:
        return (
            f"Ollama could not find the configured model '{settings.ollama_model}'. Pull it first or change OLLAMA_MODEL.",
            "OLLAMA_MODEL_MISSING",
        )
    return ("The Ollama notes provider is temporarily unavailable. Please try again later.", "OLLAMA_FAILED")


def _extract_json_payload(text: str) -> dict:
    cleaned = text.strip()
    candidates = [cleaned]

    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        candidates.append(fenced.group(1).strip())

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(cleaned[start : end + 1].strip())

    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed

    raise NotesServiceError(
        "Ollama returned notes, but the payload was not valid JSON.",
        "OLLAMA_INVALID_JSON",
        502,
    )


def _parse_generated_content(response_text: str) -> GeneratedContent:
    parsed = _extract_json_payload(response_text)
    try:
        return GeneratedContent.model_validate(parsed)
    except ValidationError as exc:
        raise NotesServiceError(
            "Ollama returned notes in an unexpected structure.",
            "OLLAMA_INVALID_SCHEMA",
            502,
        ) from exc


def _build_prompts(payload: NoteGenerateRequest) -> tuple[str, str]:
    system_prompt = (
        "You generate concise study notes for students. "
        "Return valid JSON only. Do not wrap the JSON in markdown or prose. "
        "Always include title, summary, sections, key_points, and flashcards. "
        "If the requested format is flashcards, provide at least 4 flashcards. "
        "If the requested format is bullets or outline, flashcards may be an empty array."
    )
    user_prompt = (
        f"Topic: {payload.topic}\n"
        f"Level: {payload.level}\n"
        f"Preferred format: {payload.format}\n"
        "Keep the content beginner-friendly when possible, concise, and practical."
    )
    return system_prompt, user_prompt


async def generate_notes(payload: NoteGenerateRequest) -> GeneratedContent:
    system_prompt, user_prompt = _build_prompts(payload)
    schema_prompt = (
        f"{user_prompt}\n"
        "Return JSON only and make it match this schema exactly:\n"
        f"{json.dumps(NOTES_JSON_SCHEMA)}"
    )
    body = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": schema_prompt},
        ],
        "stream": False,
        "format": NOTES_JSON_SCHEMA,
        "options": {"temperature": 0},
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            resp = await client.post(f"{settings.ollama_base_url.rstrip('/')}/api/chat", json=body)
            resp.raise_for_status()
            data = resp.json()
            response_text = data.get("message", {}).get("content")
            if not isinstance(response_text, str) or not response_text.strip():
                raise NotesServiceError("The Ollama notes model did not return structured content.", "OLLAMA_FAILED", 502)
            return _parse_generated_content(response_text)
    except NotesServiceError:
        raise
    except httpx.HTTPStatusError as exc:
        upstream_message = "The Ollama notes provider is unavailable."
        try:
            payload = exc.response.json()
            maybe_message = payload.get("error")
            if isinstance(maybe_message, str) and maybe_message.strip():
                upstream_message = maybe_message.strip()
        except ValueError:
            pass
        friendly_message, friendly_code = _friendly_ollama_message(upstream_message)
        raise NotesServiceError(friendly_message, friendly_code, 502) from exc
    except httpx.TimeoutException as exc:
        raise NotesServiceError(
            (
                "Ollama took too long to respond while generating notes. "
                "This usually means the model is still loading or the machine is under heavy load. "
                "Try again in a moment, increase OLLAMA_TIMEOUT_SECONDS, or use a smaller Ollama model."
            ),
            "OLLAMA_TIMEOUT",
            504,
        ) from exc
    except httpx.ConnectError as exc:
        friendly_message, friendly_code = _friendly_ollama_message(str(exc))
        raise NotesServiceError(friendly_message, friendly_code, 503) from exc
    except httpx.HTTPError as exc:
        friendly_message, friendly_code = _friendly_ollama_message(str(exc))
        raise NotesServiceError(friendly_message, friendly_code, 502) from exc
