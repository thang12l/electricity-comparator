import { describe, expect, it } from "vitest";
import { calculateBill } from "@/lib/calculateBill";
import { getPresetById } from "@/data/presetPlans";
import type { MeterInterval } from "@/lib/usage/intervals";
import { profileForPlan } from "@/lib/usage/bucket";
import {
  comparePlansByPeriod,
  isoWeekFromCalendar,
  periodFromClock,
} from "@/lib/usage/periodSeries";
import { localClock } from "@/lib/usage/localTime";

function interval(
  startTime: string,
  channel: MeterInterval["channel"],
  kwh: number,
): MeterInterval {
  return {
    startTime,
    endTime: new Date(Date.parse(startTime) + 30 * 60_000).toISOString(),
    durationMinutes: 30,
    channel,
    kwh,
    quality: "billable",
  };
}

describe("periodFromClock", () => {
  it("uses ISO weeks and calendar months in Melbourne time", () => {
    expect(isoWeekFromCalendar(2026, 1, 1)).toEqual({ isoYear: 2026, week: 1 });
    const julyEvening = localClock("2026-07-15T06:00:00.000Z", "Australia/Melbourne");
    expect(periodFromClock(julyEvening, "month")).toEqual({
      key: "2026-07",
      label: "Jul 2026",
    });
    expect(periodFromClock(julyEvening, "week").key).toBe("2026-W29");
  });
});

describe("comparePlansByPeriod", () => {
  const amber = getPresetById("amber-wholesale-avg")!;
  const agl = getPresetById("agl-tou-example")!;

  it("splits current vs target cost by week", () => {
    const intervals = [
      interval("2026-07-15T06:00:00.000Z", "general", 10),
      interval("2026-07-20T06:00:00.000Z", "general", 4),
    ];
    const rows = comparePlansByPeriod(intervals, [amber, agl], "week");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.key).toBe("2026-W29");
    expect(rows[1]?.key).toBe("2026-W30");
    expect(rows[0]?.usageKwh).toBe(10);
    expect(rows[1]?.usageKwh).toBe(4);

    const week29 = profileForPlan(
      [intervals[0]!],
      agl,
      { billingDays: 0, usageKwh: {}, exportKwh: {} },
    );
    expect(rows[0]?.costs[agl.id]).toBeCloseTo(
      calculateBill(week29.profile, { ...agl, oneOffFees: 0 }).billTotal,
      6,
    );
    expect(rows[0]?.costs[amber.id]).not.toBe(rows[0]?.costs[agl.id]);
    expect(rows[0]?.breakdowns[agl.id]?.usageCharges).toBeGreaterThan(0);
    expect(rows[0]?.breakdowns[agl.id]?.dailySupplyCharges).toBeGreaterThan(0);
  });

  it("groups separate months", () => {
    const rows = comparePlansByPeriod(
      [
        interval("2026-07-15T06:00:00.000Z", "general", 10),
        interval("2026-08-15T06:00:00.000Z", "general", 3),
      ],
      [amber, agl],
      "month",
    );
    expect(rows.map((row) => row.key)).toEqual(["2026-07", "2026-08"]);
    expect(rows[0]?.label).toBe("Jul 2026");
    expect(rows[1]?.usageKwh).toBe(3);
  });
});
