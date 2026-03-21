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


def _friendly_upstream_message(message: str) -> tuple[str, str]:
    lowered = message.lower()
    if "quota" in lowered or "billing" in lowered or "rate limit" in lowered:
        return (
            "Notes generation is unavailable because the OpenAI API quota for this project has been exceeded.",
            "AI_QUOTA_EXCEEDED",
        )
    if "incorrect api key" in lowered or "invalid api key" in lowered or "authentication" in lowered:
        return (
            "Notes generation is unavailable because the OpenAI API key is invalid.",
            "AI_AUTH_FAILED",
        )
    if "model" in lowered and "does not exist" in lowered:
        return (
            "Notes generation is unavailable because the configured AI model could not be found.",
            "AI_MODEL_UNAVAILABLE",
        )
    return ("Notes generation is temporarily unavailable. Please try again later.", "NOTES_GENERATION_FAILED")


def _has_real_api_key(value: str) -> bool:
    normalized = value.strip()
    if not normalized:
        return False
    placeholders = {
        "replace-with-your-openai-key",
        "your_openai_key_here",
        "your-openai-key",
    }
    return normalized.lower() not in placeholders


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


def _normalize_topic(topic: str) -> str:
    return re.sub(r"\s+", " ", topic).strip().title()


def _level_phrase(level: str) -> str:
    return {
        "beginner": "a beginner-friendly foundation",
        "intermediate": "an interview-ready working understanding",
        "advanced": "a compact advanced refresher",
    }.get(level, "a practical overview")


def _local_sections(topic: str, level: str) -> list[dict]:
    return [
        {
            "heading": f"{topic}: Core Definition",
            "points": [
                f"Start with a short explanation of what {topic.lower()} means and why it matters in real projects.",
                f"Connect {topic.lower()} to { _level_phrase(level) } so the notes stay at the right depth.",
                f"Focus on the terms, components, and examples that appear most often in fresher interviews.",
            ],
        },
        {
            "heading": "Concepts to Remember",
            "points": [
                "Group the topic into 3 to 5 key ideas instead of memorizing isolated facts.",
                "Note where the concept is used in practice, what problem it solves, and one common tradeoff.",
                "Pair each concept with one short example that you could explain out loud in an interview.",
            ],
        },
        {
            "heading": "Preparation Checklist",
            "points": [
                f"Review one real-world use case of {topic.lower()} before your next application or interview round.",
                "Prepare one concise definition, one practical example, and one limitation for quick revision.",
                "Turn the trickiest concept into a flashcard and revisit it until the explanation feels natural.",
            ],
        },
    ]


def _local_key_points(topic: str, level: str) -> list[str]:
    return [
        f"{_normalize_topic(topic)} is best learned by combining definitions with simple examples.",
        f"The notes are tuned for {level} learners and prioritize clarity over exhaustive detail.",
        "Interview preparation is easier when each concept is tied to a use case, benefit, and limitation.",
        "Short revision prompts and examples are more useful than long paragraphs before an interview.",
    ]


def _local_flashcards(topic: str, level: str, fmt: str) -> list[dict]:
    base = [
        {
            "question": f"What is {topic} in simple terms?",
            "answer": f"{_normalize_topic(topic)} refers to a set of ideas or techniques used to solve a practical problem in software and systems.",
        },
        {
            "question": f"Why is {topic} important for a {level} learner?",
            "answer": f"It gives you { _level_phrase(level) } and helps you explain both theory and practical use in interviews.",
        },
        {
            "question": f"How should you revise {topic} quickly?",
            "answer": "Review the definition, key components, one example, and one tradeoff in a short sequence.",
        },
        {
            "question": f"What should you mention when answering questions about {topic}?",
            "answer": "Describe what it is, where it is used, why it helps, and one limitation or consideration.",
        },
    ]
    return base if fmt == "flashcards" else []


def _generate_local_notes(payload: NoteGenerateRequest) -> GeneratedContent:
    topic = _normalize_topic(payload.topic)
    summary = (
        f"These structured notes cover {topic} with {_level_phrase(payload.level)}. "
        "Use them for quick revision, mock interviews, and clean concept recall."
    )
    return GeneratedContent.model_validate(
        {
            "title": f"{topic} Study Notes",
            "summary": summary,
            "sections": _local_sections(topic, payload.level),
            "key_points": _local_key_points(topic, payload.level),
            "flashcards": _local_flashcards(topic, payload.level, payload.format),
        }
    )


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


async def _generate_with_openai(payload: NoteGenerateRequest) -> GeneratedContent:
    if not _has_real_api_key(settings.openai_api_key):
        raise NotesServiceError("The OpenAI API key is not configured.", "AI_NOT_CONFIGURED", 503)

    system_prompt, user_prompt = _build_prompts(payload)
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
    except httpx.HTTPStatusError as exc:
        upstream_message = "Notes generation failed."
        try:
            payload = exc.response.json()
            maybe_message = payload.get("error", {}).get("message")
            if isinstance(maybe_message, str) and maybe_message.strip():
                upstream_message = maybe_message.strip()
        except ValueError:
            pass
        friendly_message, friendly_code = _friendly_upstream_message(upstream_message)
        raise NotesServiceError(friendly_message, friendly_code, 502) from exc
    except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError) as exc:
        raise NotesServiceError("Notes generation failed.", "NOTES_GENERATION_FAILED", 502) from exc


async def _generate_with_ollama(payload: NoteGenerateRequest) -> GeneratedContent:
    system_prompt, user_prompt = _build_prompts(payload)
    body = {
        "model": settings.ollama_model,
        "system": system_prompt,
        "prompt": user_prompt,
        "stream": False,
        "format": NOTES_JSON_SCHEMA,
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(f"{settings.ollama_base_url.rstrip('/')}/api/generate", json=body)
            resp.raise_for_status()
            data = resp.json()
            response_text = data.get("response")
            if not isinstance(response_text, str) or not response_text.strip():
                raise NotesServiceError("The Ollama notes model did not return structured content.", "OLLAMA_FAILED", 502)
            parsed = json.loads(response_text)
            return GeneratedContent.model_validate(parsed)
    except (httpx.HTTPError, json.JSONDecodeError, ValidationError, ValueError, NotesServiceError) as exc:
        raise NotesServiceError("The Ollama notes provider is unavailable.", "OLLAMA_FAILED", 502) from exc


async def generate_notes(payload: NoteGenerateRequest) -> GeneratedContent:
    provider = settings.notes_provider.strip().lower() or "auto"

    if provider == "local":
        return _generate_local_notes(payload)

    if provider in {"auto", "openai"}:
        try:
            return await _generate_with_openai(payload)
        except NotesServiceError:
            if provider == "openai":
                return _generate_local_notes(payload)

    if provider in {"auto", "ollama", "openai"}:
        try:
            return await _generate_with_ollama(payload)
        except NotesServiceError:
            return _generate_local_notes(payload)

    return _generate_local_notes(payload)
