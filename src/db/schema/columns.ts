import { customType, integer, text } from "drizzle-orm/sqlite-core";

/** All timestamps are stored as Unix epoch milliseconds (integer). */
export const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const createdAt = () =>
  integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now());

export const updatedAt = () =>
  integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now())
    .$onUpdateFn(() => Date.now());

export const EMBEDDING_DIMENSIONS = 768;

/**
 * libSQL native vector column. Write with `sql\`vector32(${JSON.stringify(arr)})\``,
 * query with `vector_distance_cos` or `vector_top_k`.
 */
export const f32Vector = customType<{ data: number[]; driverData: ArrayBuffer }>({
  dataType() {
    return `F32_BLOB(${EMBEDDING_DIMENSIONS})`;
  },
  fromDriver(value) {
    return Array.from(new Float32Array(value));
  },
});
