# PP Production Rollout Prep

Updated: 2026-04-13

## Goal
Prepare the production workspace `pp` for rollout without deploying yet.

## Current finding
Production local code is aligned with the tested implementation, and the production Apps Script backend has been redeployed on the existing live `/exec` URL.

### Already aligned in `pp`
- Hybrid equal-rate dashboard exists.
- Fixed benchmark slots are `KOSPI` and `KOSDAQ`.
- Editable ticker range in Apps Script is already `D2:I2`.
- The sheet gateway already reads six editable tickers.
- The dashboard front-end already switches benchmark by stock market:
  - KOSPI stock -> KOSPI benchmark
  - KOSDAQ stock -> KOSDAQ benchmark

### Newly ported into `pp`
- Recommendation page UI.
- View switch between `등가율 / 종목추천`.
- Mobile bottom navigation for recommendation view.
- Recommendation actions in Apps Script:
  - `fibonacci-recommendations`
  - `fibonacci-warmup`
- KIS-backed recommendation scan / cache logic in the production backend source.

## Current live status
- Live backend `/exec` URL:
  `https://script.google.com/macros/s/AKfycbwTTTBD3kVxTvxOFIqIi-TsnZsZr-ugZNylfSCXChGunqO-q-zQmBaTU_YCCqkZf_dvTw/exec`
- Latest deployed backend version: `@14`
- Verified on `2026-04-13`:
  - `action=health` works
  - `action=dashboard-data` works
  - existing equal-rate dashboard payload is healthy again
- KIS Script Properties now contain a **production** app key/secret and the backend reports `hasCredentials = true`
- Current KIS base URL is set to:
  `https://openapi.koreainvestment.com:9443`
- Recommendation smoke result with production credentials:
  - direct token issuance works
  - `fibonacci-recommendations` for `KOSPI200` now succeeds
  - `fibonacci-warmup` for default `KOSDAQ150` now succeeds with `150 / 150` warmed
  - `fibonacci-recommendations` for default `KOSDAQ150` now succeeds
  - scoped token cache has been added so mock/prod tokens do not get mixed
- Remaining temporary product decision:
  - `ALL` is removed from the production recommendation UI for now
- Production static front-end has **not** been pushed yet.

## Production prerequisites

### Spreadsheet
The production spreadsheet must keep this layout:
- `A` = date
- `B` = KOSPI
- `C` = KOSDAQ
- `D:I` = editable stocks 1~6

### Apps Script properties
The production Apps Script project will need KIS credentials before recommendation deployment:
- `KIS_APP_KEY`
- `KIS_APP_SECRET`
- optional overrides if used later:
  - `KIS_BASE_URL`
  - market/division overrides

### Existing production gateway
- Front-end config:
  `C:\Users\vivac\OneDrive\문서\aa\pp\config.js`
- Current production gateway URL should be preserved unless a new deployment URL is issued.

## Files that must change for real production rollout

### Front-end
- `C:\Users\vivac\OneDrive\문서\aa\pp\index.html`
  - add recommendation page markup
  - add dashboard/recommendation view switch
  - add mobile bottom nav
- `C:\Users\vivac\OneDrive\문서\aa\pp\app.js`
  - add recommendation state
  - add recommendation API requests
  - add recommendation rendering
  - add slot-target integration from recommendation -> sheet update flow
- `C:\Users\vivac\OneDrive\문서\aa\pp\styles.css`
  - add recommendation layout styles
  - add mobile recommendation UX styles
  - add mobile bottom nav styles

### Backend
- `C:\Users\vivac\OneDrive\문서\aa\pp\apps-script\pp-sheet-gateway.gs`
  - add recommendation endpoints
  - add KIS price history fetch helpers
  - add recommendation warmup/cache logic
  - keep existing `dashboard-data` and `update-tickers` sheet flow untouched

## Recommended rollout order
1. Port recommendation UI from `stock-lab` to `pp` locally.
2. Port recommendation backend logic from `stock-lab/apps-script/stock-eq-gateway.gs` into `pp/apps-script/pp-sheet-gateway.gs`.
3. Keep `pp` dashboard sheet flow as-is.
4. Deploy updated production Apps Script backend.
5. Update `config.js` only if the backend deployment URL changes.
6. Push static `pp` frontend files after final check.

## Smoke test checklist before production deploy
- Dashboard loads on the selected date.
- KOSPI stock compares against KOSPI benchmark.
- KOSDAQ stock compares against KOSDAQ benchmark.
- Recommendation page loads and runs for:
  - `KOSPI200`
  - `KOSDAQ150`
- Recommendation result can be inserted into a slot.
- Slot update still writes back to the spreadsheet correctly.
- Mobile bottom nav works.
- Equal-rate page still renders after recommendation actions.

## Rollback plan
- Restore previous `index.html`, `app.js`, `styles.css`, and `config.js`.
- Revert Apps Script to the previous deployed version.
- Confirm dashboard-only flow works again.

## Decision
Production backend source is now **deployed**, and the existing dashboard flow is **restored and healthy**.
Recommendation rollout is now **ready for single-universe production use** with `KOSPI200` and `KOSDAQ150`.
`ALL` remains intentionally disabled in the production UI for stability.

## Immediate next step
Push the static production frontend with `KOSPI200 / KOSDAQ150` only, then run the final public smoke checklist.
