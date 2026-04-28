# PP Sheet Gateway

`pp-sheet-gateway.gs` 는 정적 프런트에서 구글 시트를 읽고 수정하기 위한 Apps Script 웹앱 소스입니다.

GET 액션:

- `action=health`
- `action=stock-catalog&market=ALL`
- `action=stock-search&q=삼성`
- `action=dashboard-data&date=2026-04-10`
- `action=dashboard-snapshot-status&date=2026-04-10`
- `action=dashboard-snapshot-refresh&date=2026-04-10`
- `action=update-tickers&tickers=005930,000660,...&date=2026-04-10`
- `action=fibonacci-warmup&date=2026-04-10&universe=KOSPI200&periodMonths=6&level=0.382&mode=near&lookbackDays=1&tolerance=0.01`
- `action=fibonacci-recommendations&date=2026-04-10&universe=ALL&periodMonths=6&level=0.382&mode=near&lookbackDays=1&tolerance=0.01`

주요 역할:

- `시트2!A3` 기준일을 바꾸고 결과를 읽습니다.
- `시트2!D2:I2` 티커를 갱신합니다.
- `시트2!B:C`를 `코스피 / 코스닥` 고정 기준 열로 유지합니다.
- `시트3` 실제 거래일을 기준으로 휴장일과 주말을 제거합니다.
- KRX 마스터 파일로 종목명을 해석합니다.
- KIS 시세 데이터로 피보나치 추천 후보를 계산합니다.

기존 운영 웹앱에 자동 배포:

```powershell
powershell -ExecutionPolicy Bypass -File ..\deploy-backend.ps1 -Description "Update pp sheet gateway"
```

이 스크립트는 `config.js`의 현재 `/exec` URL에서 deployment ID를 읽어 기존 웹앱 URL을 유지한 채 새 버전으로 배포합니다.

처음 프로젝트를 만들 때만 수동 배포 마무리:

1. `Deploy > New deployment`
2. `Web app`
3. `Execute as: Me`
4. `Who has access: Anyone`
5. 생성된 `/exec` URL을 프런트 `config.js`에 반영

스냅샷 트리거:

- 배포 후 Apps Script 편집기에서 `installDashboardSnapshotTrigger()`를 한 번 실행하면 장중 1분 간격으로 현재 월간표 스냅샷을 미리 저장합니다.
- 즉시 스냅샷을 갱신하려면 `refreshDashboardSnapshot()`을 실행합니다.
- 트리거를 제거하려면 `removeDashboardSnapshotTrigger()`을 실행합니다.
- 웹앱에서 `action=dashboard-snapshot-status`로 현재 스냅샷 상태를 확인할 수 있습니다.
- 웹앱에서 `action=dashboard-snapshot-refresh`로 쿨다운이 적용된 수동 스냅샷 갱신을 요청할 수 있습니다.

정적 스냅샷 배포:

- `.github/workflows/dashboard-snapshot.yml`이 주기적으로 `dashboard-data`를 호출합니다.
- 결과는 GitHub Pages 루트의 `dashboard-latest.json`으로 커밋됩니다.
- 프런트는 `config.js`의 `dashboardSnapshotUrl`을 먼저 읽고, 실패하면 이 Apps Script 웹앱으로 fallback합니다.
