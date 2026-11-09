import { describe, expect, test } from "bun:test";
import { addDays, dayKey, endOfDayMs, formatDuration, startOfDayMs, weekStart } from "../src/lib/time";

describe("time helpers", () => {
  test("dayKey respects timezone", () => {
    const ms = Date.UTC(2026, 10, 8, 20, 0); // 2026-11-08 20:00Z
    expect(dayKey(ms, "UTC")).toBe("2026-11-08");
    expect(dayKey(ms, "Asia/Jakarta")).toBe("2026-11-09"); // UTC+7
    expect(dayKey(ms, "America/Los_Angeles")).toBe("2026-11-08");
  });

  test("start/end of day in a fixed-offset zone", () => {
    expect(startOfDayMs("2026-11-09", "Asia/Jakarta")).toBe(Date.UTC(2026, 10, 8, 17, 0));
    expect(endOfDayMs("2026-11-09", "Asia/Jakarta")).toBe(Date.UTC(2026, 10, 9, 17, 0) - 1);
  });

  test("end of day across a DST change (US fall back, 25h day)", () => {
    const start = startOfDayMs("2026-11-01", "America/New_York");
    const end = endOfDayMs("2026-11-01", "America/New_York");
    expect(start).toBe(Date.UTC(2026, 10, 1, 4, 0)); // EDT, UTC-4
    expect(end + 1).toBe(Date.UTC(2026, 10, 2, 5, 0)); // EST, UTC-5
    expect((end + 1 - start) / 3_600_000).toBe(25);
  });

  test("weekStart is Monday", () => {
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // Sunday → previous Monday
    expect(weekStart("2026-11-02")).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("formatDuration", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(3661)).toBe("01:01:01");
    expect(formatDuration(40 * 3600 + 45 * 60 + 11)).toBe("40:45:11");
  });
});
