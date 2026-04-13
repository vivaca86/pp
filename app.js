const MARKET_TIMEZONE = "Asia/Seoul";
const SLOT_COUNT = 6;
const GATEWAY_REQUEST_SPACING_MS = 260;
const STORAGE_LAST_DATE = "stock_lab_selected_date";
const STORAGE_SLOTS = "stock_lab_slots";
const STORAGE_ACTIVE_VIEW = "stock_lab_active_view";
const RECOMMENDATION_GATEWAY_COOLDOWN_MS = 8000;
const RECOMMENDATION_WARMUP_MAX_PERIOD_MONTHS = 12;
const DEFAULT_GATEWAY_URL = String(
  window.PP_CONFIG?.gatewayUrl
  || window.STOCK_LAB_CONFIG?.gatewayUrl
  || ""
).trim();
const recommendationWarmupState = {
  completedKeys: new Set(),
  pending: new Map()
};

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
  activeView: "dashboard",
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
    loading: false
  }
};

const elements = {
  dateInput: document.getElementById("date-input"),
  setupCard: document.getElementById("setup-card"),
  statusPill: document.getElementById("status-pill"),
  updatedAt: document.getElementById("updated-at"),
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
  recommendationSort: document.getElementById("recommendation-sort"),
  recommendationSlotTarget: document.getElementById("recommendation-slot-target"),
  recommendationSummary: document.getElementById("recommendation-summary"),
  recommendationList: document.getElementById("recommendation-list"),
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
  return view === "recommendations" ? "recommendations" : "dashboard";
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

  [elements.dashboardViewButton, elements.recommendationViewButton, ...elements.mobileViewButtons].forEach((button) => {
    if (!button) return;
    const isActive = button.dataset.view === activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setActiveView(view, options = {}) {
  const nextView = normalizeViewName(view);
  state.activeView = nextView;
  renderActiveView();
  renderRecommendationFilterPanel();

  if (options.persist !== false) {
    localStorage.setItem(STORAGE_ACTIVE_VIEW, nextView);
  }

  if (nextView === "recommendations" && options.warmup !== false) {
    warmRecommendationUniverse(state.recommendations.filters, { silent: true }).catch(() => {});
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
    sortBy: String(elements.recommendationSort?.value || "distance_abs").trim().toLowerCase(),
    slotTarget: String(elements.recommendationSlotTarget?.value || "auto").trim().toLowerCase()
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
  if (elements.recommendationSort) elements.recommendationSort.value = String(filters.sortBy || "distance_abs");
  renderRecommendationSlotOptions(filters.slotTarget);
  if (elements.recommendationSlotTarget) {
    elements.recommendationSlotTarget.value = String(filters.slotTarget || "auto");
    if (elements.recommendationSlotTarget.value !== String(filters.slotTarget || "auto")) {
      elements.recommendationSlotTarget.value = "auto";
    }
  }
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

function formatToleranceLabel(value) {
  if (!Number.isFinite(value)) return "-";
  return `±${(value * 100).toFixed(1)}%`;
}

function formatRecommendationModeLabel(value) {
  switch (String(value || "").trim().toLowerCase()) {
    case "touch":
      return "레벨 터치";
    case "breakout_up":
      return "상향 돌파";
    case "breakdown_down":
      return "하향 이탈";
    default:
      return "레벨 근접";
  }
}

function formatRecommendationLookbackLabel(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 1) return "기준일";
  return `최근 ${numeric}거래일`;
}

function isRecommendationCompactMode() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function formatRecommendationUniverseLabel(value) {
  const normalized = normalizeRecommendationUniverseClient(value);
  if (normalized === "KOSPI200") return "코스피200";
  if (normalized === "KOSDAQ150") return "코스닥150";
  return "전체";
}

function formatRecommendationSlotTargetLabel(value) {
  if (String(value || "auto") === "auto") return "자동 담기";
  const slot = findEditableSlot(value);
  return slot ? getEditableSlotLabel(slot) : "직접 담기";
}

function buildRecommendationFilterSummary(filters = getRecommendationFilters()) {
  return [
    formatRecommendationUniverseLabel(filters.universe),
    `${Number(filters.periodMonths || 6)}개월`,
    formatFibLabel(Number(filters.level)),
    formatRecommendationModeLabel(filters.mode),
    formatRecommendationLookbackLabel(Number(filters.lookbackDays || 1)),
    formatRecommendationSlotTargetLabel(filters.slotTarget)
  ].join(" · ");
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
    elements.recommendationFilterToggleState.textContent = collapsed ? "펼치기" : "접기";
  }

  if (elements.recommendationFiltersPanel) {
    elements.recommendationFiltersPanel.hidden = collapsed;
  }
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

function formatRecommendationMarketLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "KOSPI") return "코스피";
  if (normalized === "KOSDAQ") return "코스닥";
  return normalized || "기타";
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

function buildRecommendationSignalCopy(item, filters = state.recommendations.filters) {
  const mode = String(item?.signalMode || filters.mode || "near").trim().toLowerCase();
  const signalDateLabel = formatDisplayDate(item?.signalDate || item?.priceDate);
  const lookbackLabel = formatRecommendationLookbackLabel(Number(item?.signalWindowDays || filters.lookbackDays || 1));

  if (mode === "touch") {
    return `${signalDateLabel} 장중 범위가 레벨 구간을 터치했습니다. ${lookbackLabel} 안에서 포착된 신호입니다.`;
  }

  if (mode === "breakout_up") {
    return `${signalDateLabel} 종가가 레벨 위로 올라섰습니다. ${lookbackLabel} 안의 상향 돌파입니다.`;
  }

  if (mode === "breakdown_down") {
    return `${signalDateLabel} 종가가 레벨 아래로 내려왔습니다. ${lookbackLabel} 안의 하향 이탈입니다.`;
  }

  return `${signalDateLabel} 종가가 레벨 근처에 들어왔습니다. ${lookbackLabel} 안에서 가장 가까운 지점입니다.`;
}

function buildRecommendationSignalMeta(item, filters = state.recommendations.filters) {
  return [
    String(item?.code || "").trim(),
    formatRecommendationLookbackLabel(Number(item?.signalWindowDays || filters.lookbackDays || 1)),
    `신호일 ${formatDisplayDate(item?.signalDate || item?.priceDate)}`
  ].filter(Boolean).join(" · ");
}

function getRecommendationAddLabel(slotTarget) {
  if (String(slotTarget || "auto") === "auto") {
    return "빈 슬롯에 바로 담기";
  }

  const slot = findEditableSlot(slotTarget);
  if (!slot) return "종목 슬롯에 담기";
  return slot.stock ? `${getEditableSlotLabel(slot)} 교체하기` : `${getEditableSlotLabel(slot)}에 담기`;
}

function getRecommendationTargetHint(slotTarget) {
  if (String(slotTarget || "auto") === "auto") {
    const emptySlot = state.editableSlots.find((slot) => !slot.stock);
    return emptySlot
      ? `자동 담기 · ${getEditableSlotLabel(emptySlot)} 비어 있음`
      : "자동 담기 · 빈 슬롯 없음";
  }

  const slot = findEditableSlot(slotTarget);
  if (!slot) return "선택한 슬롯을 찾지 못했습니다.";
  if (slot.stock) {
    return `${getEditableSlotLabel(slot)} · ${slot.stock.name} 교체`;
  }
  return `${getEditableSlotLabel(slot)} · 바로 담기`;
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

function setRecommendationBusyState(isBusy) {
  [
    elements.recommendationRunButton,
    elements.recommendationUniverse,
    elements.recommendationPeriod,
    elements.recommendationLevel,
    elements.recommendationMode,
    elements.recommendationLookback,
    elements.recommendationTolerance,
    elements.recommendationSort,
    elements.recommendationSlotTarget
  ].forEach((element) => {
    if (element) element.disabled = Boolean(isBusy);
  });

  if (elements.recommendationRunButton) {
    elements.recommendationRunButton.textContent = isBusy ? "추천 찾는 중..." : "추천 찾기";
  }
}

function buildRecommendationSummary(payload) {
  if (!payload) {
    return "필터를 고른 뒤 추천 찾기를 누르면 후보 종목이 여기에 표시됩니다.";
  }

  const lookbackLabel = formatRecommendationLookbackLabel(Number(payload.lookbackDays || 1));
  const base = `${payload.universeLabel || "추천 종목군"} ${payload.scannedCount || 0}개 중 ${payload.matchedCount || 0}개가 `
    + `${payload.periodMonths || 6}개월 ${formatFibLabel(Number(payload.level))} ${lookbackLabel} ${formatRecommendationModeLabel(payload.mode)} `
    + `${formatToleranceLabel(Number(payload.tolerance))} 조건에 들어왔습니다.`;

  if (payload.note) {
    return `${base} ${payload.note}`;
  }

  return base;
}

function renderRecommendationResults() {
  const recommendationState = state.recommendations;
  if (elements.recommendationSummary) {
    elements.recommendationSummary.textContent = recommendationState.summary;
  }

  if (!elements.recommendationList) return;

  const filters = recommendationState.filters || {};
  const items = Array.isArray(recommendationState.items)
    ? sortRecommendationItems(recommendationState.items, filters.sortBy)
    : [];
  if (!items.length) {
    elements.recommendationList.innerHTML = `
      <div class="recommendation-empty">
        ${escapeHtml(recommendationState.loading ? "추천 후보를 계산하는 중입니다." : "조건에 맞는 후보가 아직 없습니다.")}
      </div>
    `;
    return;
  }

  const addButtonLabel = getRecommendationAddLabel(filters.slotTarget);
  const targetHint = getRecommendationTargetHint(filters.slotTarget);
  const groups = groupRecommendationItemsByMarket(items);

  elements.recommendationList.innerHTML = groups.map((group) => `
    <section class="recommendation-group" data-market-group="${escapeHtml(group.key)}">
      <div class="recommendation-group-head">
        <div>
          <h3 class="recommendation-group-title">${escapeHtml(group.label)}</h3>
          <p class="recommendation-group-note">${escapeHtml(group.items.length)}개 후보 · ${escapeHtml(formatRecommendationModeLabel(filters.mode))}</p>
        </div>
      </div>

      <div class="recommendation-group-body">
        ${group.items.map((item) => `
          <article class="recommendation-item">
            <div class="recommendation-main">
              <div class="recommendation-topline">
                <strong class="recommendation-name">${escapeHtml(item.name || item.code || "-")}</strong>
                <span class="recommendation-badge">${escapeHtml(item.market || "-")}</span>
                <span class="recommendation-level">${escapeHtml(formatFibLabel(Number(item.level)))}</span>
              </div>

              <p class="recommendation-subline">${escapeHtml(buildRecommendationSignalMeta(item, filters))}</p>

              <p class="recommendation-signal">
                <strong>${escapeHtml(item.signalLabel || formatRecommendationModeLabel(state.recommendations.filters.mode))}</strong>
                <span>${escapeHtml(buildRecommendationSignalCopy(item, filters))}</span>
              </p>

              <div class="recommendation-meta">
                <div class="recommendation-meta-block recommendation-meta-block-primary">
                  <span class="recommendation-meta-label">현재가</span>
                  <span class="recommendation-meta-value">${escapeHtml(formatNumber(Number(item.currentPrice), 0))}</span>
                </div>
                <div class="recommendation-meta-block recommendation-meta-block-primary">
                  <span class="recommendation-meta-label">레벨가</span>
                  <span class="recommendation-meta-value">${escapeHtml(formatNumber(Number(item.levelPrice), 0))}</span>
                </div>
                <div class="recommendation-meta-block recommendation-meta-block-primary">
                  <span class="recommendation-meta-label">${escapeHtml((item.signalDate && item.signalDate !== item.priceDate) ? "신호 차이" : "레벨 차이")}</span>
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
              <p class="recommendation-target-note">${escapeHtml(targetHint)}</p>
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

function resolveRecommendationTargetSlot(slotTarget = state.recommendations.filters.slotTarget) {
  const normalizedTarget = String(slotTarget || "auto").trim().toLowerCase();
  if (normalizedTarget !== "auto") {
    const slot = findEditableSlot(Number(normalizedTarget));
    if (!slot) {
      throw new Error("선택한 종목 슬롯을 찾지 못했습니다.");
    }
    return slot;
  }

  const emptySlot = state.editableSlots.find((slot) => !slot.stock);
  if (!emptySlot) {
    throw new Error("빈 슬롯이 없어 담을 수 없습니다. 기존 종목을 하나 지운 뒤 다시 시도해 주세요.");
  }
  return emptySlot;
}

async function addRecommendationToSlots(code, slotTarget = getRecommendationFilters().slotTarget) {
  await ensureDashboardReadyForRecommendationFlow();

  const stock = findCatalogItem(code)
    || state.recommendations.items.find((item) => normalizeTicker(item.code) === normalizeTicker(code))
    || null;
  if (!stock) {
    throw new Error(`추천 종목을 카탈로그에서 찾지 못했습니다: ${code}`);
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

  if (previousStock && normalizeTicker(previousStock.code) !== normalizeTicker(nextStock.code)) {
    setStatus(`${getEditableSlotLabel(targetSlot)}의 ${previousStock.name}을 ${nextStock.name}으로 바꿨습니다.`, "success");
    return;
  }

  setStatus(`${nextStock.name}을 ${getEditableSlotLabel(targetSlot)}에 담았습니다.`, "success");
}

async function loadRecommendations() {
  if (!state.gatewayUrl) {
    throw new Error("추천 기능은 게이트웨이 연결이 필요합니다.");
  }

  const filters = getRecommendationFilters();
  const selectedDate = state.selectedDate || elements.dateInput.value || getTodayKstDate();

  await ensureDashboardReadyForRecommendationFlow(selectedDate);

  setRecommendationState({
    loading: true,
    items: [],
    filters,
    summary: `${selectedDate} 기준 추천 후보를 계산하고 있습니다.`
  });

  try {
    if (state.loading) {
      setRecommendationState({
        loading: true,
        items: [],
        filters,
        summary: "등가율 화면 데이터를 먼저 마무리하고 있습니다. 잠시만 기다려 주세요."
      });
      await waitForLoadingToFinish();
    }

    const elapsedSinceDashboardLoad = Date.now() - Number(state.lastDashboardLoadedAt || 0);
    if (state.lastDashboardLoadedAt && elapsedSinceDashboardLoad < RECOMMENDATION_GATEWAY_COOLDOWN_MS) {
      const waitDuration = RECOMMENDATION_GATEWAY_COOLDOWN_MS - elapsedSinceDashboardLoad;
      setRecommendationState({
        loading: true,
        items: [],
        filters,
        summary: `등가율 데이터를 막 불러와서 잠시 정리 중입니다. ${Math.ceil(waitDuration / 1000)}초 뒤 추천을 이어갑니다.`
      });
      await waitMs(waitDuration);
    }

    const warmupPromise = warmRecommendationUniverse(filters, { silent: true });
    if (warmupPromise) {
      setRecommendationState({
        loading: true,
        items: [],
        filters,
        summary: `${selectedDate} 기준 추천 대상 일봉을 미리 정리하고 있습니다.`
      });
      await warmupPromise;
    }

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
      summary: error.message
    });
    throw error;
  }
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

async function mapSequential(items, mapper, spacingMs = 0) {
  const results = [];
  for (let index = 0; index < items.length; index += 1) {
    results.push(await mapper(items[index], index));
    if (spacingMs && index < items.length - 1) {
      await waitMs(spacingMs);
    }
  }
  return results;
}

function setStatus(message, tone = "loading") {
  elements.statusPill.textContent = message;
  elements.statusPill.className = "status-pill";
  if (tone === "success") elements.statusPill.classList.add("is-success");
  if (tone === "error") elements.statusPill.classList.add("is-error");
  if (tone === "loading") elements.statusPill.classList.add("is-loading");
}

function setBusyState(isBusy) {
  state.loading = isBusy;
  elements.dateInput.disabled = isBusy;
  document.querySelectorAll(".slot-input[data-editable='true']").forEach((input) => {
    input.disabled = isBusy;
  });
}

function ensureGatewayCard() {
  elements.setupCard.hidden = Boolean(state.gatewayUrl);
}

function enrichStockMeta(stock) {
  if (!stock) return null;
  const code = normalizeTicker(stock.code);
  const fallback = LOCAL_STOCK_CATALOG.find((item) => item.code === code) || {};
  return {
    code,
    name: String(stock.name || fallback.name || code).trim(),
    market: String(stock.market || fallback.market || "KOSPI").trim().toUpperCase(),
    assetType: String(stock.assetType || fallback.assetType || "stock").trim()
  };
}

function mergeCatalogs(remoteItems, localItems) {
  const merged = new Map();
  [...localItems, ...(Array.isArray(remoteItems) ? remoteItems : [])].forEach((item) => {
    const stock = enrichStockMeta(item);
    if (stock?.code) merged.set(stock.code, stock);
  });
  return [...merged.values()].sort((left, right) => left.name.localeCompare(right.name, "ko"));
}

function buildTickerDatalist() {
  elements.tickerList.innerHTML = state.catalog.map((item) => (
    `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)}</option>` +
    `<option value="${escapeHtml(item.name)}">${escapeHtml(item.code)}</option>`
  )).join("");
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

function getSeriesCacheKey(target, selectedDate) {
  if (!target?.code) return "";
  return `${target.assetType}:${target.code}:${selectedDate}`;
}

async function requestGateway(params) {
  if (!state.gatewayUrl) {
    throw new Error("게이트웨이 URL이 비어 있습니다.");
  }

  const response = await fetch(buildRequestUrl(params), {
    method: "GET",
    cache: "no-store"
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("게이트웨이 응답을 읽지 못했습니다.");
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || `게이트웨이 요청 실패 (${response.status})`);
  }

  return payload;
}

async function loadCatalog() {
  if (!state.gatewayUrl) {
    state.catalog = mergeCatalogs([], LOCAL_STOCK_CATALOG);
    buildTickerDatalist();
    return;
  }

  try {
    const payload = await requestGateway({ action: "stock-catalog", market: "ALL" });
    state.catalog = mergeCatalogs(payload.items, LOCAL_STOCK_CATALOG);
  } catch (error) {
    console.warn("catalog fallback", error);
    state.catalog = mergeCatalogs([], LOCAL_STOCK_CATALOG);
  }

  buildTickerDatalist();
}

function findCatalogItem(rawValue) {
  const input = String(rawValue || "").trim();
  if (!input) return null;

  const normalizedTicker = normalizeTicker(input);
  const normalizedText = normalizeSearchText(input);

  return state.catalog.find((item) => {
    const code = normalizeTicker(item.code);
    const name = normalizeSearchText(item.name);
    return code === normalizedTicker || name === normalizedText;
  }) || null;
}

async function resolveStockInput(rawValue) {
  const exact = findCatalogItem(rawValue);
  if (exact) return exact;

  const needle = normalizeSearchText(rawValue);
  if (!needle) return null;

  const fuzzy = state.catalog.find((item) => {
    const codeKey = normalizeSearchText(item.code);
    const nameKey = normalizeSearchText(item.name);
    return codeKey.includes(needle) || nameKey.includes(needle);
  });

  return fuzzy || null;
}

function resolveTickerCode(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return "";

  const exact = findCatalogItem(raw);
  if (exact) return normalizeTicker(exact.code);

  const ticker = normalizeTicker(raw);
  if (/^[A-Z0-9]{6,9}$/.test(ticker)) {
    return ticker;
  }

  throw new Error(`종목을 찾지 못했습니다: ${raw}`);
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

function persistEditableSlots() {
  return;
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
  return `종목${slot.id}`;
}

function getSlotCaption(slot) {
  if (!slot.editable) return "기준 지수";
  if (slot.stock) return `${slot.stock.market} · ${slot.stock.code}`;
  return "코스피/코스닥 자유 입력";
}

function getSlotMarketLabel(slot) {
  if (!slot) return "-";
  if (!slot.editable) return "기준 지수";
  return String(slot.market || slot.stock?.market || "시장 확인 필요").trim().toUpperCase();
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
        <h3 class="slot-name">${escapeHtml(displayName)}</h3>
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
          <p class="slot-market">${escapeHtml(marketLabel)}</p>
        </div>
      </article>
    `;
  }).join("");

  renderRecommendationSlotOptions(state.recommendations.filters.slotTarget);
  attachSlotEvents();
  setBusyState(state.loading || state.saving);
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

    input.addEventListener("input", () => updateSlotPreview(card));
    input.addEventListener("change", () => {
      updateSlotPreview(card);
      saveTickers().catch((error) => {
        console.error(error);
        setStatus(error.message, "error");
      });
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      saveTickers().catch((error) => {
        console.error(error);
        setStatus(error.message, "error");
      });
    });
  });
}

async function saveTickerCodes(codes) {
  const payload = await requestGateway({
    action: "update-tickers",
    tickers: codes.join(","),
    date: elements.dateInput.value || state.selectedDate || getTodayKstDate()
  });

  renderDashboard(payload);
  return payload;
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

    const tickers = inputs.map((input) => resolveTickerCode(input.value));
    await saveTickerCodes(tickers);
    setStatus("종목 저장 완료", "success");
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
  if (isWeekendIso(selectedDate) || holidaySet.has(selectedDate)) return "holiday";

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

function buildDashboardPayload(seriesCollection, selectedDate) {
  const slots = getAllSlots().map((slot, index) => {
    const series = seriesCollection[index];
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
  const rows = buildTableRows(seriesCollection);
  const sourceMode = seriesCollection.every((series) => !series.target || series.source === "gateway")
    ? "gateway"
    : "demo";

  const latestStamp = seriesCollection
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
    .filter((entry) => entry.slot.editable && entry.slot.stock)
    .map((entry) => {
      const benchmarkIndex = entry.slot.stock.market === "KOSDAQ" ? 1 : 0;
      const benchmarkSlot = payload.slots[benchmarkIndex];
      const compareRows = payload.rows.filter((row) => {
        const benchmarkCell = row.values[benchmarkIndex];
        const compareCell = row.values[entry.index];
        return benchmarkCell?.display !== "-" || compareCell?.display !== "-";
      });

      return {
        title: entry.slot.stock.name,
        benchmarkLabel: getSlotDisplayLabel(benchmarkSlot),
        compareLabel: entry.slot.stock.name,
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

function renderDashboard(payload) {
  state.dashboard = payload;
  state.selectedDate = payload.selectedDate || state.selectedDate;
  state.dataMode = payload.sourceMode || "gateway";
  state.session = payload.session || "linked";
  syncEditableSlotsFromDashboard(Array.isArray(payload.slots) ? payload.slots : []);

  elements.dateInput.value = payload.selectedDate || "";
  elements.dateInput.max = payload.today || getTodayKstDate();
  elements.updatedAt.textContent = `마지막 동기화 ${formatTimestamp(payload.updatedAt)}`;

  renderSlots(payload.slots);
  renderTable(payload);
  renderMobileCompare(payload);
}

async function loadDashboard(date = getTodayKstDate()) {
  const previousDate = state.selectedDate;
  if (previousDate && previousDate !== date) {
    setRecommendationState({
      items: [],
      loading: false,
      summary: "날짜가 바뀌었습니다. 추천 찾기를 다시 눌러 새 기준으로 확인해 주세요."
    });
  }

  state.selectedDate = date;
  localStorage.setItem(STORAGE_LAST_DATE, date);
  state.loading = true;
  setBusyState(true);
  setStatus("데이터 불러오는 중", "loading");

  try {
    const payload = await requestGateway({ action: "dashboard-data", date });
    renderDashboard(payload);
    state.lastDashboardLoadedAt = Date.now();
    warmRecommendationUniverse(state.recommendations.filters, { silent: true }).catch(() => {});
    setStatus("업데이트 완료", "success");
  } catch (error) {
    console.error(error);
    setStatus(error.message, "error");
  } finally {
    state.loading = false;
    state.saving = false;
    setBusyState(false);
  }
}

function bindEvents() {
  elements.dateInput.addEventListener("change", () => {
    loadDashboard(elements.dateInput.value || getTodayKstDate()).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  });

  elements.dateInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    loadDashboard(elements.dateInput.value || getTodayKstDate()).catch((error) => {
      console.error(error);
      setStatus(error.message, "error");
    });
  });

  [elements.dashboardViewButton, elements.recommendationViewButton, ...elements.mobileViewButtons].forEach((button) => {
    if (!button) return;
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view || "dashboard");
      if ((button.dataset.view || "dashboard") === "dashboard" && !state.dashboard && !state.loading) {
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

function restoreState() {
  const today = getTodayKstDate();
  state.selectedDate = localStorage.getItem(STORAGE_LAST_DATE) || today;
  state.activeView = normalizeViewName(localStorage.getItem(STORAGE_ACTIVE_VIEW));
  elements.dateInput.value = state.selectedDate;
  elements.dateInput.max = today;
  restoreEditableSlots();
}

async function bootstrap() {
  ensureGatewayCard();
  restoreState();
  bindEvents();
  setActiveView(state.activeView, { persist: false });
  setRecommendationState({
    summary: "필터를 고른 뒤 추천 찾기를 누르면 후보 종목이 여기에 표시됩니다."
  });
  renderSlots(getAllSlots());

  try {
    await loadCatalog();
    await loadDashboard(state.selectedDate);
  } catch (error) {
    console.error(error);
    setStatus(error.message, "error");
  }
}

bootstrap();
