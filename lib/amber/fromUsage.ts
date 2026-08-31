import type { AmberUsageInterval } from "@/lib/amber/types";
import type { MeterInterval } from "@/lib/usage/intervals";

export function fromAmberUsage(rows: AmberUsageInterval[]): MeterInterval[] {
  return rows.map((row) => ({
    startTime: row.startTime,
    endTime: row.endTime,
    durationMinutes: row.duration,
    channel: row.channelType,
    kwh: row.kwh,
    quality: row.quality,
  }));
}
