# Agent Architecture Enhancements
## Drawn from Claude Code's own patterns — 2026-02-18

---

### 1. Post-write syntax validation (Hook pattern)

**What**: After every `write_file` tool call, run a lightweight syntax check before committing to GitHub. If it fails, return the error to the model so it can self-correct — rather than silently pushing broken code.

**Why**: The double-escape bug (literal `\n`, `\'` in files) would have been caught immediately rather than breaking live pages.

**How to implement**:
In `executeTool` → `write_file`, after normalising content but before `ghPut`, run:
- For `.html`/`.js` files: extract `<script>` blocks and run `node --check` via a subprocess (not available in Vercel serverless — use a regex heuristic instead)
- Practical version: check that the file has at least N real newlines proportional to its size, and that no `<script>` block starts with a `//` comment on a single line (dead giveaway for the single-line bug)
- Return `{ written, warning: "..." }` if suspicious, so the agent sees it and can verify

---

### 2. Two-pass build: planner → writer (Subagent isolation pattern)

**What**: Split the agent loop into two phases:
1. **Read-only planning pass** — agent reads relevant files, outputs a structured build plan (files to create/modify, schema changes needed)
2. **Write pass** — executes the plan

**Why**: Currently the agent reads and writes in one loop, which bloats the context window. On large builds, early file reads get pushed out of context by the time the agent is writing. Claude Code isolates research subagents specifically to protect the main context.

**How to implement**:
- Add a `PLAN_ONLY` mode to `runAgent` — runs the loop but intercepts `write_file`/`run_sql` calls and returns a plan instead of executing
- Admin sees the plan in the console, clicks "Execute plan" to run the write pass
- Adds a human checkpoint between reading and writing

---

### 3. Editable AGENT.md via admin UI (CLAUDE.md pattern)

**What**: Claude Code's institutional memory lives in `CLAUDE.md` files that humans can read and edit directly. The Meitheal equivalent (`AGENT.md`) is currently only updated by the agent itself — admins have no UI to correct or extend it.

**Why**: If the agent writes something wrong to AGENT.md (or leaves something out), there's no way to fix it without going to GitHub directly.

**How to implement**:
- Add an "Agent memory" section to the Settings panel in `admin.html`
- Load `AGENT.md` content from GitHub via the existing `ghGet` pattern
- Textarea + Save button that commits the updated content
- Read-only view so admins can at least inspect what the agent remembers

---

### 4. CLAUDE.md for this codebase (meta)

**What**: Create a `CLAUDE.md` at the Meitheal project root so Claude Code (me, in this session) carries conventions forward without needing to re-read files each session.

**Content to include**:
- No frameworks, no build step — plain HTML/JS/CSS only
- Every page is self-contained, uses `theme.css` variables
- Agent cannot modify: `api/agent.js`, `js/auth.js`, `admin.html`, `triage.html`, `proposals.html`, `migrations/`
- Key files: `theme.css`, `supabase.js`, `js/auth.js`, `feedback-widget.js`
- Session notes live in `sessions/`
- Migrations must be run manually in Supabase SQL editor after commit

**How**: Run `/init` in Claude Code to generate a starter, then customise.

---

### Priority order

1. **CLAUDE.md** — 10 minutes, immediate value for future sessions
2. **Editable AGENT.md in admin UI** — moderate effort, high operational value
3. **Post-write validation** — moderate effort, prevents the class of bugs we've been fixing manually
4. **Two-pass build** — larger effort, most value for complex builds
