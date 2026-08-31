/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PeriodOverTime } from "./PeriodOverTime";
import { presetPlans } from "@/data/presetPlans";
import type { MeterInterval } from "@/lib/usage/intervals";

afterEach(() => {
  cleanup();
});

function interval(startTime: string, kwh: number): MeterInterval {
  return {
    startTime,
    endTime: new Date(Date.parse(startTime) + 30 * 60_000).toISOString(),
    durationMinutes: 30,
    channel: "general",
    kwh,
    quality: "billable",
  };
}

describe("PeriodOverTime", () => {
  it("toggles week and month while comparing current and target plans", async () => {
    const user = userEvent.setup();
    render(
      <PeriodOverTime
        intervals={[
          interval("2026-07-15T06:00:00.000Z", 10),
          interval("2026-08-15T06:00:00.000Z", 3),
        ]}
        plans={presetPlans}
        currentPlanId="amber-wholesale-avg"
      />,
    );

    expect(screen.getByText(/Amber \(current\)/)).toBeTruthy();
    expect(screen.getByText(/AGL/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/Amber \(current\)/)).toBeTruthy();
    expect(screen.getByText(/AGL/)).toBeTruthy();
  });

  it("asks for Amber usage when intervals are missing", () => {
    render(
      <PeriodOverTime
        intervals={null}
        plans={presetPlans}
        currentPlanId="amber-wholesale-avg"
      />,
    );
    expect(
      screen.getByText(/Load usage from Amber to compare selected plan costs/),
    ).toBeTruthy();
  });
});
