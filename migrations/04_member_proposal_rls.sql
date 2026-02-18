-- ============================================================
-- MEITHEAL MIGRATION 04 — MEMBER SELF-UPDATE ON PROPOSALS
-- Run in Supabase SQL editor after 03_admin_rls.sql
--
-- Allows the original submitter of a piece of feedback to:
--   1. Add a clarification note to their proposal
--   2. Submit a validation response (yes/not quite) after build
--
-- These are the only two member-initiated writes to proposals.
-- Both go through the anon client (not service role), so they
-- need explicit RLS policies.
-- ============================================================

-- Members can update proposals that originated from their feedback.
-- This covers: clarification_note, member_validated, member_validation_note.
--
-- We can't restrict this to specific columns in Postgres RLS —
-- but access is limited to proposals linked to the member's OWN feedback,
-- which bounds the attack surface appropriately.

CREATE POLICY "proposals_member_self_update" ON proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM feedback f
      JOIN members m ON m.id = f.author_id
      WHERE f.id = proposals.feedback_id
        AND m.auth_id = auth.uid()
    )
  );
