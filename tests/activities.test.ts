import { afterAll, beforeAll, describe, expect, mock, setSystemTime, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point the app's db module at a throwaway database before it's imported.
const dir = mkdtempSync(join(tmpdir(), "lakonmu-test-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db").replace(/\\/g, "/")}`;
mock.module("server-only", () => ({}));

const { db } = await import("../src/db");
const { migrate } = await import("drizzle-orm/libsql/migrator");
const schema = await import("../src/db/schema");
const svc = await import("../src/lib/services/activities");
const { upsertUser } = await import("../src/lib/auth");

let user: Awaited<ReturnType<typeof upsertUser>>;
const T0 = Date.UTC(2026, 10, 9, 2, 0); // 09:00 in Jakarta (UTC+7)
const MIN = 60_000;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  user = await upsertUser({ firebaseUid: "u1", email: "a@b.c", timezone: "Asia/Jakarta" });
});

afterAll(() => {
  setSystemTime();
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
});

describe("activity lifecycle", () => {
  test("start, pause, resume, finish excludes paused time", async () => {
    setSystemTime(T0);
    const a = await svc.startActivity(user, { title: "Mobile app" });
    expect(a.day).toBe("2026-11-09");

    setSystemTime(T0 + 30 * MIN);
    await svc.pauseActivity(user, a.id);

    setSystemTime(T0 + 50 * MIN); // 20 min break
    await svc.resumeActivity(user, a.id);

    setSystemTime(T0 + 60 * MIN);
    const done = await svc.finishActivity(user, a.id);
    expect(done.status).toBe("finished");
    expect(done.durationSeconds).toBe(40 * 60);
    expect(done.endedAt).toBe(T0 + 60 * MIN);
  });

  test("starting a new activity pauses the running one", async () => {
    setSystemTime(T0 + 2 * 60 * MIN);
    const first = await svc.startActivity(user, { title: "Research" });
    setSystemTime(T0 + 2 * 60 * MIN + 10 * MIN);
    const second = await svc.startActivity(user, { title: "Daily call" });

    const data = await svc.getTrackerData(user, "2026-11-09");
    const byId = new Map(data.active.map((a) => [a.id, a]));
    expect(byId.get(first.id)?.status).toBe("paused");
    expect(byId.get(first.id)?.durationSeconds).toBe(600);
    expect(byId.get(second.id)?.status).toBe("running");
    expect(byId.get(second.id)?.runningSince).toBe(T0 + 130 * MIN);
  });

  test("activities left open are closed at the end of their day", async () => {
    // Next day, 08:00 Jakarta
    setSystemTime(Date.UTC(2026, 10, 10, 1, 0));
    const data = await svc.getTrackerData(user, "2026-11-09");
    expect(data.active).toHaveLength(0);

    const endOfDay = Date.UTC(2026, 10, 9, 17, 0) - 1; // 23:59:59.999 Jakarta
    const call = data.days[0].entries.find((e) => e.title === "Daily call")!;
    expect(call.autoFinished).toBe(true);
    expect(call.endedAt).toBe(endOfDay);
    expect(call.durationSeconds).toBe(Math.round((endOfDay - (T0 + 130 * MIN)) / 1000));

    // The paused one ends at its last segment, not at midnight.
    const research = data.days[0].entries.find((e) => e.title === "Research")!;
    expect(research.durationSeconds).toBe(600);
    expect(research.endedAt).toBe(T0 + 130 * MIN);

    expect(data.pendingReflections.map((p) => p.title).sort()).toEqual(
      ["Daily call", "Mobile app", "Research"].sort(),
    );
  });

  test("resume of a closed activity is rejected; reflection save/skip", async () => {
    const [anyRow] = await db.select().from(schema.activities).limit(1);
    await expect(svc.resumeActivity(user, anyRow.id)).rejects.toThrow(/finished/);

    const saved = await svc.saveReflection(user, anyRow.id, "  Learned about segments  ");
    expect(saved.learning).toBe("Learned about segments");
    expect(saved.reflectionStatus).toBe("done");

    const skipped = await svc.saveReflection(user, anyRow.id, null);
    expect(skipped.reflectionStatus).toBe("skipped");
  });

  test("users can't touch other users' activities", async () => {
    const other = await upsertUser({ firebaseUid: "u2", email: "x@y.z" });
    const [row] = await db.select().from(schema.activities).limit(1);
    await expect(svc.deleteActivity(other, row.id)).rejects.toThrow(/not found/);
  });
});
