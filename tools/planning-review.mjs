import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const limit = 1000;

export function planningReview(project = root) {
  const goals = readFileSync(join(project, 'GOALS.md'), 'utf8');
  const thresholds = [...goals.matchAll(/^- Next planning review: (\d+) completed sessions\.\r?$/gm)];
  const threshold = Number(thresholds[0]?.[1]);
  if (thresholds.length !== 1 || !Number.isInteger(threshold) || threshold < 1 || threshold > limit) {
    throw new Error('Set one next planning review threshold in GOALS.md, from 1 to 1000 completed sessions.');
  }

  const logs = join(project, 'work-logs');
  let completed = 0;
  let started = 0;
  for (const month of readdirSync(logs, { withFileTypes: true })) {
    if (!month.isDirectory() || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month.name)) continue;
    for (const record of readdirSync(join(logs, month.name), { withFileTypes: true })) {
      if (!record.isFile() || !record.name.startsWith(`${month.name}-`) ||
          !/^\d{4}-\d{2}-\d{2}-.+\.md$/.test(record.name)) continue;
      started++;
      const text = readFileSync(join(logs, month.name, record.name), 'utf8');
      const statuses = [...text.matchAll(/^- Status: (.+?)\r?$/gm)];
      if (statuses.length === 1 && statuses[0][1].trim() === 'complete') completed++;
    }
  }

  return { started, completed, threshold, due: completed >= threshold, remaining: Math.max(0, limit - started) };
}
