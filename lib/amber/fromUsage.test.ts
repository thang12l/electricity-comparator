import { describe, expect, it } from "vitest";
import { fromAmberUsage } from "@/lib/amber/fromUsage";
import type { AmberUsageInterval } from "@/lib/amber/types";

const amberFixture: AmberUsageInterval[] = [
  {
    type: "Usage",
    duration: 5,
    date: "2025-07-14",
    endTime: "2025-07-13T14:05:00Z",
    quality: "billable",
    kwh: 0.025,
    nemTime: "2025-07-14T00:05:00+10:00",
    perKwh: 19.04971,
    channelType: "general",
    channelIdentifier: "E1",
    cost: 0.4762,
    renewables: 26.29,
    spotPerKwh: 7.1379,
    startTime: "2025-07-13T14:00:01Z",
    spikeStatus: "none",
    tariffInformation: { demandWindow: false },
    descriptor: "veryLow",
  },
  {
    type: "Usage",
    duration: 30,
    date: "2025-07-14",
    endTime: "2025-07-14T04:00:00Z",
    quality: "estimated",
    kwh: -1.2,
    nemTime: "2025-07-14T14:00:00+10:00",
    perKwh: 2.1,
    channelType: "feedIn",
    channelIdentifier: "B1",
    cost: -2.52,
    renewables: 80,
    spotPerKwh: 1.0,
    startTime: "2025-07-14T03:30:00Z",
    spikeStatus: "none",
    descriptor: "extremelyLow",
  },
];

describe("fromAmberUsage", () => {
  it("keeps timestamps, channel, signed kWh, and quality", () => {
    const intervals = fromAmberUsage(amberFixture);
    expect(intervals).toEqual([
      {
        startTime: "2025-07-13T14:00:01Z",
        endTime: "2025-07-13T14:05:00Z",
        durationMinutes: 5,
        channel: "general",
        kwh: 0.025,
        quality: "billable",
      },
      {
        startTime: "2025-07-14T03:30:00Z",
        endTime: "2025-07-14T04:00:00Z",
        durationMinutes: 30,
        channel: "feedIn",
        kwh: -1.2,
        quality: "estimated",
      },
    ]);
  });
});
