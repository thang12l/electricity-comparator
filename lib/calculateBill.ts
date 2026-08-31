import type {
  BillResult,
  BillWarning,
  PeakSplitAssumptions,
  ProviderPlan,
  UsageProfile,
} from "./types";

const GST_RATE = 0.1;

function isDefined(n: number | undefined): n is number {
  return n !== undefined && n !== null && Number.isFinite(n);
}

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function hasTouUsage(usage: UsageProfile["usageKwh"]): boolean {
  return (
    isDefined(usage.peak) ||
    isDefined(usage.shoulder) ||
    isDefined(usage.solarSoak) ||
    isDefined(usage.offPeak)
  );
}

function hasTouExport(exportKwh: UsageProfile["exportKwh"]): boolean {
  return isDefined(exportKwh.peak) || isDefined(exportKwh.offPeak);
}

function hasTouUsageRates(rates: ProviderPlan["usageRates"]): boolean {
  return (
    isDefined(rates.peak) ||
    isDefined(rates.shoulder) ||
    isDefined(rates.solarSoak) ||
    isDefined(rates.offPeak)
  );
}

function hasTouFeedInRates(rates: ProviderPlan["feedInRates"]): boolean {
  return isDefined(rates.peak) || isDefined(rates.offPeak);
}

function sumTouUsage(usage: UsageProfile["usageKwh"]): number {
  return (
    (usage.peak ?? 0) +
    (usage.shoulder ?? 0) +
    (usage.solarSoak ?? 0) +
    (usage.offPeak ?? 0)
  );
}

function sumTouExport(exportKwh: UsageProfile["exportKwh"]): number {
  return (exportKwh.peak ?? 0) + (exportKwh.offPeak ?? 0);
}

export function needsUsagePeakSplit(
  profile: UsageProfile,
  plan: ProviderPlan,
): boolean {
  const profileIsFlatOnly =
    isDefined(profile.usageKwh.total) && !hasTouUsage(profile.usageKwh);
  const planIsTouOnly =
    hasTouUsageRates(plan.usageRates) && !isDefined(plan.usageRates.flat);
  return profileIsFlatOnly && planIsTouOnly;
}

export function needsExportPeakSplit(
  profile: UsageProfile,
  plan: ProviderPlan,
): boolean {
  const profileIsFlatOnly =
    isDefined(profile.exportKwh.total) && !hasTouExport(profile.exportKwh);
  const planIsTouOnly =
    hasTouFeedInRates(plan.feedInRates) && !isDefined(plan.feedInRates.flat);
  return profileIsFlatOnly && planIsTouOnly;
}

function chargeTouUsage(
  usage: {
    peak?: number;
    shoulder?: number;
    solarSoak?: number;
    offPeak?: number;
  },
  rates: ProviderPlan["usageRates"],
  warnings: BillWarning[],
): number {
  let total = 0;

  const applyBucket = (
    kwh: number | undefined,
    rate: number | undefined,
    bucket: "peak" | "shoulder" | "solarSoak" | "offPeak",
    label: string,
  ) => {
    if (!isDefined(kwh) || kwh === 0) return;
    if (isDefined(rate)) {
      total += kwh * rate;
      return;
    }
    if (bucket !== "offPeak" && isDefined(rates.offPeak)) {
      total += kwh * rates.offPeak;
      warnings.push({
        code: "missing_rate_fallback",
        bucket,
        message: `${label} usage was billed at the off-peak rate because this plan has no ${label.toLowerCase()} rate.`,
      });
      return;
    }
    if (isDefined(rates.flat)) {
      total += kwh * rates.flat;
      warnings.push({
        code: "missing_rate_fallback",
        bucket,
        message: `${label} usage was billed at the flat rate because a matching TOU rate is missing.`,
      });
    }
  };

  applyBucket(usage.peak, rates.peak, "peak", "Peak");
  applyBucket(usage.shoulder, rates.shoulder, "shoulder", "Shoulder");
  if (isDefined(usage.solarSoak) && usage.solarSoak !== 0) {
    if (isDefined(rates.solarSoak)) {
      total += usage.solarSoak * rates.solarSoak;
    } else if (isDefined(rates.shoulder)) {
      total += usage.solarSoak * rates.shoulder;
      warnings.push({
        code: "missing_rate_fallback",
        bucket: "solarSoak",
        message:
          "Solar soak usage was billed at the shoulder rate because this plan has no solar soak rate.",
      });
    } else {
      applyBucket(usage.solarSoak, undefined, "solarSoak", "Solar soak");
    }
  }
  applyBucket(usage.offPeak, rates.offPeak, "offPeak", "Off-peak");
  return total;
}

function creditTouExport(
  exportKwh: { peak?: number; offPeak?: number },
  rates: ProviderPlan["feedInRates"],
  warnings: BillWarning[],
): number {
  let total = 0;

  const applyBucket = (
    kwh: number | undefined,
    rate: number | undefined,
    bucket: "exportPeak" | "exportOffPeak",
    label: string,
  ) => {
    if (!isDefined(kwh) || kwh === 0) return;
    if (isDefined(rate)) {
      total += kwh * rate;
      return;
    }
    if (bucket !== "exportOffPeak" && isDefined(rates.offPeak)) {
      total += kwh * rates.offPeak;
      warnings.push({
        code: "missing_rate_fallback",
        bucket,
        message: `${label} export was credited at the off-peak feed-in rate because this plan has no ${label.toLowerCase()} feed-in rate.`,
      });
      return;
    }
    if (isDefined(rates.flat)) {
      total += kwh * rates.flat;
      warnings.push({
        code: "missing_rate_fallback",
        bucket,
        message: `${label} export was credited at the flat feed-in rate because a matching TOU rate is missing.`,
      });
    }
  };

  applyBucket(exportKwh.peak, rates.peak, "exportPeak", "Peak");
  applyBucket(exportKwh.offPeak, rates.offPeak, "exportOffPeak", "Off-peak");
  return total;
}

function usageCharges(
  profile: UsageProfile,
  plan: ProviderPlan,
  usagePeakPercent: number,
  warnings: BillWarning[],
): number {
  const { usageKwh } = profile;
  const rates = plan.usageRates;

  if (hasTouUsage(usageKwh) && hasTouUsageRates(rates)) {
    return chargeTouUsage(usageKwh, rates, warnings);
  }

  if (hasTouUsage(usageKwh) && isDefined(rates.flat)) {
    return sumTouUsage(usageKwh) * rates.flat;
  }

  if (isDefined(usageKwh.total) && isDefined(rates.flat) && !hasTouUsageRates(rates)) {
    return usageKwh.total * rates.flat;
  }

  if (needsUsagePeakSplit(profile, plan) && isDefined(usageKwh.total)) {
    const peakShare = clampPercent(usagePeakPercent) / 100;
    const peakKwh = usageKwh.total * peakShare;
    const remainder = usageKwh.total - peakKwh;
    warnings.push({
      code: "peak_split_assumption",
      message: `Usage compared using an assumed ${clampPercent(usagePeakPercent)}% peak split. This assumption significantly affects the result.`,
    });
    return chargeTouUsage({ peak: peakKwh, offPeak: remainder }, rates, warnings);
  }

  if (isDefined(usageKwh.total) && isDefined(rates.flat)) {
    return usageKwh.total * rates.flat;
  }

  return 0;
}

function exportCredits(
  profile: UsageProfile,
  plan: ProviderPlan,
  exportPeakPercent: number,
  warnings: BillWarning[],
): number {
  const { exportKwh } = profile;
  const rates = plan.feedInRates;

  if (hasTouExport(exportKwh) && hasTouFeedInRates(rates)) {
    return creditTouExport(exportKwh, rates, warnings);
  }

  if (hasTouExport(exportKwh) && isDefined(rates.flat)) {
    return sumTouExport(exportKwh) * rates.flat;
  }

  if (isDefined(exportKwh.total) && isDefined(rates.flat) && !hasTouFeedInRates(rates)) {
    return exportKwh.total * rates.flat;
  }

  if (needsExportPeakSplit(profile, plan) && isDefined(exportKwh.total)) {
    const peakShare = clampPercent(exportPeakPercent) / 100;
    const peakKwh = exportKwh.total * peakShare;
    const remainder = exportKwh.total - peakKwh;
    warnings.push({
      code: "peak_split_assumption",
      message: `Export compared using an assumed ${clampPercent(exportPeakPercent)}% peak split. This assumption significantly affects the result.`,
    });
    return creditTouExport({ peak: peakKwh, offPeak: remainder }, rates, warnings);
  }

  if (isDefined(exportKwh.total) && isDefined(rates.flat)) {
    return exportKwh.total * rates.flat;
  }

  return 0;
}

export function calculateBill(
  profile: UsageProfile,
  plan: ProviderPlan,
  assumptions: PeakSplitAssumptions = {
    usagePeakPercent: 0,
    exportPeakPercent: 0,
  },
): BillResult {
  const warnings: BillWarning[] = [];
  const usage = usageCharges(
    profile,
    plan,
    assumptions.usagePeakPercent,
    warnings,
  );
  const dailySupplyCharges = plan.dailySupplyCharge * (profile.billingDays || 0);
  const retailerFees = (plan.retailerFee ?? 0) * (profile.billingDays || 0);
  const oneOffFees = plan.oneOffFees ?? 0;
  const taxable = usage + dailySupplyCharges + retailerFees + oneOffFees;
  const gst = plan.gstInclusive ? 0 : taxable * GST_RATE;
  const chargesTotal = taxable + gst;
  const credits = exportCredits(
    profile,
    plan,
    assumptions.exportPeakPercent,
    warnings,
  );

  return {
    planId: plan.id,
    usageCharges: usage,
    dailySupplyCharges,
    retailerFees,
    oneOffFees,
    gst,
    chargesTotal,
    exportCredits: credits,
    billTotal: chargesTotal - credits,
    warnings,
  };
}
