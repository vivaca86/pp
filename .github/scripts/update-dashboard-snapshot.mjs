import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const configPath = path.join(rootDir, "config.js");
const outputPath = path.join(rootDir, "dashboard-latest.json");

function extractGatewayUrl(configText) {
  const match = configText.match(/gatewayUrl:\s*["']([^"']+)["']/);
  return match ? match[1].trim() : "";
}

function isValidDashboardPayload(payload) {
  return Boolean(
    payload
      && payload.ok
      && payload.selectedDate
      && Array.isArray(payload.rows)
      && Array.isArray(payload.slots)
  );
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function hasSameDashboardSnapshot(left, right) {
  if (!left || !right) return false;
  return left.selectedDate === right.selectedDate
    && left.snapshotUpdatedAt === right.snapshotUpdatedAt
    && JSON.stringify(left.rows) === JSON.stringify(right.rows)
    && JSON.stringify(left.slots) === JSON.stringify(right.slots);
}

const configText = await readFile(configPath, "utf8");
const gatewayUrl = process.env.GATEWAY_URL || extractGatewayUrl(configText);

if (!gatewayUrl) {
  throw new Error("config.js에서 gatewayUrl을 찾지 못했습니다.");
}

const requestUrl = new URL(gatewayUrl);
requestUrl.searchParams.set("action", "dashboard-data");

const response = await fetch(requestUrl, {
  method: "GET",
  headers: {
    accept: "application/json"
  }
});

if (!response.ok) {
  throw new Error(`dashboard-data 요청 실패: ${response.status}`);
}

const payload = await response.json();
if (!isValidDashboardPayload(payload)) {
  throw new Error(`유효하지 않은 dashboard-data 응답: ${JSON.stringify(payload).slice(0, 300)}`);
}

const snapshot = {
  ...payload,
  sourceMode: "static-snapshot",
  staticSnapshot: true,
  staticPublishedAt: new Date().toISOString(),
  staticGenerator: "github-actions"
};

const previous = await readJsonIfExists(outputPath);
if (hasSameDashboardSnapshot(previous, snapshot)) {
  console.log("dashboard-latest.json is already current.");
  process.exit(0);
}

await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} for ${snapshot.selectedDate}.`);
