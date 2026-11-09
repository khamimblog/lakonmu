# Phase 3 — AI assessments

**Goal:** Pick a topic and a period, get a generated quiz grounded in what I actually learned, answer it, and get scored.

## Checklist
- [ ] `/assessments/new`: topic (free text or from topic tags), period (date range), question mix (MCQ / coding / text), count
- [ ] Retrieval: vector search over `learning_embeddings` for the topic within the period (fallback: all reflections in the period)
- [ ] Generation: Gemini with structured JSON output (`responseSchema`) → validate with zod → store `assessments` + `assessment_questions`
  - MCQ: options, correct index, explanation
  - Coding: prompt, language, starter code, rubric
  - Text: prompt, rubric / key points
- [ ] Take assessment UI: one question per screen on mobile, code editor for coding tasks (e.g. CodeMirror)
- [ ] Grading
  - MCQ: graded locally, no AI call
  - Coding / text: Gemini grades against rubric → score 0–100 + feedback, stored in `assessment_answers`
- [ ] Results page: total score, per-question feedback, link back to the source reflections
- [ ] History list with scores over time per topic

## Done when
- I can generate a 10-question assessment for "last month", finish it on my phone, and see feedback per answer.
