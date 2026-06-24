from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.core.db import get_db
from app.services.readiness import compute_readiness

router = APIRouter(prefix="/student", tags=["student"])


@router.get("/readiness")
async def readiness(current_user: dict = Depends(get_current_user)):
    latest_resume = await get_db().resumes.find_one(
        {"user_id": current_user["_id"]},
        sort=[("created_at", -1)],
    )
    has_resume = latest_resume is not None
    result = compute_readiness(current_user, has_resume)
    return {"message": "Readiness retrieved", "data": result}
