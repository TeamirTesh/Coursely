from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from database import db

app = FastAPI(title="Coursely API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Expected Supabase schema
# ---------------------------------------------------------------------------
# departments  : id, name
# courses      : id, course_code, course_title, department_id (FK), credits, difficulty, description
# professors   : id, name, department_id (FK), rating, difficulty, bio
# semesters    : id, name
# sections     : id, course_id (FK), professor_id (FK), semester_id (FK), meeting_times
# ---------------------------------------------------------------------------


def _normalize_course(row: dict) -> dict:
    """Flatten a Supabase courses row (with embedded departments) to the API shape."""
    dept = row.get("departments") or {}
    return {
        "course_id": row["id"],
        "course_code": row["course_code"],
        "course_title": row["course_title"],
        "department": dept.get("name", ""),
        "credits": row["credits"],
        "difficulty": row["difficulty"],
        "description": row["description"],
    }


def _normalize_professor(row: dict) -> dict:
    """Flatten a Supabase professors row (with embedded departments) to the API shape."""
    dept = row.get("departments") or {}
    return {
        "professor_id": row["id"],
        "name": row["name"],
        "department": dept.get("name", ""),
        "rating": row["rating"],
        "difficulty": row["difficulty"],
        "bio": row["bio"],
    }


@app.get("/")
def root():
    return {"message": "Welcome to the Coursely API"}


@app.get("/courses")
def get_courses(
    department: Optional[str] = Query(None),
    difficulty: Optional[int] = Query(None, ge=1, le=5),
):
    query = db.table("courses").select("*, departments(name)")
    if difficulty is not None:
        query = query.eq("difficulty", difficulty)
    rows = query.execute().data
    result = [_normalize_course(r) for r in rows]
    if department:
        result = [c for c in result if c["department"].lower() == department.lower()]
    return result


@app.get("/courses/{course_id}")
def get_course(course_id: int):
    rows = (
        db.table("courses")
        .select("*, departments(name)")
        .eq("id", course_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Course not found")
    return _normalize_course(rows[0])


@app.get("/professors")
def get_professors():
    rows = db.table("professors").select("*, departments(name)").execute().data
    return [_normalize_professor(r) for r in rows]


@app.get("/professors/{professor_id}")
def get_professor(professor_id: int):
    rows = (
        db.table("professors")
        .select("*, departments(name)")
        .eq("id", professor_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Professor not found")
    return _normalize_professor(rows[0])


@app.get("/sections")
def get_sections():
    rows = (
        db.table("sections")
        .select(
            "*, "
            "courses(*, departments(name)), "
            "professors(*, departments(name)), "
            "semesters(name)"
        )
        .execute()
        .data
    )
    result = []
    for row in rows:
        course_row = row.get("courses") or {}
        prof_row = row.get("professors") or {}
        semester_row = row.get("semesters") or {}
        result.append(
            {
                "section_id": row["id"],
                "course_id": row["course_id"],
                "professor_id": row["professor_id"],
                "semester": semester_row.get("name", ""),
                "meeting_times": row["meeting_times"],
                "course": _normalize_course(course_row) if course_row else {},
                "professor": _normalize_professor(prof_row) if prof_row else {},
            }
        )
    return result
