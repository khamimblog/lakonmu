// Phase 3 — assessments
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id } from "./columns";
import { users } from "./user.schema";

export type QuestionType = "mcq" | "code" | "text";

export const assessments = sqliteTable(
  "assessments",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    periodStart: text("period_start").notNull(),
    periodEnd: text("period_end").notNull(),
    /** 'generating' | 'ready' | 'in_progress' | 'graded' | 'failed' */
    status: text("status").notNull().default("generating"),
    score: real("score"),
    model: text("model"),
    createdAt: createdAt(),
    completedAt: integer("completed_at"),
  },
  (t) => [index("assessments_user_idx").on(t.userId, t.createdAt)],
);

export const assessmentQuestions = sqliteTable(
  "assessment_questions",
  {
    id: id(),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    type: text("type").$type<QuestionType>().notNull(),
    prompt: text("prompt").notNull(),
    /** JSON string[] for mcq */
    options: text("options", { mode: "json" }).$type<string[]>(),
    correctOption: integer("correct_option"),
    language: text("language"),
    starterCode: text("starter_code"),
    rubric: text("rubric"),
    explanation: text("explanation"),
    /** JSON string[] of activity ids the question was grounded on */
    sourceActivityIds: text("source_activity_ids", { mode: "json" }).$type<string[]>(),
  },
  (t) => [index("questions_assessment_idx").on(t.assessmentId, t.position)],
);

export const assessmentAnswers = sqliteTable(
  "assessment_answers",
  {
    id: id(),
    questionId: text("question_id")
      .notNull()
      .unique()
      .references(() => assessmentQuestions.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    answer: text("answer").notNull(),
    score: real("score"),
    feedback: text("feedback"),
    gradedAt: integer("graded_at"),
    createdAt: createdAt(),
  },
  (t) => [index("answers_assessment_idx").on(t.assessmentId)],
);
