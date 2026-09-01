import { afterEach, describe, expect, it } from "vitest";
import {
  getServerAmberApiKey,
  isServerAmberApiKeyConfigured,
} from "@/lib/amber/serverApiKey";

afterEach(() => {
  delete process.env.AMBER_DATA_API_KEY;
});

describe("serverApiKey", () => {
  it("returns null when the env var is missing", () => {
    expect(getServerAmberApiKey()).toBeNull();
    expect(isServerAmberApiKeyConfigured()).toBe(false);
  });

  it("reads a trimmed key from the env var", () => {
    process.env.AMBER_DATA_API_KEY = "  psk_test  ";
    expect(getServerAmberApiKey()).toBe("psk_test");
    expect(isServerAmberApiKeyConfigured()).toBe(true);
  });
});
