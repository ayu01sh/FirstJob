from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.db import get_db
from app.schemas.notes import NoteGenerateRequest
from app.services.notes import generate_notes

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/generate")
async def generate(payload: NoteGenerateRequest, current_user: dict = Depends(get_current_user)):
    generated = await generate_notes(payload)
    note_id = str(uuid4())
    doc = {
        "_id": note_id,
        "user_id": current_user["_id"],
        "topic": payload.topic,
        "level": payload.level,
        "format": payload.format,
        "generated_content": generated.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await get_db().notes.insert_one(doc)
    return {
        "message": "Notes generated successfully",
        "data": {
            "note_id": note_id,
            "topic": doc["topic"],
            "level": doc["level"],
            "format": doc["format"],
            "generated_content": doc["generated_content"],
        },
    }


@router.get("")
async def list_notes(current_user: dict = Depends(get_current_user)):
    docs = await get_db().notes.find({"user_id": current_user["_id"]}).sort("created_at", -1).to_list(length=100)
    items = [
        {
            "id": d["_id"],
            "topic": d["topic"],
            "level": d["level"],
            "format": d["format"],
            "created_at": d["created_at"],
        }
        for d in docs
    ]
    return {"message": "Notes retrieved", "data": {"items": items}}


@router.get("/{note_id}")
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    d = await get_db().notes.find_one({"_id": note_id, "user_id": current_user["_id"]})
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The requested note was not found.")
    return {
        "message": "Note retrieved",
        "data": {
            "id": d["_id"],
            "topic": d["topic"],
            "level": d["level"],
            "format": d["format"],
            "generated_content": d["generated_content"],
            "created_at": d["created_at"],
        },
    }


@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = await get_db().notes.delete_one({"_id": note_id, "user_id": current_user["_id"]})
    if getattr(result, "deleted_count", 0) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="The requested note was not found.")
    return {"message": "Note deleted successfully", "data": {"id": note_id}}
