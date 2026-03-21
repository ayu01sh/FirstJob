from typing import Any

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str
    details: list[str] = Field(default_factory=list)


class APIResponse(BaseModel):
    message: str
    data: Any


class APIErrorResponse(BaseModel):
    message: str
    error: ErrorBody
