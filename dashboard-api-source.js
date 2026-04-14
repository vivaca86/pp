(() => {
  function buildHolidaySet(seriesCollection = []) {
    const days = new Set();
    seriesCollection.forEach((series) => {
      const holidays = Array.isArray(series?.holidays) ? series.holidays : [];
      holidays.forEach((day) => {
        if (day) days.add(String(day));
      });
    });
    return days;
  }

  async function loadPayload(deps) {
    const {
      date,
      getAllSlots,
      loadMonthlySeriesForTarget,
      loadSnapshotForTarget,
      applySnapshotToSeries,
      buildDashboardPayload,
      resolveMarketSession
    } = deps || {};

    if (!date || typeof getAllSlots !== "function") {
      throw new Error("API 소스 초기화가 올바르지 않습니다.");
    }

    const targets = getAllSlots();
    const seriesCollection = await Promise.all(targets.map(async (target) => {
      const monthly = await loadMonthlySeriesForTarget(target, date);
      const snapshot = await loadSnapshotForTarget(target, date);
      return applySnapshotToSeries(monthly, snapshot);
    }));

    const payload = buildDashboardPayload(seriesCollection, date);
    payload.session = resolveMarketSession(date, buildHolidaySet(seriesCollection));
    payload.sourceMode = "api";
    return payload;
  }

  window.DashboardApiSource = {
    loadPayload
  };
})();
