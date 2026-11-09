import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, id, updatedAt } from "./columns";

export const users = sqliteTable("users", {
  id: id(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  photoUrl: text("photo_url"),
  timezone: text("timezone").notNull().default("UTC"),
  /** 'free' | 'pro' — see src/lib/plans.ts */
  plan: text("plan").notNull().default("free"),
  planRenewsAt: integer("plan_renews_at"),
  billingCustomerId: text("billing_customer_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type User = typeof users.$inferSelect;
