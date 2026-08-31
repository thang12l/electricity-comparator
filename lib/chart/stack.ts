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
  fills: [string, string, string];
  negative?: boolean;
};

export type StackBreakdown = Record<StackKey, number>;

export const STACK_ITEMS: StackItem[] = [
  {
    key: "usageCharges",
    label: "Usage charges",
    fills: ["#3f5f56", "#a8c4bc", "#d8ebe4"],
  },
  {
    key: "dailySupplyCharges",
    label: "Daily supply",
    fills: ["#4b5563", "#c5cbd3", "#e8ebef"],
  },
  {
    key: "retailerFees",
    label: "Retailer fees",
    fills: ["#57534e", "#d6d0c8", "#efeae4"],
  },
  {
    key: "oneOffFees",
    label: "One-off fees",
    fills: ["#564d63", "#cdc6d8", "#ebe6f0"],
  },
  {
    key: "gst",
    label: "GST added",
    fills: ["#3f4a58", "#b7c0cb", "#e2e7ed"],
  },
  {
    key: "exportCredits",
    label: "Export credits",
    fills: ["#2f5d4a", "#9dccb6", "#cce9d8"],
    negative: true,
  },
];

export type ChartPlan = {
  id: string;
  label: string;
  isCurrent: boolean;
};

export function orderedChartPlans(
  plans: ProviderPlan[],
  currentPlanId: string | null,
): ChartPlan[] {
  const current = plans.find((plan) => plan.id === currentPlanId);
  const rest = plans.filter((plan) => plan.id !== currentPlanId);
  const ordered = current ? [current, ...rest] : plans;
  return ordered.map((plan) => ({
    id: plan.id,
    label: plan.providerName,
    isCurrent: plan.id === currentPlanId,
  }));
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

export function fillForPlan(item: StackItem, planIndex: number): string {
  const tier = Math.min(planIndex, item.fills.length - 1);
  return item.fills[tier]!;
}

export function usedStackItems(
  rows: Array<{ breakdowns: Record<string, StackBreakdown> }>,
  planIds: string[],
): StackItem[] {
  return STACK_ITEMS.filter((item) =>
    rows.some((row) =>
      planIds.some(
        (planId) =>
          Math.abs(stackChartValue(item, row.breakdowns[planId] ?? emptyBreakdown())) >
          0.0005,
      ),
    ),
  );
}

function emptyBreakdown(): StackBreakdown {
  return {
    usageCharges: 0,
    dailySupplyCharges: 0,
    retailerFees: 0,
    oneOffFees: 0,
    gst: 0,
    exportCredits: 0,
  };
}

export function stackTotal(
  breakdown: StackBreakdown,
  items: StackItem[],
): number {
  return items.reduce((sum, item) => sum + stackChartValue(item, breakdown), 0);
}
