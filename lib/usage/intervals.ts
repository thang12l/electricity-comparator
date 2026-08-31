export type MeterChannel = "general" | "controlledLoad" | "feedIn";

export type MeterInterval = {
  startTime: string;
  endTime: string;
  durationMinutes: 5 | 15 | 30;
  channel: MeterChannel;
  kwh: number;
  quality: "estimated" | "billable";
};

export type HourlyUsage = {
  hourStartLocal: string;
  usageKwh: number;
  exportKwh: number;
  controlledLoadKwh: number;
};
