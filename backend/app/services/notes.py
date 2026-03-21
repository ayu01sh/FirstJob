import json

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


def _extract_output_text(data: dict) -> str:
    output_text = data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    for item in data.get("output", []):
        for content in item.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text

    raise NotesServiceError("The notes model did not return structured content.", "NOTES_GENERATION_FAILED", 502)


async def generate_notes(payload: NoteGenerateRequest) -> GeneratedContent:
    if not settings.openai_api_key:
        raise NotesServiceError("The OpenAI API key is not configured.", "AI_NOT_CONFIGURED", 503)

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
    body = {
        "model": settings.openai_model,
        "input": [
            {
                "role": "system",
                "content": [{"type": "input_text", "text": system_prompt}],
            },
            {
                "role": "user",
                "content": [{"type": "input_text", "text": user_prompt}],
            },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "firstjob_notes",
                "schema": NOTES_JSON_SCHEMA,
                "strict": True,
            }
        },
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post("https://api.openai.com/v1/responses", headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            text = _extract_output_text(data)
            parsed = json.loads(text)
            return GeneratedContent.model_validate(parsed)
    except NotesServiceError:
        raise
    except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError) as exc:
        raise NotesServiceError("Notes generation failed.", "NOTES_GENERATION_FAILED", 502) from exc
