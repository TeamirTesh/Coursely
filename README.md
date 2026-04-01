# Coursely: GSU Course Planning Assistant

An AI-powered course planning assistant for Georgia State University students. Browse courses, compare professors, and build your semester schedule — all in one place.

## Tech Stack

| Layer    | Tech                          |
| -------- | ----------------------------- |
| Frontend | React 18 + Vite + TailwindCSS |
| Backend  | Python + FastAPI              |
| Data     | Hardcoded seed data (no DB)   |

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**

## API Endpoints

| Method | Path                      | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| GET    | `/courses`                | All courses (filter: `?department=`, `?difficulty=`) |
| GET    | `/courses/{id}`           | Single course                             |
| GET    | `/professors`             | All professors                            |
| GET    | `/professors/{id}`        | Single professor                          |
| GET    | `/sections`               | All sections (enriched with course + prof)|

## Features

- **Dashboard** — hero search bar + live stats from the API
- **Course Catalog** — search + filter by department and difficulty
- **Professors** — sortable grid with ratings and difficulty scores
- **Schedule Builder** — add/remove courses, see matching sections, live credit summary

## Project Structure

```
coursely/
├── backend/
│   ├── main.py           # FastAPI app + endpoints
│   ├── data.py           # Seed data (15 courses, 8 professors, 17 sections)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Professors.jsx
│   │   │   └── ScheduleBuilder.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   └── ProfessorCard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## GSU Color Theme

- **GSU Blue**: `#003087`
- Dark background with blue accents throughout the UI
