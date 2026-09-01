/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { readAmberApiKey, writeAmberApiKey } from "@/lib/amber/apiKeyStorage";

afterEach(() => {
  window.localStorage.clear();
});

describe("apiKeyStorage", () => {
  it("returns null when nothing is stored", () => {
    expect(readAmberApiKey()).toBeNull();
  });

  it("round-trips a stored key", () => {
    writeAmberApiKey("psk_secret");
    expect(readAmberApiKey()).toBe("psk_secret");
  });

  it("ignores blank stored values", () => {
    window.localStorage.setItem("amber-api-key", "   ");
    expect(readAmberApiKey()).toBeNull();
  });
});
