"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAUD } from "@/lib/format";
import {
  fillForPlan,
  stackChartValue,
  usedStackItems,
  type ChartPlan,
  type StackBreakdown,
  type StackItem,
} from "@/lib/chart/stack";

export type StackedPlansRow = {
  label: string;
  usageKwh?: number;
  exportKwh?: number;
  breakdowns: Record<string, StackBreakdown>;
};

function flatten(
  row: StackedPlansRow,
  plans: ChartPlan[],
  items: StackItem[],
): Record<string, string | number> {
  const next: Record<string, string | number> = { label: row.label };
  if (row.usageKwh !== undefined) next.usageKwh = row.usageKwh;
  if (row.exportKwh !== undefined) next.exportKwh = row.exportKwh;
  for (const plan of plans) {
    const breakdown = row.breakdowns[plan.id] ?? {};
    for (const item of items) {
      next[`${plan.id}_${item.key}`] = stackChartValue(item, breakdown);
    }
  }
  return next;
}

function PlansTooltip({
  active,
  label,
  payload,
  plans,
  items,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: Record<string, string | number> }>;
  plans: ChartPlan[];
  items: StackItem[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const usage = row.usageKwh;
  const exported = row.exportKwh;

  return (
    <div className="max-w-sm rounded-md bg-popover px-3 py-2 text-xs shadow-sm ring-1 ring-foreground/10">
      <p className="mb-1.5 font-medium">{label}</p>
      {typeof usage === "number" ? (
        <p className="mb-1.5 text-muted-foreground">
          Usage {usage.toFixed(2)} kWh
          {typeof exported === "number" ? ` · Export ${exported.toFixed(2)} kWh` : ""}
        </p>
      ) : null}
      <div
        className="grid gap-x-3 gap-y-0.5"
        style={{
          gridTemplateColumns: `auto repeat(${plans.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {plans.map((plan) => (
          <span key={plan.id} className="text-muted-foreground">
            {plan.label}
            {plan.isCurrent ? " (current)" : ""}
          </span>
        ))}
        {items.map((item) => (
          <span key={item.key} className="contents">
            <span>{item.label}</span>
            {plans.map((plan) => (
              <span key={`${plan.id}-${item.key}`}>
                {formatAUD(Number(row[`${plan.id}_${item.key}`] ?? 0))}
              </span>
            ))}
          </span>
        ))}
        <span className="font-medium">Total</span>
        {plans.map((plan) => (
          <span key={`${plan.id}-total`} className="font-medium">
            {formatAUD(
              items.reduce(
                (sum, item) => sum + Number(row[`${plan.id}_${item.key}`] ?? 0),
                0,
              ),
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlansLegend({ plans, items }: { plans: ChartPlan[]; items: StackItem[] }) {
  return (
    <div className="mt-2 flex flex-col gap-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            {plans.map((plan, planIndex) => (
              <span
                key={`${plan.id}-${item.key}`}
                className="inline-block size-2.5 rounded-sm"
                style={{ background: fillForPlan(item, planIndex) }}
                title={plan.label}
              />
            ))}
            {item.label}
          </span>
        ))}
      </div>
      <p>
        Each period shows one stacked bar per selected plan. Darker fills are the
        current plan; lighter fills are comparisons.
      </p>
    </div>
  );
}

type Props = {
  plans: ChartPlan[];
  rows: StackedPlansRow[];
  heightClass?: string;
};

export function StackedPlansChart({ plans, rows, heightClass = "h-72" }: Props) {
  if (rows.length === 0 || plans.length === 0) return null;
  const planIds = plans.map((plan) => plan.id);
  const items = usedStackItems(rows, planIds);
  const data = rows.map((row) => flatten(row, plans, items));

  return (
    <div className="flex w-full flex-col">
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatAUD(value)}
              width={72}
            />
            <ReferenceLine y={0} stroke="#d4d4d4" />
            <Tooltip
              content={<PlansTooltip plans={plans} items={items} />}
            />
            {plans.flatMap((plan, planIndex) =>
              items.map((item) => (
                <Bar
                  key={`${plan.id}_${item.key}`}
                  dataKey={`${plan.id}_${item.key}`}
                  stackId={plan.id}
                  fill={fillForPlan(item, planIndex)}
                  name={`${item.label} (${plan.label})`}
                  legendType="none"
                />
              )),
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <PlansLegend plans={plans} items={items} />
    </div>
  );
}
