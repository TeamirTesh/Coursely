CREATE TABLE IF NOT EXISTS professors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rmp_id TEXT,
    overall_rating NUMERIC(3,1),
    num_ratings INTEGER DEFAULT 0,
    difficulty NUMERIC(3,1),
    adjusted_rating NUMERIC(5,4),
    rmp_scraped_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_code TEXT NOT NULL,
    title TEXT NOT NULL,
    credits INTEGER,
    department TEXT,
    UNIQUE(course_code)
);

CREATE TABLE IF NOT EXISTS sections (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    professor_id INTEGER REFERENCES professors(id) ON DELETE SET NULL,
    crn TEXT UNIQUE,
    semester TEXT NOT NULL,
    meeting_days TEXT[],
    start_time TIME,
    end_time TIME,
    location TEXT,
    capacity INTEGER,
    enrolled INTEGER,
    scraped_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_semester ON sections(semester);
CREATE INDEX IF NOT EXISTS idx_sections_professor ON sections(professor_id);