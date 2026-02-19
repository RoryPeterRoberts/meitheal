# Meitheal

> *Meitheal* — the Irish tradition of neighbours gathering to work together.

**A community platform that builds itself.** Members share ideas, the community decides, an AI agent writes the code. No developer needed after setup.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RoryPeterRoberts/meitheal)

---

## What it is

Meitheal is a template any community group can deploy as their own — mutual aid networks, residents' associations, sports clubs, housing co-ops. It starts small and grows into whatever your community needs.

**The loop:**
1. A member submits an idea ("We need an events calendar")
2. The admin triages it and promotes it to a proposal
3. The community sees it on the proposals board
4. The admin approves it for building
5. An AI agent writes the code, commits it to your GitHub, Vercel deploys automatically
6. The changelog credits the member who suggested it

The AI can only build what has been approved. The community owns everything.

---

## Before you start — what you'll need

You'll need four free accounts. Set them up first, then come back here.

- **GitHub** — [github.com](https://github.com) — where your community's code lives
- **Vercel** — [vercel.com](https://vercel.com) — hosts the platform (connect to GitHub when signing up)
- **Supabase** — [supabase.com](https://supabase.com) — your community's database
- **An AI API key** — the setup wizard will guide you through this. Recommended: [Anthropic Claude](https://console.anthropic.com) — new accounts get free credits. Alternatives: [OpenAI](https://platform.openai.com), [Groq](https://console.groq.com) (has a free tier), or a local [Ollama](https://ollama.ai) instance.

Allow 30–40 minutes if this is your first time working with these services.

---

## Setup — step by step

### Step 1 — Deploy to Vercel

Click the **Deploy with Vercel** button at the top of this page.

- You'll be asked to create a GitHub repository for your community — Vercel does this automatically. Give it a name.
- Click **Deploy**. It may show an error — that's fine. You need to add settings before it will work.
- Make a note of your Vercel project name (e.g. `my-community`) — this becomes your URL.

### Step 2 — Create a Supabase project

1. Sign in to [supabase.com](https://supabase.com)
2. Click **New project**, give it a name, set a database password, click **Create**
3. Wait about a minute for it to be ready
4. Go to **Project Settings** (gear icon, bottom-left) → **API**
5. Keep this page open — you'll need values from it in the next step

### Step 3 — Create a GitHub token for the AI

The AI agent needs permission to write code to your repository. Here's how to give it that:

1. In GitHub, click your **profile photo** (top-right) → **Settings**
2. In the left sidebar, scroll all the way to the bottom → click **Developer settings**
3. Click **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Fill in:
   - **Token name:** anything you like (e.g. "Meitheal agent")
   - **Expiration:** 1 year is fine
   - **Repository access:** select **Only select repositories**, then choose the Meitheal repo Vercel created for you
5. Under **Permissions** → find **Contents** → set it to **Read and write**
6. Click **Generate token**
7. **Copy the token immediately** — you won't be able to see it again after you leave this page

### Step 4 — Add settings to Vercel

1. In Vercel, open your project → **Settings** → **Environment Variables**
2. Add each of these five variables exactly as shown:

| Variable name | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → **Project URL** |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → **anon public** key |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → **service_role** key (click Reveal to see it) |
| `GITHUB_TOKEN` | The token you generated in Step 3 |
| `GITHUB_REPO` | Your repo in `owner/repo` format — e.g. `acmecorp/meitheal` |

3. After saving all five variables, go to **Deployments** → find your latest deployment → click **⋯** → **Redeploy**
4. Wait about a minute for the redeployment to finish

### Step 5 — Run the setup wizard

Visit your site (e.g. `my-community.vercel.app`). You'll be taken to the setup wizard automatically.

The wizard will:
1. Ask for your community name, your email address, and your name
2. Ask you to choose an AI provider and paste your API key
3. Show you a SQL block — copy it, open the Supabase SQL editor (the wizard gives you a direct link), paste it in and click **Run**
4. Once you click **Verify**, the wizard confirms everything is working and sends you a magic sign-in link

**Check your email and click the link.** You're now signed in as the founding admin.

---

## After setup — before you invite anyone

**Personalise your invite email first.** When you invite a member, they receive a magic link email sent by Supabase. By default it has no community name and no explanation — just a generic "Your magic link" subject line. A non-technical person receiving that has no idea who sent it or why.

Fix it in two minutes:

1. Go to your Supabase dashboard → **Authentication → Email Templates → Magic Link**
2. Change the subject line — e.g. *"You've been invited to join Blackwater"*
3. Edit the body to explain what they've been invited to — one or two sentences is enough
4. Optionally set a custom sender name under **Authentication → SMTP Settings** so it comes from your own email address rather than Supabase's

The setup wizard shows you this step and gives you a direct link to the right page.

---

## After setup — your first moves

1. **Invite your first members** — Admin panel → Members → enter their name and email → Send invite. They'll get a magic link.
2. **Submit your own first idea** — Tap the feedback button on any page and share something you'd like to build. This seeds the queue and shows members how the loop works when they join.
3. **Triage incoming ideas** — when members submit feedback, it lands in Triage. Promote the good ones to proposals, approve them when ready, and the AI builds them.

Every build is logged in the changelog with credit to the member who suggested it.

---

## How the AI works

The AI agent only does one thing: it builds features that have been approved. It cannot:
- Build anything that hasn't gone through the triage → proposal → approval workflow
- Modify the governance system that controls it
- Access member data beyond what's needed to build the feature

Every build is committed to your GitHub repository and can be rolled back from the Admin panel if something goes wrong. The admin panel shows how much each build costs.

---

## AI provider options

| Provider | Setup | Cost |
|----------|-------|------|
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com) | ~$3–15 per million tokens |
| OpenAI | [platform.openai.com](https://platform.openai.com) | ~$2.50–10 per million tokens |
| Groq | [console.groq.com](https://console.groq.com) | Free tier available |
| Ollama | Local, no account needed | Free |

A typical feature build costs less than $0.10. Switch providers any time from the Admin panel → Settings.

---

## Your community owns everything

- **Code** lives in your GitHub repository — you can read it, change it, fork it
- **Data** lives in your Supabase project — export it any time
- Meitheal has no access to either. If this project shut down tomorrow, your community's platform keeps running exactly as it was.

MIT licensed.

---

## Troubleshooting

**"Database not ready" during setup**
Make sure you copied the full SQL block and pasted it into the Supabase SQL editor, then clicked **Run** (not just saving it). Then click Verify again.

**Builds fail / AI can't write files**
Check that your `GITHUB_TOKEN` has **Contents: Read and write** permission on the correct repository, and that `GITHUB_REPO` is in `owner/repo` format with no extra spaces.

**Magic link not arriving**
Check spam. Wait 2 minutes. You can request a new one from the sign-in page.

**Something else**
Open an issue at [github.com/RoryPeterRoberts/meitheal/issues](https://github.com/RoryPeterRoberts/meitheal/issues).
