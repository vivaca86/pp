# Next Work Queue

This file is the handoff note for the next Codex session, possibly on another PC. Start here before changing code.

## First Task: Deploy Pending Apps Script Fix

- Before starting the backlog below, open [`00_DEPLOY_APPS_SCRIPT_FIRST.md`](./00_DEPLOY_APPS_SCRIPT_FIRST.md).
- The latest backend fix is pushed in Git commit `031bd1f`, but the live Apps Script project may still need manual save/deploy.
- Deploy `apps-script/pp-sheet-gateway.gs` first so the dashboard uses the after-market snapshot fix and avoids the KIS master zip quota slowdown.

## Current State

- Front-end is deployed from GitHub Pages.
- Current front-end gateway in `config.js`:
  `https://script.google.com/macros/s/AKfycby4WQWoLEo8BhBDkz42SfCGFTzT_7E_gzeGUy70grkYdztxZEdObnnFqCELSyH3-x5uyw/exec`
- Latest confirmed backend behavior:
  - `action=health` works.
  - `action=dashboard-snapshot-status` works.
  - `dashboard-data` returns a fresh snapshot after `installDashboardSnapshotTrigger()` was run.
  - The initial verified snapshot source was `manual`; next market session should show `trigger` if the time-based trigger is running.
- The backend source in `apps-script/pp-sheet-gateway.gs` is ahead of the manually deployed Apps Script only if the user has not pasted/deployed the latest file. Always verify the live `/exec` URL before assuming deployment status.

## Top Priority Backlog

1. Move dashboard snapshot delivery off Apps Script for faster first paint.
   - Goal: user fetches static/CDN JSON instead of hitting Apps Script for dashboard reads.
   - Candidate shape:
     - Apps Script trigger still computes the snapshot.
     - Snapshot is written to a faster store such as Cloudflare KV/R2 or another CDN-friendly JSON endpoint.
     - Front-end fetches `dashboard-latest.json` from that store.
     - Apps Script remains as fallback and for ticker updates.
   - Expected user-facing change: dashboard snapshot display can drop from the current 2-3s Apps Script path toward roughly sub-second to 1s depending on the store/CDN.
   - Cost/complexity note: likely free at this scale, but adds account/API-token/CORS/fallback setup.

2. Automate Apps Script deployment.
   - Goal: stop requiring the user to paste code and manually deploy each backend change.
   - Use `clasp` against the existing production Apps Script project. Do not create a new Apps Script project unless the user explicitly asks.
   - Preserve the existing live `/exec` URL whenever possible. If a new deployment URL is issued, update `config.js` and verify GitHub Pages.
   - Add local setup docs or scripts as needed, but avoid committing private `.clasprc.json` credentials.
   - Useful checks after deployment:
     - `?action=health`
     - `?action=dashboard-snapshot-status`
     - repeated `?action=dashboard-data` timing and `snapshotSource`

3. Add snapshot/trigger health monitoring.
   - Goal: make stale or failed snapshots visible without opening Apps Script logs.
   - Front-end should call or reuse `action=dashboard-snapshot-status`.
   - Show a calm warning if `snapshotFresh` is false or `snapshotAgeSeconds` exceeds the configured freshness window.
   - Consider an admin-only or hidden diagnostics area showing `snapshotUpdatedAt`, `snapshotAgeSeconds`, and `snapshotSource`.

4. Add a manual "refresh latest" control.
   - Goal: let the user choose a slower real-time refresh when needed.
   - Suggested UX: show current snapshot immediately, then offer a "최신으로 갱신" button.
   - Backend should avoid an unbounded public heavy endpoint. Add throttling/cooldown or reuse an existing safe path rather than letting repeated clicks force expensive sheet recalculation.
   - After refresh succeeds, update the snapshot metadata shown in the UI.

## Verification Baseline

Run these before and after relevant changes:

```powershell
node --check .\app.js
Get-Content .\apps-script\pp-sheet-gateway.gs -Encoding UTF8 -Raw | node --check -
curl.exe -L -s "$env:GATEWAY_URL?action=health"
curl.exe -L -s "$env:GATEWAY_URL?action=dashboard-snapshot-status"
```

If `node` is not on PATH in a future Codex desktop session, locate the bundled Node runtime first and substitute that executable path.

For performance checks, call `dashboard-data` repeatedly and compare elapsed time plus `snapshotUpdatedAt`, `snapshotAgeSeconds`, and `snapshotSource`.
