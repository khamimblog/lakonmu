# Lakonmu

A daily productivity tracker: start an activity, pause/resume it, and when you finish, write down what you learned. Reflections become a searchable memory (Phase 2), the source for AI assessments (Phase 3), and the data behind a chat assistant (Phase 4).

Roadmap and progress: [`phases/`](phases/README.md).

## Stack

Next.js 16 (App Router, Cache Components) · bun · shadcn/ui · Turso (libSQL) + Drizzle · Firebase Auth (Google) · Gemini · Railway

## Run locally

```bash
bun install
cp .env.example .env.local      # fill in Firebase values, or set AUTH_DEV_BYPASS=true
bun run db:migrate              # creates local.db (libSQL file, vector-capable)
bun dev
```

With `AUTH_DEV_BYPASS=true` you're signed in as a fake "Dev User" (development only, ignored in production builds).

| Script | What it does |
| --- | --- |
| `bun dev` | Dev server |
| `bun run build` / `bun start` | Production build / serve |
| `bun test` | Time helpers + activity lifecycle tests (uses a temp database) |
| `bun run lint` / `bun run typecheck` | ESLint / TypeScript |
| `bun run db:generate` | New migration after editing a file in `src/db/schema/` |
| `bun run db:migrate` | Apply migrations (local file or Turso, based on env) |
| `bun run db:studio` | Drizzle Studio |

## Set up Firebase (Google sign-in)

1. Create a Firebase project → **Authentication** → enable **Google**.
2. **Authentication → Settings → Authorized domains**: add `localhost` and your Railway domain (and later `lakonmu.com`).
3. **Project settings → General → Your apps → Web app**: copy the values into `NEXT_PUBLIC_FIREBASE_*`.
4. **Project settings → Service accounts → Generate new private key**: copy `project_id`, `client_email`, `private_key` into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

Sign-in flow: Google popup → ID token → `POST /api/auth/session` verifies it with Firebase Admin and sets an httpOnly `__session` cookie (14 days). The server reads only that cookie.

## Set up Turso

```bash
turso db create lakonmu
turso db show lakonmu --url        # → TURSO_DATABASE_URL
turso db tokens create lakonmu     # → TURSO_AUTH_TOKEN
```

## Deploy to Railway

1. New project → deploy from this repo. Railway detects bun from `bun.lock`.
2. Add every variable from `.env.example` (leave `AUTH_DEV_BYPASS` unset).
3. `railway.json` runs `bun run db:migrate` before each deploy, then `bun run start`. Health check: `/api/health`.

## How tracking works

- An activity belongs to the day it started in your timezone (saved from the browser at sign-in).
- Time is stored as segments; pausing closes a segment, resuming opens a new one, so paused time isn't counted.
- Only one activity runs at a time; starting or resuming another pauses the current one.
- Anything still open at 23:59:59 is finished automatically and listed as waiting for a reflection.

Code map: rules live in `src/lib/services/activities.ts` (shared by server actions now and the public API later), schema in `src/db/schema/` (one `*.schema.ts` per area), UI in `src/app/(app)/tracker/`.
