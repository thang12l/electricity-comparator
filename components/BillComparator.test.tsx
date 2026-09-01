/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAmberUsage,
  readAmberUsage,
} from "@/lib/amber/usageStorage";
import { BillComparator } from "./BillComparator";

vi.mock("@/lib/amber/usageStorage", () => ({
  readAmberUsage: vi.fn().mockResolvedValue(null),
  writeAmberUsage: vi.fn().mockResolvedValue(undefined),
  clearAmberUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/components/PeriodOverTime", () => ({
  PeriodOverTime: () => <div data-testid="period-over-time" />,
}));

vi.mock("@/components/ComparisonChart", () => ({
  ComparisonChart: () => <div data-testid="comparison-chart" />,
}));

const cachedUsage = {
  siteId: "site-1",
  nmi: "3052282872",
  network: "Jemena",
  intervals: [
    {
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2026-01-01T00:30:00.000Z",
      durationMinutes: 30 as const,
      channel: "general" as const,
      kwh: 1,
      quality: "billable" as const,
    },
  ],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.mocked(readAmberUsage).mockReset();
  vi.mocked(readAmberUsage).mockResolvedValue(null);
  vi.mocked(clearAmberUsage).mockClear();
  window.localStorage.clear();
});

function stubConfigFetch() {
  const fetchMock = vi.fn(async (url: string) => {
    if (url === "/api/amber/config") {
      return new Response(JSON.stringify({ defaultKeyConfigured: false }), {
        status: 200,
      });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("BillComparator Amber cache", () => {
  it("restores interval usage from IndexedDB without calling Amber", async () => {
    vi.mocked(readAmberUsage).mockResolvedValue(cachedUsage);
    const fetchMock = stubConfigFetch();

    render(<BillComparator />);

    await waitFor(() => {
      expect(
        screen.getByText(/Using Amber interval data for Jemena · 3052282872/),
      ).toBeTruthy();
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/amber/usage",
      expect.anything(),
    );
  });

  it("clears cached usage when the form is edited", async () => {
    const user = userEvent.setup();
    vi.mocked(readAmberUsage).mockResolvedValue(cachedUsage);
    stubConfigFetch();

    render(<BillComparator />);

    await waitFor(() => {
      expect(screen.getByText(/Using Amber interval data/)).toBeTruthy();
    });

    await user.type(screen.getByLabelText("Billing days"), "31");

    await waitFor(() => {
      expect(screen.queryByText(/Using Amber interval data/)).toBeNull();
    });
    expect(clearAmberUsage).toHaveBeenCalled();
  });
});
