# Meitheal — Product Requirements Document

**Version:** 0.1 — Draft
**Date:** February 2026
**Status:** For review

---

## 1. Vision

Meitheal is a community-owned platform where the community itself decides what gets built. Members surface needs through structured feedback. The admin curates and approves. An AI agent builds it. The community owns the result — the code, the data, and the relationship with the AI.

There is no platform company deciding what features exist. There is no lock-in. If Meitheal disappeared tomorrow, every community keeps their platform running exactly as it was.

The name is deliberate. *Meitheal* is the Irish tradition of neighbours gathering to do essential work together — the harvest, the building, the land. Everyone contributes. Everyone benefits. No one is left behind.

---

## 2. Core Principles

1. **The community builds the platform.** Features come from members, not from admins guessing, and not from a product team in a boardroom.
2. **The admin is a steward, not a developer.** Their job is to listen, prioritise, and approve — not to build.
3. **The AI is a craftsperson, not a chatbot.** It executes decisions the community has already made. It doesn't freestyle.
4. **Every community owns everything.** Code lives in their GitHub. Data lives in their Supabase. They can walk away at any time.
5. **Transparency is non-negotiable.** Every decision, every feature built, every change — logged and visible to all members.
6. **Simple by default, powerful when needed.** A new community should be useful on day one. It grows as the community grows.

---

## 3. Who It's For

**Community types:**
- Neighbourhood mutual aid groups
- Parish / village associations
- Sports clubs and hobby groups
- Housing cooperatives
- Small professional communities (guilds, collectives)
- Any group of 5–200 people with shared purpose

**Not for:**
- Large-scale social networks
- Commercial marketplaces
- Communities that need a full-time developer

---

## 4. User Roles

### Member
A person who has been accepted into the community.

**Can:**
- Use whatever the community has built (directory, noticeboard, exchange system, etc.)
- Submit feedback and feature requests from any page
- See the status of their own feedback
- See what has been built and who suggested it (changelog)
- Vote on proposals *(when community voting is enabled — see Section 6)*

**Cannot:**
- Approve or reject requests
- Trigger the AI to build anything
- See other members' private data

### Admin
The community steward. There may be more than one.

**Can:**
- Everything a member can do
- See all feedback in the triage queue
- Prioritise, decline, or promote feedback to proposals
- Approve proposals for building
- Delegate approval to community vote *(see Section 6)*
- Configure community settings
- Manage member invitations and onboarding
- Review and accept/hold new applicants

**Cannot:**
- Bypass the feedback workflow to directly request builds *(the agent should not be a freeform chatbot for admins)*
- See sensitive member data beyond what's needed for moderation

---

## 5. The Core Workflow

This is the heartbeat of Meitheal. Everything else is in service of this loop.

```
Member submits request (any page, feedback button)
  ↓
Admin triages it (prioritise / add context / decline)
  ↓
Promoted to proposal (visible to all members)
  ↓
  ├─ Admin approves directly
  └─ OR: Community votes (see Section 6)
       ↓
Agent builds it (commits to GitHub, Vercel deploys)
  ↓
Appears in changelog (credits the member who suggested it)
  ↓
Members use the new feature
  ↓
Members submit more feedback  [loop]
```

### 5.1 Feedback Submission

- A floating action button (FAB) appears on every member-facing page
- Tapping it opens a lightweight modal
- Member selects type: **Idea** 💡 | **Bug** 🐛 | **Question** ❓ | **Other** 💬
- Member writes their message — plain language, no templates
- Submitted instantly, no friction
- Member can track their submissions on a personal feedback page
- Each submission gets a sequential reference (FB-001, FB-002, etc.)

### 5.2 Triage (Admin)

- Admin sees all open feedback in a prioritised queue
- For each item, admin can:
  - **Promote to proposal** — it's worth building, community should see it
  - **Action directly** — simple things (typo fix, text change) go straight to the agent
  - **Decline** — with a note explaining why, shown to the submitter
  - **Ask for more info** — sends a note back to the member
- Admin can add context/detail to strengthen the proposal before promoting

### 5.3 Proposals

- Promoted feedback becomes a formal proposal, visible to all members
- Proposal page shows:
  - What's being proposed (in plain language)
  - Who suggested it
  - Admin's context/framing
  - Current vote count (if voting enabled)
  - Status: Proposed | Approved | Building | Done | Declined
- Members can comment on proposals *(future)*
- Admin approves when ready, or opens to community vote

### 5.4 Build

- Approved proposals enter the **build queue**
- Admin can sequence them (what gets built first)
- The agent receives the approved proposal as its brief, plus context about the existing platform
- Agent builds it, commits to GitHub, Vercel deploys automatically
- Admin sees build status in real time

### 5.5 Changelog

- Every deployed feature appears in the public changelog
- Format: *"[Date] — [Feature name] — suggested by [Member name]"*
- Creates accountability and recognition
- Members can see their ideas become real features

---

## 6. Community Voting

When enabled, admins can delegate approval of a proposal to the community.

**How it works:**
- Admin marks a proposal as "Open for vote"
- All accepted members are notified (email or in-app)
- Voting window: admin sets duration (e.g., 7 days)
- Simple majority carries (configurable: 50%, 60%, 75%)
- If quorum not reached, admin decides
- Result is binding — admin cannot override a passed vote *(unless it raises a safety or governance concern, which requires a logged reason)*

**When to use it:**
- Significant features that affect the whole community
- Decisions where the admin has a conflict of interest
- When the admin wants legitimacy / community buy-in

**When NOT to use it (admin decides directly):**
- Bug fixes
- Small improvements
- Time-sensitive issues
- When community engagement is too low to reach quorum

---

## 7. Core Platform (Every Install)

These features are present in every Meitheal install from day one. They are the foundation everything else builds on.

| Feature | Description |
|---------|-------------|
| **Auth** | Magic link sign-in, no passwords |
| **Invite system** | Admin invites members by email; members earn invites with engagement |
| **Member directory** | All accepted members, searchable |
| **Feedback widget** | FAB on every page, four types |
| **Triage view** | Admin queue for all feedback |
| **Proposals** | Public board of approved/pending features |
| **Changelog** | Public log of everything built |
| **Agent interface** | Admin-facing build queue and status |
| **Settings** | Community name, AI provider, site URL, voting config |

---

## 8. Community Starter Packs

A blank platform is intimidating. Communities choose a starting point that fits their purpose. This seeds the database, installs relevant pages, and gives the agent context.

| Pack | Best For | Includes |
|------|----------|---------|
| **Mutual Aid** | Neighbourhood help networks | Skills/goods exchange, credit ledger, listings feed, balance dashboard |
| **Village / Neighbourhood** | Local area groups | Noticeboard, events calendar, local directory, lost & found |
| **Sports Club** | Teams, clubs, leagues | Fixtures, results, team selection, membership fees tracker |
| **Housing Co-op** | Shared living, cooperative housing | Maintenance log, shared expenses, meeting notes, rota |
| **Blank** | Any community that knows what it wants | Member directory and feedback only — build from scratch |

Communities are not locked into their starter pack. The feedback loop can take them anywhere.

---

## 9. The Agent

The agent is the AI that builds the platform. It is not a general assistant. It is a specialist craftsperson with a narrow, well-defined job.

### What it receives (the brief)
- The approved proposal (in plain language)
- The current state of the platform (what pages exist, what tables exist)
- The design system (theme.css, component patterns)
- The community's context (name, type, what's been built before)
- Integration rules (auth on every page, nav on every page, wire everything in)

### What it produces
- New HTML pages committed to GitHub
- Database migrations (SQL) for new tables
- Updates to existing pages to wire in the new feature
- An entry in the changelog
- A plain-language summary of what was built and where to find it

### What it does not do
- Freestyle builds from admin chat
- Create orphaned pages
- Bypass auth on member-facing pages
- Delete data without explicit confirmation
- Expose server-side credentials in client code

### Constraints
- Always reads existing files before modifying them
- Always includes navigation linking the new page into the site
- Always describes what it's about to do before doing it
- Cost is tracked per build and visible to the admin

---

## 10. Setup (For Non-Technical People)

Setup should be completable by any intelligent adult following written instructions. Target: 20 minutes, no developer needed.

### Step 1 — Deploy to Vercel
- Click the "Deploy to Vercel" button (one click, auto-forks the GitHub repo)
- Vercel asks for a project name → this becomes the URL
- Takes 2 minutes

### Step 2 — Create a Supabase project
- Go to supabase.com → New project
- Give it a name (same as your community)
- Copy the project URL and two keys (shown on screen, labelled clearly)

### Step 3 — Connect them
- Paste the three Supabase values into Vercel environment variables
- (Screenshots provided, labelled exactly as they appear)
- Redeploy (one click)

### Step 4 — Initialise the database
- Visit your site → it detects it's not set up → walks you through it
- One SQL block to paste into Supabase → copy, paste, click Run
- No SQL knowledge needed — it's explained in plain English first

### Step 5 — Configure your community
- Community name
- Choose your starter pack
- Enter admin email → receive magic link → signed in

**Done.** The community is live.

---

## 11. Data Ownership

- All data lives in the community's own Supabase project
- All code lives in the community's own GitHub repository
- Meitheal has no access to either
- If Meitheal shut down tomorrow, every community continues running
- Communities can export all data from Supabase at any time
- Code is MIT licensed — fork it, modify it, self-host it

---

## 12. What's Not In Scope (Yet)

These are deliberately excluded from v1 to keep scope manageable:

- **Federation** — connecting multiple Meitheal communities together
- **Native mobile apps** — progressive web app only for now
- **Real-time notifications** — email only in v1
- **Payments / financial transactions** — credits are internal bookkeeping only
- **AI moderation** — human admin handles all moderation decisions
- **Multi-language** — English only in v1

---

## Open Questions

1. **Invite model:** Open registration with admin approval, or invite-only from the start? Invite-only is safer for small communities but harder to grow.
2. **AI provider:** Should communities bring their own API key, or should Meitheal provide a hosted AI option (metered, paid)?
3. **Hosted vs. self-hosted:** Is there a Meitheal-managed hosting tier where we handle Supabase/Vercel? (Removes the setup barrier entirely but introduces a platform dependency.)
4. **Moderation at scale:** What happens when a community grows to 200+ members? Admin triage becomes a full-time job.

---

*This document is a starting point, not a specification. It should be updated as understanding develops.*
