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
  stackChartValue,
  usedStackItems,
  type StackBreakdown,
  type StackItem,
} from "@/lib/chart/stack";

export type StackedPairRow = {
  label: string;
  usageKwh?: number;
  exportKwh?: number;
  current: StackBreakdown;
  target: StackBreakdown;
};

function flatten(row: StackedPairRow, items: StackItem[]): Record<string, string | number> {
  const next: Record<string, string | number> = { label: row.label };
  if (row.usageKwh !== undefined) next.usageKwh = row.usageKwh;
  if (row.exportKwh !== undefined) next.exportKwh = row.exportKwh;
  for (const item of items) {
    next[`current_${item.key}`] = stackChartValue(item, row.current);
    next[`target_${item.key}`] = stackChartValue(item, row.target);
  }
  return next;
}

function PairTooltip({
  active,
  label,
  payload,
  currentLabel,
  targetLabel,
  items,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: Record<string, string | number> }>;
  currentLabel: string;
  targetLabel: string;
  items: StackItem[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const usage = row.usageKwh;
  const exported = row.exportKwh;

  function total(prefix: "current" | "target"): number {
    return items.reduce((sum, item) => sum + Number(row[`${prefix}_${item.key}`] ?? 0), 0);
  }

  return (
    <div className="rounded-md bg-popover px-3 py-2 text-xs shadow-sm ring-1 ring-foreground/10">
      <p className="mb-1.5 font-medium">{label}</p>
      {typeof usage === "number" ? (
        <p className="mb-1.5 text-muted-foreground">
          Usage {usage.toFixed(2)} kWh
          {typeof exported === "number" ? ` · Export ${exported.toFixed(2)} kWh` : ""}
        </p>
      ) : null}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5">
        <span />
        <span className="text-muted-foreground">{currentLabel}</span>
        <span className="text-muted-foreground">{targetLabel}</span>
        {items.map((item) => (
          <span key={item.key} className="contents">
            <span>{item.label}</span>
            <span>{formatAUD(Number(row[`current_${item.key}`] ?? 0))}</span>
            <span>{formatAUD(Number(row[`target_${item.key}`] ?? 0))}</span>
          </span>
        ))}
        <span className="font-medium">Total</span>
        <span className="font-medium">{formatAUD(total("current"))}</span>
        <span className="font-medium">{formatAUD(total("target"))}</span>
      </div>
    </div>
  );
}

function PairLegend({
  items,
  currentLabel,
  targetLabel,
}: {
  items: StackItem[];
  currentLabel: string;
  targetLabel: string;
}) {
  return (
    <div className="mt-2 flex flex-col gap-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: item.currentFill }}
            />
            <span
              className="inline-block size-2.5 rounded-sm"
              style={{ background: item.targetFill }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <p>
        Darker / greyer = {currentLabel} (current). Lighter = {targetLabel}.
      </p>
    </div>
  );
}

type Props = {
  rows: StackedPairRow[];
  currentLabel: string;
  targetLabel: string;
  heightClass?: string;
};

export function StackedPairChart({
  rows,
  currentLabel,
  targetLabel,
  heightClass = "h-72",
}: Props) {
  if (rows.length === 0) return null;
  const items = usedStackItems(rows);
  const data = rows.map((row) => flatten(row, items));

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
              content={
                <PairTooltip
                  currentLabel={currentLabel}
                  targetLabel={targetLabel}
                  items={items}
                />
              }
            />
            {items.map((item) => (
              <Bar
                key={`current_${item.key}`}
                dataKey={`current_${item.key}`}
                stackId="current"
                fill={item.currentFill}
              />
            ))}
            {items.map((item) => (
              <Bar
                key={`target_${item.key}`}
                dataKey={`target_${item.key}`}
                stackId="target"
                fill={item.targetFill}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <PairLegend
        items={items}
        currentLabel={currentLabel}
        targetLabel={targetLabel}
      />
    </div>
  );
}
