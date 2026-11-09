import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getTrackerData } from "@/lib/services/activities";
import { todayIn, weekStart } from "@/lib/time";
import { TrackerSkeleton } from "@/components/app-shell/app-shell-skeleton";
import { Tracker } from "./_components/tracker";

export const metadata: Metadata = { title: "Time Tracker" };

export default function TrackerPage({ searchParams }: PageProps<"/tracker">) {
  return (
    <Suspense fallback={<TrackerSkeleton />}>
      <TrackerContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TrackerContent({ searchParams }: Pick<PageProps<"/tracker">, "searchParams">) {
  const user = await requireUser();
  const { week } = await searchParams;

  const currentWeek = weekStart(todayIn(user.timezone));
  const requested =
    typeof week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(week) ? weekStart(week) : currentWeek;

  const data = await getTrackerData(user, requested);
  return <Tracker data={data} timezone={user.timezone} currentWeek={currentWeek} />;
}
