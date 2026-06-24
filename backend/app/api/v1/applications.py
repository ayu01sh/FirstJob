from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.core.db import get_db

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationCreate(BaseModel):
    job_id: str
    status: str
    source: str = "jobs_page"


class ApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
    next_action: str | None = None
    next_action_at: str | None = None


@router.post("")
async def create_application(payload: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only students can apply for jobs.")

    user_id = current_user["_id"]
    existing = await get_db().applications.find_one({"user_id": user_id, "job_id": payload.job_id})
    if existing:
        return {"message": "Application already tracked", "data": {"id": existing["_id"]}}

    job = await get_db().jobs.find_one({"_id": payload.job_id})
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    now = datetime.now(timezone.utc).isoformat()
    app_id = str(uuid4())

    doc = {
        "_id": app_id,
        "user_id": user_id,
        "job_id": payload.job_id,
        "status": payload.status,
        "source": payload.source,
        "applied_at": now if payload.status == "applied" else None,
        "deadline": job.get("deadline"),
        "next_action": None,
        "next_action_at": None,
        "notes": "",
        "round_history": [{"status": payload.status, "timestamp": now}],
        "created_at": now,
        "updated_at": now,
    }
    await get_db().applications.insert_one(doc)
    return {"message": "Application tracked successfully", "data": {"id": app_id}}


@router.get("")
async def list_applications(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    apps = await get_db().applications.find({"user_id": user_id}).to_list(length=1000)

    # Join with jobs to get title, company
    if not apps:
        return {"message": "Applications retrieved", "data": []}

    job_ids = [app["job_id"] for app in apps]
    jobs = await get_db().jobs.find({"_id": {"$in": job_ids}}).to_list(length=1000)
    job_map = {j["_id"]: j for j in jobs}

    enriched = []
    for app in apps:
        job = job_map.get(app["job_id"])
        if job:
            app["company"] = job.get("company", "")
            app["title"] = job.get("title", "")
            app["job_type"] = job.get("type", "")
            enriched.append(app)

    return {"message": "Applications retrieved", "data": enriched}


@router.patch("/{app_id}")
async def update_application(app_id: str, payload: ApplicationUpdate, current_user: dict = Depends(get_current_user)):
    app = await get_db().applications.find_one({"_id": app_id, "user_id": current_user["_id"]})
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    now = datetime.now(timezone.utc).isoformat()
    updates = {"updated_at": now}

    if payload.notes is not None:
        updates["notes"] = payload.notes
    if payload.next_action is not None:
        updates["next_action"] = payload.next_action
    if payload.next_action_at is not None:
        updates["next_action_at"] = payload.next_action_at

    if payload.status and payload.status != app["status"]:
        updates["status"] = payload.status
        if payload.status == "applied" and not app.get("applied_at"):
            updates["applied_at"] = now
        await get_db().applications.update_one(
            {"_id": app_id},
            {
                "$set": updates,
                "$push": {"round_history": {"status": payload.status, "timestamp": now}}
            }
        )
    else:
        await get_db().applications.update_one({"_id": app_id}, {"$set": updates})

    return {"message": "Application updated successfully"}


@router.delete("/{app_id}")
async def delete_application(app_id: str, current_user: dict = Depends(get_current_user)):
    result = await get_db().applications.delete_one({"_id": app_id, "user_id": current_user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return {"message": "Application removed"}
