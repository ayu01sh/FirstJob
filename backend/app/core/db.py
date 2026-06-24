from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await ensure_indexes()


async def close_db() -> None:
    global client
    if client:
        client.close()


async def ensure_indexes() -> None:
    assert db is not None
    await db.users.create_index("email", unique=True)
    await db.users.create_index("profile.college_email")
    await db.users.create_index("profile.college_domain")
    await db.users.create_index("profile.graduation_year")
    await db.resumes.create_index([("user_id", 1), ("created_at", -1)])
    await db.notes.create_index([("user_id", 1), ("created_at", -1)])
    await db.jobs.create_index("title")
    await db.jobs.create_index("company")
    await db.jobs.create_index("location")
    await db.jobs.create_index("type")
    await db.jobs.create_index("skills_required")
    await db.jobs.create_index("deadline")
    await db.jobs.create_index("eligible_branches")
    await db.jobs.create_index("eligible_graduation_years")
    await db.applications.create_index([("user_id", 1), ("status", 1), ("deadline", 1)])
    await db.applications.create_index([("user_id", 1), ("job_id", 1)], unique=True)
    await db.colleges.create_index("allowed_domains")
    await db.colleges.create_index("is_active")


def get_db() -> AsyncIOMotorDatabase:
    assert db is not None
    return db
