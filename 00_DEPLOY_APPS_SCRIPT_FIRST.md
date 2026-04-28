# Do This First: Deploy Apps Script

This is the first thing to check when opening the `pp` repo on another PC.

## Why

The latest backend fix is already pushed to GitHub, but it only affects the live site after the Apps Script project is manually updated and deployed.

Latest relevant commit:

- `031bd1f` - `Keep dashboard snapshots fast after market close`

What this fixes:

- After market close, dashboard snapshots stay usable for the configured snapshot TTL instead of expiring after 5 minutes.
- Dashboard rendering no longer downloads the KIS stock master zip just to show ticker names.
- This prevents slow fallback requests and the `kospi_code.mst.zip` bandwidth quota error from making the dashboard feel stuck.

## Deploy Target

- Apps Script project:
  `https://script.google.com/home/projects/1k55_bEvZEOUYq8PFzBavHGRxrkw1Q3IL6iKDgeyDauWhOyhyb0-oVvPJ/edit`
- Current live `/exec` URL in `config.js`:
  `https://script.google.com/macros/s/AKfycby4WQWoLEo8BhBDkz42SfCGFTzT_7E_gzeGUy70grkYdztxZEdObnnFqCELSyH3-x5uyw/exec`

## Steps

1. Open the Apps Script project above.
2. Replace the Apps Script source with the latest repo file:
   `apps-script/pp-sheet-gateway.gs`
3. Save the Apps Script file.
4. Go to `Deploy > Manage deployments`.
5. Edit the current web app deployment.
6. Select `New version`.
7. Deploy.
8. Run `refreshDashboardSnapshot()` once from Apps Script.
9. Verify these URLs:

```text
https://script.google.com/macros/s/AKfycby4WQWoLEo8BhBDkz42SfCGFTzT_7E_gzeGUy70grkYdztxZEdObnnFqCELSyH3-x5uyw/exec?action=dashboard-snapshot-status
https://script.google.com/macros/s/AKfycby4WQWoLEo8BhBDkz42SfCGFTzT_7E_gzeGUy70grkYdztxZEdObnnFqCELSyH3-x5uyw/exec?action=dashboard-data
```

Expected result after deployment:

- `dashboard-snapshot-status` returns `ok: true`.
- `dashboard-data` returns snapshot data instead of falling back to slow sheet rebuilds.
- After market close, the snapshot should not expire after only 5 minutes.

## Do Not Forget

Do this before starting the 1-4 backlog in `NEXT_WORK.md`.
