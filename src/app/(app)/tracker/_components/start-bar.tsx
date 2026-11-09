"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startActivityAction } from "../actions";
import { ProjectPicker, type ProjectOption } from "./project-picker";

export function StartBar({
  projects,
  hasRunning,
}: {
  projects: ProjectOption[];
  hasRunning: boolean;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function start(e?: React.FormEvent) {
    e?.preventDefault();
    const t = title.trim();
    if (!t) {
      inputRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const res = await startActivityAction({ title: t, projectId });
      if (!res.ok) return void toast.error(res.error);
      setTitle("");
      if (hasRunning) toast("Previous activity paused", { description: `Now tracking “${t}”` });
    });
  }

  return (
    <form
      onSubmit={start}
      className="flex items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-sm transition-colors focus-within:border-primary/50"
    >
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What are you working on?"
        maxLength={200}
        aria-label="Activity title"
        className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
      />
      <ProjectPicker projects={projects} value={projectId} onChange={setProjectId} />
      <Button type="submit" size="lg" disabled={pending} className="h-10 gap-2 rounded-xl px-4">
        {pending ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
        <span className="hidden sm:inline">Start</span>
      </Button>
    </form>
  );
}
