import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

async function readLimits() {
  const server = spawn('codex', ['app-server', '--listen', 'stdio://'], {
    stdio: ['pipe', 'pipe', 'ignore'],
    windowsHide: true,
  });
  const lines = createInterface({ input: server.stdout });

  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Codex did not reply within 20 seconds.')), 20_000);
      const finish = (callback, value) => {
        clearTimeout(timeout);
        callback(value);
      };
      const send = (message) => server.stdin.write(JSON.stringify(message) + '\n');
      server.on('error', () => finish(reject, new Error('Could not start Codex. Check that codex is on PATH.')));
      server.stdin.on('error', () => finish(reject, new Error('Could not send a request to Codex.')));
      lines.on('close', () => finish(reject, new Error('Codex closed before it returned usage limits.')));

      lines.on('line', (line) => {
        try {
          const reply = JSON.parse(line);
          if (reply.method || ![1, 2].includes(reply.id)) return;
          if (reply.error || !reply.result) {
            throw new Error(reply.id === 1
              ? 'Codex app-server could not initialize.'
              : 'Codex could not read account limits. Check that Codex CLI is signed in with ChatGPT.');
          }
          if (reply.id === 1) {
            send({ method: 'initialized' });
            send({ id: 2, method: 'account/rateLimits/read' });
          } else {
            finish(resolve, reply.result);
          }
        } catch (error) {
          finish(reject, error);
        }
      });

      send({
        id: 1,
        method: 'initialize',
        params: { clientInfo: { name: 'virtual-reality-limits', version: '1.0.0' } },
      });
    });
  } finally {
    lines.close();
    server.stdin.end();
    server.kill();
  }
}

try {
  const result = await readLimits();
  const buckets = Object.entries(result.rateLimitsByLimitId ?? {});
  if (!buckets.length && result.rateLimits) {
    buckets.push([result.rateLimits.limitId ?? 'codex', result.rateLimits]);
  }
  const windows = buckets.flatMap(([bucket, limits]) =>
    ['primary', 'secondary'].flatMap((name) => {
      const window = limits[name];
      if (!Number.isFinite(window?.usedPercent)) return [];
      return [{
        bucket,
        window: name,
        durationMinutes: window.windowDurationMins ?? null,
        usedPercent: window.usedPercent,
        remainingPercent: Math.max(0, 100 - window.usedPercent),
        resetsAtUtc: Number.isFinite(window.resetsAt)
          ? new Date(window.resetsAt * 1000).toISOString()
          : null,
      }];
    }),
  );
  if (!windows.length) throw new Error('Codex did not report any usage windows.');
  console.log(JSON.stringify({ windows }, null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
