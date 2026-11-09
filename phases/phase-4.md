# Phase 4 — Chat integration (chat.lakonmu.com)

**Goal:** A separate chat app can answer "what did I learn last month?" or "what topics did I study this year?" from my data.

## Checklist
- [ ] Personal API tokens: create/revoke in Settings, stored hashed in `api_tokens`
- [ ] Versioned REST API under `/api/v1` (Bearer token or Firebase ID token)
  - [ ] `GET /api/v1/learnings?from&to&project` — raw reflections
  - [ ] `POST /api/v1/search` — semantic search `{ query, from?, to?, limit? }`
  - [ ] `GET /api/v1/topics?from&to` — topic counts
  - [ ] `GET /api/v1/stats?from&to` — time totals
- [ ] CORS allowlist for `chat.lakonmu.com`
- [ ] Optional: expose the same operations as an MCP server so any MCP-capable chat client can use them
- [ ] Shared Firebase project so the chat app signs in with the same Google account

## Done when
- The chat app can answer time-scoped questions using only these endpoints.
