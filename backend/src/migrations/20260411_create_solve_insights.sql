-- Migration: Create solve_insights table to persist AI analysis
CREATE TABLE IF NOT EXISTS solve_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES solve_sessions(id) ON DELETE CASCADE,
    analysis_text TEXT NOT NULL,
    strengths TEXT[] NOT NULL DEFAULT '{}',
    weaknesses TEXT[] NOT NULL DEFAULT '{}',
    topics TEXT[] NOT NULL DEFAULT '{}',
    recommended_problems TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Adding index for faster retrieval of insights by sessionId
CREATE INDEX IF NOT EXISTS idx_solve_insights_session ON solve_insights(session_id);
