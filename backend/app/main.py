from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.db import close_db, connect_db
from app.services.notes import NotesServiceError


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.exception_handler(HTTPException)
async def http_error_handler(_: Request, exc: HTTPException):
    details = [str(exc.detail)] if not isinstance(exc.detail, list) else [str(d) for d in exc.detail]
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": "Request failed", "error": {"code": "HTTP_ERROR", "details": details}},
    )


@app.exception_handler(NotesServiceError)
async def notes_service_error_handler(_: Request, exc: NotesServiceError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": "Request failed", "error": {"code": exc.code, "details": [exc.message]}},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(_: Request, exc: Exception):
    logger.exception("Unhandled application error", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "error": {"code": "INTERNAL_ERROR", "details": ["Unexpected server error"]}},
    )


@app.get("/health")
async def health():
    return {"message": "Health check successful", "data": {"status": "healthy"}}
