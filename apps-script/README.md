# PP Sheet Gateway

`pp-sheet-gateway.gs` 는 정적 프런트에서 구글 시트를 읽고 수정하기 위한 Apps Script 웹앱 소스입니다.

GET 액션:

- `action=health`
- `action=stock-catalog&market=ALL`
- `action=stock-search&q=삼성`
- `action=dashboard-data&date=2026-04-10`
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

배포 마무리:

1. `Deploy > New deployment`
2. `Web app`
3. `Execute as: Me`
4. `Who has access: Anyone`
5. 생성된 `/exec` URL을 프런트 `config.js`에 반영
