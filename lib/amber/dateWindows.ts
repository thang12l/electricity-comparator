export const AMBER_USAGE_MAX_DAYS = 90;
export const AMBER_USAGE_WINDOW_DAYS = 7;

const NEM_OFFSET_MS = 10 * 60 * 60 * 1000;

export function nemCalendarDate(utc: Date): string {
  return new Date(utc.getTime() + NEM_OFFSET_MS).toISOString().slice(0, 10);
}

export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function minIsoDate(a: string, b: string): string {
  return a <= b ? a : b;
}

export type DateWindow = {
  startDate: string;
  endDate: string;
};

export function usageDateWindows(now: Date = new Date()): DateWindow[] {
  const endDate = addIsoDays(nemCalendarDate(now), -1);
  const startDate = addIsoDays(endDate, -(AMBER_USAGE_MAX_DAYS - 1));
  const windows: DateWindow[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    const windowEnd = minIsoDate(
      addIsoDays(cursor, AMBER_USAGE_WINDOW_DAYS - 1),
      endDate,
    );
    windows.push({ startDate: cursor, endDate: windowEnd });
    cursor = addIsoDays(windowEnd, 1);
  }
  return windows;
}
