from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import courses, sections, schedules, saved_schedules, analytics, preferences

app = FastAPI(title="Coursely API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this when deploying
    allow_methods=["*"],
    allow_headers=["*"],
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
