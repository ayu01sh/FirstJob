from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.db import get_db
from app.core.deps import get_recruiter_user
from app.schemas.jobs import JobCreateRequest

router = APIRouter(prefix="/recruiter", tags=["recruiter"])

class ApplicationStatusUpdate(BaseModel):
    status: str

@router.post("/jobs")
async def create_job(payload: JobCreateRequest, current_user: dict = Depends(get_recruiter_user)):
    job_id = str(uuid4())
    doc = {
        "_id": job_id,
        "owner_id": current_user["_id"],
        "title": payload.title.strip(),
        "company": payload.company.strip(),
        "location": payload.location.strip(),
        "work_mode": payload.work_mode,
        "type": payload.type,
        "ctc": payload.ctc.strip() if payload.ctc else None,
        "stipend": payload.stipend.strip() if payload.stipend else None,
        "deadline": payload.deadline.isoformat() if payload.deadline else None,
        "skills_required": payload.skills_required,
        "eligible_degrees": payload.eligible_degrees,
        "eligible_branches": payload.eligible_branches,
        "eligible_graduation_years": payload.eligible_graduation_years,
        "min_cgpa": payload.min_cgpa,
        "max_backlogs": payload.max_backlogs,
        "rounds": payload.rounds,
        "application_link": payload.application_link.strip() if payload.application_link else None,
        "source": "internal",
        "is_verified": True,  # Recruiter created jobs are verified
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await get_db().jobs.insert_one(doc)
    return {"message": "Job created", "data": {"id": job_id}}

@router.put("/jobs/{job_id}")
async def update_job(job_id: str, payload: JobCreateRequest, current_user: dict = Depends(get_recruiter_user)):
    job = await get_db().jobs.find_one({"_id": job_id, "owner_id": current_user["_id"]})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found or access denied.")
        
    update_data = {
        "title": payload.title.strip(),
        "company": payload.company.strip(),
        "location": payload.location.strip(),
        "work_mode": payload.work_mode,
        "type": payload.type,
        "ctc": payload.ctc.strip() if payload.ctc else None,
        "stipend": payload.stipend.strip() if payload.stipend else None,
        "deadline": payload.deadline.isoformat() if payload.deadline else None,
        "skills_required": payload.skills_required,
        "eligible_degrees": payload.eligible_degrees,
        "eligible_branches": payload.eligible_branches,
        "eligible_graduation_years": payload.eligible_graduation_years,
        "min_cgpa": payload.min_cgpa,
        "max_backlogs": payload.max_backlogs,
        "rounds": payload.rounds,
        "application_link": payload.application_link.strip() if payload.application_link else None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await get_db().jobs.update_one({"_id": job_id}, {"$set": update_data})
    return {"message": "Job updated"}

@router.get("/jobs")
async def list_jobs(current_user: dict = Depends(get_recruiter_user)):
    jobs = await get_db().jobs.find({"owner_id": current_user["_id"]}).sort("created_at", -1).to_list(length=100)
    
    # Get applicant counts
    job_ids = [j["_id"] for j in jobs]
    counts_cursor = get_db().applications.aggregate([
        {"$match": {"job_id": {"$in": job_ids}, "status": {"$ne": "saved"}}},
        {"$group": {"_id": "$job_id", "count": {"$sum": 1}}}
    ])
    counts = {doc["_id"]: doc["count"] for doc async in counts_cursor}
    
    for j in jobs:
        j["id"] = j.pop("_id")
        j["applicant_count"] = counts.get(j["id"], 0)
        
    return {"message": "Jobs retrieved", "data": {"items": jobs}}

@router.get("/jobs/{job_id}/applicants")
async def list_applicants(job_id: str, current_user: dict = Depends(get_recruiter_user)):
    job = await get_db().jobs.find_one({"_id": job_id, "owner_id": current_user["_id"]})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found or access denied.")
        
    apps = await get_db().applications.find({"job_id": job_id, "status": {"$ne": "saved"}}).sort("applied_at", -1).to_list(length=500)
    
    user_ids = [a["user_id"] for a in apps]
    users = await get_db().users.find({"_id": {"$in": user_ids}}).to_list(length=500)
    user_map = {u["_id"]: u for u in users}
    
    results = []
    for a in apps:
        student = user_map.get(a["user_id"], {})
        profile = student.get("profile", {})
        results.append({
            "application_id": a["_id"],
            "status": a["status"],
            "applied_at": a.get("applied_at"),
            "student": {
                "id": student.get("_id"),
                "name": profile.get("name"),
                "email": student.get("email"),
                "degree": profile.get("degree"),
                "branch": profile.get("branch"),
                "graduation_year": profile.get("graduation_year"),
                "cgpa": profile.get("cgpa"),
                "skills": profile.get("skills", []),
                "linkedin": profile.get("linkedin"),
                "github": profile.get("github"),
            }
        })
        
    return {"message": "Applicants retrieved", "data": {"items": results}}

@router.patch("/applications/{app_id}")
async def update_application_status(app_id: str, payload: ApplicationStatusUpdate, current_user: dict = Depends(get_recruiter_user)):
    app = await get_db().applications.find_one({"_id": app_id})
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
        
    # Verify recruiter owns the job
    job = await get_db().jobs.find_one({"_id": app["job_id"], "owner_id": current_user["_id"]})
    if not job:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
        
    now = datetime.now(timezone.utc).isoformat()
    new_history_entry = {"status": payload.status, "timestamp": now}
    
    await get_db().applications.update_one(
        {"_id": app_id},
        {
            "$set": {"status": payload.status},
            "$push": {"round_history": new_history_entry}
        }
    )
    return {"message": "Application status updated"}
