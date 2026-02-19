# Session 006 — 19 Feb 2026

## Goal
Full build sprint: implement 10 features from the task list derived from OpenGoban/partner review. Build all features, test as we go, copy patterns from OpenGoban where useful.

## What was built

### New pages
- **charter.html** — Community charter page. Loads `community_charter` from settings. Shows governance model summary and admins/stewards list. Empty state links admin to Settings.
- **audit.html** — Public governance log. Timeline of builds (from changelog), approvals, and declines (from proposals). Filterable by type. Summary strip with built/approved/declined counts.

### Modified pages
- **home.html** — Added Charter and Governance log nav cards. Extended notification badge on "My ideas" to count promoted proposals (not just pending validations).
- **directory.html** — Added `trust_level` to member fetch. Shows pip bar (4 dots) + text label (Invited/Member/Active/Steward/Admin) under each member name.
- **proposals.html** — Added community voting. Each proposed/approved proposal shows a 👍 Support button. Vote state is tracked per-member. Button updates in place without page reload.
- **my-feedback.html** — Added "Updates on your ideas" banner at top when member has promoted/approved/built ideas. Shows contextual messages.
- **admin.html** — Four improvements:
  1. Community charter textarea in Settings → Community section
  2. Agent memory size warning (yellow banner when AGENT.md > 6,000 chars)
  3. Build failure: shows Retry + Reset to approved buttons on failure
  4. Invite form: optional personal note field + copy-ready follow-up message after invite sent
- **setup.html** — Added community type selector (Residents' Assoc, Mutual Aid, Sports Club, Housing Co-op, Other). Pre-seeds community charter with relevant starter text.

### Modified infrastructure
- **supabase.js** — Added vote helpers: `getVotesForProposals`, `castVote`, `removeVote`
- **api/setup.js** — Receives `communityCharter` from wizard, saves it; `voting_enabled` now defaults to `true`
- **AGENT.md** — Updated: charter.html, audit.html added to page list; `community_charter` added to settings keys; `votes` table documented with migration note

### New migration
- **migrations/09_votes.sql** — `votes` table with RLS. One vote per member per proposal. Read: all authenticated. Insert/delete: own votes only (verified via auth_id).

## Commits
- `f3a4d9d` — "Add governance, community voice, and onboarding improvements"

## Key decisions
- Voting is simple upvotes only (no downvotes) — keeps it positive, mirrors community support not opposition
- Audit log uses existing tables (no new migration) — changelog + proposals cover the governance trail
- Invite "personal note" generates a copy-paste follow-up message rather than trying to inject into Supabase email (can't customise per-invite via API)
- Starter pack = community type → pre-seeded charter text. Full mutual aid exchange (credits, skills, calendar) is too complex for a setup-time option — better as an agent-built feature later.
- Trust level shown as pip bar (visual) + label (text) — both redundant for clarity

## What's still open
- Migration 09 was confirmed run in Supabase ✓
- The charter `community_charter` setting starts empty for existing installs — admin needs to fill it in manually from Settings
- Voting requires migration 09 — done for meitheal.vercel.app; any new installs get it automatically via setup wizard SQL block (not yet — 09 is not in the wizard SQL)
- **Gap**: migrations 00–07 are in the setup wizard SQL. Migration 09 is not. New installs won't have the votes table. Fix: add 09 to the setup wizard SQL block on next session.
- No email notifications — in-app only (badge + banner in my-feedback). Email would need a separate send infrastructure (Resend/Postmark).
