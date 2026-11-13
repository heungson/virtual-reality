import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as wait } from 'node:timers/promises';

const root = resolve(import.meta.dirname, '..');
const profile = await mkdtemp(join(root, '.git', 'cup-test-'));
const edge = process.env.CUP_TEST_EDGE ??
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = spawn(edge, [
  '--headless=new', '--remote-debugging-port=0', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking',
  '--disable-component-update', '--disable-crash-reporter',
  `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });
let spawnError;
browser.on('error', (error) => { spawnError = error; });
let socket;

try {
  const portPath = join(profile, 'DevToolsActivePort');
  let port;
  for (let attempt = 0; attempt < 80 && !port; attempt += 1) {
    if (spawnError) throw spawnError;
    try {
      port = (await readFile(portPath, 'utf8')).split(/\r?\n/)[0];
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await wait(100);
    }
  }
  assert(port, 'Edge debugging port is ready');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, {
    signal: AbortSignal.timeout(5000),
  })).json();
  socket = new WebSocket(targets.find(({ type }) => type === 'page').webSocketDebuggerUrl);
  await new Promise((ready, reject) => {
    const timer = setTimeout(() => reject(new Error('Debugger connection timed out')), 5000);
    socket.addEventListener('open', () => { clearTimeout(timer); ready(); }, { once: true });
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Debugger connection failed')); }, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const reply = JSON.parse(data);
    const complete = pending.get(reply.id);
    if (complete) complete(reply);
  });

  function request(method, params = {}) {
    return new Promise((ready, reject) => {
      const id = ++nextId;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 5000);
      pending.set(id, (reply) => {
        clearTimeout(timer);
        pending.delete(id);
        if (reply.error) reject(new Error(reply.error.message));
        else ready(reply.result);
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const result = await request('Runtime.evaluate', { expression, returnByValue: true });
    assert(!result.exceptionDetails, result.exceptionDetails?.exception?.description);
    return result.result.value;
  }

  async function expectStatus(expected) {
    const actual = await evaluate('document.querySelector("#status").textContent');
    assert.match(actual, expected);
  }

  async function pressSpecial(code, windowsVirtualKeyCode) {
    const key = { code, key: code, windowsVirtualKeyCode, nativeVirtualKeyCode: windowsVirtualKeyCode };
    await request('Input.dispatchKeyEvent', {
      type: 'keyDown', ...key, ...(code === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}),
    });
    await request('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
  }

  async function press(letter) {
    const code = `Key${letter}`;
    const key = letter.toLowerCase();
    const windowsVirtualKeyCode = letter.charCodeAt(0);
    await request('Input.dispatchKeyEvent', { type: 'keyDown', code, key, windowsVirtualKeyCode });
    await request('Input.dispatchKeyEvent', { type: 'keyUp', code, key, windowsVirtualKeyCode });
  }

  async function pose(x, z, yaw = 0) {
    // Position deterministically. Test the actual interaction key path.
    await evaluate(`Object.assign(player, { x: ${x}, z: ${z}, yaw: ${yaw} }); document.querySelector('#room').focus();`);
  }

  async function walkUntil(condition, letter = 'W') {
    const key = { code: `Key${letter}`, key: letter.toLowerCase(), windowsVirtualKeyCode: letter.charCodeAt(0) };
    await request('Input.dispatchKeyEvent', { type: 'keyDown', ...key });
    try {
      for (let attempt = 0; attempt < 75; attempt += 1) {
        if (await evaluate(condition)) return;
        await wait(50);
      }
      assert.fail(`Walking did not reach the expected position: ${condition}`);
    } finally {
      await request('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
    }
  }

  async function walkAgainstWall() {
    await request('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w', windowsVirtualKeyCode: 87 });
    try {
      await wait(450);
      assert(await evaluate('player.z < 6.4'), 'Divider blocks walking outside doorway');
    } finally {
      await request('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w', windowsVirtualKeyCode: 87 });
    }
  }

  async function reset() {
    await evaluate('document.querySelector("#reset").click();');
    await expectStatus(/cup is on the table/i);
    await pose(0, 3.1);
  }

  await request('Page.navigate', { url: pathToFileURL(join(root, 'prototype', 'index.html')).href });
  let loaded;
  for (let attempt = 0; attempt < 40 && !loaded; attempt += 1) {
    loaded = await evaluate('typeof player !== "undefined" && !!player');
    if (!loaded) await wait(100);
  }
  assert(loaded, 'Cup Room loaded');

  if (process.argv.includes('--journey')) {
    await pressSpecial('Tab', 9);
    assert(await evaluate('document.activeElement.id === "room"'), 'Tab focuses the room');
    await walkUntil('player.z >= 3.15');
    await press('E');
    await expectStatus(/you have the cup/i);
    await walkUntil('player.x >= 1.9', 'D');
    await press('E');
    await expectStatus(/task complete.*yellow stand/i);
    await press('E');
    await expectStatus(/you have the cup/i);
    await walkUntil('player.x <= -1.25', 'A');
    await walkUntil('player.z >= 5.2');
    await walkUntil('player.x >= -0.05', 'D');
    await walkUntil('player.z >= 8.2');
    await walkUntil('player.x <= -1.6', 'A');
    await walkUntil('player.z >= 9.1');
    let close;
    for (let attempt = 0; attempt < 75 && !close; attempt += 1) {
      close = await evaluate('resident.z - player.z < 1.2');
      if (!close) await wait(100);
    }
    assert(close, 'Resident entered interaction range');
    await press('F');
    await expectStatus(/hello.*wait here briefly/i);
    assert(await evaluate('!document.querySelector("#task-completion").hidden'), 'Completion survives resident status');
    await pressSpecial('Tab', 9);
    assert(await evaluate('document.activeElement.id === "reset"'), 'Tab focuses Reset');
    await pressSpecial('Enter', 13);
    await expectStatus(/cup is on the table/i);
    assert(await evaluate('Math.abs(player.z - 1.1) < 0.01'), 'Keyboard Reset restores spawn');
    assert(await evaluate('document.querySelector("#task-completion").hidden'), 'Reset clears completion');
    console.log('PASS: full journey by keyboard from initial spawn, with no state writes');
  } else {
  const surfaces = [
    { label: 'table', x: 0, z: 3.1, result: /on the table/i },
    { label: 'stand', x: 1.9, z: 3.4, result: /on the yellow stand/i },
    { label: 'floor', x: 0, z: 2, result: /on the floor/i },
  ];
  for (const { label, x, z, result } of surfaces) {
    await reset();
    await press('E');
    await expectStatus(/you have the cup/i);
    await pose(-2, 6);
    await walkAgainstWall();
    await pose(x, z);
    await press('R');
    await expectStatus(result);
    await pose(-2.5, 1.1);
    await press('E');
    await expectStatus(/walk closer/i);
    await pose(x, z);
    await press('E');
    await expectStatus(/you have the cup/i);
    console.log(`PASS: release, persistence, and pickup on ${label}`);
  }

  await reset();
  await press('E');
  await pose(1.9, 3.4);
  await press('E');
  await expectStatus(/task complete.*yellow stand/i);
  await reset();
  console.log('PASS: original cup task and Reset');
  if (process.argv.includes('--connected') || process.argv.includes('--resident')) {
    await press('E');
    await expectStatus(/you have the cup/i);
    await pose(0, 6);
    await walkUntil('player.z > 6.8');
    await pose(1.5, 8.7);
    await press('R');
    await expectStatus(/on the counter/i);
    await pose(0, 6.8, Math.PI);
    await walkUntil('player.z < 6');
    await pose(0, 6);
    await walkUntil('player.z > 6.8');
    await pose(1.5, 8.7);
    await press('E');
    await expectStatus(/you have the cup/i);
    await pose(0, 8);
    await press('R');
    await expectStatus(/on the floor/i);
    await press('E');
    await expectStatus(/you have the cup/i);
    await evaluate('document.querySelector("#reset").click()');
    assert(await evaluate('Math.abs(player.z - 1.1) < 0.01'), 'Reset returns player to the first room');
    await reset();
    console.log('PASS: doorway crossing, carrying, counter persistence, second-room floor pickup, and Reset');
  }
  if (process.argv.includes('--resident')) {
    const before = await evaluate('resident.z');
    await wait(500);
    assert(Math.abs((await evaluate('resident.z')) - before) > 0.1, 'Resident walks without input');
    await press('F');
    await expectStatus(/walk closer to the resident/i);
    await pose(-1.6, (await evaluate('resident.z')) - 0.7);
    await press('F');
    await expectStatus(/hello.*wait here briefly/i);
    const pausedAt = await evaluate('resident.z');
    await wait(400);
    assert(Math.abs((await evaluate('resident.z')) - pausedAt) < 0.01, 'Resident waits after interaction');
    let resumed;
    for (let attempt = 0; attempt < 45 && !resumed; attempt += 1) {
      resumed = Math.abs((await evaluate('resident.z')) - pausedAt) > 0.05;
      if (!resumed) await wait(100);
    }
    assert(resumed, 'Resident resumes the routine');
    const resetState = await evaluate(`document.querySelector('#reset').click();
      ({ position: resident.z, pause: resident.pausedSeconds })`);
    assert.equal(resetState.position, 9.4, 'Reset restores resident start position');
    assert.equal(resetState.pause, 0, 'Reset clears resident pause');
    console.log('PASS: resident routine, distant denial, nearby interruption, resume, and Reset');
  }
  await request('Emulation.setDeviceMetricsOverride', {
    width: 800, height: 480, deviceScaleFactor: 1, mobile: false,
  });
  await pose(0, 1.1);
  await press('E');
  await expectStatus(/walk closer/i);
  assert(await evaluate(`['#status', '#reset'].every((selector) => {
    const box = document.querySelector(selector).getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  })`), 'Recovery cue and Reset fit 800 × 480');
  console.log('PASS: recovery cue and Reset fit 800 × 480');
  }
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: 2147483647, method: 'Browser.close' }));
  socket?.close();
  for (let attempt = 0; attempt < 30 && browser.exitCode === null && browser.signalCode === null && !spawnError; attempt += 1) {
    if (attempt === 10) {
      const kill = spawn('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      kill.on('error', () => browser.kill());
    }
    await wait(100);
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 150 });
  assert(browser.exitCode !== null || browser.signalCode !== null || spawnError, 'Test Edge exited');
  console.log('PASS: test Edge exited and profile removed');
}
