"""
RateMyProfessor Scraper
Looks up every professor in the DB on RMP and stores their ratings.
Runs after gsu_scraper.py has populated the professors table.

Run modes (from backend/ directory):
  python -m scraper.rmp_scraper --debug
      Look up first 3 professors, print raw RMP responses, skip DB writes.

  python -m scraper.rmp_scraper --limit=20
      Only process the first 20 professors.

  python -m scraper.rmp_scraper
      Full run — all professors, updates DB, computes Bayesian ratings.
"""

import sys
import re
import time
import json
import argparse
import difflib
from typing import Optional

import requests

GSU_SCHOOL_ID  = "U2Nob29sLTM2MA=="
RMP_URL        = "https://www.ratemyprofessors.com/graphql"
REQUEST_DELAY  = 2    # seconds between RMP requests
MAX_RETRIES    = 3
MATCH_THRESHOLD = 0.6  # minimum similarity to accept a name match
BAYESIAN_C     = 10   # confidence constant for Bayesian smoothing

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"
    ),
    "Referer": "https://www.ratemyprofessors.com/",
}

SEARCH_QUERY = (
    "query TeacherSearchResultsPageQuery(\n"
    "  $query: TeacherSearchQuery!\n"
    "  $schoolID: ID\n"
    "  $includeSchoolFilter: Boolean!\n"
    ") {\n"
    "  search: newSearch {\n"
    "    ...TeacherSearchPagination_search_2MvZSr\n"
    "  }\n"
    "  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {\n"
    "    __typename\n"
    "    ... on School {\n"
    "      name\n"
    "      city\n"
    "      state\n"
    "      legacyId\n"
    "    }\n"
    "    id\n"
    "  }\n"
    "}\n"
    "\n"
    "fragment TeacherSearchPagination_search_2MvZSr on newSearch {\n"
    "  teachers(query: $query, first: 5, after: \"\") {\n"
    "    didFallback\n"
    "    edges {\n"
    "      cursor\n"
    "      node {\n"
    "        id\n"
    "        legacyId\n"
    "        firstName\n"
    "        lastName\n"
    "        avgRating\n"
    "        avgDifficulty\n"
    "        numRatings\n"
    "        wouldTakeAgainPercent\n"
    "        department\n"
    "        school {\n"
    "          id\n"
    "          name\n"
    "        }\n"
    "      }\n"
    "    }\n"
    "    pageInfo {\n"
    "      hasNextPage\n"
    "      endCursor\n"
    "    }\n"
    "    resultCount\n"
    "  }\n"
    "}\n"
)


# ---------------------------------------------------------------------------
# Name parsing
# ---------------------------------------------------------------------------

def parse_db_name(full_name: str) -> tuple[str, str]:
    """
    Parse a Banner-formatted name into (last_name, first_name).
    Input:  "Saghaeiannejad Esfahani, Sayed Hossein (Hossein)"
    Output: ("Saghaeiannejad Esfahani", "Sayed")
    Strips nicknames in parentheses and keeps only the first token of first name.
    """
    if "," in full_name:
        last, rest = full_name.split(",", 1)
        last = last.strip()
        first_clean = re.sub(r"\(.*?\)", "", rest).strip()
        first = first_clean.split()[0] if first_clean.split() else ""
    else:
        last = full_name.strip()
        first = ""
    return last, first


def _name_similarity(db_last: str, db_first: str, rmp_first: str, rmp_last: str) -> float:
    """
    Similarity score (0.0–1.0) between a DB name and an RMP result.
    Last name is weighted 70%, first name 30%.

    Handles compound DB last names (e.g. "Saghaeiannejad Esfahani") where
    RMP only stores the final component ("Esfahani") — checks for token
    membership before falling back to SequenceMatcher.
    """
    db_last_l  = db_last.lower()
    rmp_last_l = rmp_last.lower()

    # Exact or token match on last name → full score
    db_last_tokens = db_last_l.split()
    if rmp_last_l == db_last_l or rmp_last_l in db_last_tokens:
        last_score = 1.0
    else:
        last_score = difflib.SequenceMatcher(None, db_last_l, rmp_last_l).ratio()

    if db_first and rmp_first:
        # RMP may store full first name ("Sayed Hossein"); check prefix match too
        rmp_first_l = rmp_first.lower()
        db_first_l  = db_first.lower()
        if rmp_first_l.startswith(db_first_l) or db_first_l.startswith(rmp_first_l):
            first_score = 1.0
        else:
            first_score = difflib.SequenceMatcher(None, db_first_l, rmp_first_l).ratio()
    else:
        first_score = 0.5  # neutral when one side is missing

    return 0.7 * last_score + 0.3 * first_score


# ---------------------------------------------------------------------------
# RMP API
# ---------------------------------------------------------------------------

def _search_rmp(session: requests.Session, search_text: str) -> dict:
    """
    POST a GraphQL search to RMP scoped to GSU.
    Returns the raw JSON response dict.
    Retries up to MAX_RETRIES times with exponential backoff.
    """
    payload = {
        "operationName": "TeacherSearchResultsPageQuery",
        "variables": {
            "query": {
                "text": search_text,
                "schoolID": GSU_SCHOOL_ID,
                "fallback": True,
            },
            "schoolID": GSU_SCHOOL_ID,
            "includeSchoolFilter": True,
        },
        "query": SEARCH_QUERY,
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = session.post(RMP_URL, json=payload, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.HTTPError as e:
            wait = 2 ** attempt
            print(f"  [retry {attempt + 1}/{MAX_RETRIES}] HTTP {e} — waiting {wait}s...")
            time.sleep(wait)
        except requests.RequestException as e:
            wait = 2 ** attempt
            print(f"  [retry {attempt + 1}/{MAX_RETRIES}] Error {e} — waiting {wait}s...")
            time.sleep(wait)

    raise RuntimeError(f"Failed to reach RMP after {MAX_RETRIES} retries")


def _find_best_match(db_name: str, rmp_response: dict) -> Optional[dict]:
    """
    Given a DB professor name and an RMP search response, return the best
    matching node or None. Only accepts GSU results (school.id check).
    """
    try:
        edges = rmp_response["data"]["search"]["teachers"]["edges"]
    except (KeyError, TypeError):
        return None

    if not edges:
        return None

    db_last, db_first = parse_db_name(db_name)
    best_node  = None
    best_score = 0.0

    for edge in edges:
        node   = edge.get("node", {})
        school = node.get("school") or {}
        if school.get("id") != GSU_SCHOOL_ID:
            continue

        score = _name_similarity(
            db_last, db_first,
            node.get("firstName", ""),
            node.get("lastName", ""),
        )
        if score > best_score:
            best_score = score
            best_node  = node

    return best_node if best_score >= MATCH_THRESHOLD else None


# ---------------------------------------------------------------------------
# Bayesian rating
# ---------------------------------------------------------------------------

def _compute_bayesian_ratings(conn) -> int:
    """
    Compute and store adjusted_rating for all professors with ratings.
      m = global mean overall_rating (professors with num_ratings > 0)
      C = BAYESIAN_C
      adjusted = (C * m + overall_rating * num_ratings) / (C + num_ratings) / 5
    Returns count of rows updated.
    """
    cur = conn.cursor()
    cur.execute(
        "SELECT AVG(overall_rating) FROM professors WHERE num_ratings > 0"
    )
    row = cur.fetchone()
    global_mean = float(row[0]) if row and row[0] is not None else None

    if global_mean is None:
        cur.close()
        return 0

    print(f"  Global mean rating: {global_mean:.3f}")
    cur.execute(
        """
        UPDATE professors
        SET adjusted_rating = ROUND(
            ((%s * %s::numeric + overall_rating * num_ratings)
             / (%s + num_ratings) / 5.0)::numeric,
            4
        )
        WHERE num_ratings > 0
        """,
        (BAYESIAN_C, global_mean, BAYESIAN_C),
    )
    updated = cur.rowcount
    conn.commit()
    cur.close()
    return updated


# ---------------------------------------------------------------------------
# Main scrape
# ---------------------------------------------------------------------------

def scrape_rmp(debug: bool = False, limit: Optional[int] = None) -> None:
    """
    Look up every professor in the DB on RMP and update their ratings,
    then compute Bayesian adjusted_rating for all professors with data.
    """
    sys.path.insert(0, ".")
    from db.connection import get_db

    conn = get_db()
    cur  = conn.cursor()

    query = "SELECT id, name FROM professors ORDER BY id"
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    professors = cur.fetchall()
    cur.close()

    print(f"Professors to look up: {len(professors)}\n")

    session = requests.Session()
    session.headers.update(HEADERS)

    found     = 0
    not_found = 0

    for i, (prof_id, prof_name) in enumerate(professors, 1):
        db_last, db_first = parse_db_name(prof_name)
        print(f"[{i}/{len(professors)}] {prof_name}", end=" | ")

        # Search by last name first
        rmp_resp = _search_rmp(session, db_last)

        if debug:
            print(f"\n=== RAW RMP RESPONSE (search='{db_last}') ===")
            print(json.dumps(rmp_resp, indent=2)[:2000])

        match = _find_best_match(prof_name, rmp_resp)

        # Fallback: search "First Last" if last-name search had no confident match
        if match is None and db_first:
            time.sleep(REQUEST_DELAY)
            full_query = f"{db_first} {db_last}"
            rmp_resp2  = _search_rmp(session, full_query)
            if debug:
                print(f"\n=== FALLBACK RMP RESPONSE (search='{full_query}') ===")
                print(json.dumps(rmp_resp2, indent=2)[:2000])
            match = _find_best_match(prof_name, rmp_resp2)

        if match:
            rmp_id         = match["id"]
            overall_rating = match.get("avgRating")
            difficulty     = match.get("avgDifficulty")
            num_ratings    = match.get("numRatings", 0)
            department     = match.get("department")
            print(f"FOUND — rating={overall_rating}, n={num_ratings}, difficulty={difficulty}, dept={department}")
            found += 1

            if not debug:
                upd = conn.cursor()
                upd.execute(
                    """
                    UPDATE professors
                    SET rmp_id         = %s,
                        overall_rating = %s,
                        num_ratings    = %s,
                        difficulty     = %s,
                        department     = %s,
                        rmp_scraped_at = NOW()
                    WHERE id = %s
                    """,
                    (rmp_id, overall_rating, num_ratings, difficulty, department, prof_id),
                )
                conn.commit()
                upd.close()
        else:
            print("not found")
            not_found += 1

        if debug and i >= 3:
            print("\n[debug] Stopping after 3 professors. DB not touched.")
            conn.close()
            return

        time.sleep(REQUEST_DELAY)

    # Compute Bayesian adjusted ratings
    if not debug:
        print("\nComputing Bayesian adjusted ratings...")
        updated = _compute_bayesian_ratings(conn)
        print(f"  adjusted_rating written for {updated} professors")

    conn.close()

    total = found + not_found
    print(f"\n--- Summary ---")
    print(f"  Total processed: {total}")
    print(f"  Found on RMP:    {found}")
    print(f"  Not found:       {not_found}")
    if total > 0:
        print(f"  Match rate:      {found / total * 100:.1f}%")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RateMyProfessor Scraper for GSU")
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Look up first 3 professors, print raw RMP responses, skip DB writes",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Only process the first N professors",
    )
    args = parser.parse_args()

    if args.debug:
        print("=== DEBUG MODE — no DB writes ===\n")

    scrape_rmp(debug=args.debug, limit=args.limit)
