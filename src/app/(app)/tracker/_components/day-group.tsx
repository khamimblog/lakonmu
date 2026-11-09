"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Lightbulb, MoreVertical, Moon, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ActivityView, DayGroup as DayGroupData } from "@/lib/services/activities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatClock, formatDayLabel, formatDuration } from "@/lib/time";
import { continueActivityAction, deleteActivityAction } from "../actions";
import { ProjectBadge } from "./project-picker";
import type { ReflectionTarget } from "./reflection-dialog";

export function DayGroup({
  group,
  today,
  yesterday,
  timezone,
  onReflect,
}: {
  group: DayGroupData;
  today: string;
  yesterday: string;
  timezone: string;
  onReflect: (t: ReflectionTarget) => void;
}) {
  const label =
    group.day === today ? "Today" : group.day === yesterday ? "Yesterday" : formatDayLabel(group.day);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card/60">
      <header className="flex items-center justify-between gap-2 border-b bg-muted/30 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <CalendarDays className="size-4 text-muted-foreground" />
          {label}
          {label !== formatDayLabel(group.day) && (
            <span className="font-normal text-muted-foreground">{formatDayLabel(group.day)}</span>
          )}
        </span>
        <span className="text-muted-foreground">
          Total <span className="tabular ml-1 font-mono font-medium text-foreground">{formatDuration(group.totalSeconds)}</span>
        </span>
      </header>
      <ul className="divide-y">
        {group.entries.map((a) => (
          <EntryRow key={a.id} entry={a} timezone={timezone} onReflect={onReflect} />
        ))}
      </ul>
    </section>
  );
}

function EntryRow({
  entry: a,
  timezone,
  onReflect,
}: {
  entry: ActivityView;
  timezone: string;
  onReflect: (t: ReflectionTarget) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const target: ReflectionTarget = {
    id: a.id,
    title: a.title,
    durationSeconds: a.durationSeconds,
    learning: a.learning,
    autoFinished: a.autoFinished,
  };

  function again() {
    startTransition(async () => {
      const res = await continueActivityAction(a.id);
      if (!res.ok) toast.error(res.error);
      else toast.success(`Tracking “${a.title}” again`);
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteActivityAction(a.id);
      if (!res.ok) toast.error(res.error);
      setConfirmDelete(false);
    });
  }

  return (
    <li className="group px-4 py-3 transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
        {/* Title + project + reflection */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate font-medium">{a.title}</span>
            {a.project && <ProjectBadge project={a.project} />}
            {a.autoFinished && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Moon className="size-3.5 text-muted-foreground" aria-label="Closed at end of day" />
                </TooltipTrigger>
                <TooltipContent>Closed automatically at the end of the day</TooltipContent>
              </Tooltip>
            )}
          </div>
          {a.learning ? (
            <button
              type="button"
              onClick={() => onReflect(target)}
              className="mt-1 flex max-w-full items-start gap-1.5 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              <span className="line-clamp-2 md:line-clamp-1">{a.learning}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReflect(target)}
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="size-3" />
              {a.reflectionStatus === "pending" ? "Add what you learned" : "Add a reflection"}
            </button>
          )}
        </div>

        {/* Time + actions */}
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <span className="tabular text-sm text-muted-foreground">
            {formatClock(a.startedAt, timezone)} – {a.endedAt ? formatClock(a.endedAt, timezone) : "…"}
          </span>
          <div className="flex items-center gap-1">
            <span className="tabular w-[4.75rem] text-right font-mono text-[15px] font-medium">
              {formatDuration(a.durationSeconds)}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={again} disabled={pending} aria-label="Start again">
                  <Play />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start again</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="More actions">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onReflect(target)}>
                  <Pencil /> {a.learning ? "Edit reflection" : "Add reflection"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this activity?</DialogTitle>
            <DialogDescription>
              “{a.title}” and its reflection will be removed. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={remove} disabled={pending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
