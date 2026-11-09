"use client";

import { useEffect, useState } from "react";

/** Current epoch ms, re-rendering every `intervalMs` while `active` is true. */
export function useNow(active: boolean, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

export function liveSeconds(
  a: { durationSeconds: number; runningSince: number | null },
  now: number,
) {
  return a.durationSeconds + (a.runningSince ? Math.max(0, (now - a.runningSince) / 1000) : 0);
}
