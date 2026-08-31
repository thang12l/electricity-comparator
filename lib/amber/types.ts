export type AmberChannelType = "general" | "controlledLoad" | "feedIn";

export type AmberSiteStatus = "pending" | "active" | "closed";

export type AmberUsageQuality = "estimated" | "billable";

export type AmberTouPeriod = "offPeak" | "shoulder" | "solarSponge" | "peak";

export type AmberPriceDescriptor =
  | "negative"
  | "extremelyLow"
  | "veryLow"
  | "low"
  | "neutral"
  | "high"
  | "spike";

export type AmberSpikeStatus = "none" | "potential" | "spike";

export type AmberChannel = {
  identifier: string;
  type: AmberChannelType;
  tariff: string;
};

export type AmberSite = {
  id: string;
  nmi: string;
  channels: AmberChannel[];
  network: string;
  status: AmberSiteStatus;
  activeFrom?: string;
  closedOn?: string;
  intervalLength: 5 | 30;
};

export type AmberTariffInformation = {
  period?: AmberTouPeriod;
  season?:
    | "default"
    | "summer"
    | "autumn"
    | "winter"
    | "spring"
    | "nonSummer"
    | "holiday"
    | "weekend"
    | "weekendHoliday"
    | "weekday";
  block?: 1 | 2;
  demandWindow?: boolean;
};

export type AmberUsageInterval = {
  type: "Usage";
  duration: 5 | 15 | 30;
  spotPerKwh: number;
  perKwh: number;
  date: string;
  nemTime: string;
  startTime: string;
  endTime: string;
  renewables: number;
  channelType: AmberChannelType;
  channelIdentifier: string;
  tariffInformation?: AmberTariffInformation | null;
  spikeStatus: AmberSpikeStatus;
  descriptor: AmberPriceDescriptor;
  kwh: number;
  quality: AmberUsageQuality;
  cost: number;
};
