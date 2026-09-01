-- decluttered/database/schema.sql

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