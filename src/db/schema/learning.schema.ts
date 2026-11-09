// Phase 2 — learning memory
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, f32Vector, id, updatedAt } from "./columns";
import { activities } from "./activity.schema";
import { users } from "./user.schema";

export const learningEmbeddings = sqliteTable(
  "learning_embeddings",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityId: text("activity_id")
      .notNull()
      .unique()
      .references(() => activities.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    content: text("content").notNull(),
    embedding: f32Vector("embedding"),
    model: text("model").notNull(),
    /** 'pending' | 'done' | 'failed' */
    status: text("status").notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("embeddings_user_day_idx").on(t.userId, t.day)],
);

export const activityTopics = sqliteTable(
  "activity_topics",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    day: text("day").notNull(),
  },
  (t) => [
    index("topics_user_day_idx").on(t.userId, t.day),
    uniqueIndex("topics_activity_topic_idx").on(t.activityId, t.topic),
  ],
);
