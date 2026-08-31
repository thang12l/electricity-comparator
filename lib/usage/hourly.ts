import type { HourlyUsage, MeterInterval } from "@/lib/usage/intervals";
import { hourStartLocal, localClock } from "@/lib/usage/localTime";

export function toHourlyUsage(
  intervals: MeterInterval[],
  timeZone: string,
): HourlyUsage[] {
  const byHour = new Map<string, HourlyUsage>();

  for (const interval of intervals) {
    const clock = localClock(interval.startTime, timeZone);
    const key = hourStartLocal(clock);
    const current = byHour.get(key) ?? {
      hourStartLocal: key,
      usageKwh: 0,
      exportKwh: 0,
      controlledLoadKwh: 0,
    };

    if (interval.channel === "feedIn") {
      current.exportKwh += Math.abs(interval.kwh);
    } else {
      current.usageKwh += interval.kwh;
      if (interval.channel === "controlledLoad") {
        current.controlledLoadKwh += interval.kwh;
      }
    }

    byHour.set(key, current);
  }

  return [...byHour.values()].sort((a, b) =>
    a.hourStartLocal.localeCompare(b.hourStartLocal),
  );
}
