"use client";

import { AlertTriangleIcon } from "lucide-react";
import type { PresetPlan, ProviderPlan } from "@/lib/types";
import { formatRate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  presets: PresetPlan[];
  customPlans: ProviderPlan[];
  selectedPlanIds: string[];
  currentPlanId: string | null;
  onTogglePlan: (id: string, selected: boolean) => void;
  onMarkCurrent: (id: string | null) => void;
  onAddCustom: () => void;
  onEditCustom: (plan: ProviderPlan) => void;
  onRemoveCustom: (id: string) => void;
};

function RateSummary({ plan }: { plan: ProviderPlan }) {
  const usage = plan.usageRates;
  const feed = plan.feedInRates;
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
      <dt className="text-muted-foreground">Supply</dt>
      <dd>{formatRate(plan.dailySupplyCharge, "/day")}</dd>
      {usage.flat !== undefined ? (
        <>
          <dt className="text-muted-foreground">Usage</dt>
          <dd>{formatRate(usage.flat, "/kWh")}</dd>
        </>
      ) : null}
      {usage.peak !== undefined ? (
        <>
          <dt className="text-muted-foreground">Peak</dt>
          <dd>{formatRate(usage.peak, "/kWh")}</dd>
        </>
      ) : null}
      {usage.shoulder !== undefined ? (
        <>
          <dt className="text-muted-foreground">Shoulder</dt>
          <dd>{formatRate(usage.shoulder, "/kWh")}</dd>
        </>
      ) : null}
      {usage.offPeak !== undefined ? (
        <>
          <dt className="text-muted-foreground">Off-peak</dt>
          <dd>{formatRate(usage.offPeak, "/kWh")}</dd>
        </>
      ) : null}
      {feed.flat !== undefined ? (
        <>
          <dt className="text-muted-foreground">Feed-in</dt>
          <dd>{formatRate(feed.flat, "/kWh")}</dd>
        </>
      ) : null}
      {feed.peak !== undefined ? (
        <>
          <dt className="text-muted-foreground">Feed-in peak</dt>
          <dd>{formatRate(feed.peak, "/kWh")}</dd>
        </>
      ) : null}
      {feed.offPeak !== undefined ? (
        <>
          <dt className="text-muted-foreground">Feed-in off-peak</dt>
          <dd>{formatRate(feed.offPeak, "/kWh")}</dd>
        </>
      ) : null}
      {plan.retailerFee !== undefined ? (
        <>
          <dt className="text-muted-foreground">Retailer fee</dt>
          <dd>{formatRate(plan.retailerFee, "/day")}</dd>
        </>
      ) : null}
      <dt className="text-muted-foreground">GST</dt>
      <dd>{plan.gstInclusive ? "Included in rates" : "Will be added (10%)"}</dd>
    </dl>
  );
}

function PlanCard({
  plan,
  selected,
  isCurrent,
  isCustom,
  lastUpdated,
  variableRates,
  onToggle,
  onMarkCurrent,
  onEdit,
  onRemove,
}: {
  plan: ProviderPlan;
  selected: boolean;
  isCurrent: boolean;
  isCustom: boolean;
  lastUpdated?: string;
  variableRates?: boolean;
  onToggle: (selected: boolean) => void;
  onMarkCurrent: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  return (
    <Card size="sm" className={selected ? "ring-foreground/20" : "opacity-80"}>
      <CardHeader className="border-b">
        <div className="flex items-start gap-2">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onToggle(checked === true)}
            aria-label={`Compare ${plan.providerName}`}
          />
          <div>
            <CardTitle>
              {plan.providerName}
              {plan.planName ? (
                <span className="block text-sm font-normal text-muted-foreground">
                  {plan.planName}
                </span>
              ) : null}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap gap-1">
              {isCurrent ? <Badge>Current plan</Badge> : null}
              {variableRates ? (
                <Badge variant="outline">Rates vary</Badge>
              ) : null}
              {isCustom ? <Badge variant="secondary">Custom</Badge> : null}
            </CardDescription>
          </div>
        </div>
        <CardAction>
          {isCustom ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="xs" onClick={onEdit}>
                Edit
              </Button>
              <Button variant="ghost" size="xs" onClick={onRemove}>
                Remove
              </Button>
            </div>
          ) : null}
        </CardAction>
      </CardHeader>
      {selected ? (
        <CardContent className="flex flex-col gap-3">
          <RateSummary plan={plan} />
          {lastUpdated ? (
            <p className="text-xs text-muted-foreground">
              Rates last updated {lastUpdated}. Confirm current rates before
              switching.
            </p>
          ) : null}
          {plan.notes ? (
            <p className="flex gap-1.5 text-xs text-muted-foreground">
              <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" />
              {plan.notes}
            </p>
          ) : null}
          <Button
            variant={isCurrent ? "secondary" : "outline"}
            size="sm"
            onClick={onMarkCurrent}
          >
            {isCurrent ? "This is your current plan" : "Mark as current plan"}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function ProviderPicker({
  presets,
  customPlans,
  selectedPlanIds,
  currentPlanId,
  onTogglePlan,
  onMarkCurrent,
  onAddCustom,
  onEditCustom,
  onRemoveCustom,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Select one or more plans to compare.
        </p>
        <Button size="sm" onClick={onAddCustom}>
          Add custom plan
        </Button>
      </div>
      <div className="grid gap-3">
        {presets.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlanIds.includes(plan.id)}
            isCurrent={currentPlanId === plan.id}
            isCustom={false}
            lastUpdated={plan.lastUpdated}
            variableRates={plan.variableRates}
            onToggle={(selected) => onTogglePlan(plan.id, selected)}
            onMarkCurrent={() =>
              onMarkCurrent(currentPlanId === plan.id ? null : plan.id)
            }
          />
        ))}
        {customPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlanIds.includes(plan.id)}
            isCurrent={currentPlanId === plan.id}
            isCustom
            onToggle={(selected) => onTogglePlan(plan.id, selected)}
            onMarkCurrent={() =>
              onMarkCurrent(currentPlanId === plan.id ? null : plan.id)
            }
            onEdit={() => onEditCustom(plan)}
            onRemove={() => onRemoveCustom(plan.id)}
          />
        ))}
      </div>
    </div>
  );
}
