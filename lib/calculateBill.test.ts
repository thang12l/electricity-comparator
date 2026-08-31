import { describe, expect, it } from "vitest";
import {
  calculateBill,
  needsExportPeakSplit,
  needsUsagePeakSplit,
} from "./calculateBill";
import type { ProviderPlan, UsageProfile } from "./types";

const agl: ProviderPlan = {
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
};

const amber: ProviderPlan = {
  id: "amber-wholesale-avg",
  providerName: "Amber",
  planName: "Wholesale / Core (recent average)",
  dailySupplyCharge: 1.12,
  usageRates: { flat: 0.22 },
  feedInRates: { flat: 0.08 },
  retailerFee: 0.49,
  gstInclusive: true,
};

const touProfile: UsageProfile = {
  billingDays: 30,
  usageKwh: { peak: 200, shoulder: 400, offPeak: 600 },
  exportKwh: { peak: 80, offPeak: 120 },
};

describe("calculateBill", () => {
  it("matches the AGL TOU simulation", () => {
    const result = calculateBill(touProfile, agl);
    expect(result.usageCharges).toBeCloseTo(226.666, 3);
    expect(result.dailySupplyCharges).toBeCloseTo(50.688, 3);
    expect(result.retailerFees).toBe(0);
    expect(result.gst).toBe(0);
    expect(result.exportCredits).toBeCloseTo(24, 6);
    expect(result.billTotal).toBeCloseTo(253.354, 3);
  });

  it("adds 10% GST on charges only when rates are exclusive", () => {
    const result = calculateBill(touProfile, { ...agl, gstInclusive: false });
    expect(result.gst).toBeCloseTo(27.7354, 4);
    expect(result.exportCredits).toBeCloseTo(24, 6);
    expect(result.chargesTotal).toBeCloseTo(305.0894, 4);
    expect(result.billTotal).toBeCloseTo(281.0894, 4);
  });

  it("never GST-adjusts export credits", () => {
    const exclusive = calculateBill(touProfile, { ...agl, gstInclusive: false });
    const inclusive = calculateBill(touProfile, agl);
    expect(exclusive.exportCredits).toBe(inclusive.exportCredits);
  });

  it("applies a flat plan to summed TOU usage without prompting", () => {
    const result = calculateBill(touProfile, amber);
    expect(result.usageCharges).toBeCloseTo(1200 * 0.22, 6);
    expect(result.dailySupplyCharges).toBeCloseTo(33.6, 6);
    expect(result.retailerFees).toBeCloseTo(14.7, 6);
    expect(result.exportCredits).toBeCloseTo(200 * 0.08, 6);
    expect(needsUsagePeakSplit(touProfile, amber)).toBe(false);
  });

  it("does not silently split a flat-total profile against a TOU plan", () => {
    const profile: UsageProfile = {
      billingDays: 30,
      usageKwh: { total: 1000 },
      exportKwh: { total: 200 },
    };
    expect(needsUsagePeakSplit(profile, agl)).toBe(true);
    expect(needsExportPeakSplit(profile, agl)).toBe(true);

    const atZero = calculateBill(profile, agl, {
      usagePeakPercent: 0,
      exportPeakPercent: 0,
    });
    expect(atZero.usageCharges).toBeCloseTo(1000 * 0.06633, 6);
    expect(atZero.exportCredits).toBeCloseTo(200 * 0.02, 6);
    expect(atZero.warnings.some((w) => w.code === "peak_split_assumption")).toBe(
      true,
    );

    const atHalf = calculateBill(profile, agl, {
      usagePeakPercent: 50,
      exportPeakPercent: 50,
    });
    expect(atHalf.usageCharges).toBeCloseTo(
      500 * 0.45386 + 500 * 0.06633,
      6,
    );
    expect(atHalf.exportCredits).toBeCloseTo(100 * 0.27 + 100 * 0.02, 6);
  });

  it("charges solar soak at its own rate when present", () => {
    const plan: ProviderPlan = {
      ...agl,
      usageRates: { peak: 0.4, solarSoak: 0.2, offPeak: 0.1 },
    };
    const profile: UsageProfile = {
      billingDays: 1,
      usageKwh: { peak: 10, solarSoak: 20, offPeak: 30 },
      exportKwh: {},
    };
    const result = calculateBill(profile, plan);
    expect(result.usageCharges).toBeCloseTo(10 * 0.4 + 20 * 0.2 + 30 * 0.1, 6);
  });

  it("maps solar soak usage to the shoulder rate when soak is missing", () => {
    const profile: UsageProfile = {
      billingDays: 1,
      usageKwh: { peak: 1, solarSoak: 8, offPeak: 1 },
      exportKwh: {},
    };
    const result = calculateBill(profile, agl);
    expect(result.usageCharges).toBeCloseTo(
      1 * 0.45386 + 8 * 0.24024 + 1 * 0.06633,
      6,
    );
    expect(
      result.warnings.some(
        (w) => w.code === "missing_rate_fallback" && w.bucket === "solarSoak",
      ),
    ).toBe(true);
  });

  it("falls back missing shoulder usage to the off-peak rate with a warning", () => {
    const plan: ProviderPlan = {
      ...agl,
      usageRates: { peak: 0.45386, offPeak: 0.06633 },
    };
    const profile: UsageProfile = {
      billingDays: 31,
      usageKwh: { peak: 10, shoulder: 100, offPeak: 20 },
      exportKwh: {},
    };
    const result = calculateBill(profile, plan);
    expect(result.usageCharges).toBeCloseTo(
      10 * 0.45386 + 100 * 0.06633 + 20 * 0.06633,
      6,
    );
    expect(
      result.warnings.some(
        (w) => w.code === "missing_rate_fallback" && w.bucket === "shoulder",
      ),
    ).toBe(true);
  });

  it("includes retailer daily fees and one-off fees", () => {
    const result = calculateBill(
      { billingDays: 10, usageKwh: { total: 0 }, exportKwh: {} },
      { ...amber, oneOffFees: 5.5 },
    );
    expect(result.retailerFees).toBeCloseTo(4.9, 6);
    expect(result.oneOffFees).toBe(5.5);
    expect(result.billTotal).toBeCloseTo(1.12 * 10 + 4.9 + 5.5, 6);
  });
});
