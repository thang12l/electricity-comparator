import type { MeterInterval } from "@/lib/usage/intervals";

export type AmberUsageResult = {
  siteId: string;
  nmi: string;
  network: string;
  intervals: MeterInterval[];
};

export type AmberConfig = {
  defaultKeyConfigured: boolean;
  defaultKey?: string;
};

export async function fetchAmberConfig(): Promise<AmberConfig> {
  const response = await fetch("/api/amber/config");
  return (await response.json()) as AmberConfig;
}

export async function fetchAmberUsage(
  apiKey?: string,
): Promise<AmberUsageResult> {
  const headers: HeadersInit = {};
  const trimmed = apiKey?.trim();
  if (trimmed) {
    headers.Authorization = `Bearer ${trimmed}`;
  }

  const response = await fetch("/api/amber/usage", {
    method: "POST",
    headers,
  });
  const payload = (await response.json()) as AmberUsageResult & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error ?? "Could not retrieve Amber usage");
  }
  return payload;
}
