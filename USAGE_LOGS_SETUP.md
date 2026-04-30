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
- Equal-rate dashboard view/load events
- Recommendation page/run events
- Recommendation add events

Raw calculator prices and selected recommendation ticker codes are not stored.
