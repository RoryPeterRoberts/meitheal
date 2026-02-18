-- ============================================================
-- MEITHEAL MIGRATION 01 — PROPOSALS & FEEDBACK IMPROVEMENTS
-- Run in Supabase SQL editor after 00_base.sql
-- ============================================================

-- Add reference number sequence and column to feedback
CREATE SEQUENCE IF NOT EXISTS feedback_ref_seq START 1;

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS ref_number  integer DEFAULT nextval('feedback_ref_seq'),
  ADD COLUMN IF NOT EXISTS member_note text,
  ADD COLUMN IF NOT EXISTS promoted_at timestamptz;

-- Proposals (promoted feedback items)
CREATE TABLE IF NOT EXISTS proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id     uuid REFERENCES feedback(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  status          text DEFAULT 'proposed'
                  CHECK (status IN ('proposed','approved','building','done','declined')),
  promoted_by     uuid REFERENCES members(id) ON DELETE SET NULL,
  approved_by     uuid REFERENCES members(id) ON DELETE SET NULL,
  declined_reason text,
  build_started_at  timestamptz,
  build_finished_at timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Update changelog to link to proposals
ALTER TABLE changelog
  ADD COLUMN IF NOT EXISTS proposal_id  uuid REFERENCES proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suggested_by uuid REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suggested_by_name text;

-- RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- All members can read proposals (transparency)
CREATE POLICY "proposals_read" ON proposals FOR SELECT USING (true);

-- Only admins (via service role) can write proposals
-- (handled server-side with service key)

-- Update feedback RLS: admins can update (triage), members can read all
CREATE POLICY "feedback_read_all" ON feedback FOR SELECT USING (true);

-- ============================================================
-- Back-fill: give existing feedback items reference numbers
-- ============================================================
UPDATE feedback SET ref_number = nextval('feedback_ref_seq') WHERE ref_number IS NULL;
