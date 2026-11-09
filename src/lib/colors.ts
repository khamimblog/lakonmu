/** Project badge colors. Class names are written out in full so Tailwind picks them up. */
export const PROJECT_COLORS = {
  indigo: { dot: "bg-indigo-400", badge: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
  violet: { dot: "bg-violet-400", badge: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  sky: { dot: "bg-sky-400", badge: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  emerald: { dot: "bg-emerald-400", badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  amber: { dot: "bg-amber-400", badge: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  rose: { dot: "bg-rose-400", badge: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  slate: { dot: "bg-slate-400", badge: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300" },
} as const;

export type ProjectColor = keyof typeof PROJECT_COLORS;
export const PROJECT_COLOR_KEYS = Object.keys(PROJECT_COLORS) as ProjectColor[];

export function projectColor(color: string | null | undefined) {
  return PROJECT_COLORS[(color ?? "indigo") as ProjectColor] ?? PROJECT_COLORS.indigo;
}
