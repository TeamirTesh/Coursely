from fastapi import APIRouter
from db.connection import get_db

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /analytics/schedule-comparison
# Aggregate: AVG, COUNT, GROUP BY across saved_schedules + 3-table JOIN
# ---------------------------------------------------------------------------

@router.get("/schedule-comparison")
def schedule_comparison():
    """
    All saved schedules ranked by score, enriched with aggregate professor
    data. Demonstrates: SELECT + JOIN + AVG aggregate + GROUP BY.
    """
    conn = get_db()
    cur  = conn.cursor()

    cur.execute(
        """
        SELECT
            ss.id,
            ss.label,
            ss.term,
            ss.score,
            ss.created_at,
            array_length(ss.crns, 1)                                              AS num_courses,
            array_agg(DISTINCT c.course_code)                                     AS courses,
            array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL)          AS professors,
            ROUND(AVG(p.adjusted_rating * 100)::numeric, 1)                       AS avg_professor_score
        FROM saved_schedules ss
        JOIN unnest(ss.crns) AS crn_val ON true
        JOIN sections    s  ON s.crn  = crn_val
        JOIN courses     c  ON c.id   = s.course_id
        LEFT JOIN professors p ON p.id = s.professor_id
        GROUP BY ss.id
        ORDER BY ss.score DESC
        """
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "id":                  r[0],
            "label":               r[1],
            "term":                r[2],
            "score":               float(r[3]) if r[3] is not None else None,
            "created_at":          r[4].isoformat(),
            "num_courses":         r[5],
            "courses":             r[6] or [],
            "professors":          r[7] or [],
            "avg_professor_score": float(r[8]) if r[8] is not None else None,
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /analytics/fill-rates
# Aggregate: SUM, COUNT, GROUP BY, computed fill-rate ratio
# CS department only
# ---------------------------------------------------------------------------

@router.get("/fill-rates")
def fill_rates():
    """
    CSC course fill rates: SUM(enrolled) / SUM(capacity) per course.
    Demonstrates: SUM aggregate + COUNT + GROUP BY + JOIN.
    """
    conn = get_db()
    cur  = conn.cursor()

    cur.execute(
        """
        SELECT
            c.course_code,
            c.title,
            SUM(s.enrolled)                                                        AS total_enrolled,
            SUM(s.capacity)                                                        AS total_capacity,
            ROUND(
                SUM(s.enrolled)::numeric / NULLIF(SUM(s.capacity), 0) * 100,
                1
            )                                                                      AS fill_rate_pct,
            COUNT(s.id)                                                            AS num_sections
        FROM sections s
        JOIN courses c ON s.course_id = c.id
        WHERE c.course_code LIKE 'CSC%'
          AND s.capacity > 0
        GROUP BY c.course_code, c.title
        ORDER BY fill_rate_pct DESC NULLS LAST
        """
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "course_code":    r[0],
            "title":          r[1],
            "total_enrolled": int(r[2]) if r[2] is not None else 0,
            "total_capacity": int(r[3]) if r[3] is not None else 0,
            "fill_rate_pct":  float(r[4]) if r[4] is not None else 0.0,
            "num_sections":   int(r[5]),
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /analytics/professor-ratings
# Aggregate: AVG, COUNT, SUM + GROUP BY + HAVING
# ---------------------------------------------------------------------------

@router.get("/professor-ratings")
def professor_ratings():
    """
    Average professor rating grouped by department (RMP department field).
    Only departments with at least 3 rated professors.
    Demonstrates: AVG + COUNT + SUM + GROUP BY + HAVING.
    """
    conn = get_db()
    cur  = conn.cursor()

    cur.execute(
        """
        SELECT
            p.department,
            ROUND(AVG(p.overall_rating)::numeric, 2)   AS avg_rating,
            ROUND(AVG(p.difficulty)::numeric, 2)        AS avg_difficulty,
            COUNT(p.id)                                 AS num_professors,
            SUM(p.num_ratings)                          AS total_ratings
        FROM professors p
        WHERE p.num_ratings > 0
          AND p.department IS NOT NULL
        GROUP BY p.department
        HAVING COUNT(p.id) >= 3
        ORDER BY avg_rating DESC
        """
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {
            "department":     r[0],
            "avg_rating":     float(r[1]) if r[1] is not None else None,
            "avg_difficulty": float(r[2]) if r[2] is not None else None,
            "num_professors": int(r[3]),
            "total_ratings":  int(r[4]) if r[4] is not None else 0,
        }
        for r in rows
    ]
