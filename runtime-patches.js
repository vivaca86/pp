// Runtime patches kept separate from index.html so operational fixes stay reviewable.
    (function () {
      const unlockEditableInputs = () => {
        document.querySelectorAll('.slot-input[data-editable="true"]').forEach((input) => {
          input.disabled = false;
        });
      };

      const scheduleUnlock = () => {
        window.setTimeout(unlockEditableInputs, 0);
        window.setTimeout(unlockEditableInputs, 400);
        window.setTimeout(unlockEditableInputs, 1200);
      };

      const isEditableSlotInput = (target) => (
        Boolean(target)
        && typeof target.matches === "function"
        && target.matches('.slot-input[data-editable="true"]')
      );

      let pendingRefreshToken = 0;

      const cloneEditableSlots = () => state.editableSlots.map((slot) => ({
        id: slot.id,
        query: slot.query,
        stock: slot.stock ? { ...slot.stock } : null,
        editable: true
      }));

      const buildEditableSlotsFromCodes = (codes) => codes.map((code, index) => {
        const normalized = normalizeTicker(code);
        return {
          id: index + 1,
          query: normalized,
          stock: normalized ? enrichStockMeta({ code: normalized }) : null,
          editable: true
        };
      });

      const areTickersApplied = (payload, codes) => {
        const expected = codes.map((code) => normalizeTicker(code));
        const applied = Array.isArray(payload?.slots)
          ? payload.slots
            .filter((slot) => slot?.editable)
            .map((slot) => normalizeTicker(slot.code || ""))
          : [];

        if (applied.length !== expected.length) return false;
        return applied.every((code, index) => code === expected[index]);
      };

      const requestGatewayWithTimeout = async (params, timeoutMs = 5000) => {
        const action = String(params?.action || "").trim();
        if (!state.gatewayUrl) {
          throw buildAppError(APP_ERROR_CODES.gatewayMissing, "게이트웨이 URL이 비어 있습니다.", { action });
        }

        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timeoutId = controller
          ? window.setTimeout(() => controller.abort(), timeoutMs)
          : 0;

        let response;
        try {
          response = await fetch(buildRequestUrl(params), {
            method: "GET",
            cache: "no-store",
            signal: controller?.signal
          });
        } catch (error) {
          if (controller && error?.name === "AbortError") {
            throw buildAppError("PP-GATEWAY-TIMEOUT", "게이트웨이 응답이 지연되고 있습니다.", {
              action,
              timedOut: true
            });
          }
          throw buildAppError(APP_ERROR_CODES.gatewayRequestFailed, "게이트웨이에 연결하지 못했습니다.", {
            action,
            cause: error
          });
        } finally {
          if (timeoutId) window.clearTimeout(timeoutId);
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

          throw buildAppError(code, message, {
            action,
            status,
            payload
          });
        }

        return payload;
      };

      const startBackgroundDashboardRefresh = (codes, targetDate) => {
        const refreshToken = ++pendingRefreshToken;

        const refreshOnce = async (attempt = 1) => {
          if (refreshToken !== pendingRefreshToken) return;

          try {
            const payload = await requestGatewayWithTimeout({
              action: "dashboard-data",
              date: targetDate
            }, 25000);

            if (!areTickersApplied(payload, codes)) {
              throw buildAppError(
                APP_ERROR_CODES.dashboardSyncTimeout,
                "저장된 종목이 아직 대시보드에 반영되지 않았습니다."
              );
            }

            if (refreshToken !== pendingRefreshToken) return;
            renderDashboard(payload);
            state.lastDashboardLoadedAt = Date.now();
            setStatus("지정한 종목으로 등가율 데이터를 갱신했습니다.", "success");
            scheduleUnlock();
          } catch (error) {
            console.warn(`dashboard refresh after save attempt ${attempt}`, error);
            if (refreshToken !== pendingRefreshToken) return;

            if (attempt >= 8) {
              setStatus("종목 저장은 완료됐고 최신 값 반영이 지연되고 있습니다. 잠시 후 새로고침하면 표시됩니다.", "loading");
              scheduleUnlock();
              return;
            }

            setStatus("종목 저장 완료. 최신 등가율을 불러오는 중입니다...", "loading");
            window.setTimeout(() => {
              refreshOnce(attempt + 1);
            }, Math.min(1000 * attempt + 600, 4000));
          }
        };

        setStatus("종목 저장 완료. 최신 등가율을 불러오는 중입니다...", "loading");
        window.setTimeout(() => {
          refreshOnce(1);
        }, 900);
      };

      const installRuntimePatches = () => {
        if (typeof setBusyState === "function") {
          setBusyState = function (isBusy) {
            const shouldDisableDate = Boolean(isBusy || state.loading || state.saving);
            elements.dateInput.disabled = shouldDisableDate;
            document.querySelectorAll('.slot-input[data-editable="true"]').forEach((input) => {
              input.disabled = Boolean(state.saving);
            });
            if (elements.snapshotRefreshButton) {
              elements.snapshotRefreshButton.disabled = Boolean(state.snapshotRefreshing || state.loading || state.saving);
            }
          };
        }

        if (typeof loadDashboardPayloadWithRetry === "function") {
          loadDashboardPayloadWithRetry = async function (date, maxAttempts = 3) {
            if (typeof loadDashboardPayloadFromStaticSnapshot === "function") {
              const staticPayload = await loadDashboardPayloadFromStaticSnapshot(date);
              if (staticPayload) return staticPayload;
            }

            if (!state.dashboard || state.dashboardFromCache) {
              return loadDashboardPayloadFromSheetWithRetry(date, Math.min(maxAttempts, 2));
            }

            try {
              return await loadDashboardPayloadFromApi(date);
            } catch (error) {
              console.warn("api dashboard source failed, fallback to sheet", error);
              setStatus("빠른 조회에 실패해 스프레드시트 값으로 다시 불러오는 중입니다...", "loading");
              return loadDashboardPayloadFromSheetWithRetry(date, Math.min(maxAttempts, 2));
            }
          };
        }

        if (typeof saveTickerCodes === "function") {
          saveTickerCodes = async function (codes) {
            const targetDate = elements.dateInput.value || state.selectedDate || getTodayKstDate();
            const previousEditableSlots = cloneEditableSlots();
            const nextEditableSlots = buildEditableSlotsFromCodes(codes);

            state.editableSlots = nextEditableSlots;
            if (typeof clearCachedDashboardPayload === "function") {
              clearCachedDashboardPayload();
            }

            try {
              try {
                await requestGatewayWithTimeout({
                  action: "update-tickers",
                  tickers: codes.join(","),
                  date: targetDate
                }, 3500);
              } catch (error) {
                if (!error?.timedOut) {
                  throw error;
                }
                console.warn("update-tickers timed out; continuing with background verification", error);
              }

              if (typeof trackDashboardSearch === "function") {
                trackDashboardSearch(codes, targetDate, true, { reason: "save-tickers" });
              }
              startBackgroundDashboardRefresh(codes, targetDate);
              scheduleUnlock();
              return { ok: true, pendingRefresh: true };
            } catch (error) {
              if (typeof trackDashboardSearch === "function") {
                trackDashboardSearch(codes, targetDate, false, {
                  reason: String(error?.code || error?.message || "save-tickers-failed").slice(0, 48)
                });
              }
              state.editableSlots = previousEditableSlots;
              throw error;
            }
          };
        }

        if (typeof saveTickers === "function") {
          saveTickers = async function () {
            const composingInput = document.querySelector('.slot-input[data-editable="true"][data-composing="true"]');
            if (composingInput) {
              scheduleUnlock();
              return { ok: false, skipped: true, reason: "composing" };
            }

            if (!state.dashboard || state.saving) return;

            state.saving = true;
            setBusyState(true);
            setStatus("종목 저장 중...", "loading");

            try {
              const inputs = [...document.querySelectorAll('.slot-input[data-editable="true"]')];
              if (inputs.length !== SLOT_COUNT) {
                throw new Error("편집 가능한 종목 입력칸을 모두 찾지 못했습니다.");
              }

              const tickers = await Promise.all(inputs.map((input) => resolveTickerCodeForSave(input.value)));
              const result = await saveTickerCodes(tickers);
              if (!result?.pendingRefresh) {
                setStatus("종목 저장 완료", "success");
              }
              return result;
            } finally {
              state.saving = false;
              setBusyState(false);
              scheduleUnlock();
            }
          };
        }

        scheduleUnlock();
      };

      const installCompositionGuards = () => {
        document.addEventListener("compositionstart", (event) => {
          if (!isEditableSlotInput(event.target)) return;
          event.target.dataset.composing = "true";
        }, true);

        document.addEventListener("compositionend", (event) => {
          if (!isEditableSlotInput(event.target)) return;
          event.target.dataset.composing = "false";
        }, true);

        document.addEventListener("keydown", (event) => {
          if (event.key !== "Enter") return;
          if (!isEditableSlotInput(event.target)) return;
          if (event.isComposing || event.keyCode === 229 || event.target.dataset.composing === "true") {
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        }, true);
      };

      const watchSlotGrid = () => {
        const slotGrid = document.getElementById("slot-grid");
        if (!slotGrid) {
          window.setTimeout(watchSlotGrid, 300);
          return;
        }

        const observer = new MutationObserver(() => {
          scheduleUnlock();
        });
        observer.observe(slotGrid, { childList: true, subtree: true });
        scheduleUnlock();
      };

      const boot = () => {
        installCompositionGuards();
        installRuntimePatches();
        watchSlotGrid();
        scheduleUnlock();
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
      } else {
        boot();
      }

      window.addEventListener("load", scheduleUnlock);
    })();
