import { defineTool } from '@copilotkit/runtime/v2';
import { z } from 'zod';
import { createConnection } from 'node:net';

type Probe = {
  name: string;
  host: string;
  port: number;
  reachable: boolean;
  latencyMs: number | null;
  detail?: string;
};

function tcpProbe(name: string, host: string, port: number, timeoutMs = 1500): Promise<Probe> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = createConnection({ host, port });
    let settled = false;

    const finish = (reachable: boolean, detail?: string) => {
      if (settled) return;
      settled = true;
      const latencyMs = reachable ? Date.now() - started : null;
      socket.destroy();
      resolve({ name, host, port, reachable, latencyMs, detail });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, 'timeout'));
    socket.once('error', (error) => finish(false, error.message));
  });
}

async function omniRouteHealth() {
  const url = 'http://127.0.0.1:20128/api/monitoring/health';
  const started = Date.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {}
    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - started,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      latencyMs: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function rhbSystemTools() {
  return [
    defineTool({
      name: 'rhb_system_health',
      description:
        'Read-only health check for the canonical RHB STUDIO local services: OmniRoute, OpenClaw and NEXO CORE. Use this before claiming a service is online or offline.',
      parameters: z.object({}),
      execute: async () => {
        const [omnirouteTcp, openclaw, nexo, omnirouteHttp] = await Promise.all([
          tcpProbe('OmniRoute', '127.0.0.1', 20128),
          tcpProbe('OpenClaw', '127.0.0.1', 18789),
          tcpProbe('NEXO CORE', '127.0.0.1', 20800),
          omniRouteHealth(),
        ]);
        return {
          checkedAt: new Date().toISOString(),
          services: [omnirouteTcp, openclaw, nexo],
          omniRouteHttp: omnirouteHttp,
          note:
            'TCP reachability proves only that a listener accepted a connection. NEXO CORE remains read-only and no write action is performed by this tool.',
        };
      },
    }),
  ];
}
