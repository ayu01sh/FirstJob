from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    target_role: str = Field(min_length=2, max_length=120)
    name: str | None = Field(default=None, max_length=120)

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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    target_role: str = Field(min_length=2, max_length=120)
    skills: list[str] = Field(default_factory=list, max_length=25)

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
