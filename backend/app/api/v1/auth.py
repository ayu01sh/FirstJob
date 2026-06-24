from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.db import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, ProfileUpdateRequest, RegisterRequest
from app.services.college import verify_college_domain
from app.services.skills import normalize_user_skills


router = APIRouter(prefix="/auth", tags=["auth"])


def _build_user_response(user_doc: dict) -> dict:
    """Build a consistent user response dict from a raw user document."""
    profile = user_doc.get("profile", {})
    return {
        "id": user_doc["_id"],
        "email": user_doc["email"],
        "role": user_doc.get("role", "student"),
        "name": profile.get("name", ""),
        "target_role": profile.get("target_role", ""),
        "skills": profile.get("skills", []),
        "college_name": profile.get("college_name", ""),
        "college_email": profile.get("college_email", ""),
        "college_domain": profile.get("college_domain", ""),
        "degree": profile.get("degree", ""),
        "branch": profile.get("branch", ""),
        "graduation_year": profile.get("graduation_year"),
        "cgpa": profile.get("cgpa"),
        "backlogs": profile.get("backlogs"),
        "preferred_locations": profile.get("preferred_locations", []),
        "job_preferences": profile.get("job_preferences", []),
        "verification_status": profile.get("verification_status", "unverified"),
        "linkedin": profile.get("linkedin", ""),
        "github": profile.get("github", ""),
        "projects_url": profile.get("projects_url", ""),
    }


@router.post("/register")
async def register(payload: RegisterRequest):
    email_lower = payload.email.lower()

    existing = await get_db().users.find_one({"email": email_lower})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

    college_name, domain = "", ""
    if payload.role == "student":
        is_allowed, college_name, domain = await verify_college_domain(email_lower)
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"The email domain '@{domain}' is not from a recognized college. "
                    "Registration is currently limited to students with a verified college email. "
                    "Contact your campus placement cell if you believe your college should be added."
                ),
            )

    user_id = str(uuid4())
    user_doc = {
        "_id": user_id,
        "email": email_lower,
        "role": payload.role,
        "password_hash": hash_password(payload.password),
        "profile": {
            "name": payload.name.strip(),
            "target_role": payload.target_role.strip(),
            "skills": [],
            "college_name": college_name,
            "college_email": email_lower,
            "college_domain": domain,
            "degree": payload.degree.strip(),
            "branch": payload.branch.strip(),
            "graduation_year": payload.graduation_year,
            "verification_status": "verified",
            "cgpa": None,
            "backlogs": None,
            "preferred_locations": [],
            "job_preferences": [],
            "linkedin": "",
            "github": "",
            "projects_url": "",
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await get_db().users.insert_one(user_doc)
    token = create_access_token(user_id)
    return {
        "message": "Student account created successfully",
        "data": {
            "user": _build_user_response(user_doc),
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
            "user": _build_user_response(user),
            "access_token": token,
        },
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    profile = current_user.get("profile", {})
    normalized_skills = normalize_user_skills(profile.get("skills", []))
    current_user.setdefault("profile", {})["skills"] = normalized_skills
    return {
        "message": "Current user retrieved",
        "data": _build_user_response(current_user),
    }


@router.put("/profile")
async def update_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    normalized_skills = normalize_user_skills(payload.skills)
    normalized_name = (payload.name or "").strip()
    preferred_locations = [loc.strip() for loc in payload.preferred_locations if loc.strip()]
    job_preferences = list(set(payload.job_preferences))

    update_fields = {
        "profile.name": normalized_name,
        "profile.target_role": payload.target_role.strip(),
        "profile.skills": normalized_skills,
        "profile.degree": (payload.degree or "").strip(),
        "profile.branch": (payload.branch or "").strip(),
        "profile.graduation_year": payload.graduation_year,
        "profile.cgpa": payload.cgpa,
        "profile.backlogs": payload.backlogs,
        "profile.preferred_locations": preferred_locations,
        "profile.job_preferences": job_preferences,
        "profile.linkedin": (payload.linkedin or "").strip(),
        "profile.github": (payload.github or "").strip(),
        "profile.projects_url": (payload.projects_url or "").strip(),
    }

    if payload.college_name is not None:
        update_fields["profile.college_name"] = payload.college_name.strip()

    await get_db().users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_fields},
    )

    updated = await get_db().users.find_one({"_id": current_user["_id"]})
    return {
        "message": "Profile updated successfully",
        "data": _build_user_response(updated),
    }
