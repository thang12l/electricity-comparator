"use client";

import { useMemo, useState } from "react";
import type { ProviderPlan } from "@/lib/types";
import type { MeterInterval } from "@/lib/usage/intervals";
import {
  comparePlansByPeriod,
  type PeriodGrain,
} from "@/lib/usage/periodSeries";
import { orderedChartPlans } from "@/lib/chart/stack";
import { StackedPlansChart } from "@/components/StackedPlansChart";
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
  const chartPlans = orderedChartPlans(plans, currentPlanId);

  const rows = useMemo(() => {
    if (!intervals || intervals.length === 0 || chartPlans.length < 2) return [];
    return comparePlansByPeriod(
      intervals,
      plans.filter((plan) => chartPlans.some((entry) => entry.id === plan.id)),
      grain,
    ).map((row) => ({
      label: row.label,
      usageKwh: row.usageKwh,
      exportKwh: row.exportKwh,
      breakdowns: row.breakdowns,
    }));
  }, [chartPlans, grain, intervals, plans]);

  const planSummary = chartPlans
    .map((plan) => `${plan.label}${plan.isCurrent ? " (current)" : ""}`)
    .join(" · ");

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
          Load usage from Amber to compare selected plan costs by week or month.
        </p>
      ) : chartPlans.length < 2 ? (
        <p className="text-sm text-muted-foreground">
          Select at least two plans to compare over time.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{planSummary}</p>
          <StackedPlansChart
            plans={chartPlans}
            rows={rows}
            heightClass="h-80"
          />
        </>
      )}
    </div>
  );
}
