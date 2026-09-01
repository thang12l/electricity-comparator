import type { BillResult, ProviderPlan } from "@/lib/types";

export type ChartStackKey =
  | "usageCharges"
  | "dailySupplyCharges"
  | "fees"
  | "exportCredits";

export type ChartStackItem = {
  key: ChartStackKey;
  label: string;
  /**
   * Fill colours are ordered by plan priority:
   *   0 = current/primary plan
   *   1 = first comparison plan
   *   2 = second comparison plan
   */
  fills: [string, string, string];
  negative?: boolean;
};

export type ChartBreakdown = Record<ChartStackKey, number> & {
  billTotal: number;
};

/** Marker colours for bill-total scatter points, one per plan slot. */
export const PLAN_MARKER_COLORS = ["#1e40af", "#5b21b6", "#92400e"] as const;

/** Default bar width when the category band is too narrow to scale up. */
export const CHART_BAR_SIZE = 24;
export const CHART_BAR_GAP = 8;
/** Max bar width for multi-period charts (month view). */
export const CHART_BAR_SIZE_MAX = 56;
/** Max bar width for the single-category bill total chart. */
export const CHART_BAR_SIZE_MAX_SINGLE_CATEGORY = 72;

export function barMarkerOffsetX(
  planIndex: number,
  planCount: number,
  barSize = CHART_BAR_SIZE,
): number {
  return (barSize + CHART_BAR_GAP) * (planIndex - (planCount - 1) / 2);
}

/**
 * Scale bar width to the category band. Week-sized bands stay at the default;
 * sparse month views and the bill-total chart grow toward their caps.
 */
export function resolveChartBarSize(
  layoutBandSize: number,
  planCount: number,
  categoryCount: number,
): number {
  if (layoutBandSize <= 0 || planCount <= 0) return CHART_BAR_SIZE;

  const categoryPadding = layoutBandSize * 0.1;
  const available =
    layoutBandSize -
    2 * categoryPadding -
    (planCount - 1) * CHART_BAR_GAP;
  const natural = Math.floor(available / planCount);
  const maxSize =
    categoryCount === 1
      ? CHART_BAR_SIZE_MAX_SINGLE_CATEGORY
      : CHART_BAR_SIZE_MAX;

  return Math.min(maxSize, Math.max(CHART_BAR_SIZE, natural));
}

/**
 * Scatter cx uses the x-axis band size (often 0 on a point scale). Bar groups are
 * laid out across the category band from tick spacing. Align markers to bar centers.
 */
export function billTotalMarkerCx(
  cx: number,
  planIndex: number,
  planCount: number,
  layoutBandSize: number,
  scatterBandSize: number,
  barSize = CHART_BAR_SIZE,
): number {
  const groupWidth = planCount * barSize + (planCount - 1) * CHART_BAR_GAP;
  const startOffset = Math.round((layoutBandSize - groupWidth) / 2);
  const barCenter =
    startOffset +
    planIndex * barSize +
    planIndex * CHART_BAR_GAP +
    barSize / 2;

  return cx - scatterBandSize / 2 + barCenter;
}

export const CHART_STACK_ITEMS: ChartStackItem[] = [
  {
    key: "usageCharges",
    label: "Usage charges",
    fills: ["#2563eb", "#93c5fd", "#dbeafe"],
  },
  {
    key: "dailySupplyCharges",
    label: "Daily supply",
    fills: ["#e11d48", "#fda4af", "#ffe4e6"], // rose — was slate, now distinct hue
  },
  {
    key: "fees",
    label: "Fees",
    fills: ["#7c3aed", "#c4b5fd", "#ede9fe"],
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

export function chartBreakdownFromResult(
  result: BillResult | undefined,
): ChartBreakdown {
  return {
    usageCharges: result?.usageCharges ?? 0,
    dailySupplyCharges: result?.dailySupplyCharges ?? 0,
    fees: (result?.retailerFees ?? 0) + (result?.oneOffFees ?? 0),
    exportCredits: result?.exportCredits ?? 0,
    billTotal: result?.billTotal ?? 0,
  };
}

export function chartStackValue(
  item: ChartStackItem,
  breakdown: ChartBreakdown,
): number {
  const value = breakdown[item.key] ?? 0;
  return item.negative ? -value : value;
}

export function fillForPlan(item: ChartStackItem, planIndex: number): string {
  const tier = Math.min(planIndex, item.fills.length - 1);
  return item.fills[tier]!;
}

export function markerColorForPlan(planIndex: number): string {
  const tier = Math.min(planIndex, PLAN_MARKER_COLORS.length - 1);
  return PLAN_MARKER_COLORS[tier]!;
}

export function usedChartStackItems(
  rows: Array<{ breakdowns: Record<string, ChartBreakdown> }>,
  planIds: string[],
): ChartStackItem[] {
  return CHART_STACK_ITEMS.filter((item) =>
    rows.some((row) =>
      planIds.some(
        (planId) =>
          Math.abs(
            chartStackValue(item, row.breakdowns[planId] ?? emptyChartBreakdown()),
          ) > 0.0005,
      ),
    ),
  );
}

function emptyChartBreakdown(): ChartBreakdown {
  return {
    usageCharges: 0,
    dailySupplyCharges: 0,
    fees: 0,
    exportCredits: 0,
    billTotal: 0,
  };
}

export function chartStackTotal(
  breakdown: ChartBreakdown,
  items: ChartStackItem[] = CHART_STACK_ITEMS,
): number {
  return items.reduce(
    (sum, item) => sum + chartStackValue(item, breakdown),
    0,
  );
}
