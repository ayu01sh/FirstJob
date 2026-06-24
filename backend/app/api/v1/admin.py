from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.db import get_db
from app.core.deps import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

class VerificationUpdate(BaseModel):
    status: str

class CollegeCreate(BaseModel):
    college_name: str
    domain: str

@router.get("/students")
async def list_students(current_user: dict = Depends(get_admin_user)):
    students = await get_db().users.find({"role": "student"}).to_list(length=500)
    
    results = []
    for s in students:
        profile = s.get("profile", {})
        results.append({
            "id": s["_id"],
            "email": s["email"],
            "name": profile.get("name"),
            "college_name": profile.get("college_name"),
            "college_domain": profile.get("college_domain"),
            "verification_status": profile.get("verification_status"),
            "created_at": s.get("created_at"),
        })
        
    return {"message": "Students retrieved", "data": {"items": results}}

@router.patch("/students/{student_id}/verification")
async def update_verification(student_id: str, payload: VerificationUpdate, current_user: dict = Depends(get_admin_user)):
    student = await get_db().users.find_one({"_id": student_id, "role": "student"})
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
        
    await get_db().users.update_one(
        {"_id": student_id},
        {"$set": {"profile.verification_status": payload.status}}
    )
    return {"message": "Verification status updated"}

@router.post("/colleges")
async def add_college(payload: CollegeCreate, current_user: dict = Depends(get_admin_user)):
    # Simple upsert logic
    doc = {
        "college_name": payload.college_name.strip(),
        "allowed_domains": [payload.domain.strip().lower()],
        "is_active": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    existing = await get_db().colleges.find_one({"college_name": doc["college_name"]})
    
    if existing:
        await get_db().colleges.update_one(
            {"_id": existing["_id"]},
            {"$addToSet": {"allowed_domains": doc["allowed_domains"][0]}}
        )
    else:
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await get_db().colleges.insert_one(doc)
        
    return {"message": "College domain added"}
