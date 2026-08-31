import type { BillResult, ProviderPlan } from "@/lib/types";

export type StackKey =
  | "usageCharges"
  | "dailySupplyCharges"
  | "retailerFees"
  | "oneOffFees"
  | "gst"
  | "exportCredits";

export type StackItem = {
  key: StackKey;
  label: string;
  currentFill: string;
  targetFill: string;
  negative?: boolean;
};

export type StackBreakdown = Record<StackKey, number>;

export const STACK_ITEMS: StackItem[] = [
  {
    key: "usageCharges",
    label: "Usage charges",
    currentFill: "#3f5f56",
    targetFill: "#a8c4bc",
  },
  {
    key: "dailySupplyCharges",
    label: "Daily supply",
    currentFill: "#4b5563",
    targetFill: "#c5cbd3",
  },
  {
    key: "retailerFees",
    label: "Retailer fees",
    currentFill: "#57534e",
    targetFill: "#d6d0c8",
  },
  {
    key: "oneOffFees",
    label: "One-off fees",
    currentFill: "#564d63",
    targetFill: "#cdc6d8",
  },
  {
    key: "gst",
    label: "GST added",
    currentFill: "#3f4a58",
    targetFill: "#b7c0cb",
  },
  {
    key: "exportCredits",
    label: "Export credits",
    currentFill: "#2f5d4a",
    targetFill: "#9dccb6",
    negative: true,
  },
];

export function comparisonPair(
  plans: ProviderPlan[],
  currentPlanId: string | null,
): { current?: ProviderPlan; target?: ProviderPlan } {
  const current = plans.find((plan) => plan.id === currentPlanId) ?? plans[0];
  const target = plans.find((plan) => plan.id !== current?.id);
  return { current, target };
}

export function breakdownFromResult(result: BillResult | undefined): StackBreakdown {
  return {
    usageCharges: result?.usageCharges ?? 0,
    dailySupplyCharges: result?.dailySupplyCharges ?? 0,
    retailerFees: result?.retailerFees ?? 0,
    oneOffFees: result?.oneOffFees ?? 0,
    gst: result?.gst ?? 0,
    exportCredits: result?.exportCredits ?? 0,
  };
}

export function stackChartValue(item: StackItem, breakdown: StackBreakdown): number {
  const value = breakdown[item.key] ?? 0;
  return item.negative ? -value : value;
}

export function usedStackItems(
  rows: Array<{ current: StackBreakdown; target: StackBreakdown }>,
): StackItem[] {
  return STACK_ITEMS.filter((item) =>
    rows.some(
      (row) =>
        Math.abs(stackChartValue(item, row.current)) > 0.0005 ||
        Math.abs(stackChartValue(item, row.target)) > 0.0005,
    ),
  );
}
