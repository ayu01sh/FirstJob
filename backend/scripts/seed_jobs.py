import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings

SEED_JOBS = [
    {
        "title": "Frontend Intern",
        "company": "Acme",
        "location": "Bangalore",
        "type": "Internship",
        "source": "seed",
        "skills_required": ["React", "JavaScript", "CSS"],
    },
    {
        "title": "Backend Intern",
        "company": "ByteLabs",
        "location": "Pune",
        "type": "Internship",
        "source": "seed",
        "skills_required": ["Python", "FastAPI", "MongoDB"],
    },
    {
        "title": "Full Stack Fresher",
        "company": "StackWave",
        "location": "Remote",
        "type": "Full-time",
        "source": "seed",
        "skills_required": ["React", "Python", "REST API", "MongoDB"],
    },
]


async def main():
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await db.jobs.delete_many({})
    now = datetime.now(timezone.utc)
    docs = []
    for i in range(100):
        base = SEED_JOBS[i % len(SEED_JOBS)].copy()
        base["_id"] = str(uuid4())
        base["posted_at"] = (now - timedelta(days=i % 30)).isoformat()
        docs.append(base)
    await db.jobs.insert_many(docs)
    print(f"Seeded {len(docs)} jobs")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
