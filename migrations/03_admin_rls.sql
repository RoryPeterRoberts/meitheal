-- ============================================================
-- MEITHEAL MIGRATION 03 — ADMIN RLS POLICIES
-- Run in Supabase SQL editor after 02_trust_validation.sql
-- ============================================================

-- Admins and stewards can update feedback (triage)
CREATE POLICY "feedback_update_admin" ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'steward')
    )
  );

-- Admins and stewards can insert proposals
CREATE POLICY "proposals_insert_admin" ON proposals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'steward')
    )
  );

-- Admins and stewards can update proposals
CREATE POLICY "proposals_update_admin" ON proposals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE auth_id = auth.uid()
      AND role IN ('admin', 'steward')
    )
  );
