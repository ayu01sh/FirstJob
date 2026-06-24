from pydantic import BaseModel, Field


class CollegeOut(BaseModel):
    id: str
    college_name: str
    allowed_domains: list[str]


class ReadinessSection(BaseModel):
    label: str
    complete: bool


class ReadinessResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    completed: list[str]
    missing: list[str]
    sections: list[ReadinessSection]
    next_action: str
