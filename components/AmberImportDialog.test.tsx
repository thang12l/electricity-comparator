/** @vitest-environment jsdom */

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { writeAmberApiKey } from "@/lib/amber/apiKeyStorage";
import { writeAmberUsage } from "@/lib/amber/usageStorage";
import { AmberImportDialog } from "./AmberImportDialog";

vi.mock("@/lib/amber/usageStorage", () => ({
  writeAmberUsage: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.mocked(writeAmberUsage).mockClear();
  window.localStorage.clear();
});

function mockAmberFetch(options: {
  defaultKeyConfigured?: boolean;
  defaultKey?: string;
  usageResponse?: Response;
  usageHandler?: (url: string, init?: RequestInit) => Promise<Response> | Response;
}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === "/api/amber/config") {
      return new Response(
        JSON.stringify({
          defaultKeyConfigured: options.defaultKeyConfigured ?? false,
          ...(options.defaultKey ? { defaultKey: options.defaultKey } : {}),
        }),
        { status: 200 },
      );
    }
    if (url === "/api/amber/usage") {
      if (options.usageHandler) {
        return options.usageHandler(url, init);
      }
      return (
        options.usageResponse ??
        new Response(
          JSON.stringify({
            siteId: "site-1",
            nmi: "3052282872",
            network: "Jemena",
            intervals: [],
          }),
          { status: 200 },
        )
      );
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("AmberImportDialog", () => {
  it("asks for a key, retrieves usage, saves the key, and clears the input", async () => {
    const user = userEvent.setup();
    const onLoaded = vi.fn();
    const fetchMock = mockAmberFetch({});

    const { rerender } = render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={onLoaded} />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/amber/config");
    });

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
    expect(writeAmberUsage).toHaveBeenCalledWith({
      siteId: "site-1",
      nmi: "3052282872",
      network: "Jemena",
      intervals: [],
    });
    expect(window.localStorage.getItem("amber-api-key")).toBe("psk_secret");

    rerender(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={onLoaded} />,
    );
    expect(screen.getByLabelText("Amber API key")).toHaveValue("");
  });

  it("shows a saved key as the placeholder and retrieves without typing", async () => {
    const user = userEvent.setup();
    const onLoaded = vi.fn();
    writeAmberApiKey("psk_saved");
    const fetchMock = mockAmberFetch({});

    render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={onLoaded} />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/amber/config");
    });

    const keyField = screen.getByLabelText("Amber API key");
    expect(keyField).toHaveAttribute("placeholder", "psk_saved");
    expect(keyField).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Retrieve usage" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/amber/usage", {
      method: "POST",
      headers: { Authorization: "Bearer psk_saved" },
    });
    expect(onLoaded).toHaveBeenCalled();
    expect(writeAmberUsage).toHaveBeenCalled();
  });

  it("prefers a newly typed key over the saved key", async () => {
    const user = userEvent.setup();
    writeAmberApiKey("psk_saved");
    const fetchMock = mockAmberFetch({});

    render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={() => {}} />,
    );

    await user.type(screen.getByLabelText("Amber API key"), "psk_new");
    await user.click(screen.getByRole("button", { name: "Retrieve usage" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/amber/usage", {
      method: "POST",
      headers: { Authorization: "Bearer psk_new" },
    });
    expect(window.localStorage.getItem("amber-api-key")).toBe("psk_new");
  });

  it("uses the env default key when configured", async () => {
    const user = userEvent.setup();
    const onLoaded = vi.fn();
    const fetchMock = mockAmberFetch({
      defaultKeyConfigured: true,
      defaultKey: "psk_env",
    });

    render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={onLoaded} />,
    );

    await waitFor(() => {
      expect(
        screen.getByLabelText("Amber API key"),
      ).toHaveAttribute("placeholder", "psk_env");
    });

    await user.click(screen.getByRole("button", { name: "Retrieve usage" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/amber/usage", {
      method: "POST",
      headers: { Authorization: "Bearer psk_env" },
    });
    expect(onLoaded).toHaveBeenCalled();
    expect(writeAmberUsage).toHaveBeenCalled();
    expect(window.localStorage.getItem("amber-api-key")).toBeNull();
  });

  it("does not retrieve when the key is blank and none is saved or configured", async () => {
    const user = userEvent.setup();
    const fetchMock = mockAmberFetch({});
    render(
      <AmberImportDialog open onOpenChange={() => {}} onLoaded={() => {}} />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/amber/config");
    });

    await user.click(screen.getByRole("button", { name: "Retrieve usage" }));
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/amber/usage",
      expect.anything(),
    );
    expect(
      screen.getByText("Enter your Amber API key to retrieve usage."),
    ).toBeTruthy();
    expect(writeAmberUsage).not.toHaveBeenCalled();
  });
});
