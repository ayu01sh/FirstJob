from app.core.db import get_db


async def verify_college_domain(email: str) -> tuple[bool, str, str]:
    """Check if the email domain belongs to an active college in the allowlist.

    Returns (is_allowed, college_name, domain).
    """
    parts = email.lower().strip().split("@")
    if len(parts) != 2:
        return False, "", ""

    domain = parts[1]
    doc = await get_db().colleges.find_one(
        {"allowed_domains": domain, "is_active": True},
    )
    if not doc:
        return False, "", domain

    return True, doc.get("college_name", ""), domain


async def list_active_colleges() -> list[dict]:
    """Return all active colleges with their allowed domains."""
    docs = (
        await get_db()
        .colleges.find({"is_active": True}, {"_id": 1, "college_name": 1, "allowed_domains": 1})
        .sort("college_name", 1)
        .to_list(length=500)
    )
    return [
        {"id": str(d["_id"]), "college_name": d["college_name"], "allowed_domains": d["allowed_domains"]}
        for d in docs
    ]
