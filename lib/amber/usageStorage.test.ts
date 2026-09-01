/** @vitest-environment jsdom */

import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import type { StoredAmberUsage } from "@/lib/amber/usageStorage";
import {
  clearAmberUsage,
  readAmberUsage,
  writeAmberUsage,
} from "@/lib/amber/usageStorage";

const sample: StoredAmberUsage = {
  siteId: "site-1",
  nmi: "3052282872",
  network: "Jemena",
  intervals: [
    {
      startTime: "2026-01-01T00:00:00.000Z",
      endTime: "2026-01-01T00:30:00.000Z",
      durationMinutes: 30,
      channel: "general",
      kwh: 0.4,
      quality: "billable",
    },
  ],
};

afterEach(async () => {
  await clearAmberUsage();
});

describe("usageStorage", () => {
  it("returns null when nothing is stored", async () => {
    expect(await readAmberUsage()).toBeNull();
  });

  it("round-trips stored usage", async () => {
    await writeAmberUsage(sample);
    expect(await readAmberUsage()).toEqual(sample);
  });

  it("overwrites the previous snapshot", async () => {
    await writeAmberUsage(sample);
    const next = { ...sample, nmi: "1111111111", intervals: [] };
    await writeAmberUsage(next);
    expect(await readAmberUsage()).toEqual(next);
  });

  it("clears stored usage", async () => {
    await writeAmberUsage(sample);
    await clearAmberUsage();
    expect(await readAmberUsage()).toBeNull();
  });

  it("ignores a malformed stored record", async () => {
    await writeAmberUsage(sample);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("electricity-comparator", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("amber-usage", "readwrite");
      tx.objectStore("amber-usage").put({ nmi: "only" }, "latest");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    expect(await readAmberUsage()).toBeNull();
  });
});
