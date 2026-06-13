import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.routes import courses, sections, schedules, saved_schedules, analytics, preferences

_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()] or ["*"]

app = FastAPI(title="Coursely API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(courses.router,          prefix="/courses",          tags=["courses"])
app.include_router(sections.router,         prefix="/sections",         tags=["sections"])
app.include_router(schedules.router,        prefix="/schedules/generate", tags=["schedules"])
app.include_router(saved_schedules.router,  prefix="/saved-schedules",  tags=["saved-schedules"])
app.include_router(analytics.router,        prefix="/analytics",        tags=["analytics"])
app.include_router(preferences.router,      prefix="/preferences",      tags=["preferences"])


@app.get("/health")
def health():
    return {"status": "ok"}
