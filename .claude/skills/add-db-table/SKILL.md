---
name: add-db-table
description: Add or change a Drizzle table in Lakonmu (schema file, re-export, migration). Use whenever a task needs a new table, column, or index.
---

# Add or change a database table

1. **Pick the file.** Put the table in `src/db/schema/<area>.schema.ts` (existing: user, project, activity, learning, assessment, api). Create a new `<area>.schema.ts` only for a genuinely new area.

2. **Write the table** following existing conventions:
   - Use helpers from `./columns`: `id()`, `createdAt()`, `updatedAt()`; vectors use `f32Vector("embedding")`.
   - snake_case column names, camelCase keys.
   - Timestamps: `integer(...)` epoch ms. Days: `text(...)` `YYYY-MM-DD`.
   - Owned rows get `userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" })` plus an index starting with `userId`.
   - Enum-like text columns: `text("status").$type<MyStatus>()` with the union type exported.
   - Export inferred types: `export type Thing = typeof things.$inferSelect;`

3. **Re-export** from `src/db/schema/index.ts` if it's a new file (the drizzle config picks up `*.schema.ts` automatically, but app imports go through the index).

4. **Generate the migration:** `bun run db:generate --name <short_snake_name>`. Open the new SQL in `drizzle/` and check it — SQLite can't alter columns in place, so watch for table rebuilds that could drop data.
   - Raw SQL drizzle can't express (e.g. vector indexes `libsql_vector_idx`): `bunx drizzle-kit generate --custom --name <name>` and write the SQL by hand.

5. **Apply locally:** `bun run db:migrate`.

6. **Verify:** `bun run typecheck && bun test`. Add a service + test in `tests/` if the table carries business rules.

Never edit an already-applied migration file; add a new one.
