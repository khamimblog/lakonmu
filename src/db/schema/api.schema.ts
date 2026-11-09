// Phase 4/5 — API access and usage metering
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id } from "./columns";
import { users } from "./user.schema";

export const apiTokens = sqliteTable("api_tokens", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  lastUsedAt: integer("last_used_at"),
  createdAt: createdAt(),
  revokedAt: integer("revoked_at"),
});

export const usageEvents = sqliteTable(
  "usage_events",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** e.g. 'embedding' | 'assessment_generate' | 'assessment_grade' */
    kind: text("kind").notNull(),
    units: integer("units").notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [index("usage_user_kind_idx").on(t.userId, t.kind, t.createdAt)],
);
