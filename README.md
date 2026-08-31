# Electricity Bill Comparator

A client-side calculator for comparing what one electricity bill would cost across retailer rate plans. Enter usage from your own bill, pick plans, and see usage charges, daily supply, fees, GST, and solar export credits side by side.

V1 has no backend, no accounts, and no database. All calculation happens in the browser. `localStorage` only remembers your last inputs on this device.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:43125](http://localhost:43125).

## What it does

- **Usage entry**: billing days, a single usage total or a time-of-use split, and optional solar export
- **Plan comparison**: Amber (illustrative recent average) and AGL (example TOU rates), plus custom plans you type in
- **Calculation engine**: `lib/calculateBill.ts` is a pure function. Bill = usage + supply + retailer fees + GST − export credits. Export credits are never GST-adjusted.
- **Ambiguous TOU splits**: if a plan is time-of-use but the bill only has a total, you set the peak-hour percentage instead of the app guessing

Preset rates include a last-updated date. Confirm current retailer rates before switching.

## Out of scope for V1

Auth, databases, PDF bill upload, automatic rate updates, multi-bill history, and export/share links.
