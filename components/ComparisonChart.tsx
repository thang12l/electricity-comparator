"use client";

import type { BillResult, ProviderPlan } from "@/lib/types";
import {
  breakdownFromResult,
  orderedChartPlans,
} from "@/lib/chart/stack";
import { StackedPlansChart } from "@/components/StackedPlansChart";

type Props = {
  plans: ProviderPlan[];
  results: BillResult[];
  currentPlanId: string | null;
};

export function ComparisonChart({ plans, results, currentPlanId }: Props) {
  const chartPlans = orderedChartPlans(plans, currentPlanId);
  if (chartPlans.length === 0) return null;
  if (chartPlans.length === 1) {
    return (
      <p className="text-sm text-muted-foreground">
        Select another plan to compare stacked bill totals.
      </p>
    );
  }

  const resultByPlan = new Map(results.map((result) => [result.planId, result]));
  const breakdowns = Object.fromEntries(
    chartPlans.map((plan) => [plan.id, breakdownFromResult(resultByPlan.get(plan.id))]),
  );

  return (
    <StackedPlansChart
      heightClass="h-64"
      plans={chartPlans}
      rows={[{ label: "Bill total", breakdowns }]}
    />
  );
}
