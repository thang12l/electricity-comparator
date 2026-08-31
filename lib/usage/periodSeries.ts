import { calculateBill } from "@/lib/calculateBill";
import type { ProviderPlan } from "@/lib/types";
import { profileForPlan } from "@/lib/usage/bucket";
import type { MeterInterval } from "@/lib/usage/intervals";
import { localClock, type LocalClock } from "@/lib/usage/localTime";

export type PeriodGrain = "week" | "month";

export type PeriodRow = {
  key: string;
  label: string;
  usageKwh: number;
  exportKwh: number;
  costs: Record<string, number>;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function isoWeekFromCalendar(
  year: number,
  month: number,
  day: number,
): { isoYear: number; week: number } {
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { isoYear, week };
}

function mondayOfIsoWeek(isoYear: number, week: number): Date {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7);
  return monday;
}

function formatDay(date: Date): string {
  return `${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]}`;
}

export function periodFromClock(
  clock: LocalClock,
  grain: PeriodGrain,
): { key: string; label: string } {
  if (grain === "month") {
    const monthIndex = Number(clock.month) - 1;
    return {
      key: `${clock.year}-${clock.month}`,
      label: `${MONTH_LABELS[monthIndex]} ${clock.year}`,
    };
  }

  const { isoYear, week } = isoWeekFromCalendar(
    Number(clock.year),
    Number(clock.month),
    Number(clock.day),
  );
  const monday = mondayOfIsoWeek(isoYear, week);
  return {
    key: `${isoYear}-W${String(week).padStart(2, "0")}`,
    label: formatDay(monday),
  };
}

function periodUsage(intervals: MeterInterval[]): {
  usageKwh: number;
  exportKwh: number;
} {
  let usageKwh = 0;
  let exportKwh = 0;
  for (const interval of intervals) {
    if (interval.channel === "feedIn") exportKwh += Math.abs(interval.kwh);
    else usageKwh += interval.kwh;
  }
  return { usageKwh, exportKwh };
}

export function comparePlansByPeriod(
  intervals: MeterInterval[],
  plans: ProviderPlan[],
  grain: PeriodGrain,
  timeZone = "Australia/Melbourne",
): PeriodRow[] {
  const groups = new Map<string, { label: string; intervals: MeterInterval[] }>();

  for (const interval of intervals) {
    const period = periodFromClock(localClock(interval.startTime, timeZone), grain);
    const group = groups.get(period.key) ?? {
      label: period.label,
      intervals: [],
    };
    group.intervals.push(interval);
    groups.set(period.key, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => {
      const costs: Record<string, number> = {};
      for (const plan of plans) {
        const bucketed = profileForPlan(group.intervals, plan, {
          billingDays: 0,
          usageKwh: {},
          exportKwh: {},
        });
        const result = calculateBill(bucketed.profile, {
          ...plan,
          oneOffFees: 0,
        });
        costs[plan.id] = result.billTotal;
      }
      return {
        key,
        label: group.label,
        ...periodUsage(group.intervals),
        costs,
      };
    });
}
