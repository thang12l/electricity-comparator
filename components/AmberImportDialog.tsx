"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  readAmberApiKey,
  writeAmberApiKey,
} from "@/lib/amber/apiKeyStorage";
import { fetchAmberConfig, fetchAmberUsage } from "@/lib/amber/fetchUsage";
import { writeAmberUsage } from "@/lib/amber/usageStorage";
import type { MeterInterval } from "@/lib/usage/intervals";

type LoadedUsage = {
  siteId: string;
  nmi: string;
  network: string;
  intervals: MeterInterval[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoaded: (result: LoadedUsage) => void;
};

export function AmberImportDialog({ open, onOpenChange, onLoaded }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [defaultKey, setDefaultKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    void fetchAmberConfig()
      .then((config) => {
        setDefaultKey(config.defaultKey ?? null);
      })
      .catch(() => {
        setDefaultKey(null);
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    setSavedKey(readAmberApiKey());
  }, [open]);

  const availableKey = savedKey ?? defaultKey;

  function close() {
    setApiKey("");
    setError(undefined);
    setBusy(false);
    onOpenChange(false);
  }

  async function handleRetrieve() {
    const key = apiKey.trim() || availableKey?.trim() || "";
    if (!key) {
      setError("Enter your Amber API key to retrieve usage.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const payload = await fetchAmberUsage(key);
      const typedKey = apiKey.trim();
      if (typedKey || savedKey) {
        writeAmberApiKey(key);
        setSavedKey(key);
      }
      await writeAmberUsage(payload);
      onLoaded({
        siteId: payload.siteId,
        nmi: payload.nmi,
        network: payload.network,
        intervals: payload.intervals,
      });
      setApiKey("");
      onOpenChange(false);
    } catch (retrieveError) {
      setError(
        retrieveError instanceof Error
          ? retrieveError.message
          : "Could not reach the Amber import service.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setApiKey("");
          setError(undefined);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load usage from Amber</DialogTitle>
          <DialogDescription>
            Paste a developer API key from the Amber app. A key you use
            successfully is saved in this browser so you can retrieve again
            without re-entering it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amber-api-key">Amber API key</Label>
          <Input
            id="amber-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            placeholder={availableKey ?? undefined}
            disabled={busy}
            onChange={(event) => setApiKey(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleRetrieve();
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Generate a token in the Amber web app under Developers.
          </p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleRetrieve()} disabled={busy}>
            {busy ? "Retrieving…" : "Retrieve usage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
