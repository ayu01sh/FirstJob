from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user
from app.core.db import get_db
from app.services.matching import compute_matches

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    title: str | None = None,
    location: str | None = None,
    type: str | None = None,
):
    query: dict = {}
    if title:
        query["title"] = {"$regex": title, "$options": "i"}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if type:
        query["type"] = {"$regex": type, "$options": "i"}

    total = await get_db().jobs.count_documents(query)
    skip = (page - 1) * limit
    docs = (
        await get_db()
        .jobs.find(query)
        .sort("posted_at", -1)
        .skip(skip)
        .limit(limit)
        .to_list(length=limit)
    )
    items = [
        {
            "id": d["_id"],
            "title": d.get("title"),
            "company": d.get("company"),
            "location": d.get("location"),
            "type": d.get("type"),
            "skills_required": d.get("skills_required", []),
        }
        for d in docs
    ]
    return {"message": "Jobs retrieved", "data": {"items": items, "pagination": {"page": page, "limit": limit, "total": total}}}


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
