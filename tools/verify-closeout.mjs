import { readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const project = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const labels = [
  'Status', 'Window seconds', 'Elapsed seconds', 'Unused seconds', 'Agent count', 'Agent-minutes',
  'Time use', 'Team evidence', 'Coordinator evidence', 'Next experiment', 'Cleanup', 'Goal review',
];

function latestRecord() {
  const index = resolve(project, 'work-logs', 'README.md');
  const matches = [...readFileSync(index, 'utf8').matchAll(/^- Latest work record: \[[^\]]+\]\(([^)]+)\)\.?\s*$/gm)];
  if (matches.length !== 1) throw new Error('The work log index must link to one latest work record.');
  return resolve(dirname(index), matches[0][1]);
}

function verify(file) {
  const path = realpathSync(file);
  const location = relative(project, path);
  if (!location || location === '..' || location.startsWith(`..${sep}`) || isAbsolute(location)) {
    throw new Error('Use a work log inside the project directory.');
  }
  verifyText(readFileSync(path, 'utf8'));
}

function verifyText(text) {
  const lines = text.split(/\r?\n/);
  const values = new Map();
  for (const label of labels) {
    const prefix = `- ${label}:`;
    const matches = lines.filter((line) => line.startsWith(prefix));
    if (matches.length !== 1 || !matches[0].slice(prefix.length).trim()) {
      throw new Error(`Specify "${label}" once with a value.`);
    }
    values.set(label, matches[0].slice(prefix.length).trim());
  }
  if (values.get('Status') !== 'complete') throw new Error('Status must be complete.');
  if (values.get('Time use').split(/\s+/).length < 5) {
    throw new Error('Time use must describe the session results and the use of time.');
  }
  function whole(label, minimum) {
    const value = values.get(label);
    const number = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < minimum) {
      throw new Error(`"${label}" must be a whole number of at least ${minimum}.`);
    }
    return number;
  }
  const window = whole('Window seconds', 1);
  const elapsed = whole('Elapsed seconds', 0);
  const unused = whole('Unused seconds', 0);
  const agents = whole('Agent count', 1);
  if (elapsed > window || unused !== window - elapsed) {
    throw new Error('Elapsed seconds plus unused seconds must equal window seconds.');
  }
  const agentMinutes = (elapsed * agents / 60).toFixed(2);
  if (!/^\d+(\.\d{1,2})?$/.test(values.get('Agent-minutes')) ||
      Number(values.get('Agent-minutes')) !== Number(agentMinutes)) {
    throw new Error(`Agent-minutes must equal ${agentMinutes}.`);
  }
}

function verifyStaged() {
  const git = (args) => execFileSync('git', args, { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const paths = git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMRT', '--', 'work-logs/']).split('\0');
  const completed = /^- Status: complete\r?$/m;
  for (const path of paths) {
    if (!/^work-logs\/\d{4}-\d{2}\/\d{4}-\d{2}-\d{2}-[^/]+\.md$/.test(path)) continue;
    const staged = git(['show', `:${path}`]);
    if (!completed.test(staged)) continue;
    let previous = '';
    try {
      previous = git(['show', `HEAD:${path}`]);
    } catch {
      // A newly added record has no previous version.
    }
    if (completed.test(previous) && !/^- Window seconds:/m.test(previous)) continue;
    try {
      verifyText(staged);
    } catch (error) {
      throw new Error(`${path}: ${error.message}`);
    }
  }
}

try {
  if (process.argv.length !== 3) throw new Error('Usage: node tools/verify-closeout.mjs <work-log.md|--latest|--staged>');
  if (process.argv[2] === '--staged') verifyStaged();
  else verify(process.argv[2] === '--latest' ? latestRecord() : process.argv[2]);
  console.log('Closeout structure and arithmetic passed. Review prose and evidence separately.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
