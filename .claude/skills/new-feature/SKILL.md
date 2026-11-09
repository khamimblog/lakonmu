---
name: new-feature
description: Build a new Lakonmu feature end to end (service, server action, page/UI, tests, phase checklist). Use for any user-facing feature such as Learnings, Reports, Assessments, or Settings.
---

# Build a feature

Before coding, read `phases/README.md` and the current phase file to find the matching checklist items. For Next.js APIs, check `node_modules/next/dist/docs/` — this is Next 16 with Cache Components.

## 1. Data
If the feature needs tables or columns, follow the `add-db-table` skill first.

## 2. Service — `src/lib/services/<feature>.ts`
- `import "server-only"`.
- Functions take `user: User` first and scope every query by `user.id`; check ownership before update/delete.
- Throw `ActivityError` (from `./activities`) with a human message for user-facing failures.
- No React/Next imports here — Phase 4's API reuses these functions.
- AI calls (Gemini) go through a helper in `src/lib/ai/`; check `limitFor(user.plan, ...)` from `src/lib/plans.ts` before expensive calls and record a `usage_events` row.

## 3. Server actions — `src/app/(app)/<feature>/actions.ts`
`"use server"`; each action: `const user = await requireUser()` → call the service → `revalidatePath("/<feature>")` → return `ActionResult` (`{ ok: true, data } | { ok: false, error }`). Copy the `run()` wrapper pattern from `tracker/actions.ts`.

## 4. Page — `src/app/(app)/<feature>/page.tsx`
- Export `metadata`.
- The default export renders `<Suspense fallback={<Skeleton…/>}>` around an async inner component that calls `requireUser()` and the service (required by Cache Components).
- Client UI in `_components/`; use shadcn components, theme tokens, `useTransition` + `toast` for actions.
- Mobile-first: stack on small screens, expand at `md`. Check it at ~375px wide.

## 5. Navigation
Enable the item in `src/components/app-shell/nav.tsx` by removing its `soon` label, or add a new entry.

## 6. Tests
Add `tests/<feature>.test.ts` for service rules (pattern: `tests/activities.test.ts` with a temp DB, `mock.module("server-only")`, `setSystemTime`).

## 7. Finish
Run `bun run lint && bun run typecheck && bun test && bun run build`, all green. Tick the items in the phase file and update the phase status in `phases/README.md`.
