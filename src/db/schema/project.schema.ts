import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, id } from "./columns";
import { users } from "./user.schema";

export const projects = sqliteTable(
  "projects",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** key into PROJECT_COLORS (src/lib/colors.ts) */
    color: text("color").notNull().default("indigo"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("projects_user_name_idx").on(t.userId, t.name)],
);

export type Project = typeof projects.$inferSelect;
