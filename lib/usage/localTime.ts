import type { TouWeekday } from "@/lib/types";

const WEEKDAY_FROM_SHORT: Record<string, TouWeekday> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

export type LocalClock = {
  weekday: TouWeekday;
  year: string;
  month: string;
  day: string;
  hour: number;
  minute: number;
  minutesFromMidnight: number;
  offset: string;
  calendarDate: string;
};

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((entry) => entry.type === type)?.value ?? "";
}

function offsetFromGmt(label: string): string {
  const match = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return "+00:00";
  const hour = match[2].padStart(2, "0");
  const minute = (match[3] ?? "00").padStart(2, "0");
  return `${match[1]}${hour}:${minute}`;
}

export function localClock(isoUtc: string, timeZone: string): LocalClock {
  const date = new Date(isoUtc);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(date);

  let hour = Number(part(parts, "hour"));
  if (hour === 24) hour = 0;
  const minute = Number(part(parts, "minute"));
  const weekday = WEEKDAY_FROM_SHORT[part(parts, "weekday")];
  if (!weekday) {
    throw new Error(`Could not read weekday from ${isoUtc} in ${timeZone}`);
  }

  const year = part(parts, "year");
  const month = part(parts, "month");
  const day = part(parts, "day");

  return {
    weekday,
    year,
    month,
    day,
    hour,
    minute,
    minutesFromMidnight: hour * 60 + minute,
    offset: offsetFromGmt(part(parts, "timeZoneName")),
    calendarDate: `${year}-${month}-${day}`,
  };
}

export function hourStartLocal(clock: LocalClock): string {
  const hour = String(clock.hour).padStart(2, "0");
  return `${clock.calendarDate}T${hour}:00:00${clock.offset}`;
}

export function parseHm(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function inLocalWindow(
  minutesFromMidnight: number,
  startLocal: string,
  endLocal: string,
): boolean {
  const start = parseHm(startLocal);
  const end = parseHm(endLocal);
  if (start === end) return false;
  if (start < end) {
    return minutesFromMidnight >= start && minutesFromMidnight < end;
  }
  return minutesFromMidnight >= start || minutesFromMidnight < end;
}
