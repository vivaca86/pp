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

  const installBusyStatePatch = () => {
    if (typeof setBusyState !== "function") return;

    setBusyState = function (isBusy) {
      const shouldDisableDate = Boolean(isBusy || state.loading || state.saving);
      elements.dateInput.disabled = shouldDisableDate;
      document.querySelectorAll('.slot-input[data-editable="true"]').forEach((input) => {
        input.disabled = Boolean(state.saving);
      });
      if (elements.snapshotRefreshButton) {
        elements.snapshotRefreshButton.disabled = Boolean(state.snapshotRefreshing || state.loading || state.saving);
      }
      if (typeof renderSnapshotHealth === "function") {
        renderSnapshotHealth();
      }
    };
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

    const observer = new MutationObserver(scheduleUnlock);
    observer.observe(slotGrid, { childList: true, subtree: true });
    scheduleUnlock();
  };

  const boot = () => {
    installCompositionGuards();
    installBusyStatePatch();
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
