import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function readProjectDocument(name) {
  try {
    const document = readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8').trim();
    if (document) return document;
  } catch {
    // A read error makes this required document unavailable.
  }
  throw new Error(`${name} is missing, empty, or unreadable at the project root.`);
}

function stopDecision(input) {
  if (input.stop_hook_active !== false) return {};

  const instruction = 'Before finishing, read AGENTS.md and GOALS.md at the project root. Compare the result with the applicable rules and all three goal ranges. Record needed changes and report any unresolved check.';
  let preview;
  try {
    const rules = readProjectDocument('AGENTS.md');
    const goals = readProjectDocument('GOALS.md');
    const ruleHeadings = rules.split(/\r?\n/).filter((line) => /^## Rule \d+:/.test(line));
    const goalRows = goals.split(/\r?\n/).filter((line) => /^\|\s*(Short|Mid|Long) term\b/i.test(line));
    preview = ['Current rule headings and goal rows:', ...ruleHeadings, ...goalRows].join('\n').slice(0, 4000);
  } catch (error) {
    preview = `${error.message} Report any document you cannot review.`;
  }

  const validator = fileURLToPath(new URL('../../tools/verify-closeout.mjs', import.meta.url));
  const closeout = spawnSync(process.execPath, [validator, '--latest'], { encoding: 'utf8', timeout: 3000 });
  const gate = closeout.status === 0 ? '' : [
    'The latest work log did not pass the closeout gate.',
    (closeout.stderr || closeout.error?.message || '').trim().slice(0, 500),
    'If this turn ran a work session, correct and recheck its closeout before ending. Otherwise, report the gate failure and leave historical evidence unchanged.',
  ].join(' ');
  return { decision: 'block', reason: [instruction, gate, preview].filter(Boolean).join('\n') };
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
console.log(JSON.stringify(stopDecision(input)));
