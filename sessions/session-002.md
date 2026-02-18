# Session 002 — 2026-02-18

## What this session covered

No code was written. This session was entirely about thinking before building. We assembled the agent team structure, ran the systems architect, and ran the altruistic business partner on the systems design. The output is a foundation document that all future building works from.

---

## Skills built this session

### `.claude/commands/architect.md` — `/architect`
Reads session files + PRD, assesses current platform state, designs the agent team, prioritises skills to build, specs them out one at a time with user approval. Never writes code. Hands off to the build team.

### `.claude/commands/systems-architect.md` — `/systems-architect`
**This is the Meitheal-specific one** — not the global fixerupper skill that keeps loading.
Works through five domains before any building: governance loop, agile loop, trust model, safety model, transparency model. Produces `sessions/systems-design.md`. Briefs the architect. Does not write code or specs.

### `.claude/commands/partner.md` — `/partner`
Altruistic business partner. Holds the community-first dimension. Challenges decisions against: who benefits, who is excluded, does this concentrate or distribute power, what does Máire experience? Warm, direct, occasionally uncomfortable. Reads PRD + systems design at session start. Never writes code.

---

## The agent team (current state)

| Skill | File | Status | Job |
|-------|------|--------|-----|
| `/architect` | `.claude/commands/architect.md` | Built | Designs agent team, specs skills |
| `/systems-architect` | `.claude/commands/systems-architect.md` | Built | Models sociotechnical system before building |
| `/partner` | `.claude/commands/partner.md` | Built | Community-first thinking partner |
| `/feedback` | `.claude/commands/feedback.md` | Not built yet | Triage feedback queue |
| `/build` | `.claude/commands/build.md` | Not built yet | Pass approved proposals to embedded agent |
| `/migrate` | `.claude/commands/migrate.md` | Not built yet | Safely run pending DB migrations |
| `/audit` | `.claude/commands/audit.md` | Not built yet | Platform health check |
| `/session` | `.claude/commands/session.md` | Not built yet | Write end-of-session summaries |

**Note:** The global `systems-architect` and `business-analyst` skills keep overriding Meitheal-specific ones when invoked via the Skill tool. Workaround: run them directly by following the skill file instructions manually.

---

## Key documents produced

### `sessions/systems-design.md`
The foundation document. Must be read before any feature is built. Covers:
- The system in one paragraph
- **Máire** — the human anchor (67, housing co-op, not technical) — every decision runs through her
- Governance loop (full diagram with where AI sits)
- Agile loop (continuous delivery, definition of ready + done)
- Trust model (Member / Steward / Admin for v1)
- Safety model (hard limits + the meta-rule)
- Transparency model (changelog, attribution, AI cost visibility)
- 10 open questions
- Minimum viable governance loop
- Recommended first sprint

---

## Key decisions made this session

### 1. The Steward role is v1, not future
Originally deferred. Partner pushed back: without distributed governance, admin burnout kills the platform. Admin load model established:
- 5–20 members: 30–60 min/week, no stewards needed
- 20–50 members: 1–2 hrs/week, 1 steward
- 50–100 members: 2–4 hrs/week, 2–3 stewards
- 100–200 members: 4–8 hrs/week, 3–5 stewards

### 2. "Done" now requires member validation
"Deployed" is not "done." New definition:
1. Code committed + Vercel deployed
2. Admin validates technically
3. Member who suggested it receives ✅ / 🔄 prompt
4. If 🔄: feedback widget opens pre-filled, feeds back into queue
5. 14-day silence = done anyway, but opportunity must exist

Schema additions needed: `member_validated boolean`, `member_validation_note text` on proposals table.

### 3. Feedback widget copy must be plain language (Máire test)
- "Idea 💡" → "I'd like to suggest something 💡"
- "Bug 🔧" → "Something isn't working 🔧"
- "Question ❓" → "I have a question ❓"
- "Other 💬" → "Something else 💬"

### 4. Original submitter always has recourse on proposals
If an admin misunderstands what a member meant when promoting to a proposal, the original submitter can add a clarification note — regardless of whether general member commenting is enabled.

### 5. The meta-rule is the most important safety rule
> The AI cannot modify the system that governs the AI.
This goes in `api/agent.js` system prompt in plain language visible to any admin.

### 6. Admin interface must be restructured
Current `admin.html` is a freeform chat — violates the governance model. Must become:
- Triage view (feedback queue)
- Proposals board
- Build queue
Freeform chat is a small utility, not the primary interface.

### 7. Agent receives structured briefs, not chat messages
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

---

## Open questions (unresolved)

| ID | Question | Priority |
|----|----------|----------|
| OQ-01 | Who can submit feedback? | Low — default any member |
| OQ-02 | Can members comment on proposals? | Medium — needed before proposals page |
| OQ-03 | Can proposals be withdrawn/edited? | Low — admin can edit |
| OQ-04 | Max build queue depth? | Low — one at a time |
| OQ-06 | Multi-admin setup? | High — affects setup wizard + schema |
| OQ-07 | What if agent breaks the site? | High — affects agent.js |
| OQ-08 | Who sees the system prompt? | Low — default public |
| OQ-09 | Member validation notification mechanism? | Medium — needed before notifications built |
| OQ-10 | Steward designation/removal process? | Medium — needed before Steward UI |

OQ-05 resolved: admin validates technically, member validates meaningfully.

---

## Recommended first sprint (updated from systems design)

1. Run `migrations/01_proposals.sql` + add `trust_level`, `member_validated`, `member_validation_note` columns
2. Port `feedback-widget.js` — rewrite copy (Máire test), wire into all member pages
3. Build `triage.html` — admin sees queue, can promote / decline / direct fix
4. Build `proposals.html` — all members see proposals; original submitter can add clarification
5. Rebuild `admin.html` — triage / proposals / build queue; add Steward management
6. Update `api/agent.js` — structured brief input, meta-rule in system prompt
7. Build `my-feedback.html` — member sees submissions, responses, validation prompt
8. Build `/feedback` skill
9. Build `/build` skill

---

## What's next

The systems thinking is done. The partner has reviewed it. The foundation is solid.

Next session: brief the Architect with the systems design, then start the first sprint. Begin with the migration.

Before touching any code next session: read `sessions/systems-design.md` in full.
