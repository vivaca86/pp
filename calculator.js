// Calculator view wiring and local Fibonacci card storage.
    (function () {
      const VIEW_STORAGE_KEY = "stock_lab_active_view";
      const CALCULATOR_STORAGE_KEY = "pp_fib_calculator_cards_v1";
      const CALCULATOR_CARD_COUNT = 6;
      const LEVELS = [
        { key: "236", label: "23.6%", ratio: 0.236 },
        { key: "382", label: "38.2%", ratio: 0.382 },
      ];

      const calculatorElements = {
        grid: document.getElementById("calculator-grid"),
        resetButton: document.getElementById("calculator-reset-button"),
        desktopButton: document.getElementById("view-calculator-button")
      };

      if (!calculatorElements.grid) return;

      const calculatorState = {
        cards: []
      };

      const createDefaultCards = () => Array.from({ length: CALCULATOR_CARD_COUNT }, () => ({
        high: "",
        low: ""
      }));

      const sanitizeCard = (card) => ({
        high: String(card?.high || "").trim(),
        low: String(card?.low || "").trim()
      });

      const loadCalculatorCards = () => {
        try {
          const parsed = JSON.parse(localStorage.getItem(CALCULATOR_STORAGE_KEY) || "null");
          if (Array.isArray(parsed) && parsed.length === CALCULATOR_CARD_COUNT) {
            return parsed.map((card) => sanitizeCard(card));
          }
        } catch (error) {
          console.warn("calculator storage restore", error);
        }
        return createDefaultCards();
      };

      const persistCalculatorCards = () => {
        localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(calculatorState.cards));
      };

      const parseNumericInput = (value) => {
        const normalized = String(value || "").replace(/,/g, "").trim();
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : NaN;
      };

      const formatPrice = (value) => {
        if (!Number.isFinite(value)) return "-";
        return `${new Intl.NumberFormat("ko-KR", {
          maximumFractionDigits: 0
        }).format(Math.round(value))}원`;
      };

      const formatRate = (value) => {
        if (!Number.isFinite(value)) return "-";
        const sign = value > 0 ? "+" : "";
        return `${sign}${(value * 100).toFixed(2)}%`;
      };

      const computeCard = (card) => {
        const high = parseNumericInput(card.high);
        const low = parseNumericInput(card.low);

        if (high === null && low === null) {
          return { state: "empty" };
        }

        if (high === null || low === null) {
          return { state: "incomplete" };
        }

        if (!Number.isFinite(high) || !Number.isFinite(low)) {
          return { state: "invalid" };
        }

        if (high <= 0 || low <= 0) {
          return { state: "nonpositive" };
        }

        if (high < low) {
          return { state: "range-error" };
        }

        const spread = high - low;
        return {
          state: "ready",
          high,
          low,
          spread,
          spreadRate: high === 0 ? null : ((low / high) - 1),
          levels: LEVELS.map((level) => {
            const price = high - (spread * level.ratio);
            return {
              ...level,
              price,
              rate: high === 0 ? null : ((price / high) - 1)
            };
          })
        };
      };

      const roundLogNumber = (value, digits = 4) => {
        if (!Number.isFinite(value)) return null;
        return Number(value.toFixed(digits));
      };

      const buildCalculatorLogMetadata = (cardIndex, field, computation) => {
        const metadata = {
          cardIndex,
          field,
          state: computation.state
        };

        if (computation.state !== "ready") return metadata;

        return {
          ...metadata,
          high: roundLogNumber(computation.high, 2),
          low: roundLogNumber(computation.low, 2),
          spread: roundLogNumber(computation.spread, 2),
          spreadRatePct: roundLogNumber((computation.spreadRate || 0) * 100, 2),
          levels: computation.levels.map((level) => ({
            label: level.label,
            price: roundLogNumber(level.price, 2),
            ratePct: roundLogNumber((level.rate || 0) * 100, 2)
          }))
        };
      };

      const getHelperState = (computation) => {
        switch (computation.state) {
          case "empty":
            return { text: "", error: false };
          case "incomplete":
            return { text: "고가와 저가를 모두 입력해 주세요.", error: false };
          case "invalid":
            return { text: "숫자만 입력해 주세요.", error: true };
          case "nonpositive":
            return { text: "고가와 저가는 0보다 커야 합니다.", error: true };
          case "range-error":
            return { text: "고가가 저가보다 크거나 같아야 합니다.", error: true };
          default:
            return { text: "", error: false };
        }
      };

      const renderCardOutputs = (cardElement, computation) => {
        const helper = cardElement.querySelector(".fib-helper");
        const meta = cardElement.querySelector(".fib-meta");
        const helperState = getHelperState(computation);

        helper.textContent = helperState.text;
        helper.classList.toggle("is-error", helperState.error);

        if (computation.state === "ready") {
          meta.textContent = `고저폭 ${formatPrice(computation.spread)} · 고가 대비 ${formatRate(computation.spreadRate)}`;
        } else {
          meta.textContent = "";
        }

        LEVELS.forEach((level) => {
          const result = cardElement.querySelector(`[data-level-key="${level.key}"]`);
          if (!result) return;
          const priceEl = result.querySelector(".fib-result-price");
          const rateEl = result.querySelector(".fib-result-rate");
          const match = computation.levels?.find((item) => item.key === level.key) || null;
          priceEl.textContent = match ? formatPrice(match.price) : "-";
          rateEl.textContent = match ? `고가 대비 등가율 ${formatRate(match.rate)}` : "고가 대비 등가율 -";
        });
      };

      const renderCalculatorCards = () => {
        calculatorElements.grid.innerHTML = calculatorState.cards.map((card, index) => `
          <article class="fib-card" data-calc-card="${index}">
            <div class="fib-card-head">
              <div>
                <h3 class="fib-card-title">카드 ${index + 1}</h3>
              </div>
              <span class="fib-card-badge">고가 기준</span>
            </div>

            <div class="fib-form">
              <label class="fib-field">
                <span>고가</span>
                <input
                  class="fib-input"
                  type="text"
                  inputmode="decimal"
                  placeholder="예: 385000"
                  data-card-index="${index}"
                  data-field="high"
                  value="${escapeHtml(card.high)}"
                >
              </label>
              <label class="fib-field">
                <span>저가</span>
                <input
                  class="fib-input"
                  type="text"
                  inputmode="decimal"
                  placeholder="예: 241000"
                  data-card-index="${index}"
                  data-field="low"
                  value="${escapeHtml(card.low)}"
                >
              </label>
            </div>

            <p class="fib-helper"></p>
            <p class="fib-meta"></p>

            <div class="fib-results">
              ${LEVELS.map((level) => `
                <section class="fib-result" data-level-key="${level.key}">
                  <div class="fib-result-top">
                    <span class="fib-result-label">${level.label}</span>
                  </div>
                  <p class="fib-result-price">-</p>
                  <p class="fib-result-rate">고가 대비 등가율 -</p>
                </section>
              `).join("")}
            </div>
          </article>
        `).join("");

        calculatorElements.grid.querySelectorAll("[data-calc-card]").forEach((cardElement) => {
          renderCardOutputs(cardElement, computeCard(calculatorState.cards[Number(cardElement.dataset.calcCard)]));
        });
      };

      const bindCalculatorEvents = () => {
        calculatorElements.grid.querySelectorAll(".fib-input").forEach((input) => {
          if (input.dataset.bound === "true") return;
          input.dataset.bound = "true";
          input.addEventListener("input", (event) => {
            const target = event.currentTarget;
            const cardIndex = Number(target.dataset.cardIndex);
            const field = String(target.dataset.field || "");
            if (!Number.isInteger(cardIndex) || !field) return;
            calculatorState.cards[cardIndex][field] = target.value;
            persistCalculatorCards();
            const cardElement = target.closest("[data-calc-card]");
            const computation = computeCard(calculatorState.cards[cardIndex]);
            if (cardElement) {
              renderCardOutputs(cardElement, computation);
            }
            window.PPUsageLogger?.trackDebounced?.(
              `calculator-input-${cardIndex}`,
              "calculator_input",
              {
                view: "calculator",
                metadata: buildCalculatorLogMetadata(cardIndex, field, computation)
              }
            );
          });
        });

        if (calculatorElements.resetButton && calculatorElements.resetButton.dataset.bound !== "true") {
          calculatorElements.resetButton.dataset.bound = "true";
          calculatorElements.resetButton.addEventListener("click", () => {
            calculatorState.cards = createDefaultCards();
            persistCalculatorCards();
            renderCalculatorCards();
            bindCalculatorEvents();
            window.PPUsageLogger?.track?.("calculator_reset", {
              view: "calculator",
              success: true
            });
          });
        }
      };

      const getAllViewButtons = () => (
        [...document.querySelectorAll(".view-switcher-button[data-view], .mobile-bottom-nav-button[data-view]")]
      );

      const installViewPatches = () => {
        normalizeViewName = function (view) {
          const normalized = String(view || "").trim().toLowerCase();
          if (normalized === "recommendations" || normalized === "calculator") return normalized;
          return "dashboard";
        };

        renderActiveView = function () {
          const activeView = normalizeViewName(state.activeView);
          document.querySelectorAll("[data-view-page]").forEach((section) => {
            if (!section) return;
            section.hidden = section.dataset.viewPage !== activeView;
          });

          getAllViewButtons().forEach((button) => {
            const isActive = button.dataset.view === activeView;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
          });
        };

        setActiveView = function (view, options = {}) {
          const nextView = normalizeViewName(view);
          const previousView = state.activeView;
          state.activeView = nextView;
          renderActiveView();

          if (typeof renderRecommendationFilterPanel === "function") {
            renderRecommendationFilterPanel();
          }

          if (options.persist !== false) {
            localStorage.setItem(VIEW_STORAGE_KEY, nextView);
          }

          if (nextView === "recommendations"
            && options.warmup !== false
            && typeof warmRecommendationUniverse === "function") {
            warmRecommendationUniverse(state.recommendations.filters, { silent: true }).catch(() => {});
          }

          if (options.track !== false && previousView !== nextView) {
            window.PPUsageLogger?.track?.(
              nextView === "calculator"
                ? "calculator_view"
                : nextView === "recommendations"
                  ? "recommendation_view"
                  : "dashboard_view",
              {
                view: nextView,
                metadata: {
                  reason: "view-switch"
                }
              }
            );
          }
        };

        if (calculatorElements.desktopButton && calculatorElements.desktopButton.dataset.bound !== "true") {
          calculatorElements.desktopButton.dataset.bound = "true";
          calculatorElements.desktopButton.addEventListener("click", () => {
            setActiveView("calculator");
          });
        }

        renderActiveView();

        const savedView = String(localStorage.getItem(VIEW_STORAGE_KEY) || "").trim().toLowerCase();
        if (savedView === "calculator") {
          setActiveView("calculator", { persist: false, warmup: false });
        }
      };

      calculatorState.cards = loadCalculatorCards();
      renderCalculatorCards();
      bindCalculatorEvents();
      installViewPatches();
    })();
