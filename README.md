# Meitheal

> *Meitheal* — the Irish tradition of neighbours gathering to work together.

**A community platform that builds itself.** Any community can deploy their own instance, describe what they need, and an embedded AI builds it — no developers, no code, no platform to depend on.

## What it is

- A minimal community app (auth, members, feedback)
- An AI agent embedded inside it that can build new features through conversation
- Fully owned by the community — their GitHub repo, their database, their AI key
- Open source. Fork it, run it, change it.

## Deploy in 20 minutes

### What you need
- A [GitHub](https://github.com) account
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- An AI API key — [Anthropic](https://console.anthropic.com), [OpenAI](https://platform.openai.com), [Groq](https://console.groq.com), or a local [Ollama](https://ollama.ai) instance

### Steps

**1. Fork this repo**
Click "Use this template" at the top of this page. Give your repo a name (e.g. `my-community`).

**2. Create a Supabase project**
Go to [supabase.com](https://supabase.com) → New Project. Name it after your community.
Copy your **Project URL**, **Anon Key**, and **Service Role Key** from Project Settings → API.

**3. Deploy to Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_ORG/meitheal)

Connect your forked repo. When prompted, add these environment variables:

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → Anon Key |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → Service Role Key |
| `GITHUB_TOKEN` | GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained (repo read/write) |
| `GITHUB_REPO` | `your-username/your-repo-name` |

Also add your AI key (at least one):
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `AI_API_KEY` (generic — works with any provider configured in settings)

**4. Run the setup wizard**
Visit your Vercel URL. The setup wizard walks you through the rest — initialises the database, creates your admin account, and sends you a sign-in link.

**5. Start building**
Log in as admin. You'll see the admin chat. Tell the AI what your community needs.

---

## How it works

```
Admin types: "Add a tool lending library for our street"
     ↓
AI reads the codebase, writes tool-library.html, creates a DB table
     ↓
Commits to your GitHub repo → Vercel auto-deploys
     ↓
Feature is live. The AI updates its memory (AGENT.md).
```

Members use the feedback form → admin reviews it → AI acts on it → community improves.

## AI Provider support

Switch providers any time from the admin panel. Supported:

| Provider | Models | Cost |
|----------|--------|------|
| Anthropic | Claude Sonnet, Haiku, Opus | ~$3-15/M tokens |
| OpenAI | GPT-4o, GPT-4o Mini | ~$2.50-10/M tokens |
| Groq | Llama, Mixtral | Free tier available |
| Ollama | Any local model | Free |

## Cost tracking

Every AI call is logged. The admin panel shows monthly and all-time cost. Communities decide for themselves how to share or cover costs.

## Philosophy

- Communities own everything: their code, their data, their AI relationship
- No lock-in: if this project disappeared tomorrow, every community keeps running
- No platform: no one can deplatform you, raise prices on you, or read your data
- The AI is a craftsperson, not a product: it builds exactly what the community needs, nothing more

## Contributing

Pull requests welcome. The core should stay small — the value is in what communities build on top of it, not in the template itself.

## Licence

MIT
