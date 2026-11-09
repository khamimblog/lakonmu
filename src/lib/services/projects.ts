import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, type User } from "@/db/schema";
import { PROJECT_COLOR_KEYS, type ProjectColor } from "@/lib/colors";
import { ActivityError } from "./activities";

export async function createProject(user: User, name: string, color?: string) {
  const n = name.trim().slice(0, 60);
  if (!n) throw new ActivityError("Project name can't be empty");

  const existing = await db.query.projects.findFirst({
    where: and(eq(projects.userId, user.id), eq(projects.name, n)),
  });
  if (existing) return existing;

  const count = (await db.select({ id: projects.id }).from(projects).where(eq(projects.userId, user.id)))
    .length;
  const c: ProjectColor = PROJECT_COLOR_KEYS.includes(color as ProjectColor)
    ? (color as ProjectColor)
    : PROJECT_COLOR_KEYS[count % PROJECT_COLOR_KEYS.length];

  const [row] = await db.insert(projects).values({ userId: user.id, name: n, color: c }).returning();
  return row;
}
