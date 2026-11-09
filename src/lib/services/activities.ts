import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activitySegments,
  projects,
  type Activity,
  type ActivitySegment,
  type Project,
  type User,
} from "@/db/schema";
import { addDays, dayKey, endOfDayMs } from "@/lib/time";

/**
 * Activity lifecycle. This layer is UI-agnostic so server actions now and the
 * public API later (Phase 4) share the same rules:
 *
 * - An activity is tied to the day it started (user timezone) and can't run past
 *   that day's last millisecond (`dayEndsAt`).
 * - Only one activity runs at a time. Starting/resuming one pauses the other.
 * - Time is the sum of segments, so paused time is excluded.
 */

export class ActivityError extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;

async function getOwned(ex: Executor, userId: string, activityId: string) {
  const row = await ex.query.activities.findFirst({
    where: and(eq(activities.id, activityId), eq(activities.userId, userId)),
  });
  if (!row) throw new ActivityError("Activity not found");
  return row;
}

/** Close the open segment (if any) at `at` and recompute the total. Returns last segment end. */
async function closeSegmentsAndSum(ex: Executor, activityId: string, at: number) {
  await ex
    .update(activitySegments)
    .set({ endedAt: at })
    .where(and(eq(activitySegments.activityId, activityId), isNull(activitySegments.endedAt)));

  const segs = await ex
    .select()
    .from(activitySegments)
    .where(eq(activitySegments.activityId, activityId));

  let totalMs = 0;
  let lastEnd = 0;
  for (const s of segs) {
    const end = s.endedAt ?? at;
    totalMs += Math.max(0, end - s.startedAt);
    lastEnd = Math.max(lastEnd, end);
  }
  return { durationSeconds: Math.round(totalMs / 1000), lastEnd };
}

async function pauseRunning(ex: Executor, userId: string, now: number, exceptId?: string) {
  const running = await ex
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.status, "running"),
        exceptId ? ne(activities.id, exceptId) : undefined,
      ),
    );
  for (const a of running) {
    const { durationSeconds } = await closeSegmentsAndSum(ex, a.id, Math.min(now, a.dayEndsAt));
    await ex
      .update(activities)
      .set({ status: "paused", durationSeconds })
      .where(eq(activities.id, a.id));
  }
}

/** Finish any running/paused activity whose day is over. Safe to call often. */
export async function closeExpired(userId: string, now = Date.now()) {
  const expired = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        ne(activities.status, "finished"),
        lt(activities.dayEndsAt, now),
      ),
    );
  if (!expired.length) return 0;

  await db.transaction(async (tx) => {
    for (const a of expired) {
      const { durationSeconds, lastEnd } = await closeSegmentsAndSum(tx, a.id, a.dayEndsAt);
      await tx
        .update(activities)
        .set({
          status: "finished",
          durationSeconds,
          endedAt: lastEnd || a.dayEndsAt,
          autoFinished: true,
        })
        .where(eq(activities.id, a.id));
    }
  });
  return expired.length;
}

export async function startActivity(
  user: User,
  input: { title: string; projectId?: string | null },
) {
  const title = input.title.trim();
  if (!title) throw new ActivityError("Give your activity a title");
  if (title.length > 200) throw new ActivityError("Title is too long");

  if (input.projectId) {
    const p = await db.query.projects.findFirst({
      where: and(eq(projects.id, input.projectId), eq(projects.userId, user.id)),
    });
    if (!p) throw new ActivityError("Project not found");
  }

  const now = Date.now();
  await closeExpired(user.id, now);
  const day = dayKey(now, user.timezone);

  return db.transaction(async (tx) => {
    await pauseRunning(tx, user.id, now);
    const [activity] = await tx
      .insert(activities)
      .values({
        userId: user.id,
        projectId: input.projectId ?? null,
        title,
        status: "running",
        day,
        timezone: user.timezone,
        startedAt: now,
        dayEndsAt: endOfDayMs(day, user.timezone),
      })
      .returning();
    await tx.insert(activitySegments).values({ activityId: activity.id, startedAt: now });
    return activity;
  });
}

export async function pauseActivity(user: User, activityId: string) {
  const now = Date.now();
  await closeExpired(user.id, now);
  return db.transaction(async (tx) => {
    const a = await getOwned(tx, user.id, activityId);
    if (a.status !== "running") throw new ActivityError("Activity isn't running");
    const { durationSeconds } = await closeSegmentsAndSum(tx, a.id, now);
    await tx
      .update(activities)
      .set({ status: "paused", durationSeconds })
      .where(eq(activities.id, a.id));
  });
}

export async function resumeActivity(user: User, activityId: string) {
  const now = Date.now();
  await closeExpired(user.id, now);
  return db.transaction(async (tx) => {
    const a = await getOwned(tx, user.id, activityId);
    if (a.status === "finished") {
      throw new ActivityError("This activity is finished. Start it again instead.");
    }
    if (a.status === "running") return;
    await pauseRunning(tx, user.id, now, a.id);
    await tx.insert(activitySegments).values({ activityId: a.id, startedAt: now });
    await tx.update(activities).set({ status: "running" }).where(eq(activities.id, a.id));
  });
}

export async function finishActivity(user: User, activityId: string) {
  const now = Date.now();
  await closeExpired(user.id, now);
  return db.transaction(async (tx) => {
    const a = await getOwned(tx, user.id, activityId);
    if (a.status === "finished") return a;
    const { durationSeconds, lastEnd } = await closeSegmentsAndSum(
      tx,
      a.id,
      Math.min(now, a.dayEndsAt),
    );
    const [updated] = await tx
      .update(activities)
      .set({ status: "finished", durationSeconds, endedAt: lastEnd || now })
      .where(eq(activities.id, a.id))
      .returning();
    return updated;
  });
}

/** Start a fresh activity with the same title and project (the ▶ on past entries). */
export async function continueActivity(user: User, activityId: string) {
  const a = await getOwned(db, user.id, activityId);
  return startActivity(user, { title: a.title, projectId: a.projectId });
}

export async function saveReflection(
  user: User,
  activityId: string,
  learning: string | null,
) {
  const a = await getOwned(db, user.id, activityId);
  if (a.status !== "finished") throw new ActivityError("Finish the activity first");
  const text = learning?.trim() ?? "";
  if (text.length > 10_000) throw new ActivityError("Reflection is too long");

  const [updated] = await db
    .update(activities)
    .set({
      learning: text || null,
      reflectionStatus: text ? "done" : "skipped",
    })
    .where(eq(activities.id, a.id))
    .returning();
  // Phase 2: enqueue embedding + topic extraction for `updated` here.
  return updated;
}

export async function renameActivity(user: User, activityId: string, title: string) {
  const t = title.trim();
  if (!t) throw new ActivityError("Title can't be empty");
  await getOwned(db, user.id, activityId);
  await db.update(activities).set({ title: t.slice(0, 200) }).where(eq(activities.id, activityId));
}

export async function deleteActivity(user: User, activityId: string) {
  await getOwned(db, user.id, activityId);
  await db.delete(activities).where(eq(activities.id, activityId));
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type ActivityView = Activity & {
  project: Pick<Project, "id" | "name" | "color"> | null;
  /** Epoch ms the current segment started, if running. */
  runningSince: number | null;
};

export type DayGroup = { day: string; totalSeconds: number; entries: ActivityView[] };

function toView(
  a: Activity,
  projectMap: Map<string, Project>,
  openSegments: Map<string, ActivitySegment>,
): ActivityView {
  const p = a.projectId ? projectMap.get(a.projectId) : undefined;
  return {
    ...a,
    project: p ? { id: p.id, name: p.name, color: p.color } : null,
    runningSince: a.status === "running" ? (openSegments.get(a.id)?.startedAt ?? null) : null,
  };
}

export async function getTrackerData(user: User, weekStartDay: string) {
  await closeExpired(user.id);
  const weekEndDay = addDays(weekStartDay, 6);

  const [active, finished, pending, userProjects] = await Promise.all([
    db
      .select()
      .from(activities)
      .where(and(eq(activities.userId, user.id), ne(activities.status, "finished")))
      .orderBy(desc(activities.startedAt)),
    db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, user.id),
          eq(activities.status, "finished"),
          gte(activities.day, weekStartDay),
          lte(activities.day, weekEndDay),
        ),
      )
      .orderBy(desc(activities.day), desc(activities.startedAt)),
    db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, user.id),
          eq(activities.status, "finished"),
          eq(activities.reflectionStatus, "pending"),
        ),
      )
      .orderBy(desc(activities.startedAt))
      .limit(10),
    db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, user.id), eq(projects.archived, false)))
      .orderBy(asc(projects.name)),
  ]);

  const projectMap = new Map(userProjects.map((p) => [p.id, p]));
  const runningIds = active.filter((a) => a.status === "running").map((a) => a.id);
  const openSegs = runningIds.length
    ? await db
        .select()
        .from(activitySegments)
        .where(
          and(inArray(activitySegments.activityId, runningIds), isNull(activitySegments.endedAt)),
        )
    : [];
  const openMap = new Map(openSegs.map((s) => [s.activityId, s]));

  const days = new Map<string, DayGroup>();
  for (const a of finished) {
    const g = days.get(a.day) ?? { day: a.day, totalSeconds: 0, entries: [] };
    g.entries.push(toView(a, projectMap, openMap));
    g.totalSeconds += a.durationSeconds;
    days.set(a.day, g);
  }

  const activeViews = active.map((a) => toView(a, projectMap, openMap));
  const weekFinishedSeconds = finished.reduce((s, a) => s + a.durationSeconds, 0);
  const today = dayKey(Date.now(), user.timezone);

  return {
    today,
    weekStart: weekStartDay,
    weekEnd: weekEndDay,
    active: activeViews,
    // Active activities count toward the week total only if they're in this week.
    activeInWeek: activeViews.filter((a) => a.day >= weekStartDay && a.day <= weekEndDay),
    days: [...days.values()],
    weekFinishedSeconds,
    pendingReflections: pending.map((a) => toView(a, projectMap, openMap)),
    projects: userProjects.map((p) => ({ id: p.id, name: p.name, color: p.color })),
  };
}

export type TrackerData = Awaited<ReturnType<typeof getTrackerData>>;
