from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.db import get_db
from app.schemas.prep import PrepGenerateRequest
from app.services.prep import generate_prep

router = APIRouter(prefix="/prep", tags=["prep"])


@router.post("/plan")
async def generate_prep_plan(payload: PrepGenerateRequest, current_user: dict = Depends(get_current_user)):
    # Fill target role and missing skills from user profile if not provided but contextually needed
    if not payload.target_role:
        payload.target_role = current_user.get("profile", {}).get("target_role", "Software Engineer")

    if payload.format == "company_pack" and payload.job_id and not payload.missing_skills:
        # compute missing skills real quick if possible, but keep it simple
        job = await get_db().jobs.find_one({"_id": payload.job_id})
        user_skills = set(current_user.get("profile", {}).get("skills", []))
        if job:
            job_skills = set(job.get("skills_required", []))
            payload.missing_skills = list(job_skills - user_skills)

    generated = await generate_prep(payload)
    
    prep_id = str(uuid4())
    
    doc = {
        "_id": prep_id,
        "user_id": current_user["_id"],
        "topic": payload.topic or payload.format.replace("_", " ").title(),
        "format": payload.format,
        "job_id": payload.job_id,
        "generated_content": generated.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await get_db().prep.insert_one(doc)
    
    return {
        "message": "Prep generated successfully",
        "data": {
            "id": prep_id,
            "topic": doc["topic"],
            "format": doc["format"],
            "generated_content": doc["generated_content"],
        },
    }


@router.get("/history")
async def list_prep_history(current_user: dict = Depends(get_current_user)):
    docs = await get_db().prep.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(length=100)
    
    # Try to resolve job titles if they have job_ids
    job_ids = [d["job_id"] for d in docs if d.get("job_id")]
    job_map = {}
    if job_ids:
        jobs = await get_db().jobs.find({"_id": {"$in": job_ids}}).to_list(length=100)
        job_map = {j["_id"]: j.get("company", "Company") + " - " + j.get("title", "Role") for j in jobs}
        
    items = []
    for d in docs:
        topic = d["topic"]
        if d.get("job_id") and d["job_id"] in job_map:
            topic = f"{job_map[d['job_id']]} Prep"
            
        items.append({
            "id": d["_id"],
            "topic": topic,
            "format": d["format"],
            "job_id": d.get("job_id"),
            "created_at": d["created_at"],
        })
    return {"message": "Prep history retrieved", "data": {"items": items}}


@router.get("/{prep_id}")
async def get_prep_item(prep_id: str, current_user: dict = Depends(get_current_user)):
    d = await get_db().prep.find_one({"_id": prep_id, "user_id": current_user["_id"]})
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The requested prep item was not found.")
    
    topic = d["topic"]
    if d.get("job_id"):
        job = await get_db().jobs.find_one({"_id": d["job_id"]})
        if job:
            topic = f"{job.get('company')} - {job.get('title')} Prep"
            
    return {
        "message": "Prep item retrieved",
        "data": {
            "id": d["_id"],
            "topic": topic,
            "format": d["format"],
            "job_id": d.get("job_id"),
            "generated_content": d["generated_content"],
            "created_at": d["created_at"],
        },
    }


@router.delete("/{prep_id}")
async def delete_prep_item(prep_id: str, current_user: dict = Depends(get_current_user)):
    result = await get_db().prep.delete_one({"_id": prep_id, "user_id": current_user["_id"]})
    if getattr(result, "deleted_count", 0) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The requested prep item was not found.")
    return {"message": "Prep item deleted successfully", "data": {"id": prep_id}}
