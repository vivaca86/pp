import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const configPath = path.join(rootDir, "config.js");
const outputPath = path.join(rootDir, "dashboard-latest.json");
const marketTimezone = "Asia/Seoul";
const quickStockCatalog = new Map([
  ["0183V0", { name: "KIWOOM 삼성전자&SK하이닉스채권혼합50", market: "KOSPI", assetType: "etf" }],
  ["213420", { name: "덕산네오룩스", market: "KOSDAQ", assetType: "stock" }],
  ["042700", { name: "한미반도체", market: "KOSPI", assetType: "stock" }],
  ["319660", { name: "피에스케이", market: "KOSDAQ", assetType: "stock" }],
  ["Q530095", { name: "삼성 구리 선물 ETN(H)", market: "KOSPI", assetType: "etn" }],
  ["005930", { name: "삼성전자", market: "KOSPI", assetType: "stock" }]
]);

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

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function getTodayKstDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: marketTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function enrichDashboardSlot(slot) {
  const code = normalizeTicker(slot?.code);
  const meta = quickStockCatalog.get(code);
  if (!code || !meta) return slot;
  const rawName = String(slot.name || "").trim();
  const nameLooksLikeCode = rawName && normalizeTicker(rawName) === code;

  return {
    ...slot,
    code,
    name: nameLooksLikeCode || !rawName ? meta.name : rawName,
    market: slot.market && slot.market !== "KRX" ? slot.market : meta.market,
    assetType: slot.assetType || meta.assetType
  };
}

function enrichDashboardPayload(payload) {
  return {
    ...payload,
    slots: Array.isArray(payload.slots) ? payload.slots.map(enrichDashboardSlot) : payload.slots
  };
}

const configText = await readFile(configPath, "utf8");
const gatewayUrl = process.env.GATEWAY_URL || extractGatewayUrl(configText);

if (!gatewayUrl) {
  throw new Error("config.js에서 gatewayUrl을 찾지 못했습니다.");
}

const requestUrl = new URL(gatewayUrl);
requestUrl.searchParams.set("action", "dashboard-data");
requestUrl.searchParams.set("date", process.env.DASHBOARD_DATE || getTodayKstDate());

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
  ...enrichDashboardPayload(payload),
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
