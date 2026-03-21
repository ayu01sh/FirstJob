from datetime import datetime


COMMON_ROLE_KEYWORDS = {
    "frontend": {"react", "javascript", "typescript", "css", "html"},
    "backend": {"python", "fastapi", "django", "sql", "rest api"},
    "fullstack": {"react", "python", "node", "mongodb", "sql"},
}


def _role_words(target_role: str) -> set[str]:
    return {word for word in target_role.lower().split() if len(word) > 2}


def filter_relevant_jobs(jobs: list[dict], target_role: str) -> list[dict]:
    role_words = _role_words(target_role)
    if not role_words:
        return jobs

    relevant = []
    for job in jobs:
        title_words = set((job.get("title") or "").lower().split())
        if role_words & title_words:
            relevant.append(job)
    return relevant or jobs


def relevant_job_skills(jobs: list[dict], target_role: str) -> set[str]:
    relevant_jobs = filter_relevant_jobs(jobs, target_role)
    return {skill.lower() for job in relevant_jobs for skill in job.get("skills_required", [])}


def _score_skill_overlap(user_skills: set[str], job_skills: set[str]) -> tuple[float, int]:
    if not job_skills:
        return 0.0, 0
    hits = len(user_skills & job_skills)
    return hits / len(job_skills), hits


def _skill_match_reason(overlap_hits: int) -> str:
    noun = "skill" if overlap_hits == 1 else "skills"
    return f"Matched {overlap_hits} required {noun}"


def _score_title_relevance(target_role: str, job_title: str) -> float:
    role_words = _role_words(target_role)
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
    skills_set = {skill.lower() for skill in user_skills}
    if not skills_set:
        return []

    now = datetime.utcnow()
    results = []
    for job in filter_relevant_jobs(jobs, target_role):
        job_skills = {skill.lower() for skill in job.get("skills_required", [])}
        overlap, overlap_hits = _score_skill_overlap(skills_set, job_skills)
        title_rel = _score_title_relevance(target_role, job.get("title", ""))
        keyword_bonus = _score_keyword_bonus(target_role, skills_set, job_skills)
        score = int(round((0.50 * overlap + 0.30 * title_rel + 0.20 * keyword_bonus) * 100))
        if score <= 0:
            continue

        reasons = [_skill_match_reason(overlap_hits)]
        if title_rel >= 0.5:
            reasons.append("The job title aligns with your target role.")
        elif title_rel > 0:
            reasons.append("The job title is partially aligned with your target role.")
        if keyword_bonus > 0:
            reasons.append("Core stack keywords align with your target role.")

        missing = sorted(job_skills - skills_set)
        if missing:
            reasons.append(f"You are missing {missing[0]}, but this is still a relevant match.")

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

    results.sort(key=lambda item: (-item["score"], item["title"] or ""))
    return results[:10]
