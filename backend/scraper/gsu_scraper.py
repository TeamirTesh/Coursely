"""
GSU Banner Course Scraper
Hits the Banner (GoSolar) REST API to scrape all sections for a given term
and upsert them into the database.

Run modes (from backend/ directory):
  python -m scraper.gsu_scraper --debug --subject=CSC
      Fetches CSC only, prints first 2 raw API responses + first 3 parsed
      section dicts. Does NOT touch the DB.

  python -m scraper.gsu_scraper --subject=CSC
      Scrapes CSC only and upserts into DB.

  python -m scraper.gsu_scraper
      Scrapes all subjects for the configured term and upserts everything.
"""

import sys
import time
import argparse
import json
from datetime import datetime
from typing import Optional

import requests

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = "https://registration.gosolar.gsu.edu/StudentRegistrationSsb/ssb"
DEFAULT_TERM = "202608"
DEFAULT_SEMESTER_LABEL = "Fall Semester 2026"
PAGE_SIZE = 500
REQUEST_DELAY = 1   # seconds between subjects
MAX_RETRIES = 3

HEADERS = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
    ),
    "Referer": (
        f"{BASE_URL}/classSearch/classSearch"
    ),
}

DAY_MAP = {
    "monday":    "M",
    "tuesday":   "T",
    "wednesday": "W",
    "thursday":  "R",
    "friday":    "F",
    "saturday":  "S",
    "sunday":    "U",
}


# ---------------------------------------------------------------------------
# Session initialization (3-step Banner handshake)
# ---------------------------------------------------------------------------

def init_session(term_code: str) -> requests.Session:
    """
    Perform the 3-step Banner session init:
      1. GET  /term/termSelection?mode=search  → JSESSIONID cookie
      2. POST /term/search?mode=search         → selects term
      3. GET  /classSearch/classSearch         → synchronizer token
    Returns a Session with all cookies set and HEADERS applied.
    """
    session = requests.Session()
    session.headers.update(HEADERS)

    # Step 1 — get JSESSIONID
    url1 = f"{BASE_URL}/term/termSelection?mode=search"
    resp = session.get(url1, timeout=30)
    resp.raise_for_status()

    # Step 2 — select term
    url2 = f"{BASE_URL}/term/search?mode=search"
    resp = session.post(url2, data={"term": term_code}, timeout=30)
    resp.raise_for_status()

    # Step 3 — load class search page (sets synchronizer token)
    url3 = f"{BASE_URL}/classSearch/classSearch"
    resp = session.get(url3, timeout=30)
    resp.raise_for_status()

    return session


# ---------------------------------------------------------------------------
# Subject list
# ---------------------------------------------------------------------------

def get_all_subjects(session: requests.Session, term_code: str) -> list[str]:
    """
    Return a list of all subject codes (e.g. ["ACCT", "CSC", ...]) for the term.
    """
    url = f"{BASE_URL}/classSearch/get_subject"
    params = {
        "searchTerm": "",
        "term": term_code,
        "offset": 1,
        "max": 500,
    }
    resp = session.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return [entry["code"] for entry in data]


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_days(meeting_time: dict) -> Optional[list[str]]:
    """
    Convert the boolean day fields in a meetingTime object to a list of
    single-character abbreviations, e.g. ["M", "W"].
    Returns None if no days are set.
    """
    if not meeting_time:
        return None
    days = [abbr for field, abbr in DAY_MAP.items() if meeting_time.get(field)]
    return days if days else None


def parse_time(t: Optional[str]) -> Optional[datetime.time]:
    """
    Parse a Banner time string like "1100" or "0930" into a Python time object.
    Returns None for empty/null values.
    """
    if not t:
        return None
    try:
        return datetime.strptime(t, "%H%M").time()
    except ValueError:
        return None


def parse_section(item: dict, semester_label: str) -> dict:
    """
    Map a single Banner API result item to a clean section dict.
    """
    course_code = f"{item['subject']} {item['courseNumber']}"
    credits = item.get("creditHourLow")

    # Primary faculty member
    professor = None
    for fac in item.get("faculty", []):
        if fac.get("primaryIndicator"):
            professor = (fac.get("displayName") or "").strip() or None
            break

    # Meeting time info (first entry only)
    meeting_days = None
    start_time = None
    end_time = None
    location = None

    meetings = item.get("meetingsFaculty", [])
    if meetings:
        mt = meetings[0].get("meetingTime", {})
        if mt:
            meeting_days = parse_days(mt)
            start_time = parse_time(mt.get("beginTime"))
            end_time = parse_time(mt.get("endTime"))
            building = mt.get("buildingDescription", "") or ""
            room = mt.get("room", "") or ""
            if building or room:
                location = f"{building} {room}".strip()

    return {
        "crn":          item["courseReferenceNumber"],
        "course_code":  course_code,
        "title":        item.get("courseTitle"),
        "credits":      credits,
        "department":   item.get("subject"),
        "professor":    professor,
        "meeting_days": meeting_days,
        "start_time":   start_time,
        "end_time":     end_time,
        "location":     location,
        "capacity":     item.get("maximumEnrollment"),
        "enrolled":     item.get("enrollment"),
        "semester":     semester_label,
    }


# ---------------------------------------------------------------------------
# Fetching sections for one subject (with pagination + retry)
# ---------------------------------------------------------------------------

def fetch_sections_for_subject(
    session: requests.Session,
    term_code: str,
    subject: str,
    semester_label: str,
    debug: bool = False,
) -> list[dict]:
    """
    Fetch and parse all sections for a single subject, handling pagination.
    Retries up to MAX_RETRIES times with exponential backoff on HTTP errors.
    Returns a list of parsed section dicts.
    """
    url = f"{BASE_URL}/searchResults/searchResults"
    sections = []
    page_offset = 0
    raw_printed = 0

    while True:
        params = {
            "txt_subject":     subject,
            "txt_term":        term_code,
            "txt_level":       "US",
            "startDatepicker": "",
            "endDatepicker":   "",
            "pageOffset":      page_offset,
            "pageMaxSize":     PAGE_SIZE,
            "sortColumn":      "subjectDescription",
            "sortDirection":   "asc",
        }

        # Retry loop
        resp = None
        for attempt in range(MAX_RETRIES):
            try:
                resp = session.get(url, params=params, timeout=30)
                resp.raise_for_status()
                break
            except requests.HTTPError as e:
                wait = 2 ** attempt
                print(f"  [retry {attempt + 1}/{MAX_RETRIES}] HTTP {e} — waiting {wait}s...")
                time.sleep(wait)
            except requests.RequestException as e:
                wait = 2 ** attempt
                print(f"  [retry {attempt + 1}/{MAX_RETRIES}] Error {e} — waiting {wait}s...")
                time.sleep(wait)
        else:
            raise RuntimeError(f"Failed to fetch {subject} after {MAX_RETRIES} retries")

        payload = resp.json()

        if debug and raw_printed < 2:
            print(f"\n=== RAW API RESPONSE (page_offset={page_offset}) ===")
            print(json.dumps(payload, indent=2)[:3000])
            raw_printed += 1

        if not payload.get("success"):
            print(f"  [warn] success=false for {subject} at offset {page_offset}")
            break

        items = payload.get("data") or []
        total = payload.get("totalCount", 0)

        for item in items:
            sections.append(parse_section(item, semester_label))

        fetched_so_far = page_offset + len(items)
        if fetched_so_far >= total or not items:
            break

        page_offset += len(items)

    return sections


# ---------------------------------------------------------------------------
# DB upserts
# ---------------------------------------------------------------------------

def upsert_sections(sections: list[dict]) -> dict:
    """
    Upsert courses, professors, and sections into the DB.
    Order: course → professor → section.
    All inserts use ON CONFLICT to avoid duplicates.
    Returns a summary dict with upsert counts.
    """
    sys.path.insert(0, ".")
    from db.connection import get_db
    conn = get_db()
    cur = conn.cursor()

    courses_upserted = 0
    professors_upserted = 0
    sections_upserted = 0

    for sec in sections:
        # --- Course ---
        if sec["course_code"]:
            cur.execute(
                """
                INSERT INTO courses (course_code, title, credits, department)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (course_code) DO UPDATE
                    SET title      = EXCLUDED.title,
                        credits    = EXCLUDED.credits,
                        department = EXCLUDED.department
                RETURNING id
                """,
                (sec["course_code"], sec["title"], sec["credits"], sec["department"]),
            )
            course_id = cur.fetchone()[0]
            courses_upserted += 1
        else:
            course_id = None

        # --- Professor ---
        professor_id = None
        name = sec["professor"]
        if name and name.strip().upper() not in ("TBA", "STAFF", ""):
            cur.execute(
                """
                INSERT INTO professors (name)
                VALUES (%s)
                ON CONFLICT (name) DO NOTHING
                RETURNING id
                """,
                (name,),
            )
            row = cur.fetchone()
            if row:
                professor_id = row[0]
                professors_upserted += 1
            else:
                cur.execute("SELECT id FROM professors WHERE name = %s", (name,))
                professor_id = cur.fetchone()[0]

        # --- Section ---
        cur.execute(
            """
            INSERT INTO sections (
                course_id, professor_id, crn, semester,
                meeting_days, start_time, end_time,
                location, capacity, enrolled, scraped_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (crn) DO UPDATE
                SET course_id    = EXCLUDED.course_id,
                    professor_id = EXCLUDED.professor_id,
                    semester     = EXCLUDED.semester,
                    meeting_days = EXCLUDED.meeting_days,
                    start_time   = EXCLUDED.start_time,
                    end_time     = EXCLUDED.end_time,
                    location     = EXCLUDED.location,
                    capacity     = EXCLUDED.capacity,
                    enrolled     = EXCLUDED.enrolled,
                    scraped_at   = NOW()
            """,
            (
                course_id,
                professor_id,
                sec["crn"],
                sec["semester"],
                sec["meeting_days"],
                sec["start_time"],
                sec["end_time"],
                sec["location"],
                sec["capacity"],
                sec["enrolled"],
            ),
        )
        sections_upserted += 1

    conn.commit()
    cur.close()
    conn.close()

    return {
        "courses_upserted":     courses_upserted,
        "professors_upserted":  professors_upserted,
        "sections_upserted":    sections_upserted,
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def scrape(
    term_code: str,
    semester_label: str,
    debug: bool = False,
    subject_filter: Optional[str] = None,
) -> None:
    """
    Main scrape entry point.

    debug=True   → fetch one subject, print first 2 raw API responses and
                   first 3 parsed section dicts; do NOT write to DB.
    subject_filter → only scrape that one subject (e.g. "CSC").
    """
    print(f"Initializing Banner session for term {term_code}...")
    session = init_session(term_code)
    print("Session ready.\n")

    if subject_filter:
        subjects = [subject_filter.upper()]
    else:
        print("Fetching subject list...")
        subjects = get_all_subjects(session, term_code)
        print(f"Found {len(subjects)} subjects.\n")

    all_sections = []

    for i, subject in enumerate(subjects, 1):
        print(f"[{i}/{len(subjects)}] Fetching {subject}...")
        sections = fetch_sections_for_subject(
            session, term_code, subject, semester_label, debug=debug
        )
        print(f"  -> {len(sections)} sections parsed")

        if debug:
            print("\n=== FIRST 3 PARSED SECTION DICTS ===")
            for s in sections[:3]:
                print(json.dumps(
                    {k: str(v) if hasattr(v, "isoformat") else v for k, v in s.items()},
                    indent=2,
                ))
            print("\n[debug] Stopping after first subject. DB not touched.")
            return

        all_sections.extend(sections)
        if i < len(subjects):
            time.sleep(REQUEST_DELAY)

    print(f"\nTotal sections scraped: {len(all_sections)}")
    print("Upserting into DB...")
    summary = upsert_sections(all_sections)
    print(f"Done.")
    print(f"  Courses upserted:     {summary['courses_upserted']}")
    print(f"  Professors upserted:  {summary['professors_upserted']}")
    print(f"  Sections upserted:    {summary['sections_upserted']}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GSU Banner Course Scraper")
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Fetch one subject, print raw API + parsed dicts, skip DB writes",
    )
    parser.add_argument(
        "--subject",
        metavar="CODE",
        default=None,
        help="Only scrape this subject (e.g. --subject=CSC)",
    )
    parser.add_argument(
        "--term",
        default=DEFAULT_TERM,
        help=f"Banner term code (default: {DEFAULT_TERM})",
    )
    parser.add_argument(
        "--semester-label",
        default=DEFAULT_SEMESTER_LABEL,
        help=f'Semester label stored in DB (default: "{DEFAULT_SEMESTER_LABEL}")',
    )
    args = parser.parse_args()

    if args.debug:
        print("=== DEBUG MODE — no DB writes ===\n")

    scrape(
        term_code=args.term,
        semester_label=args.semester_label,
        debug=args.debug,
        subject_filter=args.subject,
    )
