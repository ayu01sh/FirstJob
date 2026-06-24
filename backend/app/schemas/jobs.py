from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

class JobCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    company: str = Field(min_length=2, max_length=150)
    location: str
    work_mode: Literal["onsite", "hybrid", "remote"]
    type: Literal["internship", "full_time"]
    ctc: str | None = None
    stipend: str | None = None
    deadline: datetime | None = None
    skills_required: list[str] = Field(default_factory=list)
    eligible_degrees: list[str] = Field(default_factory=list)
    eligible_branches: list[str] = Field(default_factory=list)
    eligible_graduation_years: list[int] = Field(default_factory=list)
    min_cgpa: float | None = None
    max_backlogs: int | None = None
    rounds: list[str] = Field(default_factory=list)
    application_link: str | None = None
