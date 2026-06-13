# Coursely

AI-powered schedule optimizer for Georgia State University students. Enter the courses you need, set your preferences, and Coursely generates conflict-free schedules ranked by professor ratings, compactness, and your time preferences.

**Live:** [coursely.dev](https://coursely.dev)

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI + psycopg2 (raw SQL, no ORM) |
| Database | PostgreSQL |
| Migrations | Alembic |
| Scraping | requests + BeautifulSoup (GSU Banner + RateMyProfessors) |
| Deploy | Vercel (frontend) · Railway (backend + DB) |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node 18+
- Docker (for local Postgres via docker-compose)

### 1. Clone and start the database

```bash
git clone https://github.com/TeamirTesh/Coursely.git
cd Coursely
docker-compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # defaults match docker-compose, no edits needed

python -m alembic upgrade head
uvicorn app.main:app --reload
```

API + interactive docs: http://localhost:8000/docs

### 3. Scrape course data

```bash
# From backend/ with .venv active
python -m scraper.gsu_scraper     # all GSU courses (~10 min)
python -m scraper.rmp_scraper     # professor ratings (~15 min)
```

Without this step the optimizer returns no results.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 (Vite proxies `/api` to the backend automatically)

---

## Database schema

| Table | Purpose |
|---|---|
| `users` | Default user `id=1`; schema is ready for real auth |
| `professors` | Name, RMP rating, Bayesian `adjusted_rating`, department |
| `courses` | Course code, title, credits, department |
| `sections` | CRN, semester, meeting days/times, capacity, enrollment |
| `time_preferences` | Per `(user, day, slot)` → avoid / okay / prefer |
| `optimizer_weights` | Per user: three weights summing to 100 + compactness target |
| `saved_schedules` | Saved result: label, score, CRNs, section snapshot |

Migrations live in `backend/alembic/versions/`.

---

## Project Structure

```
Coursely/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app + CORS middleware
│   │   ├── routes/           # courses, sections, schedules, preferences
│   │   └── models/           # Pydantic response models
│   ├── db/
│   │   └── connection.py     # psycopg2 connection helper
│   ├── scraper/
│   │   ├── gsu_scraper.py    # GSU Banner API scraper
│   │   └── rmp_scraper.py    # RateMyProfessors scraper
│   ├── alembic/              # Database migrations
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Landing, Optimizer
│   │   └── components/       # CourseInput, ScheduleCard, WeeklyCalendar, Navbar
│   └── vercel.json           # /api/* proxy rewrite → Railway
├── docker-compose.yml
└── LICENSE
```

---

## Schedule Generation and Ranking Model

The core engine lives in [`backend/app/services/scheduler.py`](backend/app/services/scheduler.py).

### 1. Enumeration

For a request with N courses, the engine takes the Cartesian product of all available sections across those courses, producing one candidate per unique combination of one section per course.

```
candidates = sections_course_1 x sections_course_2 x ... x sections_course_N
```

The search space is capped at **100,000 combinations**. If the product exceeds that, the request is rejected with an error explaining which courses have too many sections. Users can reduce the space by setting time preferences to narrow down valid slots.

### 2. Conflict detection

Two sections conflict if they share at least one meeting day **and** their time intervals overlap. The check is:

```
conflict = (days_A ∩ days_B ≠ ∅) AND NOT (end_A <= start_B OR end_B <= start_A)
```

Times with unknown values are treated as non-conflicting (online/async sections). Any combination with at least one conflicting pair is dropped.

### 3. Hard disqualification (avoid slots)

The user paints a weekly grid of 30-minute slots marked as **Avoid**, **Okay**, or **Prefer**. Any schedule where a class occupies an Avoid slot is immediately rejected before scoring. Slots not present in the grid are treated as neutral.

### 4. Scoring

Each surviving schedule receives three subscores, all normalized to `[0, 1]`, then combined into a weighted sum.

#### 4a. Professor score

```
professor_score = mean(adjusted_rating_i for each section i)
```

`adjusted_rating` is a Bayesian-smoothed RateMyProfessors score computed during scraping:

```
adjusted_rating = (n * raw_rating + C * global_mean) / (n + C)
```

where `n` is the number of ratings, `C = 10` is the confidence constant, and `global_mean` is the mean rating across all rated professors. Sections with no professor rating fall back to the global mean, so unrated professors neither reward nor penalize a schedule.

#### 4b. Compactness score

For each day with classes:

```
campus_time = last_end - first_start        (total time on campus)
class_time  = sum of all class durations
gap_time    = campus_time - class_time

daily_compactness = 1 - (gap_time / campus_time)
```

`daily_compactness` is 1.0 when classes are back-to-back with no gaps, and approaches 0 when most campus time is spent waiting.

The per-day values are averaged, then compared to the user's `preferred_compactness` slider (0 = spread out, 1 = back-to-back):

```
compactness_score = max(0, 1 - |preferred_compactness - mean(daily_compactness)|)
```

This means a user who wants a spread-out schedule scores high on low-compactness results, and a user who wants back-to-back classes scores high on dense schedules.

#### 4c. Time preference score

The user's grid maps each `(day, 30-min slot)` to a value: `0.0` (Avoid), `0.5` (Okay), or `1.0` (Prefer). For each class in the schedule, every 30-minute slot it occupies on every meeting day is looked up in the grid:

```
slot_score = mean(grid[day][slot] for all occupied (day, slot) pairs)
```

Slots not present in the grid are ignored. If no grid values apply, the score defaults to `1.0`.

### 5. Final score

```
total = w1 * professor_score + w2 * compactness_score + w3 * slot_score
```

The weights `w1`, `w2`, `w3` are set by the user and must sum to 1. Defaults are `0.40 / 0.30 / 0.30`. The total is multiplied by 100 for display (0-100 scale).

Schedules are sorted descending by total score and the top K are returned (default K = 3).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
