"""
Shared DB connection module.
Imported by scrapers, lambda handler, and FastAPI routes (Phase 2).
Reads credentials from .env: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_db() -> psycopg2.extensions.connection:
    """Return a new psycopg2 connection using env vars."""
    conn = psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", 5432)),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )
    return conn
