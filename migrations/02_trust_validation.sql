-- ============================================================
-- MEITHEAL MIGRATION 02 — TRUST LEVELS & MEMBER VALIDATION
-- Run in Supabase SQL editor after 01_proposals.sql
-- ============================================================

-- ============================================================
-- 1. Members: add trust_level + expand role to include steward
-- ============================================================

-- trust_level: 0=invited, 1=member, 2=active, 3=steward, 4=admin
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS trust_level integer DEFAULT 1
    CHECK (trust_level BETWEEN 0 AND 4);

-- Expand role constraint to include 'steward'
-- (must drop and recreate the check constraint)
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_role_check;
ALTER TABLE members ADD CONSTRAINT members_role_check
  CHECK (role IN ('admin', 'steward', 'member'));

-- Back-fill: set trust_level based on existing role values
UPDATE members SET trust_level = 4 WHERE role = 'admin';
UPDATE members SET trust_level = 1 WHERE role = 'member' AND trust_level = 1;

-- ============================================================
-- 2. Feedback: add 'triaged' status + priority field
-- ============================================================

-- Base schema only had: new, actioned, declined
-- Add 'triaged' as intermediate triage step
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('new', 'triaged', 'actioned', 'declined'));

-- Priority for triage ordering
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS priority text
    CHECK (priority IN ('high', 'medium', 'low'));

-- ============================================================
-- 3. Proposals: add member validation + clarification fields
-- ============================================================

ALTER TABLE proposals
  -- Member validation after build (✅ / 🔄)
  ADD COLUMN IF NOT EXISTS member_validated     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS member_validated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS member_validation_note text,

  -- Original submitter can clarify if admin misunderstood their intent
  ADD COLUMN IF NOT EXISTS clarification_note   text,
  ADD COLUMN IF NOT EXISTS clarification_by     uuid REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS clarification_at     timestamptz;

-- ============================================================
-- 4. RLS additions
-- ============================================================

-- Members can update their own proposal validation response
-- (handled server-side with service key — no client-side RLS needed)

-- Members can read their own feedback (any status)
-- (already exists from base: feedback_read_own)
-- Members can now also read all feedback — already added in 01 (feedback_read_all)

-- ============================================================
-- 5. Seed: default settings additions
-- ============================================================

INSERT INTO settings (key, value) VALUES
  ('steward_enabled',  'true'),
  ('voting_enabled',   'false')
ON CONFLICT (key) DO NOTHING;
