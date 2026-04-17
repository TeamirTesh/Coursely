"""
Local data quality verification script.
Run this after a scrape to confirm the DB looks correct.

Usage (from backend/):
  python scripts/test_local.py
"""

import sys

sys.path.insert(0, ".")
from db.connection import get_db


def run_checks():
    conn = get_db()
    cur  = conn.cursor()

    # ------------------------------------------------------------------
    # 1. Total counts
    # ------------------------------------------------------------------
    print("=" * 60)
    print("1. TOTAL COUNTS")
    print("=" * 60)

    cur.execute("SELECT COUNT(*) FROM courses")
    course_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM sections")
    section_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM professors")
    prof_count = cur.fetchone()[0]

    print(f"  Courses:    {course_count}")
    print(f"  Sections:   {section_count}")
    print(f"  Professors: {prof_count}")

    # ------------------------------------------------------------------
    # 2. 5 sample sections
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("2. SAMPLE SECTIONS (5)")
    print("=" * 60)

    cur.execute(
        """
        SELECT
            c.course_code,
            c.title,
            p.name         AS professor,
            s.meeting_days,
            s.start_time,
            s.end_time
        FROM sections s
        LEFT JOIN courses    c ON s.course_id    = c.id
        LEFT JOIN professors p ON s.professor_id = p.id
        ORDER BY s.id
        LIMIT 5
        """
    )
    rows = cur.fetchall()
    for row in rows:
        code, title, prof, days, start, end = row
        days_str  = ",".join(days) if days else "TBA"
        start_str = str(start) if start else "TBA"
        end_str   = str(end)   if end   else "TBA"
        print(f"  {code:<12} {title:<35} {(prof or 'TBA'):<30} "
              f"{days_str:<10} {start_str} – {end_str}")

    # ------------------------------------------------------------------
    # 3. Top 10 professors by adjusted_rating
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("3. TOP 10 PROFESSORS BY ADJUSTED RATING")
    print("=" * 60)

    cur.execute(
        """
        SELECT name, overall_rating, num_ratings, adjusted_rating
        FROM professors
        WHERE adjusted_rating IS NOT NULL
        ORDER BY adjusted_rating DESC
        LIMIT 10
        """
    )
    rows = cur.fetchall()
    if rows:
        print(f"  {'Name':<40} {'Rating':>6}  {'# Ratings':>9}  {'Adjusted':>8}")
        print("  " + "-" * 68)
        for name, rating, num_ratings, adjusted in rows:
            print(f"  {name:<40} {str(rating):>6}  {str(num_ratings):>9}  {float(adjusted):>8.4f}")
    else:
        print("  No professors with adjusted_rating yet — run rmp_scraper.py first.")

    # ------------------------------------------------------------------
    # 4. Sections with NULL professor_id (unmatched professors)
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("4. SECTIONS WITH NULL PROFESSOR (unmatched)")
    print("=" * 60)

    cur.execute(
        """
        SELECT s.crn, c.course_code, s.semester
        FROM sections s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE s.professor_id IS NULL
        ORDER BY c.course_code
        LIMIT 20
        """
    )
    rows = cur.fetchall()
    if rows:
        print(f"  {'CRN':<10} {'Course':<15} {'Semester'}")
        print("  " + "-" * 40)
        for crn, code, semester in rows:
            print(f"  {crn:<10} {(code or 'N/A'):<15} {semester}")
        cur.execute("SELECT COUNT(*) FROM sections WHERE professor_id IS NULL")
        total_null = cur.fetchone()[0]
        print(f"\n  Total sections with no professor: {total_null}")
    else:
        print("  None — all sections have a matched professor.")

    # ------------------------------------------------------------------
    # 5. Sections with NULL start_time (TBA times)
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("5. SECTIONS WITH TBA START TIME")
    print("=" * 60)

    cur.execute(
        """
        SELECT s.crn, c.course_code, s.semester
        FROM sections s
        LEFT JOIN courses c ON s.course_id = c.id
        WHERE s.start_time IS NULL
        ORDER BY c.course_code
        LIMIT 20
        """
    )
    rows = cur.fetchall()
    if rows:
        print(f"  {'CRN':<10} {'Course':<15} {'Semester'}")
        print("  " + "-" * 40)
        for crn, code, semester in rows:
            print(f"  {crn:<10} {(code or 'N/A'):<15} {semester}")
        cur.execute("SELECT COUNT(*) FROM sections WHERE start_time IS NULL")
        total_tba = cur.fetchone()[0]
        print(f"\n  Total sections with TBA time: {total_tba}")
    else:
        print("  None — all sections have a scheduled time.")

    print("\n" + "=" * 60)
    print("Verification complete.")
    print("=" * 60)

    cur.close()
    conn.close()


if __name__ == "__main__":
    run_checks()
