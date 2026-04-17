import json
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from psycopg2.extras import Json

from db.connection import get_db
from app.models.course import Section

router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class SaveRequest(BaseModel):
    label: str
    term: str
    score: float
    crns: list[str]
    rank: int = 1
    professor_score: float
    compactness_score: float
    slot_score: float
    sections: list[Section]


class RenameRequest(BaseModel):
    label: str


class SavedSchedule(BaseModel):
    id: int
    label: str
    term: str
    score: Optional[float]
    crns: list[str]
    courses: list[str]
    professors: list[str]
    created_at: str
    rank_snapshot: Optional[int] = None
    professor_score: Optional[float] = None
    compactness_score: Optional[float] = None
    slot_score: Optional[float] = None
    sections: list[Section] = []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_section_dict(r: tuple) -> dict:
    return {
        "id": r[0],
        "crn": r[1],
        "course_code": r[2],
        "title": r[3],
        "semester": r[4],
        "professor": r[5],
        "professor_id": r[6],
        "overall_rating": float(r[7]) if r[7] is not None else None,
        "adjusted_rating": float(r[8]) if r[8] is not None else None,
        "difficulty": float(r[9]) if r[9] is not None else None,
        "meeting_days": r[10],
        "start_time": r[11],
        "end_time": r[12],
        "location": r[13],
        "capacity": r[14],
        "enrolled": r[15],
    }


def fetch_sections_for_crns(cur, crns: list[str]) -> list[Section]:
    """Rebuild section rows from DB (legacy saves without sections_json)."""
    if not crns:
        return []
    cur.execute(
        """
        SELECT
            s.id,
            s.crn,
            c.course_code,
            c.title,
            s.semester,
            p.name,
            p.id,
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
        WHERE s.crn = ANY(%s)
        """,
        (crns,),
    )
    rows = cur.fetchall()
    by_crn = {r[1]: _row_to_section_dict(r) for r in rows}
    out: list[Section] = []
    for c in crns:
        if c in by_crn:
            out.append(Section(**by_crn[c]))
    return out


def parse_sections_json(raw) -> Optional[list]:
    if raw is None:
        return None
    if isinstance(raw, str):
        raw = json.loads(raw)
    return raw


def sections_json_to_models(raw) -> list[Section]:
    data = parse_sections_json(raw)
    if not data:
        return []
    return [Section(**s) for s in data]


# ---------------------------------------------------------------------------
# POST /saved-schedules  →  INSERT
# ---------------------------------------------------------------------------

@router.post("", response_model=SavedSchedule, status_code=201)
def save_schedule(body: SaveRequest):
    """
    INSERT a new saved schedule with full snapshot (scores + section rows).
    Demonstrates: INSERT
    """
    conn = get_db()
    cur = conn.cursor()

    sections_payload = [s.model_dump() for s in body.sections]

    cur.execute(
        """
        INSERT INTO saved_schedules (
            label, term, score, crns,
            professor_score, compactness_score, slot_score, rank_snapshot, sections_json
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, created_at
        """,
        (
            body.label,
            body.term,
            body.score,
            body.crns,
            body.professor_score,
            body.compactness_score,
            body.slot_score,
            body.rank,
            Json(sections_payload),
        ),
    )
    row = cur.fetchone()
    new_id = row[0]
    created_at = row[1]
    conn.commit()

    cur.execute(
        """
        SELECT
            array_agg(DISTINCT c.course_code) AS courses,
            array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) AS professors
        FROM unnest(%s) AS crn_val
        JOIN sections s  ON s.crn = crn_val
        JOIN courses  c  ON c.id  = s.course_id
        LEFT JOIN professors p ON p.id = s.professor_id
        """,
        (body.crns,),
    )
    enriched = cur.fetchone()
    cur.close()
    conn.close()

    return SavedSchedule(
        id=new_id,
        label=body.label,
        term=body.term,
        score=body.score,
        crns=body.crns,
        courses=enriched[0] or [],
        professors=enriched[1] or [],
        created_at=created_at.isoformat(),
        rank_snapshot=body.rank,
        professor_score=body.professor_score,
        compactness_score=body.compactness_score,
        slot_score=body.slot_score,
        sections=body.sections,
    )


# ---------------------------------------------------------------------------
# GET /saved-schedules  →  SELECT + JOIN (3 tables)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SavedSchedule])
def list_saved_schedules():
    """
    SELECT all saved schedules, enriched with course codes and professor
    names via JOIN across saved_schedules → sections → courses → professors.
    Demonstrates: SELECT + multi-table JOIN
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            ss.id,
            ss.label,
            ss.term,
            ss.score,
            ss.crns,
            ss.created_at,
            ss.professor_score,
            ss.compactness_score,
            ss.slot_score,
            ss.rank_snapshot,
            ss.sections_json,
            array_agg(DISTINCT c.course_code) AS courses,
            array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) AS professors
        FROM saved_schedules ss
        JOIN unnest(ss.crns) AS crn_val ON true
        JOIN sections    s  ON s.crn  = crn_val
        JOIN courses     c  ON c.id   = s.course_id
        LEFT JOIN professors p ON p.id = s.professor_id
        GROUP BY ss.id
        ORDER BY ss.created_at DESC
        """
    )

    rows = cur.fetchall()
    results: list[SavedSchedule] = []

    for r in rows:
        (
            sid,
            label,
            term,
            score,
            crns,
            created_at,
            prof_sc,
            compact_sc,
            slot_sc,
            rank_snap,
            sections_raw,
            courses,
            professors,
        ) = r

        sec_models = sections_json_to_models(sections_raw)
        if not sec_models and crns:
            sec_models = fetch_sections_for_crns(cur, crns or [])

        results.append(
            SavedSchedule(
                id=sid,
                label=label,
                term=term,
                score=float(score) if score is not None else None,
                crns=crns or [],
                created_at=created_at.isoformat(),
                courses=courses or [],
                professors=professors or [],
                rank_snapshot=rank_snap,
                professor_score=float(prof_sc) if prof_sc is not None else None,
                compactness_score=float(compact_sc) if compact_sc is not None else None,
                slot_score=float(slot_sc) if slot_sc is not None else None,
                sections=sec_models,
            )
        )

    cur.close()
    conn.close()

    return results


# ---------------------------------------------------------------------------
# PATCH /saved-schedules/{id}  →  UPDATE
# ---------------------------------------------------------------------------

@router.patch("/{schedule_id}", response_model=dict)
def rename_schedule(schedule_id: int, body: RenameRequest):
    """
    UPDATE the label of a saved schedule.
    Demonstrates: UPDATE
    """
    if not body.label.strip():
        raise HTTPException(status_code=400, detail="Label cannot be empty")

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "UPDATE saved_schedules SET label = %s WHERE id = %s",
        (body.label.strip(), schedule_id),
    )

    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Schedule not found")

    conn.commit()
    cur.close()
    conn.close()
    return {"id": schedule_id, "label": body.label.strip()}


# ---------------------------------------------------------------------------
# DELETE /saved-schedules/{id}  →  DELETE
# ---------------------------------------------------------------------------

@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(schedule_id: int):
    """
    DELETE a saved schedule by id.
    Demonstrates: DELETE
    """
    conn = get_db()
    cur = conn.cursor()

    cur.execute("DELETE FROM saved_schedules WHERE id = %s", (schedule_id,))

    if cur.rowcount == 0:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Schedule not found")

    conn.commit()
    cur.close()
    conn.close()
