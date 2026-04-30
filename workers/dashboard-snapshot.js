const DEFAULT_SNAPSHOT_KEY = "dashboard-latest.json";
const DEFAULT_FALLBACK_SNAPSHOT_URL = "https://vivaca86.github.io/pp/dashboard-latest.json";
const DEFAULT_USAGE_LOG_RETENTION_DAYS = 90;
const DEFAULT_USAGE_RECENT_LIMIT = 100;
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
  const stored = await usageKv.get("usage:recent", { type: "json" });
  const events = Array.isArray(stored) ? stored.slice(0, limit) : [];

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

  if (requestedDate && payload.selectedDate !== requestedDate) {
    return jsonResponse({
      ok: false,
      error: "snapshot_date_mismatch",
      requestedDate,
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
