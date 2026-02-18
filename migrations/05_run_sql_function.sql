-- ============================================================
-- MEITHEAL MIGRATION 05 — AGENT SQL EXECUTION FUNCTION
-- Run in Supabase SQL editor after 04_member_proposal_rls.sql
--
-- Creates a Postgres function that the AI agent can call via
-- the service key to execute arbitrary SQL (DDL + DML).
--
-- Locked to service_role only — anon/authenticated cannot call it.
-- The agent uses this for schema changes (CREATE TABLE, ALTER TABLE)
-- when building new features.
-- ============================================================

CREATE OR REPLACE FUNCTION run_sql_admin(sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

-- Only service_role can execute this function
REVOKE ALL ON FUNCTION run_sql_admin(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION run_sql_admin(text) FROM anon, authenticated;
