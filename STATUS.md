# Meitheal — Session Status

> Pick this up when resuming work. Delete or update sections as things get done.

## What this is
A self-building community platform. Any community deploys their own instance, describes what they need in plain language, and an embedded AI builds it — writing code, committing to GitHub, auto-deploying via Vercel. No developers needed.

- GitHub: `RoryPeterRoberts/meitheal`
- Live URL: `meitheal.vercel.app`
- Supabase project: `fzylqmdpnsckuizxhygl` (`https://fzylqmdpnsckuizxhygl.supabase.co`)
- AI provider: DeepSeek (`sk-43321e0e37d3474b88fde9e22fb14c36`) stored in Vercel env as `AI_API_KEY`

---

## Architecture
- Static HTML/JS pages deployed on Vercel
- Supabase for auth (magic links) + database
- `api/` = Vercel serverless functions (Node.js, ES modules with `export default`)
- `api/agent.js` = the AI agent (provider-agnostic, tool-use loop, reads/writes GitHub repo)
- `api/init.js` = serves `window._SUPABASE_URL` and `window._SUPABASE_ANON_KEY` as JS — loaded first on every page
- `api/setup.js` = one-time setup endpoint: seeds settings, creates admin, sends magic link
- `AGENT.md` = AI's persistent memory (updated by the agent itself)

### Provider support
Anthropic (native), DeepSeek, OpenAI, Groq (all via OpenAI-compatible adapter), Ollama (local).
DeepSeek base URL: `https://api.deepseek.com`. Models: `deepseek-chat` (V3), `deepseek-reasoner` (R1).

---

## Vercel environment variables
All of these must be set in Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://fzylqmdpnsckuizxhygl.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase "Publishable key" (`sb_publishable_...`) |
| `SUPABASE_SERVICE_KEY` | Supabase "Secret key" (`sb_secret_...`) |
| `GITHUB_TOKEN` | Fine-grained PAT (`github_pat_11AROKXGY0...`) with Contents read/write on meitheal repo |
| `GITHUB_REPO` | `RoryPeterRoberts/meitheal` |
| `AI_API_KEY` | DeepSeek key (`sk-43321e0e37d3474b88fde9e22fb14c36`) |

**Note:** Supabase now uses new key format (`sb_publishable_*` / `sb_secret_*`) instead of old JWT format.
The old `eyJhbGci...` JWT keys may still work but the dashboard shows the new format.
After changing env vars, trigger a Vercel redeploy.

---

## Current status: SETUP IN PROGRESS

### What's working
- [x] Vercel deployment live at meitheal.vercel.app
- [x] `/api/init` injects Supabase credentials into all pages
- [x] setup.html: steps 1 (community info) and 2 (AI provider) work fine
- [x] DeepSeek added as provider option in setup wizard and agent
- [x] `/api/setup.js` created — handles DB seeding server-side (no CORS issues)

### What's NOT done yet
- [ ] **Vercel env vars need updating** — `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_KEY` may still have old JWT format values. Update to `sb_publishable_*` and `sb_secret_*` respectively, then redeploy.
- [ ] **SQL migration not yet run** — user needs to run `migrations/00_base.sql` in Supabase SQL editor
- [ ] **Setup wizard not completed** — stuck on step 3. After fixing env vars + running SQL, step 3 should work.
- [ ] **End-to-end agent loop not tested** — `/api/agent.js` has never been called in production

### Immediate next steps
1. Update Vercel env vars with correct `sb_publishable_*` / `sb_secret_*` keys → redeploy
2. Visit meitheal.vercel.app, go through setup steps 1–2
3. On step 3: copy the SQL shown, paste into Supabase SQL editor, run it
4. Click "I've run the SQL → Continue"
5. Check email for magic link → sign in → land on admin.html
6. Test the agent: type "Hello, tell me what you can do"
7. Test a real build: "Add a simple member directory page"

---

## Known issues / bugs fixed this session
- **CORS on management API**: setup.html was calling `api.supabase.com` from the browser — blocked by CORS. Fixed by moving all DB calls to `api/setup.js` serverless function.
- **`window._SUPABASE_URL` undefined**: Vercel env vars don't auto-inject into static HTML. Fixed with `api/init.js` serving a JS snippet that sets the globals.
- **DeepSeek not wired up**: `api/agent.js` had no `deepseek` case in the base URL logic. Fixed.

---

## Key files
```
api/
  agent.js       — AI agent (tool loop, provider adapters, cost tracking)
  init.js        — Config bootstrap (serves SUPABASE_URL/ANON_KEY as JS)
  setup.js       — One-time setup: seed settings, create admin, send magic link
migrations/
  00_base.sql    — Full schema: members, settings, feedback, conversations, ai_usage, changelog
admin.html       — Admin chat UI (AI conversation, cost meter, feedback queue)
setup.html       — 4-step first-run wizard
auth.html        — Magic link login
index.html       — Router (redirects based on auth state and role)
supabase.js      — Supabase client (reads from window._SUPABASE_URL set by api/init)
AGENT.md         — AI's persistent memory (updated by the agent)
```

---

## Philosophy
- Communities own everything: code, data, AI relationship
- No lock-in: if this project disappeared, every community keeps running
- The AI is a craftsperson: builds exactly what the community needs, nothing more
- MIT licence, open source
