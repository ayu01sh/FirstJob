import json
import re

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.prep import PrepGeneratedContent, PrepGenerateRequest
from app.core.db import get_db

PREP_JSON_SCHEMA = {
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

class PrepServiceError(Exception):
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

    seen = set()
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

    raise PrepServiceError(
        "Ollama returned notes, but the payload was not valid JSON.",
        "OLLAMA_INVALID_JSON",
        502,
    )

def _parse_generated_content(response_text: str) -> PrepGeneratedContent:
    parsed = _extract_json_payload(response_text)
    try:
        return PrepGeneratedContent.model_validate(parsed)
    except ValidationError as exc:
        raise PrepServiceError(
            "Ollama returned notes in an unexpected structure.",
            "OLLAMA_INVALID_SCHEMA",
            502,
        ) from exc

async def _build_prompts(payload: PrepGenerateRequest) -> tuple[str, str]:
    system_prompt = (
        "You generate structured interview preparation materials for college students. "
        "Return valid JSON only. Do not wrap the JSON in markdown or prose. "
        "Always include title, summary, sections, key_points, and flashcards. "
    )

    user_prompt = ""

    if payload.format == "study_notes":
        user_prompt = f"Create study notes for: {payload.topic}. Target Role: {payload.target_role}. Provide key concepts and examples."
    
    elif payload.format == "flashcards":
        system_prompt += " Since flashcards are requested, generate at least 10 flashcards on the topic. Provide a brief summary in the sections."
        user_prompt = f"Create flashcards for: {payload.topic}. Target Role: {payload.target_role}."
    
    elif payload.format == "oa_plan":
        user_prompt = f"Create an Online Assessment (OA) preparation plan for a {payload.target_role}. "
        if payload.missing_skills:
            user_prompt += f"Focus especially on improving these skills: {', '.join(payload.missing_skills)}. "
        user_prompt += "Include common algorithms, patterns, or technical topics to review."
    
    elif payload.format == "behavioral":
        user_prompt = (
            f"Create a behavioral interview answer using the STAR method based on the following context:\n"
            f"Project: {payload.project}\n"
            f"Challenge: {payload.challenge}\n"
            f"Action: {payload.action}\n"
            f"Result: {payload.result}\n"
            f"Theme: {payload.tag}\n"
            "Break down the Situation, Task, Action, and Result into the sections. Add common follow-up questions to the flashcards."
        )
    
    elif payload.format == "company_pack":
        job_context = ""
        if payload.job_id:
            job = await get_db().jobs.find_one({"_id": payload.job_id})
            if job:
                job_context = f"Company: {job.get('company')}. Role: {job.get('title')}. Required Skills: {', '.join(job.get('skills_required', []))}."
        user_prompt = f"Create a company interview prep pack based on this job: {job_context}. Target Role: {payload.target_role}. Include company culture, common interview rounds, and typical questions in flashcards."

    return system_prompt, user_prompt

async def generate_prep(payload: PrepGenerateRequest) -> PrepGeneratedContent:
    system_prompt, user_prompt = await _build_prompts(payload)
    schema_prompt = (
        f"{user_prompt}\n"
        "Return JSON only and make it match this schema exactly:\n"
        f"{json.dumps(PREP_JSON_SCHEMA)}"
    )
    body = {
        "model": settings.ollama_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": schema_prompt},
        ],
        "stream": False,
        "format": PREP_JSON_SCHEMA,
        "options": {"temperature": 0},
    }

    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            resp = await client.post(f"{settings.ollama_base_url.rstrip('/')}/api/chat", json=body)
            resp.raise_for_status()
            data = resp.json()
            response_text = data.get("message", {}).get("content")
            if not isinstance(response_text, str) or not response_text.strip():
                raise PrepServiceError("The Ollama notes model did not return structured content.", "OLLAMA_FAILED", 502)
            return _parse_generated_content(response_text)
    except PrepServiceError:
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
        raise PrepServiceError(friendly_message, friendly_code, 502) from exc
    except httpx.TimeoutException as exc:
        raise PrepServiceError(
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
        raise PrepServiceError(friendly_message, friendly_code, 503) from exc
    except httpx.HTTPError as exc:
        friendly_message, friendly_code = _friendly_ollama_message(str(exc))
        raise PrepServiceError(friendly_message, friendly_code, 502) from exc
