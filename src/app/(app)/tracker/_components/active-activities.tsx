"use client";

import { useTransition } from "react";
import { Loader2, Pause, Play, Square } from "lucide-react";
import { toast } from "sonner";
import type { ActivityView } from "@/lib/services/activities";
import { Button } from "@/components/ui/button";
import { liveSeconds } from "@/hooks/use-now";
import { formatClock, formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { finishActivityAction, pauseActivityAction, resumeActivityAction } from "../actions";
import { ProjectBadge } from "./project-picker";

export function ActiveActivities({
  activities,
  now,
  timezone,
  today,
  onFinished,
}: {
  activities: ActivityView[];
  now: number;
  timezone: string;
  today: string;
  onFinished: (a: { id: string; title: string; durationSeconds: number }) => void;
}) {
  if (!activities.length) return null;
  return (
    <section aria-label="In progress" className="space-y-2">
      {activities.map((a) => (
        <ActiveCard
          key={a.id}
          activity={a}
          now={now}
          timezone={timezone}
          isToday={a.day === today}
          onFinished={onFinished}
        />
      ))}
    </section>
  );
}

function ActiveCard({
  activity: a,
  now,
  timezone,
  isToday,
  onFinished,
}: {
  activity: ActivityView;
  now: number;
  timezone: string;
  isToday: boolean;
  onFinished: (a: { id: string; title: string; durationSeconds: number }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const running = a.status === "running";
  const seconds = liveSeconds(a, now);

  function act(kind: "pause" | "resume" | "finish") {
    startTransition(async () => {
      if (kind === "finish") {
        const res = await finishActivityAction(a.id);
        if (!res.ok) return void toast.error(res.error);
        onFinished(res.data);
        return;
      }
      const res = kind === "pause" ? await pauseActivityAction(a.id) : await resumeActivityAction(a.id);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm sm:p-5",
        running && "border-primary/40",
      )}
    >
      {running && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/12 via-primary/4 to-transparent"
        />
      )}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium",
                running ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", running ? "animate-pulse bg-primary" : "bg-muted-foreground")} />
              {running ? "Running" : "Paused"}
            </span>
            <span>Started {formatClock(a.startedAt, timezone)}</span>
            {!isToday && <span className="text-amber-500">· from {a.day}</span>}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-medium sm:text-lg">{a.title}</h2>
            {a.project && <ProjectBadge project={a.project} />}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span
            className="tabular font-mono text-2xl font-semibold tracking-tight sm:text-3xl"
            suppressHydrationWarning
          >
            {formatDuration(seconds)}
          </span>
          <div className="flex items-center gap-2">
            {running ? (
              <Button variant="secondary" size="lg" disabled={pending} onClick={() => act("pause")} className="h-10 rounded-xl">
                <Pause className="fill-current" /> Pause
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled={pending} onClick={() => act("resume")} className="h-10 rounded-xl">
                <Play className="fill-current" /> Resume
              </Button>
            )}
            <Button size="lg" disabled={pending} onClick={() => act("finish")} className="h-10 rounded-xl">
              {pending ? <Loader2 className="animate-spin" /> : <Square className="fill-current" />} Finish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
