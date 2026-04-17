"""
AWS Lambda entrypoint for the GSU scrape pipeline.

Triggered by EventBridge (every Sunday at 2AM UTC).
Runs the full GSU scrape: fetches all sections and upserts into RDS.

Environment variables (set in Lambda config, same names as .env):
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import json
import sys

# The Lambda container copies scraper/ and db/ into /var/task/
# so imports resolve correctly at runtime.
from scraper.gsu_scraper import scrape_semester, upsert_sections


def handler(event, context):
    """
    Lambda handler function.

    Args:
        event:   EventBridge event dict (not used — we always do a full scrape)
        context: Lambda context object

    Returns:
        dict with statusCode and body summarizing the scrape results
    """
    print("Lambda handler invoked. Starting GSU course scrape...")

    try:
        # Step 1: Scrape all sections from GSU schedule site
        sections = scrape_semester(debug=False)
        print(f"Scrape complete. Total sections fetched: {len(sections)}")

        # Step 2: Upsert into RDS
        summary = upsert_sections(sections)
        print(f"Upsert complete: {summary}")

        result = {
            "sections_scraped":     len(sections),
            "sections_upserted":    summary["sections_upserted"],
            "courses_upserted":     summary["courses_upserted"],
            "professors_upserted":  summary["professors_upserted"],
        }

        print(f"Lambda finished successfully: {result}")
        return {
            "statusCode": 200,
            "body": json.dumps(result),
        }

    except Exception as e:
        print(f"Lambda ERROR: {e}")
        raise  # Re-raise so Lambda marks the invocation as failed
