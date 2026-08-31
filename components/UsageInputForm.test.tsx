/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { UsageInputForm } from "./UsageInputForm";
import type { UsageProfile } from "@/lib/types";
import type { UsageMode } from "@/lib/useSavedState";

afterEach(() => {
  cleanup();
});

function Harness() {
  const [profile, setProfile] = useState<UsageProfile>({
    billingDays: 0,
    usageKwh: {},
    exportKwh: {},
  });
  const [usageMode, setUsageMode] = useState<UsageMode>("total");
  const [exportMode, setExportMode] = useState<UsageMode>("total");

  return (
    <div>
      <UsageInputForm
        profile={profile}
        usageMode={usageMode}
        exportMode={exportMode}
        onProfileChange={(updater) => setProfile((current) => updater(current))}
        onUsageModeChange={setUsageMode}
        onExportModeChange={setExportMode}
      />
      <p data-testid="billing-days-state">{profile.billingDays}</p>
      <p data-testid="usage-state">{profile.usageKwh.total ?? ""}</p>
      <p data-testid="export-state">{profile.exportKwh.total ?? ""}</p>
    </div>
  );
}

describe("UsageInputForm", () => {
  it("keeps earlier fields when moving to the next input", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Billing days"), "30");
    await user.type(screen.getByLabelText("Total usage (kWh)"), "1000");
    await user.type(screen.getByLabelText("Total export (kWh)"), "200");

    expect(screen.getByLabelText("Billing days")).toHaveValue("30");
    expect(screen.getByLabelText("Total usage (kWh)")).toHaveValue("1000");
    expect(screen.getByLabelText("Total export (kWh)")).toHaveValue("200");
    expect(screen.getByTestId("billing-days-state")).toHaveTextContent("30");
    expect(screen.getByTestId("usage-state")).toHaveTextContent("1000");
    expect(screen.getByTestId("export-state")).toHaveTextContent("200");
  });

  it("shows an error for negative numbers and does not commit them", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Billing days"), "-4");

    expect(screen.getByText("Must be zero or greater")).toBeTruthy();
    expect(screen.getByTestId("billing-days-state")).toHaveTextContent("0");
  });
});
