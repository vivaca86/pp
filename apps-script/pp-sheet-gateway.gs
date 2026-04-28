var STOCK_EQ_GATEWAY = {
  timezone: 'Asia/Seoul',
  defaultBaseUrl: 'https://openapi.koreainvestment.com:9443',
  defaultMarketDiv: 'J',
  defaultAdjustedPriceFlag: '1',
  tokenSkewMs: 120000,
  catalogCacheHours: 24,
  holidayCacheHours: 24,
  recommendationCacheHours: 6,
  recommendationCacheVersion: 'v4',
  recommendationScanDelayMs: 450,
  recommendationHistoryMonths: 12,
  recommendationHistoryPaddingDays: 20,
  recommendationHistoryCacheHours: 24,
  recommendationWarmupCacheHours: 2,
  kisRetryCount: 5,
  kisRetryDelayMs: 1200,
  cacheChunkSize: 8000,
  recentHistoryLookbackDays: 10,
  propertyPrefix: 'stock_eq_gateway_v1',
  recommendationUniverseSeeds: {
    KOSPI200: [
      '018880', '011780', '066570', '009150', '009420', '030000', '069620', '012450', '003030', '000240',
      '004000', '011200', '010140', '001440', '000810', '000720', '069960', '011170', '097950', '000120',
      '086790', '086280', '010130', '023530', '004490', '005300', '082740', '012330', '005380', '004020',
      '096770', '028670', '016360', '105560', '138930', '017800', '090430', '035250', '051910', '029780',
      '032830', '000660', '003240', '005930', '028050', '042660', '128940', '006800', '002790', '007340',
      '088350', '011210', '036570', '006400', '001430', '055550', '004990', '005830', '000210', '009830',
      '000080', '000270', '073240', '034220', '011070', '010060', '017670', '010950', '000670', '010120',
      '028260', '033780', '103140', '004170', '120110', '052690', '032640', '035420', '004370', '012750',
      '078930', '001040', '001680', '093370', '006280', '069260', '030200', '003550', '006260', '005850',
      '003490', '000150', '000880', '007310', '034730', '051900', '006360', '021240', '015760', '036460',
      '001800', '005490', '000100', '006650', '047050', '047040', '002380', '011790', '071050', '009540',
      '024110', '034020', '005940', '001450', '002030', '002840', '003090', '003230', '005250', '005420',
      '006040', '007070', '007660', '008730', '008770', '008930', '009240', '009970', '014680', '014820',
      '017960', '039490', '042700', '047810', '051600', '071320', '071970', '081660', '111770', '114090',
      '138040', '139130', '139480', '161390', '161890', '175330', '180640', '064350', '185750', '192820',
      '204320', '112610', '018260', '079550', '003670', '022100', '026960', '034230', '035720', '066970',
      '068270', '192080', '207940', '241560', '267250', '267260', '251270', '268280', '271560', '282330',
      '285130', '298020', '298040', '298050', '280360', '307950', '316140', '300720', '272210', '326030',
      '352820', '375500', '302440', '361610', '137310', '383220', '323410', '259960', '329180', '377300',
      '402340', '373220', '457190', '454910', '450080', '278470', '443060', '062040', '064400', '0126Z0'
    ],
    KOSDAQ150: [
      '000250', '005290', '006730', '007390', '009520', '014620', '015750', '018290', '025320', '025900',
      '025980', '028300', '030520', '031980', '032190', '032500', '033100', '033500', '035760', '035900',
      '036540', '036620', '036830', '036930', '036810', '039030', '039200', '041190', '041510', '046890',
      '048410', '050890', '052400', '053030', '053800', '056080', '056190', '058470', '058610', '059090',
      '060250', '060280', '060370', '064760', '065350', '067160', '067310', '068760', '069080', '074600',
      '078340', '078600', '079370', '080220', '082270', '083650', '084370', '085660', '086450', '086520',
      '086900', '087010', '089030', '095340', '095610', '096530', '095660', '098460', '101490', '101730',
      '108860', '112040', '121600', '122870', '131290', '131970', '137400', '140860', '141080', '145020',
      '194480', '196170', '200130', '213420', '214150', '214370', '214430', '214450', '215000', '215200',
      '218410', '222080', '222800', '225570', '232140', '240810', '237690', '032820', '189300', '241710',
      '178320', '183300', '101360', '161580', '003380', '272290', '263750', '171090', '253450', '281740',
      '166090', '042000', '253590', '226950', '108490', '247540', '251970', '278280', '290650', '298380',
      '319660', '323280', '336570', '204270', '304100', '357780', '293490', '348210', '277810', '352480',
      '383310', '195940', '058970', '257720', '348370', '376300', '211050', '388720', '399720', '310210',
      '403870', '328130', '365340', '358570', '445680', '417200', '460930', '347850', '466100', '0009K0'
    ]
  },
  recommendationUniverseMetadata: {
    '0126Z0': { name: '삼성에피스홀딩스', market: 'KOSPI' },
    '0009K0': { name: '에임드바이오', market: 'KOSDAQ' }
  },
  masterSources: [
    {
      market: 'KOSPI',
      url: 'https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip',
      fileName: 'kospi_code.mst',
      tailLength: 228
    },
    {
      market: 'KOSDAQ',
      url: 'https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip',
      fileName: 'kosdaq_code.mst',
      tailLength: 222
    },
    {
      market: 'KONEX',
      url: 'https://new.real.download.dws.co.kr/common/master/konex_code.mst.zip',
      fileName: 'konex_code.mst',
      tailLength: 184
    }
  ]
};

var PP_SHEET_GATEWAY = {
  timezone: 'Asia/Seoul',
  spreadsheetId: '1_vwuRC2LhZvRCf3r6Ub1I3s-RoPxGm8bn5kiUI-m8ik',
  controlSheetName: '시트2',
  indexSheetName: '시트3',
  controlRangeA1: 'A2:I40',
  tickerRangeA1: 'D2:I2',
  editableTickerCount: 6,
  indexDateRangeA1: 'B3:B80',
  holidayCalendarUrl: 'https://calendar.google.com/calendar/ical/ko.south_korea%23holiday%40group.v.calendar.google.com/public/basic.ics',
  recalcAttempts: 14,
  recalcPauseMs: 1200,
  dashboardCacheMinutes: 360,
  dashboardTodayCacheSeconds: 60,
  dashboardSnapshotCacheHours: 6,
  dashboardSnapshotMaxAgeSeconds: 300,
  dashboardSnapshotTriggerMinutes: 1,
  dashboardSnapshotMarketOpenMinute: 8 * 60 + 55,
  dashboardSnapshotMarketCloseMinute: 15 * 60 + 40,
  dashboardManualRefreshCooldownSeconds: 120
};

function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = String(params.action || 'health').trim();
    var payload = routeGatewayAction_(action, params);
    return jsonResponse_(payload);
  } catch (error) {
    return jsonResponse_(buildErrorResponse_(error));
  }
}

function routeGatewayAction_(action, params) {
  switch (action) {
    case 'health':
      return handleHealth_();
    case 'stock-catalog':
      return handleStockCatalog_(params);
    case 'stock-search':
      return handleStockSearch_(params);
    case 'dashboard-data':
      return handleDashboardData_(params);
    case 'dashboard-snapshot-status':
      return handleDashboardSnapshotStatus_(params);
    case 'dashboard-snapshot-refresh':
      return handleDashboardSnapshotRefresh_(params);
    case 'update-tickers':
      return handleUpdateTickers_(params);
    case 'equity-month':
      return handleEquityMonth_(params);
    case 'index-month':
      return handleIndexMonth_(params);
    case 'intraday-snapshot':
      return handleIntradaySnapshot_(params);
    case 'index-snapshot':
      return handleIndexSnapshot_(params);
    case 'fibonacci-recommendations':
      return handleFibonacciRecommendations_(params);
    case 'fibonacci-warmup':
      return handleFibonacciWarmup_(params);
    default:
      throw createHttpError_(400, '지원하지 않는 action 입니다: ' + action);
  }
}

function handleStockCatalog_(params) {
  var market = String(params.market || 'KOSPI').trim().toUpperCase();
  var catalog = getStockCatalog_();
  var items = [];

  for (var i = 0; i < catalog.length; i += 1) {
    var item = catalog[i];
    if (market === 'ALL' || String(item.market || '').toUpperCase() === market) {
      items.push(item);
    }
  }

  return {
    ok: true,
    market: market,
    items: items,
    source: 'kis-master'
  };
}

function handleHealth_() {
  var spreadsheet = openSpreadsheet_();
  return {
    ok: true,
    service: 'pp-sheet-gateway',
    now: formatKstTimestamp_(new Date()),
    spreadsheetId: spreadsheet.getId(),
    spreadsheetTitle: spreadsheet.getName(),
    hasCredentials: Boolean(getSetting_('KIS_APP_KEY', '') && getSetting_('KIS_APP_SECRET', ''))
  };
}

function handleStockSearch_(params) {
  var query = String(params.q || params.ticker || '').trim();
  if (!query) {
    return {
      ok: true,
      items: [],
      source: 'kis-master'
    };
  }

  return {
    ok: true,
    items: searchStockCatalog_(query).slice(0, 20),
    source: 'kis-master'
  };
}

function handleDashboardData_(params) {
  var requestedDateParam = params.date ? coerceIsoDate_(params.date) : '';
  var latestSnapshot = loadLatestDashboardSnapshot_(requestedDateParam, false);
  if (latestSnapshot) {
    return latestSnapshot;
  }

  var context = openDashboardContext_();
  var currentDate = getSelectedDateIso_(context.controlSheet);
  var requestedDate = requestedDateParam || currentDate;

  if (requestedDate !== currentDate) {
    setSelectedDate_(context.controlSheet, requestedDate);
    waitForDashboardRefresh_(context, requestedDate, null);
  }

  var tickerCodes = getTickerCodes_(context.controlSheet);
  var snapshotPayload = loadDashboardSnapshot_(requestedDate, tickerCodes, false);
  if (snapshotPayload) {
    saveDashboardPayloadCache_(requestedDate, tickerCodes, snapshotPayload);
    return snapshotPayload;
  }

  var cachedPayload = loadDashboardPayloadCache_(requestedDate, tickerCodes);
  if (cachedPayload) {
    return cachedPayload;
  }

  var payload = buildStableDashboardPayload_(context);
  saveDashboardPayloadCache_(payload.selectedDate || requestedDate, tickerCodes, payload);
  saveDashboardSnapshot_(payload.selectedDate || requestedDate, tickerCodes, payload, 'request');
  return payload;
}

function handleDashboardSnapshotStatus_(params) {
  var context = openDashboardContext_();
  var dateIso = params.date ? coerceIsoDate_(params.date) : getSelectedDateIso_(context.controlSheet);
  var tickerCodes = getTickerCodes_(context.controlSheet);
  var snapshot = loadDashboardSnapshot_(dateIso, tickerCodes, true);

  return buildDashboardSnapshotStatusPayload_(dateIso, tickerCodes, snapshot);
}

function buildDashboardSnapshotStatusPayload_(dateIso, tickerCodes, snapshot) {
  return {
    ok: true,
    selectedDate: dateIso,
    tickers: tickerCodes,
    hasSnapshot: Boolean(snapshot),
    snapshotUpdatedAt: snapshot ? snapshot.snapshotUpdatedAt : null,
    snapshotAgeSeconds: snapshot ? snapshot.snapshotAgeSeconds : null,
    snapshotSource: snapshot ? snapshot.snapshotSource : null,
    snapshotFresh: snapshot ? isDashboardSnapshotFresh_(snapshot, dateIso) : false
  };
}

function handleDashboardSnapshotRefresh_(params) {
  var cooldownSeconds = Math.max(30, Math.round(Number(getSetting_(
    'DASHBOARD_MANUAL_REFRESH_COOLDOWN_SECONDS',
    PP_SHEET_GATEWAY.dashboardManualRefreshCooldownSeconds
  )) || 120));
  var cooldownKey = 'dashboard-snapshot-refresh:cooldown';
  var cooldown = loadTransientCachedValue_(cooldownKey);
  var nowMs = Date.now();
  var untilMs = Number(cooldown && cooldown.untilMs) || 0;

  if (untilMs > nowMs) {
    var context = openDashboardContext_();
    var dateIso = params.date ? coerceIsoDate_(params.date) : getSelectedDateIso_(context.controlSheet);
    var tickerCodes = getTickerCodes_(context.controlSheet);
    var snapshot = loadDashboardSnapshot_(dateIso, tickerCodes, true);
    var status = buildDashboardSnapshotStatusPayload_(dateIso, tickerCodes, snapshot);
    status.throttled = true;
    status.retryAfterSeconds = Math.max(1, Math.ceil((untilMs - nowMs) / 1000));
    return status;
  }

  saveTransientCachedValueSeconds_(cooldownKey, {
    untilMs: nowMs + (cooldownSeconds * 1000)
  }, cooldownSeconds);

  var result = refreshDashboardSnapshot_(true);
  result.manualRefresh = true;
  result.cooldownSeconds = cooldownSeconds;
  return result;
}

function handleUpdateTickers_(params) {
  var context = openDashboardContext_();
  var requestedDate = params.date ? coerceIsoDate_(params.date) : getSelectedDateIso_(context.controlSheet);
  var requestedCodes = parseTickerList_(params.tickers);
  var waitForStablePayload = String(params.sync || '').trim().toLowerCase() === 'true';
  var resolvedCodes = requestedCodes.map(function (item) {
    return item ? resolveStock_(item).code : '';
  });

  setTickerCodes_(context.controlSheet, resolvedCodes);
  clearDashboardPayloadCache_(requestedDate, resolvedCodes);
  clearLatestDashboardSnapshot_();

  if (requestedDate !== getSelectedDateIso_(context.controlSheet)) {
    setSelectedDate_(context.controlSheet, requestedDate);
  }

  if (waitForStablePayload) {
    waitForDashboardRefresh_(context, requestedDate, resolvedCodes);
    var payload = buildStableDashboardPayload_(context);
    saveDashboardPayloadCache_(payload.selectedDate || requestedDate, resolvedCodes, payload);
    saveDashboardSnapshot_(payload.selectedDate || requestedDate, resolvedCodes, payload, 'update-tickers');
    return payload;
  }

  return {
    ok: true,
    accepted: true,
    pendingRecalc: true,
    selectedDate: requestedDate,
    tickers: resolvedCodes,
    note: '티커 저장을 접수했습니다. 월간표는 백그라운드에서 갱신됩니다.'
  };
}

function normalizeDashboardCacheCodes_(codes) {
  var normalized = Array.isArray(codes) ? codes.slice() : [];
  while (normalized.length < PP_SHEET_GATEWAY.editableTickerCount) {
    normalized.push('');
  }
  return normalized.slice(0, PP_SHEET_GATEWAY.editableTickerCount).map(sanitizeStockCode_);
}

function getDashboardPayloadCacheKey_(dateIso, codes) {
  return [
    'dashboard-data',
    coerceIsoDate_(dateIso),
    normalizeDashboardCacheCodes_(codes).join(',')
  ].join(':');
}

function getDashboardSnapshotCacheKey_(dateIso, codes) {
  return [
    'dashboard-snapshot',
    coerceIsoDate_(dateIso),
    normalizeDashboardCacheCodes_(codes).join(',')
  ].join(':');
}

function getLatestDashboardSnapshotCacheKey_() {
  return 'dashboard-snapshot:latest';
}

function getDashboardCacheTtlSeconds_(dateIso) {
  if (coerceIsoDate_(dateIso) === todayIsoKst_()) {
    return Math.max(60, Number(getSetting_(
      'DASHBOARD_TODAY_CACHE_SECONDS',
      PP_SHEET_GATEWAY.dashboardTodayCacheSeconds
    )) || 60);
  }

  return Math.max(60, Math.round(Number(getSetting_(
    'DASHBOARD_CACHE_MINUTES',
    PP_SHEET_GATEWAY.dashboardCacheMinutes
  )) || 360) * 60);
}

function getDashboardSnapshotTtlSeconds_() {
  return Math.max(60, Math.round(Number(getSetting_(
    'DASHBOARD_SNAPSHOT_CACHE_HOURS',
    PP_SHEET_GATEWAY.dashboardSnapshotCacheHours
  )) || 6) * 60 * 60);
}

function getDashboardSnapshotMaxAgeSeconds_(dateIso) {
  if (coerceIsoDate_(dateIso) !== todayIsoKst_()) {
    return getDashboardSnapshotTtlSeconds_();
  }
  if (!shouldRunDashboardSnapshotTrigger_()) {
    return getDashboardSnapshotTtlSeconds_();
  }
  return Math.max(60, Number(getSetting_(
    'DASHBOARD_SNAPSHOT_MAX_AGE_SECONDS',
    PP_SHEET_GATEWAY.dashboardSnapshotMaxAgeSeconds
  )) || 300);
}

function loadDashboardPayloadCache_(dateIso, codes) {
  var cached = loadTransientCachedValue_(getDashboardPayloadCacheKey_(dateIso, codes));
  if (!cached || !cached.ok || !Array.isArray(cached.rows) || !Array.isArray(cached.slots)) {
    return null;
  }
  return cached;
}

function saveDashboardPayloadCache_(dateIso, codes, payload) {
  if (!payload || !payload.ok || !Array.isArray(payload.rows) || !Array.isArray(payload.slots)) {
    return;
  }
  saveTransientCachedValueSeconds_(
    getDashboardPayloadCacheKey_(dateIso, codes),
    payload,
    getDashboardCacheTtlSeconds_(dateIso)
  );
}

function clearDashboardPayloadCache_(dateIso, codes) {
  clearTransientCachedValue_(getDashboardPayloadCacheKey_(dateIso, codes));
}

function getPayloadUpdatedAtMs_(payload) {
  var timestamp = String(
    payload && (payload.snapshotUpdatedAt || payload.updatedAt || '')
  ).trim();
  if (!timestamp) return 0;

  var parsed = new Date(timestamp).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function decorateDashboardSnapshot_(payload, source) {
  var updatedAt = String(payload.snapshotUpdatedAt || payload.updatedAt || formatKstTimestamp_(new Date())).trim();
  payload.snapshotUpdatedAt = updatedAt;
  payload.snapshotAgeSeconds = getPayloadUpdatedAtMs_(payload)
    ? Math.max(0, Math.round((Date.now() - getPayloadUpdatedAtMs_(payload)) / 1000))
    : null;
  payload.snapshotSource = source || payload.snapshotSource || 'snapshot';
  return payload;
}

function isDashboardSnapshotFresh_(payload, dateIso) {
  var updatedAtMs = getPayloadUpdatedAtMs_(payload);
  if (!updatedAtMs) return false;
  var ageSeconds = Math.max(0, Math.round((Date.now() - updatedAtMs) / 1000));
  return ageSeconds <= getDashboardSnapshotMaxAgeSeconds_(dateIso);
}

function loadDashboardSnapshot_(dateIso, codes, allowStale) {
  var snapshot = loadTransientCachedValue_(getDashboardSnapshotCacheKey_(dateIso, codes));
  if (!snapshot || !snapshot.ok || !Array.isArray(snapshot.rows) || !Array.isArray(snapshot.slots)) {
    return null;
  }

  snapshot = decorateDashboardSnapshot_(snapshot, snapshot.snapshotSource || 'snapshot');
  if (!allowStale && !isDashboardSnapshotFresh_(snapshot, dateIso)) {
    return null;
  }

  return snapshot;
}

function loadLatestDashboardSnapshot_(dateIso, allowStale) {
  var snapshot = loadTransientCachedValue_(getLatestDashboardSnapshotCacheKey_());
  if (!snapshot || !snapshot.ok || !Array.isArray(snapshot.rows) || !Array.isArray(snapshot.slots)) {
    return null;
  }

  if (dateIso && snapshot.selectedDate !== dateIso) {
    return null;
  }

  snapshot = decorateDashboardSnapshot_(snapshot, snapshot.snapshotSource || 'snapshot');
  if (!allowStale && !isDashboardSnapshotFresh_(snapshot, snapshot.selectedDate || dateIso || todayIsoKst_())) {
    return null;
  }

  return snapshot;
}

function saveDashboardSnapshot_(dateIso, codes, payload, source) {
  if (!payload || !payload.ok || !Array.isArray(payload.rows) || !Array.isArray(payload.slots)) {
    return;
  }

  var snapshot = decorateDashboardSnapshot_(payload, source || 'snapshot');
  saveTransientCachedValueSeconds_(
    getDashboardSnapshotCacheKey_(dateIso, codes),
    snapshot,
    getDashboardSnapshotTtlSeconds_()
  );
  saveTransientCachedValueSeconds_(
    getLatestDashboardSnapshotCacheKey_(),
    snapshot,
    getDashboardSnapshotTtlSeconds_()
  );
}

function clearLatestDashboardSnapshot_() {
  clearTransientCachedValue_(getLatestDashboardSnapshotCacheKey_());
}

function shouldRunDashboardSnapshotTrigger_() {
  var now = new Date();
  var weekday = Number(Utilities.formatDate(now, PP_SHEET_GATEWAY.timezone, 'u'));
  if (weekday === 6 || weekday === 7) {
    return false;
  }

  var hour = Number(Utilities.formatDate(now, PP_SHEET_GATEWAY.timezone, 'H'));
  var minute = Number(Utilities.formatDate(now, PP_SHEET_GATEWAY.timezone, 'm'));
  var currentMinute = (hour * 60) + minute;
  var openMinute = Number(getSetting_(
    'DASHBOARD_SNAPSHOT_MARKET_OPEN_MINUTE',
    PP_SHEET_GATEWAY.dashboardSnapshotMarketOpenMinute
  ));
  var closeMinute = Number(getSetting_(
    'DASHBOARD_SNAPSHOT_MARKET_CLOSE_MINUTE',
    PP_SHEET_GATEWAY.dashboardSnapshotMarketCloseMinute
  ));

  return currentMinute >= openMinute && currentMinute <= closeMinute;
}

function refreshDashboardSnapshot_(force) {
  if (!force && !shouldRunDashboardSnapshotTrigger_()) {
    return {
      ok: true,
      skipped: true,
      reason: 'outside-market-window',
      now: formatKstTimestamp_(new Date())
    };
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    return {
      ok: true,
      skipped: true,
      reason: 'snapshot-refresh-already-running',
      now: formatKstTimestamp_(new Date())
    };
  }

  try {
    var context = openDashboardContext_();
    var dateIso = getSelectedDateIso_(context.controlSheet);
    var tickerCodes = getTickerCodes_(context.controlSheet);
    var payload = buildStableDashboardPayload_(context);
    saveDashboardPayloadCache_(payload.selectedDate || dateIso, tickerCodes, payload);
    saveDashboardSnapshot_(payload.selectedDate || dateIso, tickerCodes, payload, force ? 'manual' : 'trigger');

    return {
      ok: true,
      selectedDate: payload.selectedDate || dateIso,
      tickers: tickerCodes,
      rows: Array.isArray(payload.rows) ? payload.rows.length : 0,
      slots: Array.isArray(payload.slots) ? payload.slots.length : 0,
      snapshotUpdatedAt: payload.snapshotUpdatedAt || payload.updatedAt,
      snapshotSource: force ? 'manual' : 'trigger'
    };
  } finally {
    lock.releaseLock();
  }
}

function refreshDashboardSnapshot() {
  return refreshDashboardSnapshot_(true);
}

function refreshLiveDashboardSnapshot() {
  return refreshDashboardSnapshot_(false);
}

function normalizeDashboardSnapshotTriggerMinutes_(value) {
  var requested = Number(value);
  var allowed = [1, 5, 10, 15, 30];
  for (var i = 0; i < allowed.length; i += 1) {
    if (requested === allowed[i]) {
      return requested;
    }
  }
  return 1;
}

function installDashboardSnapshotTrigger() {
  removeDashboardSnapshotTrigger();
  var minutes = normalizeDashboardSnapshotTriggerMinutes_(getSetting_(
    'DASHBOARD_SNAPSHOT_TRIGGER_MINUTES',
    PP_SHEET_GATEWAY.dashboardSnapshotTriggerMinutes
  ));

  ScriptApp.newTrigger('refreshLiveDashboardSnapshot')
    .timeBased()
    .everyMinutes(minutes)
    .create();

  return {
    ok: true,
    installed: true,
    handler: 'refreshLiveDashboardSnapshot',
    everyMinutes: minutes,
    initialSnapshot: refreshDashboardSnapshot()
  };
}

function removeDashboardSnapshotTrigger() {
  var removed = 0;
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i += 1) {
    if (triggers[i].getHandlerFunction() === 'refreshLiveDashboardSnapshot') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed += 1;
    }
  }

  return {
    ok: true,
    removed: removed
  };
}

function openDashboardContext_() {
  var spreadsheet = openSpreadsheet_();
  return {
    spreadsheet: spreadsheet,
    controlSheet: getSheetOrThrow_(spreadsheet, getSetting_('CONTROL_SHEET_NAME', PP_SHEET_GATEWAY.controlSheetName)),
    indexSheet: getSheetOrThrow_(spreadsheet, getSetting_('INDEX_SHEET_NAME', PP_SHEET_GATEWAY.indexSheetName))
  };
}

function openSpreadsheet_() {
  return SpreadsheetApp.openById(getSetting_('SPREADSHEET_ID', PP_SHEET_GATEWAY.spreadsheetId));
}

function getSheetOrThrow_(spreadsheet, name) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    throw createHttpError_(500, '시트를 찾지 못했습니다: ' + name);
  }
  return sheet;
}

function getSelectedDateIso_(controlSheet) {
  return coerceSheetDateToIso_(controlSheet.getRange('A3').getValue());
}

function setSelectedDate_(controlSheet, dateIso) {
  controlSheet.getRange('A3').setValue(buildSheetDate_(dateIso));
  SpreadsheetApp.flush();
}

function setTickerCodes_(controlSheet, codes) {
  if (!Array.isArray(codes) || codes.length !== PP_SHEET_GATEWAY.editableTickerCount) {
    throw createHttpError_(400, '티커는 정확히 ' + PP_SHEET_GATEWAY.editableTickerCount + '개여야 합니다.');
  }
  controlSheet.getRange(PP_SHEET_GATEWAY.tickerRangeA1).setValues([codes]);
  SpreadsheetApp.flush();
}

function waitForDashboardRefresh_(context, expectedDate, expectedCodes) {
  var expectedMonth = expectedDate.slice(0, 7);
  var normalizedCodes = Array.isArray(expectedCodes) ? expectedCodes.map(sanitizeStockCode_) : null;

  for (var attempt = 0; attempt < PP_SHEET_GATEWAY.recalcAttempts; attempt += 1) {
    Utilities.sleep(PP_SHEET_GATEWAY.recalcPauseMs);
    SpreadsheetApp.flush();

    var currentDate = getSelectedDateIso_(context.controlSheet);
    var dateOkay = currentDate === expectedDate;
    var monthOkay = hasTradingDataForMonth_(context.indexSheet, expectedMonth);
    var codesOkay = normalizedCodes ? compareArrays_(getTickerCodes_(context.controlSheet), normalizedCodes) : true;

    if (dateOkay && monthOkay && codesOkay) {
      return;
    }
  }
}

function buildDashboardPayload_(context) {
  var controlRange = context.controlSheet.getRange(PP_SHEET_GATEWAY.controlRangeA1);
  var values = controlRange.getValues();
  var displayValues = controlRange.getDisplayValues();
  var selectedDate = getSelectedDateIso_(context.controlSheet);
  var today = todayIsoKst_();
  var selectedDateIsToday = selectedDate === today;
  var tradingDates = readTradingDates_(context.indexSheet);
  var tradingSet = {};

  for (var i = 0; i < tradingDates.length; i += 1) {
    tradingSet[tradingDates[i]] = true;
  }

  var selectedDateIsWeekend = isWeekendIso_(selectedDate);
  var selectedDateIsKnownTradingDay = Boolean(tradingSet[selectedDate]);
  var allowLiveSelectedDate = selectedDateIsToday
    && !selectedDateIsWeekend
    && (!tradingDates.length || selectedDateIsKnownTradingDay);

  var slots = buildSlotPayloads_(values[0]);
  var totals = new Array(slots.length).fill(0);
  var rows = [];

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    var rowDateIso = coerceSheetDateToIso_(values[rowIndex][0]);
    if (!rowDateIso || rowDateIso.slice(0, 7) !== selectedDate.slice(0, 7)) {
      continue;
    }

    var cells = [];
    var hasValue = false;

    for (var columnIndex = 1; columnIndex < 9; columnIndex += 1) {
      var numeric = toNumber_(values[rowIndex][columnIndex]);
      var display = String(displayValues[rowIndex][columnIndex] || '').trim();

      if (!display && isFiniteNumber_(numeric)) {
        display = formatPercent_(numeric);
      }

      if (isFiniteNumber_(numeric)) {
        totals[columnIndex - 1] += numeric;
        hasValue = true;
      } else if (display) {
        hasValue = true;
      }

      cells.push({
        value: isFiniteNumber_(numeric) ? roundNumber_(numeric, 8) : null,
        display: display || '-'
      });
    }

    if (!hasValue) {
      continue;
    }

    var includeRow = !tradingDates.length || Boolean(tradingSet[rowDateIso]);
    if (!includeRow && allowLiveSelectedDate && rowDateIso === selectedDate) {
      includeRow = true;
    }

    if (!includeRow) {
      continue;
    }

    rows.push({
      date: rowDateIso,
      displayDate: formatMonthDay_(rowDateIso),
      values: cells
    });
  }

  for (var slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
    slots[slotIndex].total = roundNumber_(totals[slotIndex], 8);
  }

  var lastTradingDate = rows.length ? rows[0].date : selectedDate;

  return {
    ok: true,
    service: 'pp-sheet-gateway',
    spreadsheetTitle: context.spreadsheet.getName(),
    selectedDate: selectedDate,
    selectedDateLabel: formatHumanDate_(selectedDate),
    selectedDateIsTradingDay: Boolean(tradingSet[selectedDate]) || (allowLiveSelectedDate && rows.some(function (row) {
      return row.date === selectedDate;
    })),
    today: today,
    lastTradingDate: lastTradingDate,
    lastTradingDateLabel: formatHumanDate_(lastTradingDate),
    tradingDateCount: tradingDates.length,
    slots: slots,
    rows: rows,
    updatedAt: formatKstTimestamp_(new Date())
  };
}

function buildStableDashboardPayload_(context) {
  var payload = buildDashboardPayload_(context);

  for (var attempt = 0; attempt < PP_SHEET_GATEWAY.recalcAttempts; attempt += 1) {
    if (!isDashboardPayloadSparse_(payload)) {
      return payload;
    }

    Utilities.sleep(PP_SHEET_GATEWAY.recalcPauseMs);
    SpreadsheetApp.flush();
    payload = buildDashboardPayload_(context);
  }

  if (isDashboardPayloadSparse_(payload)) {
    throw createHttpError_(503, '월간표 재계산이 아직 끝나지 않았습니다. 잠시 후 다시 시도해 주세요.', 'PP-DASHBOARD-SPARSE');
  }

  return payload;
}

function isDashboardPayloadSparse_(payload) {
  if (!payload || !Array.isArray(payload.rows) || !payload.rows.length) {
    return false;
  }

  var suspiciousRows = 0;

  for (var rowIndex = 0; rowIndex < payload.rows.length; rowIndex += 1) {
    var row = payload.rows[rowIndex];
    var values = Array.isArray(row && row.values) ? row.values : [];
    if (values.length < 8) {
      continue;
    }

    var benchmarkFlags = values.slice(0, 2).map(isDashboardCellMeaningful_);
    var stockFlags = values.slice(2).map(isDashboardCellMeaningful_);
    var stockValueCount = stockFlags.filter(Boolean).length;

    if ((benchmarkFlags[0] && !benchmarkFlags[1]) || (!benchmarkFlags[0] && benchmarkFlags[1])) {
      suspiciousRows += 1;
      continue;
    }

    if ((benchmarkFlags[0] || benchmarkFlags[1]) && stockValueCount === 0) {
      suspiciousRows += 1;
    }
  }

  return suspiciousRows > 0;
}

function isDashboardCellMeaningful_(cell) {
  if (!cell) return false;
  if (isFiniteNumber_(cell.value)) return true;
  var display = String(cell.display || '').trim();
  return display !== '' && display !== '-';
}

function buildSlotPayloads_(headerRow) {
  var catalogByCode = buildCachedStockCatalogLookup_();
  var slots = [
    {
      editable: false,
      code: 'KOSPI',
      name: '코스피',
      market: 'KOSPI',
      total: 0
    },
    {
      editable: false,
      code: 'KOSDAQ',
      name: '코스닥',
      market: 'KOSDAQ',
      total: 0
    }
  ];

  for (var columnIndex = 3; columnIndex < 9; columnIndex += 1) {
    var code = sanitizeStockCode_(headerRow[columnIndex]);
    var matched = code ? catalogByCode[code] : null;
    slots.push({
      id: columnIndex - 2,
      editable: true,
      code: code,
      name: matched ? matched.name : (code || '종목명 확인 필요'),
      market: matched ? matched.market : 'KRX',
      total: 0
    });
  }

  return slots;
}

function buildCachedStockCatalogLookup_() {
  var cached = loadCachedValue_('catalog');
  var catalog = cached && Array.isArray(cached.items) ? cached.items : [];
  var lookup = {};

  for (var i = 0; i < catalog.length; i += 1) {
    var item = catalog[i];
    if (item && item.code) {
      lookup[item.code] = item;
    }
  }

  return lookup;
}

function readTradingDates_(indexSheet) {
  var values = indexSheet.getRange(PP_SHEET_GATEWAY.indexDateRangeA1).getValues();
  var days = [];

  for (var i = 0; i < values.length; i += 1) {
    var iso = coerceSheetDateToIso_(values[i][0]);
    if (iso) {
      days.push(iso);
    }
  }

  return uniqueStrings_(days).sort();
}

function hasTradingDataForMonth_(indexSheet, monthKey) {
  var values = indexSheet.getRange(PP_SHEET_GATEWAY.indexDateRangeA1).getValues();
  for (var i = 0; i < values.length; i += 1) {
    var iso = coerceSheetDateToIso_(values[i][0]);
    if (iso && iso.slice(0, 7) === monthKey) {
      return true;
    }
  }
  return false;
}

function getTickerCodes_(controlSheet) {
  return controlSheet.getRange(PP_SHEET_GATEWAY.tickerRangeA1).getDisplayValues()[0].map(function (value) {
    return sanitizeStockCode_(value);
  });
}

function parseTickerList_(text) {
  var items = String(text || '')
    .split(',')
    .map(function (item) {
      return String(item || '').trim();
    });

  if (items.length !== PP_SHEET_GATEWAY.editableTickerCount) {
    throw createHttpError_(400, 'tickers 파라미터는 쉼표로 구분된 ' + PP_SHEET_GATEWAY.editableTickerCount + '개 값이어야 합니다.');
  }

  return items;
}

function handleEquityMonth_(params) {
  var stock = resolveStock_(params.ticker || params.q || '');
  var selectedDate = coerceIsoDate_(params.date);
  var monthStart = startOfMonthIso_(selectedDate);
  var holidays = getMonthlyHolidayDates_(selectedDate);
  var boundaryHolidays = getBoundaryHolidayDates_(selectedDate);
  var historyEndDate = resolveSeriesEndDate_(selectedDate, boundaryHolidays);
  var rows = fetchDailyCloseRows_(stock.code, addDaysIso_(monthStart, -40), historyEndDate);
  var partition = partitionMonthRows_(rows, monthStart);
  var lastTradingDate = inferLastTradingDate_(historyEndDate, monthStart, partition.rows, holidays);

  return {
    ok: true,
    stock: stock,
    selectedDate: selectedDate,
    lastTradingDate: lastTradingDate,
    baselineDate: partition.baselineDate,
    baselineClose: partition.baselineClose,
    rows: partition.rows,
    holidays: holidays,
    source: 'kis-open-api'
  };
}

function handleIndexMonth_(params) {
  var stock = resolveIndexBenchmark_(params.indexCode || params.q || '0001');
  var selectedDate = coerceIsoDate_(params.date);
  var monthStart = startOfMonthIso_(selectedDate);
  var holidays = getMonthlyHolidayDates_(selectedDate);
  var boundaryHolidays = getBoundaryHolidayDates_(selectedDate);
  var historyEndDate = resolveSeriesEndDate_(selectedDate, boundaryHolidays);
  var rows = fetchIndexDailyRows_(stock.code, historyEndDate);
  var partition = partitionMonthRows_(rows, monthStart);
  var lastTradingDate = inferLastTradingDate_(historyEndDate, monthStart, partition.rows, holidays);

  return {
    ok: true,
    stock: stock,
    selectedDate: selectedDate,
    lastTradingDate: lastTradingDate,
    baselineDate: partition.baselineDate,
    baselineClose: partition.baselineClose,
    rows: partition.rows,
    holidays: holidays,
    source: 'kis-open-api'
  };
}

function handleIntradaySnapshot_(params) {
  var stock = resolveStock_(params.ticker || params.q || '');
  var selectedDate = coerceIsoDate_(params.date);
  var holidays = getMonthlyHolidayDates_(selectedDate);
  var session = resolveGatewaySession_(selectedDate, holidays);
  var timestamp = formatKstTimestamp_(new Date());

  if (session === 'historical') {
    return {
      ok: true,
      date: selectedDate,
      price: null,
      prevClose: null,
      equalRate: null,
      asOf: timestamp,
      session: session
    };
  }

  if (session === 'holiday' || session === 'preopen') {
    var previousClose = fetchPreviousCloseBeforeDate_(stock.code, selectedDate);
    return {
      ok: true,
      date: selectedDate,
      price: null,
      prevClose: previousClose,
      equalRate: null,
      asOf: timestamp,
      session: session
    };
  }

  var quote = fetchCurrentQuote_(stock.code);
  var price = firstFiniteNumber_([
    toNumber_(quote.stck_prpr),
    toNumber_(quote.stck_clpr)
  ]);
  var prevClose = resolvePreviousClose_(quote, price);

  if (!isFiniteNumber_(price) && session === 'closed') {
    price = fetchPreviousCloseBeforeDate_(stock.code, addDaysIso_(selectedDate, 1));
    if (!isFiniteNumber_(prevClose)) {
      prevClose = fetchPreviousCloseBeforeDate_(stock.code, selectedDate);
    }
  }

  if (!isFiniteNumber_(price)) {
    throw createHttpError_(502, '현재가 응답에서 가격을 확인하지 못했습니다.');
  }

  return {
    ok: true,
    date: selectedDate,
    price: price,
    prevClose: prevClose,
    equalRate: isFiniteNumber_(price) && isFiniteNumber_(prevClose) && prevClose !== 0
      ? roundNumber_((price / prevClose) - 1, 8)
      : null,
    asOf: timestamp,
    session: session,
    source: 'kis-open-api'
  };
}

function handleIndexSnapshot_(params) {
  var stock = resolveIndexBenchmark_(params.indexCode || params.q || '0001');
  var selectedDate = coerceIsoDate_(params.date);
  var holidays = getMonthlyHolidayDates_(selectedDate);
  var session = resolveGatewaySession_(selectedDate, holidays);
  var timestamp = formatKstTimestamp_(new Date());

  if (session === 'historical') {
    return {
      ok: true,
      date: selectedDate,
      price: null,
      prevClose: null,
      equalRate: null,
      asOf: timestamp,
      session: session
    };
  }

  if (session === 'holiday' || session === 'preopen') {
    var previousClose = fetchPreviousIndexCloseBeforeDate_(stock.code, selectedDate);
    return {
      ok: true,
      date: selectedDate,
      price: null,
      prevClose: previousClose,
      equalRate: null,
      asOf: timestamp,
      session: session
    };
  }

  var quote = fetchIndexCurrentQuote_(stock.code);
  var price = toNumber_(quote.bstp_nmix_prpr);
  var prevClose = resolveIndexPreviousClose_(quote);

  if (!isFiniteNumber_(price) && session === 'closed') {
    price = fetchPreviousIndexCloseBeforeDate_(stock.code, addDaysIso_(selectedDate, 1));
    if (!isFiniteNumber_(prevClose)) {
      prevClose = fetchPreviousIndexCloseBeforeDate_(stock.code, selectedDate);
    }
  }

  if (!isFiniteNumber_(price)) {
    throw createHttpError_(502, '지수 현재가를 확인하지 못했습니다.');
  }

  return {
    ok: true,
    date: selectedDate,
    price: price,
    prevClose: prevClose,
    equalRate: isFiniteNumber_(price) && isFiniteNumber_(prevClose) && prevClose !== 0
      ? roundNumber_((price / prevClose) - 1, 8)
      : null,
    asOf: timestamp,
    session: session,
    source: 'kis-open-api'
  };
}

function handleFibonacciRecommendations_(params) {
  var universe = normalizeRecommendationUniverse_(params.universe || 'KOSDAQ150');
  var selectedDate = coerceIsoDate_(params.date);
  var periodMonths = clampNumber_(toNumber_(params.periodMonths), 1, 12, 6);
  var level = normalizeFibLevel_(params.level);
  var mode = normalizeRecommendationMode_(params.mode);
  var lookbackDays = normalizeRecommendationLookbackDays_(params.lookbackDays);
  var tolerance = clampNumber_(toNumber_(params.tolerance), 0.001, 0.05, 0.01);
  return loadOrBuildFibonacciPayload_(universe, selectedDate, periodMonths, level, mode, lookbackDays, tolerance);
}

function handleFibonacciWarmup_(params) {
  var universe = normalizeRecommendationUniverse_(params.universe || 'KOSDAQ150');
  var selectedDate = coerceIsoDate_(params.date);
  var maxPeriodMonths = clampNumber_(
    toNumber_(params.maxPeriodMonths),
    1,
    Number(STOCK_EQ_GATEWAY.recommendationHistoryMonths || 12),
    Number(STOCK_EQ_GATEWAY.recommendationHistoryMonths || 12)
  );

  return warmRecommendationUniverse_(universe, selectedDate, maxPeriodMonths);
}

function loadOrBuildFibonacciPayload_(universe, selectedDate, periodMonths, level, mode, lookbackDays, tolerance) {
  var cacheKey = [
    'fibscan',
    STOCK_EQ_GATEWAY.recommendationCacheVersion,
    universe,
    selectedDate,
    periodMonths,
    String(level),
    String(mode),
    String(lookbackDays),
    String(tolerance)
  ].join(':');
  var cached = loadTransientCachedValue_(cacheKey);
  if (cached && Array.isArray(cached.items)) {
    cached.ok = true;
    return cached;
  }

  if (universe === 'ALL') {
    var kospiPayload = loadOrBuildFibonacciPayload_('KOSPI200', selectedDate, periodMonths, level, mode, lookbackDays, tolerance);
    var kosdaqPayload = loadOrBuildFibonacciPayload_('KOSDAQ150', selectedDate, periodMonths, level, mode, lookbackDays, tolerance);
    var mergedPayload = mergeRecommendationPayloads_(selectedDate, periodMonths, level, mode, lookbackDays, tolerance, [
      kospiPayload,
      kosdaqPayload
    ]);
    saveTransientCachedValue_(cacheKey, mergedPayload, STOCK_EQ_GATEWAY.recommendationCacheHours);
    mergedPayload.ok = true;
    return mergedPayload;
  }

  var universeItems = getRecommendationUniverseItems_(universe);
  var startDate = addMonthsIso_(selectedDate, -1 * periodMonths);
  var items = [];

  for (var i = 0; i < universeItems.length; i += 1) {
    var candidateResult = buildFibonacciRecommendationWithCache_(
      universeItems[i],
      startDate,
      selectedDate,
      level,
      mode,
      lookbackDays,
      tolerance
    );
    if (candidateResult.item) items.push(candidateResult.item);
    if (!candidateResult.usedCache) {
      Utilities.sleep(STOCK_EQ_GATEWAY.recommendationScanDelayMs);
    }
  }

  items.sort(function (left, right) {
    var leftDistance = Math.abs(Number(left.distanceRate || 0));
    var rightDistance = Math.abs(Number(right.distanceRate || 0));
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    return String(left.name || '').localeCompare(String(right.name || ''));
  });

  var payload = {
    ok: true,
    universe: universe,
    universeLabel: getRecommendationUniverseLabel_(universe),
    universeSource: 'investing-components-snapshot',
    note: '전체 구성종목 기준 첫 조회는 조금 걸릴 수 있으며 같은 조건은 캐시됩니다.',
    selectedDate: selectedDate,
    periodMonths: periodMonths,
    level: level,
    mode: mode,
    lookbackDays: lookbackDays,
    tolerance: tolerance,
    scannedCount: universeItems.length,
    matchedCount: items.length,
    items: items.slice(0, 30),
    source: 'kis-open-api'
  };

  saveTransientCachedValue_(cacheKey, payload, STOCK_EQ_GATEWAY.recommendationCacheHours);
  return payload;
}

function warmRecommendationUniverse_(universe, selectedDate, maxPeriodMonths) {
  var cacheKey = [
    'fibwarm',
    STOCK_EQ_GATEWAY.recommendationCacheVersion,
    universe,
    selectedDate,
    maxPeriodMonths
  ].join(':');
  var cached = loadTransientCachedValue_(cacheKey);
  if (cached && cached.ok) {
    return cached;
  }

  if (universe === 'ALL') {
    var kospiWarm = warmRecommendationUniverse_('KOSPI200', selectedDate, maxPeriodMonths);
    var kosdaqWarm = warmRecommendationUniverse_('KOSDAQ150', selectedDate, maxPeriodMonths);
    var mergedWarm = {
      ok: true,
      universe: 'ALL',
      universeLabel: getRecommendationUniverseLabel_('ALL'),
      selectedDate: selectedDate,
      maxPeriodMonths: maxPeriodMonths,
      warmedCount: Number(kospiWarm.warmedCount || 0) + Number(kosdaqWarm.warmedCount || 0),
      totalCount: Number(kospiWarm.totalCount || 0) + Number(kosdaqWarm.totalCount || 0),
      errorCount: Number(kospiWarm.errorCount || 0) + Number(kosdaqWarm.errorCount || 0),
      source: 'kis-open-api',
      note: '추천 대상 일봉 캐시를 미리 준비했습니다.'
    };
    saveTransientCachedValue_(cacheKey, mergedWarm, STOCK_EQ_GATEWAY.recommendationWarmupCacheHours);
    return mergedWarm;
  }

  var universeItems = getRecommendationUniverseItems_(universe);
  var warmedCount = 0;
  var errorCount = 0;

  for (var i = 0; i < universeItems.length; i += 1) {
    try {
      var warmResult = fetchRecommendationPriceRowsResult_(universeItems[i].code, selectedDate, maxPeriodMonths);
      warmedCount += 1;
      if (!warmResult.cached) {
        Utilities.sleep(STOCK_EQ_GATEWAY.recommendationScanDelayMs);
      }
    } catch (error) {
      errorCount += 1;
    }
  }

  var payload = {
    ok: true,
    universe: universe,
    universeLabel: getRecommendationUniverseLabel_(universe),
    selectedDate: selectedDate,
    maxPeriodMonths: maxPeriodMonths,
    warmedCount: warmedCount,
    totalCount: universeItems.length,
    errorCount: errorCount,
    source: 'kis-open-api',
    note: '추천 대상 일봉 캐시를 미리 준비했습니다.'
  };

  saveTransientCachedValue_(cacheKey, payload, STOCK_EQ_GATEWAY.recommendationWarmupCacheHours);
  return payload;
}

function getRecommendationUniverseItems_(universe) {
  var seeds = getRecommendationUniverseSeeds_();
  var metadata = getRecommendationUniverseMetadata_();
  var codes = [];

  if (universe === 'KOSPI200' || universe === 'KOSDAQ150') {
    codes = seeds[universe] || [];
  } else {
    codes = uniqueStrings_((seeds.KOSPI200 || []).concat(seeds.KOSDAQ150 || []));
  }

  var catalog = getStockCatalog_();
  var catalogByCode = {};
  for (var i = 0; i < catalog.length; i += 1) {
    catalogByCode[catalog[i].code] = catalog[i];
  }

  var items = [];
  for (var j = 0; j < codes.length; j += 1) {
    var code = sanitizeStockCode_(codes[j]);
    var item = catalogByCode[code];
    if (!item) {
      item = buildRecommendationUniverseFallbackItem_(code, metadata[code], universe);
    }
    if (!item) continue;
    items.push(item);
  }

  return items;
}

function getRecommendationUniverseSeeds_() {
  var merged = {
    KOSPI200: (STOCK_EQ_GATEWAY.recommendationUniverseSeeds.KOSPI200 || []).slice(),
    KOSDAQ150: (STOCK_EQ_GATEWAY.recommendationUniverseSeeds.KOSDAQ150 || []).slice()
  };
  var overrideText = getSetting_('RECOMMENDATION_UNIVERSE_SEEDS_JSON', '');
  var override = safeJsonParse_(overrideText);
  if (!override) return merged;

  if (Array.isArray(override.KOSPI200)) {
    merged.KOSPI200 = uniqueStrings_(override.KOSPI200.map(sanitizeStockCode_));
  }
  if (Array.isArray(override.KOSDAQ150)) {
    merged.KOSDAQ150 = uniqueStrings_(override.KOSDAQ150.map(sanitizeStockCode_));
  }

  return merged;
}

function getRecommendationUniverseMetadata_() {
  var base = STOCK_EQ_GATEWAY.recommendationUniverseMetadata || {};
  var merged = {};
  var baseKeys = Object.keys(base);

  for (var i = 0; i < baseKeys.length; i += 1) {
    merged[sanitizeStockCode_(baseKeys[i])] = {
      name: String(base[baseKeys[i]].name || '').trim(),
      market: String(base[baseKeys[i]].market || '').trim().toUpperCase()
    };
  }

  var override = safeJsonParse_(getSetting_('RECOMMENDATION_UNIVERSE_METADATA_JSON', ''));
  if (!override) return merged;

  var overrideKeys = Object.keys(override);
  for (var j = 0; j < overrideKeys.length; j += 1) {
    var code = sanitizeStockCode_(overrideKeys[j]);
    if (!code) continue;
    merged[code] = {
      name: String((override[overrideKeys[j]] && override[overrideKeys[j]].name) || '').trim(),
      market: String((override[overrideKeys[j]] && override[overrideKeys[j]].market) || '').trim().toUpperCase()
    };
  }

  return merged;
}

function buildRecommendationUniverseFallbackItem_(code, metadata, universe) {
  if (!code) return null;

  var market = metadata && metadata.market
    ? metadata.market
    : (universe === 'KOSDAQ150' ? 'KOSDAQ' : 'KOSPI');

  return {
    code: code,
    name: (metadata && metadata.name) || code,
    market: market
  };
}

function mergeRecommendationPayloads_(selectedDate, periodMonths, level, mode, lookbackDays, tolerance, payloads) {
  var mergedItems = [];
  var scannedCount = 0;
  var matchedCount = 0;

  for (var i = 0; i < payloads.length; i += 1) {
    var payload = payloads[i] || {};
    scannedCount += Number(payload.scannedCount || 0);
    matchedCount += Number(payload.matchedCount || 0);
    if (Array.isArray(payload.items)) {
      mergedItems = mergedItems.concat(payload.items);
    }
  }

  mergedItems.sort(function (left, right) {
    var leftDistance = Math.abs(Number(left.distanceRate || 0));
    var rightDistance = Math.abs(Number(right.distanceRate || 0));
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    return String(left.name || '').localeCompare(String(right.name || ''));
  });

  return {
    ok: true,
    universe: 'ALL',
    universeLabel: getRecommendationUniverseLabel_('ALL'),
    universeSource: 'investing-components-snapshot',
    note: '시장별 결과를 합쳐 보여주며 같은 조건은 캐시됩니다.',
    selectedDate: selectedDate,
    periodMonths: periodMonths,
    level: level,
    mode: mode,
    lookbackDays: lookbackDays,
    tolerance: tolerance,
    scannedCount: scannedCount,
    matchedCount: matchedCount,
    items: mergedItems.slice(0, 30),
    source: 'kis-open-api'
  };
}

function buildFibonacciRecommendationWithCache_(stock, startDateIso, endDateIso, level, mode, lookbackDays, tolerance) {
  var requestedMonths = diffMonthsApprox_(startDateIso, endDateIso);
  var priceRowsResult = fetchRecommendationPriceRowsResult_(stock.code, endDateIso, requestedMonths);
  var rows = priceRowsResult.rows
    .filter(function (row) {
      return row.date >= startDateIso && row.date <= endDateIso;
    });

  if (rows.length < 2) return { item: null, usedCache: priceRowsResult.cached };

  var periodHigh = null;
  var periodLow = null;
  for (var i = 0; i < rows.length; i += 1) {
    var rowHigh = firstFiniteNumber_([rows[i].high, rows[i].close]);
    var rowLow = firstFiniteNumber_([rows[i].low, rows[i].close]);

    if (!isFiniteNumber_(rowHigh) || !isFiniteNumber_(rowLow)) continue;
    if (!isFiniteNumber_(periodHigh) || rowHigh > periodHigh) periodHigh = rowHigh;
    if (!isFiniteNumber_(periodLow) || rowLow < periodLow) periodLow = rowLow;
  }

  if (!isFiniteNumber_(periodHigh) || !isFiniteNumber_(periodLow) || periodHigh <= periodLow) {
    return { item: null, usedCache: priceRowsResult.cached };
  }

  var latest = rows[rows.length - 1];
  var currentPrice = toNumber_(latest.close);
  if (!isFiniteNumber_(currentPrice)) return { item: null, usedCache: priceRowsResult.cached };

  var levelPrice = periodHigh - ((periodHigh - periodLow) * level);
  var currentDistanceRate = levelPrice !== 0 ? ((currentPrice / levelPrice) - 1) : null;
  var signal = evaluateFibonacciSignal_(mode, rows, levelPrice, tolerance, lookbackDays);
  if (!signal) {
    return { item: null, usedCache: priceRowsResult.cached };
  }

  return {
    item: {
      code: stock.code,
      name: stock.name,
      market: stock.market,
      currentPrice: roundNumber_(currentPrice, 2),
      priceDate: latest.date,
      periodHigh: roundNumber_(periodHigh, 2),
      periodLow: roundNumber_(periodLow, 2),
      level: level,
      levelPrice: roundNumber_(levelPrice, 2),
      distanceRate: roundNumber_(signal.distanceRate, 8),
      currentDistanceRate: roundNumber_(currentDistanceRate, 8),
      signalMode: mode,
      signalLabel: signal.label,
      signalReason: signal.reason,
      signalDate: signal.date,
      signalPrice: roundNumber_(signal.price, 2),
      signalWindowDays: lookbackDays
    },
    usedCache: priceRowsResult.cached
  };
}

function evaluateFibonacciSignal_(mode, rows, levelPrice, tolerance, lookbackDays) {
  var normalizedMode = normalizeRecommendationMode_(mode);
  var lowerBand = levelPrice * (1 - tolerance);
  var upperBand = levelPrice * (1 + tolerance);
  var windowDays = normalizeRecommendationLookbackDays_(lookbackDays);
  var startIndex = Math.max(0, rows.length - windowDays);

  if (!isFiniteNumber_(levelPrice) || !Array.isArray(rows) || !rows.length) {
    return null;
  }

  for (var index = rows.length - 1; index >= startIndex; index -= 1) {
    var currentRow = rows[index];
    var previousRow = index > 0 ? rows[index - 1] : null;
    var currentClose = toNumber_(currentRow && currentRow.close);
    var currentHigh = firstFiniteNumber_([toNumber_(currentRow && currentRow.high), currentClose]);
    var currentLow = firstFiniteNumber_([toNumber_(currentRow && currentRow.low), currentClose]);
    var previousClose = toNumber_(previousRow && previousRow.close);
    var distanceRate = levelPrice !== 0 ? ((currentClose / levelPrice) - 1) : null;

    if (!isFiniteNumber_(currentClose) || !isFiniteNumber_(distanceRate)) {
      continue;
    }

    if (normalizedMode === 'touch') {
      if (!isFiniteNumber_(currentHigh) || !isFiniteNumber_(currentLow)) continue;
      if (currentLow <= upperBand && currentHigh >= lowerBand) {
        return {
          label: '레벨 터치',
          reason: buildRecommendationSignalReason_(normalizedMode, currentRow.date, windowDays),
          date: currentRow.date,
          price: currentClose,
          distanceRate: distanceRate
        };
      }
      continue;
    }

    if (normalizedMode === 'breakout_up') {
      if (!isFiniteNumber_(previousClose)) continue;
      if (previousClose < lowerBand && currentClose > upperBand) {
        return {
          label: '상향 돌파',
          reason: buildRecommendationSignalReason_(normalizedMode, currentRow.date, windowDays),
          date: currentRow.date,
          price: currentClose,
          distanceRate: distanceRate
        };
      }
      continue;
    }

    if (normalizedMode === 'breakdown_down') {
      if (!isFiniteNumber_(previousClose)) continue;
      if (previousClose > upperBand && currentClose < lowerBand) {
        return {
          label: '하향 이탈',
          reason: buildRecommendationSignalReason_(normalizedMode, currentRow.date, windowDays),
          date: currentRow.date,
          price: currentClose,
          distanceRate: distanceRate
        };
      }
      continue;
    }

    if (Math.abs(distanceRate) <= tolerance) {
      return {
        label: '레벨 근접',
        reason: buildRecommendationSignalReason_(normalizedMode, currentRow.date, windowDays),
        date: currentRow.date,
        price: currentClose,
        distanceRate: distanceRate
      };
    }
  }

  return null;
}

function getRecommendationUniverseLabel_(universe) {
  if (universe === 'KOSPI200') return 'KOSPI200';
  if (universe === 'KOSDAQ150') return 'KOSDAQ150';
  return 'KOSPI200 + KOSDAQ150';
}

function normalizeRecommendationUniverse_(value) {
  var universe = String(value || 'KOSDAQ150').trim().toUpperCase();
  if (universe === 'KOSPI200' || universe === 'KOSDAQ150') return universe;
  return 'KOSDAQ150';
}

function normalizeFibLevel_(value) {
  var numeric = toNumber_(value);
  if (numeric === 0.236 || numeric === 0.382 || numeric === 0.5) {
    return numeric;
  }
  return 0.382;
}

function normalizeRecommendationMode_(value) {
  var mode = String(value || 'near').trim().toLowerCase();
  if (mode === 'touch' || mode === 'breakout_up' || mode === 'breakdown_down') {
    return mode;
  }
  return 'near';
}

function normalizeRecommendationLookbackDays_(value) {
  var numeric = Math.round(toNumber_(value));
  if (numeric === 3 || numeric === 5) {
    return numeric;
  }
  return 1;
}

function buildRecommendationSignalReason_(mode, signalDate, lookbackDays) {
  var prefix = lookbackDays > 1
    ? ('최근 ' + lookbackDays + '거래일 안에 ' + signalDate)
    : '기준일';

  if (mode === 'touch') {
    return prefix + ' 고가/저가 범위가 피보나치 레벨 구간을 터치했습니다.';
  }

  if (mode === 'breakout_up') {
    return prefix + ' 종가가 피보나치 레벨 위로 상향 돌파했습니다.';
  }

  if (mode === 'breakdown_down') {
    return prefix + ' 종가가 피보나치 레벨 아래로 내려왔습니다.';
  }

  return prefix + ' 종가가 선택한 피보나치 레벨 근처에 들어왔습니다.';
}

function resolveIndexBenchmark_(input) {
  var code = sanitizeStockCode_(input || '0001') || '0001';
  if (code === '0001') {
    return { code: '0001', name: 'KOSPI', market: 'INDEX', assetType: 'index' };
  }
  if (code === '1001') {
    return { code: '1001', name: 'KOSDAQ', market: 'INDEX', assetType: 'index' };
  }
  if (code === '2001') {
    return { code: '2001', name: 'KOSPI200', market: 'INDEX', assetType: 'index' };
  }
  throw createHttpError_(400, '지원하지 않는 지수 코드입니다: ' + code);
}

function resolveStock_(input) {
  var raw = String(input || '').trim();
  if (!raw) {
    throw createHttpError_(400, 'ticker 또는 q 파라미터가 필요합니다.');
  }

  var exactCode = sanitizeStockCode_(raw);
  if (exactCode) {
    var catalog = getStockCatalog_();
    for (var i = 0; i < catalog.length; i += 1) {
      if (catalog[i].code === exactCode) {
        return catalog[i];
      }
    }
    if (/^[A-Z0-9]{6,9}$/.test(exactCode)) {
      return {
        code: exactCode,
        name: raw,
        market: 'KRX'
      };
    }
  }

  var matches = searchStockCatalog_(raw);
  if (matches.length) {
    return matches[0];
  }

  throw createHttpError_(404, '종목을 찾지 못했습니다: ' + raw);
}

function searchStockCatalog_(query) {
  var catalog = getStockCatalog_();
  var normalized = normalizeSearchText_(query);
  if (!normalized) return [];

  var directMatches = searchStockCatalogNormalized_(catalog, normalized);
  if (directMatches.length) {
    return directMatches;
  }

  for (var end = normalized.length - 1; end >= 2; end -= 1) {
    var fallbackQuery = normalized.slice(0, end);
    var fallbackMatches = searchStockCatalogNormalized_(catalog, fallbackQuery);
    if (fallbackMatches.length) {
      return fallbackMatches;
    }
  }

  return [];
}

function searchStockCatalogNormalized_(catalog, normalized) {
  if (!normalized) return [];

  var exact = [];
  var prefix = [];
  var contains = [];

  for (var i = 0; i < catalog.length; i += 1) {
    var item = catalog[i];
    var codeKey = normalizeSearchText_(item.code);
    var nameKey = normalizeSearchText_(item.name);
    var marketKey = normalizeSearchText_(item.market);

    if (codeKey === normalized || nameKey === normalized) {
      exact.push(item);
      continue;
    }

    if (codeKey.indexOf(normalized) === 0 || nameKey.indexOf(normalized) === 0) {
      prefix.push(item);
      continue;
    }

    if (codeKey.indexOf(normalized) >= 0 || nameKey.indexOf(normalized) >= 0 || marketKey.indexOf(normalized) >= 0) {
      contains.push(item);
    }
  }

  return dedupeByCode_(exact.concat(prefix, contains));
}

function findStockByCode_(code) {
  var catalog = getStockCatalog_();
  for (var i = 0; i < catalog.length; i += 1) {
    if (catalog[i].code === code) {
      return catalog[i];
    }
  }
  return null;
}

function getStockCatalog_() {
  var cacheKey = 'catalog';
  var cached = loadCachedValue_(cacheKey);
  if (cached && Array.isArray(cached.items)) {
    return cached.items;
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    cached = loadCachedValue_(cacheKey);
    if (cached && Array.isArray(cached.items)) {
      return cached.items;
    }

    var items = buildStockCatalog_();
    saveCachedValue_(cacheKey, { items: items }, STOCK_EQ_GATEWAY.catalogCacheHours);
    return items;
  } finally {
    lock.releaseLock();
  }
}

function buildStockCatalog_() {
  var allItems = [];
  var seen = {};

  for (var i = 0; i < STOCK_EQ_GATEWAY.masterSources.length; i += 1) {
    var source = STOCK_EQ_GATEWAY.masterSources[i];
    var response = UrlFetchApp.fetch(source.url, {
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (response.getResponseCode() >= 400) {
      throw createHttpError_(502, '종목 마스터 다운로드에 실패했습니다: ' + source.market);
    }

    var files = Utilities.unzip(response.getBlob());
    var masterBlob = findUnzippedBlob_(files, source.fileName);
    if (!masterBlob) {
      throw createHttpError_(502, '압축 해제된 마스터 파일을 찾지 못했습니다: ' + source.fileName);
    }

    var marketItems = parseMasterBlob_(masterBlob, source.market, source.tailLength);
    for (var j = 0; j < marketItems.length; j += 1) {
      var item = marketItems[j];
      if (seen[item.code]) continue;
      seen[item.code] = true;
      allItems.push(item);
    }
  }

  allItems.sort(function (left, right) {
    var nameCompare = left.name.localeCompare(right.name);
    if (nameCompare !== 0) return nameCompare;
    return left.code.localeCompare(right.code);
  });

  return allItems;
}

function parseMasterBlob_(blob, market, tailLength) {
  var text = decodeKoreanBlob_(blob);
  var lines = text.split(/\r?\n/);
  var items = [];

  for (var i = 0; i < lines.length; i += 1) {
    var line = String(lines[i] || '').replace(/\u0000/g, '');
    if (!line || line.length <= tailLength + 21) continue;

    var prefix = line.slice(0, line.length - tailLength);
    var code = sanitizeStockCode_(prefix.slice(0, 9));
    var name = String(prefix.slice(21) || '').trim();
    if (!code || !name) continue;

    items.push({
      code: code,
      name: name,
      market: market
    });
  }

  return items;
}

function decodeKoreanBlob_(blob) {
  var charsets = ['CP949', 'MS949', 'EUC-KR', 'UTF-8'];
  for (var i = 0; i < charsets.length; i += 1) {
    try {
      return blob.getDataAsString(charsets[i]);
    } catch (error) {
      // Try next charset.
    }
  }
  return blob.getDataAsString();
}

function findUnzippedBlob_(files, fileName) {
  for (var i = 0; i < files.length; i += 1) {
    if (String(files[i].getName() || '') === fileName) {
      return files[i];
    }
  }
  return files.length ? files[0] : null;
}

function fetchDailyCloseRows_(ticker, startDateIso, endDateIso) {
  return fetchDailyPriceRows_(ticker, startDateIso, endDateIso)
    .map(function (item) {
      return {
        date: item.date,
        close: item.close
      };
    });
}

function fetchDailyPriceRows_(ticker, startDateIso, endDateIso) {
  var cacheKey = ['daily-price', sanitizeStockCode_(ticker), startDateIso, endDateIso].join(':');
  var cached = loadTransientCachedValue_(cacheKey);
  if (cached && Array.isArray(cached.rows)) {
    return cached.rows;
  }

  var json = callKisGet_(
    '/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice',
    'FHKST03010100',
    {
      FID_COND_MRKT_DIV_CODE: getSetting_('KIS_MARKET_DIV', STOCK_EQ_GATEWAY.defaultMarketDiv),
      FID_INPUT_ISCD: sanitizeStockCode_(ticker),
      FID_INPUT_DATE_1: isoToBasic_(startDateIso),
      FID_INPUT_DATE_2: isoToBasic_(endDateIso),
      FID_PERIOD_DIV_CODE: 'D',
      FID_ORG_ADJ_PRC: getSetting_('KIS_ORG_ADJ_PRC', STOCK_EQ_GATEWAY.defaultAdjustedPriceFlag)
    }
  );

  var output = Array.isArray(json.output2) ? json.output2 : [];
  var rows = output
    .map(function (item) {
      return {
        date: basicToIso_(item.stck_bsop_date),
        close: toNumber_(item.stck_clpr),
        high: toNumber_(item.stck_hgpr),
        low: toNumber_(item.stck_lwpr)
      };
    })
    .filter(function (item) {
      return item.date && isFiniteNumber_(item.close);
    });

  rows.sort(function (left, right) {
    return left.date.localeCompare(right.date);
  });

  saveTransientCachedValue_(cacheKey, { rows: rows }, STOCK_EQ_GATEWAY.recommendationCacheHours);
  return rows;
}

function fetchRecommendationPriceRowsResult_(ticker, endDateIso, requestedMonths) {
  var normalizedEndDate = coerceIsoDate_(endDateIso);
  var normalizedMonths = Number(STOCK_EQ_GATEWAY.recommendationHistoryMonths || 12);
  var startDateIso = addDaysIso_(
    addMonthsIso_(normalizedEndDate, -1 * normalizedMonths),
    -1 * Number(STOCK_EQ_GATEWAY.recommendationHistoryPaddingDays || 0)
  );
  var cacheKey = [
    'daily-price-rec',
    sanitizeStockCode_(ticker),
    normalizedEndDate,
    normalizedMonths
  ].join(':');

  var transientCached = loadTransientCachedValue_(cacheKey);
  if (transientCached && Array.isArray(transientCached.rows)) {
    return {
      rows: transientCached.rows,
      cached: true
    };
  }

  var rows = fetchDailyPriceRows_(ticker, startDateIso, normalizedEndDate);
  var payload = { rows: rows };
  saveTransientCachedValue_(cacheKey, payload, STOCK_EQ_GATEWAY.recommendationCacheHours);
  return {
    rows: rows,
    cached: false
  };
}

function fetchRecommendationPriceRows_(ticker, endDateIso, requestedMonths) {
  return fetchRecommendationPriceRowsResult_(ticker, endDateIso, requestedMonths).rows;
}

function fetchRecentCloseRows_(ticker, selectedDate) {
  return fetchDailyCloseRows_(
    ticker,
    addDaysIso_(selectedDate, -1 * STOCK_EQ_GATEWAY.recentHistoryLookbackDays),
    selectedDate
  );
}

function fetchCurrentQuote_(ticker) {
  var json = callKisGet_(
    '/uapi/domestic-stock/v1/quotations/inquire-price',
    'FHKST01010100',
    {
      FID_COND_MRKT_DIV_CODE: getSetting_('KIS_MARKET_DIV', STOCK_EQ_GATEWAY.defaultMarketDiv),
      FID_INPUT_ISCD: sanitizeStockCode_(ticker)
    }
  );

  return json.output || {};
}

function fetchIndexCurrentQuote_(indexCode) {
  var json = callKisGet_(
    '/uapi/domestic-stock/v1/quotations/inquire-index-price',
    'FHPUP02100000',
    {
      FID_COND_MRKT_DIV_CODE: 'U',
      FID_INPUT_ISCD: sanitizeStockCode_(indexCode)
    }
  );

  return json.output || {};
}

function fetchIndexDailyRows_(indexCode, endDateIso) {
  var json = callKisGet_(
    '/uapi/domestic-stock/v1/quotations/inquire-index-daily-price',
    'FHPUP02120000',
    {
      FID_PERIOD_DIV_CODE: 'D',
      FID_COND_MRKT_DIV_CODE: 'U',
      FID_INPUT_ISCD: sanitizeStockCode_(indexCode),
      FID_INPUT_DATE_1: isoToBasic_(endDateIso)
    }
  );

  var output = Array.isArray(json.output2) ? json.output2 : [];
  var rows = output
    .map(function (item) {
      return {
        date: basicToIso_(item.stck_bsop_date),
        close: toNumber_(item.bstp_nmix_prpr)
      };
    })
    .filter(function (item) {
      return item.date && isFiniteNumber_(item.close);
    });

  rows.sort(function (left, right) {
    return left.date.localeCompare(right.date);
  });

  return rows;
}

function fetchPreviousCloseBeforeDate_(ticker, dateIso) {
  var rows = fetchDailyCloseRows_(ticker, addDaysIso_(dateIso, -40), addDaysIso_(dateIso, -1));
  return rows.length ? rows[rows.length - 1].close : null;
}

function fetchPreviousIndexCloseBeforeDate_(indexCode, dateIso) {
  var rows = fetchIndexDailyRows_(indexCode, addDaysIso_(dateIso, -1));
  var filtered = rows.filter(function (row) {
    return row.date < dateIso;
  });
  return filtered.length ? filtered[filtered.length - 1].close : null;
}

function getMonthlyHolidayDates_(dateIso) {
  var monthKey = dateIso.slice(0, 7);
  var cacheKey = 'holidays:' + monthKey;
  var cached = loadCachedValue_(cacheKey);
  if (cached && Array.isArray(cached.days)) {
    return cached.days;
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    cached = loadCachedValue_(cacheKey);
    if (cached && Array.isArray(cached.days)) {
      return cached.days;
    }

    var holidayRecords = fetchHolidayRecords_(isoToBasic_(dateIso));
    var days = holidayRecords
      .map(function (item) {
        return {
          date: basicToIso_(item.bass_dt),
          isTradingDay: String(item.tr_day_yn || '').toUpperCase() === 'Y',
          isOpenDay: String(item.opnd_yn || '').toUpperCase() === 'Y'
        };
      })
      .filter(function (item) {
        return item.date && item.date.indexOf(monthKey) === 0 && (!item.isTradingDay || !item.isOpenDay);
      })
      .map(function (item) {
        return item.date;
      });

    var uniqueDays = uniqueStrings_(days).sort();
    saveCachedValue_(cacheKey, { days: uniqueDays }, STOCK_EQ_GATEWAY.holidayCacheHours);
    return uniqueDays;
  } finally {
    lock.releaseLock();
  }
}

function fetchHolidayRecords_(baseDateBasic) {
  var records = [];
  var params = {
    BASS_DT: baseDateBasic,
    CTX_AREA_FK: '',
    CTX_AREA_NK: ''
  };
  var trContHeader = '';

  for (var page = 0; page < 20; page += 1) {
    var response = callKisGetWithHeaders_(
      '/uapi/domestic-stock/v1/quotations/chk-holiday',
      'CTCA0903R',
      params,
      trContHeader ? { tr_cont: trContHeader } : {}
    );
    var json = response.json;
    var output = Array.isArray(json.output)
      ? json.output
      : (json.output ? [json.output] : []);

    records = records.concat(output);

    var headerMap = lowerCaseKeys_(response.headers || {});
    var nextFlag = String(headerMap.tr_cont || '').toUpperCase();
    var nextFk = String(json.ctx_area_fk || '');
    var nextNk = String(json.ctx_area_nk || '');
    if ((nextFlag !== 'M' && nextFlag !== 'F') || (!nextFk && !nextNk)) {
      break;
    }

    params.CTX_AREA_FK = nextFk;
    params.CTX_AREA_NK = nextNk;
    trContHeader = 'N';
    Utilities.sleep(120);
  }

  return records;
}

function callKisGet_(path, trId, params) {
  return callKisGetWithHeaders_(path, trId, params, {}).json;
}

function callKisGetWithHeaders_(path, trId, params, extraHeaders) {
  var token = getAccessToken_();
  var headers = {
    authorization: 'Bearer ' + token,
    appkey: getSetting_('KIS_APP_KEY', ''),
    appsecret: getSetting_('KIS_APP_SECRET', ''),
    tr_id: trId,
    custtype: 'P',
    charset: 'UTF-8'
  };

  assignOwnProperties_(headers, extraHeaders || {});
  var url = buildUrl_(getSetting_('KIS_BASE_URL', STOCK_EQ_GATEWAY.defaultBaseUrl) + path, params);
  var retryCount = Number(STOCK_EQ_GATEWAY.kisRetryCount || 0);
  var retryDelayMs = Number(STOCK_EQ_GATEWAY.kisRetryDelayMs || 0);
  var lastStatusCode = 502;
  var lastText = '';
  var lastJson = null;
  var refreshedToken = false;

  for (var attempt = 0; attempt <= retryCount; attempt += 1) {
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true,
      followRedirects: true
    });

    var statusCode = response.getResponseCode();
    var text = response.getContentText();
    var json = safeJsonParse_(text);
    lastStatusCode = statusCode;
    lastText = text;
    lastJson = json;

    if (statusCode < 400 && (!json || !json.rt_cd || String(json.rt_cd) === '0')) {
      return {
        json: json || {},
        headers: response.getHeaders(),
        statusCode: statusCode,
        text: text
      };
    }

    var errorStatus = statusCode >= 400 ? statusCode : 502;
    var errorMessage = extractKisErrorMessage_(json, text);
    if (!refreshedToken && isKisInvalidTokenMessage_(errorMessage)) {
      clearAccessTokenCache_();
      token = getAccessToken_();
      headers.authorization = 'Bearer ' + token;
      refreshedToken = true;
      continue;
    }
    if (attempt < retryCount && isKisRateLimitMessage_(errorMessage)) {
      Utilities.sleep(retryDelayMs * (attempt + 1));
      continue;
    }

    throw createHttpError_(errorStatus, errorMessage);
  }

  throw createHttpError_(lastStatusCode, extractKisErrorMessage_(lastJson, lastText));
}

function getAccessToken_() {
  var props = PropertiesService.getScriptProperties();
  var tokenCacheKey = getAccessTokenCacheKey_();
  var cachedText = props.getProperty(tokenCacheKey);
  if (cachedText) {
    var cached = safeJsonParse_(cachedText);
    if (cached && cached.accessToken && Number(cached.expiresAt || 0) > Date.now() + STOCK_EQ_GATEWAY.tokenSkewMs) {
      return cached.accessToken;
    }
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    cachedText = props.getProperty(tokenCacheKey);
    if (cachedText) {
      var freshCached = safeJsonParse_(cachedText);
      if (freshCached && freshCached.accessToken && Number(freshCached.expiresAt || 0) > Date.now() + STOCK_EQ_GATEWAY.tokenSkewMs) {
        return freshCached.accessToken;
      }
    }

    var appKey = getSetting_('KIS_APP_KEY', '');
    var appSecret = getSetting_('KIS_APP_SECRET', '');
    if (!appKey || !appSecret) {
      throw createHttpError_(500, 'Script Properties 에 KIS_APP_KEY 와 KIS_APP_SECRET 을 설정해 주세요.');
    }

    var response = UrlFetchApp.fetch(
      getSetting_('KIS_BASE_URL', STOCK_EQ_GATEWAY.defaultBaseUrl) + '/oauth2/tokenP',
      {
        method: 'post',
        contentType: 'application/json; charset=UTF-8',
        payload: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: appKey,
          appsecret: appSecret
        }),
        headers: {
          Accept: 'application/json'
        },
        muteHttpExceptions: true,
        followRedirects: true
      }
    );

    var statusCode = response.getResponseCode();
    var text = response.getContentText();
    var json = safeJsonParse_(text);
    if (statusCode >= 400 || !json || !json.access_token) {
      throw createHttpError_(statusCode || 500, extractKisErrorMessage_(json, text) || 'KIS access token 발급에 실패했습니다.');
    }

    var expiresInSeconds = Number(json.expires_in || 0);
    var expiresAt = Date.now() + ((expiresInSeconds > 0 ? expiresInSeconds : 3600) * 1000);
    props.setProperty(tokenCacheKey, JSON.stringify({
      accessToken: json.access_token,
      expiresAt: expiresAt
    }));

    return json.access_token;
  } finally {
    lock.releaseLock();
  }
}

function getAccessTokenCacheKey_() {
  var baseUrl = String(getSetting_('KIS_BASE_URL', STOCK_EQ_GATEWAY.defaultBaseUrl) || '').toLowerCase();
  var appKey = String(getSetting_('KIS_APP_KEY', '') || '');
  var appKeyTail = appKey.slice(Math.max(0, appKey.length - 8));
  var normalizedBase = baseUrl.replace(/[^a-z0-9]/g, '');
  return cacheKey_('token:' + normalizedBase + ':' + appKeyTail);
}

function clearAccessTokenCache_() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty(cacheKey_('token'));
  props.deleteProperty(getAccessTokenCacheKey_());
}

function resolvePreviousClose_(quote, price) {
  var currentPrice = isFiniteNumber_(price) ? price : toNumber_(quote.stck_prpr);
  var rate = toNumber_(quote.prdy_ctrt);
  if (isFiniteNumber_(currentPrice) && isFiniteNumber_(rate) && rate > -100) {
    return roundNumber_(currentPrice / (1 + (rate / 100)), 8);
  }

  var diff = toNumber_(quote.prdy_vrss);
  var sign = String(quote.prdy_vrss_sign || '').trim();
  if (isFiniteNumber_(currentPrice) && isFiniteNumber_(diff)) {
    if (sign === '2' || sign === '1') return currentPrice - diff;
    if (sign === '5' || sign === '4') return currentPrice + diff;
    if (sign === '3') return currentPrice;
  }

  var standardPrice = toNumber_(quote.stck_sdpr);
  if (isFiniteNumber_(standardPrice)) {
    return standardPrice;
  }

  return null;
}

function resolveIndexPreviousClose_(quote) {
  var currentPrice = toNumber_(quote.bstp_nmix_prpr);
  var rate = toNumber_(quote.bstp_nmix_prdy_ctrt);
  if (isFiniteNumber_(currentPrice) && isFiniteNumber_(rate) && rate > -100) {
    return roundNumber_(currentPrice / (1 + (rate / 100)), 8);
  }

  var diff = toNumber_(quote.bstp_nmix_prdy_vrss);
  var sign = String(quote.prdy_vrss_sign || '').trim();
  if (isFiniteNumber_(currentPrice) && isFiniteNumber_(diff)) {
    if (sign === '2' || sign === '1') return currentPrice - Math.abs(diff);
    if (sign === '5' || sign === '4') return currentPrice + Math.abs(diff);
    if (sign === '3') return currentPrice;
    return currentPrice - diff;
  }

  return null;
}

function resolveGatewaySession_(selectedDate, holidays) {
  var today = todayIsoKst_();
  if (selectedDate !== today) return 'historical';
  if (isWeekendIso_(selectedDate) || arrayContains_(holidays, selectedDate)) return 'holiday';

  var timeText = Utilities.formatDate(new Date(), STOCK_EQ_GATEWAY.timezone, 'HH:mm');
  var parts = timeText.split(':');
  var totalMinutes = (Number(parts[0]) * 60) + Number(parts[1]);
  if (totalMinutes < 9 * 60) return 'preopen';
  if (totalMinutes <= (15 * 60) + 30) return 'open';
  return 'closed';
}

function inferLastTradingDate_(selectedDate, monthStart, rows, holidays) {
  if (rows.length) {
    return rows[rows.length - 1].date;
  }

  var cursor = selectedDate;
  while (cursor >= monthStart) {
    if (!isWeekendIso_(cursor) && !arrayContains_(holidays, cursor)) {
      return cursor;
    }
    cursor = addDaysIso_(cursor, -1);
  }
  return selectedDate;
}

function previousBusinessDateIso_(dateIso, holidays) {
  var cursor = addDaysIso_(dateIso, -1);
  while (isWeekendIso_(cursor) || arrayContains_(holidays, cursor)) {
    cursor = addDaysIso_(cursor, -1);
  }
  return cursor;
}

function getBoundaryHolidayDates_(selectedDate) {
  var monthStart = startOfMonthIso_(selectedDate);
  var prevMonthDate = addDaysIso_(monthStart, -1);
  return uniqueStrings_(getMonthlyHolidayDates_(selectedDate).concat(getMonthlyHolidayDates_(prevMonthDate))).sort();
}

function resolveSeriesEndDate_(selectedDate, holidays) {
  var session = resolveGatewaySession_(selectedDate, holidays);
  if (session === 'preopen' || session === 'open' || session === 'holiday' || isWeekendIso_(selectedDate)) {
    return previousBusinessDateIso_(selectedDate, holidays);
  }
  return selectedDate;
}

function partitionMonthRows_(rows, monthStart) {
  var baseline = null;
  var monthRows = [];
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (row.date < monthStart) {
      baseline = row;
      continue;
    }
    monthRows.push(row);
  }
  return {
    baselineDate: baseline ? baseline.date : null,
    baselineClose: baseline ? baseline.close : null,
    rows: monthRows
  };
}

function normalizeSearchText_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^krx:/, '')
    .replace(/[\s\-_():./\\]/g, '');
}

function sanitizeStockCode_(value) {
  return String(value || '').toUpperCase().replace(/^KRX:/i, '').replace(/[^A-Z0-9]/g, '');
}

function dedupeByCode_(items) {
  var unique = [];
  var seen = {};
  for (var i = 0; i < items.length; i += 1) {
    if (seen[items[i].code]) continue;
    seen[items[i].code] = true;
    unique.push(items[i]);
  }
  return unique;
}

function uniqueStrings_(items) {
  var unique = [];
  var seen = {};
  for (var i = 0; i < items.length; i += 1) {
    var value = String(items[i] || '');
    if (!value || seen[value]) continue;
    seen[value] = true;
    unique.push(value);
  }
  return unique;
}

function compareArrays_(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  for (var i = 0; i < left.length; i += 1) {
    if (String(left[i] || '') !== String(right[i] || '')) {
      return false;
    }
  }
  return true;
}

function todayIsoKst_() {
  return Utilities.formatDate(new Date(), STOCK_EQ_GATEWAY.timezone, 'yyyy-MM-dd');
}

function coerceSheetDateToIso_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, PP_SHEET_GATEWAY.timezone, 'yyyy-MM-dd');
  }

  var text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  return '';
}

function buildSheetDate_(dateIso) {
  var parts = String(dateIso || '').split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function isKoreanRedDay_(dateIso) {
  if (!dateIso) return false;
  if (isWeekendIso_(dateIso)) return true;
  try {
    return Boolean(getKoreanHolidaySet_()[dateIso]);
  } catch (error) {
    console.warn('holiday calendar fallback', error);
    return false;
  }
}

function getKoreanHolidaySet_() {
  var cacheKey = 'kr-holiday-set';
  var cached = loadCachedValue_(cacheKey);
  if (cached && typeof cached === 'object') {
    return cached;
  }

  var response = UrlFetchApp.fetch(PP_SHEET_GATEWAY.holidayCalendarUrl, {
    muteHttpExceptions: true,
    followRedirects: true
  });
  if (response.getResponseCode() >= 400) {
    throw createHttpError_(502, '한국 공휴일 캘린더를 불러오지 못했습니다.');
  }

  var lines = response.getContentText().split(/\r?\n/);
  var holidaySet = {};
  for (var i = 0; i < lines.length; i += 1) {
    var line = String(lines[i] || '').trim();
    if (line.indexOf('DTSTART;VALUE=DATE:') === 0) {
      var iso = parseIcsDate_(line.slice('DTSTART;VALUE=DATE:'.length));
      if (iso) holidaySet[iso] = true;
    }
  }

  saveCachedValue_(cacheKey, holidaySet, STOCK_EQ_GATEWAY.holidayCacheHours);
  return holidaySet;
}

function parseIcsDate_(value) {
  var text = String(value || '').trim();
  if (!/^\d{8}$/.test(text)) return '';
  return text.slice(0, 4) + '-' + text.slice(4, 6) + '-' + text.slice(6, 8);
}

function formatHumanDate_(dateIso) {
  if (!dateIso) return '';
  return Utilities.formatDate(buildSheetDate_(dateIso), PP_SHEET_GATEWAY.timezone, 'yyyy.MM.dd');
}

function formatMonthDay_(dateIso) {
  if (!dateIso) return '';
  return Utilities.formatDate(buildSheetDate_(dateIso), PP_SHEET_GATEWAY.timezone, 'MM-dd');
}

function formatPercent_(value) {
  if (!isFiniteNumber_(value)) return '-';
  var sign = value > 0 ? '+' : '';
  return sign + (value * 100).toFixed(2) + '%';
}

function coerceIsoDate_(value) {
  var raw = String(value || '').trim();
  if (!raw) return todayIsoKst_();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{8}$/.test(raw)) return basicToIso_(raw);
  throw createHttpError_(400, 'date 형식은 YYYY-MM-DD 또는 YYYYMMDD 이어야 합니다.');
}

function isoToBasic_(value) {
  return String(value || '').replace(/-/g, '');
}

function basicToIso_(value) {
  var basic = String(value || '').replace(/[^0-9]/g, '');
  if (basic.length !== 8) return '';
  return basic.slice(0, 4) + '-' + basic.slice(4, 6) + '-' + basic.slice(6, 8);
}

function startOfMonthIso_(value) {
  return String(value || '').slice(0, 8) + '01';
}

function addDaysIso_(isoDate, offsetDays) {
  var date = new Date(isoDate + 'T00:00:00+09:00');
  date.setDate(date.getDate() + Number(offsetDays || 0));
  return Utilities.formatDate(date, STOCK_EQ_GATEWAY.timezone, 'yyyy-MM-dd');
}

function addMonthsIso_(isoDate, offsetMonths) {
  var date = new Date(isoDate + 'T00:00:00+09:00');
  var targetDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(offsetMonths || 0));

  var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(targetDay, lastDay));
  return Utilities.formatDate(date, STOCK_EQ_GATEWAY.timezone, 'yyyy-MM-dd');
}

function diffMonthsApprox_(startIsoDate, endIsoDate) {
  var start = new Date(String(startIsoDate || '') + 'T00:00:00+09:00');
  var end = new Date(String(endIsoDate || '') + 'T00:00:00+09:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return Number(STOCK_EQ_GATEWAY.recommendationHistoryMonths || 12);
  }

  var months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  if (end.getDate() >= start.getDate()) {
    months += 1;
  }
  return Math.max(1, months);
}

function isWeekendIso_(isoDate) {
  var date = new Date(isoDate + 'T00:00:00+09:00');
  var dayNumber = Number(Utilities.formatDate(date, STOCK_EQ_GATEWAY.timezone, 'u'));
  return dayNumber === 6 || dayNumber === 7;
}

function formatKstTimestamp_(date) {
  return Utilities.formatDate(date, STOCK_EQ_GATEWAY.timezone, "yyyy-MM-dd'T'HH:mm:ss+09:00");
}

function buildUrl_(baseUrl, params) {
  if (!params) return baseUrl;
  var pairs = [];
  var keys = Object.keys(params);
  for (var i = 0; i < keys.length; i += 1) {
    var key = keys[i];
    var value = params[key];
    if (value === undefined || value === null || value === '') continue;
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  }
  return pairs.length ? (baseUrl + '?' + pairs.join('&')) : baseUrl;
}

function getSetting_(key, fallbackValue) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  return value !== null && value !== '' ? value : fallbackValue;
}

function extractKisErrorMessage_(json, fallbackText) {
  if (json && json.msg1) return String(json.msg1);
  if (json && json.message) return String(json.message);
  return String(fallbackText || 'KIS API 호출 중 오류가 발생했습니다.');
}

function isKisRateLimitMessage_(message) {
  var text = String(message || '');
  return text.indexOf('초당 거래건수') >= 0 || text.indexOf('호출 유량') >= 0;
}

function isKisInvalidTokenMessage_(message) {
  var text = String(message || '');
  return text.indexOf('토큰이 존재하지') >= 0
    || text.indexOf('유효하지 않은 토큰') >= 0
    || text.indexOf('access token') >= 0
    || text.indexOf('기간이 만료된 토큰') >= 0;
}

function createHttpError_(status, message, code) {
  var error = new Error(message);
  error.status = status || 500;
  error.code = code || inferErrorCode_(status, message);
  return error;
}

function buildErrorResponse_(error) {
  var status = Number(error && error.status) || 500;
  var message = String((error && error.message) || error || '알 수 없는 오류가 발생했습니다.');
  return {
    ok: false,
    error: {
      status: status,
      code: String((error && error.code) || inferErrorCode_(status, message)),
      message: message
    }
  };
}

function inferErrorCode_(status, message) {
  var text = String(message || '');
  var normalizedStatus = Number(status || 0);

  if (text.indexOf('토큰') >= 0 || text.indexOf('access token') >= 0) return 'PP-KIS-TOKEN';
  if (text.indexOf('초당 거래건수') >= 0 || text.indexOf('호출 유량') >= 0) return 'PP-KIS-RATE-LIMIT';
  if (text.indexOf('월간표') >= 0 || text.indexOf('대시보드') >= 0) return 'PP-DASHBOARD-SPARSE';
  if (text.indexOf('ticker') >= 0 || text.indexOf('티커') >= 0) return 'PP-TICKER';
  if (normalizedStatus === 400) return 'PP-BAD-REQUEST';
  if (normalizedStatus === 401 || normalizedStatus === 403) return 'PP-AUTH';
  if (normalizedStatus === 404) return 'PP-NOT-FOUND';
  if (normalizedStatus >= 500) return 'PP-SERVER';
  return 'PP-UNKNOWN';
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function safeJsonParse_(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function toNumber_(value) {
  if (value === null || value === undefined || value === '') return null;
  var parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function isFiniteNumber_(value) {
  return typeof value === 'number' && isFinite(value);
}

function firstFiniteNumber_(values) {
  for (var i = 0; i < values.length; i += 1) {
    if (isFiniteNumber_(values[i])) return values[i];
  }
  return null;
}

function roundNumber_(value, digits) {
  if (!isFiniteNumber_(value)) return null;
  var factor = Math.pow(10, Number(digits || 0));
  return Math.round(value * factor) / factor;
}

function clampNumber_(value, min, max, fallbackValue) {
  var numeric = toNumber_(value);
  if (!isFiniteNumber_(numeric)) return fallbackValue;
  if (isFiniteNumber_(min) && numeric < min) return min;
  if (isFiniteNumber_(max) && numeric > max) return max;
  return numeric;
}

function lowerCaseKeys_(source) {
  var result = {};
  var keys = Object.keys(source || {});
  for (var i = 0; i < keys.length; i += 1) {
    result[String(keys[i]).toLowerCase()] = source[keys[i]];
  }
  return result;
}

function assignOwnProperties_(target, source) {
  var keys = Object.keys(source || {});
  for (var i = 0; i < keys.length; i += 1) {
    target[keys[i]] = source[keys[i]];
  }
  return target;
}

function arrayContains_(items, value) {
  if (!Array.isArray(items)) return false;
  for (var i = 0; i < items.length; i += 1) {
    if (items[i] === value) return true;
  }
  return false;
}

function cacheKey_(suffix) {
  return STOCK_EQ_GATEWAY.propertyPrefix + ':' + suffix;
}

function cacheMetaKey_(suffix) {
  return cacheKey_(suffix) + ':meta';
}

function cacheChunkKey_(suffix, index) {
  return cacheKey_(suffix) + ':chunk:' + index;
}

function loadCachedValue_(suffix) {
  var props = PropertiesService.getScriptProperties();
  var metaText = props.getProperty(cacheMetaKey_(suffix));
  if (!metaText) return null;

  var meta = safeJsonParse_(metaText);
  if (!meta || !Number(meta.chunks)) return null;
  if (meta.expiresAt && Number(meta.expiresAt) < Date.now()) {
    clearCachedValue_(suffix, meta.chunks);
    return null;
  }

  var joined = '';
  for (var i = 0; i < Number(meta.chunks); i += 1) {
    var part = props.getProperty(cacheChunkKey_(suffix, i));
    if (!part) return null;
    joined += part;
  }

  try {
    var bytes = Utilities.base64Decode(joined);
    var unzipped = Utilities.ungzip(Utilities.newBlob(bytes));
    return safeJsonParse_(unzipped.getDataAsString());
  } catch (error) {
    return null;
  }
}

function loadTransientCachedValue_(suffix) {
  var cachedText = CacheService.getScriptCache().get(cacheKey_(suffix));
  return safeJsonParse_(cachedText);
}

function saveTransientCachedValueSeconds_(suffix, value, ttlSeconds) {
  var normalizedTtlSeconds = Math.max(60, Math.min(21600, Math.round(Number(ttlSeconds || 60))));
  CacheService.getScriptCache().put(cacheKey_(suffix), JSON.stringify(value), normalizedTtlSeconds);
}

function saveTransientCachedValue_(suffix, value, ttlHours) {
  saveTransientCachedValueSeconds_(suffix, value, Number(ttlHours || 1) * 60 * 60);
}

function clearTransientCachedValue_(suffix) {
  CacheService.getScriptCache().remove(cacheKey_(suffix));
}

function saveCachedValue_(suffix, value, ttlHours) {
  var props = PropertiesService.getScriptProperties();
  var previousMeta = safeJsonParse_(props.getProperty(cacheMetaKey_(suffix)) || '{}');
  var payload = JSON.stringify(value);
  var compressed = Utilities.gzip(Utilities.newBlob(payload, 'application/json', suffix + '.json'));
  var encoded = Utilities.base64Encode(compressed.getBytes());
  var chunkSize = STOCK_EQ_GATEWAY.cacheChunkSize;
  var chunkCount = Math.max(1, Math.ceil(encoded.length / chunkSize));
  var writes = {};

  for (var i = 0; i < chunkCount; i += 1) {
    writes[cacheChunkKey_(suffix, i)] = encoded.slice(i * chunkSize, (i + 1) * chunkSize);
  }

  writes[cacheMetaKey_(suffix)] = JSON.stringify({
    chunks: chunkCount,
    expiresAt: ttlHours ? (Date.now() + (ttlHours * 60 * 60 * 1000)) : null
  });
  props.setProperties(writes, false);

  var previousChunks = Number(previousMeta && previousMeta.chunks) || 0;
  for (var j = chunkCount; j < previousChunks; j += 1) {
    props.deleteProperty(cacheChunkKey_(suffix, j));
  }
}

function clearCachedValue_(suffix, chunkCount) {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty(cacheMetaKey_(suffix));
  for (var i = 0; i < Number(chunkCount || 0); i += 1) {
    props.deleteProperty(cacheChunkKey_(suffix, i));
  }
}

function adminClearGatewayCache() {
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  var keys = Object.keys(allProps || {});
  var prefix = STOCK_EQ_GATEWAY.propertyPrefix + ':';
  var deleted = 0;

  for (var i = 0; i < keys.length; i += 1) {
    if (String(keys[i]).indexOf(prefix) !== 0) continue;
    props.deleteProperty(keys[i]);
    deleted += 1;
  }

  return {
    ok: true,
    deletedProperties: deleted
  };
}
