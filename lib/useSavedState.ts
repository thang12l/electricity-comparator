"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { ProviderPlan, UsageProfile } from "@/lib/types";
import { presetPlans } from "@/data/presetPlans";

const STORAGE_KEY = "bill-comparator-v1";
const DEBOUNCE_MS = 400;

export type UsageMode = "total" | "tou";

export type SavedState = {
  profile: UsageProfile;
  usageMode: UsageMode;
  exportMode: UsageMode;
  selectedPlanIds: string[];
  customPlans: ProviderPlan[];
  currentPlanId: string | null;
  usagePeakPercent: number;
  exportPeakPercent: number;
};

export const defaultSavedState: SavedState = {
  profile: {
    billingDays: 0,
    usageKwh: {},
    exportKwh: {},
  },
  usageMode: "total",
  exportMode: "total",
  selectedPlanIds: presetPlans.map((plan) => plan.id),
  customPlans: [],
  currentPlanId: null,
  usagePeakPercent: 0,
  exportPeakPercent: 0,
};

function readStorage(): SavedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    return {
      ...defaultSavedState,
      ...parsed,
      profile: {
        ...defaultSavedState.profile,
        ...parsed.profile,
        usageKwh: {
          ...defaultSavedState.profile.usageKwh,
          ...parsed.profile?.usageKwh,
        },
        exportKwh: {
          ...defaultSavedState.profile.exportKwh,
          ...parsed.profile?.exportKwh,
        },
      },
    };
  } catch {
    return null;
  }
}

function writeStorage(state: SavedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Privacy mode / quota / SSR — persistence is convenience only.
  }
}

function emptySubscribe() {
  return () => {};
}

export function useSavedState() {
  const [state, setState] = useState<SavedState>(defaultSavedState);
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [seenHydration, setSeenHydration] = useState(false);

  if (hydrated && !seenHydration) {
    setSeenHydration(true);
    const stored = readStorage();
    if (stored) setState(stored);
  }

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => writeStorage(state), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state, hydrated]);

  return { state, setState, hydrated };
}
