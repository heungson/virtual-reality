import {readFile, realpath} from 'node:fs/promises';
import {isAbsolute, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {applySceneEdits, createDefaultScene, importApproach, listAssets, validateScene} from './scene-model.mjs';

const [command, ...args] = process.argv.slice(2);
const usage = 'Use list, read [scene.json|-], import-approach <proposal.json|->, or apply <scene.json|-> <edits.json|->.';
const projectRoot = await realpath(fileURLToPath(new URL('../../', import.meta.url)));

function checkPath(root, target) {
  const fromRoot = relative(root, target);
  if (fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    throw new Error('Keep scene and edit files inside the project directory.');
  }
}

async function readJson(path) {
  let source;
  if (path === '-') {
    source = await readStdin();
  } else {
    const requestedPath = resolve(path);
    checkPath(fileURLToPath(new URL('../../', import.meta.url)), requestedPath);
    const target = await realpath(requestedPath);
    checkPath(projectRoot, target);
    source = await readFile(target, 'utf8');
  }
  return JSON.parse(source.replace(/^\uFEFF/, ''));
}

async function readStdin() {
  process.stdin.setEncoding('utf8');
  let source = '';
  for await (const chunk of process.stdin) source += chunk;
  return source;
}

async function execute() {
  if (command === 'list' && args.length === 0) return listAssets();
  if (command === 'read' && args.length <= 1) {
    return args.length === 0 ? createDefaultScene() : validateScene(await readJson(args[0]));
  }
  if (command === 'import-approach' && args.length === 1) return importApproach(await readJson(args[0]));
  if (command === 'apply' && args.length === 2 && !args.every(path => path === '-')) {
    return applySceneEdits(await readJson(args[0]), await readJson(args[1]));
  }
  throw new Error(usage);
}

try {
  const result = await execute();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
