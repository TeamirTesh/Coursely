"""
Schedule generation engine.
Takes sections grouped by course and returns ranked, conflict-free schedules.
"""

import itertools
from typing import Optional


# ---------------------------------------------------------------------------
# Time helpers
# ---------------------------------------------------------------------------

def _to_minutes(t: Optional[str]) -> Optional[int]:
    """Convert 'HH:MM:SS' or 'HH:MM' to minutes since midnight."""
    if not t:
        return None
    parts = t.split(":")
    try:
        return int(parts[0]) * 60 + int(parts[1])
    except (ValueError, IndexError):
        return None


def _slot_keys(start_min: int, end_min: int) -> list[str]:
    """
    Return all 30-minute slot keys that fall within [start_min, end_min).
    Keys are 'HH:MM' strings aligned to 30-minute boundaries.
    """
    slots = []
    t = (start_min // 30) * 30
    while t < end_min:
        slots.append(f"{t // 60:02d}:{t % 60:02d}")
        t += 30
    return slots


# ---------------------------------------------------------------------------
# Conflict detection
# ---------------------------------------------------------------------------

def _sections_conflict(a: dict, b: dict) -> bool:
    """True if two sections overlap on at least one shared day."""
    days_a = set(a.get("meeting_days") or [])
    days_b = set(b.get("meeting_days") or [])
    if not (days_a & days_b):
        return False

    s_a = _to_minutes(a.get("start_time"))
    e_a = _to_minutes(a.get("end_time"))
    s_b = _to_minutes(b.get("start_time"))
    e_b = _to_minutes(b.get("end_time"))

    if any(v is None for v in (s_a, e_a, s_b, e_b)):
        return False  # unknown times → assume no conflict

    return not (e_a <= s_b or e_b <= s_a)


def has_conflict(schedule: list[dict]) -> bool:
    for i in range(len(schedule)):
        for j in range(i + 1, len(schedule)):
            if _sections_conflict(schedule[i], schedule[j]):
                return True
    return False


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def _slot_score(schedule: list[dict], grid: dict) -> tuple[float, bool]:
    """
    Compute the slot score for a schedule against the preference grid.
    Returns (score, red_disqualified).
    A red cell (value == 0.0) in any occupied slot disqualifies the schedule.
    Empty grid → score 1.0, not disqualified.
    """
    if not grid:
        return 1.0, False

    values: list[float] = []

    for section in schedule:
        days = section.get("meeting_days") or []
        start_min = _to_minutes(section.get("start_time"))
        end_min = _to_minutes(section.get("end_time"))

        if not days or start_min is None or end_min is None:
            continue

        for day in days:
            day_grid = grid.get(day, {})
            for slot in _slot_keys(start_min, end_min):
                val = day_grid.get(slot)
                if val is not None:
                    if val == 0.0:
                        return 0.0, True  # hard disqualifier
                    values.append(val)

    return (sum(values) / len(values)) if values else 1.0, False


def _professor_score(schedule: list[dict], global_mean: float) -> float:
    """
    Average adjusted_rating across all sections.
    Sections with no rating fall back to global_mean.
    """
    ratings = [
        float(s["adjusted_rating"]) if s.get("adjusted_rating") is not None else global_mean
        for s in schedule
    ]
    return sum(ratings) / len(ratings) if ratings else global_mean


def _compactness_score(schedule: list[dict], preferred: float) -> float:
    """
    actual_compactness = 1 - (gap_time / campus_time) averaged across days.
    score = 1 - |preferred - actual_compactness|, clamped to [0, 1].
    """
    by_day: dict[str, list[tuple[int, int]]] = {}

    for section in schedule:
        days = section.get("meeting_days") or []
        start_min = _to_minutes(section.get("start_time"))
        end_min = _to_minutes(section.get("end_time"))
        if not days or start_min is None or end_min is None:
            continue
        for day in days:
            by_day.setdefault(day, []).append((start_min, end_min))

    if not by_day:
        return 1.0

    daily: list[float] = []
    for intervals in by_day.values():
        intervals.sort()
        campus_time = intervals[-1][1] - intervals[0][0]
        if campus_time == 0:
            daily.append(1.0)
            continue
        class_time = sum(e - s for s, e in intervals)
        gap_time = campus_time - class_time
        daily.append(1.0 - gap_time / campus_time)

    actual = sum(daily) / len(daily)
    return max(0.0, 1.0 - abs(preferred - actual))


def score_schedule(
    schedule: list[dict],
    grid: dict,
    weights: dict,
    preferred_compactness: float,
    global_mean: float,
) -> tuple[Optional[dict], bool]:
    """
    Score a schedule. Returns (scores_dict, disqualified).
    disqualified=True means a red grid cell was hit — skip this schedule.
    """
    slot, red = _slot_score(schedule, grid)
    if red:
        return None, True

    prof       = _professor_score(schedule, global_mean)
    compactness = _compactness_score(schedule, preferred_compactness)

    w1 = weights.get("professor", 0.40)
    w2 = weights.get("compactness", 0.30)
    w3 = weights.get("slot", 0.30)

    total = w1 * prof + w2 * compactness + w3 * slot

    return {
        "professor_score":   round(prof, 4),
        "compactness_score": round(compactness, 4),
        "slot_score":        round(slot, 4),
        "total":             round(total * 100, 2),  # 0–100 display scale
    }, False


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

MAX_COMBINATIONS = 100_000


def generate_schedules(
    sections_by_course: dict[str, list[dict]],
    grid: dict,
    weights: dict,
    preferred_compactness: float,
    global_mean: float,
    max_results: int = 3,
) -> list[dict]:
    """
    Generate all valid schedules from the Cartesian product of sections
    per course, then filter, score, and return the top max_results.
    Raises ValueError if the combination space exceeds MAX_COMBINATIONS.
    """
    course_codes  = list(sections_by_course.keys())
    section_lists = [sections_by_course[c] for c in course_codes]

    # Guard: fail fast before iterating a huge product
    combo_count = 1
    for lst in section_lists:
        combo_count *= len(lst)
    if combo_count > MAX_COMBINATIONS:
        counts = {c: len(s) for c, s in sections_by_course.items()}
        raise ValueError(
            f"Too many combinations ({combo_count:,}) — max is {MAX_COMBINATIONS:,}. "
            f"Section counts: {counts}. Try fewer courses or add time preferences to reduce options."
        )

    results: list[dict] = []

    for combo in itertools.product(*section_lists):
        schedule = list(combo)

        if has_conflict(schedule):
            continue

        scores, disqualified = score_schedule(
            schedule, grid, weights, preferred_compactness, global_mean
        )
        if disqualified:
            continue

        results.append({"sections": schedule, **scores})

    results.sort(key=lambda x: x["total"], reverse=True)
    return results[:max_results]
