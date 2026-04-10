var PP_SHEET_GATEWAY = {
  timezone: 'Asia/Seoul',
  propertyPrefix: 'pp_sheet_gateway_v1',
  spreadsheetId: '1_vwuRC2LhZvRCf3r6Ub1I3s-RoPxGm8bn5kiUI-m8ik',
  controlSheetName: '시트2',
  indexSheetName: '시트3',
  controlRangeA1: 'A2:I40',
  indexDateRangeA1: 'B3:B80',
  catalogCacheHours: 24,
  recalcAttempts: 10,
  recalcPauseMs: 900,
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

function doGet(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = String(params.action || 'health').trim();
    return jsonResponse_(routeAction_(action, params));
  } catch (error) {
    return jsonResponse_(buildErrorResponse_(error));
  }
}

function routeAction_(action, params) {
  switch (action) {
    case 'health':
      return handleHealth_();
    case 'stock-catalog':
      return handleStockCatalog_(params);
    case 'stock-search':
      return handleStockSearch_(params);
    case 'dashboard-data':
      return handleDashboardData_(params);
    case 'update-tickers':
      return handleUpdateTickers_(params);
    default:
      throw createHttpError_(400, '지원하지 않는 action 입니다: ' + action);
  }
}

function handleHealth_() {
  var spreadsheet = openSpreadsheet_();
  return {
    ok: true,
    service: 'pp-sheet-gateway',
    now: formatKstTimestamp_(new Date()),
    spreadsheetId: spreadsheet.getId(),
    spreadsheetTitle: spreadsheet.getName()
  };
}

function handleStockCatalog_(params) {
  var market = String(params.market || 'ALL').trim().toUpperCase();
  var catalog = getStockCatalog_();
  var items = catalog.filter(function (item) {
    return market === 'ALL' || String(item.market || '').toUpperCase() === market;
  });

  return {
    ok: true,
    market: market,
    items: items,
    source: 'krx-master'
  };
}

function handleStockSearch_(params) {
  var query = String(params.q || params.ticker || '').trim();
  return {
    ok: true,
    items: query ? searchStockCatalog_(query).slice(0, 20) : [],
    source: 'krx-master'
  };
}

function handleDashboardData_(params) {
  var context = openDashboardContext_();
  var currentDate = getSelectedDateIso_(context.controlSheet);
  var requestedDate = params.date ? coerceIsoDate_(params.date) : currentDate;

  if (requestedDate !== currentDate) {
    setSelectedDate_(context.controlSheet, requestedDate);
    waitForDashboardRefresh_(context, requestedDate, null);
  }

  return buildDashboardPayload_(context);
}

function handleUpdateTickers_(params) {
  var context = openDashboardContext_();
  var requestedDate = params.date ? coerceIsoDate_(params.date) : getSelectedDateIso_(context.controlSheet);
  var requestedCodes = parseTickerList_(params.tickers);
  var resolvedCodes = requestedCodes.map(function (item) {
    return resolveStock_(item).code;
  });

  setTickerCodes_(context.controlSheet, resolvedCodes);

  if (requestedDate !== getSelectedDateIso_(context.controlSheet)) {
    setSelectedDate_(context.controlSheet, requestedDate);
  }

  waitForDashboardRefresh_(context, requestedDate, resolvedCodes);
  return buildDashboardPayload_(context);
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
  if (!Array.isArray(codes) || codes.length !== 7) {
    throw createHttpError_(400, '티커는 정확히 7개여야 합니다.');
  }
  controlSheet.getRange('C2:I2').setValues([codes]);
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
    if (!includeRow && selectedDateIsToday && rowDateIso === selectedDate) {
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
    selectedDateIsTradingDay: Boolean(tradingSet[selectedDate]) || (selectedDateIsToday && rows.some(function (row) {
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

function buildSlotPayloads_(headerRow) {
  var slots = [
    {
      editable: false,
      code: 'KOSPI',
      name: '코스피',
      market: 'INDEX',
      total: 0
    }
  ];

  for (var columnIndex = 2; columnIndex < 9; columnIndex += 1) {
    var code = sanitizeStockCode_(headerRow[columnIndex]);
    var matched = code ? findStockByCode_(code) : null;
    slots.push({
      editable: true,
      code: code,
      name: matched ? matched.name : (code || '종목명 확인 필요'),
      market: matched ? matched.market : 'KRX',
      total: 0
    });
  }

  return slots;
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
  return controlSheet.getRange('C2:I2').getDisplayValues()[0].map(function (value) {
    return sanitizeStockCode_(value);
  });
}

function parseTickerList_(text) {
  var items = String(text || '')
    .split(',')
    .map(function (item) {
      return String(item || '').trim();
    })
    .filter(function (item) {
      return Boolean(item);
    });

  if (items.length !== 7) {
    throw createHttpError_(400, 'tickers 파라미터는 쉼표로 구분된 7개 값이어야 합니다.');
  }

  return items;
}

function resolveStock_(input) {
  var raw = String(input || '').trim();
  if (!raw) {
    throw createHttpError_(400, '티커 또는 종목명이 필요합니다.');
  }

  var exactCode = sanitizeStockCode_(raw);
  if (exactCode) {
    var direct = findStockByCode_(exactCode);
    if (direct) {
      return direct;
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
    saveCachedValue_(cacheKey, { items: items }, PP_SHEET_GATEWAY.catalogCacheHours);
    return items;
  } finally {
    lock.releaseLock();
  }
}

function buildStockCatalog_() {
  var allItems = [];
  var seen = {};

  for (var i = 0; i < PP_SHEET_GATEWAY.masterSources.length; i += 1) {
    var source = PP_SHEET_GATEWAY.masterSources[i];
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
    for (var itemIndex = 0; itemIndex < marketItems.length; itemIndex += 1) {
      var item = marketItems[itemIndex];
      if (seen[item.code]) continue;
      seen[item.code] = true;
      allItems.push(item);
    }
  }

  allItems.sort(function (left, right) {
    var byName = left.name.localeCompare(right.name);
    if (byName !== 0) return byName;
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
      // Try the next charset.
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

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildErrorResponse_(error) {
  var code = Number(error && error.statusCode ? error.statusCode : 500);
  return {
    ok: false,
    statusCode: code,
    message: extractErrorMessage_(error),
    now: formatKstTimestamp_(new Date())
  };
}

function createHttpError_(statusCode, message) {
  var error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function extractErrorMessage_(error) {
  if (!error) return '알 수 없는 오류가 발생했습니다.';
  if (error.message) return String(error.message);
  return String(error);
}

function getSetting_(key, fallbackValue) {
  var value = PropertiesService.getScriptProperties().getProperty(String(key || ''));
  if (value === null || value === undefined || value === '') {
    return fallbackValue;
  }
  return value;
}

function cacheKey_(key) {
  return PP_SHEET_GATEWAY.propertyPrefix + ':' + key;
}

function loadCachedValue_(key) {
  var text = PropertiesService.getScriptProperties().getProperty(cacheKey_(key));
  if (!text) return null;

  var parsed = safeJsonParse_(text);
  if (!parsed || Number(parsed.expiresAt || 0) < Date.now()) {
    PropertiesService.getScriptProperties().deleteProperty(cacheKey_(key));
    return null;
  }

  return parsed.value;
}

function saveCachedValue_(key, value, ttlHours) {
  PropertiesService.getScriptProperties().setProperty(
    cacheKey_(key),
    JSON.stringify({
      expiresAt: Date.now() + (Number(ttlHours || 1) * 60 * 60 * 1000),
      value: value
    })
  );
}

function safeJsonParse_(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
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

function uniqueStrings_(items) {
  var result = [];
  var seen = {};
  for (var i = 0; i < items.length; i += 1) {
    var value = String(items[i] || '').trim();
    if (!value || seen[value]) continue;
    seen[value] = true;
    result.push(value);
  }
  return result;
}

function dedupeByCode_(items) {
  var result = [];
  var seen = {};
  for (var i = 0; i < items.length; i += 1) {
    if (seen[items[i].code]) continue;
    seen[items[i].code] = true;
    result.push(items[i]);
  }
  return result;
}

function normalizeSearchText_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^krx:/, '')
    .replace(/[\s\-_():./\\]/g, '');
}

function sanitizeStockCode_(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/^KRX:/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

function coerceIsoDate_(value) {
  var text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw createHttpError_(400, '날짜는 YYYY-MM-DD 형식이어야 합니다.');
  }
  return text;
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
  var parts = dateIso.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function todayIsoKst_() {
  return Utilities.formatDate(new Date(), PP_SHEET_GATEWAY.timezone, 'yyyy-MM-dd');
}

function formatHumanDate_(dateIso) {
  if (!dateIso) return '';
  return Utilities.formatDate(buildSheetDate_(dateIso), PP_SHEET_GATEWAY.timezone, 'yyyy.MM.dd');
}

function formatMonthDay_(dateIso) {
  if (!dateIso) return '';
  return Utilities.formatDate(buildSheetDate_(dateIso), PP_SHEET_GATEWAY.timezone, 'MM-dd');
}

function formatKstTimestamp_(date) {
  return Utilities.formatDate(date, PP_SHEET_GATEWAY.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function toNumber_(value) {
  if (typeof value === 'number') return value;
  var text = String(value || '').replace(/,/g, '').replace(/%/g, '').trim();
  if (!text) return NaN;
  var numberValue = Number(text);
  return isFinite(numberValue) ? numberValue : NaN;
}

function isFiniteNumber_(value) {
  return typeof value === 'number' && isFinite(value);
}

function roundNumber_(value, digits) {
  if (!isFiniteNumber_(value)) return null;
  var multiplier = Math.pow(10, Number(digits || 0));
  return Math.round(value * multiplier) / multiplier;
}

function formatPercent_(value) {
  if (!isFiniteNumber_(value)) return '-';
  var sign = value > 0 ? '+' : '';
  return sign + (value * 100).toFixed(2) + '%';
}
