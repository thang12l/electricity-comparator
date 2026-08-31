"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BillResult, ProviderPlan } from "@/lib/types";
import { formatAUD } from "@/lib/format";

type Props = {
  plans: ProviderPlan[];
  results: BillResult[];
  currentPlanId: string | null;
};

export function ComparisonChart({ plans, results, currentPlanId }: Props) {
  if (plans.length === 0) return null;

  const data = plans.map((plan) => {
    const result = results.find((item) => item.planId === plan.id);
    return {
      name: plan.providerName,
      total: result?.billTotal ?? 0,
      current: plan.id === currentPlanId,
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatAUD(value)}
            width={72}
          />
          <Tooltip
            formatter={(value) => formatAUD(Number(value ?? 0))}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={
                  entry.current
                    ? "var(--color-primary)"
                    : "var(--color-muted-foreground)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
