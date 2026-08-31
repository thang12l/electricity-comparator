export function formatAUD(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

export function formatRate(value: number | undefined, unit: string): string {
  if (value === undefined) return "—";
  return `$${value.toFixed(5).replace(/0+$/, "").replace(/\.$/, "")}${unit}`;
}

export function parseNonNegative(raw: string): {
  value?: number;
  error?: string;
} {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: undefined };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { error: "Enter a number" };
  if (n < 0) return { error: "Must be zero or greater" };
  return { value: n };
}
