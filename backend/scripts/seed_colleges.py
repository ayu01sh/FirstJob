import asyncio
import os
import sys
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings

SEED_COLLEGES = [
    {
        "college_name": "IIT Delhi",
        "allowed_domains": ["iitd.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIT Bombay",
        "allowed_domains": ["iitb.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIT Kanpur",
        "allowed_domains": ["iitk.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIT Madras",
        "allowed_domains": ["smail.iitm.ac.in", "iitm.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIT Kharagpur",
        "allowed_domains": ["iitkgp.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIT Hyderabad",
        "allowed_domains": ["iith.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIT Roorkee",
        "allowed_domains": ["iitr.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "BITS Pilani",
        "allowed_domains": ["pilani.bits-pilani.ac.in", "goa.bits-pilani.ac.in", "hyderabad.bits-pilani.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "NIT Trichy",
        "allowed_domains": ["nitt.edu"],
        "is_active": True,
    },
    {
        "college_name": "NIT Warangal",
        "allowed_domains": ["nitw.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "NIT Surathkal",
        "allowed_domains": ["nitk.edu.in"],
        "is_active": True,
    },
    {
        "college_name": "DTU Delhi",
        "allowed_domains": ["dtu.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "NSUT Delhi",
        "allowed_domains": ["nsut.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "IIIT Hyderabad",
        "allowed_domains": ["iiit.ac.in", "students.iiit.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "VIT Vellore",
        "allowed_domains": ["vitstudent.ac.in", "vit.ac.in"],
        "is_active": True,
    },
    {
        "college_name": "FirstJob Demo College",
        "allowed_domains": ["firstjob-demo.in"],
        "is_active": True,
    },
]


async def main():
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await db.colleges.delete_many({})

    docs = []
    for college in SEED_COLLEGES:
        doc = college.copy()
        doc["_id"] = str(uuid4())
        docs.append(doc)

    await db.colleges.insert_many(docs)
    print(f"Seeded {len(docs)} colleges")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
