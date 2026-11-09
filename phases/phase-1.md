# Phase 1 — Foundation and time tracker

**Goal:** I can sign in with Google, start/pause/resume/finish activities, write what I learned when I finish, and review my week. It works on phone and desktop.

## Checklist

### Setup
- [x] Next.js 16 + bun + TypeScript + Tailwind v4
- [x] shadcn/ui (Radix base), dark-first theme with light mode
- [x] Drizzle + libSQL client (local `file:local.db` in dev, Turso in prod)
- [x] Full schema drafted (Phase 1 tables used now, Phase 2–5 tables ready)
- [x] `.env.example`, `railway.json` with pre-deploy migrations

### Auth
- [x] Firebase client: Google popup sign-in
- [x] Server: ID token → Firebase session cookie (`__session`, httpOnly, 14 days)
- [x] User row upserted in Turso on first sign-in, timezone saved
- [x] Protected `(app)` layout, sign out

### Time tracker
- [x] "What are you working on?" bar + project picker + start
- [x] Start a new activity → the currently running one is paused automatically
- [x] Pause / resume (segments) with a live timer
- [x] Finish → "What did you learn?" dialog (save or skip)
- [x] Auto-finish at the end of the activity's day; prompt for pending reflections
- [x] Week view grouped by day with day totals and week total, prev/next week
- [x] Per entry: continue (start again with same title/project), edit reflection, delete
- [x] Projects: create inline from the picker, colored badge
- [x] Responsive: sidebar on desktop, top bar + drawer on mobile, stacked rows on small screens

### To verify manually
- [ ] Create Firebase project, enable Google provider, add `localhost` + Railway domain to authorized domains
- [ ] Create Turso DB, run `bun run db:migrate` against it
- [ ] Deploy to Railway and sign in from phone

## Done when
- A full day of real use works without data loss, including leaving an activity running overnight.
