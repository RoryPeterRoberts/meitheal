# Meitheal — Claude Code Project Memory

## What this project is
A community governance platform. Members submit feedback, stewards triage it, admins approve proposals, an AI agent builds the features. The platform evolves based on what members actually ask for.

## Hard constraints
- **No frameworks. No build step.** Plain HTML/CSS/JS only.
- Every page is a self-contained `.html` file.
- Styles go in a `<style>` block in `<head>`, or use `theme.css` variables.
- Deploy target: Vercel (static files + serverless functions in `api/`).

## Key files
- `theme.css` — all design tokens (colors, spacing, typography). Always use `var(--color-*)` etc, never hardcode.
- `supabase.js` — shared data helpers. Add new table helpers here.
- `js/auth.js` — `requireAuthAsync()` used on every member-facing page.
- `feedback-widget.js` — floating FAB, include on all member pages.
- `api/agent.js` — the AI build agent. **Never modify the agent's tools or system prompt without discussion.**
- `AGENT.md` — the build agent's persistent memory. Editable via Admin → Settings → Agent memory.

## Every member page must have
```html
<script src="/api/init"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase.js"></script>
<script src="js/auth.js"></script>
<script src="feedback-widget.js"></script>
```
And call `requireAuthAsync()` + `initFeedbackWidget(member.id)` in `init()`.

## Migrations
- Migration files live in `migrations/` and are numbered sequentially.
- They **must be run manually** in the Supabase SQL editor after committing.
- The agent now runs its own migrations via `run_sql` (split per statement). Manual runs are only needed if the agent explicitly says it failed.

## Protected files (never modified by the build agent)
`api/agent.js`, `js/auth.js`, `admin.html`, `triage.html`, `proposals.html`, `migrations/`

## Session notes
Live in `sessions/`. Check the latest `session-00N.md` and `agent-enhancements.md` for context at the start of each session.

## Current provider setup
- Provider: Gemini (`gemini-3-pro-preview`) or Kimi (`kimi-k2.5`)
- Gemini quirks fixed: thought_signature preserved, double-escape `\n`/`\t`/`\'` auto-corrected in `write_file`
- Kimi: clean OpenAI-compatible tool calling, no quirks

## Database tables
`members`, `feedback`, `proposals`, `changelog`, `settings`, `ai_usage`, `conversations`, `notices`, `events`

## Open enhancements (see sessions/agent-enhancements.md)
1. Post-write syntax validation before GitHub commit
2. Two-pass build: planner → human checkpoint → writer
