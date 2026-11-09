"use client";

import { useState, useTransition } from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/time";
import { saveReflectionAction } from "../actions";

export type ReflectionTarget = {
  id: string;
  title: string;
  durationSeconds: number;
  learning?: string | null;
  autoFinished?: boolean;
};

const PROMPTS = [
  "The key thing I learned is…",
  "Something that surprised me…",
  "Next time I would…",
  "A concept I can now explain…",
];

export function ReflectionDialog({
  target,
  onClose,
}: {
  target: ReflectionTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* Remount the form per activity so the textarea resets cleanly. */}
        {target && <ReflectionForm key={target.id} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ReflectionForm({ target, onClose }: { target: ReflectionTarget; onClose: () => void }) {
  const [text, setText] = useState(target.learning ?? "");
  const [pending, startTransition] = useTransition();
  const editing = !!target.learning;

  function submit(learning: string | null) {
    startTransition(async () => {
      const res = await saveReflectionAction(target.id, learning);
      if (!res.ok) return void toast.error(res.error);
      if (learning?.trim()) toast.success("Reflection saved");
      onClose();
    });
  }

  return (
    <>
      <DialogHeader>
        <div className="mb-2 grid size-10 place-items-center rounded-xl bg-amber-400/15 text-amber-500">
          <Lightbulb className="size-5" />
        </div>
        <DialogTitle>{editing ? "Edit reflection" : "What did you learn?"}</DialogTitle>
        <DialogDescription>
          <span className="font-medium text-foreground">{target.title}</span> ·{" "}
          {formatDuration(target.durationSeconds)}
          {target.autoFinished && " · closed automatically at the end of the day"}
        </DialogDescription>
      </DialogHeader>

      <Textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (text.trim()) submit(text);
          }
        }}
        placeholder="Write a few sentences. Future you (and your AI assistant) will search this."
        className="min-h-36 resize-y text-[15px] leading-relaxed"
        maxLength={10_000}
      />

      {!text && (
        <div className="flex flex-wrap gap-1.5">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setText(p + " ")}
              className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <DialogFooter className="gap-2 sm:justify-between">
        <span className="hidden self-center text-xs text-muted-foreground sm:block">
          Ctrl/⌘ + Enter to save
        </span>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {!editing && (
            <Button variant="ghost" disabled={pending} onClick={() => submit(null)}>
              Skip for now
            </Button>
          )}
          <Button disabled={pending || !text.trim()} onClick={() => submit(text)}>
            {pending && <Loader2 className="animate-spin" />}
            Save reflection
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
