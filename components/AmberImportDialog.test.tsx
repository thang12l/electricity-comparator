/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AmberImportDialog } from "./AmberImportDialog";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AmberImportDialog", () => {
  it("asks for a key, retrieves usage, and clears the key", async () => {
    const user = userEvent.setup();
    const onLoaded = vi.fn();
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          siteId: "site-1",
          nmi: "3052282872",
          network: "Jemena",
          intervals: [],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={onLoaded} />,
    );

    const keyField = screen.getByLabelText("Amber API key");
    await user.type(keyField, "psk_secret");
    await user.click(screen.getByRole("button", { name: "Retrieve usage" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/amber/usage", {
      method: "POST",
      headers: { Authorization: "Bearer psk_secret" },
    });
    expect(onLoaded).toHaveBeenCalledWith({
      siteId: "site-1",
      nmi: "3052282872",
      network: "Jemena",
      intervals: [],
    });

    rerender(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={onLoaded} />,
    );
    expect(screen.getByLabelText("Amber API key")).toHaveValue("");
  });

  it("does not retrieve when the key is blank", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={() => {}} />,
    );
    await user.click(screen.getByRole("button", { name: "Retrieve usage" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter your Amber API key to retrieve usage."),
    ).toBeTruthy();
  });
});
