"use client";

import { useState } from "react";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function close() {
    setApiKey("");
    setError(undefined);
    setBusy(false);
    onOpenChange(false);
  }

  async function handleRetrieve() {
    const key = apiKey.trim();
    if (!key) {
      setError("Enter your Amber API key to retrieve usage.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/amber/usage", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
      });
      const payload = (await response.json()) as LoadedUsage & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not retrieve Amber usage");
        return;
      }
      onLoaded({
        siteId: payload.siteId,
        nmi: payload.nmi,
        network: payload.network,
        intervals: payload.intervals,
      });
      setApiKey("");
      onOpenChange(false);
    } catch {
      setError("Could not reach the Amber import service.");
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
            Paste a developer API key from the Amber app. It is used for this
            retrieval only and is not saved.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amber-api-key">Amber API key</Label>
          <Input
            id="amber-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
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
