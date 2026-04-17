from typing import Optional
from fastapi import APIRouter, Query
from db.connection import get_db
from app.models.course import Course

router = APIRouter()


@router.get("", response_model=list[Course])
def list_courses(
    q: Optional[str] = Query(None, description="Search by course code or title"),
    department: Optional[str] = Query(None, description="Filter by department (e.g. CSC)"),
):
    """
    List all courses, with optional text search and department filter.

    Examples:
      GET /courses
      GET /courses?q=computer
      GET /courses?department=CSC
      GET /courses?q=algo&department=CSC
    """
    conn = get_db()
    cur = conn.cursor()

    filters = []
    params = []

    if q:
        filters.append("(course_code ILIKE %s OR title ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])

    if department:
        filters.append("department ILIKE %s")
        params.append(department)

    where = f"WHERE {' AND '.join(filters)}" if filters else ""

    cur.execute(
        f"""
        SELECT id, course_code, title, credits, department
        FROM courses
        {where}
        ORDER BY course_code
        """,
        params,
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        Course(
            id=r[0],
            course_code=r[1],
            title=r[2],
            credits=r[3],
            department=r[4],
        )
        for r in rows
    ]
