from typing import Literal

from pydantic import BaseModel, Field

PrepFormat = Literal["study_notes", "flashcards", "oa_plan", "behavioral", "company_pack"]


class PrepGenerateRequest(BaseModel):
    format: PrepFormat
    topic: str = Field(default="", max_length=150)
    target_role: str = Field(default="", max_length=100)
    missing_skills: list[str] = Field(default_factory=list)
    job_id: str | None = None
    
    # Context for behavioral format
    project: str | None = None
    challenge: str | None = None
    action: str | None = None
    result: str | None = None
    tag: str | None = None  # leadership, teamwork, conflict, etc.


class PrepSection(BaseModel):
    heading: str
    points: list[str]


class Flashcard(BaseModel):
    question: str
    answer: str


class PrepGeneratedContent(BaseModel):
    title: str
    summary: str
    sections: list[PrepSection]
    key_points: list[str]
    flashcards: list[Flashcard]
