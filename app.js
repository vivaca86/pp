const MARKET_TIMEZONE = "Asia/Seoul";
const SLOT_COUNT = 6;
const STORAGE_LAST_DATE = "stock_lab_selected_date";
const STORAGE_ACTIVE_VIEW = "stock_lab_active_view";
const STORAGE_DASHBOARD_SOURCE_MODE = "stock_lab_dashboard_source_mode";
const STORAGE_DASHBOARD_PAYLOAD = "stock_lab_dashboard_payload_v1";
const STORAGE_STOCK_CATALOG = "stock_lab_stock_catalog_v1";
const DASHBOARD_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const STOCK_CATALOG_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RECOMMENDATION_GATEWAY_COOLDOWN_MS = 8000;
const RECOMMENDATION_RUN_COOLDOWN_MS = 12000;
const RECOMMENDATION_WARMUP_MAX_PERIOD_MONTHS = 12;
const TICKER_DATALIST_ITEM_LIMIT = 12;
const TICKER_DATALIST_MIN_QUERY_LENGTH = 2;
const APP_ERROR_CODES = {
  gatewayMissing: "PP-GATEWAY-MISSING",
  gatewayResponseParse: "PP-GATEWAY-PARSE",
  gatewayRequestFailed: "PP-GATEWAY-REQUEST",
  recommendationCooldown: "PP-RECO-COOLDOWN",
  recommendationSlotMissing: "PP-RECO-SLOT",
  recommendationSlotFull: "PP-RECO-SLOT-FULL",
  recommendationStockMissing: "PP-RECO-STOCK",
  tickerLookupFailed: "PP-TICKER-LOOKUP",
  tickerInputMissing: "PP-TICKER-INPUT",
  dashboardSyncTimeout: "PP-DASHBOARD-SYNC",
  monthlyDataSparse: "PP-DASHBOARD-SPARSE",
  unknown: "PP-UNKNOWN"
};
const DEFAULT_GATEWAY_URL = String(
  window.PP_CONFIG?.gatewayUrl
  || window.STOCK_LAB_CONFIG?.gatewayUrl
  || ""
).trim();
const DEFAULT_DASHBOARD_SNAPSHOT_URL = String(
  window.PP_CONFIG?.dashboardSnapshotUrl
  || "./dashboard-latest.json"
).trim();
const DEFAULT_DASHBOARD_SOURCE_MODE = "api";
const KRX_FIXED_MARKET_CLOSURE_MMDD = new Set(["05-01", "12-31"]);
const KRX_KNOWN_MARKET_CLOSURES = new Set([
  "2026-05-01"
]);
const recommendationWarmupState = {
  completedKeys: new Set(),
  pending: new Map()
};
let recommendationCooldownTimer = 0;
let catalogLoadPromise = null;
let catalogLoaded = false;

const KOSPI_BENCHMARK = {
  code: "0001",
  name: "KOSPI",
  market: "KOSPI",
  assetType: "index",
  editable: false
};

const KOSDAQ_BENCHMARK = {
  code: "1001",
  name: "KOSDAQ",
  market: "KOSDAQ",
  assetType: "index",
  editable: false
};

const FIXED_SLOTS = [KOSPI_BENCHMARK, KOSDAQ_BENCHMARK];

const LOCAL_STOCK_CATALOG = [
  { code: "005930", name: "삼성전자", market: "KOSPI", assetType: "stock" },
  { code: "000660", name: "SK하이닉스", market: "KOSPI", assetType: "stock" },
  { code: "035420", name: "NAVER", market: "KOSPI", assetType: "stock" },
  { code: "035720", name: "카카오", market: "KOSPI", assetType: "stock" },
  { code: "293490", name: "카카오게임즈", market: "KOSDAQ", assetType: "stock" },
  { code: "005380", name: "현대차", market: "KOSPI", assetType: "stock" },
  { code: "373220", name: "LG에너지솔루션", market: "KOSPI", assetType: "stock" },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI", assetType: "stock" },
  { code: "051910", name: "LG화학", market: "KOSPI", assetType: "stock" },
  { code: "006400", name: "삼성SDI", market: "KOSPI", assetType: "stock" },
  { code: "068270", name: "셀트리온", market: "KOSPI", assetType: "stock" },
  { code: "247540", name: "에코프로비엠", market: "KOSDAQ", assetType: "stock" },
  { code: "086520", name: "에코프로", market: "KOSDAQ", assetType: "stock" },
  { code: "196170", name: "알테오젠", market: "KOSDAQ", assetType: "stock" },
  { code: "058470", name: "리노공업", market: "KOSDAQ", assetType: "stock" },
  { code: "263750", name: "펄어비스", market: "KOSDAQ", assetType: "stock" },
  { code: "112040", name: "위메이드", market: "KOSDAQ", assetType: "stock" },
  { code: "091990", name: "셀트리온헬스케어", market: "KOSDAQ", assetType: "stock" },
  { code: "039030", name: "이오테크닉스", market: "KOSDAQ", assetType: "stock" }
];

const QUICK_STOCK_CATALOG = [
  { code: "0183V0", name: "KIWOOM 삼성전자&SK하이닉스채권혼합50", market: "KOSPI", assetType: "etf" },
  { code: "000660", name: "SK하이닉스", market: "KOSPI", assetType: "stock" },
  { code: "213420", name: "덕산네오룩스", market: "KOSDAQ", assetType: "stock" },
  { code: "042700", name: "한미반도체", market: "KOSPI", assetType: "stock" },
  { code: "319660", name: "피에스케이", market: "KOSDAQ", assetType: "stock" },
  { code: "Q530095", name: "삼성 구리 선물 ETN(H)", market: "KOSPI", assetType: "etn" },
  { code: "005930", name: "삼성전자", market: "KOSPI", assetType: "stock" }
];

LOCAL_STOCK_CATALOG.unshift(...QUICK_STOCK_CATALOG);

const DEFAULT_SLOT_CODES = ["", "", "", "", "", ""];

const DEMO_SERIES = {
  "0001": { baselineClose: 2456.18, closes: [2480.21, 2411.77, 2452.44, 2479.82, 2498.53, 2521.12, 2528.73, 2516.04] },
  "1001": { baselineClose: 681.22, closes: [689.34, 671.82, 678.55, 694.23, 701.18, 718.64, 724.11, 719.52] },
  "005930": { baselineClose: 187000, closes: [189650, 178400, 186200, 193100, 196500, 210500, 204000, 200500] },
  "000660": { baselineClose: 882000, closes: [897000, 830000, 876000, 886000, 916000, 1033000, 998000, 982000] },
  "035420": { baselineClose: 189000, closes: [192200, 186000, 188400, 194600, 197200, 201500, 199800, 198900] },
  "247540": { baselineClose: 165000, closes: [168500, 159200, 162400, 171600, 176800, 182500, 179300, 177100] },
  "086520": { baselineClose: 91500, closes: [93200, 88800, 90100, 95400, 96800, 99500, 98200, 97500] },
  "196170": { baselineClose: 280000, closes: [284000, 271500, 278000, 286500, 295000, 304000, 299500, 297000] }
};

const state = {
  gatewayUrl: DEFAULT_GATEWAY_URL,
  catalog: [...LOCAL_STOCK_CATALOG],
  selectedDate: "",
  editableSlots: [],
  loading: false,
  saving: false,
  dataMode: "demo",
  session: "historical",
  dashboard: null,
  dashboardFromCache: false,
  snapshotStatus: null,
  snapshotRefreshing: false,
  dashboardRefreshSeq: 0,
  activeView: "calculator",
  lastDashboardLoadedAt: 0,
  mobileSlideIndex: 0,
  monthlyCache: new Map(),
  recommendations: {
    items: [],
    summary: "필터를 고른 뒤 추천 찾기를 누르면 후보 종목이 여기에 표시됩니다.",
    filters: {
      universe: "KOSDAQ150",
      periodMonths: 6,
      level: 0.382,
      mode: "near",
      lookbackDays: 1,
      tolerance: 0.01,
      sortBy: "distance_abs",
      slotTarget: "auto"
    },
    filtersCollapsed: false,
    loading: false,
    cooldownUntil: 0
  }
};

const elements = {
  dateInput: document.getElementById("date-input"),
  setupCard: document.getElementById("setup-card"),
  statusPill: document.getElementById("status-pill"),
  updatedAt: document.getElementById("updated-at"),
  snapshotHealth: document.getElementById("snapshot-health"),
  snapshotHealthText: document.getElementById("snapshot-health-text"),
  snapshotRefreshButton: document.getElementById("snapshot-refresh-button"),
  slotGrid: document.getElementById("slot-grid"),
  tableHead: document.getElementById("table-head"),
  tableBody: document.getElementById("table-body"),
  mobileCompare: document.getElementById("mobile-compare"),
  mobileCompareControls: document.getElementById("mobile-compare-controls"),
  mobilePrevButton: document.getElementById("mobile-prev-button"),
  mobileNextButton: document.getElementById("mobile-next-button"),
  mobileCompareCount: document.getElementById("mobile-compare-count"),
  mobileCompareTrack: document.getElementById("mobile-compare-track"),
  mobileCompareDots: document.getElementById("mobile-compare-dots"),
  recommendationRunButton: document.getElementById("recommendation-run-button"),
  recommendationFilterToggle: document.getElementById("recommendation-filter-toggle"),
  recommendationFilterToggleState: document.getElementById("recommendation-filter-toggle-state"),
  recommendationFilterSummaryInline: document.getElementById("recommendation-filter-summary-inline"),
  recommendationFiltersPanel: document.getElementById("recommendation-filters-panel"),
  recommendationUniverse: document.getElementById("recommendation-universe"),
  recommendationPeriod: document.getElementById("recommendation-period"),
  recommendationLevel: document.getElementById("recommendation-level"),
  recommendationMode: document.getElementById("recommendation-mode"),
  recommendationLookback: document.getElementById("recommendation-lookback"),
  recommendationTolerance: document.getElementById("recommendation-tolerance"),
  recommendationSummary: document.getElementById("recommendation-summary"),
  recommendationList: document.getElementById("recommendation-list"),
  calculatorViewButton: document.getElementById("view-calculator-button"),
  dashboardViewButton: document.getElementById("view-dashboard-button"),
  recommendationViewButton: document.getElementById("view-recommendation-button"),
  viewSections: [...document.querySelectorAll("[data-view-page]")],
  mobileViewButtons: [...document.querySelectorAll(".mobile-bottom-nav-button")],
  emptyState: document.getElementById("empty-state"),
  tickerList: document.getElementById("ticker-list")
};

function getTodayKstDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function parseKstDate(dateText) {
  return new Date(`${dateText}T12:00:00+09:00`);
}

function addDaysIso(dateText, days) {
  const date = parseKstDate(dateText);
  date.setUTCDate(date.getUTCDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function startOfMonthIso(dateText) {
  return `${dateText.slice(0, 7)}-01`;
}

function isWeekendIso(dateText) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIMEZONE,
    weekday: "short"
  }).format(parseKstDate(dateText));

  return weekday === "Sat" || weekday === "Sun";
}

function getKrxHolidaySet(extraDays = []) {
  const days = new Set(KRX_KNOWN_MARKET_CLOSURES);
  (Array.isArray(extraDays) ? extraDays : []).forEach((day) => {
    const normalized = String(day || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) days.add(normalized);
  });
  return days;
}

function isKrxMarketClosure(dateText, extraDays = []) {
  const normalized = String(dateText || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return true;
  return KRX_FIXED_MARKET_CLOSURE_MMDD.has(normalized.slice(5))
    || getKrxHolidaySet(extraDays).has(normalized);
}

function isKrxTradingDay(dateText, extraDays = []) {
  const normalized = String(dateText || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  return !isWeekendIso(normalized) && !isKrxMarketClosure(normalized, extraDays);
}

function getPreviousKrxTradingDay(dateText, extraDays = []) {
  let cursor = String(dateText || getTodayKstDate()).trim();
  for (let guard = 0; guard < 370; guard += 1) {
    if (isKrxTradingDay(cursor, extraDays)) return cursor;
    cursor = addDaysIso(cursor, -1);
  }
  return cursor;
}

function resolveDashboardRequestDate(dateText, extraDays = []) {
  const requested = String(dateText || getTodayKstDate()).trim();
  return isKrxTradingDay(requested, extraDays)
    ? requested
    : getPreviousKrxTradingDay(requested, extraDays);
}

function getPayloadHolidayDays(payload) {
  return [
    ...(Array.isArray(payload?.marketHolidays) ? payload.marketHolidays : []),
    ...(Array.isArray(payload?.holidays) ? payload.holidays : [])
  ];
}

function formatDisplayDate(dateText) {
  if (!dateText) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: MARKET_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).format(parseKstDate(dateText));
}

function formatTimestamp(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: MARKET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function getAgeSecondsFromTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
}

function normalizeDashboardPayloadAge(payload) {
  if (payload?.snapshotUpdatedAt) {
    payload.snapshotAgeSeconds = getAgeSecondsFromTimestamp(payload.snapshotUpdatedAt);
  }
  return payload;
}

function formatAgeSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  if (seconds < 60) return "방금";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전`;
}

function formatPercent(value, digits = 2) {
  if (!Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^krx:/, "")
    .replace(/[\s\-_():./\\]/g, "");
}

function normalizeTicker(value) {
  return String(value || "").trim().toUpperCase().replace(/^KRX:/i, "");
}

function extractTickerCode(value) {
  const compact = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^KRX:/i, "")
    .replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/[A-Z0-9]{6,9}/);
  return match ? match[0] : "";
}

function buildAppError(code, message, extras = {}) {
  const normalizedCode = code || APP_ERROR_CODES.unknown;
  const normalizedMessage = String(message || "알 수 없는 오류가 발생했습니다.").trim();
  const error = new Error(
    normalizedMessage.startsWith(`[${normalizedCode}]`)
      ? normalizedMessage
      : `[${normalizedCode}] ${normalizedMessage}`
  );
  error.code = normalizedCode;
  Object.assign(error, extras);
  return error;
}

function formatAppErrorMessage(error) {
  if (!error) return `[${APP_ERROR_CODES.unknown}] 알 수 없는 오류가 발생했습니다.`;
  const code = String(error.code || error.errorCode || APP_ERROR_CODES.unknown).trim();
  const message = String(error.message || error || "알 수 없는 오류가 발생했습니다.").trim();
  if (message.startsWith(`[${code}]`)) {
    return message;
  }
  return `[${code}] ${message}`;
}

function inferGatewayErrorCode(status, message) {
  const normalizedMessage = String(message || "").toLowerCase();
  const normalizedStatus = Number(status || 0);

  if (normalizedMessage.includes("토큰") || normalizedMessage.includes("access token")) {
    return "PP-KIS-TOKEN";
  }
  if (normalizedMessage.includes("호출 유량") || normalizedMessage.includes("초당 거래건수")) {
    return "PP-KIS-RATE-LIMIT";
  }
  if (normalizedMessage.includes("대시보드") || normalizedMessage.includes("월간표")) {
    return APP_ERROR_CODES.monthlyDataSparse;
  }
  if (normalizedStatus === 400) return "PP-BAD-REQUEST";
  if (normalizedStatus === 401 || normalizedStatus === 403) return "PP-AUTH";
  if (normalizedStatus === 404) return "PP-NOT-FOUND";
  if (normalizedStatus >= 500) return "PP-SERVER";
  return APP_ERROR_CODES.gatewayRequestFailed;
}

function getToneClass(value) {
  if (!Number.isFinite(value)) return "tone-neutral";
  if (value > 0) return "tone-up";
  if (value < 0) return "tone-down";
  return "tone-neutral";
}

function getSessionLabel(session) {
  if (session === "open") return "장중";
  if (session === "preopen") return "장 시작 전";
  if (session === "closed") return "장 마감";
  if (session === "holiday") return "휴장";
  return "히스토리";
}

function normalizeViewName(view) {
  const normalized = String(view || "").trim().toLowerCase();
  if (normalized === "recommendations" || normalized === "calculator") return normalized;
  return "dashboard";
}

function trackUsage(event, payload = {}) {
  window.PPUsageLogger?.track(event, payload);
}

function markUsageStart() {
  return window.PPUsageLogger?.markStart?.() ?? performance.now();
}

function usageDurationSince(startedAt) {
  return window.PPUsageLogger?.durationSince?.(startedAt) ?? Math.max(0, Math.round(performance.now() - Number(startedAt || 0)));
}

function getUsageEventForView(view) {
  const normalized = normalizeViewName(view);
  if (normalized === "calculator") return "calculator_view";
  if (normalized === "recommendations") return "recommendation_view";
  return "dashboard_view";
}

function roundUsageNumber(value, digits = 4) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Number(number.toFixed(digits));
}

function buildUsageStockMeta(slot, cell = null) {
  const stock = slot?.stock || enrichStockMeta(slot);
  const code = normalizeTicker(stock?.code || slot?.code || slot?.query || "");
  const name = stock?.name || slot?.name || code || "";
  const equalRate = Number(cell?.value);
  return {
    id: Number(slot?.id || 0) || null,
    code,
    name,
    market: stock?.market || slot?.market || "",
    equalRatePct: Number.isFinite(equalRate) ? roundUsageNumber(equalRate * 100, 2) : null,
    equalRateDisplay: cell?.display || ""
  };
}

function buildDashboardUsageMetadata(payload, source) {
  const selectedDate = payload?.selectedDate || state.selectedDate || elements.dateInput?.value || "";
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const row = rows.find((item) => item.date === selectedDate) || rows[rows.length - 1] || null;
  const slots = Array.isArray(payload?.slots) ? payload.slots : [];
  const searchedStocks = slots
    .map((slot, index) => ({ slot, cell: row?.values?.[index] || null }))
    .filter(({ slot }) => slot?.editable && (slot.code || slot.name || slot.stock?.code))
    .map(({ slot, cell }) => buildUsageStockMeta(slot, cell));

  return {
    source,
    selectedDateRow: row?.date || "",
    slotCodes: searchedStocks.map((stock) => stock.code).filter(Boolean),
    slotNames: searchedStocks.map((stock) => stock.name).filter(Boolean),
    searchedStocks
  };
}

function buildDashboardSearchMetadata(codes = []) {
  const searchedStocks = codes.map((code, index) => {
    const normalized = normalizeTicker(code);
    const stock = findCatalogItem(normalized) || enrichStockMeta({ code: normalized });
    return {
      id: index + 1,
      code: normalized,
      name: stock?.name || normalized,
      market: stock?.market || ""
    };
  }).filter((stock) => stock.code || stock.name);

  return {
    slotCodes: searchedStocks.map((stock) => stock.code).filter(Boolean),
    slotNames: searchedStocks.map((stock) => stock.name).filter(Boolean),
    searchedStocks
  };
}

function trackDashboardSearch(codes, selectedDate, success = true, extraMetadata = {}) {
  trackUsage("dashboard_search", {
    view: "dashboard",
    selectedDate,
    success,
    metadata: {
      ...buildDashboardSearchMetadata(codes),
      ...extraMetadata
    }
  });
}

function normalizeRecommendationUniverseClient(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "KOSPI200" ? "KOSPI200" : "KOSDAQ150";
}

function renderActiveView() {
  const activeView = normalizeViewName(state.activeView);

  elements.viewSections.forEach((section) => {
    if (!section) return;
    section.hidden = section.dataset.viewPage !== activeView;
  });

  document.querySelectorAll(".view-switcher-button[data-view], .mobile-bottom-nav-button[data-view]").forEach((button) => {
    if (!button) return;
    const isActive = button.dataset.view === activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setActiveView(view, options = {}) {
  const nextView = normalizeViewName(view);
  const previousView = state.activeView;
  state.activeView = nextView;
  renderActiveView();
  renderRecommendationFilterPanel();

  if (options.persist !== false) {
    localStorage.setItem(STORAGE_ACTIVE_VIEW, nextView);
  }

  if (nextView === "recommendations" && options.warmup !== false) {
    warmRecommendationUniverse(state.recommendations.filters, { silent: true }).catch(() => {});
  }

  if (options.track !== false && previousView !== nextView) {
    trackUsage(getUsageEventForView(nextView), {
      view: nextView,
      metadata: {
        reason: "view-switch"
      }
    });
  }
}

function getRecommendationFilters() {
  return {
    universe: normalizeRecommendationUniverseClient(elements.recommendationUniverse?.value || state.recommendations.filters.universe),
    periodMonths: Number(elements.recommendationPeriod?.value || 6),
    level: Number(elements.recommendationLevel?.value || 0.382),
    mode: String(elements.recommendationMode?.value || "near").trim().toLowerCase(),
    lookbackDays: Number(elements.recommendationLookback?.value || 1),
    tolerance: Number(elements.recommendationTolerance?.value || 0.01),
    sortBy: "distance_abs",
    slotTarget: "auto"
  };
}

function syncRecommendationControls(filters = state.recommendations.filters) {
  if (elements.recommendationUniverse) {
    elements.recommendationUniverse.value = normalizeRecommendationUniverseClient(filters.universe);
  }
  if (elements.recommendationPeriod) elements.recommendationPeriod.value = String(filters.periodMonths);
  if (elements.recommendationLevel) elements.recommendationLevel.value = String(filters.level);
  if (elements.recommendationMode) elements.recommendationMode.value = String(filters.mode || "near");
  if (elements.recommendationLookback) elements.recommendationLookback.value = String(filters.lookbackDays || 1);
  if (elements.recommendationTolerance) elements.recommendationTolerance.value = String(filters.tolerance);
}

function formatRecommendationLevelLabel(value) {
  const label = formatFibLabel(Number(value));
  if (label === "-") return "-";
  return `${label} 되돌림`;
}

function formatRecommendationSortLabel(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "distance_desc":
      return "상단 괴리 우선";
    case "distance_asc":
      return "하단 괴리 우선";
    case "name":
      return "종목명 순";
    default:
      return "괴리율 작은 순";
  }
}

function setRecommendationSummaryVisibility(summary) {
  if (!elements.recommendationSummary) return;
  const text = String(summary || "").trim();
  elements.recommendationSummary.hidden = !text;
  elements.recommendationSummary.textContent = text;
}

function getRecommendationCooldownRemainingMs() {
  return Math.max(0, Number(state.recommendations.cooldownUntil || 0) - Date.now());
}

function syncRecommendationRunButtonState() {
  if (!elements.recommendationRunButton) return;
  const remainingMs = getRecommendationCooldownRemainingMs();
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isBusy = Boolean(state.recommendations.loading);

  elements.recommendationRunButton.disabled = isBusy || remainingMs > 0;
  if (isBusy) {
    elements.recommendationRunButton.textContent = "추천 찾는 중...";
    return;
  }
  if (remainingMs > 0) {
    elements.recommendationRunButton.textContent = `재조회 ${remainingSeconds}s`;
    return;
  }
  elements.recommendationRunButton.textContent = "추천 찾기";
}

function scheduleRecommendationCooldownTicker() {
  window.clearTimeout(recommendationCooldownTimer);
  const remainingMs = getRecommendationCooldownRemainingMs();
  syncRecommendationRunButtonState();
  if (remainingMs <= 0) return;
  recommendationCooldownTimer = window.setTimeout(() => {
    scheduleRecommendationCooldownTicker();
  }, Math.min(remainingMs, 250));
}

function startRecommendationCooldown(durationMs = RECOMMENDATION_RUN_COOLDOWN_MS) {
  const safeDuration = Math.max(0, Number(durationMs || 0));
  if (!safeDuration) {
    scheduleRecommendationCooldownTicker();
    return;
  }
  state.recommendations.cooldownUntil = Math.max(
    Number(state.recommendations.cooldownUntil || 0),
    Date.now() + safeDuration
  );
  scheduleRecommendationCooldownTicker();
}

async function waitForRecommendationCooldown(filters = state.recommendations.filters) {
  const remainingMs = getRecommendationCooldownRemainingMs();
  if (remainingMs <= 0) {
    scheduleRecommendationCooldownTicker();
    return;
  }

  const waitSeconds = Math.ceil(remainingMs / 1000);
  setRecommendationState({
    loading: true,
    filters,
    summary: `추천 엔진 보호를 위해 ${waitSeconds}초 뒤 다시 조회합니다.`
  });
  await waitMs(remainingMs);
}

function applyStaticUiText() {
  const recommendationSection = document.getElementById("recommendation-page");
  const recommendationTitle = recommendationSection?.querySelector("h2");
  const recommendationNote = recommendationSection?.querySelector(".section-note");
  const filterTitle = elements.recommendationFilterToggle?.querySelector(".recommendation-filter-toggle-title");

  document.title = "월간 등가율 보드";
  if (recommendationTitle) recommendationTitle.textContent = "종목추천";
  if (recommendationNote) {
    recommendationNote.textContent = "";
    recommendationNote.hidden = true;
  }
  if (elements.dashboardViewButton) elements.dashboardViewButton.textContent = "등가율";
  if (elements.recommendationViewButton) elements.recommendationViewButton.textContent = "종목추천";
  elements.mobileViewButtons.forEach((button) => {
    if (button.dataset.view === "dashboard") button.textContent = "등가율";
    if (button.dataset.view === "recommendations") button.textContent = "종목추천";
  });
  if (filterTitle) filterTitle.textContent = "추천 조건";

  const labelMap = new Map([
    ["recommendation-universe", "대상"],
    ["recommendation-period", "기준 기간"],
    ["recommendation-level", "되돌림 구간"],
    ["recommendation-mode", "매매 신호"],
    ["recommendation-lookback", "신호 탐색"],
    ["recommendation-tolerance", "허용 괴리"]
  ]);
  labelMap.forEach((text, id) => {
    const label = recommendationSection?.querySelector(`label[for='${id}'] > span`);
    if (label) label.textContent = text;
  });

  const updateOptionText = (select, value, text) => {
    const option = select?.querySelector(`option[value='${value}']`);
    if (option) option.textContent = text;
  };

  updateOptionText(elements.recommendationPeriod, "3", "3개월");
  updateOptionText(elements.recommendationPeriod, "6", "6개월");
  updateOptionText(elements.recommendationPeriod, "12", "1년");
  updateOptionText(elements.recommendationLevel, "0.236", "23.6% 되돌림");
  updateOptionText(elements.recommendationLevel, "0.382", "38.2% 되돌림");
  updateOptionText(elements.recommendationLevel, "0.5", "50.0% 되돌림");
  updateOptionText(elements.recommendationMode, "near", "구간 근접");
  updateOptionText(elements.recommendationMode, "touch", "구간 터치");
  updateOptionText(elements.recommendationMode, "breakout_up", "상향 돌파");
  updateOptionText(elements.recommendationMode, "breakdown_down", "하향 이탈");
  updateOptionText(elements.recommendationLookback, "1", "기준일");
  updateOptionText(elements.recommendationLookback, "3", "최근 3거래일");
  updateOptionText(elements.recommendationLookback, "5", "최근 5거래일");
  updateOptionText(elements.recommendationTolerance, "0.005", "±0.5%");
  updateOptionText(elements.recommendationTolerance, "0.01", "±1.0%");
  updateOptionText(elements.recommendationTolerance, "0.015", "±1.5%");
  updateOptionText(elements.recommendationTolerance, "0.02", "±2.0%");

  setRecommendationSummaryVisibility(state.recommendations.summary);
  scheduleRecommendationCooldownTicker();
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatFibLabel(value) {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function isRecommendationCompactMode() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function setRecommendationFiltersCollapsed(collapsed) {
  state.recommendations.filtersCollapsed = Boolean(collapsed);
  renderRecommendationFilterPanel();
}

function compareNumbers(left, right) {
  const leftFinite = Number.isFinite(left);
  const rightFinite = Number.isFinite(right);
  if (!leftFinite && !rightFinite) return 0;
  if (!leftFinite) return 1;
  if (!rightFinite) return -1;
  return left - right;
}

function compareRecommendationNames(left, right) {
  return String(left || "").localeCompare(String(right || ""), "ko-KR", {
    numeric: true,
    sensitivity: "base"
  });
}

function findEditableSlot(slotId) {
  return state.editableSlots.find((slot) => slot.id === Number(slotId)) || null;
}

function sortRecommendationItems(items, sortBy = state.recommendations.filters.sortBy) {
  const normalizedSort = String(sortBy || "distance_abs").trim().toLowerCase();
  return [...items].sort((left, right) => {
    if (normalizedSort === "distance_desc") {
      return compareNumbers(Number(right.distanceRate), Number(left.distanceRate))
        || compareRecommendationNames(left.name || left.code, right.name || right.code);
    }

    if (normalizedSort === "distance_asc") {
      return compareNumbers(Number(left.distanceRate), Number(right.distanceRate))
        || compareRecommendationNames(left.name || left.code, right.name || right.code);
    }

    if (normalizedSort === "name") {
      return compareRecommendationNames(left.name || left.code, right.name || right.code)
        || compareRecommendationNames(left.market, right.market);
    }

    return compareNumbers(Math.abs(Number(left.distanceRate)), Math.abs(Number(right.distanceRate)))
      || compareRecommendationNames(left.name || left.code, right.name || right.code);
  });
}

function getRecommendationMarketOrder(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "KOSPI") return 0;
  if (normalized === "KOSDAQ") return 1;
  return 2;
}

function groupRecommendationItemsByMarket(items) {
  const groups = new Map();

  items.forEach((item) => {
    const key = String(item.market || "OTHER").trim().toUpperCase() || "OTHER";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: formatRecommendationMarketLabel(key),
        items: []
      });
    }
    groups.get(key).items.push(item);
  });

  return [...groups.values()].sort((left, right) => {
    return getRecommendationMarketOrder(left.key) - getRecommendationMarketOrder(right.key)
      || compareRecommendationNames(left.label, right.label);
  });
}

function getRecommendationWarmupDate() {
  return state.selectedDate || elements.dateInput.value || getTodayKstDate();
}

function buildRecommendationWarmupKey(filters = state.recommendations.filters, selectedDate = getRecommendationWarmupDate()) {
  return [
    selectedDate,
    normalizeRecommendationUniverseClient(filters?.universe || state.recommendations.filters.universe),
    RECOMMENDATION_WARMUP_MAX_PERIOD_MONTHS
  ].join(":");
}

async function warmRecommendationUniverse(filters = state.recommendations.filters, options = {}) {
  if (!state.gatewayUrl) return null;

  const selectedDate = getRecommendationWarmupDate();
  const normalizedFilters = {
    ...state.recommendations.filters,
    ...(filters || {}),
    universe: normalizeRecommendationUniverseClient(filters?.universe || state.recommendations.filters.universe)
  };
  const cacheKey = buildRecommendationWarmupKey(normalizedFilters, selectedDate);

  if (!options.force && recommendationWarmupState.completedKeys.has(cacheKey)) {
    return null;
  }

  if (!options.force && recommendationWarmupState.pending.has(cacheKey)) {
    return recommendationWarmupState.pending.get(cacheKey);
  }

  const promise = requestGateway({
    action: "fibonacci-warmup",
    date: selectedDate,
    universe: normalizedFilters.universe,
    maxPeriodMonths: RECOMMENDATION_WARMUP_MAX_PERIOD_MONTHS
  }).then((payload) => {
    recommendationWarmupState.completedKeys.add(cacheKey);
    return payload;
  }).catch((error) => {
    if (!options.silent) {
      console.warn("recommendation warmup", error);
    }
    return null;
  }).finally(() => {
    recommendationWarmupState.pending.delete(cacheKey);
  });

  recommendationWarmupState.pending.set(cacheKey, promise);
  return promise;
}

function setRecommendationState(nextState = {}) {
  state.recommendations = {
    ...state.recommendations,
    ...nextState,
    filters: {
      ...state.recommendations.filters,
      ...(nextState.filters || {})
    }
  };

  state.recommendations.filters.universe = normalizeRecommendationUniverseClient(state.recommendations.filters.universe);

  syncRecommendationControls(state.recommendations.filters);
  renderRecommendationFilterPanel();
  setRecommendationBusyState(state.recommendations.loading);
  renderRecommendationResults();
}

function waitMs(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForLoadingToFinish(maxWaitMs = 15000) {
  const startedAt = Date.now();
  while (state.loading && (Date.now() - startedAt) < maxWaitMs) {
    await waitMs(250);
  }
}

async function ensureDashboardReadyForRecommendationFlow(date = state.selectedDate || elements.dateInput.value || getTodayKstDate()) {
  const targetDate = date || getTodayKstDate();

  if (state.loading) {
    await waitForLoadingToFinish();
  }

  const hasEditableSlots = state.editableSlots.length === SLOT_COUNT;
  const sameDateLoaded = state.dashboard?.selectedDate === targetDate;
  if (state.dashboard && hasEditableSlots && sameDateLoaded) {
    return;
  }

  await loadDashboard(targetDate);
}

function setStatus(message, tone = "loading") {
  const statusMessage = tone === "error"
    ? formatAppErrorMessage(message)
    : String(message || "");
  elements.statusPill.textContent = statusMessage;
  elements.statusPill.className = "status-pill";
  if (tone === "success") elements.statusPill.classList.add("is-success");
  if (tone === "error") elements.statusPill.classList.add("is-error");
  if (tone === "loading") elements.statusPill.classList.add("is-loading");
}

function renderSnapshotHealth(status = state.snapshotStatus) {
  if (!elements.snapshotHealth || !elements.snapshotHealthText) return;

  if (!status) {
    elements.snapshotHealth.hidden = true;
    return;
  }

  const ageText = formatAgeSeconds(status.snapshotAgeSeconds);
  const sourceText = status.snapshotSource ? String(status.snapshotSource).trim() : "";
  let message = "스냅샷 상태 확인 필요";
  let toneClass = "is-warning";

  if (status.error) {
    message = formatAppErrorMessage(status.error);
    toneClass = "is-error";
  } else if (!status.hasSnapshot) {
    message = "저장된 스냅샷이 없습니다";
    toneClass = "is-warning";
  } else if (status.snapshotFresh) {
    message = ["스냅샷 정상", ageText, sourceText].filter(Boolean).join(" · ");
    toneClass = "is-success";
  } else {
    message = ["스냅샷 오래됨", ageText, sourceText].filter(Boolean).join(" · ");
    toneClass = "is-warning";
  }

  elements.snapshotHealth.hidden = false;
  elements.snapshotHealth.className = `snapshot-health ${toneClass}`;
  elements.snapshotHealthText.textContent = message;

  if (elements.snapshotRefreshButton) {
    elements.snapshotRefreshButton.disabled = Boolean(state.snapshotRefreshing || state.loading || state.saving);
    elements.snapshotRefreshButton.textContent = state.snapshotRefreshing ? "갱신 중..." : "최신으로 갱신";
  }
}

function setBusyState(isBusy) {
  state.loading = isBusy;
  elements.dateInput.disabled = isBusy;
  document.querySelectorAll(".slot-input[data-editable='true']").forEach((input) => {
    input.disabled = isBusy;
  });
  renderSnapshotHealth();
}

function ensureGatewayCard() {
  elements.setupCard.hidden = Boolean(state.gatewayUrl);
}

function enrichStockMeta(stock) {
  if (!stock) return null;
  const code = normalizeTicker(stock.code);
  const catalogFallback = Array.isArray(state.catalog)
    ? state.catalog.find((item) => normalizeTicker(item.code) === code)
    : null;
  const localFallback = LOCAL_STOCK_CATALOG.find((item) => normalizeTicker(item.code) === code);
  const fallback = catalogFallback || localFallback || {};
  const rawName = String(stock.name || "").trim();
  const fallbackName = String(fallback.name || "").trim();
  const nameLooksLikeCode = rawName && normalizeTicker(rawName) === code;
  return {
    code,
    name: nameLooksLikeCode ? (fallbackName || rawName) : (rawName || fallbackName || code),
    market: String((stock.market && stock.market !== "KRX" ? stock.market : fallback.market) || stock.market || "KOSPI").trim().toUpperCase(),
    assetType: String(stock.assetType || fallback.assetType || "stock").trim()
  };
}

function prepareCatalogItem(stock) {
  return {
    ...stock,
    _tickerKey: normalizeTicker(stock.code),
    _codeKey: normalizeSearchText(stock.code),
    _nameKey: normalizeSearchText(stock.name)
  };
}

function mergeCatalogs(remoteItems, localItems) {
  const merged = new Map();
  [...localItems, ...(Array.isArray(remoteItems) ? remoteItems : [])].forEach((item) => {
    const stock = enrichStockMeta(item);
    if (stock?.code) merged.set(stock.code, prepareCatalogItem(stock));
  });
  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name, "ko"));
}

function getCatalogTickerKey(item) {
  return item?._tickerKey || normalizeTicker(item?.code);
}

function getCatalogCodeKey(item) {
  return item?._codeKey || normalizeSearchText(item?.code);
}

function getCatalogNameKey(item) {
  return item?._nameKey || normalizeSearchText(item?.name);
}

function getTickerSuggestions(query = "") {
  const raw = String(query || "").trim();
  const normalizedText = normalizeSearchText(raw);
  const normalizedTicker = normalizeTicker(raw);
  if (
    normalizedText.length < TICKER_DATALIST_MIN_QUERY_LENGTH
    && normalizedTicker.length < TICKER_DATALIST_MIN_QUERY_LENGTH
  ) {
    return [];
  }
  const candidates = [];
  const seen = new Set();

  const scoreItem = (item) => {
    const tickerKey = getCatalogTickerKey(item);
    const codeKey = getCatalogCodeKey(item);
    const name = getCatalogNameKey(item);
    if (tickerKey === normalizedTicker || codeKey === normalizedText || name === normalizedText) return 1000;
    if (normalizedTicker && tickerKey.startsWith(normalizedTicker)) return 800;
    if (normalizedText && codeKey.startsWith(normalizedText)) return 780;
    if (normalizedText && name.startsWith(normalizedText)) return 760;
    if (normalizedText && name.includes(normalizedText)) return 620;
    if (normalizedTicker && tickerKey.includes(normalizedTicker)) return 560;
    if (normalizedText && codeKey.includes(normalizedText)) return 540;
    return 0;
  };

  state.catalog.forEach((item) => {
    const code = getCatalogTickerKey(item);
    if (!code || seen.has(code)) return;
    const score = scoreItem(item);
    if (!score) return;
    seen.add(code);
    candidates.push({ item, score });
  });

  return candidates
    .sort((left, right) => (
      right.score - left.score
      || String(left.item.name || "").localeCompare(String(right.item.name || ""), "ko")
    ))
    .slice(0, TICKER_DATALIST_ITEM_LIMIT)
    .map(({ item }) => item);
}

function buildTickerDatalist(query = null) {
  const activeInput = document.activeElement;
  const resolvedQuery = query === null && activeInput?.matches?.(".slot-input[data-editable='true']")
    ? activeInput.value
    : String(query || "");
  const suggestions = getTickerSuggestions(resolvedQuery);
  elements.tickerList.innerHTML = suggestions.map((item) => (
    `<option value="${escapeHtml(item.name)}">${escapeHtml(item.code)}</option>` +
    `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)}</option>`
  )).join("");
}

function refreshTickerDatalistForInput(input, options = {}) {
  if (!input) {
    buildTickerDatalist("");
    return;
  }

  const previousValue = String(input.dataset.autocompleteValue || "");
  const currentValue = String(input.value || "");
  input.dataset.autocompleteValue = currentValue;

  if (options.suppressOnDelete && currentValue.length < previousValue.length) {
    buildTickerDatalist("");
    return;
  }

  buildTickerDatalist(currentValue);
}

function buildRequestUrl(params) {
  const url = new URL(state.gatewayUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function buildDashboardSnapshotUrl(date) {
  if (!DEFAULT_DASHBOARD_SNAPSHOT_URL) return "";
  const url = new URL(DEFAULT_DASHBOARD_SNAPSHOT_URL, window.location.href);
  if (date) url.searchParams.set("date", date);
  url.searchParams.set("v", String(Math.floor(Date.now() / 60000)));
  return url.toString();
}

function readCachedDashboardPayload(date) {
  try {
    const record = JSON.parse(localStorage.getItem(STORAGE_DASHBOARD_PAYLOAD) || "null");
    const payload = record?.payload;
    const savedAt = Number(record?.savedAt || 0);
    if (!payload || payload.selectedDate !== date) return null;
    if (!savedAt || (Date.now() - savedAt) > DASHBOARD_CACHE_MAX_AGE_MS) return null;
    return payload;
  } catch (error) {
    console.warn("dashboard cache read failed", error);
    return null;
  }
}

function saveCachedDashboardPayload(payload) {
  if (!payload?.selectedDate || !Array.isArray(payload.rows) || !Array.isArray(payload.slots)) return;

  try {
    localStorage.setItem(STORAGE_DASHBOARD_PAYLOAD, JSON.stringify({
      savedAt: Date.now(),
      payload
    }));
  } catch (error) {
    console.warn("dashboard cache save failed", error);
  }
}

function clearCachedDashboardPayload() {
  try {
    localStorage.removeItem(STORAGE_DASHBOARD_PAYLOAD);
  } catch (error) {
    console.warn("dashboard cache clear failed", error);
  }
}

function renderCachedDashboardIfAvailable(date) {
  const cachedPayload = readCachedDashboardPayload(date);
  if (!cachedPayload) return false;

  renderDashboard(cachedPayload, { cache: false, fromCache: true });
  setStatus("저장된 월간표를 먼저 표시했습니다. 최신 데이터를 확인하는 중...", "loading");
  return true;
}

function deferDashboardLoadForDate(date) {
  const nextDate = resolveDashboardRequestDate(date || getTodayKstDate());
  const previousDate = state.selectedDate;

  state.selectedDate = nextDate;
  localStorage.setItem(STORAGE_LAST_DATE, nextDate);

  if (previousDate && previousDate !== nextDate) {
    state.dashboard = null;
    state.dashboardFromCache = false;
    state.snapshotStatus = null;
    state.lastDashboardLoadedAt = 0;
    setRecommendationState({
      items: [],
      loading: false,
      summary: ""
    });
  }
}

function getSeriesCacheKey(target, selectedDate) {
  if (!target?.code) return "";
  return `${target.assetType}:${target.code}:${selectedDate}`;
}

function normalizeCatalogCacheItem(item) {
  const stock = enrichStockMeta(item);
  if (!stock?.code || !stock.name) return null;
  return {
    code: normalizeTicker(stock.code),
    name: String(stock.name || "").trim(),
    market: String(stock.market || "").trim().toUpperCase(),
    assetType: String(stock.assetType || "stock").trim()
  };
}

function readCachedStockCatalog() {
  try {
    const record = JSON.parse(localStorage.getItem(STORAGE_STOCK_CATALOG) || "null");
    if (!record || !Array.isArray(record.items)) return null;
    const savedAt = Number(record.savedAt || 0);
    if (!savedAt || Date.now() - savedAt > STOCK_CATALOG_CACHE_MAX_AGE_MS) return null;
    return record.items.map(normalizeCatalogCacheItem).filter(Boolean);
  } catch (error) {
    console.warn("catalog cache read skipped", error);
    return null;
  }
}

function saveCachedStockCatalog(items) {
  if (!Array.isArray(items) || !items.length) return;

  try {
    const normalizedItems = items
      .map(normalizeCatalogCacheItem)
      .filter(Boolean)
      .slice(0, 6000);
    if (!normalizedItems.length) return;
    localStorage.setItem(STORAGE_STOCK_CATALOG, JSON.stringify({
      savedAt: Date.now(),
      items: normalizedItems
    }));
  } catch (error) {
    console.warn("catalog cache save skipped", error);
  }
}

function hydrateCachedCatalog() {
  const cachedItems = readCachedStockCatalog();
  if (!cachedItems) return false;
  state.catalog = mergeCatalogs(cachedItems, LOCAL_STOCK_CATALOG);
  catalogLoaded = true;
  buildTickerDatalist();
  return true;
}

async function loadCatalog() {
  if (!state.gatewayUrl) {
    state.catalog = mergeCatalogs([], LOCAL_STOCK_CATALOG);
    catalogLoaded = true;
    buildTickerDatalist();
    return state.catalog;
  }

  try {
    const payload = await requestGateway({ action: "stock-catalog", market: "ALL" });
    const remoteItems = Array.isArray(payload?.items) ? payload.items : [];
    if (!remoteItems.length && hydrateCachedCatalog()) {
      return state.catalog;
    }
    state.catalog = mergeCatalogs(remoteItems, LOCAL_STOCK_CATALOG);
    saveCachedStockCatalog(remoteItems);
  } catch (error) {
    console.warn("catalog fallback", error);
    if (!hydrateCachedCatalog()) {
      state.catalog = mergeCatalogs([], LOCAL_STOCK_CATALOG);
      buildTickerDatalist();
    }
    catalogLoaded = true;
    return state.catalog;
  }

  catalogLoaded = true;
  buildTickerDatalist();
  return state.catalog;
}

function scheduleCatalogLoad(options = {}) {
  const force = Boolean(options.force);
  const delayMs = Math.max(0, Number(options.delayMs || 0));
  if (catalogLoaded && !force) return Promise.resolve(state.catalog);
  if (catalogLoadPromise && !force) return catalogLoadPromise;

  catalogLoadPromise = new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  })
    .then(() => loadCatalog())
    .catch((error) => {
      console.warn("catalog background load", error);
      return state.catalog;
    })
    .finally(() => {
      catalogLoadPromise = null;
    });

  return catalogLoadPromise;
}

function isStaticDashboardPayload(payload) {
  const sourceMode = String(payload?.sourceMode || "").trim().toLowerCase();
  return Boolean(
    payload?.staticSnapshot
    || payload?.edgeSource
    || sourceMode === "static-snapshot"
    || sourceMode === "cloudflare-kv"
  );
}

function enrichDashboardSlot(slot) {
  if (!slot?.code) return slot;
  const stock = enrichStockMeta(slot);
  if (!stock) return slot;

  return {
    ...slot,
    name: stock.name || slot.name,
    market: stock.market || slot.market,
    assetType: stock.assetType || slot.assetType,
    stock
  };
}

function enrichDashboardPayload(payload) {
  if (!payload || !Array.isArray(payload.slots)) return payload;
  return {
    ...payload,
    slots: payload.slots.map(enrichDashboardSlot)
  };
}

function findCatalogItem(rawValue) {
  const input = String(rawValue || "").trim();
  if (!input) return null;

  const normalizedTicker = normalizeTicker(input);
  const extractedTicker = extractTickerCode(input);
  const normalizedText = normalizeSearchText(input);
  let bestMatch = null;

  state.catalog.forEach((item) => {
    const code = getCatalogTickerKey(item);
    const codeKey = getCatalogCodeKey(item);
    const name = getCatalogNameKey(item);
    const assetType = String(item.assetType || "").trim().toLowerCase();
    let score = 0;

    if (code === normalizedTicker || (extractedTicker && code === extractedTicker)) {
      score = 1000;
    } else if (name === normalizedText) {
      score = 900;
    } else if (normalizedText && codeKey.startsWith(normalizedText)) {
      score = 720;
    } else if (normalizedText && name.startsWith(normalizedText)) {
      score = 680;
    } else if (normalizedText && name.endsWith(normalizedText)) {
      score = 640;
    } else if (normalizedText && (name.includes(normalizedText) || codeKey.includes(normalizedText))) {
      score = 520;
    }

    if (!score) return;
    if (assetType === "stock") score += 20;
    score -= Math.min(name.length, 80) / 100;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { item, score };
    }
  });

  return bestMatch?.item || null;
}

async function resolveStockInput(rawValue) {
  const exact = findCatalogItem(rawValue);
  if (exact) return exact;

  const needle = normalizeSearchText(rawValue);
  if (!needle) return null;

  const fuzzy = state.catalog.find((item) => {
    const codeKey = getCatalogCodeKey(item);
    const nameKey = getCatalogNameKey(item);
    return codeKey.includes(needle) || nameKey.includes(needle);
  });

  return fuzzy || null;
}

function resolveTickerCode(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return "";
  if (raw.includes(",")) {
    throw new Error(`종목명에 쉼표(,)는 사용할 수 없습니다: ${raw}`);
  }

  const exact = findCatalogItem(raw);
  if (exact) return normalizeTicker(exact.code);

  const ticker = extractTickerCode(raw) || normalizeTicker(raw);
  if (/^[A-Z0-9]{6,9}$/.test(ticker)) {
    return ticker;
  }

  const needle = normalizeSearchText(raw);
  const fuzzy = state.catalog.find((item) => {
    const codeKey = getCatalogCodeKey(item);
    const nameKey = getCatalogNameKey(item);
    return codeKey.includes(needle) || nameKey.includes(needle);
  });
  if (fuzzy) return normalizeTicker(fuzzy.code);

  return raw;
}

function isResolvedTickerValue(resolvedValue, rawValue) {
  return (
    normalizeTicker(resolvedValue) !== normalizeTicker(rawValue)
    || /^[A-Z0-9]{6,9}$/.test(normalizeTicker(resolvedValue))
  );
}

async function resolveTickerCodeForSave(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return "";

  const localResolved = resolveTickerCode(raw);
  if (isResolvedTickerValue(localResolved, raw)) {
    return localResolved;
  }

  if (!state.gatewayUrl) return localResolved;

  if (!catalogLoaded) {
    const catalogResolved = await Promise.race([
      scheduleCatalogLoad().then(() => resolveTickerCode(raw)).catch(() => ""),
      new Promise((resolve) => window.setTimeout(() => resolve(""), 800))
    ]);
    if (isResolvedTickerValue(catalogResolved, raw)) {
      return catalogResolved;
    }
  }

  try {
    const payload = await requestGateway({ action: "stock-search", q: raw });
    if (Array.isArray(payload?.items) && payload.items.length) {
      state.catalog = mergeCatalogs(payload.items, state.catalog);
    }
    const first = Array.isArray(payload?.items) ? payload.items[0] : null;
    if (first?.code) return normalizeTicker(first.code);
  } catch (error) {
    console.warn("stock-search fallback", error);
  }

  return localResolved;
}

function createDefaultEditableSlots() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const code = DEFAULT_SLOT_CODES[index] || "";
    const stock = LOCAL_STOCK_CATALOG.find((item) => item.code === code) || null;
    return {
      id: index + 1,
      query: stock ? stock.name : "",
      stock: stock ? enrichStockMeta(stock) : null,
      editable: true
    };
  });
}

function restoreEditableSlots() {
  state.editableSlots = createDefaultEditableSlots();
}

function getAllSlots() {
  const fixed = FIXED_SLOTS.map((slot) => ({ ...slot }));
  const editable = state.editableSlots.map((slot) => ({
    id: slot.id,
    name: slot.stock?.name || `종목${slot.id}`,
    code: slot.stock?.code || "",
    market: slot.stock?.market || "",
    assetType: slot.stock?.assetType || "stock",
    editable: true,
    query: slot.query || "",
    stock: slot.stock || null
  }));
  return [...fixed, ...editable];
}

function getSlotDisplayLabel(slot) {
  if (!slot) return "-";
  if (!slot.editable) return slot.name;
  if (slot.stock) return slot.stock.name;
  if (slot.name && normalizeTicker(slot.name) !== normalizeTicker(slot.code)) return slot.name;
  if (slot.code) return slot.code;
  return `종목${slot.id}`;
}

function updateSlotPreview(card) {
  const input = card.querySelector(".slot-input");
  const nameEl = card.querySelector(".slot-name");
  if (!input || input.dataset.editable !== "true" || !nameEl) return;

  const slotId = Number(input.dataset.slotId);
  const slot = state.editableSlots.find((item) => item.id === slotId);
  const raw = String(input.value || "").trim();
  const match = findCatalogItem(raw);

  if (!raw) {
    nameEl.textContent = `종목${slotId}`;
    if (slot) slot.query = "";
    return;
  }

  if (match) {
    nameEl.textContent = match.name;
    if (slot) slot.query = raw;
    return;
  }

  nameEl.textContent = raw;
  if (slot) slot.query = raw;
}

function attachSlotEvents() {
  document.querySelectorAll(".slot-card").forEach((card) => {
    const input = card.querySelector(".slot-input");
    if (!input || input.dataset.editable !== "true") return;
    let saveTimer = 0;
    const requestSave = () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        saveTickers().catch((error) => {
          console.error(error);
          setStatus(error.message, "error");
        });
      }, 250);
    };

    input.addEventListener("compositionstart", () => {
      input.dataset.composing = "true";
    });
    input.addEventListener("compositionend", () => {
      input.dataset.composing = "false";
      updateSlotPreview(card);
      refreshTickerDatalistForInput(input);
    });
    input.addEventListener("input", () => {
      updateSlotPreview(card);
      refreshTickerDatalistForInput(input, { suppressOnDelete: true });
    });
    input.addEventListener("focus", () => {
      refreshTickerDatalistForInput(input);
      scheduleCatalogLoad();
    }, { once: true });
    input.addEventListener("change", (event) => {
      if (event.isComposing || input.dataset.composing === "true") return;
      updateSlotPreview(card);
      refreshTickerDatalistForInput(input);
      requestSave();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (event.isComposing || event.keyCode === 229 || input.dataset.composing === "true") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      window.clearTimeout(saveTimer);
      saveTickers().catch((error) => {
        console.error(error);
        setStatus(error.message, "error");
      });
    });
  });
}

async function saveTickerCodes(codes) {
  const targetDate = elements.dateInput.value || state.selectedDate || getTodayKstDate();
  const requestedCodes = codes.map((code) => normalizeTicker(code));
  clearCachedDashboardPayload();
  trackDashboardSearch(requestedCodes, targetDate, true, { reason: "search-submit" });
  syncEditableSlotsFromCodes(requestedCodes);
  setStatus("\uc6d4\uac04\ud45c \uac31\uc2e0 \uc911...", "loading");

  const refreshSeq = state.dashboardRefreshSeq + 1;
  state.dashboardRefreshSeq = refreshSeq;

  const savePromise = requestGateway({
    action: "update-tickers",
    tickers: codes.join(","),
    date: targetDate
  }).then(() => ({ ok: true })).catch((error) => {
    console.warn("ticker save failed after dashboard refresh started", error);
    trackDashboardSearch(requestedCodes, targetDate, false, {
      reason: String(error?.code || error?.message || "save-tickers-failed").slice(0, 48)
    });
    return { ok: false, error };
  });

  (async () => {
    let dashboardRendered = false;
    try {
      const payload = await loadDashboardPayloadFromApi(targetDate, { tickers: requestedCodes });
      if (state.dashboardRefreshSeq !== refreshSeq) return;
      renderDashboard(payload, { cache: true });
      dashboardRendered = true;
      setStatus("\uc6d4\uac04\ud45c \uac31\uc2e0 \uc644\ub8cc. \uc885\ubaa9 \uc800\uc7a5 \ud655\uc778 \uc911...", "success");
    } catch (error) {
      if (state.dashboardRefreshSeq !== refreshSeq) return;
      console.warn("dashboard refresh after save", error);
      setStatus("\uc885\ubaa9 \uc800\uc7a5 \uc911. \uc6d4\uac04\ud45c\ub294 \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uac31\uc2e0\ud574 \uc8fc\uc138\uc694.", "loading");
    }

    const saveResult = await savePromise;
    if (state.dashboardRefreshSeq !== refreshSeq) return;
    if (saveResult.ok) {
      setStatus(dashboardRendered ? "\uc6d4\uac04\ud45c \uac31\uc2e0 \ubc0f \uc885\ubaa9 \uc800\uc7a5 \uc644\ub8cc." : "\uc885\ubaa9 \uc800\uc7a5 \uc644\ub8cc.", "success");
    } else {
      setStatus(dashboardRendered ? "\uc6d4\uac04\ud45c\ub294 \uac31\uc2e0\ub410\uc9c0\ub9cc \uc885\ubaa9 \uc800\uc7a5\uc740 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4." : "\uc885\ubaa9 \uc800\uc7a5\uc774 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.", "error");
    }
  })();

  return { ok: true, pendingRefresh: true };
}

async function saveTickers() {
  if (!state.dashboard || state.saving) return;

  state.saving = true;
  setBusyState(true);
  setStatus("종목 저장 중", "loading");

  try {
    const inputs = [...document.querySelectorAll(".slot-input[data-editable='true']")];
    if (inputs.length !== SLOT_COUNT) {
      throw new Error("편집 가능한 종목 입력칸을 모두 찾지 못했습니다.");
    }

    const tickers = await Promise.all(inputs.map((input) => resolveTickerCodeForSave(input.value)));
    const result = await saveTickerCodes(tickers);
    if (!result?.pendingRefresh) {
      setStatus("종목 저장 완료", "success");
    }
  } finally {
    state.saving = false;
    setBusyState(false);
  }
}

function buildDemoBusinessDates(selectedDate, count) {
  const dates = [];
  let cursor = startOfMonthIso(selectedDate);

  while (cursor <= selectedDate && dates.length < count) {
    if (!isWeekendIso(cursor)) {
      dates.push(cursor);
    }
    cursor = addDaysIso(cursor, 1);
  }

  return dates;
}

function computeEqualRateRows(rows, baselineClose) {
  let previousClose = Number(baselineClose);
  return rows.map((row) => {
    const close = Number(row.close);
    const equalRate = Number.isFinite(previousClose) && previousClose !== 0 && Number.isFinite(close)
      ? (close / previousClose) - 1
      : null;

    previousClose = close;

    return {
      date: row.date,
      close,
      equalRate,
      live: false
    };
  });
}

function buildDemoMonthlyPayload(target, selectedDate) {
  const template = DEMO_SERIES[target.code];
  if (!template) {
    return {
      target,
      rows: [],
      holidays: [],
      lastTradingDate: selectedDate,
      source: "demo",
      asOf: new Date().toISOString()
    };
  }

  const dates = buildDemoBusinessDates(selectedDate, template.closes.length);
  const rawRows = template.closes.slice(0, dates.length).map((close, index) => ({
    date: dates[index],
    close
  }));

  return {
    target,
    rows: computeEqualRateRows(rawRows, template.baselineClose),
    holidays: [],
    lastTradingDate: rawRows.length ? rawRows[rawRows.length - 1].date : selectedDate,
    source: "demo",
    asOf: new Date().toISOString()
  };
}

async function loadMonthlySeriesForTarget(target, selectedDate) {
  if (!target) {
    return {
      target: null,
      rows: [],
      holidays: [],
      lastTradingDate: selectedDate,
      source: "empty",
      asOf: null
    };
  }

  const cacheKey = getSeriesCacheKey(target, selectedDate);
  if (state.monthlyCache.has(cacheKey)) {
    const cached = state.monthlyCache.get(cacheKey);
    return {
      ...cached,
      rows: Array.isArray(cached.rows) ? cached.rows.map((row) => ({ ...row })) : []
    };
  }

  if (state.gatewayUrl) {
    try {
      const params = target.assetType === "index"
        ? { action: "index-month", indexCode: target.code, date: selectedDate }
        : { action: "equity-month", ticker: target.code, date: selectedDate };
      const payload = await requestGateway(params);
      const result = {
        target: target.assetType === "index" ? target : enrichStockMeta(payload.stock || target),
        rows: computeEqualRateRows(Array.isArray(payload.rows) ? payload.rows : [], Number(payload.baselineClose)),
        holidays: Array.isArray(payload.holidays) ? payload.holidays : [],
        lastTradingDate: payload.lastTradingDate || selectedDate,
        source: "gateway",
        asOf: payload.now || null
      };
      state.monthlyCache.set(cacheKey, result);
      return {
        ...result,
        rows: result.rows.map((row) => ({ ...row }))
      };
    } catch (error) {
      console.warn(`monthly fallback ${target.code}`, error);
    }
  }

  const demoResult = buildDemoMonthlyPayload(target, selectedDate);
  state.monthlyCache.set(cacheKey, demoResult);
  return {
    ...demoResult,
    rows: demoResult.rows.map((row) => ({ ...row }))
  };
}

async function loadSnapshotForTarget(target, selectedDate) {
  if (!target || !state.gatewayUrl || selectedDate !== getTodayKstDate()) {
    return null;
  }

  try {
    const params = target.assetType === "index"
      ? { action: "index-snapshot", indexCode: target.code, date: selectedDate }
      : { action: "intraday-snapshot", ticker: target.code, date: selectedDate };
    return await requestGateway(params);
  } catch (error) {
    console.warn(`snapshot skip ${target.code}`, error);
    return null;
  }
}

function applySnapshotToSeries(series, snapshot) {
  if (!series?.target || !snapshot?.date || !Number.isFinite(snapshot.equalRate)) {
    return series;
  }

  const nextRows = series.rows.filter((row) => row.date !== snapshot.date);
  nextRows.push({
    date: snapshot.date,
    close: Number(snapshot.price),
    equalRate: Number(snapshot.equalRate),
    live: snapshot.session === "open"
  });
  nextRows.sort((left, right) => left.date.localeCompare(right.date));

  return {
    ...series,
    rows: nextRows,
    asOf: snapshot.asOf || series.asOf
  };
}

function resolveMarketSession(selectedDate, holidaySet = new Set()) {
  const today = getTodayKstDate();
  if (selectedDate !== today) return "historical";
  if (!isKrxTradingDay(selectedDate, [...holidaySet])) return "holiday";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKET_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  const totalMinutes = (Number(values.hour) * 60) + Number(values.minute);
  if (totalMinutes < 9 * 60) return "preopen";
  if (totalMinutes <= (15 * 60) + 30) return "open";
  return "closed";
}

function buildTableRows(seriesCollection) {
  const dateSet = new Set();
  seriesCollection.forEach((series) => {
    series.rows.forEach((row) => dateSet.add(row.date));
  });

  return [...dateSet]
    .filter((date) => isKrxTradingDay(date, collectSeriesHolidayDays(seriesCollection)))
    .sort((left, right) => left.localeCompare(right))
    .map((date) => ({
      date,
      displayDate: formatDisplayDate(date),
      values: seriesCollection.map((series) => {
        const row = series.rows.find((item) => item.date === date);
        return {
          value: row?.equalRate ?? null,
          display: formatPercent(row?.equalRate),
          live: Boolean(row?.live)
        };
      })
    }));
}

function collectSeriesHolidayDays(seriesCollection = []) {
  const days = new Set();
  seriesCollection.forEach((series) => {
    (Array.isArray(series?.holidays) ? series.holidays : []).forEach((day) => {
      const normalized = String(day || "").trim();
      if (normalized) days.add(normalized);
    });
  });
  return [...days];
}

function recalcDashboardSlotTotals(slots = [], rows = []) {
  return (Array.isArray(slots) ? slots : []).map((slot, index) => ({
    ...slot,
    total: rows.reduce((sum, row) => {
      const value = Number(row?.values?.[index]?.value);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0)
  }));
}

function normalizeDashboardTradingDays(payload) {
  if (!payload || !Array.isArray(payload.rows) || !Array.isArray(payload.slots)) return payload;

  const holidayDays = getPayloadHolidayDays(payload);
  const rows = payload.rows.filter((row) => isKrxTradingDay(row?.date, holidayDays));
  const selectedDate = String(payload.selectedDate || "").trim();
  const lastTradingDate = rows.length
    ? rows.map((row) => row.date).filter(Boolean).sort().pop()
    : (selectedDate ? resolveDashboardRequestDate(selectedDate, holidayDays) : "");

  return {
    ...payload,
    selectedDate: isKrxTradingDay(selectedDate, holidayDays) ? selectedDate : lastTradingDate,
    lastTradingDate: lastTradingDate || payload.lastTradingDate,
    rows,
    slots: recalcDashboardSlotTotals(payload.slots, rows)
  };
}

function buildDashboardPayload(seriesCollection, selectedDate) {
  const marketHolidays = collectSeriesHolidayDays(seriesCollection);
  const filteredSeriesCollection = seriesCollection.map((series) => ({
    ...series,
    rows: Array.isArray(series?.rows)
      ? series.rows.filter((row) => isKrxTradingDay(row?.date, marketHolidays))
      : []
  }));
  const slots = getAllSlots().map((slot, index) => {
    const series = filteredSeriesCollection[index];
    const total = Array.isArray(series?.rows)
      ? series.rows.reduce((sum, row) => (
        Number.isFinite(row?.equalRate) ? sum + Number(row.equalRate) : sum
      ), 0)
      : 0;

    return {
      ...slot,
      total
    };
  });
  const rows = buildTableRows(filteredSeriesCollection);
  const sourceMode = filteredSeriesCollection.every((series) => !series.target || series.source === "gateway")
    ? "gateway"
    : "demo";

  const latestStamp = filteredSeriesCollection
    .map((series) => series.asOf)
    .filter(Boolean)
    .sort()
    .pop() || new Date().toISOString();

  return {
    selectedDate,
    today: getTodayKstDate(),
    session: state.session,
    sourceMode,
    updatedAt: latestStamp,
    marketHolidays,
    slots,
    rows
  };
}

function syncEditableSlotsFromDashboard(slots = []) {
  state.editableSlots = slots
    .filter((slot) => slot?.editable)
    .map((slot, index) => ({
      id: Number(slot.id || index + 1),
      query: String(slot.code || ""),
      stock: slot.code ? enrichStockMeta(slot) : null,
      editable: true
    }));
}

function syncEditableSlotsFromCodes(codes = []) {
  state.editableSlots = Array.from({ length: SLOT_COUNT }, (_, index) => {
    const code = normalizeTicker(codes[index] || "");
    const stock = code ? (findCatalogItem(code) || enrichStockMeta({ code })) : null;
    return {
      id: index + 1,
      query: stock?.name || code,
      stock,
      editable: true
    };
  });
}

function getEditableTickerCodes() {
  const codes = state.editableSlots.map((slot) => normalizeTicker(slot?.stock?.code || slot?.query || ""));
  while (codes.length < SLOT_COUNT) codes.push("");
  return codes.slice(0, SLOT_COUNT);
}

function renderTable(payload) {
  const labels = payload.slots.map((slot) => getSlotDisplayLabel(slot));

  elements.tableHead.innerHTML = `
    <tr>
      <th>일자</th>
      ${labels.map((label) => `<th>${escapeHtml(label)}</th>`).join("")}
    </tr>
  `;

  elements.tableBody.innerHTML = payload.rows.map((row) => `
    <tr>
      <td data-label="일자">${escapeHtml(row.displayDate)}</td>
      ${row.values.map((cell, index) => `
        <td data-label="${escapeHtml(labels[index] || "-")}" class="${getToneClass(Number(cell.value))}">
          ${escapeHtml(cell.display)}
        </td>
      `).join("")}
    </tr>
  `).join("");

  elements.emptyState.classList.toggle("is-visible", payload.rows.length === 0);
}

function getMobileSlides(payload) {
  return payload.slots
    .map((slot, index) => ({ slot, index }))
    .filter((entry) => entry.slot.editable && (entry.slot.code || entry.slot.name))
    .map((entry) => {
      const slotStock = entry.slot.stock || enrichStockMeta(entry.slot);
      const benchmarkIndex = slotStock?.market === "KOSDAQ" ? 1 : 0;
      const benchmarkSlot = payload.slots[benchmarkIndex];
      const compareRows = payload.rows.filter((row) => {
        const benchmarkCell = row.values[benchmarkIndex];
        const compareCell = row.values[entry.index];
        return benchmarkCell?.display !== "-" || compareCell?.display !== "-";
      });

      return {
        title: slotStock?.name || getSlotDisplayLabel(entry.slot),
        benchmarkLabel: getSlotDisplayLabel(benchmarkSlot),
        compareLabel: slotStock?.name || getSlotDisplayLabel(entry.slot),
        benchmarkIndex,
        compareIndex: entry.index,
        rows: compareRows
      };
    })
    .filter((slide) => slide.rows.length);
}

function updateMobileCompareNavigation(totalSlides) {
  const hasSlides = totalSlides > 0;
  const hasMultiple = totalSlides > 1;

  elements.mobileCompare.hidden = !hasSlides;
  elements.mobileCompareControls.hidden = !hasMultiple;
  elements.mobileCompareDots.hidden = !hasMultiple;

  if (!hasSlides) {
    elements.mobileCompareCount.textContent = "";
    elements.mobileCompareDots.innerHTML = "";
    return;
  }

  elements.mobileCompareCount.textContent = `${state.mobileSlideIndex + 1} / ${totalSlides}`;
  elements.mobilePrevButton.disabled = !hasMultiple || state.mobileSlideIndex === 0;
  elements.mobileNextButton.disabled = !hasMultiple || state.mobileSlideIndex >= totalSlides - 1;

  elements.mobileCompareDots.innerHTML = Array.from({ length: totalSlides }, (_, index) => `
    <button
      class="mobile-page-dot${index === state.mobileSlideIndex ? " is-active" : ""}"
      type="button"
      data-slide-index="${index}"
      aria-label="비교 ${index + 1} 보기"
      aria-pressed="${String(index === state.mobileSlideIndex)}"
    ></button>
  `).join("");
}

function scrollMobileCompareTo(index, smooth = true) {
  const slides = [...elements.mobileCompareTrack.querySelectorAll(".mobile-compare-slide")];
  if (!slides.length) return;

  const clampedIndex = Math.max(0, Math.min(index, slides.length - 1));
  state.mobileSlideIndex = clampedIndex;
  updateMobileCompareNavigation(slides.length);

  elements.mobileCompareTrack.scrollTo({
    left: slides[clampedIndex].offsetLeft,
    behavior: smooth ? "smooth" : "auto"
  });
}

function renderMobileCompare(payload) {
  const slides = getMobileSlides(payload);
  if (!slides.length) {
    elements.mobileCompareTrack.innerHTML = "";
    updateMobileCompareNavigation(0);
    return;
  }

  state.mobileSlideIndex = Math.min(state.mobileSlideIndex, slides.length - 1);

  elements.mobileCompareTrack.innerHTML = slides.map((slide, slideIndex) => `
    <article class="mobile-compare-slide" data-slide-index="${slideIndex}">
      <div class="mobile-compare-head">
        <h3 class="mobile-compare-title">${escapeHtml(slide.title)}</h3>
      </div>

      <div class="mobile-compare-grid">
        <div class="mobile-compare-row is-head">
          <span>일자</span>
          <span>${escapeHtml(slide.benchmarkLabel)}</span>
          <span>${escapeHtml(slide.compareLabel)}</span>
          <span>차이</span>
        </div>
        ${slide.rows.map((row) => {
          const benchmarkCell = row.values[slide.benchmarkIndex] || {};
          const compareCell = row.values[slide.compareIndex] || {};
          const difference = Number.isFinite(compareCell.value) && Number.isFinite(benchmarkCell.value)
            ? compareCell.value - benchmarkCell.value
            : null;
          return `
            <div class="mobile-compare-row">
              <span>${escapeHtml(row.displayDate)}</span>
              <span class="${getToneClass(Number(benchmarkCell.value))}">${escapeHtml(benchmarkCell.display || "-")}</span>
              <span class="${getToneClass(Number(compareCell.value))}">${escapeHtml(compareCell.display || "-")}</span>
              <span class="${getToneClass(Number(difference))}">${escapeHtml(formatPercent(difference))}</span>
            </div>
          `;
        }).join("")}
      </div>
    </article>
  `).join("");

  updateMobileCompareNavigation(slides.length);
  requestAnimationFrame(() => {
    scrollMobileCompareTo(state.mobileSlideIndex, false);
  });
}

function renderDashboard(payload, options = {}) {
  payload = enrichDashboardPayload(normalizeDashboardTradingDays(normalizeDashboardPayloadAge(payload)));
  state.dashboard = payload;
  state.dashboardFromCache = Boolean(options.fromCache);
  state.selectedDate = payload.selectedDate || state.selectedDate;
  state.dataMode = payload.sourceMode || "gateway";
  state.session = payload.session || "linked";
  syncEditableSlotsFromDashboard(Array.isArray(payload.slots) ? payload.slots : []);

  elements.dateInput.value = payload.selectedDate || "";
  elements.dateInput.max = payload.today || getTodayKstDate();
  const snapshotUpdatedAt = payload.snapshotUpdatedAt || payload.updatedAt;
  const snapshotAgeText = payload.snapshotUpdatedAt ? formatAgeSeconds(payload.snapshotAgeSeconds) : "";
  elements.updatedAt.textContent = [
    `마지막 동기화 ${formatTimestamp(snapshotUpdatedAt)}`,
    snapshotAgeText ? `스냅샷 ${snapshotAgeText}` : ""
  ].filter(Boolean).join(" · ");
  if (payload.snapshotUpdatedAt) {
    state.snapshotStatus = {
      ok: true,
      selectedDate: payload.selectedDate,
      hasSnapshot: true,
      snapshotUpdatedAt: payload.snapshotUpdatedAt,
      snapshotAgeSeconds: payload.snapshotAgeSeconds,
      snapshotSource: payload.snapshotSource,
      snapshotFresh: true
    };
    renderSnapshotHealth(state.snapshotStatus);
  }

  renderSlots(payload.slots);
  renderTable(payload);
  renderMobileCompare(payload);

  if (options.cache !== false) {
    saveCachedDashboardPayload(payload);
  }
}

function bindEvents() {
  elements.dateInput.addEventListener("change", () => {
    const nextDate = elements.dateInput.value || getTodayKstDate();
    if (state.activeView === "calculator") {
      deferDashboardLoadForDate(nextDate);
      setStatus("계산기 준비 완료", "success");
      return;
    }
    loadDashboard(nextDate).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  });

  elements.dateInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const nextDate = elements.dateInput.value || getTodayKstDate();
    if (state.activeView === "calculator") {
      deferDashboardLoadForDate(nextDate);
      setStatus("계산기 준비 완료", "success");
      return;
    }
    loadDashboard(nextDate).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  });

  elements.snapshotRefreshButton?.addEventListener("click", () => {
    refreshDashboardSnapshotManually().catch((error) => {
      console.error(error);
      setStatus(error, "error");
    });
  });

  [elements.calculatorViewButton, elements.dashboardViewButton, elements.recommendationViewButton, ...elements.mobileViewButtons].forEach((button) => {
    if (!button) return;
    button.addEventListener("click", () => {
      const nextView = normalizeViewName(button.dataset.view || "dashboard");
      setActiveView(nextView);
      if ((nextView === "dashboard" || nextView === "recommendations") && !state.dashboard && !state.loading) {
        loadDashboard(state.selectedDate || elements.dateInput.value || getTodayKstDate()).catch((error) => {
          console.error(error);
          setStatus(error.message, "error");
        });
      }
    });
  });

  elements.mobilePrevButton.addEventListener("click", () => {
    scrollMobileCompareTo(state.mobileSlideIndex - 1);
  });

  elements.mobileNextButton.addEventListener("click", () => {
    scrollMobileCompareTo(state.mobileSlideIndex + 1);
  });

  elements.mobileCompareDots.addEventListener("click", (event) => {
    const target = event.target.closest("[data-slide-index]");
    if (!target) return;
    scrollMobileCompareTo(Number(target.dataset.slideIndex));
  });

  elements.recommendationRunButton?.addEventListener("click", () => {
    loadRecommendations().catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  });

  elements.recommendationFilterToggle?.addEventListener("click", () => {
    setRecommendationFiltersCollapsed(!state.recommendations.filtersCollapsed);
  });

  [elements.recommendationSort, elements.recommendationSlotTarget].forEach((control) => {
    if (!control) return;
    control.addEventListener("change", () => {
      setRecommendationState({
        filters: getRecommendationFilters()
      });
    });
  });

  elements.recommendationUniverse?.addEventListener("change", () => {
    const filters = getRecommendationFilters();
    setRecommendationState({ filters });
    warmRecommendationUniverse(filters, { silent: true }).catch(() => {});
  });

  [
    elements.recommendationPeriod,
    elements.recommendationLevel,
    elements.recommendationMode,
    elements.recommendationLookback,
    elements.recommendationTolerance
  ].forEach((control) => {
    if (!control) return;
    control.addEventListener("change", () => {
      renderRecommendationFilterPanel();
    });
  });

  elements.recommendationList?.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-recommendation-code]");
    if (!actionButton) return;

    addRecommendationToSlots(actionButton.dataset.recommendationCode).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  });

  elements.mobileCompareTrack.addEventListener("scroll", () => {
    const slides = [...elements.mobileCompareTrack.querySelectorAll(".mobile-compare-slide")];
    if (!slides.length) return;

    const currentLeft = elements.mobileCompareTrack.scrollLeft;
    const closestIndex = slides.reduce((bestIndex, slide, index) => {
      const bestDistance = Math.abs(slides[bestIndex].offsetLeft - currentLeft);
      const nextDistance = Math.abs(slide.offsetLeft - currentLeft);
      return nextDistance < bestDistance ? index : bestIndex;
    }, 0);

    if (closestIndex !== state.mobileSlideIndex) {
      state.mobileSlideIndex = closestIndex;
      updateMobileCompareNavigation(slides.length);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    renderRecommendationFilterPanel();
    if (!state.dashboard) return;
    requestAnimationFrame(() => {
      scrollMobileCompareTo(state.mobileSlideIndex, false);
    });
  });
}

function formatToleranceLabel(value) {
  if (!Number.isFinite(value)) return "-";
  return `±${(value * 100).toFixed(1)}%`;
}

function formatRecommendationModeLabel(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "touch":
      return "구간 터치";
    case "breakout_up":
      return "상향 돌파";
    case "breakdown_down":
      return "하향 이탈";
    default:
      return "구간 근접";
  }
}

function formatRecommendationLookbackLabel(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 1) return "기준일";
  return `최근 ${numeric}거래일`;
}

function formatRecommendationUniverseLabel(value) {
  const normalized = normalizeRecommendationUniverseClient(value);
  if (normalized === "KOSPI200") return "KOSPI200";
  if (normalized === "KOSDAQ150") return "KOSDAQ150";
  return normalized || "-";
}

function formatRecommendationSlotTargetLabel(value) {
  if (String(value || "auto") === "auto") return "자동 담기";
  const slot = findEditableSlot(value);
  return slot ? getEditableSlotLabel(slot) : "직접 선택";
}

function renderRecommendationFilterPanel() {
  const filters = getRecommendationFilters();
  const isCompact = isRecommendationCompactMode();
  const collapsed = isCompact ? Boolean(state.recommendations.filtersCollapsed) : false;

  if (elements.recommendationFilterSummaryInline) {
    elements.recommendationFilterSummaryInline.textContent = buildRecommendationFilterSummary(filters);
  }

  if (elements.recommendationFilterToggle) {
    elements.recommendationFilterToggle.hidden = !isCompact;
    elements.recommendationFilterToggle.setAttribute("aria-expanded", String(!collapsed));
  }

  if (elements.recommendationFilterToggleState) {
    elements.recommendationFilterToggleState.textContent = collapsed ? "열기" : "접기";
  }

  if (elements.recommendationFiltersPanel) {
    elements.recommendationFiltersPanel.hidden = collapsed;
  }

  syncRecommendationRunButtonState();
}

function getEditableSlotLabel(slotId) {
  const slot = typeof slotId === "object" ? slotId : findEditableSlot(slotId);
  if (!slot) return "종목 슬롯";
  return `종목${slot.id}`;
}

function renderRecommendationSlotOptions(selectedValue = state.recommendations.filters.slotTarget) {
  if (!elements.recommendationSlotTarget) return;

  const options = [
    '<option value="auto">자동 · 빈 슬롯 우선</option>',
    ...state.editableSlots.map((slot) => {
      const label = `${getEditableSlotLabel(slot)} · ${slot.stock?.name || "비어 있음"}`;
      return `<option value="${slot.id}">${escapeHtml(label)}</option>`;
    })
  ];

  elements.recommendationSlotTarget.innerHTML = options.join("");
  const normalizedValue = String(selectedValue || "auto");
  elements.recommendationSlotTarget.value = normalizedValue;
  if (elements.recommendationSlotTarget.value !== normalizedValue) {
    elements.recommendationSlotTarget.value = "auto";
  }
}

function formatRecommendationMarketLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "KOSPI") return "KOSPI";
  if (normalized === "KOSDAQ") return "KOSDAQ";
  return normalized || "OTHER";
}

function buildRecommendationSignalCopy(item, filters = state.recommendations.filters) {
  const mode = String(item?.signalMode || filters.mode || "near").trim().toLowerCase();
  const signalDateLabel = formatDisplayDate(item?.signalDate || item?.priceDate);
  const levelLabel = formatRecommendationLevelLabel(Number(item?.level ?? filters.level));

  if (mode === "touch") {
    return `${signalDateLabel} ${levelLabel} 구간을 터치했습니다.`;
  }

  if (mode === "breakout_up") {
    return `${signalDateLabel} ${levelLabel} 구간을 상향 돌파했습니다.`;
  }

  if (mode === "breakdown_down") {
    return `${signalDateLabel} ${levelLabel} 구간을 하향 이탈했습니다.`;
  }

  return `${signalDateLabel} 현재가가 ${levelLabel} 구간 부근입니다.`;
}

function buildRecommendationSignalMeta(item, filters = state.recommendations.filters) {
  return [
    String(item?.code || "").trim(),
    formatRecommendationLookbackLabel(Number(item?.signalWindowDays || filters.lookbackDays || 1)),
    `신호일 ${formatDisplayDate(item?.signalDate || item?.priceDate)}`
  ].filter(Boolean).join(" · ");
}

function setRecommendationBusyState(isBusy) {
  const busy = Boolean(isBusy);
  state.recommendations.loading = busy;

  [
    elements.recommendationUniverse,
    elements.recommendationPeriod,
    elements.recommendationLevel,
    elements.recommendationMode,
    elements.recommendationLookback,
    elements.recommendationTolerance
  ].forEach((element) => {
    if (element) element.disabled = busy;
  });

  syncRecommendationRunButtonState();
}

function buildRecommendationSummary(payload) {
  if (!payload) return "";

  const parts = [
    payload.universeLabel || formatRecommendationUniverseLabel(payload.universe),
    `${payload.scannedCount || 0}종목`,
    `${payload.matchedCount || 0}종목 포착`,
    `${payload.periodMonths || 6}개월`,
    formatRecommendationLevelLabel(Number(payload.level)),
    formatRecommendationModeLabel(payload.mode),
    formatToleranceLabel(Number(payload.tolerance))
  ];

  return parts.filter(Boolean).join(" · ");
}

function resolveRecommendationTargetSlot(slotTarget = state.recommendations.filters.slotTarget) {
  const normalizedTarget = String(slotTarget || "auto").trim().toLowerCase();
  if (normalizedTarget !== "auto") {
    const slot = findEditableSlot(Number(normalizedTarget));
    if (!slot) {
      throw buildAppError(APP_ERROR_CODES.recommendationSlotMissing, "선택한 종목 슬롯을 찾지 못했습니다.");
    }
    return slot;
  }

  const emptySlot = state.editableSlots.find((slot) => !slot.stock);
  if (!emptySlot) {
    throw buildAppError(APP_ERROR_CODES.recommendationSlotFull, "빈 종목 슬롯이 없습니다. 기존 종목을 비우거나 직접 슬롯을 선택해 주세요.");
  }
  return emptySlot;
}

async function addRecommendationToSlots(code, slotTarget = getRecommendationFilters().slotTarget) {
  await ensureDashboardReadyForRecommendationFlow();

  const stock = findCatalogItem(code)
    || state.recommendations.items.find((item) => normalizeTicker(item.code) === normalizeTicker(code))
    || null;
  if (!stock) {
    throw buildAppError(APP_ERROR_CODES.recommendationStockMissing, `추천 종목을 찾지 못했습니다: ${code}`);
  }

  const targetSlot = resolveRecommendationTargetSlot(slotTarget);
  const previousStock = targetSlot.stock ? { ...targetSlot.stock } : null;
  const nextStock = enrichStockMeta(stock);
  const nextCodes = state.editableSlots.map((slot) => (
    slot.id === targetSlot.id
      ? nextStock.code
      : normalizeTicker(slot.stock?.code || slot.query || "")
  ));

  await saveTickerCodes(nextCodes);
  setActiveView("dashboard");
  trackUsage("recommendation_add", {
    view: "recommendations",
    selectedDate: state.selectedDate || elements.dateInput.value || getTodayKstDate(),
    success: true,
    metadata: {
      slotTarget
    }
  });

  if (previousStock && normalizeTicker(previousStock.code) !== normalizeTicker(nextStock.code)) {
    setStatus(`${getEditableSlotLabel(targetSlot)}이 ${previousStock.name}에서 ${nextStock.name}(으)로 바뀌었습니다.`, "success");
    return;
  }

  setStatus(`${nextStock.name}을(를) ${getEditableSlotLabel(targetSlot)}에 담았습니다.`, "success");
}

async function requestGateway(params, options = {}) {
  const action = String(params?.action || "").trim();
  if (!state.gatewayUrl) {
    throw buildAppError(APP_ERROR_CODES.gatewayMissing, "게이트웨이 URL이 비어 있습니다.", { action });
  }

  let response;
  try {
    response = await fetch(buildRequestUrl(params), {
      method: "GET",
      cache: "no-store"
    });
  } catch (error) {
    throw buildAppError(APP_ERROR_CODES.gatewayRequestFailed, "게이트웨이에 연결하지 못했습니다.", {
      action,
      cause: error
    });
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw buildAppError(APP_ERROR_CODES.gatewayResponseParse, "게이트웨이 응답을 읽지 못했습니다.", {
      action,
      status: response.status,
      cause: error
    });
  }

  if (!response.ok || !payload?.ok) {
    const gatewayError = payload?.error && typeof payload.error === "object"
      ? payload.error
      : null;
    const message = String(
      payload?.message
      || gatewayError?.message
      || `게이트웨이 요청이 실패했습니다. (${response.status})`
    ).trim();
    const status = Number(gatewayError?.status || payload?.status || response.status);
    const code = String(
      payload?.code
      || payload?.errorCode
      || gatewayError?.code
      || inferGatewayErrorCode(status, message)
    ).trim();

    if (!options._retriedSparse
      && (action === "dashboard-data" || action === "update-tickers")
      && code === APP_ERROR_CODES.monthlyDataSparse) {
      await waitMs(1800);
      return requestGateway(params, {
        ...options,
        _retriedSparse: true
      });
    }

    throw buildAppError(code, message, {
      action,
      status,
      payload
    });
  }

  return payload;
}

async function loadSnapshotStatus(date = state.selectedDate || elements.dateInput.value || getTodayKstDate()) {
  if (!state.gatewayUrl || !elements.snapshotHealth) return null;

  try {
    const payload = await requestGateway({
      action: "dashboard-snapshot-status",
      date
    });
    state.snapshotStatus = payload;
    renderSnapshotHealth(payload);
    return payload;
  } catch (error) {
    state.snapshotStatus = { error };
    renderSnapshotHealth(state.snapshotStatus);
    console.warn("snapshot status check failed", error);
    return null;
  }
}

async function refreshDashboardSnapshotManually() {
  if (state.snapshotRefreshing) return;

  const date = state.selectedDate || elements.dateInput.value || getTodayKstDate();
  state.snapshotRefreshing = true;
  renderSnapshotHealth();
  setStatus("최신 스냅샷을 갱신하는 중...", "loading");

  try {
    const payload = await requestGateway({
      action: "dashboard-snapshot-refresh",
      date
    });

    if (payload.throttled) {
      state.snapshotStatus = payload;
      renderSnapshotHealth(payload);
      setStatus(`이미 갱신 요청이 처리 중입니다. ${Number(payload.retryAfterSeconds || 1)}초 뒤 다시 시도해 주세요.`, "loading");
      return;
    }

    setStatus("최신 스냅샷 갱신 완료. 월간표를 다시 불러오는 중...", "loading");
    await loadDashboard(date, { useCache: false });
    await loadSnapshotStatus(date);
  } catch (error) {
    state.snapshotStatus = { error };
    renderSnapshotHealth(state.snapshotStatus);
    console.error(error);
    setStatus(error, "error");
  } finally {
    state.snapshotRefreshing = false;
    renderSnapshotHealth();
  }
}

function getSlotCaption(slot) {
  if (!slot.editable) return "기준 지수";
  if (slot.stock) return `${slot.stock.market} · ${slot.stock.code}`;
  return "코스피/코스닥 종목을 자유롭게 입력할 수 있습니다.";
}

function getSlotMarketLabel(slot) {
  if (!slot) return "-";
  return String(slot.market || slot.stock?.market || "MARKET").trim().toUpperCase();
}

function renderSlots(slots) {
  elements.slotGrid.innerHTML = slots.map((slot) => {
    const isFixed = !slot.editable;
    const displayName = isFixed ? slot.name : (slot.stock?.name || slot.name || `종목${slot.id}`);
    const displayValue = isFixed ? slot.name : (slot.query || slot.code || "");
    const totalValue = Number(slot.total);
    const totalText = `합계 ${formatPercent(totalValue)}`;
    const marketLabel = getSlotMarketLabel(slot);

    return `
      <article class="slot-card${isFixed ? " is-fixed" : ""}" data-slot-card="${slot.id || slot.code}">
        <div class="slot-heading">
          <h3 class="slot-name">${escapeHtml(displayName)}</h3>
          <p class="slot-market slot-market-inline">${escapeHtml(marketLabel)}</p>
        </div>
        <input
          class="slot-input"
          type="text"
          value="${escapeHtml(displayValue)}"
          list="ticker-list"
          data-editable="${String(Boolean(slot.editable))}"
          ${slot.editable ? `data-slot-id="${slot.id}"` : "disabled"}
          autocomplete="off"
          spellcheck="false"
        >
        <div class="slot-footer" title="${escapeHtml(getSlotCaption(slot))}">
          <p class="slot-total ${getToneClass(totalValue)}">${escapeHtml(totalText)}</p>
          <p class="slot-market slot-market-footer">${escapeHtml(marketLabel)}</p>
        </div>
      </article>
    `;
  }).join("");

  renderRecommendationSlotOptions(state.recommendations.filters.slotTarget);
  attachSlotEvents();
  setBusyState(state.loading || state.saving);
}

async function loadRecommendations() {
  if (!state.gatewayUrl) {
    throw buildAppError(APP_ERROR_CODES.gatewayMissing, "추천 기능을 사용하려면 게이트웨이 연결이 필요합니다.");
  }

  const filters = getRecommendationFilters();
  const selectedDate = state.selectedDate || elements.dateInput.value || getTodayKstDate();
  const usageStartedAt = markUsageStart();

  await ensureDashboardReadyForRecommendationFlow(selectedDate);
  await waitForRecommendationCooldown(filters);

  setRecommendationState({
    loading: true,
    filters,
    summary: `${selectedDate} 기준 추천 후보를 계산하고 있습니다.`
  });

  try {
    if (state.loading) {
      setRecommendationState({
        loading: true,
        filters,
        summary: "월간표를 먼저 동기화하고 있습니다. 잠시만 기다려 주세요."
      });
      await waitForLoadingToFinish();
    }

    const elapsedSinceDashboardLoad = Date.now() - Number(state.lastDashboardLoadedAt || 0);
    if (state.lastDashboardLoadedAt && elapsedSinceDashboardLoad < RECOMMENDATION_GATEWAY_COOLDOWN_MS) {
      const waitDuration = RECOMMENDATION_GATEWAY_COOLDOWN_MS - elapsedSinceDashboardLoad;
      setRecommendationState({
        loading: true,
        filters,
        summary: `대시보드 동기화 직후라 ${Math.ceil(waitDuration / 1000)}초 뒤 추천 조회를 이어갑니다.`
      });
      await waitMs(waitDuration);
    }

    const warmupPromise = warmRecommendationUniverse(filters, { silent: true });
    if (warmupPromise) {
      setRecommendationState({
        loading: true,
        filters,
        summary: `${selectedDate} 기준 추천 대상을 미리 준비하고 있습니다.`
      });
      await warmupPromise;
    }

    startRecommendationCooldown(RECOMMENDATION_RUN_COOLDOWN_MS);

    const payload = await requestGateway({
      action: "fibonacci-recommendations",
      date: selectedDate,
      universe: filters.universe,
      periodMonths: filters.periodMonths,
      level: filters.level,
      mode: filters.mode,
      lookbackDays: filters.lookbackDays,
      tolerance: filters.tolerance
    });
    trackUsage("recommendation_run", {
      view: "recommendations",
      selectedDate,
      success: true,
      durationMs: usageDurationSince(usageStartedAt),
      metadata: {
        universe: filters.universe,
        periodMonths: filters.periodMonths,
        level: filters.level,
        mode: filters.mode,
        lookbackDays: filters.lookbackDays,
        tolerance: filters.tolerance,
        resultCount: Array.isArray(payload.items) ? payload.items.length : 0
      }
    });

    setRecommendationState({
      loading: false,
      items: Array.isArray(payload.items) ? payload.items : [],
      filters,
      summary: buildRecommendationSummary(payload)
    });
    if (isRecommendationCompactMode()) {
      setRecommendationFiltersCollapsed(true);
    }
    setStatus("추천 후보를 불러왔습니다.", "success");
  } catch (error) {
    setRecommendationState({
      loading: false,
      items: [],
      filters,
      summary: formatAppErrorMessage(error)
    });
    trackUsage("recommendation_run", {
      view: "recommendations",
      selectedDate,
      success: false,
      durationMs: usageDurationSince(usageStartedAt),
      metadata: {
        universe: filters.universe,
        periodMonths: filters.periodMonths,
        level: filters.level,
        mode: filters.mode,
        reason: String(error?.code || error?.message || "recommendation_failed").slice(0, 48)
      }
    });
    throw error;
  }
}

function getDashboardSourceMode() {
  const configured = String(window.PP_CONFIG?.dashboardSourceMode || DEFAULT_DASHBOARD_SOURCE_MODE).trim().toLowerCase();
  if (configured === "api") return "api";
  const persisted = String(localStorage.getItem(STORAGE_DASHBOARD_SOURCE_MODE) || configured).trim().toLowerCase();
  return persisted === "sheet" ? "sheet" : "api";
}

async function loadDashboardPayloadFromApi(date, options = {}) {
  const tickers = Array.isArray(options.tickers)
    ? options.tickers.map((code) => normalizeTicker(code))
    : getEditableTickerCodes();

  if (state.gatewayUrl && tickers.length === SLOT_COUNT) {
    try {
      return await requestGateway({
        action: "dashboard-data-api",
        date,
        tickers: tickers.join(",")
      });
    } catch (error) {
      console.warn("server dashboard api failed, fallback to client composition", error);
    }
  }

  if (!window.DashboardApiSource?.loadPayload) {
    throw buildAppError(APP_ERROR_CODES.gatewayMissing, "API 데이터 소스 모듈을 찾지 못했습니다.");
  }

  return window.DashboardApiSource.loadPayload({
    date,
    getAllSlots,
    loadMonthlySeriesForTarget,
    loadSnapshotForTarget,
    applySnapshotToSeries,
    buildDashboardPayload,
    resolveMarketSession
  });
}

async function loadDashboardPayloadFromStaticSnapshot(date) {
  const snapshotDate = resolveDashboardRequestDate(date);
  const snapshotUrl = buildDashboardSnapshotUrl(snapshotDate);
  if (!snapshotUrl) return null;

  try {
    const response = await fetch(snapshotUrl, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) return null;

    const payload = await response.json();
    const requestedDate = String(snapshotDate || "").trim();
    if (!payload?.ok || !Array.isArray(payload.rows) || !Array.isArray(payload.slots)) return null;
    if (requestedDate && payload.selectedDate !== requestedDate) return null;

    return normalizeDashboardPayloadAge({
      ...payload,
      sourceMode: "static-snapshot",
      staticSnapshot: true
    });
  } catch (error) {
    console.warn("static dashboard snapshot failed", error);
    return null;
  }
}

async function loadDashboardPayloadFromSheetWithRetry(date, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestGateway({ action: "dashboard-data", date });
    } catch (error) {
      lastError = error;
      const code = String(error?.code || "").trim();
      const isRetryable = [
        APP_ERROR_CODES.monthlyDataSparse,
        APP_ERROR_CODES.gatewayRequestFailed,
        "PP-SERVER"
      ].includes(code);

      if (!isRetryable || attempt >= maxAttempts) {
        throw error;
      }

      setStatus(`월간표 동기화 재시도 중... (${attempt}/${maxAttempts})`, "loading");
      await waitMs(1800 * attempt);
    }
  }

  throw lastError || buildAppError(APP_ERROR_CODES.unknown, "월간표를 불러오지 못했습니다.");
}

async function loadDashboardPayloadWithRetry(date, maxAttempts = 3) {
  const staticPayload = await loadDashboardPayloadFromStaticSnapshot(date);
  if (staticPayload) return staticPayload;

  const sourceMode = getDashboardSourceMode();
  if (sourceMode === "sheet") {
    return loadDashboardPayloadFromSheetWithRetry(date, maxAttempts);
  }

  try {
    return await loadDashboardPayloadFromApi(date);
  } catch (error) {
    console.warn("api dashboard source failed, fallback to sheet", error);
    setStatus("API 조회에 실패해 스프레드시트 방식으로 전환합니다...", "loading");
    return loadDashboardPayloadFromSheetWithRetry(date, maxAttempts);
  }
}

async function loadDashboard(date = getTodayKstDate(), options = {}) {
  const usageStartedAt = markUsageStart();
  const requestedDate = String(date || getTodayKstDate()).trim();
  const loadDate = resolveDashboardRequestDate(requestedDate);
  const previousDate = state.selectedDate;
  if (previousDate && previousDate !== loadDate) {
    setRecommendationState({
      items: [],
      loading: false,
      summary: ""
    });
  }

  state.selectedDate = loadDate;
  localStorage.setItem(STORAGE_LAST_DATE, loadDate);
  const renderedCachedPayload = options.useCache !== false && renderCachedDashboardIfAvailable(loadDate);
  state.loading = true;
  setBusyState(true);
  if (!renderedCachedPayload) {
    setStatus(
      requestedDate !== loadDate
        ? `${requestedDate}은(는) 휴장일이라 ${loadDate} 기준 월간표를 불러오는 중...`
        : "월간표를 불러오는 중...",
      "loading"
    );
  }

  try {
    const payload = await loadDashboardPayloadWithRetry(loadDate);
    const staticPayload = isStaticDashboardPayload(payload);
    renderDashboard(payload);
    state.lastDashboardLoadedAt = Date.now();
    if (state.activeView === "recommendations") {
      warmRecommendationUniverse(state.recommendations.filters, { silent: true }).catch(() => {});
    }
    if (!staticPayload) {
      scheduleCatalogLoad();
      loadSnapshotStatus(payload.selectedDate || loadDate).catch(() => {});
      trackUsage("dashboard_load", {
        view: "dashboard",
        selectedDate: payload.selectedDate || loadDate,
        success: true,
        durationMs: usageDurationSince(usageStartedAt),
        metadata: {
          ...buildDashboardUsageMetadata(payload, staticPayload ? "snapshot" : getDashboardSourceMode()),
          requestedDate
        }
      });
    }
    if (staticPayload) {
      trackUsage("dashboard_load", {
        view: "dashboard",
        selectedDate: payload.selectedDate || loadDate,
        success: true,
        durationMs: usageDurationSince(usageStartedAt),
        metadata: {
          ...buildDashboardUsageMetadata(payload, "snapshot"),
          requestedDate
        }
      });
    }
    setStatus("업데이트 완료", "success");
  } catch (error) {
    trackUsage("dashboard_load", {
      view: "dashboard",
      selectedDate: loadDate,
      success: false,
      durationMs: usageDurationSince(usageStartedAt),
      metadata: {
        requestedDate,
        reason: String(error?.code || error?.message || "dashboard_load_failed").slice(0, 48)
      }
    });
    console.error(error);
    setStatus(error, "error");
  } finally {
    state.loading = false;
    state.saving = false;
    setBusyState(false);
  }
}

function buildRecommendationFilterSummary(filters = getRecommendationFilters()) {
  return [
    formatRecommendationUniverseLabel(filters.universe),
    `${Number(filters.periodMonths || 6)}개월`,
    formatRecommendationLevelLabel(Number(filters.level)),
    formatRecommendationModeLabel(filters.mode),
    formatRecommendationLookbackLabel(Number(filters.lookbackDays || 1))
  ].join(" · ");
}

function getRecommendationAddLabel(slotTarget) {
  return "담기";
}

function getRecommendationTargetHint(slotTarget) {
  return "";
}

function renderRecommendationResults() {
  const recommendationState = state.recommendations;
  setRecommendationSummaryVisibility(recommendationState.summary);

  if (!elements.recommendationList) return;

  const filters = recommendationState.filters || {};
  const items = Array.isArray(recommendationState.items)
    ? sortRecommendationItems(recommendationState.items, "distance_abs")
    : [];

  if (!items.length) {
    const emptyCopy = recommendationState.loading
      ? "추천 후보를 계산하고 있습니다."
      : "조건에 맞는 종목이 없습니다.";
    elements.recommendationList.innerHTML = `
      <div class="recommendation-empty">${escapeHtml(emptyCopy)}</div>
    `;
    return;
  }

  const addButtonLabel = getRecommendationAddLabel();
  const groups = groupRecommendationItemsByMarket(items);

  elements.recommendationList.innerHTML = groups.map((group) => `
    <section class="recommendation-group" data-market-group="${escapeHtml(group.key)}">
      <div class="recommendation-group-head">
        <div>
          <h3 class="recommendation-group-title">${escapeHtml(group.label)}</h3>
          <p class="recommendation-group-note">
            ${escapeHtml(`${group.items.length}종목 · ${formatRecommendationModeLabel(filters.mode)}`)}
          </p>
        </div>
      </div>

      <div class="recommendation-group-body">
        ${group.items.map((item) => `
          <article class="recommendation-item">
            <div class="recommendation-main">
              <div class="recommendation-topline">
                <strong class="recommendation-name">${escapeHtml(item.name || item.code || "-")}</strong>
                <span class="recommendation-badge">${escapeHtml(formatRecommendationMarketLabel(item.market || "-"))}</span>
                <span class="recommendation-level">${escapeHtml(formatRecommendationLevelLabel(Number(item.level)))}</span>
              </div>

              <p class="recommendation-subline">${escapeHtml(buildRecommendationSignalMeta(item, filters))}</p>

              <p class="recommendation-signal">
                <strong>${escapeHtml(item.signalLabel || formatRecommendationModeLabel(filters.mode))}</strong>
                <span>${escapeHtml(buildRecommendationSignalCopy(item, filters))}</span>
              </p>

              <div class="recommendation-meta">
                <div class="recommendation-meta-block recommendation-meta-block-primary">
                  <span class="recommendation-meta-label">현재가</span>
                  <span class="recommendation-meta-value">${escapeHtml(formatNumber(Number(item.currentPrice), 0))}</span>
                </div>
                <div class="recommendation-meta-block recommendation-meta-block-primary">
                  <span class="recommendation-meta-label">기준가</span>
                  <span class="recommendation-meta-value">${escapeHtml(formatNumber(Number(item.levelPrice), 0))}</span>
                </div>
                <div class="recommendation-meta-block recommendation-meta-block-primary">
                  <span class="recommendation-meta-label">괴리율</span>
                  <span class="recommendation-meta-value ${getToneClass(Number(item.distanceRate))}">${escapeHtml(formatPercent(Number(item.distanceRate)))}</span>
                </div>
                <div class="recommendation-meta-block recommendation-meta-block-secondary">
                  <span class="recommendation-meta-label">기간 고점</span>
                  <span class="recommendation-meta-value">${escapeHtml(formatNumber(Number(item.periodHigh), 0))}</span>
                </div>
                <div class="recommendation-meta-block recommendation-meta-block-secondary">
                  <span class="recommendation-meta-label">기간 저점</span>
                  <span class="recommendation-meta-value">${escapeHtml(formatNumber(Number(item.periodLow), 0))}</span>
                </div>
              </div>
            </div>

            <div class="recommendation-actions">
              <button class="recommendation-add" type="button" data-recommendation-code="${escapeHtml(item.code)}">
                ${escapeHtml(addButtonLabel)}
              </button>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function restoreState() {
  const today = getTodayKstDate();
  state.selectedDate = resolveDashboardRequestDate(today);
  state.activeView = "calculator";
  localStorage.setItem(STORAGE_LAST_DATE, state.selectedDate);
  localStorage.setItem(STORAGE_ACTIVE_VIEW, state.activeView);
  elements.dateInput.value = state.selectedDate;
  elements.dateInput.max = today;
  restoreEditableSlots();
}

async function bootstrap() {
  ensureGatewayCard();
  restoreState();
  const catalogHydrated = hydrateCachedCatalog();
  applyStaticUiText();
  bindEvents();
  setActiveView(state.activeView, { persist: false });
  setRecommendationState({
    summary: "필터를 고른 뒤 추천 찾기를 누르면 후보 종목이 여기에 표시됩니다."
  });
  setRecommendationSummaryVisibility("");
  renderSlots(getAllSlots());
  buildTickerDatalist();
  scheduleCatalogLoad({ delayMs: catalogHydrated ? 0 : 600 });

  try {
    if (state.activeView === "calculator") {
      setStatus("계산기 준비 완료", "success");
      return;
    }

    await loadDashboard(state.selectedDate);
  } catch (error) {
    console.error(error);
    setStatus(error, "error");
  }
}

bootstrap();
