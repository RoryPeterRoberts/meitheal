# Meitheal — Systems Design

*Produced by the Systems Architect, Session 002, 2026-02-18*
*This document must be read before any feature is built. It defines how the whole system works.*

---

## The System in One Paragraph

Meitheal is a community-governed, AI-built platform. A group of people — a housing co-op, a sports club, a neighbourhood association — deploys it by forking a GitHub repo and following a 20-minute setup guide. From that point, the community drives its own development: members say what they need, the admin decides what gets built, and an embedded AI agent builds it — committing real code to the community's own GitHub and deploying automatically. No developer is needed. No platform company is involved. The community owns everything: the code, the data, and the relationship with the AI.

---

## Domain 1: The Governance Loop

### The loop

```
Member has a need
  ↓
Submits feedback (any page, FAB widget)
  ↓
Lands in admin triage queue
  ↓
Admin triages:
  ├─ Simple fix → directly to build queue (no proposal needed)
  ├─ Promote → becomes a formal Proposal (visible to all members)
  └─ Decline → member notified with reason
        ↓ (if promoted)
Proposal visible to all members
  ↓
  ├─ Admin approves directly
  └─ OR opens for community vote (time-boxed, majority threshold)
        ↓ (when approved)
Enters build queue
  ↓
Agent builds it (commits to GitHub, Vercel deploys)
  ↓
Changelog entry created (credits the member who suggested it)
  ↓
Members notified → use the new feature → submit more feedback
  ↓
[loop]
```

### Where the AI sits

The AI sits **between "approved" and "deployed"**. It has no role in deciding what gets built. It receives a brief — an approved proposal — and executes it. It cannot promote feedback, approve proposals, or modify the governance process itself.

### Key governance rules

- **Any active member can submit feedback.** No threshold required.
- **Only admins can triage.** Triage is a judgement call — it requires human accountability.
- **Proposals are public.** Every member can see what's been proposed, who proposed it, and its current status.
- **Community votes are binding.** If a vote passes, the admin cannot override it except for safety reasons (and must log their reason if they do).
- **Simple fixes bypass the proposal stage.** Typos, broken links, minor UX fixes — admin can send these directly to the build queue without a public proposal. The changelog still records them.

### Open questions

**OQ-01: Who can submit feedback?**
Domain: Governance
Why it matters: Open submission invites spam and noise. Too-restrictive submission silences genuine needs.
Options:
  A. Any authenticated member (no threshold)
  B. Members who have been active for >7 days
  C. Any member, but new members' submissions go to a separate "unverified" queue
Recommendation: **Option A** for v1. The community is small (5-200 people). Everyone knows each other. Spam is low risk. Add filtering later if needed.

**OQ-02: Can members comment on proposals?**
Domain: Governance
Why it matters: Discussion improves proposals. But it adds complexity and can become noise.
Options:
  A. No comments — just votes and admin notes
  B. Members can add a single endorsement note (one per member per proposal)
  C. Full threaded comments
Recommendation: **Option B** for v1. One endorsement note per member is enough signal. Full threads are a content moderation problem.

**OQ-03: Can a proposal be withdrawn or edited after promotion?**
Domain: Governance
Why it matters: If a proposal is wrong or needs clarification, can the admin fix it? Can the member who suggested it withdraw it?
Options:
  A. Admin can edit/withdraw any proposal before it enters the build queue
  B. Once public, a proposal is immutable (edit = new proposal)
  C. Admin can edit, member who suggested it can request withdrawal
Recommendation: **Option A** for v1. Admin is the steward. Keep it simple.

---

## Domain 2: The Agile Loop

### The loop

Meitheal does not have sprints. It is **continuous delivery** — the platform evolves as fast as the community drives it.

```
IDENTIFY: Member submits feedback  [minutes]
    ↓
PRIORITISE: Admin triages, promotes to proposal  [hours to days]
    ↓
DECIDE: Admin approves OR community votes  [hours to days, or time-boxed vote]
    ↓
BUILD: Agent builds and deploys  [minutes]
    ↓
VALIDATE: Member uses feature, submits follow-up feedback  [days to weeks]
    ↓
[loop — the validate step feeds back into identify]
```

### Definition of "ready to build"

A proposal is ready to build when:
1. Status is `approved`
2. It has a clear title (one sentence)
3. It has a plain-language description (what it does, not how to build it)
4. The admin has added any necessary context (design constraints, related tables, pages it should link from)

The agent must never start building from vague input. If a proposal is unclear, the agent returns it to the admin with specific questions before proceeding.

### Definition of "done"

A build is "done" when:
1. Code is committed to GitHub
2. Vercel deployment is confirmed successful
3. Changelog entry is created
4. The member who suggested it is notified (in-app notification or email)
5. Proposal status is updated to `done`

"Done" is NOT just "deployed." The loop closes when the community knows about it.

### How the platform learns

The agent maintains `AGENT.md` — a memory file it updates after every build. This records:
- What has been built
- Key architectural decisions made
- Patterns the community prefers
- Things that have broken before

Over time, `AGENT.md` becomes the institutional memory of the platform. It is the primary context the agent uses when receiving a new brief. It is NOT the same as the session files (which are for the developer/steward).

### Open questions

**OQ-04: What is the maximum build queue depth?**
Domain: Agile loop
Why it matters: If 20 proposals are approved and queued, the agent building them sequentially could take hours. Members whose proposals are at the back of the queue lose context on what they asked for.
Options:
  A. No limit — queue as many as you want
  B. Hard limit of 3 approved proposals in the build queue at once
  C. Admin manually sequences the queue, one build at a time
Recommendation: **Option C** for v1. Build one thing at a time. Let the community see it land before approving the next.

**OQ-05: Who validates "done"?**
Domain: Agile loop
Why it matters: Deployed doesn't mean working. Who checks that the feature actually works before the loop closes?
Options:
  A. Deployment success = done (no human validation)
  B. Admin manually marks as validated after checking
  C. The member who suggested it confirms it works
Recommendation: **Option B** for v1. Admin is accountable. They check before marking done. Option C is better UX but requires a notification system that doesn't exist yet.

---

## Domain 3: The Trust Model

### Trust levels

| Level | Name | How earned | What it unlocks |
|-------|------|------------|-----------------|
| 0 | **Invited** | Received invite link, hasn't completed profile | Can sign in, see home page, cannot submit feedback yet |
| 1 | **Member** | Completed profile, accepted by admin | Can submit feedback, view proposals, vote |
| 2 | **Active member** | *(future)* 3+ feedback items submitted, at least 1 actioned | Higher voting weight, can endorse proposals |
| 3 | **Steward** | Admin-designated | Can triage feedback (add notes, set priority), cannot approve or build |
| 4 | **Admin** | Set during setup, or promoted by existing admin | Full access: triage, approve, configure, trigger builds |

### For v1

Only two levels matter initially: **Member** and **Admin**.

The steward role and active member designation are important long-term — they distribute the governance load as the community grows — but they add complexity that isn't needed for a community of 5-20 people.

**For v1: build Member and Admin only. Design the schema to accommodate the full trust model later.**

### What the AI knows about trust

When the agent receives a build brief, it receives:
- The proposal (title, description, admin context)
- The member who originally suggested it (first name only, for changelog credit)
- The admin who approved it

The agent does NOT receive trust scores, voting records, or member private data. It knows only what it needs to build the feature.

### Open questions

**OQ-06: How is the initial admin set?**
Domain: Trust model
Why it matters: The person who deploys the repo is the first admin. But what if they want to add a second admin? What if the original admin leaves?
Options:
  A. Admin is set in the setup wizard, only they can promote others to admin
  B. There can be multiple admins from day one, invited by the first
  C. Admin promotion requires a community vote
Recommendation: **Option B**. Resilient communities need multiple stewards. Allow multi-admin from day one. But only admins can promote to admin (not the community vote — that's a safety boundary).

---

## Domain 4: The Safety Model

### Hard limits — the AI can NEVER do these

These are constitutional. They cannot be overridden by a community vote, an admin instruction, or a compelling argument from a member. If the agent is ever instructed to do any of these things, it must refuse and explain why.

1. **Never drop or truncate database tables.** ALTER TABLE to add columns is fine. DROP TABLE is never fine.
2. **Never remove or weaken RLS policies.** Row Level Security protects member data. It can be expanded (add a policy) but never removed.
3. **Never expose the Supabase service role key in client-side code.** The service key has full database access. It lives only in Vercel env vars and server-side functions.
4. **Never modify the feedback/triage/proposals/governance workflow.** The system that governs the AI cannot be modified by the AI. This includes: `api/agent.js` system prompt, `api/link-auth.js`, the proposals table structure, the triage logic.
5. **Never delete member data.** Soft-delete only (status = 'inactive'). Hard deletes require manual database action by the admin.
6. **Never bypass auth on member-facing pages.** Every page that shows member data must call `requireAuthAsync()`.
7. **Never create a page that can be reached without authentication** unless it is explicitly a public page (auth.html, setup.html, a public changelog).

### Soft limits — require explicit admin confirmation

These can be done, but the agent must describe what it's about to do and wait for confirmation:

1. **Schema migrations** — adding columns, creating new tables, changing constraints
2. **Changes to settings** — AI provider, community name, site URL
3. **Removing a feature or page** — reversible with git, but disorienting for members
4. **Changes that affect all members simultaneously** — major redesigns, navigation restructure

### The meta-rule

> **The AI cannot modify the system that governs the AI.**

This means: the agent cannot change `api/agent.js`, cannot change the proposals workflow, cannot change how triage works, cannot change what it is or is not allowed to do. These changes can only be made by the developer/steward (Rory, or whoever maintains the template).

This is the most important safety rule. It prevents the AI from writing itself out of its constraints.

### Open questions

**OQ-07: What happens when the agent builds something that breaks the site?**
Domain: Safety
Why it matters: The agent commits directly to GitHub. If the commit introduces a bug, the site breaks for all members.
Options:
  A. Live with it — admin reverts manually via git
  B. Agent deploys to a preview URL first, admin approves before merge to main
  C. Agent runs a basic smoke test before committing (check for obvious syntax errors)
Recommendation: **Option C for v1, Option B as a near-term upgrade.** A smoke test catches the obvious failures. Preview deployments are the right long-term answer but require Vercel integration work.

**OQ-08: Who can see the agent's system prompt?**
Domain: Safety / Transparency
Why it matters: The system prompt contains the agent's constraints and identity. Should members be able to see what the AI has been told to do?
Options:
  A. Fully private — only the deployer can see it (in GitHub)
  B. Summarised version visible to admins
  C. Full system prompt visible to all members (radical transparency)
Recommendation: **Option C**. The community should be able to see the rules that govern their AI. It's in GitHub anyway — anyone can read it. Leaning into this builds trust.

---

## Domain 5: The Transparency Model

### What is logged

| Event | Logged where | Visible to |
|-------|-------------|------------|
| Feedback submitted | `feedback` table | Member (own), Admin (all) |
| Feedback triaged | `feedback` table (status + admin_notes) | Admin only |
| Member response written | `feedback` table (member_note) | Member (own feedback only) |
| Proposal created | `proposals` table | All members |
| Proposal approved/declined | `proposals` table | All members |
| Vote cast | *(future)* | Member sees their own vote; admin sees aggregate |
| Build started | `proposals` table (build_started_at) | All members |
| Build completed | `changelog` table + `proposals` table | All members |
| AI cost | `ai_usage` table | All members (aggregate), Admin (detail) |

### The changelog

The changelog is the primary transparency surface for members. Every deployed feature appears here as:

> *[Date] — [What was built, in plain language] — suggested by [Member first name]*

The changelog is PUBLIC by default. Any member (and visitors, if the community chooses) can see what has been built and who suggested it. This creates accountability and recognition — members can see their ideas become real features.

### Attribution consent

By submitting feedback, a member consents to their first name appearing in the changelog if their suggestion is built. They can opt out (admin sets `anonymous: true` on the feedback item before promoting).

### AI cost visibility

The running cost of the AI is visible to ALL members by default. This is intentional. It:
- Creates shared ownership of the AI spend
- Discourages frivolous build requests
- Builds trust through honesty

Members see: "This community has spent $X on AI builds this month."
Admins see: cost broken down per build, per provider, per conversation.

---

## Open Questions — Full List

| ID | Question | Domain | Priority |
|----|----------|--------|----------|
| OQ-01 | Who can submit feedback? | Governance | Low — default to any member |
| OQ-02 | Can members comment on proposals? | Governance | Medium — needs decision before proposals page is built |
| OQ-03 | Can proposals be withdrawn/edited? | Governance | Low — admin can edit for v1 |
| OQ-04 | Maximum build queue depth? | Agile loop | Low — one at a time for v1 |
| OQ-05 | Who validates "done"? | Agile loop | Medium — affects changelog and notification design |
| OQ-06 | How is initial admin set / multi-admin? | Trust | High — affects setup wizard and DB schema |
| OQ-07 | What if the agent breaks the site? | Safety | High — affects agent.js constraints |
| OQ-08 | Who can see the agent's system prompt? | Safety / Transparency | Low — default to public (it's in GitHub) |

**Decisions needed before building proposals page:** OQ-02, OQ-05
**Decisions needed before building trust system:** OQ-06
**Decisions needed before next agent build:** OQ-07

---

## Implications for the build

Given this model, the following architectural decisions follow:

### 1. The admin interface must be restructured

The current `admin.html` is a freeform chat. This violates the governance model. The admin interface should have three distinct views:
- **Triage** — the feedback queue, with actions (promote / decline / direct fix)
- **Proposals** — what's been promoted, approve or open to vote
- **Build queue** — what's approved and waiting for the agent, with build status

The freeform chat should be a small utility at the bottom, not the primary interface.

### 2. The agent must receive structured briefs, not chat messages

Currently the agent receives whatever the admin types. It should receive:
```json
{
  "proposal_id": "uuid",
  "title": "Add a noticeboard page",
  "description": "Members want to post announcements...",
  "admin_context": "Use the existing design system...",
  "suggested_by": "Aoife",
  "approved_at": "2026-02-18T..."
}
```
The agent reads the brief, builds, and updates the proposal status. It does not chat.

### 3. The governance tables must be in the schema before the UI is built

`migrations/01_proposals.sql` is ready and waiting. It must be run before any proposals UI is built. This is the next action.

### 4. Trust levels must be in the schema even if only two are used in v1

Add a `trust_level` integer column to the `members` table (0-4). Default to 1 for new members. This costs nothing now and avoids a painful migration later.

### 5. The meta-rule must be in the agent's system prompt

The agent's system prompt in `api/agent.js` must explicitly state: *"You cannot modify api/agent.js, the proposals workflow, or any file that governs what you are and are not allowed to do."*

---

## Minimum Viable Governance Loop

The smallest thing that makes the system real:

1. Member submits feedback via the widget (on any page)
2. Admin sees it in triage, promotes it to a proposal
3. Admin approves the proposal
4. Agent receives the proposal as a structured brief and builds it
5. Changelog records it, member is credited

Everything else — voting, stewards, trust levels, comments, starter packs — is an enhancement to this loop.

**Build this loop first. Nothing else until this works end to end.**

---

## Briefing for the Architect

### Decisions made that affect agent team design

1. The admin interface must be rebuilt around governance (triage / proposals / build queue), not chat
2. The agent receives structured JSON briefs from approved proposals — not freeform chat
3. The ops team skills (/feedback, /build) must understand the proposals table schema
4. Trust levels go in the schema now even if only Member and Admin are used in v1

### Constraints the build team must work within

- Hard limits are constitutional — they go in `api/agent.js` and are never negotiable
- The meta-rule applies to the build team too: no skill should modify the governance workflow without explicit developer action
- Schema changes always go through a numbered migration file, never directly

### Recommended first sprint

1. Run `migrations/01_proposals.sql` (unblocks everything)
2. Port `feedback-widget.js` to Meitheal, wire into all member pages
3. Build `triage.html` — admin can see feedback queue and promote to proposals
4. Build `proposals.html` — all members can see what's been proposed
5. Rebuild `admin.html` — triage / proposals / build queue (replace freeform chat)
6. Update `api/agent.js` — structured brief input, meta-rule in system prompt
7. Build `/feedback` skill — Claude Code command for developer triage workflow
8. Build `/build` skill — Claude Code command to pass approved proposal to agent

This sprint delivers the complete minimum viable governance loop.
