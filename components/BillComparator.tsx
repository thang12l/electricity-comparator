"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ZapIcon } from "lucide-react";
import { UsageInputForm } from "@/components/UsageInputForm";
import { ProviderPicker } from "@/components/ProviderPicker";
import { CustomPlanForm } from "@/components/CustomPlanForm";
import { PeakSplitPrompt } from "@/components/PeakSplitPrompt";
import { ComparisonTable } from "@/components/ComparisonTable";
import {
  calculateBill,
  needsExportPeakSplit,
  needsUsagePeakSplit,
} from "@/lib/calculateBill";
import { useSavedState } from "@/lib/useSavedState";
import { presetPlans } from "@/data/presetPlans";
import type { ProviderPlan } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ComparisonChart = dynamic(
  () =>
    import("@/components/ComparisonChart").then((mod) => mod.ComparisonChart),
  { ssr: false },
);

export function BillComparator() {
  const { state, setState, formKey } = useSavedState();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProviderPlan | undefined>();

  const selectedPlans = useMemo(() => {
    const customById = new Map(state.customPlans.map((plan) => [plan.id, plan]));
    return state.selectedPlanIds
      .map(
        (id) =>
          presetPlans.find((plan) => plan.id === id) ?? customById.get(id),
      )
      .filter((plan): plan is ProviderPlan => Boolean(plan));
  }, [state.customPlans, state.selectedPlanIds]);

  const showUsageSplit = selectedPlans.some((plan) =>
    needsUsagePeakSplit(state.profile, plan),
  );
  const showExportSplit = selectedPlans.some((plan) =>
    needsExportPeakSplit(state.profile, plan),
  );

  const results = useMemo(
    () =>
      selectedPlans.map((plan) =>
        calculateBill(state.profile, plan, {
          usagePeakPercent: state.usagePeakPercent,
          exportPeakPercent: state.exportPeakPercent,
        }),
      ),
    [
      selectedPlans,
      state.exportPeakPercent,
      state.profile,
      state.usagePeakPercent,
    ],
  );

  const readyToCompare = state.profile.billingDays > 0;

  function openCustom(plan?: ProviderPlan) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary">
          <ZapIcon className="size-6" />
          <p className="text-sm font-medium tracking-wide uppercase">
            Electricity bill comparator
          </p>
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Compare what your usage would cost on another plan
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Enter one billing period from your own bill, pick retailer plans, and
          see usage charges, supply, fees, GST, and solar credits side by side.
          Nothing leaves this browser.
        </p>
      </header>

      <Alert>
        <AlertTitle>Confirm current rates before you switch</AlertTitle>
        <AlertDescription>
          Preset figures are examples with a last-updated date. Retailer pricing
          changes, and Amber wholesale rates move throughout the day. Use this
          as a comparison against your bill, not as a switch quote.
        </AlertDescription>
      </Alert>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your usage</CardTitle>
              <CardDescription>
                Copy figures from one bill. Totals and time-of-use splits are
                both supported.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageInputForm
                key={formKey}
                profile={state.profile}
                usageMode={state.usageMode}
                exportMode={state.exportMode}
                onProfileChange={(updater) =>
                  setState((current) => ({
                    ...current,
                    profile: updater(current.profile),
                  }))
                }
                onUsageModeChange={(usageMode) =>
                  setState((current) => ({ ...current, usageMode }))
                }
                onExportModeChange={(exportMode) =>
                  setState((current) => ({ ...current, exportMode }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plans to compare</CardTitle>
              <CardDescription>
                Presets are included so the table is not empty. Add a custom
                plan for any other retailer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderPicker
                presets={presetPlans}
                customPlans={state.customPlans}
                selectedPlanIds={state.selectedPlanIds}
                currentPlanId={state.currentPlanId}
                onTogglePlan={(id, selected) =>
                  setState((current) => ({
                    ...current,
                    selectedPlanIds: selected
                      ? [...current.selectedPlanIds, id]
                      : current.selectedPlanIds.filter((item) => item !== id),
                    currentPlanId:
                      !selected && current.currentPlanId === id
                        ? null
                        : current.currentPlanId,
                  }))
                }
                onMarkCurrent={(id) =>
                  setState((current) => ({ ...current, currentPlanId: id }))
                }
                onAddCustom={() => openCustom()}
                onEditCustom={openCustom}
                onRemoveCustom={(id) =>
                  setState((current) => ({
                    ...current,
                    customPlans: current.customPlans.filter(
                      (plan) => plan.id !== id,
                    ),
                    selectedPlanIds: current.selectedPlanIds.filter(
                      (item) => item !== id,
                    ),
                    currentPlanId:
                      current.currentPlanId === id ? null : current.currentPlanId,
                  }))
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <PeakSplitPrompt
            showUsage={showUsageSplit}
            showExport={showExportSplit}
            usagePeakPercent={state.usagePeakPercent}
            exportPeakPercent={state.exportPeakPercent}
            onUsagePeakPercentChange={(usagePeakPercent) =>
              setState((current) => ({ ...current, usagePeakPercent }))
            }
            onExportPeakPercentChange={(exportPeakPercent) =>
              setState((current) => ({ ...current, exportPeakPercent }))
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>Comparison</CardTitle>
              <CardDescription>
                Bill = usage + daily supply + retailer fees + GST − export
                credits. Export credits are not GST-adjusted.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {!readyToCompare ? (
                <p className="text-sm text-muted-foreground">
                  Enter the number of billing days from your bill to see
                  compared totals.
                </p>
              ) : (
                <>
                  <ComparisonTable
                    plans={selectedPlans}
                    results={results}
                    currentPlanId={state.currentPlanId}
                  />
                  {selectedPlans.length > 0 ? (
                    <div>
                      <h2 className="mb-2 text-sm font-medium">Bill total</h2>
                      <ComparisonChart
                        plans={selectedPlans}
                        results={results}
                        currentPlanId={state.currentPlanId}
                      />
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit custom plan" : "Add custom plan"}
            </DialogTitle>
            <DialogDescription>
              Daily supply charge is required. Leave unused rate fields blank.
              Label whether the rates already include GST.
            </DialogDescription>
          </DialogHeader>
          <CustomPlanForm
            key={editingPlan?.id ?? "new"}
            initial={editingPlan}
            onCancel={() => setDialogOpen(false)}
            onSave={(plan) => {
              setState((current) => {
                const exists = current.customPlans.some((item) => item.id === plan.id);
                return {
                  ...current,
                  customPlans: exists
                    ? current.customPlans.map((item) =>
                        item.id === plan.id ? plan : item,
                      )
                    : [...current.customPlans, plan],
                  selectedPlanIds: current.selectedPlanIds.includes(plan.id)
                    ? current.selectedPlanIds
                    : [...current.selectedPlanIds, plan.id],
                };
              });
              setDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
