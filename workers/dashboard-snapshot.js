const DEFAULT_SNAPSHOT_KEY = "dashboard-latest.json";
const DEFAULT_FALLBACK_SNAPSHOT_URL = "https://vivaca86.github.io/pp/dashboard-latest.json";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return emptyResponse();
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
