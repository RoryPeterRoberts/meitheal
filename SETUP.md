# Meitheal — Setup Guide

## What is Meitheal?

Meitheal (pronounced *meh-hal*) is a platform that gives your community a voice — and actually does something with it.

Members submit ideas and report problems. An admin reviews them — deciding which ones are worth taking forward. The ones that get approved are built by an AI agent directly into your community platform — new pages, new features, shaped entirely by what your community asked for.

It's named after the Irish tradition of neighbours coming together to get something done. That's what this is: a tool for communities that want to actually build something together, not just talk about it.

**What your community gets:**
- A place to submit ideas, feedback, and problems
- A transparent process — members can see every proposal and how decisions are made
- Features that are built from real requests, not guesswork
- A governance log so nothing happens behind closed doors

**What you get as admin:**
- Full control over what gets approved and built
- A simple dashboard — no technical knowledge needed to run it day to day
- A community that can see their ideas becoming reality

---

## Setting up

We've built this so anyone can set up their own community platform. Follow the steps below — each one explains exactly what to do and why. If you get stuck, there's a troubleshooting section at the end.

---

## What you'll need before you start

You'll need free accounts on these three services — sign up now if you don't have them yet:

- [**Sign up to GitHub**](https://github.com/signup) — stores your community's platform code
- [**Sign up to Supabase**](https://supabase.com/dashboard/sign-up) — your community's database and login system
- [**Sign up to Vercel**](https://vercel.com/signup) — hosts the platform on the web

That's it. Everything else is walked through below.

---

## Step 1 — Deploy your platform

When you click the button below, three things happen automatically — all in your browser, no downloads or technical steps required:

1. **A copy of the platform is created in your GitHub account** — this is your community's own version of the code, stored safely under your GitHub username
2. **A project is created in your Vercel account** — this is what makes your platform available on the web at an address like `my-community.vercel.app`
3. **You're asked to fill in some details** — credentials that connect your platform to your database (which you'll set up in Step 2)

Nothing is installed on your computer. Everything lives in the cloud.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRoryPeterRoberts%2Fmeitheal&env=SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_KEY,GITHUB_TOKEN,GITHUB_REPO,GITHUB_BRANCH,AI_API_KEY&envDescription=You%27ll%20need%20your%20Supabase%20keys%20and%20a%20GitHub%20token.%20Follow%20the%20setup%20guide%20to%20get%20each%20one.&envLink=https%3A%2F%2Fgithub.com%2FRoryPeterRoberts%2Fmeitheal%2Fblob%2Fmain%2FSETUP.md&project-name=my-community&repository-name=my-community)

> **Don't fill in the details yet.** Vercel will ask for credentials you don't have yet. Click through to see the form, then follow Steps 2 and 3 to gather everything you need — then come back and fill it in.

When you're ready, here's what each field means:

| Field | What to enter |
|---|---|
| `SUPABASE_URL` | From Step 2 below |
| `SUPABASE_ANON_KEY` | From Step 2 below |
| `SUPABASE_SERVICE_KEY` | From Step 2 below |
| `GITHUB_TOKEN` | From Step 3 below |
| `GITHUB_REPO` | Your GitHub username + `/my-community` — e.g. `janesmith/my-community` |
| `GITHUB_BRANCH` | Type `main` |
| `AI_API_KEY` | Leave blank for now — you can add this later |

---

## Step 2 — Create a Supabase project

Supabase is where your members, feedback, and proposals are stored.

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Give it a name (e.g. "Your Community Name")
3. Choose a strong database password — **save this somewhere**
4. Choose the region closest to your community (e.g. EU West for Ireland)
5. Click **Create new project** — wait about 60 seconds for it to spin up

### Get your Supabase keys

Once the project is ready:

1. In the left sidebar click **Project Settings** → **API**
2. Copy and save these three values — you'll need them shortly:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ…`)
   - **service_role key** (another long string — keep this secret)

### Run the database migrations

This creates all the tables your platform needs.

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Go to your forked GitHub repo → `migrations/` folder
4. Open each file below **in order**, paste the contents into the SQL editor, and click **Run**:

```
00_base.sql
01_proposals.sql
02_trust_validation.sql
03_admin_rls.sql
04_member_proposal_rls.sql
05_run_sql_function.sql
06_settings_write.sql
07_changelog_rollback.sql
09_votes.sql
```

If a migration runs without errors, move to the next one. If you see an error, stop and contact support.

### Enable email authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Go to **Authentication** → **Email Templates** → **Magic Link**
4. (Optional) Customise the email subject and body to mention your community name

---

## Step 3 — Deploy to Vercel

Vercel is what makes your platform accessible on the web.

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Click **Import Git Repository** → connect your GitHub account if prompted
3. Find your forked repo and click **Import**
4. **Don't click Deploy yet** — you need to add environment variables first

### Add environment variables

In the Vercel project setup screen, find **Environment Variables** and add each of these:

| Variable name | Where to find the value |
|---|---|
| `SUPABASE_URL` | Your Supabase Project URL from Step 2 |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key from Step 2 |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key from Step 2 |
| `GITHUB_TOKEN` | See below |
| `GITHUB_REPO` | Your forked repo, e.g. `your-username/your-community` |
| `GITHUB_BRANCH` | `main` |
| `AI_API_KEY` | Your AI provider API key (can add later) |

#### Getting a GitHub token

The platform's AI agent needs permission to write files back to your repo when it builds features.

1. Go to GitHub → your profile picture → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name like "Meitheal agent"
4. Set expiry to **No expiration** (or 1 year)
5. Tick the **repo** checkbox (full repo access)
6. Click **Generate token** — copy it immediately (you won't see it again)

### Deploy

Once all environment variables are added:

1. Click **Deploy**
2. Wait ~30 seconds
3. Vercel will give you a URL like `your-community.vercel.app` — this is your platform

### Connect a custom domain (optional)

In Vercel → your project → **Settings** → **Domains**, you can add a custom domain like `platform.yourcommunity.ie`.

---

## Step 4 — Run the setup wizard

1. Go to your Vercel URL + `/setup.html` — e.g. `your-community.vercel.app/setup.html`
2. Fill in:
   - **Community name** — e.g. "Your Community Name"
   - **Community type** — choose the closest match
   - **Your name and email** — this becomes the admin account
3. Click **Set up community**
4. Check your email — you'll receive a magic link to sign in
5. Click the link → you're in as admin

---

## Step 5 — Invite your first members

1. Go to **Admin** → **Members**
2. Click **Invite member**
3. Enter their email address and an optional personal note
4. They'll receive a magic link — no password needed

---

## Step 6 — Add your AI provider (to enable building features)

The AI build agent is what turns approved community proposals into actual features.

1. Go to **Admin** → **Settings** → **AI Provider**
2. Choose a provider and paste your API key
3. Recommended: **DeepSeek** (cheapest) or **Kimi K2.5** (reliable)

To get a DeepSeek key: [platform.deepseek.com](https://platform.deepseek.com) → API Keys → Create

---

## You're live

Your community platform is now running. Members can:
- Submit ideas and feedback
- Browse proposals and vote on what gets built
- See what's been built in the changelog

You (as admin) can:
- Triage incoming feedback
- Approve proposals to build
- Add pre-written features from the Feature Library
- Edit the community charter and settings

---

## Troubleshooting

**"Server not configured" error on setup**
→ Your Supabase environment variables aren't set in Vercel. Go to Vercel → Settings → Environment Variables and check all three Supabase keys are present, then redeploy.

**"Database not ready" error on setup**
→ The migrations haven't been run. Go back to Step 2 and run each `.sql` file in the Supabase SQL editor.

**Magic link email not arriving**
→ Check your spam folder. If it's not there, check Supabase → Authentication → Logs for errors.

**Build agent does nothing after approving a proposal**
→ Check your AI API key is set correctly in Admin → Settings → AI Provider. Make sure there's credit on your AI account.

**Vercel deployments stop working after a while**
→ Known issue: the GitHub webhook can disconnect. Fix: Vercel → Project Settings → Git → disconnect and reconnect your GitHub repo.

---

## Getting help

If you're stuck, contact the Meitheal team or open an issue at [github.com/RoryPeterRoberts/meitheal/issues](https://github.com/RoryPeterRoberts/meitheal/issues).
