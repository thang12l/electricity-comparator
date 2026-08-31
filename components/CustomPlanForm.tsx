"use client";

import { useState } from "react";
import type { ProviderPlan } from "@/lib/types";
import { parseNonNegative } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  initial?: ProviderPlan;
  onSave: (plan: ProviderPlan) => void;
  onCancel: () => void;
};

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        aria-invalid={Boolean(error)}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function toRaw(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

export function CustomPlanForm({ initial, onSave, onCancel }: Props) {
  const [providerName, setProviderName] = useState(initial?.providerName ?? "");
  const [planName, setPlanName] = useState(initial?.planName ?? "");
  const [dailySupplyCharge, setDailySupplyCharge] = useState(
    toRaw(initial?.dailySupplyCharge),
  );
  const [flat, setFlat] = useState(toRaw(initial?.usageRates.flat));
  const [peak, setPeak] = useState(toRaw(initial?.usageRates.peak));
  const [shoulder, setShoulder] = useState(toRaw(initial?.usageRates.shoulder));
  const [offPeak, setOffPeak] = useState(toRaw(initial?.usageRates.offPeak));
  const [feedFlat, setFeedFlat] = useState(toRaw(initial?.feedInRates.flat));
  const [feedPeak, setFeedPeak] = useState(toRaw(initial?.feedInRates.peak));
  const [feedOffPeak, setFeedOffPeak] = useState(
    toRaw(initial?.feedInRates.offPeak),
  );
  const [retailerFee, setRetailerFee] = useState(toRaw(initial?.retailerFee));
  const [oneOffFees, setOneOffFees] = useState(toRaw(initial?.oneOffFees));
  const [gstInclusive, setGstInclusive] = useState(initial?.gstInclusive ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function parseOptional(raw: string, key: string): number | undefined {
    const parsed = parseNonNegative(raw);
    if (parsed.error) {
      setErrors((current) => ({ ...current, [key]: parsed.error! }));
      return undefined;
    }
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    return parsed.value;
  }

  function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (!providerName.trim()) nextErrors.providerName = "Provider name is required";

    const supply = parseNonNegative(dailySupplyCharge);
    if (dailySupplyCharge.trim() === "") {
      nextErrors.dailySupplyCharge = "Daily supply charge is required";
    } else if (supply.error) {
      nextErrors.dailySupplyCharge = supply.error;
    }

    const fields: Array<[string, string]> = [
      ["flat", flat],
      ["peak", peak],
      ["shoulder", shoulder],
      ["offPeak", offPeak],
      ["feedFlat", feedFlat],
      ["feedPeak", feedPeak],
      ["feedOffPeak", feedOffPeak],
      ["retailerFee", retailerFee],
      ["oneOffFees", oneOffFees],
    ];
    for (const [key, raw] of fields) {
      const parsed = parseNonNegative(raw);
      if (parsed.error) nextErrors[key] = parsed.error;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      id: initial?.id ?? `custom-${crypto.randomUUID()}`,
      providerName: providerName.trim(),
      planName: planName.trim() || undefined,
      dailySupplyCharge: supply.value ?? 0,
      usageRates: {
        flat: parseOptional(flat, "flat"),
        peak: parseOptional(peak, "peak"),
        shoulder: parseOptional(shoulder, "shoulder"),
        offPeak: parseOptional(offPeak, "offPeak"),
      },
      feedInRates: {
        flat: parseOptional(feedFlat, "feedFlat"),
        peak: parseOptional(feedPeak, "feedPeak"),
        offPeak: parseOptional(feedOffPeak, "feedOffPeak"),
      },
      retailerFee: parseOptional(retailerFee, "retailerFee"),
      oneOffFees: parseOptional(oneOffFees, "oneOffFees"),
      gstInclusive,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="provider-name">
            Provider name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="provider-name"
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            placeholder="Origin, EnergyAustralia, …"
            aria-invalid={Boolean(errors.providerName)}
          />
          {errors.providerName ? (
            <p className="text-xs text-destructive">{errors.providerName}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plan-name">Plan name</Label>
          <Input
            id="plan-name"
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <Field
        id="daily-supply"
        label="Daily supply charge ($/day, excl. extra GST if toggle is off)"
        required
        value={dailySupplyCharge}
        onChange={setDailySupplyCharge}
        error={errors.dailySupplyCharge}
        hint="Required. Enter 0 if the plan has no supply charge."
      />

      <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">GST on rates</p>
          <p className="text-xs text-muted-foreground">
            {gstInclusive
              ? "Rates already include 10% GST. The calculator will not add GST again."
              : "Rates exclude GST. The calculator will add 10% GST on usage, supply, and fees."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={gstInclusive}
            onCheckedChange={setGstInclusive}
          />
          <span>GST included</span>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="usage-flat"
          label="Flat usage ($/kWh)"
          value={flat}
          onChange={setFlat}
          error={errors.flat}
          hint="Use this if the plan is not time-of-use."
        />
        <Field
          id="usage-peak-rate"
          label="Peak usage ($/kWh)"
          value={peak}
          onChange={setPeak}
          error={errors.peak}
        />
        <Field
          id="usage-shoulder-rate"
          label="Shoulder usage ($/kWh)"
          value={shoulder}
          onChange={setShoulder}
          error={errors.shoulder}
        />
        <Field
          id="usage-offpeak-rate"
          label="Off-peak usage ($/kWh)"
          value={offPeak}
          onChange={setOffPeak}
          error={errors.offPeak}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="feed-flat"
          label="Flat feed-in ($/kWh)"
          value={feedFlat}
          onChange={setFeedFlat}
          error={errors.feedFlat}
        />
        <Field
          id="feed-peak"
          label="Peak feed-in ($/kWh)"
          value={feedPeak}
          onChange={setFeedPeak}
          error={errors.feedPeak}
        />
        <Field
          id="feed-offpeak"
          label="Off-peak feed-in ($/kWh)"
          value={feedOffPeak}
          onChange={setFeedOffPeak}
          error={errors.feedOffPeak}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="retailer-fee"
          label="Retailer fee ($/day)"
          value={retailerFee}
          onChange={setRetailerFee}
          error={errors.retailerFee}
          hint="e.g. Amber membership, if itemised separately."
        />
        <Field
          id="one-off-fees"
          label="One-off fees ($ per bill)"
          value={oneOffFees}
          onChange={setOneOffFees}
          error={errors.oneOffFees}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plan-notes">Notes</Label>
        <Input
          id="plan-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="e.g. referral discount not included"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save plan" : "Add plan"}</Button>
      </div>
    </form>
  );
}
