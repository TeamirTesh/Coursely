-- ============================================================================
-- Coursely — full schema (fresh install)
-- 6 user-scoped tables: users, time_preferences, optimizer_weights, saved_schedules
-- + catalog: professors, courses, sections
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    university TEXT DEFAULT 'Georgia State University',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rmp_id TEXT,
    overall_rating NUMERIC(3,1),
    num_ratings INTEGER DEFAULT 0,
    difficulty NUMERIC(3,1),
    adjusted_rating NUMERIC(5,4),
    department TEXT,
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

CREATE TABLE IF NOT EXISTS time_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id),
    day TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    preference SMALLINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, day, time_slot),
    CONSTRAINT time_preferences_day_check CHECK (day IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')),
    CONSTRAINT time_preferences_pref_check CHECK (preference IN (0, 1, 2))
);

CREATE INDEX IF NOT EXISTS idx_time_preferences_user ON time_preferences(user_id);

CREATE TABLE IF NOT EXISTS optimizer_weights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id),
    professor_rating_weight SMALLINT NOT NULL,
    compactness_weight SMALLINT NOT NULL,
    time_preference_weight SMALLINT NOT NULL,
    preferred_compactness SMALLINT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT optimizer_weights_sum_check CHECK (
        professor_rating_weight + compactness_weight + time_preference_weight = 100
    ),
    CONSTRAINT optimizer_weights_compact_check CHECK (
        preferred_compactness BETWEEN 0 AND 100
    )
);

CREATE INDEX IF NOT EXISTS idx_optimizer_weights_user ON optimizer_weights(user_id);

CREATE TABLE IF NOT EXISTS saved_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id),
    label TEXT NOT NULL,
    term TEXT NOT NULL,
    score NUMERIC(5,2),
    crns TEXT[],
    professor_score NUMERIC(10,5),
    compactness_score NUMERIC(10,5),
    slot_score NUMERIC(10,5),
    rank_snapshot INTEGER,
    sections_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_schedules_user ON saved_schedules(user_id);

-- Required so DEFAULT 1 on FKs resolves (first row gets id = 1)
INSERT INTO users (name, email, university)
VALUES ('Default User', 'default@coursely.app', 'Georgia State University')
ON CONFLICT (email) DO NOTHING;
