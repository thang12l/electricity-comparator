import type { PresetPlan } from "@/lib/types";

export const PRESET_LAST_VERIFIED = "2026-08-31";

export const presetPlans: PresetPlan[] = [
  {
    id: "amber-wholesale-avg",
    providerName: "Amber",
    planName: "Wholesale / Core (recent average)",
    dailySupplyCharge: 1.12,
    usageRates: {
      flat: 0.22,
    },
    feedInRates: {
      flat: 0.08,
    },
    retailerFee: 0.49,
    gstInclusive: true,
    variableRates: true,
    lastUpdated: PRESET_LAST_VERIFIED,
    notes:
      "Wholesale rates change throughout the day. These figures are an illustrative recent average, not a quote. Confirm against your own Amber bills before relying on this comparison.",
  },
  {
    id: "agl-tou-example",
    providerName: "AGL",
    planName: "Time-of-use (example rates)",
    dailySupplyCharge: 1.6896,
    usageRates: {
      peak: 0.45386,
      shoulder: 0.24024,
      offPeak: 0.06633,
    },
    feedInRates: {
      peak: 0.27,
      offPeak: 0.02,
    },
    gstInclusive: true,
    lastUpdated: PRESET_LAST_VERIFIED,
    notes:
      "Example rates from prior analysis. Verify current AGL rates before switching — retailer pricing changes.",
  },
];

export function getPresetById(id: string): PresetPlan | undefined {
  return presetPlans.find((plan) => plan.id === id);
}
