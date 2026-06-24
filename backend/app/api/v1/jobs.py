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
async def matched_jobs(current_user: dict = Depends(get_current_user)):
    latest = await get_db().resumes.find_one({"user_id": current_user["_id"]}, sort=[("created_at", -1)])
    profile_skills = current_user.get("profile", {}).get("skills", [])
    source_skills = latest.get("extracted_skills", []) if latest else []
    source_type = "resume" if source_skills else "none"
    if not source_skills and profile_skills:
        source_skills = profile_skills
        source_type = "profile"

    if not source_skills:
        return {
            "message": "Matched jobs retrieved",
            "data": {"source_skills": [], "source_type": "none", "needs_resume": True, "items": []},
        }

    jobs = await get_db().jobs.find({}).to_list(length=500)
    target_role = current_user.get("profile", {}).get("target_role", "")
    items = compute_matches(jobs, source_skills, target_role)
    return {
        "message": "Matched jobs retrieved",
        "data": {
            "source_skills": source_skills,
            "source_type": source_type,
            "needs_resume": source_type == "none",
            "items": items,
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
