from typing import Any

from pydantic import BaseModel


class ErrorBody(BaseModel):
    code: str
    details: list[str] = []


class APIResponse(BaseModel):
    message: str
    data: Any


class APIErrorResponse(BaseModel):
    message: str
    error: ErrorBody
