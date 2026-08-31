import type { BillWarning, TouPeriod, TouSchedule, UsageProfile } from "@/lib/types";
import type { MeterInterval } from "@/lib/usage/intervals";
import { inLocalWindow, localClock } from "@/lib/usage/localTime";

export type IntervalBucket = {
  profile: UsageProfile;
  controlledLoadKwh: number;
  warnings: BillWarning[];
};

function classifyPeriod(isoUtc: string, schedule: TouSchedule): TouPeriod {
  const clock = localClock(isoUtc, schedule.timeZone);
  for (const window of schedule.windows) {
    if (!window.days.includes(clock.weekday)) continue;
    if (inLocalWindow(clock.minutesFromMidnight, window.startLocal, window.endLocal)) {
      return window.period;
    }
  }
  return "offPeak";
}

function add(bucket: Record<string, number>, key: string, amount: number) {
  bucket[key] = (bucket[key] ?? 0) + amount;
}

export function bucketBySchedule(
  intervals: MeterInterval[],
  usageTou: TouSchedule,
  exportTou: TouSchedule = usageTou,
): IntervalBucket {
  const usageKwh = {
    peak: 0,
    shoulder: 0,
    solarSoak: 0,
    offPeak: 0,
  };
  const exportKwh = { peak: 0, offPeak: 0 };
  const dates = new Set<string>();
  let controlledLoadKwh = 0;
  const warnings: BillWarning[] = [];

  for (const interval of intervals) {
    const clock = localClock(interval.startTime, usageTou.timeZone);
    dates.add(clock.calendarDate);

    if (interval.channel === "feedIn") {
      const kwh = Math.abs(interval.kwh);
      const period = classifyPeriod(interval.startTime, exportTou);
      if (period === "peak") add(exportKwh, "peak", kwh);
      else add(exportKwh, "offPeak", kwh);
      continue;
    }

    if (interval.channel === "controlledLoad") {
      controlledLoadKwh += interval.kwh;
      usageKwh.offPeak += interval.kwh;
      continue;
    }

    const period = classifyPeriod(interval.startTime, usageTou);
    usageKwh[period] += interval.kwh;
  }

  if (controlledLoadKwh > 0) {
    warnings.push({
      code: "missing_rate_fallback",
      bucket: "offPeak",
      message:
        "Controlled load usage was included in off-peak because interval bucketing does not apply time-of-use windows to controlled load.",
    });
  }

  return {
    profile: {
      billingDays: dates.size,
      usageKwh,
      exportKwh,
    },
    controlledLoadKwh,
    warnings,
  };
}

export function profileFromIntervals(
  intervals: MeterInterval[],
  usageTou?: TouSchedule,
  exportTou?: TouSchedule,
  timeZone = "Australia/Melbourne",
): IntervalBucket {
  if (!usageTou && !exportTou) {
    const dates = new Set<string>();
    let usage = 0;
    let exported = 0;
    let controlledLoadKwh = 0;
    for (const interval of intervals) {
      dates.add(localClock(interval.startTime, timeZone).calendarDate);
      if (interval.channel === "feedIn") {
        exported += Math.abs(interval.kwh);
      } else {
        usage += interval.kwh;
        if (interval.channel === "controlledLoad") {
          controlledLoadKwh += interval.kwh;
        }
      }
    }
    return {
      profile: {
        billingDays: dates.size,
        usageKwh: { total: usage },
        exportKwh: exported ? { total: exported } : {},
      },
      controlledLoadKwh,
      warnings: [],
    };
  }

  const usageSchedule = usageTou ?? exportTou;
  if (!usageSchedule) {
    return {
      profile: { billingDays: 0, usageKwh: {}, exportKwh: {} },
      controlledLoadKwh: 0,
      warnings: [],
    };
  }

  return bucketBySchedule(intervals, usageSchedule, exportTou ?? usageSchedule);
}

export function profileForPlan(
  intervals: MeterInterval[] | null,
  plan: { usageTou?: TouSchedule; exportTou?: TouSchedule },
  fallback: UsageProfile,
): IntervalBucket {
  if (!intervals || intervals.length === 0) {
    return { profile: fallback, controlledLoadKwh: 0, warnings: [] };
  }
  return profileFromIntervals(intervals, plan.usageTou, plan.exportTou);
}
