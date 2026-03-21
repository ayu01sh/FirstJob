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


def normalize_skill(skill: str) -> str:
    return " ".join(skill.strip().lower().split())


def extract_skills(raw_text: str) -> list[str]:
    text = raw_text.lower()
    found = [skill for skill in SKILL_VOCABULARY if skill in text]
    return sorted({normalize_skill(s) for s in found})
