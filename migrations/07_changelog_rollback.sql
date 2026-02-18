-- Add rollback support to changelog
-- rollback_snapshots: pre-build file state [{path, sha, existed}]
-- rolled_back: true once a rollback has been executed

ALTER TABLE changelog
  ADD COLUMN IF NOT EXISTS rollback_snapshots JSONB,
  ADD COLUMN IF NOT EXISTS rolled_back BOOLEAN NOT NULL DEFAULT false;
