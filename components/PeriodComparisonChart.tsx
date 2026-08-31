"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAUD } from "@/lib/format";

export type PeriodChartRow = {
  label: string;
  usageKwh: number;
  exportKwh: number;
  current: number;
  target: number;
};

function PeriodTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ payload: PeriodChartRow }>;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md bg-popover px-3 py-2 text-xs shadow-sm ring-1 ring-foreground/10">
      <p className="mb-1.5 font-medium">{label}</p>
      <p>Usage {row.usageKwh.toFixed(2)} kWh · Export {row.exportKwh.toFixed(2)} kWh</p>
      <p className="mt-1">
        Current {formatAUD(row.current)} · Target {formatAUD(row.target)}
      </p>
    </div>
  );
}

type Props = {
  rows: PeriodChartRow[];
  currentLabel: string;
  targetLabel: string;
};

export function PeriodComparisonChart({
  rows,
  currentLabel,
  targetLabel,
}: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatAUD(value)}
            width={72}
          />
          <Tooltip content={<PeriodTooltip />} />
          <Legend />
          <Bar
            dataKey="current"
            name={`${currentLabel} (current)`}
            fill="var(--color-primary)"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="target"
            name={targetLabel}
            fill="var(--color-chart-2)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
