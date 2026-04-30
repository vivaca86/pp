# PP Usage Logs

Mobile log page:

```text
https://vivaca86.github.io/pp/logs.html
```

No password is required. This is intended for a personal app where only the owner knows the URL.

## Storage

Usage logs are stored in the existing Worker KV binding:

```text
PP_DASHBOARD_SNAPSHOT
```

Keys are prefixed with `usage:` so they do not conflict with the dashboard snapshot.

## What is logged

- Calculator view/input/reset events
- Calculator inputs store the filled card, high/low/spread, and Fibonacci level results when the card is calculable
- Equal-rate dashboard view/load/search events
- Equal-rate searches store searched stock names/codes and the selected-date equal-rate value when available
- Recommendation page/run events, run filters, and result count
- Recommendation add events store the target slot only

Logs are intentionally small and are sent in the background so normal calculator and dashboard interactions do not wait for logging.
