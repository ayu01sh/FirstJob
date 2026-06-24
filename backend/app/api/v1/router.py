from fastapi import APIRouter

from app.api.v1 import applications, auth, colleges, jobs, notes, prep, resume, student, recruiter, admin

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(resume.router)
api_router.include_router(jobs.router)
api_router.include_router(notes.router)
api_router.include_router(prep.router)
api_router.include_router(colleges.router)
api_router.include_router(student.router)
api_router.include_router(applications.router)
api_router.include_router(recruiter.router)
api_router.include_router(admin.router)
