-- KSA Screening Bot Dashboard Database Schema
-- Following the same pattern as the sales training dashboard with separate tables

-- Candidates table (equivalent to consultants in sales dashboard)
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pending sessions table for tracking calls before completion
CREATE TABLE IF NOT EXISTS pending_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_phone TEXT NOT NULL,
  agent_key TEXT NOT NULL DEFAULT 'ksa_screening_interview_agent',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Call sessions table - main call records (equivalent to call_sessions in sales dashboard)
CREATE TABLE IF NOT EXISTS call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_phone TEXT NOT NULL,
  agent_key TEXT NOT NULL DEFAULT 'ksa_screening_interview_agent',
  status TEXT NOT NULL DEFAULT 'pending',
  transcription TEXT NULL,
  analysis JSONB NULL,
  audio_url TEXT NULL,
  conversation_id TEXT NULL,
  duration_seconds INTEGER NULL,
  started_at TIMESTAMPTZ NULL,
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone_number);
CREATE INDEX IF NOT EXISTS idx_pending_sessions_phone ON pending_sessions(candidate_phone);
CREATE INDEX IF NOT EXISTS idx_pending_sessions_created ON pending_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_call_sessions_phone ON call_sessions(candidate_phone);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created ON call_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);

-- Foreign key relationships (optional but good practice)
ALTER TABLE pending_sessions 
ADD CONSTRAINT fk_pending_sessions_candidate 
FOREIGN KEY (candidate_phone) REFERENCES candidates(phone_number) ON DELETE CASCADE;

ALTER TABLE call_sessions 
ADD CONSTRAINT fk_call_sessions_candidate 
FOREIGN KEY (candidate_phone) REFERENCES candidates(phone_number) ON DELETE CASCADE;