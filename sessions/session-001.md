# Session 001 — 2026-02-18

## What this session covered
Initial setup of the Meitheal platform from a broken state to a working foundation. Also: PRD review and full understanding of the OpenGoban feedback prototype.

---

## The Product (READ THIS FIRST)

Meitheal is a **GitHub template repo**. Anyone can:
1. Fork/deploy to Vercel (one click)
2. Connect Supabase (copy 3 values)
3. Add an AI API key
4. Invite their community
5. Members submit feedback → admin triages → agent builds features → community owns everything

**We are shipping the repo, not a SaaS.** Every community runs their own independent instance.

**The agent is NOT a freeform chatbot.** It executes approved proposals from the feedback → triage → proposal → vote → build workflow.

---

## Stack

- **Frontend:** Static HTML files (no frameworks, no build step)
- **Backend:** Vercel serverless functions (`api/`)
- **Database/Auth:** Supabase (magic links + Postgres)
- **AI:** DeepSeek by default (also supports Anthropic, OpenAI, Groq, Ollama)
- **Design system:** Ported from OpenGoban — `theme.css` (warm linen palette, Fraunces headings, full token system)
- **Auth module:** `js/auth.js` — `requireAuth()`, `requireAuthAsync()`, `getCurrentMember()`, `handleSignOut()`

---

## Work Done This Session

### Auth fixes
- Fixed Supabase Site URL pointing to `localhost` — updated to `https://meitheal.vercel.app`
- Fixed `admin.html` crash — `const SUPABASE_URL` declared twice (supabase.js + admin.html), crashing entire script block. Removed duplicate.
- Created `api/link-auth.js` — server-side endpoint that links `auth_id` to member row using service key. Client-side can't do this due to RLS. Called from `auth.html` after magic link sign-in. Returns `{ role }` so auth.html can redirect to `admin.html` or `home.html`.
- Updated `index.html` to show friendly error if member row not found (instead of silent redirect loop)

### Design system
- Copied `theme.css`, `js/auth.js`, `shared.js` from `/home/rory/Cabal/opengoban/`
- `js/auth.js` adapted: all redirects changed from `access.html` → `auth.html`, status checks changed from `ACCEPTED/REVIEW` → `active`
- Pages now use `requireAuthAsync()` from js/auth.js instead of inline session checks

### Pages rebuilt
- `home.html` — member home with welcome block, avatar initials, nav grid (Members, Noticeboard/Discussions/Feedback as "coming soon"), role badge, sign out
- `directory.html` — member directory with back button, stats row (total/active/admins), member cards with colour-rotated avatars and join dates
- `admin.html` — rebuilt with OpenGoban design tokens (sidebar, chat, cost meter, feedback queue)

### Agent system prompt improvements
- Stop narrating steps mid-response ("Let me check... Now I'll...")
- Always end with live URL + "what to do next" (~30 second deploy note)
- Never create orphaned pages — always wire into navigation
- Integration rules: every new page must link back and be linked to from existing pages

### Database
- Base migration (`migrations/00_base.sql`) was run in Supabase
- Tables live: `members`, `settings`, `feedback`, `conversations`, `ai_usage`, `changelog`
- RLS enabled on all tables
- `site_url` setting added to settings table: `https://meitheal.vercel.app`

---

## Current File Structure (key files)

```
api/
  agent.js        — AI agent, tool loop, provider adapters, GitHub read/write
  init.js         — Injects Supabase credentials as JS globals
  link-auth.js    — Links auth_id to member row server-side
  setup.js        — One-time setup: seeds DB, creates admin, sends magic link
js/
  auth.js         — Auth module (ported + adapted from OpenGoban)
migrations/
  00_base.sql     — Full base schema (run)
  01_proposals.sql — NOT YET RUN — proposals table (untracked, needs review)
sessions/
  README.md       — This memory system
  session-001.md  — This file
admin.html        — Admin interface (rebuilt)
auth.html         — Magic link sign-in/callback
directory.html    — Member directory (rebuilt)
home.html         — Member home (rebuilt)
index.html        — Router (redirects auth'd users to home.html or admin.html)
supabase.js       — Thin Supabase client wrapper
theme.css         — Full design system (ported from OpenGoban)
shared.js         — Utilities (ported from OpenGoban)
feedback-widget.js — Untracked, not yet wired in (ported from OpenGoban)
triage.html        — Untracked (needs to be created/ported)
PRD.md            — Product requirements document
AGENT.md          — Agent's own persistent memory (self-updated)
```

---

## OpenGoban Feedback Prototype (source of truth for what to build)

Located at `/home/rory/Cabal/opengoban/`. This is the prototype Meitheal's feedback system is based on.

### What's working in OpenGoban (port to Meitheal):
- `feedback-widget.js` — FAB on every member-facing page, 4 types (Idea/Bug/Question/Other), submits to Supabase, toast on success
- `my-feedback.html` — Member's personal feedback view: their submissions, status, `member_note` responses, community changelog section
- `triage.html` — Admin triage queue: filter by status, set priority, write `admin_notes` (internal) + `member_note` (shown to member), actions: Mark Reviewed / Mark Actioned / Decline
- `.claude/commands/feedback.md` — The `/feedback` skill: the agent reads open feedback, categorises it, presents summary, gets approval, makes fixes, commits, updates records
- Supabase functions in `supabase.js`: `createFeedbackRecord`, `getMyFeedback`, `getAllFeedbackRecords`, `updateFeedbackRecord`

### Key design decisions from OpenGoban to preserve:
- **Two-audience messaging:** `admin_notes` (technical, internal) vs `member_note` (warm, shown to member) — keep these separate
- **Status flow:** `new` → `triaged` → `actioned` OR `declined`
- **Changelog:** only actioned feedback with `commit_hash` appears in changelog
- **RLS:** Members see only their own feedback; admins see all

### Not yet built (in either project):
- Proposals system (promote feedback → proposal → visible to all members)
- Community voting on proposals
- Sequential feedback numbering (FB-001, FB-002) — schema uses UUIDs, `feedback_number` column doesn't exist yet
- Agent receiving approved proposals as formal briefs (not freeform chat)

---

## PRD Key Points

Full PRD at `/home/rory/Cabal/Meitheal/PRD.md`. Critical things:

1. **Core workflow:** feedback → triage → proposal → (vote or admin approve) → agent builds → changelog → members use → more feedback
2. **Admin is a steward, not a developer** — they don't instruct the agent directly
3. **Agent is a craftsperson** — executes approved proposals, not freeform requests
4. **Every community owns everything** — their GitHub, their Supabase, no Meitheal dependency
5. **Transparency** — every build logged, visible to all members
6. **Starter packs** — Mutual Aid / Village / Sports Club / Housing Co-op / Blank

---

## What's Next (priority order)

1. **Port feedback-widget.js** — wire it into home.html and directory.html (and every future page)
2. **Port triage.html** — admin can see and action feedback
3. **Port my-feedback.html** — member can see their submissions and responses
4. **Add feedback_number** to schema (migration needed)
5. **Build proposals layer** — promote feedback → proposal, proposals page visible to all members
6. **Redesign admin.html** — from freeform chat to: triage queue + build queue + agent executes proposals
7. **Port /feedback skill** from OpenGoban — adapt it for Meitheal's workflow

---

## Known Issues / Watch Out For

- `migrations/01_proposals.sql` is untracked — review before running, don't know what's in it
- `feedback-widget.js` is in the repo root but untracked and not referenced by any page yet
- Agent push conflicts: the agent commits to GitHub directly, so local pushes often need `git pull --rebase origin main` first
- DeepSeek is the default AI provider — confirm API key is set in Vercel env vars
- `AGENT.md` is the agent's own memory — don't confuse it with these session files
