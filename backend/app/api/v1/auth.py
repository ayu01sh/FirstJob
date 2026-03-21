from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.db import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, ProfileUpdateRequest, RegisterRequest
from app.services.skills import normalize_user_skills

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(payload: RegisterRequest):
    existing = await get_db().users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")
    user_id = str(uuid4())
    user_doc = {
        "_id": user_id,
        "email": payload.email.lower(),
        "password_hash": hash_password(payload.password),
        "profile": {"name": (payload.name or "").strip(), "target_role": payload.target_role, "skills": []},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await get_db().users.insert_one(user_doc)
    token = create_access_token(user_id)
    return {
        "message": "User registered successfully",
        "data": {
            "user": {
                "id": user_id,
                "email": user_doc["email"],
                "name": user_doc["profile"]["name"],
                "target_role": payload.target_role,
            },
            "access_token": token,
        },
    }


@router.post("/login")
async def login(payload: LoginRequest):
    user = await get_db().users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    token = create_access_token(user["_id"])
    return {
        "message": "Login successful",
        "data": {
            "user": {
                "id": user["_id"],
                "email": user["email"],
                "name": user.get("profile", {}).get("name", ""),
                "target_role": user.get("profile", {}).get("target_role", ""),
            },
            "access_token": token,
        },
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    normalized_skills = normalize_user_skills(current_user.get("profile", {}).get("skills", []))
    return {
        "message": "Current user retrieved",
        "data": {
            "id": current_user["_id"],
            "email": current_user["email"],
            "name": current_user.get("profile", {}).get("name", ""),
            "target_role": current_user.get("profile", {}).get("target_role", ""),
            "skills": normalized_skills,
        },
    }


@router.put("/profile")
async def update_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    normalized_skills = normalize_user_skills(payload.skills)
    normalized_name = (payload.name or "").strip()
    await get_db().users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "profile.name": normalized_name,
                "profile.target_role": payload.target_role.strip(),
                "profile.skills": normalized_skills,
            }
        },
    )
    return {
        "message": "Profile updated successfully",
        "data": {
            "id": current_user["_id"],
            "email": current_user["email"],
            "name": normalized_name,
            "target_role": payload.target_role.strip(),
            "skills": normalized_skills,
        },
    }
