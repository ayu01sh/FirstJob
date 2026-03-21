from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.deps import get_current_user
from app.core.db import get_db
from app.services.file_extract import extract_text_from_file
from app.services.matching import relevant_job_skills
from app.services.resume import analyze_resume

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: str | None = Form(default=None),
    current_user: dict = Depends(get_current_user),
):
    content = await file.read()
    try:
        raw_text = extract_text_from_file(file.filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    role = (target_role or current_user.get("profile", {}).get("target_role", "")).strip()
    if target_role and role != current_user.get("profile", {}).get("target_role", ""):
        await get_db().users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"profile.target_role": role}},
        )
        current_user.setdefault("profile", {})["target_role"] = role

    jobs = await get_db().jobs.find({}, {"skills_required": 1, "title": 1}).to_list(length=500)
    seeded_skills = relevant_job_skills(jobs, role)
    result = analyze_resume(raw_text=raw_text, target_role=role, seeded_job_skills=seeded_skills)

    resume_id = str(uuid4())
    doc = {
        "_id": resume_id,
        "user_id": current_user["_id"],
        "filename": file.filename,
        "raw_text": raw_text,
        **result,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await get_db().resumes.insert_one(doc)
    return {
        "message": "Resume analyzed successfully",
        "data": {
            "resume_id": resume_id,
            "filename": file.filename,
            "target_role": role,
            "extracted_skills": result["extracted_skills"],
            "ats_score": result["ats_score"],
            "missing_skills": result["missing_skills"],
            "suggestions": result["suggestions"],
        },
    }


@router.get("/latest")
async def latest_resume(current_user: dict = Depends(get_current_user)):
    latest = await get_db().resumes.find_one({"user_id": current_user["_id"]}, sort=[("created_at", -1)])
    if not latest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No resume was found.")
    return {
        "message": "Latest resume retrieved",
        "data": {
            "resume_id": latest["_id"],
            "filename": latest["filename"],
            "target_role": current_user.get("profile", {}).get("target_role", ""),
            "ats_score": latest["ats_score"],
            "extracted_skills": latest["extracted_skills"],
            "missing_skills": latest["missing_skills"],
            "suggestions": latest["suggestions"],
            "created_at": latest["created_at"],
        },
    }
