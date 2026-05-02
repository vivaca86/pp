(function () {
  const CONFIG = window.PP_CONFIG || {};
  const LOG_URL = String(CONFIG.usageLogUrl || "").trim();
  const DEFAULT_DEBOUNCE_MS = 1800;
  const QUEUE_KEY = "pp_usage_log_queue_v1";
  const MAX_QUEUE_SIZE = 50;
  const LOG_CONTENT_TYPE = "text/plain;charset=UTF-8";
  const debouncedTimers = new Map();
  let flushing = false;

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

  const readQueue = () => {
    try {
      const value = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      return Array.isArray(value) ? value.filter(Boolean).slice(-MAX_QUEUE_SIZE) : [];
    } catch {
      return [];
    }
  };

  const writeQueue = (items) => {
    try {
      const nextItems = Array.isArray(items) ? items.filter(Boolean).slice(-MAX_QUEUE_SIZE) : [];
      if (nextItems.length) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(nextItems));
      } else {
        localStorage.removeItem(QUEUE_KEY);
      }
    } catch {
      // no-op
    }
  };

  const enqueue = (payload) => {
    writeQueue([...readQueue(), payload]);
  };

  const sendPayload = async (payload) => {
    const response = await fetch(LOG_URL, {
      method: "POST",
      headers: { "Content-Type": LOG_CONTENT_TYPE },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`usage log failed: ${response.status}`);
    }
  };

  const flushQueue = async () => {
    if (!LOG_URL || flushing || navigator.onLine === false) return;

    const queue = readQueue();
    if (!queue.length) return;

    flushing = true;
    const remaining = [];
    try {
      for (let index = 0; index < queue.length; index += 1) {
        try {
          await sendPayload(queue[index]);
        } catch {
          remaining.push(...queue.slice(index));
          break;
        }
      }
    } finally {
      writeQueue(remaining);
      flushing = false;
    }
  };

  const post = (payload) => {
    if (!LOG_URL) return;

    sendPayload(payload)
      .then(() => flushQueue())
      .catch(() => enqueue(payload));
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

  window.addEventListener("online", () => {
    flushQueue().catch(() => {});
  });
  window.setTimeout(() => {
    flushQueue().catch(() => {});
  }, 1200);
})();
