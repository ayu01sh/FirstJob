import json

import httpx

from app.core.config import settings
from app.schemas.notes import GeneratedContent, NoteGenerateRequest


def _fallback_notes(payload: NoteGenerateRequest) -> dict:
    return {
        "title": f"{payload.topic} Basics",
        "summary": f"A {payload.level} overview of {payload.topic}.",
        "sections": [
            {
                "heading": f"Introduction to {payload.topic}",
                "points": [
                    f"Core concepts of {payload.topic}",
                    "Important terminology and practical use",
                ],
            }
        ],
        "key_points": [f"{payload.topic} is best learned through short iterative practice."],
        "flashcards": [],
    }


async def generate_notes(payload: NoteGenerateRequest) -> GeneratedContent:
    if not settings.openai_api_key:
        return GeneratedContent.model_validate(_fallback_notes(payload))

    prompt = (
        "Return strict JSON only with keys: title, summary, sections, key_points, flashcards. "
        "sections is array of objects with heading and points. "
        "flashcards is array of objects with question and answer (can be empty). "
        f"Topic: {payload.topic}; Level: {payload.level}; Format: {payload.format}."
    )
    body = {
        "model": settings.openai_model,
        "input": prompt,
    }
    headers = {"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post("https://api.openai.com/v1/responses", headers=headers, json=body)
            resp.raise_for_status()
            data = resp.json()
            text = data.get("output", [{}])[0].get("content", [{}])[0].get("text", "{}")
            parsed = json.loads(text)
            return GeneratedContent.model_validate(parsed)
    except Exception:
        return GeneratedContent.model_validate(_fallback_notes(payload))
