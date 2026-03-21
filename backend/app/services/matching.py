from datetime import datetime


COMMON_ROLE_KEYWORDS = {
    "frontend": {"react", "javascript", "typescript", "css", "html"},
    "backend": {"python", "fastapi", "django", "sql", "rest api"},
    "fullstack": {"react", "python", "node", "mongodb", "sql"},
}


def _score_skill_overlap(user_skills: set[str], job_skills: set[str]) -> tuple[float, int]:
    if not job_skills:
        return 0.0, 0
    hits = len(user_skills & job_skills)
    return hits / len(job_skills), hits


def _score_title_relevance(target_role: str, job_title: str) -> float:
    role_words = {w for w in target_role.lower().split() if len(w) > 2}
    title_words = set(job_title.lower().split())
    if not role_words:
        return 0.0
    return len(role_words & title_words) / len(role_words)


def _score_keyword_bonus(target_role: str, user_skills: set[str], job_skills: set[str]) -> float:
    role_key = target_role.lower().replace(" ", "")
    pool = set()
    for key, values in COMMON_ROLE_KEYWORDS.items():
        if key in role_key:
            pool |= values
    if not pool:
        return 0.0
    return min(len((user_skills & job_skills) & pool) / 3, 1.0)


def compute_matches(jobs: list[dict], user_skills: list[str], target_role: str) -> list[dict]:
    skills_set = {s.lower() for s in user_skills}
    now = datetime.utcnow()
    results = []
    for job in jobs:
        job_skills = {s.lower() for s in job.get("skills_required", [])}
        overlap, overlap_hits = _score_skill_overlap(skills_set, job_skills)
        title_rel = _score_title_relevance(target_role, job.get("title", ""))
        keyword_bonus = _score_keyword_bonus(target_role, skills_set, job_skills)
        score = int(round((0.50 * overlap + 0.30 * title_rel + 0.20 * keyword_bonus) * 100))

        reasons = [
            f"Matched {overlap_hits} required skills",
            "Role title aligns with target role" if title_rel >= 0.5 else "Role title is partially aligned",
        ]
        missing = list(job_skills - skills_set)
        if missing:
            reasons.append(f"Missing {missing[0]} but strong match overall")

        posted_at = job.get("posted_at", now.isoformat())
        results.append(
            {
                "job_id": job["_id"],
                "title": job.get("title"),
                "company": job.get("company"),
                "score": score,
                "reasons": reasons[:3],
                "posted_at": posted_at,
            }
        )
    results.sort(key=lambda x: (-x["score"], x["title"] or ""))
    return results[:10]
