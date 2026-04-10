const MARKET_TIMEZONE = "Asia/Seoul";
const SLOT_COUNT = 7;
const DEFAULT_GATEWAY_URL = String(window.PP_CONFIG?.gatewayUrl || "").trim();

const state = {
  gatewayUrl: DEFAULT_GATEWAY_URL,
  catalog: [],
  dashboard: null,
  loading: false,
  saving: false
};

const elements = {
  dateInput: document.getElementById("date-input"),
  refreshButton: document.getElementById("refresh-button"),
  setupCard: document.getElementById("setup-card"),
  statusPill: document.getElementById("status-pill"),
  updatedAt: document.getElementById("updated-at"),
  summaryNote: document.getElementById("summary-note"),
  slotGrid: document.getElementById("slot-grid"),
  saveTickersButton: document.getElementById("save-tickers-button"),
  tableNote: document.getElementById("table-note"),
  selectedDateBadge: document.getElementById("selected-date-badge"),
  lastTradingBadge: document.getElementById("last-trading-badge"),
  tableHead: document.getElementById("table-head"),
  tableBody: document.getElementById("table-body"),
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

function formatFullDate(dateText) {
  if (!dateText) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: MARKET_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date(`${dateText}T12:00:00+09:00`));
}

function formatTimestamp(dateText) {
  if (!dateText) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: MARKET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(dateText));
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

function setBusyState(isBusy) {
  elements.refreshButton.disabled = isBusy;
  elements.dateInput.disabled = isBusy;
  elements.saveTickersButton.disabled = isBusy;
  document.querySelectorAll(".slot-input").forEach((input) => {
    input.disabled = isBusy || input.dataset.editable !== "true";
  });
}

function setStatus(message, tone = "loading") {
  elements.statusPill.textContent = message;
  elements.statusPill.className = "status-pill";
  if (tone === "success") elements.statusPill.classList.add("is-success");
  if (tone === "error") elements.statusPill.classList.add("is-error");
  if (tone === "loading") elements.statusPill.classList.add("is-loading");
}

function ensureGatewayReady() {
  const isReady = Boolean(state.gatewayUrl);
  elements.setupCard.hidden = isReady;
  return isReady;
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

async function requestGateway(params) {
  if (!ensureGatewayReady()) {
    throw new Error("Apps Script 게이트웨이 URL이 비어 있습니다.");
  }

  const response = await fetch(buildRequestUrl(params), {
    method: "GET",
    cache: "no-store"
  });

  const payload = await response.json().catch(() => {
    throw new Error("게이트웨이 응답을 JSON으로 읽지 못했습니다.");
  });

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message || `요청 실패 (${response.status})`);
  }

  return payload;
}

function buildTickerDatalist(items) {
  elements.tickerList.innerHTML = items.map((item) => (
    `<option value="${escapeHtml(item.code)}">${escapeHtml(item.name)}</option>` +
    `<option value="${escapeHtml(item.name)}">${escapeHtml(item.code)}</option>`
  )).join("");
}

async function loadCatalog() {
  if (!ensureGatewayReady()) return;
  const payload = await requestGateway({ action: "stock-catalog", market: "ALL" });
  state.catalog = Array.isArray(payload.items) ? payload.items : [];
  buildTickerDatalist(state.catalog);
}

function findCatalogItem(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const normalizedTicker = normalizeTicker(raw);
  const normalizedText = normalizeSearchText(raw);

  return state.catalog.find((item) => {
    const code = normalizeTicker(item.code);
    const name = normalizeSearchText(item.name);
    return code === normalizedTicker || name === normalizedText;
  }) || null;
}

function resolveTickerInput(rawValue) {
  const input = String(rawValue || "").trim();
  if (!input) {
    throw new Error("빈 티커는 저장할 수 없습니다.");
  }

  const exact = findCatalogItem(input);
  if (exact) return exact.code;

  const ticker = normalizeTicker(input);
  if (/^[A-Z0-9]{6,9}$/.test(ticker)) {
    return ticker;
  }

  const normalized = normalizeSearchText(input);
  const fuzzyMatch = state.catalog.find((item) => {
    const nameKey = normalizeSearchText(item.name);
    const codeKey = normalizeSearchText(item.code);
    return nameKey.includes(normalized) || codeKey.includes(normalized);
  });

  if (fuzzyMatch) return fuzzyMatch.code;
  throw new Error(`종목을 찾지 못했습니다: ${input}`);
}

function updateSlotPreview(slotCard) {
  const input = slotCard.querySelector(".slot-input");
  const nameEl = slotCard.querySelector(".slot-name");
  const raw = input?.value || "";
  if (!input || !nameEl || input.dataset.editable !== "true") return;

  const match = findCatalogItem(raw);
  if (match) {
    nameEl.textContent = match.name;
    return;
  }

  const ticker = normalizeTicker(raw);
  nameEl.textContent = ticker || "종목명 확인 필요";
}

function attachSlotEvents() {
  document.querySelectorAll(".slot-card").forEach((card) => {
    const input = card.querySelector(".slot-input");
    if (!input || input.dataset.editable !== "true") return;

    input.addEventListener("input", () => updateSlotPreview(card));
    input.addEventListener("change", () => {
      updateSlotPreview(card);
      saveTickers().catch((error) => {
        setStatus(error.message, "error");
      });
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveTickers().catch((error) => {
          setStatus(error.message, "error");
        });
      }
    });
  });
}

function renderSlots(slots) {
  elements.slotGrid.innerHTML = slots.map((slot, index) => {
    const isFixed = !slot.editable;
    const totalText = `합계 ${formatPercent(Number(slot.total), 2)}`;
    return `
      <article class="slot-card${isFixed ? " is-fixed" : ""}" data-slot-index="${index}">
        <h3 class="slot-name">${escapeHtml(slot.name || slot.code || "종목명 확인 필요")}</h3>
        <input
          class="slot-input"
          type="text"
          value="${escapeHtml(slot.code || "")}"
          list="ticker-list"
          data-editable="${String(slot.editable)}"
          ${isFixed ? "disabled" : ""}
          autocomplete="off"
          spellcheck="false"
        >
        <p class="slot-total ${getToneClass(Number(slot.total))}">${escapeHtml(totalText)}</p>
      </article>
    `;
  }).join("");

  attachSlotEvents();
}

function renderTable(payload) {
  const slots = Array.isArray(payload.slots) ? payload.slots : [];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const columnLabels = slots.map((slot) => slot.code || "-");

  elements.tableHead.innerHTML = `
    <tr>
      <th>날짜</th>
      ${slots.map((slot) => `<th>${escapeHtml(slot.code || "-")}</th>`).join("")}
    </tr>
  `;

  elements.tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td data-label="Date">${escapeHtml(row.displayDate || row.date || "-")}</td>
      ${row.values.map((cell, index) => `
        <td data-label="${escapeHtml(columnLabels[index] || "-")}" class="${getToneClass(Number(cell.value))}">
          ${escapeHtml(cell.display || "-")}
        </td>
      `).join("")}
    </tr>
  `).join("");

  elements.emptyState.classList.toggle("is-visible", rows.length === 0);
}

function renderDashboard(payload) {
  state.dashboard = payload;

  elements.dateInput.value = payload.selectedDate || "";
  elements.dateInput.max = payload.today || getTodayKstDate();
  elements.updatedAt.textContent = `마지막 동기화 ${formatTimestamp(payload.updatedAt)}`;
  elements.selectedDateBadge.textContent = `기준일 ${formatFullDate(payload.selectedDate)}`;
  elements.lastTradingBadge.textContent = `마지막 거래일 ${formatFullDate(payload.lastTradingDate)}`;
  const sameDay = payload.selectedDate === payload.lastTradingDate;
  elements.summaryNote.textContent = sameDay
    ? "상단은 종목명, 가운데는 티커, 하단은 월 누적 등가률 합계입니다."
    : `선택일이 휴장 또는 미체결일이라 실제 표는 ${formatFullDate(payload.lastTradingDate)} 까지만 표시됩니다.`;

  elements.tableNote.textContent = sameDay
    ? `${formatFullDate(payload.selectedDate)} 기준 실제 거래일 ${payload.rows.length}일을 표시합니다.`
    : `${formatFullDate(payload.selectedDate)} 을 선택했고, 실제 거래일은 ${formatFullDate(payload.lastTradingDate)} 까지 반영됐습니다.`;

  renderSlots(payload.slots || []);
  renderTable(payload);
}

async function loadDashboard(date = getTodayKstDate()) {
  state.loading = true;
  setBusyState(true);
  setStatus("데이터 불러오는 중", "loading");

  try {
    const payload = await requestGateway({ action: "dashboard-data", date });
    renderDashboard(payload);
    setStatus("업데이트 완료", "success");
  } finally {
    state.loading = false;
    state.saving = false;
    setBusyState(false);
  }
}

async function saveTickers() {
  if (!state.dashboard || state.saving) return;

  state.saving = true;
  setBusyState(true);
  setStatus("티커 저장 중", "loading");

  try {
    const tickerInputs = [...document.querySelectorAll(".slot-input[data-editable='true']")];
    if (tickerInputs.length !== SLOT_COUNT) {
      throw new Error("편집 가능한 티커 입력창을 모두 찾지 못했습니다.");
    }

    const tickers = tickerInputs.map((input) => resolveTickerInput(input.value));
    const payload = await requestGateway({
      action: "update-tickers",
      tickers: tickers.join(","),
      date: elements.dateInput.value || state.dashboard.selectedDate || getTodayKstDate()
    });

    renderDashboard(payload);
    setStatus("티커 저장 완료", "success");
  } finally {
    state.saving = false;
    setBusyState(false);
  }
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", () => {
    loadDashboard(elements.dateInput.value || getTodayKstDate()).catch((error) => {
      setStatus(error.message, "error");
    });
  });

  elements.dateInput.addEventListener("change", () => {
    loadDashboard(elements.dateInput.value || getTodayKstDate()).catch((error) => {
      setStatus(error.message, "error");
    });
  });

  elements.dateInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    loadDashboard(elements.dateInput.value || getTodayKstDate()).catch((error) => {
      setStatus(error.message, "error");
    });
  });

  elements.saveTickersButton.addEventListener("click", () => {
    saveTickers().catch((error) => {
      setStatus(error.message, "error");
    });
  });
}

async function bootstrap() {
  bindEvents();
  ensureGatewayReady();

  if (!ensureGatewayReady()) {
    setStatus("게이트웨이 URL 설정 필요", "error");
    return;
  }

  try {
    await loadCatalog();
    await loadDashboard(getTodayKstDate());
  } catch (error) {
    setStatus(error.message, "error");
  }
}

bootstrap();
