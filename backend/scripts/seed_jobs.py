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
        "title": "Frontend Engineer",
        "company": "Apple",
        "location": "Hyderabad",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "TypeScript", "HTML", "CSS"],
    },
    {
        "title": "Full Stack Engineer - Java and React",
        "company": "Apple",
        "location": "Hyderabad",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["Java", "React", "JavaScript", "REST API", "SQL"],
    },
    {
        "title": "Web Development Engineer",
        "company": "Apple",
        "location": "Hyderabad",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "TypeScript", "CSS"],
    },
    {
        "title": "Software Engineer (Frontend)",
        "company": "Teikametrics",
        "location": "India / Remote",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "TypeScript", "CSS"],
    },
    {
        "title": "Frontend Engineer (React)",
        "company": "Fam",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "HTML", "CSS"],
    },
    {
        "title": "Frontend Engineer",
        "company": "Gushwork",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "TypeScript", "CSS"],
    },
    {
        "title": "Frontend Developer",
        "company": "Z1 Tech",
        "location": "Gurugram",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "CSS", "REST API"],
    },
    {
        "title": "Frontend Engineer",
        "company": "Weekday",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "HTML", "CSS"],
    },
    {
        "title": "Senior Frontend Engineer",
        "company": "Vendavo",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "TypeScript", "CSS"],
    },
    {
        "title": "UI Engineer",
        "company": "SAFE Security",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "TypeScript", "HTML", "CSS"],
    },
    {
        "title": "Full Stack Engineer",
        "company": "AHEAD",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "TypeScript", "Python", "FastAPI", "SQL"],
    },
    {
        "title": "Store Technology Engineer (Full Stack)",
        "company": "ShyftLabs",
        "location": "Noida",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "TypeScript", "Python", "FastAPI", "SQL"],
    },
    {
        "title": "Full Stack Engineer",
        "company": "Level AI",
        "location": "Noida",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "Python", "Django", "REST API"],
    },
    {
        "title": "Product Engineer - AI Agents",
        "company": "100ms",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "Python", "FastAPI", "Docker", "REST API"],
    },
    {
        "title": "Software Engineer Intern - Merchant Services",
        "company": "GoTo Group",
        "location": "India",
        "type": "Internship",
        "source": "company-careers",
        "skills_required": ["Java", "Python", "JavaScript", "SQL"],
    },
    {
        "title": "Engineering Intern - App Team",
        "company": "PIP Labs",
        "location": "India / Remote",
        "type": "Internship",
        "source": "company-careers",
        "skills_required": ["React", "TypeScript", "Node", "CSS"],
    },
    {
        "title": "Software Engineer Intern",
        "company": "AiDash",
        "location": "Bengaluru",
        "type": "Internship",
        "source": "company-careers",
        "skills_required": ["Python", "Java", "React", "TypeScript"],
    },
    {
        "title": "Senior Engineer",
        "company": "Brillio",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "Python", "FastAPI", "Docker", "SQL"],
    },
    {
        "title": "Full Stack Software Engineer",
        "company": "Sonatype",
        "location": "India",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "Node", "Python", "SQL"],
    },
    {
        "title": "Full Stack Engineer",
        "company": "Skypoint",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "Python", "SQL", "AWS"],
    },
    {
        "title": "Python Developer Intern",
        "company": "AHEAD",
        "location": "Hyderabad",
        "type": "Internship",
        "source": "company-careers",
        "skills_required": ["Python", "FastAPI", "SQL", "Git"],
    },
    {
        "title": "Backend Engineer",
        "company": "Teikametrics",
        "location": "India / Remote",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["Python", "REST API", "SQL", "Docker"],
    },
    {
        "title": "React UI Engineer",
        "company": "Vendavo",
        "location": "Bengaluru",
        "type": "Full-time",
        "source": "company-careers",
        "skills_required": ["React", "JavaScript", "HTML", "CSS"],
    },
    {
        "title": "Machine Learning Intern",
        "company": "VisionTrail",
        "location": "Remote",
        "type": "Internship",
        "source": "seed",
        "skills_required": ["Python", "Machine Learning", "SQL"],
    },
]


async def main():
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await db.jobs.delete_many({})
    now = datetime.now(timezone.utc)
    docs = []

    for i, base in enumerate(SEED_JOBS):
        doc = base.copy()
        doc["_id"] = str(uuid4())
        doc["posted_at"] = (now - timedelta(days=i % 21, hours=(i * 3) % 24)).isoformat()
        docs.append(doc)

    await db.jobs.insert_many(docs)
    print(f"Seeded {len(docs)} jobs")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
