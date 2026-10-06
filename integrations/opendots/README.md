# RHB STUDIO · OpenDots integration

This integration keeps OpenDots separate from the public GitHub Pages application.

## Architecture

- OpenDots UI/dev: http://127.0.0.1:5173
- OpenDots API/runtime: http://127.0.0.1:4310
- OpenDots computer supervisor: http://127.0.0.1:4312
- OmniRoute: http://127.0.0.1:20128
- OpenClaw: 127.0.0.1:18789
- NEXO CORE: 127.0.0.1:20800 (read-only integration layer)

OpenDots uses OmniRoute as its OpenAI-compatible model endpoint:

```
OPENAI_BASE_URL=http://127.0.0.1:20128/v1
```

CopilotKit Intelligence is still required by upstream OpenDots for Threads. On Windows, the official local Intelligence evaluation is not supported, so this integration expects the hosted Developer project initially. RHB/NEXO remains the long-term persistence and integration layer; CopilotKit Threads must not be treated as the master system of record.

## One-time install

From PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\integrations\opendots\INSTALL_RHB_OPENDOTS.ps1 -ConfigureIntelligence -StartAfterInstall
```

The CopilotKit login/project selection step opens a browser and requires interactive sign-in.

If you do not want to configure Intelligence during install:

```powershell
powershell -ExecutionPolicy Bypass -File .\integrations\opendots\INSTALL_RHB_OPENDOTS.ps1
```

Then, inside the OpenDots install directory:

```powershell
npx --yes copilotkit@latest login
npx --yes copilotkit@latest project select
```

## Start later

```powershell
powershell -ExecutionPolicy Bypass -File .\integrations\opendots\START_RHB_OPENDOTS.ps1
```

## Seed RHB/GAZA Spaces and Dots

```powershell
powershell -ExecutionPolicy Bypass -File .\integrations\opendots\SEED_RHB_DOTS.ps1
```

Seeded Spaces:

- RHB STUDIO
- GAZA Operations
- Engineering & CAD
- Research & Strategy
- System Operations

RHB patch enabled during install:

- read-only `rhb_system_health` tool available to Dots
- TCP verification of OmniRoute, OpenClaw and NEXO CORE
- HTTP verification of OmniRoute monitoring health
- `npm run typecheck` after patching; installation stops if the bridge is incompatible with the current OpenDots source

Seeded Dots:

- RHB CORE
- GAZA OPS
- CAD ENGINEER
- SYSTEMS OPS
- RESEARCH

The seed script is idempotent by name. It does not overwrite an existing Dot unless `-ForceUpdate` is supplied.

## Security

- Do not commit the OpenDots `.env`, CopilotKit project key, OmniRoute token, database or browser/computer secrets.
- Keep OpenDots bound to loopback until authentication/reverse proxy are explicitly designed.
- Keep telemetry disabled for the RHB local deployment unless intentionally changed.
- Computer shell permissions should only be enabled for Dots that need them.
