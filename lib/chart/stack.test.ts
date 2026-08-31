import { describe, expect, it } from "vitest";
import {
  breakdownFromResult,
  fillForPlan,
  orderedChartPlans,
  stackChartValue,
  usedStackItems,
  STACK_ITEMS,
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
  oneOffFees: 0,
  gst: 0,
  chargesTotal: 17,
  exportCredits: 3,
  billTotal: 14,
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

  it("uses darker fills for earlier plans and caps at the lightest tier", () => {
    const exportItem = STACK_ITEMS.find((item) => item.key === "exportCredits")!;
    expect(fillForPlan(exportItem, 0)).toBe("#2f5d4a");
    expect(fillForPlan(exportItem, 1)).toBe("#9dccb6");
    expect(fillForPlan(exportItem, 2)).toBe("#cce9d8");
    expect(fillForPlan(exportItem, 5)).toBe("#cce9d8");
  });

  it("plots export credits below zero and drops unused line items", () => {
    const exportItem = STACK_ITEMS.find((item) => item.key === "exportCredits")!;
    const gstItem = STACK_ITEMS.find((item) => item.key === "gst")!;
    const breakdown = breakdownFromResult(result);
    expect(stackChartValue(exportItem, breakdown)).toBe(-3);
    expect(stackChartValue(gstItem, breakdown)).toBe(0);

    const used = usedStackItems(
      [{ breakdowns: { amber: breakdown, agl: breakdownFromResult(undefined) } }],
      ["amber", "agl"],
    );
    expect(used.map((item) => item.key)).toEqual([
      "usageCharges",
      "dailySupplyCharges",
      "retailerFees",
      "exportCredits",
    ]);
  });
});
