# Phase 2 — Learning memory and reports

**Goal:** Every reflection becomes searchable by meaning, and I can see where my time goes.

## Checklist

### Embeddings
- [ ] `src/lib/ai/gemini.ts`: client + `embed(text)` using `gemini-embedding-001`, `outputDimensionality: 768`, task type `RETRIEVAL_DOCUMENT` (store) / `RETRIEVAL_QUERY` (search)
- [ ] On reflection save/edit: build a chunk text (`title + project + date + learning`), upsert into `learning_embeddings` (`F32_BLOB(768)` via `vector32(?)`)
- [ ] Do it after the response (`after()` from `next/server`) so saving stays fast; keep `embedding_status` on the row for retries
- [ ] Backfill script: `bun run scripts/backfill-embeddings.ts`
- [ ] Vector index migration: `CREATE INDEX learning_embeddings_vec_idx ON learning_embeddings (libsql_vector_idx(embedding));`

### Learnings page
- [ ] `/learnings`: timeline of reflections, filters by date range and project
- [ ] Semantic search box: `vector_top_k` + join, filtered by user and date range
- [ ] Topic extraction: ask Gemini for 1–5 topic tags per reflection, stored in `activity_topics`

### Reports page
- [ ] `/reports`: time per day (bar), per project (donut), streaks, top topics this month/year
- [ ] Edit an entry's start/end time from the week view

## Done when
- Searching "what did I learn about caching" returns the right reflections even with different wording.
