import type { AmberSite, AmberUsageInterval } from "@/lib/amber/types";
import { fromAmberUsage } from "@/lib/amber/fromUsage";
import { usageDateWindows } from "@/lib/amber/dateWindows";
import type { MeterInterval } from "@/lib/usage/intervals";

const AMBER_API = "https://api.amber.com.au/v1";

export class AmberApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AmberApiError";
  }
}

export type AmberUsageResult = {
  siteId: string;
  nmi: string;
  network: string;
  intervals: MeterInterval[];
};

type FetchLike = typeof fetch;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function amberGet(
  path: string,
  apiKey: string,
  fetchImpl: FetchLike,
): Promise<Response> {
  const url = `${AMBER_API}${path}`;
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: "application/json" };
  let response = await fetchImpl(url, { headers });
  if (response.status === 429) {
    const reset = Number(response.headers.get("RateLimit-Reset"));
    await sleep((Number.isFinite(reset) ? Math.min(reset, 30) : 2) * 1000);
    response = await fetchImpl(url, { headers });
  }
  return response;
}

async function readError(response: Response, fallback: string): Promise<string> {
  if (response.status === 401) return "API key is missing or invalid";
  if (response.status === 404) return "Site not found";
  if (response.status === 422) return "Requested date range is greater than 7 days";
  return fallback;
}

function isUsageRow(value: unknown): value is AmberUsageInterval {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.type === "Usage" &&
    typeof row.startTime === "string" &&
    typeof row.endTime === "string" &&
    typeof row.kwh === "number" &&
    (row.channelType === "general" ||
      row.channelType === "controlledLoad" ||
      row.channelType === "feedIn") &&
    (row.quality === "estimated" || row.quality === "billable")
  );
}

function pickSite(sites: AmberSite[]): AmberSite {
  const active = sites.find((site) => site.status === "active");
  const site = active ?? sites[0];
  if (!site) {
    throw new AmberApiError("No sites linked to this Amber account", 404);
  }
  return site;
}

export async function retrieveAmberUsage(
  apiKey: string,
  options: { fetchImpl?: FetchLike; now?: Date } = {},
): Promise<AmberUsageResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const key = apiKey.trim();
  if (!key) {
    throw new AmberApiError("API key is required", 400);
  }

  const sitesResponse = await amberGet("/sites", key, fetchImpl);
  if (!sitesResponse.ok) {
    throw new AmberApiError(
      await readError(sitesResponse, "Could not list Amber sites"),
      sitesResponse.status,
    );
  }
  const sites = (await sitesResponse.json()) as AmberSite[];
  if (!Array.isArray(sites)) {
    throw new AmberApiError("Unexpected sites response from Amber", 500);
  }
  const site = pickSite(sites);

  const rows: AmberUsageInterval[] = [];
  for (const window of usageDateWindows(options.now)) {
    const path = `/sites/${encodeURIComponent(site.id)}/usage?startDate=${window.startDate}&endDate=${window.endDate}`;
    const usageResponse = await amberGet(path, key, fetchImpl);
    if (!usageResponse.ok) {
      throw new AmberApiError(
        await readError(usageResponse, "Could not fetch Amber usage"),
        usageResponse.status,
      );
    }
    const payload = (await usageResponse.json()) as unknown;
    if (!Array.isArray(payload)) {
      throw new AmberApiError("Unexpected usage response from Amber", 500);
    }
    for (const item of payload) {
      if (isUsageRow(item)) rows.push(item);
    }
  }

  return {
    siteId: site.id,
    nmi: site.nmi,
    network: site.network,
    intervals: fromAmberUsage(rows),
  };
}
