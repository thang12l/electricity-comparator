import { describe, expect, it } from "vitest";
import { retrieveAmberUsage, AmberApiError } from "@/lib/amber/retrieveUsage";
import type { AmberSite, AmberUsageInterval } from "@/lib/amber/types";

const site: AmberSite = {
  id: "site-1",
  nmi: "3052282872",
  network: "Jemena",
  status: "active",
  intervalLength: 30,
  channels: [{ identifier: "E1", type: "general", tariff: "A100" }],
};

const usageRow: AmberUsageInterval = {
  type: "Usage",
  duration: 30,
  spotPerKwh: 7,
  perKwh: 20,
  date: "2026-08-30",
  nemTime: "2026-08-30T00:30:00+10:00",
  startTime: "2026-08-29T14:00:00Z",
  endTime: "2026-08-29T14:30:00Z",
  renewables: 40,
  channelType: "general",
  channelIdentifier: "E1",
  spikeStatus: "none",
  descriptor: "low",
  kwh: 0.4,
  quality: "billable",
  cost: 8,
};

describe("retrieveAmberUsage", () => {
  it("lists sites then pages usage into meter intervals", async () => {
    const urls: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      urls.push(url);
      if (url.endsWith("/sites")) {
        return new Response(JSON.stringify([site]), { status: 200 });
      }
      if (url.includes("/usage?")) {
        return new Response(JSON.stringify([usageRow]), { status: 200 });
      }
      return new Response("missing", { status: 404 });
    };

    const result = await retrieveAmberUsage("psk_test", {
      fetchImpl,
      now: new Date("2026-08-31T04:00:00.000Z"),
    });

    expect(urls[0]).toBe("https://api.amber.com.au/v1/sites");
    expect(urls.some((url) => url.includes("/sites/site-1/usage?"))).toBe(true);
    expect(result.nmi).toBe("3052282872");
    expect(result.intervals[0]).toMatchObject({
      channel: "general",
      kwh: 0.4,
      startTime: "2026-08-29T14:00:00Z",
    });
    expect(result.intervals.length).toBe(urls.length - 1);
  });

  it("maps a 401 to an invalid-key error", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response("", { status: 401 });
    await expect(retrieveAmberUsage("bad", { fetchImpl })).rejects.toMatchObject(
      {
        name: "AmberApiError",
        status: 401,
        message: "API key is missing or invalid",
      } satisfies Partial<AmberApiError>,
    );
  });

  it("maps a 403 to an invalid-key error", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response("", { status: 403 });
    await expect(retrieveAmberUsage("bad", { fetchImpl })).rejects.toMatchObject(
      {
        name: "AmberApiError",
        status: 403,
        message: "API key is missing or invalid",
      } satisfies Partial<AmberApiError>,
    );
  });
});
