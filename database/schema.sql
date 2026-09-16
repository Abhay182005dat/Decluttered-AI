-- database/schema.sql

CREATE TABLE IF NOT EXISTS event_clusters (
    id UUID PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(50),
    article_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    source_url TEXT UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    cluster_id UUID REFERENCES event_clusters(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID UNIQUE REFERENCES event_clusters(id) ON DELETE CASCADE,
    what_happened TEXT NOT NULL,
    why_it_happened TEXT NOT NULL,
    latest_updates TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Users Table (Supports both Google OAuth & Native Auth + Onboarding)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE,              -- NULL for email/password users
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),                 -- NULL for Google OAuth users
    name VARCHAR(255),
    picture TEXT,
    interests TEXT[] DEFAULT '{}',              -- Array of selected topics (e.g., {'tech', 'markets'})
    onboarding_completed BOOLEAN DEFAULT FALSE,  -- Flags if user completed topic selection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bookmarks / Saved Event Clusters Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES event_clusters(id) ON DELETE CASCADE, -- Fixed to UUID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, cluster_id)
);

-- Index for fast user bookmark lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);