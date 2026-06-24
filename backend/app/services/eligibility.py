from datetime import datetime, timezone
from math import ceil


def evaluate_eligibility(job: dict, profile: dict) -> dict:
    """Evaluate a student's eligibility for a specific job.

    Returns dict with 'status' ('eligible' | 'almost_eligible' | 'not_eligible')
    and 'reasons' (list of human-readable strings explaining blockers/warnings).

    Missing job constraints are treated as 'no restriction'.
    Missing student profile fields are treated conservatively (likely ineligible).
    """
    reasons: list[str] = []
    has_blocker = False
    has_warning = False

    # 1. Verification
    verification = profile.get("verification_status", "unverified")
    if job.get("is_verified") and verification != "verified":
        reasons.append("Your college email is not verified.")
        has_blocker = True

    # 2. Degree
    eligible_degrees = job.get("eligible_degrees", [])
    if eligible_degrees:
        student_degree = (profile.get("degree") or "").strip()
        if not student_degree:
            reasons.append("Your degree is not set in your profile.")
            has_blocker = True
        elif student_degree not in eligible_degrees:
            reasons.append(f"Requires {', '.join(eligible_degrees)} — your degree is {student_degree}.")
            has_blocker = True

    # 3. Branch
    eligible_branches = job.get("eligible_branches", [])
    if eligible_branches:
        student_branch = (profile.get("branch") or "").strip()
        if not student_branch:
            reasons.append("Your branch is not set in your profile.")
            has_blocker = True
        elif student_branch not in eligible_branches:
            reasons.append(f"Requires {', '.join(eligible_branches)} — your branch is {student_branch}.")
            has_blocker = True

    # 4. Graduation year
    eligible_years = job.get("eligible_graduation_years", [])
    if eligible_years:
        student_year = profile.get("graduation_year")
        if not student_year:
            reasons.append("Your graduation year is not set in your profile.")
            has_blocker = True
        elif student_year not in eligible_years:
            reasons.append(f"Requires graduation in {', '.join(str(y) for y in eligible_years)} — yours is {student_year}.")
            has_blocker = True

    # 5. CGPA
    min_cgpa = job.get("min_cgpa")
    if min_cgpa is not None:
        student_cgpa = profile.get("cgpa")
        if student_cgpa is None:
            reasons.append("Your CGPA is not set in your profile.")
            has_warning = True
        elif student_cgpa < min_cgpa:
            gap = min_cgpa - student_cgpa
            if gap <= 0.5:
                reasons.append(f"CGPA {min_cgpa} required — yours is {student_cgpa} (close).")
                has_warning = True
            else:
                reasons.append(f"CGPA {min_cgpa} required — yours is {student_cgpa}.")
                has_blocker = True

    # 6. Backlogs
    max_backlogs = job.get("max_backlogs")
    if max_backlogs is not None:
        student_backlogs = profile.get("backlogs")
        if student_backlogs is not None and student_backlogs > max_backlogs:
            reasons.append(f"Maximum {max_backlogs} backlogs allowed — you have {student_backlogs}.")
            has_blocker = True

    if has_blocker:
        status = "not_eligible"
    elif has_warning:
        status = "almost_eligible"
    else:
        status = "eligible"
        if not reasons:
            reasons.append("You meet all eligibility criteria for this role.")

    return {"status": status, "reasons": reasons}


def compute_deadline_days_left(deadline_str: str | None) -> int | None:
    """Calculate days remaining until deadline. Returns None if no deadline."""
    if not deadline_str:
        return None
    try:
        deadline = datetime.fromisoformat(deadline_str)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = deadline - now
        return max(0, ceil(delta.total_seconds() / 86400))
    except (ValueError, TypeError):
        return None


def build_job_response(job: dict, profile: dict) -> dict:
    """Build a full job response dict with eligibility and deadline info."""
    eligibility = evaluate_eligibility(job, profile)
    days_left = compute_deadline_days_left(job.get("deadline"))

    return {
        "id": job["_id"],
        "title": job.get("title", ""),
        "company": job.get("company", ""),
        "location": job.get("location", ""),
        "type": job.get("type", ""),
        "work_mode": job.get("work_mode", ""),
        "ctc": job.get("ctc", ""),
        "stipend": job.get("stipend", ""),
        "deadline": job.get("deadline", ""),
        "deadline_days_left": days_left,
        "skills_required": job.get("skills_required", []),
        "eligible_degrees": job.get("eligible_degrees", []),
        "eligible_branches": job.get("eligible_branches", []),
        "eligible_graduation_years": job.get("eligible_graduation_years", []),
        "min_cgpa": job.get("min_cgpa"),
        "max_backlogs": job.get("max_backlogs"),
        "rounds": job.get("rounds", []),
        "application_link": job.get("application_link", ""),
        "source": job.get("source", ""),
        "is_verified": job.get("is_verified", False),
        "posted_at": job.get("posted_at", ""),
        "eligibility_status": eligibility["status"],
        "eligibility_reasons": eligibility["reasons"],
    }
