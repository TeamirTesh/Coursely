# Contributing to Coursely

Thanks for your interest. Here's everything you need to get up and running.

## Local setup

Follow the steps in [README.md](README.md) to get the full stack running locally. The short version:

```bash
docker-compose up -d                      # start Postgres
cd backend && pip install -r requirements.txt
cp .env.example .env                      # defaults work with docker-compose
python -m alembic upgrade head
uvicorn app.main:app --reload &
cd ../frontend && npm install && npm run dev
```

## Making changes

### Backend (Python / FastAPI)
- All routes live in `backend/app/routes/`
- Raw SQL only, no ORM. Queries go directly through psycopg2 via `db/connection.py`
- When you change the schema, create a new Alembic migration:
  ```bash
  cd backend
  python -m alembic revision -m "describe_your_change"
  # edit the generated file in alembic/versions/ with raw SQL
  python -m alembic upgrade head
  ```

### Frontend (React / Vite)
- Pages in `frontend/src/pages/`, shared components in `frontend/src/components/`
- API calls use relative `/api/*` paths; Vite's dev proxy handles routing to the backend
- Design system: dark canvas `#0f0e0c`, Instrument Serif + Inter typography, no border-radius

### Scrapers
- `backend/scraper/gsu_scraper.py`: hits GSU's Banner REST API, upserts courses/sections/professors
- `backend/scraper/rmp_scraper.py`: looks up professors on RateMyProfessors, updates ratings
- Both support `--debug` (dry run, no DB writes) and `--subject=XXX` (single department)

## Submitting a pull request

1. Fork the repo and create a branch: `git checkout -b your-feature`
2. Make your changes
3. Open a PR against `main` and fill out the template
4. A maintainer will review within a few days

## Reporting bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening an issue.

## Ideas and feature requests

Open a [feature request](.github/ISSUE_TEMPLATE/feature_request.md) or start a GitHub Discussion.
