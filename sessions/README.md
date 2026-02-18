# Meitheal — Session Memory

This folder is your persistent memory across sessions. Read it at the start of every session.

## Instructions for Claude

- **When starting fresh or after compaction:** Read `session-INDEX.md` first, then the most recent session file
- **At the end of every session:** Write a new session file (next number in sequence) covering what was done, decisions made, what's next
- **When resuming mid-task:** Read the last session file to restore context before touching any code
- **Session files are append-only truth.** Never edit a previous session file — if something changed, note it in the new one.

## Quick orientation

**Project:** Meitheal — a GitHub template repo that any community can fork, deploy to Vercel, connect Supabase, add an AI API key, and have a self-building community platform. No developers required.

**Core concept:** Members submit feedback → admin triages → proposals are approved → embedded AI agent builds the features → community owns all the code and data.

**Key constraint:** The agent is NOT a freeform chatbot. It executes approved proposals. Admin chat is for triage and governance, not freestyle building.

**Live site:** https://meitheal.vercel.app
**GitHub:** https://github.com/RoryPeterRoberts/meitheal
**Supabase project:** fzylqmdpnsckuizxhygl

## Session Index

| # | Date | Summary |
|---|------|---------|
| 001 | 2026-02-18 | Initial setup, auth end-to-end, design system, pages rebuilt, PRD review |
| 002 | 2026-02-18 | Agent team structure, systems architect, altruistic business partner, systems design document |
| 003 | 2026-02-18 | First sprint: feedback widget, triage, proposals, admin rebuild, agent structured briefs, my-feedback, /feedback + /build skills |
