from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


JobPreference = Literal["internship", "full_time", "remote"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=120)
    target_role: str = Field(min_length=2, max_length=120)
    degree: str = Field(default="", max_length=60)
    branch: str = Field(default="", max_length=60)
    graduation_year: int | None = Field(default=None, ge=2020, le=2035)
    role: str = Field(default="student")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return trimmed


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    target_role: str = Field(min_length=2, max_length=120)
    skills: list[str] = Field(default_factory=list, max_length=25)
    college_name: str | None = Field(default=None, max_length=200)
    degree: str | None = Field(default=None, max_length=60)
    branch: str | None = Field(default=None, max_length=60)
    graduation_year: int | None = Field(default=None, ge=2020, le=2035)
    cgpa: float | None = Field(default=None, ge=0, le=10)
    backlogs: int | None = Field(default=None, ge=0)
    preferred_locations: list[str] = Field(default_factory=list, max_length=10)
    job_preferences: list[JobPreference] = Field(default_factory=list, max_length=3)
    linkedin: str | None = Field(default=None, max_length=300)
    github: str | None = Field(default=None, max_length=300)
    projects_url: str | None = Field(default=None, max_length=300)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if not trimmed:
            return ""
        if len(trimmed) < 2:
            raise ValueError("Name must be at least 2 characters or left blank.")
        return trimmed
