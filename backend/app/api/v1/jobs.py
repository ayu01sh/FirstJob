from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_user
from app.core.db import get_db
from app.services.matching import compute_matches
from app.services.eligibility import build_job_response

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    current_user: dict = Depends(get_current_user),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    title: str | None = None,
    company: str | None = None,
    location: str | None = None,
    type: str | None = None,
    branch: str | None = None,
    graduation_year: int | None = None,
    eligible_only: bool = False,
    sort: str = Query(default="deadline_asc", pattern="^(deadline_asc|posted_desc)$"),
):
    query: dict = {}
    if title:
        query["title"] = {"$regex": title, "$options": "i"}
    if company:
        query["company"] = {"$regex": company, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if type:
        query["type"] = {"$regex": type, "$options": "i"}
    if branch:
        query["eligible_branches"] = branch
    if graduation_year is not None:
        query["eligible_graduation_years"] = graduation_year

    sort_spec = [("deadline", 1)] if sort == "deadline_asc" else [("posted_at", -1)]
    profile = current_user.get("profile", {})

    # If not strictly eligible_only, we can just do pagination normally.
    # If eligible_only=True, we need to fetch items and filter them server-side until we hit the limit.
    if not eligible_only:
        total = await get_db().jobs.count_documents(query)
        skip = (page - 1) * limit
        docs = await get_db().jobs.find(query).sort(sort_spec).skip(skip).limit(limit).to_list(length=limit)
        items = [build_job_response(d, profile) for d in docs]
    else:
        # Client-side pagination fallback mechanism logic
        # We need to filter manually. Since this is an MVP, we'll fetch a larger chunk and filter.
        # For true scalability we'd need more complex aggregation, but for now this suffices.
        all_docs = await get_db().jobs.find(query).sort(sort_spec).to_list(length=1000)
        filtered = [build_job_response(d, profile) for d in all_docs]
        filtered = [j for j in filtered if j["eligibility_status"] != "not_eligible"]
        total = len(filtered)
        skip = (page - 1) * limit
        items = filtered[skip : skip + limit]

    return {
        "message": "Jobs retrieved",
        "data": {
            "items": items,
            "pagination": {"page": page, "limit": limit, "total": total},
        },
    }


@router.get("/matches/me")
async def matched_jobs(
    current_user: dict = Depends(get_current_user),
    eligible_only: bool = Query(default=True),
    type: str | None = None,
    limit: int = Query(default=10, le=20)
):
    latest = await get_db().resumes.find_one({"user_id": current_user["_id"]}, sort=[("created_at", -1)])
    profile = current_user.get("profile", {})
    profile_skills = profile.get("skills", [])
    
    source_skills = latest.get("extracted_skills", []) if latest else []
    source_type = "resume" if source_skills else "none"
    if not source_skills and profile_skills:
        source_skills = profile_skills
        source_type = "profile"

    # Compute basic readiness for summary
    readiness_warnings = []
    if not profile.get("target_role"):
        readiness_warnings.append("Target role is missing.")
    if not profile_skills and not latest:
        readiness_warnings.append("No skills found. Upload a resume or add skills to profile.")
    if profile.get("verification_status") != "verified":
        readiness_warnings.append("College email is not verified.")

    if not latest:
        rec_action = "Upload a resume for better matches"
    elif readiness_warnings:
        rec_action = "Complete profile to unlock all jobs"
    else:
        rec_action = "Review top matches and apply"

    if not source_skills:
        return {
            "message": "Matched jobs retrieved",
            "data": {
                "source_summary": {
                    "source_type": "none",
                    "readiness_warnings": readiness_warnings,
                    "recommended_action": rec_action,
                },
                "items": [],
            },
        }

    query = {}
    if type:
        query["type"] = {"$regex": type, "$options": "i"}
        
    jobs = await get_db().jobs.find(query).to_list(length=500)
    target_role = profile.get("target_role", "")
    
    items = compute_matches(
        jobs=jobs,
        user_skills=source_skills,
        target_role=target_role,
        profile=profile,
        resume_doc=latest,
        eligible_only=eligible_only
    )
    
    return {
        "message": "Matched jobs retrieved",
        "data": {
            "source_summary": {
                "source_type": source_type,
                "readiness_warnings": readiness_warnings,
                "recommended_action": rec_action,
            },
            "items": items[:limit],
        },
    }


@router.get("/{job_id}")
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await get_db().jobs.find_one({"_id": job_id})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    profile = current_user.get("profile", {})
    return {
        "message": "Job retrieved",
        "data": build_job_response(job, profile),
    }
