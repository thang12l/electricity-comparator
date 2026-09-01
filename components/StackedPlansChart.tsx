"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  usePlotArea,
  useXAxisScale,
} from "recharts";
import { formatAUD } from "@/lib/format";
import {
  billTotalMarkerCx,
  chartStackValue,
  CHART_BAR_GAP,
  fillForPlan,
  markerColorForPlan,
  resolveChartBarSize,
  usedChartStackItems,
  type ChartBreakdown,
  type ChartPlan,
  type ChartStackItem,
} from "@/lib/chart/stack";

export type StackedPlansRow = {
  label: string;
  usageKwh?: number;
  exportKwh?: number;
  breakdowns: Record<string, ChartBreakdown>;
};

function flatten(
  row: StackedPlansRow,
  plans: ChartPlan[],
  items: ChartStackItem[],
): Record<string, string | number> {
  const next: Record<string, string | number> = { label: row.label };
  if (row.usageKwh !== undefined) next.usageKwh = row.usageKwh;
  if (row.exportKwh !== undefined) next.exportKwh = row.exportKwh;

  for (const plan of plans) {
    const breakdown = row.breakdowns[plan.id] ?? {
      usageCharges: 0,
      dailySupplyCharges: 0,
      fees: 0,
      exportCredits: 0,
      billTotal: 0,
    };
    for (const item of items) {
      next[`${plan.id}_${item.key}`] = chartStackValue(item, breakdown);
    }
    next[`${plan.id}_billTotal`] = breakdown.billTotal;
  }
  return next;
}

function billTotalMarkerShape(
  planIndex: number,
  planCount: number,
  fill: string,
  layoutBandSize: number,
  scatterBandSize: number,
  barSize: number,
) {
  return function Marker(props: { cx?: number; cy?: number }) {
    const { cx = 0, cy = 0 } = props;
    const markerCx =
      layoutBandSize > 0
        ? billTotalMarkerCx(
            cx,
            planIndex,
            planCount,
            layoutBandSize,
            scatterBandSize,
            barSize,
          )
        : cx;
    return (
      <circle
        cx={markerCx}
        cy={cy}
        r={5}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  };
}

function scatterBandSizeFromScale(
  xScale: ReturnType<typeof useXAxisScale>,
  categoryLabel: string,
): number {
  if (!xScale || !categoryLabel) return 0;
  const bandStart = xScale(categoryLabel, { position: "start" });
  const bandMiddle = xScale(categoryLabel, { position: "middle" });
  if (bandStart == null || bandMiddle == null) return 0;
  return (bandMiddle - bandStart) * 2;
}

function StackedPlansChartPlot({
  plans,
  data,
  items,
}: {
  plans: ChartPlan[];
  data: Record<string, string | number>[];
  items: ChartStackItem[];
}) {
  const plotArea = usePlotArea();
  const xScale = useXAxisScale();
  const categoryCount = data.length;
  const layoutBandSize =
    plotArea && categoryCount > 0 ? plotArea.width / categoryCount : 0;
  const barSize = resolveChartBarSize(layoutBandSize, plans.length, categoryCount);
  const scatterBandSize = scatterBandSizeFromScale(
    xScale,
    String(data[0]?.label ?? ""),
  );

  return (
    <>
      {plans.flatMap((plan, planIndex) =>
        items.map((item) => (
          <Bar
            key={`${plan.id}_${item.key}`}
            dataKey={`${plan.id}_${item.key}`}
            stackId={plan.id}
            barSize={barSize}
            fill={fillForPlan(item, planIndex)}
            name={`${item.label} (${plan.label})`}
            legendType="none"
          />
        )),
      )}
      {plans.map((plan, planIndex) => (
        <Scatter
          key={`${plan.id}_billTotal`}
          dataKey={`${plan.id}_billTotal`}
          fill={markerColorForPlan(planIndex)}
          name={`Bill total (${plan.label})`}
          legendType="circle"
          shape={billTotalMarkerShape(
            planIndex,
            plans.length,
            markerColorForPlan(planIndex),
            layoutBandSize,
            scatterBandSize,
            barSize,
          )}
        />
      ))}
    </>
  );
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
  items: ChartStackItem[];
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
        <span className="font-medium">Bill total</span>
        {plans.map((plan) => (
          <span key={`${plan.id}-bill-total`} className="font-medium">
            {formatAUD(Number(row[`${plan.id}_billTotal`] ?? 0))}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlansLegend({
  plans,
  items,
}: {
  plans: ChartPlan[];
  items: ChartStackItem[];
}) {
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
        {plans.map((plan, planIndex) => (
          <span key={`${plan.id}-marker`} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full ring-1 ring-foreground/10"
              style={{ background: markerColorForPlan(planIndex) }}
            />
            Bill total ({plan.label})
          </span>
        ))}
      </div>
      <p>
        Charges stack above zero; export credits stack below. Dots mark the bill
        total (including GST when it applies). GST is not shown as a bar segment.
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
  const items = usedChartStackItems(rows, planIds);
  const data = rows.map((row) => flatten(row, plans, items));

  return (
    <div className="flex w-full flex-col">
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            stackOffset="sign"
            barGap={CHART_BAR_GAP}
            margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => formatAUD(value)}
              width={72}
            />
            <ReferenceLine y={0} stroke="#d4d4d4" />
            <Tooltip content={<PlansTooltip plans={plans} items={items} />} />
            <StackedPlansChartPlot plans={plans} data={data} items={items} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <PlansLegend plans={plans} items={items} />
    </div>
  );
}
