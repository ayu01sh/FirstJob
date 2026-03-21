from app.services.skills import extract_skills


def _has_contact_info(text: str) -> bool:
    lowered = text.lower()
    return "@" in lowered and any(ch.isdigit() for ch in lowered)


def _has_education_or_projects(text: str) -> bool:
    lowered = text.lower()
    return "education" in lowered or "project" in lowered


def _keyword_alignment(text: str, target_role: str) -> float:
    role_words = [w for w in target_role.lower().split() if len(w) > 2]
    if not role_words:
        return 0.0
    hits = sum(1 for w in role_words if w in text.lower())
    return hits / len(role_words)


def _job_overlap(extracted_skills: list[str], seeded_job_skills: set[str]) -> float:
    if not seeded_job_skills:
        return 0.0
    overlap = len(set(extracted_skills) & seeded_job_skills)
    return min(overlap / max(1, len(seeded_job_skills) // 4), 1.0)


def _text_heuristics(text: str) -> float:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    length_ok = 1.0 if 300 <= len(text) <= 7000 else 0.0
    bullets_ok = 1.0 if any(line.startswith(("-", "*")) for line in lines) else 0.0
    heading_ok = 1.0 if any(line.lower() in {"skills", "education", "experience", "projects"} for line in lines) else 0.0
    return (length_ok + bullets_ok + heading_ok) / 3


def analyze_resume(raw_text: str, target_role: str, seeded_job_skills: set[str]) -> dict:
    extracted = extract_skills(raw_text)
    c_contact = 1.0 if _has_contact_info(raw_text) else 0.0
    c_sections = 1.0 if _has_education_or_projects(raw_text) else 0.0
    c_role = _keyword_alignment(raw_text, target_role)
    c_overlap = _job_overlap(extracted, seeded_job_skills)
    c_heur = _text_heuristics(raw_text)

    score = int(
        round(
            (0.20 * c_contact + 0.20 * c_sections + 0.25 * c_role + 0.25 * c_overlap + 0.10 * c_heur)
            * 100
        )
    )

    missing = sorted(seeded_job_skills - set(extracted))[:10]
    suggestions: list[str] = []
    if not c_contact:
        suggestions.append("Add a clear email address and phone number in the header.")
    if not c_sections:
        suggestions.append("Include clearly labeled Education and Projects sections.")
    if c_role < 0.5:
        suggestions.append("Use more target-role keywords that are relevant to your desired role.")
    if c_overlap < 0.5:
        suggestions.append("Add project bullet points that demonstrate in-demand job skills.")
    if c_heur < 0.66:
        suggestions.append("Improve structure with concise bullet points and standard section headings.")
    if missing:
        suggestions.append(f"Consider adding relevant missing skills such as {', '.join(missing[:3])}.")
    suggestions = suggestions[:8]

    return {
        "extracted_skills": extracted,
        "ats_score": score,
        "missing_skills": missing,
        "suggestions": suggestions,
        "analysis_version": "v1",
    }
