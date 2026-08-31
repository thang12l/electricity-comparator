import { describe, expect, it } from "vitest";
import {
  addIsoDays,
  nemCalendarDate,
  usageDateWindows,
} from "@/lib/amber/dateWindows";

describe("usageDateWindows", () => {
  it("uses NEM yesterday and 7-day inclusive windows up to 90 days", () => {
    const now = new Date("2026-08-31T04:00:00.000Z");
    expect(nemCalendarDate(now)).toBe("2026-08-31");
    const windows = usageDateWindows(now);
    expect(windows[0]).toEqual({
      startDate: addIsoDays("2026-08-30", -89),
      endDate: addIsoDays(addIsoDays("2026-08-30", -89), 6),
    });
    expect(windows.at(-1)?.endDate).toBe("2026-08-30");
    expect(
      windows.every((window) => {
        const start = Date.parse(`${window.startDate}T00:00:00Z`);
        const end = Date.parse(`${window.endDate}T00:00:00Z`);
        return (end - start) / 86_400_000 <= 6;
      }),
    ).toBe(true);
  });
});
