# GAZA Integration Gateway

Server-side read-only boundary for future authorised Leche Gaza integrations.

## Current state
Skeleton only. It does **not** connect to Solmicro, GAZACONTROL, INTERGAZA, Tetra Pak, StorFast, Veolia, DelPro or any private Gaza system.

## Run
Requires Node 22+.

```powershell
cd services/gaza-integration-gateway
node .\server.mjs
```

Default: `http://127.0.0.1:20840`.

Endpoints:
- `GET /health`
- `GET /v1/adapters`
- `GET /v1/schema`
- `GET /v1/snapshot`
- `GET /v1/events?limit=100`
- `GET /v1/stream` — Server-Sent Events heartbeat/snapshot stream.
- All POST/PUT/PATCH/DELETE requests return 405.

## Security boundary
- No PLC/DB/API credentials in browser or repository.
- Bind to loopback by default.
- Writes are disabled in code.
- Real adapters must use least-privilege read accounts and network segmentation/DMZ rules.
- Every event carries source, source_class, observed_at, quality and payload.
- `REAL_AUTHORIZED` must never be fabricated from demo/public values.

See `apps/gaza/data/integration-adapters.json`.


## AEMET official weather bridge

The gateway can proxy AEMET OpenData without exposing credentials to GitHub Pages.

Environment variables:

- `AEMET_API_KEY` — required for upstream AEMET OpenData calls.
- `AEMET_MUNICIPALITY` — defaults to `49053` (Coreses).
- `AEMET_STATION` — defaults to `2565` (Coreses observation station).
- `AEMET_WARNING_AREA` — optional; leave unset until the CAP warning-area code has been verified.

Read-only endpoints:

- `GET /v1/weather/aemet/status`
- `GET /v1/weather/aemet/forecast`
- `GET /v1/weather/aemet/observation`
- `GET /v1/weather/aemet/warnings`

No endpoint exposes `AEMET_API_KEY`. Forecast/observation responses are classified as official public reference data, but they are still not on-site instrumentation and must not drive safety interlocks.
