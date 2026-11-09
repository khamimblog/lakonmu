"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import * as svc from "@/lib/services/activities";
import { createProject } from "@/lib/services/projects";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath("/tracker");
    return { ok: true, data };
  } catch (err) {
    if (err instanceof svc.ActivityError) return { ok: false, error: err.message };
    console.error(err);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

export async function startActivityAction(input: { title: string; projectId?: string | null }) {
  const user = await requireUser();
  return run(async () => (await svc.startActivity(user, input)).id);
}

export async function pauseActivityAction(id: string) {
  const user = await requireUser();
  return run(() => svc.pauseActivity(user, id));
}

export async function resumeActivityAction(id: string) {
  const user = await requireUser();
  return run(() => svc.resumeActivity(user, id));
}

export async function finishActivityAction(id: string) {
  const user = await requireUser();
  return run(async () => {
    const a = await svc.finishActivity(user, id);
    return { id: a.id, title: a.title, durationSeconds: a.durationSeconds };
  });
}

export async function continueActivityAction(id: string) {
  const user = await requireUser();
  return run(async () => (await svc.continueActivity(user, id)).id);
}

export async function saveReflectionAction(id: string, learning: string | null) {
  const user = await requireUser();
  return run(async () => {
    await svc.saveReflection(user, id, learning);
  });
}

export async function renameActivityAction(id: string, title: string) {
  const user = await requireUser();
  return run(() => svc.renameActivity(user, id, title));
}

export async function deleteActivityAction(id: string) {
  const user = await requireUser();
  return run(() => svc.deleteActivity(user, id));
}

export async function createProjectAction(name: string) {
  const user = await requireUser();
  return run(async () => {
    const p = await createProject(user, name);
    return { id: p.id, name: p.name, color: p.color };
  });
}
