# Lakonmu — development phases

Each phase file has a goal, a checklist, and "done when" criteria. Tick items as you go.

| Phase | Focus | Status |
| --- | --- | --- |
| [Phase 1](phase-1.md) | Foundation: auth, database, time tracker, reflections | In progress |
| [Phase 2](phase-2.md) | Learning memory: embeddings, semantic search, reports | Not started |
| [Phase 3](phase-3.md) | AI assessments: generate, answer, grade | Not started |
| [Phase 4](phase-4.md) | Chat integration API (chat.lakonmu.com) | Not started |
| [Phase 5](phase-5.md) | Multi-user polish and monetization | Not started |

## Decisions so far

- **Stack:** Next.js 16 (App Router) + bun, shadcn/ui (Radix), Turso (libSQL) + Drizzle, Firebase Auth (Google only), deployed on Railway.
- **AI:** Gemini only. `gemini-embedding-001` (768 dimensions) for vectors, a Gemini Flash model for generating and grading.
- **One day per activity:** an activity belongs to the day it was started in the user's timezone. If it's still running or paused at midnight, it's closed at 23:59:59 that day and flagged as "needs reflection".
- **Pause/resume:** stored as time segments (`activity_segments`), so the total excludes paused time.
- **Monetization:** not active. Every user has `plan = 'free'`, and limits live in `src/lib/plans.ts`, so billing can be added later without schema changes.
