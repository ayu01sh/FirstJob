from typing import Literal

from pydantic import BaseModel, Field


NoteFormat = Literal["bullets", "outline", "flashcards"]
NoteLevel = Literal["beginner", "intermediate", "advanced"]


class NoteGenerateRequest(BaseModel):
    topic: str = Field(min_length=2, max_length=150)
    level: NoteLevel
    format: NoteFormat


class NoteSection(BaseModel):
    heading: str
    points: list[str]


class Flashcard(BaseModel):
    question: str
    answer: str


class GeneratedContent(BaseModel):
    title: str
    summary: str
    sections: list[NoteSection]
    key_points: list[str]
    flashcards: list[Flashcard]
