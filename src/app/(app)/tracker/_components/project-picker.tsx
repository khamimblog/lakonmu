"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, FolderClosed, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { projectColor } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { createProjectAction } from "../actions";

export type ProjectOption = { id: string; name: string; color: string };

export function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: ProjectOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<ProjectOption[]>([]);

  const all = useMemo(() => {
    const ids = new Set(projects.map((p) => p.id));
    return [...projects, ...created.filter((p) => !ids.has(p.id))];
  }, [projects, created]);
  const selected = all.find((p) => p.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const filtered = q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
  const exact = all.some((p) => p.name.toLowerCase() === q);

  function create() {
    const name = query.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createProjectAction(name);
      if (!res.ok) return void toast.error(res.error);
      setCreated((c) => [...c, res.data]);
      onChange(res.data.id);
      setQuery("");
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {selected ? (
          <button
            type="button"
            className={cn(
              "inline-flex h-8 max-w-40 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium",
              projectColor(selected.color).badge,
            )}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", projectColor(selected.color).dot)} />
            <span className="truncate">{selected.name}</span>
          </button>
        ) : (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Choose project">
            <FolderClosed />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <Input
          autoFocus
          placeholder="Find or create project…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length === 1 && q) {
                onChange(filtered[0].id);
                setOpen(false);
              } else if (!exact) create();
            }
          }}
          className="h-8"
        />
        <ul className="mt-2 max-h-56 overflow-y-auto">
          {value && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
              >
                No project
              </button>
            </li>
          )}
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className={cn("size-2 rounded-full", projectColor(p.color).dot)} />
                <span className="flex-1 truncate text-left">{p.name}</span>
                {p.id === value && <Check className="size-4 text-primary" />}
              </button>
            </li>
          ))}
          {q && !exact && (
            <li>
              <button
                type="button"
                onClick={create}
                disabled={pending}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-accent"
              >
                <Plus className="size-4" />
                <span className="truncate">Create “{query.trim()}”</span>
              </button>
            </li>
          )}
          {!q && all.length === 0 && (
            <li className="px-2 py-3 text-center text-xs text-muted-foreground">
              Type a name to create your first project.
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function ProjectBadge({ project }: { project: ProjectOption }) {
  const c = projectColor(project.color);
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-36 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium",
        c.badge,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", c.dot)} />
      <span className="truncate">{project.name}</span>
    </span>
  );
}
