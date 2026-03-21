SKILL_VOCABULARY = {
    "python",
    "fastapi",
    "django",
    "flask",
    "react",
    "javascript",
    "typescript",
    "node",
    "mongodb",
    "sql",
    "postgresql",
    "docker",
    "aws",
    "git",
    "rest api",
    "html",
    "css",
    "java",
    "c++",
    "machine learning",
}

SKILL_LABELS = {
    "python": "Python",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "react": "React",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "node": "Node",
    "mongodb": "MongoDB",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "docker": "Docker",
    "aws": "AWS",
    "git": "Git",
    "rest api": "REST API",
    "html": "HTML",
    "css": "CSS",
    "java": "Java",
    "c++": "C++",
    "machine learning": "Machine Learning",
}


def normalize_skill(skill: str) -> str:
    return " ".join(skill.strip().lower().split())


def display_skill(skill: str) -> str:
    normalized = normalize_skill(skill)
    return SKILL_LABELS.get(normalized, " ".join(part.capitalize() for part in normalized.split()))


def normalize_user_skills(skills: list[str]) -> list[str]:
    return sorted({display_skill(skill) for skill in skills if skill.strip()})


def extract_skills(raw_text: str) -> list[str]:
    text = raw_text.lower()
    found = [skill for skill in SKILL_VOCABULARY if skill in text]
    return sorted({normalize_skill(s) for s in found})
