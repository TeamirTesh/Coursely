"""
Persistent time grid + optimizer weights (standalone config tables).
"""

from fastapi import APIRouter, HTTPException

from db.connection import get_db
from app.models.preferences import (
    TimePreferencePut,
    TimePreferenceRow,
    OptimizerWeightsPut,
    OptimizerWeightsRow,
)

router = APIRouter()

VALID_DAYS = frozenset({"Mon", "Tue", "Wed", "Thu", "Fri"})


def _allowed_time_slots() -> frozenset[str]:
    """Must match frontend `slotKeyToTimeLabel` (12h, no leading zero on hour)."""
    slots = []
    for mins in range(480, 1320, 30):
        h = mins // 60
        m = mins % 60
        period = "PM" if h >= 12 else "AM"
        h12 = h % 12
        if h12 == 0:
            h12 = 12
        slots.append(f"{h12}:{m:02d} {period}")
    return frozenset(slots)


ALLOWED_TIME_SLOTS = _allowed_time_slots()


@router.get("/time", response_model=list[TimePreferenceRow])
def get_time_preferences():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, day, time_slot, preference, updated_at
        FROM time_preferences
        ORDER BY day, time_slot
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        TimePreferenceRow(
            id=r[0],
            day=r[1],
            time_slot=r[2],
            preference=r[3],
            updated_at=r[4],
        )
        for r in rows
    ]


@router.put("/time", response_model=TimePreferenceRow)
def put_time_preference(body: TimePreferencePut):
    if body.day not in VALID_DAYS:
        raise HTTPException(status_code=400, detail=f"day must be one of {sorted(VALID_DAYS)}")
    if body.time_slot not in ALLOWED_TIME_SLOTS:
        raise HTTPException(status_code=400, detail="Invalid time_slot")

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO time_preferences (day, time_slot, preference)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, day, time_slot)
        DO UPDATE SET
            preference = EXCLUDED.preference,
            updated_at = NOW()
        RETURNING id, day, time_slot, preference, updated_at
        """,
        (body.day, body.time_slot, body.preference),
    )
    r = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return TimePreferenceRow(
        id=r[0],
        day=r[1],
        time_slot=r[2],
        preference=r[3],
        updated_at=r[4],
    )


@router.get("/weights", response_model=OptimizerWeightsRow)
def get_optimizer_weights():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, professor_rating_weight, compactness_weight,
               time_preference_weight, preferred_compactness, updated_at
        FROM optimizer_weights
        ORDER BY updated_at DESC
        LIMIT 1
        """
    )
    r = cur.fetchone()
    cur.close()
    conn.close()
    if not r:
        raise HTTPException(status_code=404, detail="No weights configured")
    return OptimizerWeightsRow(
        id=r[0],
        professor_rating_weight=r[1],
        compactness_weight=r[2],
        time_preference_weight=r[3],
        preferred_compactness=r[4],
        updated_at=r[5],
    )


@router.put("/weights", response_model=OptimizerWeightsRow)
def put_optimizer_weights(body: OptimizerWeightsPut):
    s = (
        body.professor_rating_weight
        + body.compactness_weight
        + body.time_preference_weight
    )
    if s != 100:
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 100 (got {s})",
        )

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM optimizer_weights ORDER BY updated_at DESC LIMIT 1")
    existing = cur.fetchone()

    if existing:
        cur.execute(
            """
            UPDATE optimizer_weights SET
                professor_rating_weight = %s,
                compactness_weight = %s,
                time_preference_weight = %s,
                preferred_compactness = %s,
                updated_at = NOW()
            WHERE id = %s
            RETURNING id, professor_rating_weight, compactness_weight,
                      time_preference_weight, preferred_compactness, updated_at
            """,
            (
                body.professor_rating_weight,
                body.compactness_weight,
                body.time_preference_weight,
                body.preferred_compactness,
                existing[0],
            ),
        )
    else:
        cur.execute(
            """
            INSERT INTO optimizer_weights (
                professor_rating_weight, compactness_weight,
                time_preference_weight, preferred_compactness
            )
            VALUES (%s, %s, %s, %s)
            RETURNING id, professor_rating_weight, compactness_weight,
                      time_preference_weight, preferred_compactness, updated_at
            """,
            (
                body.professor_rating_weight,
                body.compactness_weight,
                body.time_preference_weight,
                body.preferred_compactness,
            ),
        )
    r = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return OptimizerWeightsRow(
        id=r[0],
        professor_rating_weight=r[1],
        compactness_weight=r[2],
        time_preference_weight=r[3],
        preferred_compactness=r[4],
        updated_at=r[5],
    )
