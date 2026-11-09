"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Lightbulb, Timer } from "lucide-react";
import type { TrackerData } from "@/lib/services/activities";
import { Button } from "@/components/ui/button";
import { liveSeconds, useNow } from "@/hooks/use-now";
import { addDays, formatDayLabel, formatDuration } from "@/lib/time";
import { ActiveActivities } from "./active-activities";
import { DayGroup } from "./day-group";
import { ReflectionDialog, type ReflectionTarget } from "./reflection-dialog";
import { StartBar } from "./start-bar";

export function Tracker({
  data,
  timezone,
  currentWeek,
}: {
  data: TrackerData;
  timezone: string;
  currentWeek: string;
}) {
  const router = useRouter();
  const hasRunning = data.active.some((a) => a.status === "running");
  const now = useNow(hasRunning);
  const [reflecting, setReflecting] = useState<ReflectionTarget | null>(null);

  // A running activity may cross midnight while the tab is open: refresh so the
  // server closes it and it shows up as needing a reflection.
  useEffect(() => {
    if (!data.active.length) return;
    const nextEnd = Math.min(...data.active.map((a) => a.dayEndsAt));
    const wait = nextEnd - Date.now() + 1500;
    if (wait > 2 ** 31 - 1) return;
    const id = setTimeout(() => router.refresh(), Math.max(0, wait));
    return () => clearTimeout(id);
  }, [data.active, router]);

  const isCurrentWeek = data.weekStart === currentWeek;
  const weekSeconds =
    data.weekFinishedSeconds + data.activeInWeek.reduce((s, a) => s + liveSeconds(a, now), 0);
  const weekLabel = isCurrentWeek
    ? "This week"
    : data.weekStart === addDays(currentWeek, -7)
      ? "Last week"
      : `${formatDayLabel(data.weekStart)} – ${formatDayLabel(data.weekEnd)}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 md:py-8 lg:px-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Time Tracker</h1>
        <span className="hidden text-sm text-muted-foreground sm:block">{formatDayLabel(data.today)}</span>
      </div>

      <div className="space-y-3">
        <StartBar projects={data.projects} hasRunning={hasRunning} />
        <ActiveActivities
          activities={data.active}
          now={now}
          timezone={timezone}
          today={data.today}
          onFinished={(a) => setReflecting(a)}
        />
      </div>

      {data.pendingReflections.length > 0 && (
        <section className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {data.pendingReflections.length === 1
                  ? "1 session is waiting for a reflection"
                  : `${data.pendingReflections.length} sessions are waiting for a reflection`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.pendingReflections.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setReflecting({
                        id: a.id,
                        title: a.title,
                        durationSeconds: a.durationSeconds,
                        autoFinished: a.autoFinished,
                      })
                    }
                    className="max-w-full truncate rounded-full border bg-card px-3 py-1 text-xs hover:border-amber-500/50"
                  >
                    {a.title}
                    <span className="ml-1.5 text-muted-foreground">{formatDayLabel(a.day)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" asChild aria-label="Previous week">
            <Link href={`/tracker?week=${addDays(data.weekStart, -7)}`} scroll={false}>
              <ChevronLeft />
            </Link>
          </Button>
          <h2 className="min-w-28 text-center text-base font-semibold sm:text-lg">{weekLabel}</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            asChild={!isCurrentWeek}
            disabled={isCurrentWeek}
            aria-label="Next week"
          >
            {isCurrentWeek ? (
              <ChevronRight />
            ) : (
              <Link href={`/tracker?week=${addDays(data.weekStart, 7)}`} scroll={false}>
                <ChevronRight />
              </Link>
            )}
          </Button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-muted-foreground">Week total</span>
          <span className="tabular font-mono text-2xl font-semibold tracking-tight" suppressHydrationWarning>
            {formatDuration(weekSeconds)}
          </span>
        </div>
      </div>

      {data.days.length ? (
        <div className="space-y-4">
          {data.days.map((g) => (
            <DayGroup
              key={g.day}
              group={g}
              today={data.today}
              yesterday={addDays(data.today, -1)}
              timezone={timezone}
              onReflect={setReflecting}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
          <div className="mb-3 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Timer className="size-5" />
          </div>
          <p className="font-medium">
            {isCurrentWeek ? "Nothing finished this week yet" : "No activities this week"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {isCurrentWeek
              ? "Type what you're working on above and press Start. When you finish, write down what you learned."
              : "Try another week."}
          </p>
        </div>
      )}

      <ReflectionDialog target={reflecting} onClose={() => setReflecting(null)} />
    </div>
  );
}
