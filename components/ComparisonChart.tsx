"use client";

import type { BillResult, ProviderPlan } from "@/lib/types";
import { breakdownFromResult, comparisonPair } from "@/lib/chart/stack";
import { StackedPairChart } from "@/components/StackedPairChart";

type Props = {
  plans: ProviderPlan[];
  results: BillResult[];
  currentPlanId: string | null;
};

export function ComparisonChart({ plans, results, currentPlanId }: Props) {
  const { current, target } = comparisonPair(plans, currentPlanId);
  if (!current) return null;
  if (!target) {
    return (
      <p className="text-sm text-muted-foreground">
        Select another plan to compare as a stacked pair.
      </p>
    );
  }

  const resultByPlan = new Map(results.map((result) => [result.planId, result]));

  return (
    <StackedPairChart
      heightClass="h-64"
      currentLabel={current.providerName}
      targetLabel={target.providerName}
      rows={[
        {
          label: "Bill total",
          current: breakdownFromResult(resultByPlan.get(current.id)),
          target: breakdownFromResult(resultByPlan.get(target.id)),
        },
      ]}
    />
  );
}
