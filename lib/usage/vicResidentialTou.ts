import type { TouSchedule, TouWeekday } from "@/lib/types";

export const EVERY_DAY: TouWeekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const VIC_RESIDENTIAL_TOU_2026: TouSchedule = {
  timeZone: "Australia/Melbourne",
  windows: [
    {
      period: "solarSoak",
      days: EVERY_DAY,
      startLocal: "11:00",
      endLocal: "16:00",
    },
    {
      period: "peak",
      days: EVERY_DAY,
      startLocal: "16:00",
      endLocal: "21:00",
    },
  ],
};

export const VIC_RESIDENTIAL_EXPORT_TOU_2026: TouSchedule = {
  timeZone: "Australia/Melbourne",
  windows: [
    {
      period: "peak",
      days: EVERY_DAY,
      startLocal: "16:00",
      endLocal: "21:00",
    },
  ],
};
