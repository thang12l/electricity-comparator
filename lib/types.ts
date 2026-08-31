export type TouPeriod = "peak" | "shoulder" | "solarSoak" | "offPeak";

export type TouWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TouWindow = {
  period: TouPeriod;
  days: TouWeekday[];
  startLocal: string;
  endLocal: string;
};

export type TouSchedule = {
  timeZone: string;
  windows: TouWindow[];
};

export type UsageProfile = {
  billingDays: number;
  usageKwh: {
    total?: number;
    peak?: number;
    shoulder?: number;
    solarSoak?: number;
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
    solarSoak?: number;
    offPeak?: number;
  };
  feedInRates: {
    flat?: number;
    peak?: number;
    offPeak?: number;
  };
  usageTou?: TouSchedule;
  exportTou?: TouSchedule;
  retailerFee?: number;
  oneOffFees?: number;
  gstInclusive: boolean;
  notes?: string;
};

export type BillWarning = {
  code: "missing_rate_fallback" | "peak_split_assumption";
  message: string;
  bucket?:
    | "peak"
    | "shoulder"
    | "solarSoak"
    | "offPeak"
    | "exportPeak"
    | "exportOffPeak";
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
