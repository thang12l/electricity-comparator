import { describe, expect, it } from "vitest";
import {
  barMarkerOffsetX,
  billTotalMarkerCx,
  chartBreakdownFromResult,
  chartStackTotal,
  chartStackValue,
  CHART_BAR_GAP,
  CHART_BAR_SIZE,
  CHART_STACK_ITEMS,
  fillForPlan,
  markerColorForPlan,
  orderedChartPlans,
  resolveChartBarSize,
  usedChartStackItems,
} from "@/lib/chart/stack";
import type { BillResult, ProviderPlan } from "@/lib/types";

const amber: ProviderPlan = {
  id: "amber",
  providerName: "Amber",
  dailySupplyCharge: 1,
  usageRates: { flat: 0.2 },
  feedInRates: {},
  gstInclusive: true,
};

const agl: ProviderPlan = {
  id: "agl",
  providerName: "AGL",
  dailySupplyCharge: 1,
  usageRates: { flat: 0.2 },
  feedInRates: {},
  gstInclusive: true,
};

const origin: ProviderPlan = {
  id: "origin",
  providerName: "Origin",
  dailySupplyCharge: 1,
  usageRates: { flat: 0.2 },
  feedInRates: {},
  gstInclusive: true,
};

const result: BillResult = {
  planId: "amber",
  usageCharges: 10,
  dailySupplyCharges: 5,
  retailerFees: 2,
  oneOffFees: 1,
  gst: 0,
  chargesTotal: 18,
  exportCredits: 3,
  billTotal: 15,
  warnings: [],
};

describe("chart stack helpers", () => {
  it("orders current plan first then the rest for chart colors", () => {
    expect(orderedChartPlans([amber, agl, origin], null)).toEqual([
      { id: "amber", label: "Amber", isCurrent: false },
      { id: "agl", label: "AGL", isCurrent: false },
      { id: "origin", label: "Origin", isCurrent: false },
    ]);
    expect(orderedChartPlans([amber, agl, origin], "agl")).toEqual([
      { id: "agl", label: "AGL", isCurrent: true },
      { id: "amber", label: "Amber", isCurrent: false },
      { id: "origin", label: "Origin", isCurrent: false },
    ]);
  });

  it("combines retailer and one-off fees and omits gst from chart breakdown", () => {
    const breakdown = chartBreakdownFromResult(result);
    expect(breakdown.fees).toBe(3);
    expect(breakdown.billTotal).toBe(15);
    expect("gst" in breakdown).toBe(false);
  });

  it("plots export credits below zero and drops unused line items", () => {
    const exportItem = CHART_STACK_ITEMS.find((item) => item.key === "exportCredits")!;
    const breakdown = chartBreakdownFromResult(result);
    expect(chartStackValue(exportItem, breakdown)).toBe(-3);

    const used = usedChartStackItems(
      [
        {
          breakdowns: {
            amber: breakdown,
            agl: chartBreakdownFromResult(undefined),
          },
        },
      ],
      ["amber", "agl"],
    );
    expect(used.map((item) => item.key)).toEqual([
      "usageCharges",
      "dailySupplyCharges",
      "fees",
      "exportCredits",
    ]);
  });

  it("totals stacked chart values excluding gst", () => {
    const breakdown = chartBreakdownFromResult(result);
    expect(chartStackTotal(breakdown)).toBe(15);
  });

  it("centers bill-total markers on grouped bars", () => {
    expect(barMarkerOffsetX(0, 2)).toBe(-16);
    expect(barMarkerOffsetX(1, 2)).toBe(16);
    expect(barMarkerOffsetX(1, 3)).toBe(0);
  });

  it("aligns bill-total markers when scatter and layout band sizes differ", () => {
    const layoutBandSize = 85;
    const scatterBandSize = 0;
    const cx = 100;
    const startOffset = Math.round((layoutBandSize - 56) / 2);

    expect(
      billTotalMarkerCx(cx, 0, 2, layoutBandSize, scatterBandSize),
    ).toBe(cx + startOffset + CHART_BAR_SIZE / 2);
    expect(
      billTotalMarkerCx(cx, 1, 2, layoutBandSize, scatterBandSize),
    ).toBe(
      cx + startOffset + CHART_BAR_SIZE + CHART_BAR_GAP + CHART_BAR_SIZE / 2,
    );
  });

  it("keeps symmetric offsets when scatter uses the full category band", () => {
    const bandSize = 72;
    const cx = 200;

    expect(billTotalMarkerCx(cx, 0, 2, bandSize, bandSize)).toBe(cx - 16);
    expect(billTotalMarkerCx(cx, 1, 2, bandSize, bandSize)).toBe(cx + 16);
  });

  it("scales bar width up for sparse categories and caps at category-specific limits", () => {
    expect(resolveChartBarSize(85, 2, 8)).toBe(30);
    expect(resolveChartBarSize(200, 2, 3)).toBe(56);
    expect(resolveChartBarSize(600, 2, 1)).toBe(72);
    expect(resolveChartBarSize(40, 2, 8)).toBe(24);
  });

  it("uses darker fills and markers for earlier plans", () => {
    const exportItem = CHART_STACK_ITEMS.find((item) => item.key === "exportCredits")!;
    expect(fillForPlan(exportItem, 0)).toBe("#2f5d4a");
    expect(fillForPlan(exportItem, 2)).toBe("#cce9d8");
    expect(markerColorForPlan(0)).toBe("#1e40af");
    expect(markerColorForPlan(2)).toBe("#92400e");
  });
});
