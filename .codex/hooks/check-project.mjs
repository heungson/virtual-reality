import { readFileSync } from 'node:fs';

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

  return { decision: 'block', reason: `${instruction}\n${preview}` };
}

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
console.log(JSON.stringify(stopDecision(input)));
