# Cloudflare Worker + KV Setup

This repo is ready to deploy a small Worker that serves the dashboard snapshot from Cloudflare KV.

## First Cloudflare Deploy

Use the Cloudflare screen you already opened:

- Repository: `vivaca86/pp`
- Project name: `pp-dashboard-snapshot`
- Build command: leave empty
- Deploy command: `npx wrangler deploy`

The `wrangler.jsonc` file asks Wrangler to create the KV namespace automatically on first deploy and bind it as `PP_DASHBOARD_SNAPSHOT`.

After the deploy finishes, open the Worker URL:

```txt
https://pp-dashboard-snapshot.<your-workers-subdomain>.workers.dev/health
```

Expected shape:

```json
{
  "ok": true,
  "service": "pp-dashboard-snapshot",
  "kvBinding": true,
  "snapshotKey": "dashboard-latest.json"
}
```

## GitHub Secrets

After the first deploy, find the automatically created KV namespace in Cloudflare and copy its Namespace ID. Then add these GitHub repository secrets:

```txt
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
CLOUDFLARE_KV_NAMESPACE_ID
```

The API token should use Cloudflare's `Edit Cloudflare Workers` template or equivalent account permissions:

```txt
Account Settings: Read
Workers Scripts: Edit
Workers KV Storage: Edit
```

The scheduled `Dashboard Snapshot` GitHub Action will keep committing `dashboard-latest.json` as a fallback and will also upload the same JSON to KV when these secrets exist.

## Flip The Frontend

Once the Worker URL is confirmed, change `config.js`:

```js
dashboardSnapshotUrl: "https://pp-dashboard-snapshot.<your-workers-subdomain>.workers.dev/dashboard-latest.json",
```

Until then, the site keeps using the existing GitHub Pages snapshot:

```js
dashboardSnapshotUrl: "./dashboard-latest.json",
```
