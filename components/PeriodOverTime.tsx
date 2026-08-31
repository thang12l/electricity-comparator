"use client";

import { useMemo, useState } from "react";
import type { ProviderPlan } from "@/lib/types";
import type { MeterInterval } from "@/lib/usage/intervals";
import {
  comparePlansByPeriod,
  type PeriodGrain,
} from "@/lib/usage/periodSeries";
import { comparisonPair } from "@/lib/chart/stack";
import { StackedPairChart } from "@/components/StackedPairChart";
import { Button } from "@/components/ui/button";

export function PeriodOverTime({
  intervals,
  plans,
  currentPlanId,
}: {
  intervals: MeterInterval[] | null;
  plans: ProviderPlan[];
  currentPlanId: string | null;
}) {
  const [grain, setGrain] = useState<PeriodGrain>("week");
  const { current, target } = comparisonPair(plans, currentPlanId);

  const rows = useMemo(() => {
    if (!intervals || intervals.length === 0 || !current || !target) return [];
    return comparePlansByPeriod(intervals, [current, target], grain).map(
      (row) => ({
        label: row.label,
        usageKwh: row.usageKwh,
        exportKwh: row.exportKwh,
        current: row.breakdowns[current.id]!,
        target: row.breakdowns[target.id]!,
      }),
    );
  }, [current, grain, intervals, target]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Over time</h2>
        <div className="flex gap-1" role="group" aria-label="Time grouping">
          <Button
            type="button"
            size="xs"
            variant={grain === "week" ? "default" : "outline"}
            aria-pressed={grain === "week"}
            onClick={() => setGrain("week")}
          >
            Week
          </Button>
          <Button
            type="button"
            size="xs"
            variant={grain === "month" ? "default" : "outline"}
            aria-pressed={grain === "month"}
            onClick={() => setGrain("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {!intervals || intervals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Load usage from Amber to compare current and target plan costs by week
          or month.
        </p>
      ) : !current || !target ? (
        <p className="text-sm text-muted-foreground">
          Select a current plan and one other plan to compare over time.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {current.providerName} (current) vs {target.providerName}
            {currentPlanId
              ? ""
              : ". Mark a current plan to choose which side is current."}
          </p>
          <StackedPairChart
            rows={rows}
            currentLabel={current.providerName}
            targetLabel={target.providerName}
            heightClass="h-80"
          />
        </>
      )}
    </div>
  );
}
