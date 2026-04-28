# PP Dashboard

- Start here first on the next PC: [`00_DEPLOY_APPS_SCRIPT_FIRST.md`](./00_DEPLOY_APPS_SCRIPT_FIRST.md)

- Next work queue for future Codex sessions: [`NEXT_WORK.md`](./NEXT_WORK.md)
- Quick guide: `C:\Users\vivac\OneDrive\문서\aa\pp\QUICK_GUIDE.md`

구글 시트 `주식`을 반응형 웹 대시보드로 보여주는 프로젝트입니다.

대시보드는 GitHub Pages의 `dashboard-latest.json` 정적 스냅샷을 먼저 읽고, 없거나 날짜가 맞지 않을 때 Apps Script 게이트웨이로 fallback합니다.

핵심 동작:

- `시트2!A3`를 기준일로 사용합니다.
- `시트2!D2:I2` 티커를 웹에서 수정하면 시트에도 반영됩니다.
- `시트2!B:C`는 각각 `코스피`, `코스닥` 고정 기준 열로 사용합니다.
- 카드 상단에는 티커를 종목명으로 변환해서 보여줍니다.
- 카드 하단에는 월 첫 거래일부터 마지막 거래일까지의 등가률 합계와 시장 배지를 보여줍니다.
- 표에는 `시트3`의 실제 거래일만 남겨서 주말과 휴장일을 제거합니다.
- 추천 화면에서는 `KOSPI200 / KOSDAQ150 / ALL` 대상 피보나치 추천을 실행합니다.

## 파일 구성

- `index.html`: 대시보드 마크업
- `styles.css`: 반응형 UI 스타일
- `app.js`: 프런트 로직
- `config.js`: Apps Script 게이트웨이 URL
- `apps-script/pp-sheet-gateway.gs`: 시트 읽기/쓰기 + 종목명 변환 + 피보나치 추천 백엔드

## Apps Script 준비

루트에서 아래 명령을 실행하면 Apps Script 프로젝트를 만들고 코드를 올립니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-backend.ps1
```

그 다음 Apps Script 편집기에서 아래 순서로 한 번만 마무리하면 됩니다.

1. `Deploy > New deployment`
2. 유형을 `Web app` 으로 선택
3. `Execute as`: `Me`
4. `Who has access`: `Anyone`
5. 발급된 `/exec` URL을 `config.js`의 `gatewayUrl`에 넣기

추가로 첫 실행 때 권한 승인도 한 번 필요합니다.
