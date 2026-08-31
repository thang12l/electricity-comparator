import { describe, expect, it } from "vitest";
import {
  breakdownFromResult,
  comparisonPair,
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
  it("picks current then the next selected plan as target even without a mark", () => {
    expect(comparisonPair([amber, agl], null)).toEqual({
      current: amber,
      target: agl,
    });
    expect(comparisonPair([amber, agl], "agl").current?.id).toBe("agl");
    expect(comparisonPair([amber, agl], "agl").target?.id).toBe("amber");
  });

  it("plots export credits below zero and drops unused line items", () => {
    const exportItem = STACK_ITEMS.find((item) => item.key === "exportCredits")!;
    const gstItem = STACK_ITEMS.find((item) => item.key === "gst")!;
    const breakdown = breakdownFromResult(result);
    expect(stackChartValue(exportItem, breakdown)).toBe(-3);
    expect(stackChartValue(gstItem, breakdown)).toBe(0);

    const used = usedStackItems([
      { current: breakdown, target: breakdownFromResult(undefined) },
    ]);
    expect(used.map((item) => item.key)).toEqual([
      "usageCharges",
      "dailySupplyCharges",
      "retailerFees",
      "exportCredits",
    ]);
  });
});
