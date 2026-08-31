import type { PresetPlan } from "@/lib/types";
import {
  VIC_RESIDENTIAL_EXPORT_TOU_2026,
  VIC_RESIDENTIAL_TOU_2026,
} from "@/lib/usage/vicResidentialTou";

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
      solarSoak: 0.24024,
      offPeak: 0.06633,
    },
    feedInRates: {
      peak: 0.27,
      offPeak: 0.02,
    },
    usageTou: VIC_RESIDENTIAL_TOU_2026,
    exportTou: VIC_RESIDENTIAL_EXPORT_TOU_2026,
    gstInclusive: true,
    lastUpdated: PRESET_LAST_VERIFIED,
    notes:
      "Example rates from prior analysis. Usage windows follow the Vic 2026–27 residential TOU (solar soak 11:00–16:00, peak 16:00–21:00, local time, every day). Verify current AGL rates before switching.",
  },
];

export function getPresetById(id: string): PresetPlan | undefined {
  return presetPlans.find((plan) => plan.id === id);
}
