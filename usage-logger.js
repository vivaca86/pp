(function () {
  const CONFIG = window.PP_CONFIG || {};
  const LOG_URL = String(CONFIG.usageLogUrl || "").trim();
  const DEFAULT_DEBOUNCE_MS = 1800;
  const debouncedTimers = new Map();

  const getSelectedDate = () => (
    document.getElementById("date-input")?.value
    || window.state?.selectedDate
    || ""
  );

  const normalizePayload = (event, payload = {}) => ({
    event,
    view: payload.view || window.state?.activeView || "",
    selectedDate: payload.selectedDate || getSelectedDate(),
    success: payload.success,
    durationMs: payload.durationMs,
    metadata: {
      source: "pp-web",
      ...(payload.metadata || {})
    }
  });

  const post = (payload) => {
    if (!LOG_URL) return;

    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(LOG_URL, blob)) return;
      }
    } catch {
      // Ignore usage logging failures. It must never block the app.
    }

    try {
      fetch(LOG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        cache: "no-store"
      }).catch(() => {});
    } catch {
      // no-op
    }
  };

  const track = (event, payload = {}) => {
    post(normalizePayload(event, payload));
  };

  const trackDebounced = (key, event, payload = {}, delayMs = DEFAULT_DEBOUNCE_MS) => {
    const timerKey = String(key || event);
    window.clearTimeout(debouncedTimers.get(timerKey));
    debouncedTimers.set(timerKey, window.setTimeout(() => {
      debouncedTimers.delete(timerKey);
      track(event, payload);
    }, delayMs));
  };

  window.PPUsageLogger = {
    track,
    trackDebounced,
    markStart() {
      return performance.now();
    },
    durationSince(startedAt) {
      const start = Number(startedAt);
      if (!Number.isFinite(start)) return null;
      return Math.max(0, Math.round(performance.now() - start));
    }
  };
})();
