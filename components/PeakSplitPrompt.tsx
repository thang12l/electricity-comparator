"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Field } from "@base-ui/react/field";

type Props = {
  showUsage: boolean;
  showExport: boolean;
  usagePeakPercent: number;
  exportPeakPercent: number;
  onUsagePeakPercentChange: (value: number) => void;
  onExportPeakPercentChange: (value: number) => void;
};

function SplitControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-1.5">
          <Field.Root>
            <Input
              id={id}
              type="text"
              inputMode="numeric"
              className="w-16"
              value={String(value)}
              onChange={(event) => {
                const n = Number(event.target.value);
                if (!Number.isFinite(n)) return;
                onChange(Math.min(100, Math.max(0, n)));
              }}
            />
          </Field.Root>
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={(next) => {
          const n = Array.isArray(next) ? next[0] : next;
          onChange(typeof n === "number" ? n : 0);
        }}
      />
      <p className="text-xs text-muted-foreground">
        Remaining {100 - value}% is treated as off-peak. Peak, shoulder and
        off-peak splits are not inferred from a single total.
      </p>
    </div>
  );
}

export function PeakSplitPrompt({
  showUsage,
  showExport,
  usagePeakPercent,
  exportPeakPercent,
  onUsagePeakPercentChange,
  onExportPeakPercentChange,
}: Props) {
  if (!showUsage && !showExport) return null;

  return (
    <Alert>
      <AlertTitle>Peak-hour assumption needed</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          A selected time-of-use plan has separate peak and off-peak rates, but
          this bill only has a total. We will not guess a split. Set the share
          that happened during peak hours — the comparison updates as you
          adjust it. This assumption significantly affects the result.
        </p>
        <div className="flex flex-col gap-4">
          {showUsage ? (
            <SplitControl
              id="usage-peak-split"
              label="What % of usage happened during peak hours?"
              value={usagePeakPercent}
              onChange={onUsagePeakPercentChange}
            />
          ) : null}
          {showExport ? (
            <SplitControl
              id="export-peak-split"
              label="What % of solar export happened during peak hours?"
              value={exportPeakPercent}
              onChange={onExportPeakPercentChange}
            />
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}
