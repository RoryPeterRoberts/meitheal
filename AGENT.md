# Agent Memory

This file is your persistent memory. Read it before every build. Update it after every build using `update_memory`.

## Platform structure

### Member-facing pages
- `home.html` — landing page: welcome block, nav grid (Noticeboard, Members, What we've built, My ideas, Proposals, Charter)
- `noticeboard.html` — community announcements, pinned posts, admin/steward posting
- `directory.html` — member list with role badges and join dates
- `my-feedback.html` — member's own submissions, linked proposals, validation prompts
- `proposals.html` — full proposals board (all statuses, clarification notes)
- `changelog.html` — history of built features with file chips and suggester attribution
- `charter.html` — community charter (values/rules from settings key `community_charter`) + governance model + admins/stewards list
- `audit.html` — governance log: builds from changelog + proposal approvals/declines, filterable by type

### Admin pages (role: admin or steward)
- `admin.html` — three-panel dashboard:
  - Overview: stat cards, feedback preview, proposals kanban (approve from here), AI cost
  - Build queue: approved proposals, trigger agent builds from here
  - Members: invite form, full member list, role management (member ↔ steward), deactivate
- `triage.html` — inbox for new feedback: accept/decline/promote to proposal

### Infrastructure
- `feedback-widget.js` — floating button on any page; members submit feedback without leaving
- `js/auth.js` — `requireAuthAsync()` used on every member-facing page
- `supabase.js` — shared data helpers (feedback, proposals, changelog, members, settings)
- `theme.css` — design system: all CSS variables (colors, spacing, typography, shadows)
- `api/agent.js` — this agent (never modify)
- `api/link-auth.js` — links Supabase auth_id to member row on first sign-in
- `api/invite.js` — invite/list/set-role/deactivate members (admin only, service key)
- `api/init.js` — injects SUPABASE_URL + SUPABASE_ANON_KEY into every page as first script

## Database schema

- `members` — id, email, display_name, role (member/steward/admin), trust_level, status, auth_id, created_at
- `feedback` — id, author_id→members, type (idea/bug/question/other), message, status, ref_number, admin_note
- `proposals` — id, feedback_id→feedback, title, description, status (proposed/approved/building/done/declined), promoted_by, approved_by, build_started_at, build_finished_at, member_validated, member_validated_at, clarification_note
- `changelog` — id, ts, description, files_changed (jsonb [{action,path}]), sql_run, proposal_id, suggested_by, suggested_by_name, admin_id, conversation_id
- `settings` — key/value: community_name, community_charter, ai_provider, ai_model, ai_api_key, site_url, initialized, steward_enabled, voting_enabled
- `votes` — proposal_id→proposals, member_id→members, created_at. UNIQUE(proposal_id, member_id). Used for community voting on proposals.
  Migration: `migrations/09_votes.sql` (must be run in Supabase SQL editor)
- `notices` — id, title, body, author_id→members, pinned, created_at
- `ai_usage` — provider, model, prompt_tokens, completion_tokens, cost_usd, ts, conversation_id
- `conversations` — id, messages (jsonb), updated_at

## Code conventions

- Every page is a self-contained `.html` file with `<style>` in `<head>`
- Use `theme.css` variables exclusively — no hardcoded colours or sizes
- Member pages: max-width 640px, centred, back-button nav to home.html
- Admin pages: full-viewport sidebar layout (see admin.html)
- Every member page: `<script src="/api/init"></script>` first, then supabase CDN, then supabase.js, then js/auth.js
- Call `requireAuthAsync()` at the start of `init()` on every member page
- Include `feedback-widget.js` on member-facing pages and call `initFeedbackWidget(member.id)`
- No frameworks. No build step. Plain HTML/CSS/JS only.

## Navigation rule

Never create an orphaned page. If you build something new:
1. Add a nav card to `home.html`
2. Include a back button to `home.html` on the new page
3. Check if any existing pages should link to it

## What has been built

- **Noticeboard** (`noticeboard.html`): A space for community announcements. Admins and stewards can post and pin notices. Members have read-only access.
