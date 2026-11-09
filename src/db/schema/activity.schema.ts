import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id, updatedAt } from "./columns";
import { projects } from "./project.schema";
import { users } from "./user.schema";

export type ActivityStatus = "running" | "paused" | "finished";
export type ReflectionStatus = "pending" | "done" | "skipped";

export const activities = sqliteTable(
  "activities",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    status: text("status").$type<ActivityStatus>().notNull().default("running"),
    /** Calendar day (YYYY-MM-DD) in the user's timezone when started. */
    day: text("day").notNull(),
    timezone: text("timezone").notNull(),
    startedAt: integer("started_at").notNull(),
    /** Last millisecond of `day` in `timezone`; activities are force-closed here. */
    dayEndsAt: integer("day_ends_at").notNull(),
    endedAt: integer("ended_at"),
    /** Sum of closed segments, kept in sync on pause/finish. */
    durationSeconds: integer("duration_seconds").notNull().default(0),
    autoFinished: integer("auto_finished", { mode: "boolean" })
      .notNull()
      .default(false),
    learning: text("learning"),
    reflectionStatus: text("reflection_status")
      .$type<ReflectionStatus>()
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("activities_user_day_idx").on(t.userId, t.day),
    index("activities_user_status_idx").on(t.userId, t.status),
  ],
);

/** One row per uninterrupted stretch of work; pausing closes the open segment. */
export const activitySegments = sqliteTable(
  "activity_segments",
  {
    id: id(),
    activityId: text("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    startedAt: integer("started_at").notNull(),
    endedAt: integer("ended_at"),
  },
  (t) => [index("segments_activity_idx").on(t.activityId)],
);

export type Activity = typeof activities.$inferSelect;
export type ActivitySegment = typeof activitySegments.$inferSelect;
