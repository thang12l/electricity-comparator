"use client";

import { AlertTriangleIcon } from "lucide-react";
import type { BillResult, ProviderPlan } from "@/lib/types";
import { formatAUD } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  plans: ProviderPlan[];
  results: BillResult[];
  currentPlanId: string | null;
};

const rows: Array<{
  key: keyof Pick<
    BillResult,
    | "usageCharges"
    | "dailySupplyCharges"
    | "retailerFees"
    | "oneOffFees"
    | "gst"
    | "chargesTotal"
    | "exportCredits"
  >;
  label: string;
  muted?: boolean;
  negative?: boolean;
}> = [
  { key: "usageCharges", label: "Usage charges" },
  { key: "dailySupplyCharges", label: "Daily supply" },
  { key: "retailerFees", label: "Retailer fees" },
  { key: "oneOffFees", label: "One-off fees" },
  { key: "gst", label: "GST added" },
  { key: "chargesTotal", label: "Charges total", muted: true },
  { key: "exportCredits", label: "Export credits", negative: true },
];

export function ComparisonTable({ plans, results, currentPlanId }: Props) {
  if (plans.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Select at least one plan to compare.
      </p>
    );
  }

  const resultByPlan = new Map(results.map((result) => [result.planId, result]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-40">Line item</TableHead>
          {plans.map((plan) => {
            const result = resultByPlan.get(plan.id);
            const warnings = result?.warnings ?? [];
            const isCurrent = currentPlanId === plan.id;
            return (
              <TableHead
                key={plan.id}
                className={cn(isCurrent && "bg-primary/5")}
              >
                <div className="flex items-center gap-1.5">
                  <span>
                    {plan.providerName}
                    {plan.planName ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {plan.planName}
                      </span>
                    ) : null}
                  </span>
                  {isCurrent ? <Badge variant="secondary">Current</Badge> : null}
                  {warnings.length > 0 ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            className="inline-flex text-amber-600"
                            aria-label="Calculation warnings"
                          >
                            <AlertTriangleIcon className="size-3.5" />
                          </button>
                        }
                      />
                      <TooltipContent>
                        <ul className="list-disc pl-3">
                          {warnings.map((warning) => (
                            <li key={warning.message}>{warning.message}</li>
                          ))}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className={cn(row.muted && "font-medium")}>
              {row.label}
            </TableCell>
            {plans.map((plan) => {
              const result = resultByPlan.get(plan.id);
              const value = result?.[row.key] ?? 0;
              return (
                <TableCell
                  key={plan.id}
                  className={cn(
                    "tabular-nums",
                    currentPlanId === plan.id && "bg-primary/5",
                    row.muted && "font-medium",
                  )}
                >
                  {row.negative && value !== 0
                    ? `−${formatAUD(value)}`
                    : formatAUD(value)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Bill total</TableCell>
          {plans.map((plan) => {
            const result = resultByPlan.get(plan.id);
            return (
              <TableCell
                key={plan.id}
                className={cn(
                  "text-base font-semibold tabular-nums",
                  currentPlanId === plan.id && "bg-primary/5",
                )}
              >
                {formatAUD(result?.billTotal ?? 0)}
              </TableCell>
            );
          })}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
