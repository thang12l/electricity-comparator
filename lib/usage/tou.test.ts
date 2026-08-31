import { describe, expect, it } from "vitest";
import { bucketBySchedule, profileFromIntervals } from "@/lib/usage/bucket";
import { toHourlyUsage } from "@/lib/usage/hourly";
import type { MeterInterval } from "@/lib/usage/intervals";
import {
  VIC_RESIDENTIAL_EXPORT_TOU_2026,
  VIC_RESIDENTIAL_TOU_2026,
} from "@/lib/usage/vicResidentialTou";
import { calculateBill } from "@/lib/calculateBill";
import { getPresetById } from "@/data/presetPlans";

function interval(
  startTime: string,
  channel: MeterInterval["channel"],
  kwh: number,
  durationMinutes: MeterInterval["durationMinutes"] = 30,
): MeterInterval {
  const start = Date.parse(startTime);
  return {
    startTime,
    endTime: new Date(start + durationMinutes * 60_000).toISOString(),
    durationMinutes,
    channel,
    kwh,
    quality: "billable",
  };
}

describe("bucketBySchedule", () => {
  it("classifies Melbourne summer intervals with AEDT, not NEM UTC+10", () => {
    const intervals = [
      interval("2026-01-15T05:00:00.000Z", "general", 2),
      interval("2026-01-15T04:30:00.000Z", "general", 1),
      interval("2026-01-15T12:00:00.000Z", "general", 3),
    ];
    const { profile } = bucketBySchedule(
      intervals,
      VIC_RESIDENTIAL_TOU_2026,
    );
    expect(profile.usageKwh.peak).toBe(2);
    expect(profile.usageKwh.solarSoak).toBe(1);
    expect(profile.usageKwh.offPeak).toBe(3);
    expect(profile.billingDays).toBe(1);
  });

  it("classifies Melbourne winter intervals with AEST", () => {
    const intervals = [
      interval("2026-07-15T06:00:00.000Z", "general", 2),
      interval("2026-07-15T05:00:00.000Z", "general", 1),
    ];
    const { profile } = bucketBySchedule(
      intervals,
      VIC_RESIDENTIAL_TOU_2026,
    );
    expect(profile.usageKwh.peak).toBe(2);
    expect(profile.usageKwh.solarSoak).toBe(1);
  });

  it("treats an interval starting at 16:00 local as peak, not solar soak", () => {
    const { profile } = bucketBySchedule(
      [interval("2026-07-15T06:00:00.000Z", "general", 0.4, 5)],
      VIC_RESIDENTIAL_TOU_2026,
    );
    expect(profile.usageKwh.peak).toBe(0.4);
    expect(profile.usageKwh.solarSoak).toBe(0);
  });

  it("keeps a 5-minute interval at 15:55 local in solar soak", () => {
    const { profile } = bucketBySchedule(
      [interval("2026-07-15T05:55:00.000Z", "general", 0.1, 5)],
      VIC_RESIDENTIAL_TOU_2026,
    );
    expect(profile.usageKwh.solarSoak).toBe(0.1);
    expect(profile.usageKwh.peak).toBe(0);
  });

  it("splits export from usage and uses absolute feed-in kWh", () => {
    const intervals = [
      interval("2026-07-15T06:00:00.000Z", "general", 1),
      interval("2026-07-15T06:00:00.000Z", "feedIn", -0.8),
      interval("2026-07-15T01:00:00.000Z", "feedIn", -0.5),
    ];
    const { profile } = bucketBySchedule(
      intervals,
      VIC_RESIDENTIAL_TOU_2026,
      VIC_RESIDENTIAL_EXPORT_TOU_2026,
    );
    expect(profile.usageKwh.peak).toBe(1);
    expect(profile.exportKwh.peak).toBe(0.8);
    expect(profile.exportKwh.offPeak).toBe(0.5);
  });

  it("folds controlled load into off-peak and reports the kWh separately", () => {
    const { profile, controlledLoadKwh, warnings } = bucketBySchedule(
      [
        interval("2026-07-15T06:00:00.000Z", "controlledLoad", 4),
        interval("2026-07-15T06:00:00.000Z", "general", 1),
      ],
      VIC_RESIDENTIAL_TOU_2026,
    );
    expect(controlledLoadKwh).toBe(4);
    expect(profile.usageKwh.peak).toBe(1);
    expect(profile.usageKwh.offPeak).toBe(4);
    expect(warnings.some((warning) => warning.bucket === "offPeak")).toBe(true);
  });
});

describe("toHourlyUsage", () => {
  it("rolls 30-minute intervals into local hours without crossing 16:00", () => {
    const hours = toHourlyUsage(
      [
        interval("2026-07-15T05:30:00.000Z", "general", 0.2),
        interval("2026-07-15T06:00:00.000Z", "general", 0.3),
        interval("2026-07-15T06:00:00.000Z", "feedIn", -0.1),
        interval("2026-07-15T12:00:00.000Z", "controlledLoad", 0.4),
      ],
      "Australia/Melbourne",
    );

    expect(hours).toEqual([
      {
        hourStartLocal: "2026-07-15T15:00:00+10:00",
        usageKwh: 0.2,
        exportKwh: 0,
        controlledLoadKwh: 0,
      },
      {
        hourStartLocal: "2026-07-15T16:00:00+10:00",
        usageKwh: 0.3,
        exportKwh: 0.1,
        controlledLoadKwh: 0,
      },
      {
        hourStartLocal: "2026-07-15T22:00:00+10:00",
        usageKwh: 0.4,
        exportKwh: 0,
        controlledLoadKwh: 0.4,
      },
    ]);
  });

  it("uses AEDT offset in summer", () => {
    const hours = toHourlyUsage(
      [interval("2026-01-15T05:00:00.000Z", "general", 1)],
      "Australia/Melbourne",
    );
    expect(hours[0]?.hourStartLocal).toBe("2026-01-15T16:00:00+11:00");
  });
});

describe("profileFromIntervals", () => {
  it("sums flat totals when a plan has no TOU windows", () => {
    const { profile } = profileFromIntervals([
      interval("2026-07-15T06:00:00.000Z", "general", 2),
      interval("2026-07-15T06:00:00.000Z", "controlledLoad", 1),
      interval("2026-07-15T06:00:00.000Z", "feedIn", -0.5),
    ]);
    expect(profile.usageKwh).toEqual({ total: 3 });
    expect(profile.exportKwh).toEqual({ total: 0.5 });
    expect(profile.billingDays).toBe(1);
  });
});

describe("AGL Vic preset with interval usage", () => {
  it("charges solar soak, peak, and off-peak from interval buckets", () => {
    const agl = getPresetById("agl-tou-example");
    expect(agl?.usageTou).toBeDefined();
    const { profile } = bucketBySchedule(
      [
        interval("2026-07-15T06:00:00.000Z", "general", 10),
        interval("2026-07-15T05:00:00.000Z", "general", 20),
        interval("2026-07-15T12:00:00.000Z", "general", 30),
        interval("2026-07-15T06:00:00.000Z", "feedIn", -4),
        interval("2026-07-15T01:00:00.000Z", "feedIn", -6),
      ],
      agl!.usageTou!,
      agl!.exportTou,
    );
    const result = calculateBill(profile, agl!);
    expect(result.usageCharges).toBeCloseTo(
      10 * 0.45386 + 20 * 0.24024 + 30 * 0.06633,
      6,
    );
    expect(result.exportCredits).toBeCloseTo(4 * 0.27 + 6 * 0.02, 6);
    expect(result.warnings).toEqual([]);
  });
});
