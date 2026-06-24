from fastapi import APIRouter

from app.services.college import list_active_colleges

router = APIRouter(prefix="/colleges", tags=["colleges"])


@router.get("")
async def get_colleges():
    items = await list_active_colleges()
    return {"message": "Colleges retrieved", "data": {"items": items}}
