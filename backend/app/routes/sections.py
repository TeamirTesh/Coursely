from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from db.connection import get_db
from app.models.course import Section

router = APIRouter()


@router.get("", response_model=list[Section])
def list_sections(
    course_code: list[str] = Query(..., description="One or more course codes (e.g. CSC 1301)"),
    semester: Optional[str] = Query(None, description="Semester label (e.g. Fall Semester 2026)"),
):
    """
    Return all sections for the given course code(s), optionally filtered by semester.
    Pass multiple course_code params to get sections for several courses at once.

    Examples:
      GET /sections?course_code=CSC+1301
      GET /sections?course_code=CSC+1301&course_code=MATH+2211
      GET /sections?course_code=CSC+1301&semester=Fall+Semester+2026
    """
    if not course_code:
        raise HTTPException(status_code=400, detail="At least one course_code is required")

    conn = get_db()
    cur = conn.cursor()

    params: list = [course_code]
    semester_filter = ""
    if semester:
        semester_filter = "AND s.semester = %s"
        params.append(semester)

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
        ORDER BY c.course_code, s.crn
        """,
        params,
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        Section(
            id=r[0],
            crn=r[1],
            course_code=r[2],
            title=r[3],
            semester=r[4],
            professor=r[5],
            professor_id=r[6],
            overall_rating=r[7],
            adjusted_rating=float(r[8]) if r[8] is not None else None,
            difficulty=r[9],
            meeting_days=r[10],
            start_time=r[11],
            end_time=r[12],
            location=r[13],
            capacity=r[14],
            enrolled=r[15],
        )
        for r in rows
    ]
