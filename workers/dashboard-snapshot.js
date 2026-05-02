const DEFAULT_SNAPSHOT_KEY = "dashboard-latest.json";
const DEFAULT_FALLBACK_SNAPSHOT_URL = "https://vivaca86.github.io/pp/dashboard-latest.json";
const DEFAULT_USAGE_LOG_RETENTION_DAYS = 90;
const DEFAULT_USAGE_RECENT_LIMIT = 100;
const DEFAULT_SERIES_CACHE_TTL_SECONDS = 6 * 60 * 60;
const EDITABLE_TICKER_COUNT = 6;
const SERIES_CACHE_VERSION = "v1";
const SERIES_MISS_FALLBACK_THRESHOLD = 3;
const SERIES_FULL_RACE_DELAY_MS = 100;
const KRX_FIXED_MARKET_CLOSURE_MMDD = new Set(["05-01", "12-31"]);
const KRX_KNOWN_MARKET_CLOSURES = new Set([
  "2026-05-01"
]);
const USAGE_EVENT_LABELS = {
  calculator_view: "계산기 열림",
  calculator_input: "계산기 입력",
  calculator_reset: "계산기 초기화",
  dashboard_view: "등가율 열림",
  dashboard_load: "등가율 로드",
  dashboard_search: "등가율 종목 검색",
  recommendation_view: "종목추천 열림",
  recommendation_run: "종목추천 실행",
  recommendation_add: "추천 종목 추가"
};

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function addDaysIso(dateText, offsetDays) {
  const date = new Date(`${dateText}T12:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + Number(offsetDays || 0));
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function isWeekendIso(dateText) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short"
  }).format(new Date(`${dateText}T12:00:00+09:00`));
  return weekday === "Sat" || weekday === "Sun";
}

function isKrxMarketClosure(dateText) {
  const normalized = String(dateText || "").trim();
  if (!isIsoDate(normalized)) return true;
  return KRX_FIXED_MARKET_CLOSURE_MMDD.has(normalized.slice(5))
    || KRX_KNOWN_MARKET_CLOSURES.has(normalized);
}

function isKrxTradingDay(dateText) {
  const normalized = String(dateText || "").trim();
  return isIsoDate(normalized) && !isWeekendIso(normalized) && !isKrxMarketClosure(normalized);
}

function resolveKrxTradingDate(dateText) {
  let cursor = String(dateText || "").trim();
  if (!isIsoDate(cursor)) return "";
  for (let guard = 0; guard < 370; guard += 1) {
    if (isKrxTradingDay(cursor)) return cursor;
    cursor = addDaysIso(cursor, -1);
  }
  return cursor;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}

function jsonResponse(payload, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));

  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers
  });
}

function emptyResponse(status = 204) {
  return new Response(null, {
    status,
    headers: corsHeaders()
  });
}

function isSnapshotRoute(pathname) {
  return pathname === "/dashboard-latest.json"
    || pathname === "/dashboard"
    || pathname === "/snapshot";
}

function isUsageLogRoute(pathname) {
  return pathname === "/usage-log";
}

function isUsageSummaryRoute(pathname) {
  return pathname === "/usage-summary";
}

function isUsageEventsRoute(pathname) {
  return pathname === "/usage-events";
}

function isDashboardApiV2Route(pathname) {
  return pathname === "/dashboard-api-v2"
    || pathname === "/dashboard-data-api-v2";
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getKstDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(day, offset) {
  const date = new Date(`${day}T12:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + offset);
  return getKstDay(date);
}

function safeText(value, maxLength = 80) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength);
}

function safeDate(value) {
  const text = safeText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function sanitizeStockCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^KRX:/, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 9);
}

function safeMetadataKey(value) {
  return safeText(value, 40).replace(/[^A-Za-z0-9_-]/g, "");
}

function normalizeUsageEventName(value) {
  const event = safeText(value, 48).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return Object.prototype.hasOwnProperty.call(USAGE_EVENT_LABELS, event) ? event : "unknown";
}

function sanitizeMetadataValue(raw, depth = 0) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? Number(raw.toFixed(6)) : null;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") return safeText(raw, 160);
  if (Array.isArray(raw)) {
    if (depth >= 3) return [];
    return raw.slice(0, 20).map((item) => sanitizeMetadataValue(item, depth + 1));
  }
  if (typeof raw === "object") {
    if (depth >= 3) return {};
    return Object.entries(raw).slice(0, 40).reduce((acc, [key, value]) => {
      const safeKey = safeMetadataKey(key);
      if (!safeKey) return acc;
      acc[safeKey] = sanitizeMetadataValue(value, depth + 1);
      return acc;
    }, {});
  }
  return safeText(raw, 80);
}

function sanitizeUsageMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowedKeys = [
    "source",
    "reason",
    "field",
    "state",
    "cardIndex",
    "high",
    "low",
    "spread",
    "spreadRatePct",
    "levels",
    "slots",
    "slotCodes",
    "slotNames",
    "searchedStocks",
    "selectedDateRow",
    "requestedDate",
    "cacheHits",
    "cacheMisses",
    "fallback",
    "fallbackReason",
    "workerDurationMs",
    "periodMonths",
    "level",
    "mode",
    "lookbackDays",
    "tolerance",
    "universe",
    "slotTarget",
    "resultCount"
  ];
  const metadata = {};
  allowedKeys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return;
    metadata[key] = sanitizeMetadataValue(value[key]);
  });
  return metadata;
}

function getSeriesCacheTtlSeconds(env) {
  return clampNumber(
    env.SERIES_CACHE_TTL_SECONDS,
    60,
    7 * 24 * 60 * 60,
    DEFAULT_SERIES_CACHE_TTL_SECONDS
  );
}

function getAppsScriptGatewayUrl(env) {
  return String(env.APPS_SCRIPT_GATEWAY_URL || "").trim();
}

function buildAppsScriptUrl(env, params) {
  const gatewayUrl = getAppsScriptGatewayUrl(env);
  if (!gatewayUrl) return "";
  const url = new URL(gatewayUrl);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJsonWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      const message = payload?.error?.message || payload?.message || `Request failed (${response.status})`;
      throw new Error(message);
    }
    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseDashboardTickers(rawValue) {
  const tickers = String(rawValue || "")
    .split(",")
    .map(sanitizeStockCode);
  if (tickers.length !== EDITABLE_TICKER_COUNT) return null;
  return tickers;
}

function parseDelimitedText(rawValue, count, maxLength = 80) {
  const items = String(rawValue || "")
    .split(",")
    .map((item) => safeText(item || "", maxLength));
  while (items.length < count) items.push("");
  return items.slice(0, count);
}

function buildDashboardTargets(tickers, names = [], markets = []) {
  return [
    {
      cacheCode: "0001",
      code: "0001",
      displayCode: "KOSPI",
      name: "KOSPI",
      market: "KOSPI",
      assetType: "index",
      editable: false
    },
    {
      cacheCode: "1001",
      code: "1001",
      displayCode: "KOSDAQ",
      name: "KOSDAQ",
      market: "KOSDAQ",
      assetType: "index",
      editable: false
    },
    ...tickers.map((code, index) => ({
      cacheCode: code || `empty-${index + 1}`,
      code,
      displayCode: code,
      name: names[index] || code || "Unknown",
      market: markets[index] || "KRX",
      assetType: "stock",
      editable: true,
      id: index + 1
    }))
  ];
}

function buildSeriesCacheKey(date, target) {
  return [
    "dashboard-series",
    SERIES_CACHE_VERSION,
    safeDate(date),
    target.assetType,
    sanitizeStockCode(target.cacheCode || target.code)
  ].join(":");
}

async function readCachedSeries(env, key) {
  if (!env.PP_DASHBOARD_SNAPSHOT?.get) return null;
  try {
    const record = await env.PP_DASHBOARD_SNAPSHOT.get(key, {
      type: "json",
      cacheTtl: 30
    });
    if (!record?.series?.slot || !Array.isArray(record.series.rows)) return null;
    return record;
  } catch {
    return null;
  }
}

async function writeCachedSeries(env, key, record) {
  if (!env.PP_DASHBOARD_SNAPSHOT?.put || !record?.series?.slot || !Array.isArray(record.series.rows)) return;
  await env.PP_DASHBOARD_SNAPSHOT.put(key, JSON.stringify(record), {
    expirationTtl: getSeriesCacheTtlSeconds(env)
  });
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function roundNumber(value, digits = 8) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const factor = 10 ** digits;
  return Math.round(parsed * factor) / factor;
}

function formatHumanDate(dateIso) {
  return safeDate(dateIso).replace(/-/g, ".");
}

function formatMonthDay(dateIso) {
  const normalized = safeDate(dateIso);
  return normalized ? normalized.slice(5) : "";
}

function formatPercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return `${parsed > 0 ? "+" : ""}${(parsed * 100).toFixed(2)}%`;
}

function normalizeSeriesRecord(record, target, selectedDate) {
  const rows = Array.isArray(record?.series?.rows)
    ? record.series.rows
      .filter((row) => safeDate(row?.date))
      .map((row) => ({
        date: safeDate(row.date),
        close: isFiniteNumber(row.close) ? Number(row.close) : null,
        equalRate: isFiniteNumber(row.equalRate) ? Number(row.equalRate) : null
      }))
    : [];
  const slot = {
    ...(record?.series?.slot || {}),
    code: record?.series?.slot?.code || target.displayCode || target.code,
    name: record?.series?.slot?.name || target.name,
    market: record?.series?.slot?.market || target.market,
    assetType: record?.series?.slot?.assetType || target.assetType,
    editable: Boolean(target.editable),
    ...(target.editable ? { id: target.id } : {})
  };

  return {
    ok: true,
    selectedDate: safeDate(record?.selectedDate) || selectedDate,
    selectedDateLabel: record?.selectedDateLabel || formatHumanDate(selectedDate),
    selectedDateIsTradingDay: record?.selectedDateIsTradingDay !== false,
    today: safeDate(record?.today) || getKstDay(),
    marketHolidays: Array.isArray(record?.marketHolidays) ? record.marketHolidays.filter(safeDate) : [],
    updatedAt: record?.updatedAt || new Date().toISOString(),
    series: {
      cacheCode: target.cacheCode,
      assetType: target.assetType,
      slot,
      rows,
      lastTradingDate: safeDate(record?.series?.lastTradingDate) || ""
    }
  };
}

async function fetchDashboardPayloadFromAppsScript(env, date, tickers) {
  const url = buildAppsScriptUrl(env, {
    action: "dashboard-data-api",
    date,
    tickers: tickers.join(",")
  });
  if (!url) throw new Error("APPS_SCRIPT_GATEWAY_URL is not configured.");
  return fetchJsonWithTimeout(url, 16000);
}

async function fetchSeriesRecordFromAppsScript(env, date, target) {
  const url = buildAppsScriptUrl(env, {
    action: "dashboard-series-api",
    date,
    code: target.code,
    assetType: target.assetType,
    slotId: target.id || "",
    name: target.editable ? target.name : "",
    market: target.editable ? target.market : ""
  });
  if (!url) throw new Error("APPS_SCRIPT_GATEWAY_URL is not configured.");
  const payload = await fetchJsonWithTimeout(url, 12000);
  return normalizeSeriesRecord(payload, target, safeDate(payload.selectedDate) || resolveKrxTradingDate(date) || date);
}

function buildSeriesRecordsFromDashboardPayload(payload, targets) {
  const selectedDate = safeDate(payload?.selectedDate) || "";
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const slots = Array.isArray(payload?.slots) ? payload.slots : [];

  return targets.map((target, slotIndex) => {
    const seriesRows = rows
      .filter((row) => safeDate(row?.date))
      .map((row) => {
        const value = row.values && row.values[slotIndex] ? row.values[slotIndex].value : null;
        return {
          date: safeDate(row.date),
          equalRate: isFiniteNumber(value) ? Number(value) : null
        };
      });
    return normalizeSeriesRecord({
      selectedDate,
      selectedDateLabel: payload.selectedDateLabel,
      selectedDateIsTradingDay: payload.selectedDateIsTradingDay,
      today: payload.today,
      marketHolidays: payload.marketHolidays,
      updatedAt: payload.updatedAt,
      series: {
        slot: slots[slotIndex] || target,
        rows: seriesRows,
        lastTradingDate: payload.lastTradingDate
      }
    }, target, selectedDate);
  });
}

function seedSeriesCacheFromDashboardPayload(env, payload, targets) {
  const selectedDate = safeDate(payload?.selectedDate);
  if (!selectedDate) return Promise.resolve();
  const records = buildSeriesRecordsFromDashboardPayload(payload, targets);
  return Promise.all(records.map((record, index) => (
    writeCachedSeries(env, buildSeriesCacheKey(selectedDate, targets[index]), record)
  )));
}

function withWorkerSeriesMetadata(payload, metadata) {
  return {
    ...payload,
    sourceMode: "worker-series-cache",
    apiComputed: true,
    workerSeriesCache: metadata
  };
}

function buildDashboardPayloadFromSeriesRecords(records, requestedDate, metrics) {
  const selectedDate = safeDate(records.find((record) => safeDate(record.selectedDate))?.selectedDate)
    || resolveKrxTradingDate(requestedDate)
    || requestedDate;
  const selectedMonth = selectedDate.slice(0, 7);
  const dateSet = new Set();
  const marketHolidaySet = new Set();

  records.forEach((record) => {
    (record.marketHolidays || []).forEach((day) => {
      if (safeDate(day)) marketHolidaySet.add(day);
    });
    (record.series.rows || []).forEach((row) => {
      const rowDate = safeDate(row.date);
      if (rowDate && rowDate.slice(0, 7) === selectedMonth && rowDate <= selectedDate) {
        dateSet.add(rowDate);
      }
    });
  });

  const dates = [...dateSet].sort();
  const rowMaps = records.map((record) => {
    const map = new Map();
    (record.series.rows || []).forEach((row) => {
      if (safeDate(row.date)) map.set(row.date, row);
    });
    return map;
  });
  const dashboardRows = dates.map((date) => ({
    date,
    displayDate: formatMonthDay(date),
    values: rowMaps.map((map) => {
      const item = map.get(date);
      const value = item && isFiniteNumber(item.equalRate) ? roundNumber(item.equalRate, 8) : null;
      return {
        value,
        display: isFiniteNumber(value) ? formatPercent(value) : "-"
      };
    })
  }));
  const slots = records.map((record, slotIndex) => {
    const total = dashboardRows.reduce((sum, row) => {
      const value = row.values[slotIndex]?.value;
      return sum + (isFiniteNumber(value) ? Number(value) : 0);
    }, 0);
    return {
      ...record.series.slot,
      total: roundNumber(total, 8)
    };
  });
  const lastTradingDate = dates.length ? dates[dates.length - 1] : selectedDate;

  return {
    ok: true,
    service: "pp-dashboard-snapshot",
    spreadsheetTitle: "worker-series-cache",
    selectedDate,
    selectedDateLabel: formatHumanDate(selectedDate),
    selectedDateIsTradingDay: records.every((record) => record.selectedDateIsTradingDay !== false),
    today: records.find((record) => safeDate(record.today))?.today || getKstDay(),
    lastTradingDate,
    lastTradingDateLabel: formatHumanDate(lastTradingDate),
    tradingDateCount: dashboardRows.length,
    marketHolidays: [...marketHolidaySet].sort(),
    slots,
    rows: dashboardRows,
    updatedAt: new Date().toISOString(),
    sourceMode: "worker-series-cache",
    apiComputed: true,
    workerSeriesCache: metrics
  };
}

async function serveDashboardApiV2(request, env, ctx) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const requestedDate = safeDate(url.searchParams.get("date")) || getKstDay();
  const estimatedDate = resolveKrxTradingDate(requestedDate) || requestedDate;
  const tickers = parseDashboardTickers(url.searchParams.get("tickers"));
  const names = parseDelimitedText(url.searchParams.get("names"), EDITABLE_TICKER_COUNT);
  const markets = parseDelimitedText(url.searchParams.get("markets"), EDITABLE_TICKER_COUNT, 16);

  if (!tickers) {
    return jsonResponse({
      ok: false,
      error: "invalid_tickers",
      message: `tickers must contain ${EDITABLE_TICKER_COUNT} comma-separated values.`
    }, {
      status: 400,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const targets = buildDashboardTargets(tickers, names, markets);
  const metrics = {
    requestedDate,
    estimatedDate,
    hits: 0,
    misses: 0,
    fallback: false,
    fallbackReason: "",
    durationMs: 0
  };

  const fallbackToFullPayload = async (reason) => {
    metrics.fallback = true;
    metrics.fallbackReason = reason;
    const payload = await fetchDashboardPayloadFromAppsScript(env, requestedDate, tickers);
    if (ctx?.waitUntil) {
      ctx.waitUntil(seedSeriesCacheFromDashboardPayload(env, payload, targets));
    }
    metrics.durationMs = Date.now() - startedAt;
    return withWorkerSeriesMetadata(payload, metrics);
  };

  if (!env.PP_DASHBOARD_SNAPSHOT?.get || !env.PP_DASHBOARD_SNAPSHOT?.put) {
    const payload = await fallbackToFullPayload("kv_missing");
    return jsonResponse(payload, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const cacheKeys = targets.map((target) => buildSeriesCacheKey(estimatedDate, target));
    const cachedRecords = await Promise.all(cacheKeys.map((key) => readCachedSeries(env, key)));
    const records = new Array(targets.length);
    const misses = [];

    cachedRecords.forEach((record, index) => {
      if (record) {
        metrics.hits += 1;
        records[index] = normalizeSeriesRecord(record, targets[index], estimatedDate);
      } else {
        metrics.misses += 1;
        misses.push(index);
      }
    });

    if (misses.length > SERIES_MISS_FALLBACK_THRESHOLD) {
      const payload = await fallbackToFullPayload("too_many_misses");
      return jsonResponse(payload, { headers: { "Cache-Control": "no-store" } });
    }

    const fetchMissingSeries = async () => {
      await Promise.all(misses.map(async (index) => {
        const target = targets[index];
        const record = await fetchSeriesRecordFromAppsScript(env, requestedDate, target);
        records[index] = record;
        if (safeDate(record.selectedDate) === estimatedDate) {
          await writeCachedSeries(env, cacheKeys[index], record);
        } else if (safeDate(record.selectedDate)) {
          await writeCachedSeries(env, buildSeriesCacheKey(record.selectedDate, target), record);
        }
      }));

      const selectedDates = new Set(records.map((record) => safeDate(record?.selectedDate)).filter(Boolean));
      if (selectedDates.size > 1) {
        throw new Error("selected_date_mismatch");
      }

      metrics.durationMs = Date.now() - startedAt;
      return buildDashboardPayloadFromSeriesRecords(records, requestedDate, metrics);
    };

    if (misses.length > 0) {
      let fallbackStarted = false;
      let fallbackTimer = 0;
      let cancelDelayedFallback = false;
      const delayedFallback = new Promise((resolve, reject) => {
        fallbackTimer = setTimeout(() => {
          if (cancelDelayedFallback) return;
          fallbackStarted = true;
          fallbackToFullPayload("series_race_full").then(resolve, reject);
        }, SERIES_FULL_RACE_DELAY_MS);
      });
      const seriesResult = fetchMissingSeries();
      const raceResult = await Promise.race([
        seriesResult.then((payload) => ({ type: "series", payload })),
        delayedFallback.then((payload) => ({ type: "fallback", payload }))
      ]);

      if (raceResult.type === "series") {
        cancelDelayedFallback = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        return jsonResponse(raceResult.payload, {
          headers: {
            "Cache-Control": "no-store"
          }
        });
      }

      if (ctx?.waitUntil && !fallbackStarted) {
        ctx.waitUntil(seriesResult.catch(() => null));
      }

      return jsonResponse(raceResult.payload, { headers: { "Cache-Control": "no-store" } });
    }

    metrics.durationMs = Date.now() - startedAt;
    return jsonResponse(buildDashboardPayloadFromSeriesRecords(records, requestedDate, metrics), {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    try {
      const payload = await fallbackToFullPayload(String(error?.message || "series_failed").slice(0, 80));
      return jsonResponse(payload, { headers: { "Cache-Control": "no-store" } });
    } catch (fallbackError) {
      return jsonResponse({
        ok: false,
        error: "dashboard_api_v2_failed",
        message: String(fallbackError?.message || error?.message || "Dashboard API v2 failed.")
      }, {
        status: 502,
        headers: { "Cache-Control": "no-store" }
      });
    }
  }
}

function createEmptyUsageSummary(day) {
  return {
    day,
    total: 0,
    events: {},
    views: {},
    successes: 0,
    failures: 0,
    avgDurationMs: null,
    durationCount: 0,
    durationTotalMs: 0,
    updatedAt: null
  };
}

function compactUsageEvent(event) {
  return {
    id: event.id,
    event: event.event,
    label: USAGE_EVENT_LABELS[event.event] || event.event,
    view: event.view,
    selectedDate: event.selectedDate,
    success: event.success,
    durationMs: event.durationMs,
    metadata: event.metadata,
    createdAt: event.createdAt,
    day: event.day
  };
}

function isPublicUsageEvent(event) {
  const source = String(event?.metadata?.source || "pp-web").trim();
  return !source || source === "pp-web";
}

function subtractUsageEventFromSummary(summary, event) {
  if (!summary || !event) return;
  summary.total = Math.max(0, Number(summary.total || 0) - 1);
  if (summary.events && event.event) {
    summary.events[event.event] = Math.max(0, Number(summary.events[event.event] || 0) - 1);
    if (!summary.events[event.event]) delete summary.events[event.event];
  }
  if (summary.views && event.view) {
    summary.views[event.view] = Math.max(0, Number(summary.views[event.view] || 0) - 1);
    if (!summary.views[event.view]) delete summary.views[event.view];
  }
  if (event.success === true) summary.successes = Math.max(0, Number(summary.successes || 0) - 1);
  if (event.success === false) summary.failures = Math.max(0, Number(summary.failures || 0) - 1);
  if (Number.isFinite(event.durationMs) && Number(summary.durationCount || 0) > 0) {
    summary.durationCount = Math.max(0, Number(summary.durationCount || 0) - 1);
    summary.durationTotalMs = Math.max(0, Number(summary.durationTotalMs || 0) - Number(event.durationMs || 0));
    summary.avgDurationMs = summary.durationCount
      ? Math.round(summary.durationTotalMs / summary.durationCount)
      : null;
  }
}

function getUsageKv(env) {
  return env.PP_USAGE_LOGS || env.PP_DASHBOARD_SNAPSHOT || null;
}

async function parseUsageRequest(request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 16384) return null;

  let payload = null;
  try {
    payload = await request.json();
  } catch {
    return null;
  }

  const now = new Date();
  const event = normalizeUsageEventName(payload?.event);
  if (event === "unknown") return null;

  const view = safeText(payload?.view, 32).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const durationMs = Number(payload?.durationMs);

  return {
    id: crypto.randomUUID(),
    event,
    view: view || "",
    selectedDate: safeDate(payload?.selectedDate),
    success: payload?.success === undefined ? null : Boolean(payload.success),
    durationMs: Number.isFinite(durationMs) ? clampNumber(durationMs, 0, 10 * 60 * 1000, 0) : null,
    metadata: sanitizeUsageMetadata(payload?.metadata),
    createdAt: now.toISOString(),
    day: getKstDay(now)
  };
}

async function updateUsageSummary(env, event, expirationTtl) {
  const usageKv = getUsageKv(env);
  if (!usageKv) return;
  const key = `usage:summary:${event.day}`;
  let summary = createEmptyUsageSummary(event.day);
  try {
    const stored = await usageKv.get(key, { type: "json" });
    if (stored && typeof stored === "object") {
      summary = {
        ...summary,
        ...stored,
        events: stored.events && typeof stored.events === "object" ? stored.events : {},
        views: stored.views && typeof stored.views === "object" ? stored.views : {}
      };
    }
  } catch {
    summary = createEmptyUsageSummary(event.day);
  }

  summary.total = Number(summary.total || 0) + 1;
  summary.events[event.event] = Number(summary.events[event.event] || 0) + 1;
  if (event.view) summary.views[event.view] = Number(summary.views[event.view] || 0) + 1;
  if (event.success === true) summary.successes = Number(summary.successes || 0) + 1;
  if (event.success === false) summary.failures = Number(summary.failures || 0) + 1;
  if (Number.isFinite(event.durationMs)) {
    summary.durationCount = Number(summary.durationCount || 0) + 1;
    summary.durationTotalMs = Number(summary.durationTotalMs || 0) + Number(event.durationMs);
    summary.avgDurationMs = Math.round(summary.durationTotalMs / summary.durationCount);
  }
  summary.updatedAt = new Date().toISOString();

  await usageKv.put(key, JSON.stringify(summary), { expirationTtl });
}

async function updateRecentUsageEvents(env, event, expirationTtl) {
  const usageKv = getUsageKv(env);
  if (!usageKv) return;
  const key = "usage:recent";
  let events = [];
  try {
    const stored = await usageKv.get(key, { type: "json" });
    if (Array.isArray(stored)) events = stored;
  } catch {
    events = [];
  }

  events.unshift(compactUsageEvent(event));
  events = events.slice(0, DEFAULT_USAGE_RECENT_LIMIT);
  await usageKv.put(key, JSON.stringify(events), { expirationTtl });
}

async function storeUsageEvent(env, event) {
  const usageKv = getUsageKv(env);
  if (!usageKv?.put) return;
  const retentionDays = clampNumber(env.USAGE_LOG_RETENTION_DAYS, 1, 365, DEFAULT_USAGE_LOG_RETENTION_DAYS);
  const expirationTtl = Math.round(retentionDays * 24 * 60 * 60);
  const eventKey = `usage:event:${event.day}:${event.createdAt}:${event.id}`;

  await Promise.all([
    usageKv.put(eventKey, JSON.stringify(compactUsageEvent(event)), { expirationTtl }),
    updateUsageSummary(env, event, expirationTtl),
    updateRecentUsageEvents(env, event, expirationTtl)
  ]);
}

async function serveUsageLog(request, env, ctx) {
  if (request.method !== "POST") {
    return jsonResponse({
      ok: false,
      error: "method_not_allowed"
    }, {
      status: 405,
      headers: { Allow: "POST, OPTIONS" }
    });
  }

  const event = await parseUsageRequest(request);
  if (event) {
    const task = storeUsageEvent(env, event).catch((error) => {
      console.warn("usage log write failed", error);
    });
    if (ctx?.waitUntil) {
      ctx.waitUntil(task);
    } else {
      await task;
    }
  }

  return emptyResponse(204);
}

async function serveUsageSummary(request, env) {
  const usageKv = getUsageKv(env);

  if (!usageKv?.get) {
    return jsonResponse({
      ok: false,
      error: "usage_log_kv_missing"
    }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const url = new URL(request.url);
  const days = clampNumber(url.searchParams.get("days"), 1, 30, 7);
  const today = getKstDay();
  const summaries = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = addDays(today, -index);
    const stored = await usageKv.get(`usage:summary:${day}`, { type: "json" });
    summaries.push({
      ...createEmptyUsageSummary(day),
      ...(stored && typeof stored === "object" ? stored : {})
    });
  }

  const summaryByDay = new Map(summaries.map((summary) => [summary.day, summary]));
  const recentEvents = await usageKv.get("usage:recent", { type: "json" });
  if (Array.isArray(recentEvents)) {
    recentEvents.forEach((event) => {
      if (isPublicUsageEvent(event)) return;
      subtractUsageEventFromSummary(summaryByDay.get(event.day), event);
    });
  }

  const totals = summaries.reduce((acc, summary) => {
    acc.total += Number(summary.total || 0);
    Object.entries(summary.events || {}).forEach(([event, count]) => {
      acc.events[event] = Number(acc.events[event] || 0) + Number(count || 0);
    });
    return acc;
  }, { total: 0, events: {} });

  return jsonResponse({
    ok: true,
    labels: USAGE_EVENT_LABELS,
    today: summaries[summaries.length - 1] || createEmptyUsageSummary(today),
    days: summaries,
    totals,
    servedAt: new Date().toISOString()
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}

async function serveUsageEvents(request, env) {
  const usageKv = getUsageKv(env);

  if (!usageKv?.get) {
    return jsonResponse({
      ok: false,
      error: "usage_log_kv_missing"
    }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const url = new URL(request.url);
  const limit = clampNumber(url.searchParams.get("limit"), 1, 200, 50);
  const includeDebug = url.searchParams.get("debug") === "1";
  const stored = await usageKv.get("usage:recent", { type: "json" });
  const events = Array.isArray(stored)
    ? stored.filter((event) => includeDebug || isPublicUsageEvent(event)).slice(0, limit)
    : [];

  return jsonResponse({
    ok: true,
    labels: USAGE_EVENT_LABELS,
    events,
    servedAt: new Date().toISOString()
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}

function parseSnapshot(text) {
  try {
    const payload = JSON.parse(text);
    if (
      payload
      && payload.ok
      && payload.selectedDate
      && Array.isArray(payload.rows)
      && Array.isArray(payload.slots)
    ) {
      return payload;
    }
  } catch {
    return null;
  }
  return null;
}

async function readSnapshotFromKv(env, key) {
  if (!env.PP_DASHBOARD_SNAPSHOT?.get) return null;
  const text = await env.PP_DASHBOARD_SNAPSHOT.get(key, {
    cacheTtl: 30
  });
  return text ? { text, source: "cloudflare-kv" } : null;
}

async function readSnapshotFromFallback(env) {
  const fallbackUrl = env.FALLBACK_SNAPSHOT_URL || DEFAULT_FALLBACK_SNAPSHOT_URL;
  if (!fallbackUrl) return null;

  const response = await fetch(fallbackUrl, {
    headers: {
      accept: "application/json"
    },
    cf: {
      cacheTtl: 30,
      cacheEverything: true
    }
  });

  if (!response.ok) return null;
  return {
    text: await response.text(),
    source: "github-pages-fallback"
  };
}

function withEdgeMetadata(payload, source) {
  return {
    ...payload,
    sourceMode: source === "cloudflare-kv" ? "cloudflare-kv" : "static-snapshot",
    staticSnapshot: true,
    edgeSource: source,
    edgeServedAt: new Date().toISOString()
  };
}

async function serveSnapshot(request, env) {
  const url = new URL(request.url);
  const requestedDate = String(url.searchParams.get("date") || "").trim();
  const effectiveRequestedDate = requestedDate ? resolveKrxTradingDate(requestedDate) : "";
  const key = env.SNAPSHOT_KEY || DEFAULT_SNAPSHOT_KEY;

  const record = await readSnapshotFromKv(env, key)
    || await readSnapshotFromFallback(env);

  if (!record) {
    return jsonResponse({
      ok: false,
      error: "snapshot_unavailable",
      message: "No dashboard snapshot is available from KV or fallback."
    }, {
      status: 503,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const payload = parseSnapshot(record.text);
  if (!payload) {
    return jsonResponse({
      ok: false,
      error: "snapshot_invalid",
      source: record.source
    }, {
      status: 502,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  if (!isKrxTradingDay(payload.selectedDate)) {
    return jsonResponse({
      ok: false,
      error: "snapshot_market_holiday",
      selectedDate: payload.selectedDate,
      source: record.source
    }, {
      status: 404,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  if (effectiveRequestedDate && payload.selectedDate !== effectiveRequestedDate) {
    return jsonResponse({
      ok: false,
      error: "snapshot_date_mismatch",
      requestedDate,
      effectiveRequestedDate,
      selectedDate: payload.selectedDate,
      source: record.source
    }, {
      status: 404,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const headers = {
    "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60"
  };

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        ...headers,
        ...corsHeaders(),
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  return jsonResponse(withEdgeMetadata(payload, record.source), {
    status: 200,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return emptyResponse();
    }

    if (isUsageLogRoute(url.pathname)) {
      return serveUsageLog(request, env, ctx);
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonResponse({
        ok: false,
        error: "method_not_allowed"
      }, {
        status: 405,
        headers: {
          Allow: "GET, HEAD, OPTIONS"
        }
      });
    }

    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({
        ok: true,
        service: "pp-dashboard-snapshot",
        kvBinding: Boolean(env.PP_DASHBOARD_SNAPSHOT?.get),
        usageLogBinding: Boolean(getUsageKv(env)?.get),
        snapshotKey: env.SNAPSHOT_KEY || DEFAULT_SNAPSHOT_KEY
      }, {
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    if (isSnapshotRoute(url.pathname)) {
      return serveSnapshot(request, env);
    }

    if (isDashboardApiV2Route(url.pathname)) {
      return serveDashboardApiV2(request, env, ctx);
    }

    if (isUsageSummaryRoute(url.pathname)) {
      return serveUsageSummary(request, env);
    }

    if (isUsageEventsRoute(url.pathname)) {
      return serveUsageEvents(request, env);
    }

    return jsonResponse({
      ok: false,
      error: "not_found"
    }, {
      status: 404,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }
};
