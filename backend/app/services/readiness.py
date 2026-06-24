def compute_readiness(user: dict, has_resume: bool) -> dict:
    """Calculate profile completeness across structured buckets.

    Returns dict with score, completed, missing, sections, and next_action.
    """
    profile = user.get("profile", {})
    sections = []
    completed: list[str] = []
    missing: list[str] = []

    # 1. Identity
    name_ok = bool((profile.get("name") or "").strip())
    sections.append({"label": "Identity", "complete": name_ok})
    if name_ok:
        completed.append("Identity")
    else:
        missing.append("Add your name")

    # 2. Academic
    academic_fields = ["college_name", "degree", "branch", "graduation_year"]
    academic_filled = sum(1 for f in academic_fields if profile.get(f))
    academic_ok = academic_filled >= 3
    sections.append({"label": "Academic", "complete": academic_ok})
    if academic_ok:
        completed.append("Academic")
    else:
        empty_academic = [f.replace("_", " ").title() for f in academic_fields if not profile.get(f)]
        missing.append(f"Complete academic details: {', '.join(empty_academic)}")

    # 3. Target Role
    role_ok = bool((profile.get("target_role") or "").strip())
    sections.append({"label": "Target Role", "complete": role_ok})
    if role_ok:
        completed.append("Target Role")
    else:
        missing.append("Set your target role")

    # 4. Skills
    skills = profile.get("skills", [])
    skills_ok = len(skills) >= 1
    sections.append({"label": "Skills", "complete": skills_ok})
    if skills_ok:
        completed.append("Skills")
    else:
        missing.append("Add at least one skill")

    # 5. Resume
    sections.append({"label": "Resume Uploaded", "complete": has_resume})
    if has_resume:
        completed.append("Resume Uploaded")
    else:
        missing.append("Upload your resume")

    # 6. Extras (linkedin, github, projects_url)
    extras = ["linkedin", "github", "projects_url"]
    extras_filled = sum(1 for f in extras if (profile.get(f) or "").strip())
    extras_ok = extras_filled >= 1
    sections.append({"label": "Links & Projects", "complete": extras_ok})
    if extras_ok:
        completed.append("Links & Projects")
    else:
        missing.append("Add a LinkedIn, GitHub, or project link")

    total = len(sections)
    done = len(completed)
    score = int(round((done / total) * 100)) if total > 0 else 0

    if missing:
        next_action = missing[0]
    else:
        next_action = "Your profile is complete!"

    return {
        "score": score,
        "completed": completed,
        "missing": missing,
        "sections": [{"label": s["label"], "complete": s["complete"]} for s in sections],
        "next_action": next_action,
    }
