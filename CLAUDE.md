@AGENTS.md

# Lakonmu

A daily productivity tracker: start an activity, pause/resume it, finish it and write what you learned. Built for one user first; later multi-user. Roadmap and progress live in `phases/` — read the current phase file before starting feature work and tick items when done.

## Stack
- Next.js 16 App Router with **Cache Components on**: anything per-request (cookies, DB, `Date.now()`) must sit inside `<Suspense>`. `getCurrentUser()` calls `connection()` first for this reason.
- **bun** for everything (`bun add`, `bun run`, `bunx`). Never npm/yarn/pnpm.
- shadcn/ui (Radix base, `radix-nova` style). Add components with `bunx shadcn@latest add <name>`.
- Turso/libSQL + Drizzle. Dev uses `file:local.db` when `TURSO_DATABASE_URL` is unset.
- Firebase Auth (Google only) → httpOnly `__session` cookie. `AUTH_DEV_BYPASS=true` in `.env.local` skips login locally.
- AI: **Gemini only** (`@google/genai`): `gemini-embedding-001` at 768 dims for vectors, a Gemini Flash model for generation/grading.
- Deploy: Railway (`railway.json` runs migrations pre-deploy).

## Commands
- `bun dev` · `bun run build` · `bun test` · `bun run lint` · `bun run typecheck`
- `bun run db:generate` (after schema edits) · `bun run db:migrate` · `bun run db:studio`

## Where things go
- `src/db/schema/<area>.schema.ts` — one file per area, re-exported from `src/db/schema/index.ts`. Shared column helpers in `columns.ts`.
- `src/lib/services/*.ts` — all business rules, UI-agnostic, take a `User` as first arg and enforce ownership. Throw `ActivityError` for user-facing errors. The future public API (Phase 4) must reuse these.
- `src/app/(app)/<feature>/actions.ts` — thin server actions: `requireUser()` → service → `revalidatePath`, returning `ActionResult`.
- `src/app/(app)/<feature>/_components/` — client components for that route.
- `src/lib/time.ts` — all timezone/day math (Intl only, no date-tz libs).
- `src/lib/plans.ts` — the only place plan limits live (monetization not active).
- `tests/` — `bun test`; DB tests use a temp libSQL file and mock `server-only`.

## Rules
- An activity belongs to the day it started in the user's timezone and is force-closed at that day's `dayEndsAt`. Only one activity runs at a time. Time = sum of `activity_segments`.
- Timestamps are epoch ms integers; days are `YYYY-MM-DD` strings.
- Every query is scoped by `userId`.
- UI must work on phones: design mobile-first, check `sm`/`md` breakpoints.
- Dark theme is the default; use theme tokens (`bg-card`, `text-muted-foreground`, `primary`), not raw colors, except project colors in `src/lib/colors.ts`.
- When the user asks how to run something, give the command; don't start servers unprompted.
