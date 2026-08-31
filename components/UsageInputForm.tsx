"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { UsageProfile } from "@/lib/types";
import { parseNonNegative } from "@/lib/format";
import type { UsageMode } from "@/lib/useSavedState";

type Props = {
  profile: UsageProfile;
  usageMode: UsageMode;
  exportMode: UsageMode;
  onProfileChange: (updater: (profile: UsageProfile) => UsageProfile) => void;
  onUsageModeChange: (mode: UsageMode) => void;
  onExportModeChange: (mode: UsageMode) => void;
};

function NumberField({
  id,
  label,
  hint,
  value,
  onCommit,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number | undefined;
  onCommit: (value: number | undefined) => void;
}) {
  const [raw, setRaw] = useState(value === undefined ? "" : String(value));
  const [error, setError] = useState<string | undefined>();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={raw}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          const next = event.target.value;
          setRaw(next);
          const parsed = parseNonNegative(next);
          setError(parsed.error);
          if (!parsed.error) onCommit(parsed.value);
        }}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function UsageInputForm({
  profile,
  usageMode,
  exportMode,
  onProfileChange,
  onUsageModeChange,
  onExportModeChange,
}: Props) {
  const usageHint = useMemo(
    () =>
      usageMode === "tou"
        ? "Copy peak, shoulder and off-peak kWh from your bill."
        : "Use the single usage total if your bill does not break out time-of-use.",
    [usageMode],
  );

  return (
    <div className="flex flex-col gap-6">
      <NumberField
        id="billing-days"
        label="Billing days"
        hint="Number of days in this bill period."
        value={profile.billingDays || undefined}
        onCommit={(value) =>
          onProfileChange((current) => ({
            ...current,
            billingDays: value ?? 0,
          }))
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Usage</p>
            <p className="text-xs text-muted-foreground">{usageHint}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <Switch
              checked={usageMode === "tou"}
              onCheckedChange={(checked) => {
                const nextMode = checked ? "tou" : "total";
                onUsageModeChange(nextMode);
                onProfileChange((current) => ({
                  ...current,
                  usageKwh:
                    nextMode === "tou"
                      ? {
                          peak: current.usageKwh.peak,
                          shoulder: current.usageKwh.shoulder,
                          offPeak: current.usageKwh.offPeak,
                        }
                      : { total: current.usageKwh.total },
                }));
              }}
            />
            <span>Time-of-use</span>
          </label>
        </div>

        {usageMode === "total" ? (
          <NumberField
            id="usage-total"
            label="Total usage (kWh)"
            value={profile.usageKwh.total}
            onCommit={(value) =>
              onProfileChange((current) => ({
                ...current,
                usageKwh: { total: value },
              }))
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField
              id="usage-peak"
              label="Peak (kWh)"
              value={profile.usageKwh.peak}
              onCommit={(value) =>
                onProfileChange((current) => ({
                  ...current,
                  usageKwh: {
                    ...current.usageKwh,
                    total: undefined,
                    peak: value,
                  },
                }))
              }
            />
            <NumberField
              id="usage-shoulder"
              label="Shoulder (kWh)"
              value={profile.usageKwh.shoulder}
              onCommit={(value) =>
                onProfileChange((current) => ({
                  ...current,
                  usageKwh: {
                    ...current.usageKwh,
                    total: undefined,
                    shoulder: value,
                  },
                }))
              }
            />
            <NumberField
              id="usage-offpeak"
              label="Off-peak (kWh)"
              value={profile.usageKwh.offPeak}
              onCommit={(value) =>
                onProfileChange((current) => ({
                  ...current,
                  usageKwh: {
                    ...current.usageKwh,
                    total: undefined,
                    offPeak: value,
                  },
                }))
              }
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Solar export</p>
            <p className="text-xs text-muted-foreground">
              Leave blank if you do not export to the grid.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total</span>
            <Switch
              checked={exportMode === "tou"}
              onCheckedChange={(checked) => {
                const nextMode = checked ? "tou" : "total";
                onExportModeChange(nextMode);
                onProfileChange((current) => ({
                  ...current,
                  exportKwh:
                    nextMode === "tou"
                      ? {
                          peak: current.exportKwh.peak,
                          offPeak: current.exportKwh.offPeak,
                        }
                      : { total: current.exportKwh.total },
                }));
              }}
            />
            <span>Time-of-use</span>
          </label>
        </div>

        {exportMode === "total" ? (
          <NumberField
            id="export-total"
            label="Total export (kWh)"
            value={profile.exportKwh.total}
            onCommit={(value) =>
              onProfileChange((current) => ({
                ...current,
                exportKwh: { total: value },
              }))
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              id="export-peak"
              label="Peak export (kWh)"
              value={profile.exportKwh.peak}
              onCommit={(value) =>
                onProfileChange((current) => ({
                  ...current,
                  exportKwh: {
                    ...current.exportKwh,
                    total: undefined,
                    peak: value,
                  },
                }))
              }
            />
            <NumberField
              id="export-offpeak"
              label="Off-peak export (kWh)"
              value={profile.exportKwh.offPeak}
              onCommit={(value) =>
                onProfileChange((current) => ({
                  ...current,
                  exportKwh: {
                    ...current.exportKwh,
                    total: undefined,
                    offPeak: value,
                  },
                }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
