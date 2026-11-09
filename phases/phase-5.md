# Phase 5 — Multi-user polish and monetization (optional)

**Goal:** Other people can use Lakonmu safely; billing can be switched on if it makes sense.

My recommendation: keep it free while it's just you. If others join, the real cost is AI calls (embeddings are cheap; assessment generation/grading is the cost driver), so a natural split is **Free** (unlimited tracking, limited assessments per month) vs **Pro** (more assessments, chat access, exports).

## Checklist
- [ ] Onboarding: timezone confirm, first project
- [ ] Settings: timezone, theme, export data (JSON/CSV), delete account
- [ ] Usage metering: count AI calls per user per month in `usage_events`
- [ ] Enforce limits from `src/lib/plans.ts` (already the single source of truth)
- [ ] Billing provider (Stripe or Lemon Squeezy): checkout, webhook → `users.plan`, `users.plan_renews_at`
- [ ] Upgrade card in sidebar wired to checkout (currently hidden)
- [ ] Rate limiting on AI endpoints
- [ ] Landing page, privacy policy, terms

## Done when
- A new user can sign up, use it for a week, and (if enabled) upgrade without manual work.
