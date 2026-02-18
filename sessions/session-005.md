# Session 005 — 2026-02-18

## What this session covered

Gemini thinking model fixes, settings persistence, noticeboard build, and rollback infrastructure.

---

## Fixes shipped

### 1. Settings not saving (RLS + error surfacing)
- **Root cause:** `settings` table had no write RLS policy — all saves silently failed
- **Fix:** `migrations/06_settings_write.sql` — adds INSERT/UPDATE policy for admins/stewards
- **Fix:** `admin.html saveSettings` — now destructures `{ error }` from Supabase upsert and surfaces it in the UI

### 2. Gemini thinking model — thought_signature
- **Error:** `INVALID_ARGUMENT: Function call is missing a thought_signature`
- **Root cause:** Our code normalised tool calls into our own format, stripping Gemini's `thought_signature` field
- **Fix:** `callOpenAI` now returns `rawToolCalls` (the verbatim `msg.tool_calls` from the API). The main loop echoes these back as-is each turn, preserving thought_signature

### 3. Gemini — double-escaped newlines in file writes
- **Symptom:** Agent-written files had 0 newlines — entire file on one line with literal `\n` strings, breaking all JavaScript (`//` comments commented out the rest of the file)
- **Root cause:** Gemini thinking model double-escapes newlines in JSON tool call arguments (`\\n` → literal `\n` after JSON.parse)
- **Fix:** `write_file` in `executeTool` detects the pattern (escapedNL > 10 && realNL === 0) and normalises `\n`→newline, `\t`→tab before writing to GitHub
- **Note:** Only `\n` and `\t` are corrected — `\'` and `\"` are left alone to avoid corrupting JS string literals

### 4. Noticeboard built by agent
- Files: `noticeboard.html`, `supabase.js` (getNotices/postNotice/deleteNotice), `home.html` (nav card added)
- Migration required (run manually): `migrations/noticeboard_notices.sql` — notices table + RLS
- Known issue: agent-written files had the double-escape newline bug (fixed manually, then auto-fix added)

---

## Rollback infrastructure

### How it works
1. `write_file` and `delete_file` in `executeTool` now capture the pre-build GitHub blob SHA
2. `runAgent` collects these into `rollbackSnapshots` and returns them
3. Handler saves to `changelog.rollback_snapshots` (JSONB)
4. `api/rollback.js` — new endpoint: fetches old blob content by SHA, writes it back, or deletes newly-created files; marks entry as `rolled_back: true`
5. Admin Build panel shows "Recent builds" section with Roll back button per entry

### Migration required
`migrations/07_changelog_rollback.sql`:
```sql
ALTER TABLE changelog
  ADD COLUMN IF NOT EXISTS rollback_snapshots JSONB,
  ADD COLUMN IF NOT EXISTS rolled_back BOOLEAN NOT NULL DEFAULT false;
```

### Limitation
Builds before session-005 have no snapshot data — "No snapshot" shown in UI

---

## Provider model names (confirmed Feb 2026)

| Provider | Model ID |
|----------|----------|
| Anthropic | claude-sonnet-4-6 |
| Gemini | gemini-3-flash-preview |
| Qwen | qwen3-max |
| Kimi | kimi-k2-turbo |

---

## What's next (pick up here tomorrow)

1. **Test noticeboard end-to-end** — post a notice, confirm delete works
2. **Run a clean build** to test all Gemini fixes together:
   - Submit: "A directory page showing all community members with their names and join date"
   - Triage → promote → approve → build
   - Verify console completes without errors
   - Check Build panel shows rollback button on the new entry
3. **Open items from earlier sessions:**
   - Steward designation UI
   - Notification system for member validation prompts
   - Changelog page may be sparse
