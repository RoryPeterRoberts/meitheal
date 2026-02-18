-- ============================================================
-- MEITHEAL BASE MIGRATION
-- Run this once in the Supabase SQL editor to initialise your Cell.
-- ============================================================

-- Members
CREATE TABLE IF NOT EXISTS members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id     uuid UNIQUE,
  email       text UNIQUE NOT NULL,
  display_name text,
  role        text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status      text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  joined_at   timestamptz DEFAULT now()
);

-- Community settings (key/value store)
CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       text,
  updated_at  timestamptz DEFAULT now()
);

-- Feedback from members
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid REFERENCES members(id) ON DELETE SET NULL,
  message     text NOT NULL,
  type        text DEFAULT 'idea' CHECK (type IN ('idea', 'bug', 'question', 'other')),
  status      text DEFAULT 'new' CHECK (status IN ('new', 'actioned', 'declined')),
  admin_note  text,
  created_at  timestamptz DEFAULT now()
);

-- Agent conversation history
CREATE TABLE IF NOT EXISTS conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid REFERENCES members(id) ON DELETE SET NULL,
  messages    jsonb DEFAULT '[]',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- AI usage / cost tracking
CREATE TABLE IF NOT EXISTS ai_usage (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts                timestamptz DEFAULT now(),
  provider          text,
  model             text,
  prompt_tokens     integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  cost_usd          numeric(10,6) DEFAULT 0,
  triggered_by      text,
  conversation_id   uuid REFERENCES conversations(id) ON DELETE SET NULL
);

-- Changelog: what the agent has built
CREATE TABLE IF NOT EXISTS changelog (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts              timestamptz DEFAULT now(),
  admin_id        uuid REFERENCES members(id) ON DELETE SET NULL,
  description     text,
  files_changed   jsonb,
  sql_run         text,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL
);

-- ============================================================
-- RLS: members can read their own row; agent uses service role
-- ============================================================
ALTER TABLE members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage     ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog    ENABLE ROW LEVEL SECURITY;

-- Members can read community settings
CREATE POLICY "settings_read" ON settings FOR SELECT USING (true);

-- Members can read their own row
CREATE POLICY "members_read_own" ON members FOR SELECT
  USING (auth.uid() = auth_id);

-- Members can read all members (directory)
CREATE POLICY "members_read_all" ON members FOR SELECT USING (true);

-- Members can submit feedback
CREATE POLICY "feedback_insert" ON feedback FOR INSERT
  WITH CHECK (author_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));

-- Members can read their own feedback
CREATE POLICY "feedback_read_own" ON feedback FOR SELECT
  USING (author_id IN (SELECT id FROM members WHERE auth_id = auth.uid()));

-- Members can read the changelog (transparency)
CREATE POLICY "changelog_read" ON changelog FOR SELECT USING (true);

-- Members can read ai_usage summary (transparency)
CREATE POLICY "ai_usage_read" ON ai_usage FOR SELECT USING (true);

-- ============================================================
-- Seed: default community settings
-- ============================================================
INSERT INTO settings (key, value) VALUES
  ('community_name',  'My Community'),
  ('initialized',     'true'),
  ('ai_provider',     'anthropic'),
  ('ai_model',        'claude-sonnet-4-6')
ON CONFLICT (key) DO NOTHING;
