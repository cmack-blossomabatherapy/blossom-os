# Cancellation Command Center — why the live site still looks old

The staff-facing rebuild is already in the project code: `src/pages/os/reports/CancellationCommandCenter.tsx` loads normalized CentralReach data through `useCrPrimaryReport(["schedule"])` and renders inside `PrimaryReportShell` — no file pickers, no "Build Dashboard" step, and the freshness/Data Hub strip is Super Admin only.

Frontend changes do not reach the published site automatically, so `blossom.abacommandcenter.com` is still serving the older bundle. That is the whole reason it looks unchanged.

## What to do

1. Re-publish the project so the rebuilt report ships to the live site.
2. Small copy cleanup while we're here: the Reports catalog still has a second card, "Session Cancellation Dashboard" (`qa-cancellation`), whose description says "Upload a CentralReach Scheduling Cancellation export…". That card already redirects to the rebuilt Cancellation Command Center, so its upload wording is misleading. Update the description and `lastUpdated` to Data-Hub wording (or fold it into the single Command Center card if you'd rather not have two entries).

## Technical notes

- No changes needed to `CancellationCommandCenter.tsx`, `useCrPrimaryReport`, or `PrimaryReportShell`.
- Copy-only edit to the `qa-cancellation` entry in `src/lib/os/reportsCatalog.ts`; route redirect at `/reports/qa-cancellation` stays as is.
- `QaCancellationDashboard` is imported in `src/App.tsx` but no longer routed — the import can be dropped in the same edit.
