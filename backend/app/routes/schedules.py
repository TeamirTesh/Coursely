from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, model_validator

from db.connection import get_db
from app.models.course import Section
from app.services.scheduler import generate_schedules

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class Weights(BaseModel):
    professor:   float = 0.40
    compactness: float = 0.30
    slot:        float = 0.30

    @model_validator(mode="after")
    def must_sum_to_one(self):
        total = self.professor + self.compactness + self.slot
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights must sum to 1.0 (got {total:.2f})")
        return self


class ScheduleRequest(BaseModel):
    courses:               list[str]                      # e.g. ["CSC 1301", "MATH 2211"]
    semester:              Optional[str] = "Fall Semester 2026"
    grid:                  dict[str, dict[str, float]] = {}  # {"M": {"08:00": 1.0, ...}}
    weights:               Weights = Weights()
    preferred_compactness: float = 0.8
    max_results:           int   = 3

    @model_validator(mode="after")
    def validate_fields(self):
        if not self.courses:
            raise ValueError("courses must not be empty")
        if not (1 <= self.max_results <= 8):
            raise ValueError("max_results must be between 1 and 8")
        if not (0.0 <= self.preferred_compactness <= 1.0):
            raise ValueError("preferred_compactness must be between 0.0 and 1.0")
        return self


class ScheduleResult(BaseModel):
    rank:               int
    score:              float
    professor_score:    float
    compactness_score:  float
    slot_score:         float
    sections:           list[Section]


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("", response_model=list[ScheduleResult])
def generate(req: ScheduleRequest):
    """
    Generate ranked, conflict-free schedules.

    Example body:
    {
      "courses": ["CSC 1301", "CSC 2720"],
      "semester": "Fall Semester 2026",
      "grid": {
        "M": {"08:00": 1.0, "08:30": 1.0},
        "T": {"08:00": 0.0}
      },
      "weights": {"professor": 0.40, "compactness": 0.30, "slot": 0.30},
      "preferred_compactness": 0.8,
      "max_results": 3
    }
    """
    conn = get_db()
    cur  = conn.cursor()

    # Fetch sections for all requested courses
    params: list = [req.courses]
    semester_filter = ""
    if req.semester:
        semester_filter = "AND s.semester = %s"
        params.append(req.semester)

    cur.execute(
        f"""
        SELECT
            s.id,
            s.crn,
            c.course_code,
            c.title,
            s.semester,
            p.name            AS professor,
            p.id              AS professor_id,
            p.overall_rating,
            p.adjusted_rating,
            p.difficulty,
            s.meeting_days,
            s.start_time::text,
            s.end_time::text,
            s.location,
            s.capacity,
            s.enrolled
        FROM sections s
        JOIN courses c ON s.course_id = c.id
        LEFT JOIN professors p ON s.professor_id = p.id
        WHERE c.course_code = ANY(%s)
        {semester_filter}
        """,
        params,
    )

    rows = cur.fetchall()

    # Global mean adjusted_rating for professor score fallback
    cur.execute(
        "SELECT AVG(adjusted_rating) FROM professors WHERE adjusted_rating IS NOT NULL"
    )
    mean_row    = cur.fetchone()
    global_mean = float(mean_row[0]) if mean_row and mean_row[0] is not None else 0.5

    cur.close()
    conn.close()

    # Group sections by course code
    sections_by_course: dict[str, list[dict]] = {c: [] for c in req.courses}
    for r in rows:
        section = {
            "id":               r[0],
            "crn":              r[1],
            "course_code":      r[2],
            "title":            r[3],
            "semester":         r[4],
            "professor":        r[5],
            "professor_id":     r[6],
            "overall_rating":   r[7],
            "adjusted_rating":  float(r[8]) if r[8] is not None else None,
            "difficulty":       r[9],
            "meeting_days":     r[10],
            "start_time":       r[11],
            "end_time":         r[12],
            "location":         r[13],
            "capacity":         r[14],
            "enrolled":         r[15],
        }
        code = r[2]
        if code in sections_by_course:
            sections_by_course[code].append(section)

    # Validate all requested courses have at least one section
    missing = [c for c, secs in sections_by_course.items() if not secs]
    if missing:
        raise HTTPException(
            status_code=404,
            detail=f"No sections found for: {', '.join(missing)}",
        )

    weights = {
        "professor":   req.weights.professor,
        "compactness": req.weights.compactness,
        "slot":        req.weights.slot,
    }

    try:
        schedules = generate_schedules(
            sections_by_course=sections_by_course,
            grid=req.grid,
            weights=weights,
            preferred_compactness=req.preferred_compactness,
            global_mean=global_mean,
            max_results=req.max_results,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not schedules:
        raise HTTPException(
            status_code=404,
            detail="No valid conflict-free schedules found for the given courses and preferences.",
        )

    return [
        ScheduleResult(
            rank=i + 1,
            score=s["total"],
            professor_score=s["professor_score"],
            compactness_score=s["compactness_score"],
            slot_score=s["slot_score"],
            sections=[Section(**sec) for sec in s["sections"]],
        )
        for i, s in enumerate(schedules)
    ]
