from datetime import datetime
from app.services.eligibility import evaluate_eligibility, compute_deadline_days_left

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


def _score_skill_overlap(user_skills: set[str], job_skills: set[str]) -> tuple[float, set[str], set[str]]:
    if not job_skills:
        return 0.0, set(), set()
    matched = user_skills & job_skills
    missing = job_skills - user_skills
    return len(matched) / len(job_skills), matched, missing


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


def compute_matches(
    jobs: list[dict],
    user_skills: list[str],
    target_role: str,
    profile: dict,
    resume_doc: dict | None,
    eligible_only: bool = True
) -> list[dict]:
    skills_set = {skill.lower() for skill in user_skills}
    if not skills_set:
        return []

    now = datetime.utcnow()
    results = []
    
    preferred_locations = {loc.lower() for loc in profile.get("preferred_locations", [])}
    job_prefs = {pref.lower() for pref in profile.get("job_preferences", [])}
    ats_score = resume_doc.get("ats_score", 0) if resume_doc else 0

    for job in filter_relevant_jobs(jobs, target_role):
        eligibility = evaluate_eligibility(job, profile)
        is_eligible = eligibility["status"] != "not_eligible"
        
        if eligible_only and not is_eligible:
            continue

        job_skills = {skill.lower() for skill in job.get("skills_required", [])}
        overlap_score, matched_skills, missing_skills = _score_skill_overlap(skills_set, job_skills)
        title_rel = _score_title_relevance(target_role, job.get("title", ""))
        keyword_bonus = _score_keyword_bonus(target_role, skills_set, job_skills)
        
        # Prefs
        loc_bonus = 0.1 if (preferred_locations and job.get("location", "").lower() in preferred_locations) else 0.0
        
        # Type bonus: if job type includes one of the user prefs (e.g. "internship" in "Internship")
        type_bonus = 0.0
        j_type = job.get("type", "").lower()
        if job_prefs and any(pref in j_type for pref in job_prefs):
            type_bonus = 0.1

        # Deadline urgency
        days_left = compute_deadline_days_left(job.get("deadline"))
        deadline_bonus = 0.05 if (days_left is not None and 0 <= days_left <= 14) else 0.0

        # ATS bonus (scale ATS 0-100 to a 0.15 weight)
        ats_bonus = (ats_score / 100.0) * 0.15

        base_score = 0.40 * overlap_score + 0.20 * title_rel + 0.10 * keyword_bonus
        total_score = base_score + loc_bonus + type_bonus + deadline_bonus + ats_bonus

        # Heavily penalize ineligible if included
        if not is_eligible:
            total_score *= 0.5

        score = int(round(min(total_score, 1.0) * 100))
        if score <= 0:
            continue

        if score >= 80 and is_eligible:
            fit_level = "strong"
        elif score >= 60 and is_eligible:
            fit_level = "good"
        else:
            fit_level = "stretch"

        reasons = []
        if len(matched_skills) > 0:
            reasons.append(f"Matches {len(matched_skills)} required skills.")
        if title_rel >= 0.5:
            reasons.append("Strong title alignment.")
        if loc_bonus > 0:
            reasons.append("Matches your preferred location.")
        if type_bonus > 0:
            reasons.append("Matches your job type preferences.")
        if deadline_bonus > 0:
            reasons.append("Closing soon — act fast.")
        if ats_bonus > 0.1:
            reasons.append("High resume ATS compatibility.")

        if not is_eligible:
            next_action = "Review eligibility blockers"
        elif missing_skills:
            next_action = "Upskill missing requirements"
        elif days_left is not None and days_left <= 7:
            next_action = "Apply immediately"
        else:
            next_action = "Prepare & Apply"

        results.append(
            {
                "job_id": job["_id"],
                "title": job.get("title"),
                "company": job.get("company"),
                "score": score,
                "fit_level": fit_level,
                "matched_skills": sorted(list(matched_skills)),
                "missing_skills": sorted(list(missing_skills)),
                "eligibility_status": eligibility["status"],
                "reasons": reasons[:4] if reasons else ["General profile match"],
                "eligibility_reasons": eligibility["reasons"],
                "next_action": next_action,
                "posted_at": job.get("posted_at", now.isoformat()),
                "deadline_days_left": days_left,
            }
        )

    results.sort(key=lambda item: (-item["score"], item["title"] or ""))
    return results[:10]
