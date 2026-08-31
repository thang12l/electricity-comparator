export type UsageProfile = {
  billingDays: number;
  usageKwh: {
    total?: number;
    peak?: number;
    shoulder?: number;
    offPeak?: number;
  };
  exportKwh: {
    total?: number;
    peak?: number;
    offPeak?: number;
  };
};

export type ProviderPlan = {
  id: string;
  providerName: string;
  planName?: string;
  dailySupplyCharge: number;
  usageRates: {
    flat?: number;
    peak?: number;
    shoulder?: number;
    offPeak?: number;
  };
  feedInRates: {
    flat?: number;
    peak?: number;
    offPeak?: number;
  };
  retailerFee?: number;
  oneOffFees?: number;
  gstInclusive: boolean;
  notes?: string;
};

export type BillWarning = {
  code: "missing_rate_fallback" | "peak_split_assumption";
  message: string;
  bucket?: "peak" | "shoulder" | "offPeak" | "exportPeak" | "exportOffPeak";
};

export type BillResult = {
  planId: string;
  usageCharges: number;
  dailySupplyCharges: number;
  retailerFees: number;
  oneOffFees: number;
  gst: number;
  chargesTotal: number;
  exportCredits: number;
  billTotal: number;
  warnings: BillWarning[];
};

export type PeakSplitAssumptions = {
  usagePeakPercent: number;
  exportPeakPercent: number;
};

export type PresetPlan = ProviderPlan & {
  lastUpdated: string;
  variableRates?: boolean;
};
