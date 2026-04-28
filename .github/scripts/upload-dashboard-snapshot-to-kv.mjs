import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const snapshotPath = path.join(rootDir, "dashboard-latest.json");
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID || "";
const snapshotKey = process.env.CLOUDFLARE_KV_SNAPSHOT_KEY || "dashboard-latest.json";

function missingSecretNames() {
  return [
    ["CLOUDFLARE_ACCOUNT_ID", accountId],
    ["CLOUDFLARE_API_TOKEN", apiToken],
    ["CLOUDFLARE_KV_NAMESPACE_ID", namespaceId]
  ]
    .filter(([, value]) => !String(value || "").trim())
    .map(([name]) => name);
}

const missing = missingSecretNames();
if (missing.length) {
  console.log(`Skipping Cloudflare KV upload; missing secrets: ${missing.join(", ")}`);
  process.exit(0);
}

const body = await readFile(snapshotPath, "utf8");
JSON.parse(body);

const endpoint = new URL(
  `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(snapshotKey)}`
);

const response = await fetch(endpoint, {
  method: "PUT",
  headers: {
    authorization: `Bearer ${apiToken}`,
    "content-type": "application/json"
  },
  body
});

const responseText = await response.text();
let payload = null;
try {
  payload = JSON.parse(responseText);
} catch {
  payload = { raw: responseText };
}

if (!response.ok || payload?.success === false) {
  throw new Error(`Cloudflare KV upload failed: ${response.status} ${JSON.stringify(payload).slice(0, 500)}`);
}

console.log(`Uploaded ${path.relative(rootDir, snapshotPath)} to Cloudflare KV key ${snapshotKey}.`);
