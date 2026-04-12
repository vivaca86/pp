const MARKET_TIMEZONE = "Asia/Seoul";
const SLOT_COUNT = 6;
const DEFAULT_GATEWAY_URL = String(window.PP_CONFIG?.gatewayUrl || "").trim();

const state = {
  gatewayUrl: DEFAULT_GATEWAY_URL,
  catalog: [],
  dashboard: null,
  loading: false,
  saving: false,
  mobileSlideIndex: 0
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

function getSlotDisplayLabel(slot) {
  if (!slot) return "-";
  return slot.name || slot.code || "-";
}

function getSlotCaption(slot) {
  if (!slot) return "";
  if (!slot.editable) return `${slot.market || "INDEX"} · ${slot.code || "-"}`;
  if (slot.market && slot.code) return `${slot.market} · ${slot.code}`;
  return "종목 입력 필요";
}

function getBenchmarkIndexForSlot(slots, slot) {
  if (!slot || !Array.isArray(slots) || !slots.length) return 0;

  const targetCode = String(slot.market || "").trim().toUpperCase() === "KOSDAQ"
    ? "KOSDAQ"
    : "KOSPI";

  const matchedIndex = slots.findIndex((item) => String(item.code || "").trim().toUpperCase() === targetCode);
  return matchedIndex >= 0 ? matchedIndex : 0;
}

function formatDeltaPercent(baseValue, compareValue) {
  if (!Number.isFinite(baseValue) || !Number.isFinite(compareValue)) return "-";
  return formatPercent(compareValue - baseValue, 2);
}

function setBusyState(isBusy) {
  elements.dateInput.disabled = isBusy;
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
  throw new Error(`종목을 찾지 못했습니다. ${input}`);
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
      if (event.key !== "Enter") return;
      event.preventDefault();
      saveTickers().catch((error) => {
        setStatus(error.message, "error");
      });
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
        <p class="slot-total ${getToneClass(Number(slot.total))}" title="${escapeHtml(getSlotCaption(slot))}">
          ${escapeHtml(totalText)}
        </p>
      </article>
    `;
  }).join("");

  attachSlotEvents();
}

function renderTable(payload) {
  const slots = Array.isArray(payload.slots) ? payload.slots : [];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const columnLabels = slots.map((slot) => getSlotDisplayLabel(slot));

  elements.tableHead.innerHTML = `
    <tr>
      <th>날짜</th>
      ${slots.map((slot) => `<th>${escapeHtml(getSlotDisplayLabel(slot))}</th>`).join("")}
    </tr>
  `;

  elements.tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td data-label="날짜">${escapeHtml(row.displayDate || row.date || "-")}</td>
      ${row.values.map((cell, index) => `
        <td data-label="${escapeHtml(columnLabels[index] || "-")}" class="${getToneClass(Number(cell.value))}">
          ${escapeHtml(cell.display || "-")}
        </td>
      `).join("")}
    </tr>
  `).join("");

  elements.emptyState.classList.toggle("is-visible", rows.length === 0);
}

function getMobileCompareEntries(slots) {
  return slots
    .map((slot, index) => ({ slot, index }))
    .filter((entry) => entry.slot?.editable && Boolean(entry.slot.code));
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
  const slots = Array.isArray(payload.slots) ? payload.slots : [];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const compareEntries = getMobileCompareEntries(slots);

  if (!compareEntries.length || !rows.length) {
    elements.mobileCompareTrack.innerHTML = "";
    updateMobileCompareNavigation(0);
    return;
  }

  state.mobileSlideIndex = Math.min(state.mobileSlideIndex, compareEntries.length - 1);

  elements.mobileCompareTrack.innerHTML = compareEntries.map((entry, slideIndex) => {
    const compareSlot = entry.slot;
    const benchmarkIndex = getBenchmarkIndexForSlot(slots, compareSlot);
    const benchmarkSlot = slots[benchmarkIndex];
    const title = compareSlot.name || compareSlot.code || "종목";
    const benchmarkLabel = getSlotDisplayLabel(benchmarkSlot);
    const compareLabel = getSlotDisplayLabel(compareSlot);

    return `
      <article class="mobile-compare-slide" data-slide-index="${slideIndex}">
        <div class="mobile-compare-head">
          <h3 class="mobile-compare-title">${escapeHtml(title)}</h3>
        </div>

        <div class="mobile-compare-grid">
          <div class="mobile-compare-row is-head">
            <span>날짜</span>
            <span>${escapeHtml(benchmarkLabel)}</span>
            <span>${escapeHtml(compareLabel)}</span>
            <span>차이</span>
          </div>
          ${rows.map((row) => {
            const benchmarkCell = row.values?.[benchmarkIndex] || {};
            const compareCell = row.values?.[entry.index] || {};
            const benchmarkValue = Number.isFinite(benchmarkCell.value) ? benchmarkCell.value : NaN;
            const compareValue = Number.isFinite(compareCell.value) ? compareCell.value : NaN;
            const differenceText = formatDeltaPercent(benchmarkValue, compareValue);
            const differenceTone = differenceText === "-" ? "tone-neutral" : getToneClass(compareValue - benchmarkValue);

            return `
              <div class="mobile-compare-row">
                <span class="mobile-compare-date">${escapeHtml(row.displayDate || row.date || "-")}</span>
                <span class="${getToneClass(Number(benchmarkCell.value))}">${escapeHtml(benchmarkCell.display || "-")}</span>
                <span class="${getToneClass(Number(compareCell.value))}">${escapeHtml(compareCell.display || "-")}</span>
                <span class="${differenceTone}">${escapeHtml(differenceText)}</span>
              </div>
            `;
          }).join("")}
        </div>
      </article>
    `;
  }).join("");

  updateMobileCompareNavigation(compareEntries.length);
  requestAnimationFrame(() => {
    scrollMobileCompareTo(state.mobileSlideIndex, false);
  });
}

function renderDashboard(payload) {
  state.dashboard = payload;

  elements.dateInput.value = payload.selectedDate || "";
  elements.dateInput.max = payload.today || getTodayKstDate();
  elements.updatedAt.textContent = `마지막 동기화 ${formatTimestamp(payload.updatedAt)}`;

  renderSlots(payload.slots || []);
  renderTable(payload);
  renderMobileCompare(payload);
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
  setStatus("종목 저장 중", "loading");

  try {
    const tickerInputs = [...document.querySelectorAll(".slot-input[data-editable='true']")];
    if (tickerInputs.length !== SLOT_COUNT) {
      throw new Error("편집 가능한 종목 입력칸을 모두 찾지 못했습니다.");
    }

    const tickers = tickerInputs.map((input) => resolveTickerInput(input.value));
    const payload = await requestGateway({
      action: "update-tickers",
      tickers: tickers.join(","),
      date: elements.dateInput.value || state.dashboard.selectedDate || getTodayKstDate()
    });

    renderDashboard(payload);
    setStatus("종목 저장 완료", "success");
  } finally {
    state.saving = false;
    setBusyState(false);
  }
}

function bindEvents() {
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
    if (!state.dashboard) return;
    requestAnimationFrame(() => {
      scrollMobileCompareTo(state.mobileSlideIndex, false);
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
