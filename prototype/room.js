'use strict';

const canvas = document.querySelector('#room');
const context = canvas.getContext('2d');
const status = document.querySelector('#status');
const pressed = new Set();
const table = { x: 0, z: 4.1, width: 1.8, depth: 0.85, top: 0.9 };
const stand = { x: 1.9, z: 4.4, width: 0.65, depth: 0.65, top: 0.8 };
const reach = 1.35;
const radius = 0.19;
const room = { left: -3.2, right: 3.2, front: 0, back: 6.4, height: 3.1 };
let player;
let cup;
let lastFrame;

function resetRoom() {
  player = { x: 0, z: 1.1, yaw: 0, pitch: -0.12 };
  cup = 'table';
  pressed.clear();
  status.textContent = 'The cup is on the table.';
}

function isBlocked(x, z) {
  if (x < room.left + radius || x > room.right - radius ||
      z < room.front + radius || z > room.back - radius) return true;
  return [table, stand].some((object) => (
    Math.abs(x - object.x) < object.width / 2 + radius &&
    Math.abs(z - object.z) < object.depth / 2 + radius
  ));
}

function move(seconds) {
  const forward = Number(pressed.has('KeyW')) - Number(pressed.has('KeyS'));
  const side = Number(pressed.has('KeyD')) - Number(pressed.has('KeyA'));
  const turn = Number(pressed.has('ArrowRight')) - Number(pressed.has('ArrowLeft'));
  const tilt = Number(pressed.has('ArrowUp')) - Number(pressed.has('ArrowDown'));
  look(turn * seconds * 1.9, tilt * seconds * 1.2);

  const step = seconds * 2.4 / Math.max(1, Math.hypot(forward, side));
  const x = player.x + step * (forward * Math.sin(player.yaw) + side * Math.cos(player.yaw));
  const z = player.z + step * (forward * Math.cos(player.yaw) - side * Math.sin(player.yaw));
  if (!isBlocked(x, player.z)) player.x = x;
  if (!isBlocked(player.x, z)) player.z = z;
}

function look(yaw, pitch) {
  player.yaw += yaw;
  player.pitch = Math.max(-1.1, Math.min(1.1, player.pitch + pitch));
}

function useObject() {
  if (cup === 'stand') return;
  const target = cup === 'table' ? table : stand;
  const targetName = cup === 'table' ? 'cup' : 'yellow stand';
  const x = target.x - player.x;
  const z = target.z - player.z;
  const distance = Math.hypot(x, z);
  if (distance > reach) {
    status.textContent = `Walk closer to the ${targetName}. Then press E again.`;
    return;
  }
  if (x * Math.sin(player.yaw) + z * Math.cos(player.yaw) < distance * 0.5) {
    status.textContent = `Turn to face the ${targetName}. Then press E again.`;
    return;
  }
  cup = cup === 'table' ? 'held' : 'stand';
  status.textContent = cup === 'held'
    ? 'You have the cup. Take it to the yellow stand.'
    : 'Task complete. The cup is on the yellow stand.';
}

function face(points, color) {
  return { points, color };
}

function box(x, y, z, width, height, depth, colors) {
  const left = x - width / 2;
  const right = x + width / 2;
  const front = z - depth / 2;
  const back = z + depth / 2;
  const top = y + height;
  return [
    face([[left, y, front], [right, y, front], [right, top, front], [left, top, front]], colors[0]),
    face([[right, y, back], [left, y, back], [left, top, back], [right, top, back]], colors[0]),
    face([[left, y, back], [left, y, front], [left, top, front], [left, top, back]], colors[1]),
    face([[right, y, front], [right, y, back], [right, top, back], [right, top, front]], colors[1]),
    face([[left, top, front], [right, top, front], [right, top, back], [left, top, back]], colors[2]),
  ];
}

function makeRoom() {
  const { left, right, front, back, height } = room;
  const surfaces = [
    face([[left, 0, front], [right, 0, front], [right, 0, back], [left, 0, back]], '#7c6556'),
    face([[left, height, front], [right, height, front], [right, height, back], [left, height, back]], '#d8d7c7'),
    face([[left, 0, back], [right, 0, back], [right, height, back], [left, height, back]], '#78908a'),
    face([[left, 0, front], [left, 0, back], [left, height, back], [left, height, front]], '#8fa39a'),
    face([[right, 0, back], [right, 0, front], [right, height, front], [right, height, back]], '#657e7b'),
    face([[right, 0, front], [left, 0, front], [left, height, front], [right, height, front]], '#819893'),
  ];
  for (let z = 0.4; z < back; z += 0.5) {
    surfaces.push(face([[left, 0.002, z], [right, 0.002, z], [right, 0.002, z + 0.012], [left, 0.002, z + 0.012]], '#6b574b'));
  }
  return surfaces;
}

function makeFurniture() {
  const objects = box(table.x, 0.8, table.z, table.width, 0.1, table.depth, ['#653d2b', '#82513a', '#bd875d']);
  for (const x of [-0.77, 0.77]) {
    for (const z of [-0.31, 0.31]) {
      objects.push(...box(table.x + x, 0, table.z + z, 0.11, 0.8, 0.11, ['#47352a', '#624638', '#795744']));
    }
  }
  objects.push(...box(stand.x, 0, stand.z, stand.width, stand.top, stand.depth, ['#9d742e', '#c49135', '#fbd36a']));
  return objects;
}

function makeCup(x, y, z) {
  const sides = 12;
  const ring = (height, size) => Array.from({ length: sides }, (_, index) => {
    const angle = index * Math.PI * 2 / sides;
    return [x + Math.cos(angle) * size, y + height, z + Math.sin(angle) * size];
  });
  const bottom = ring(0, 0.077);
  const top = ring(0.21, 0.105);
  const inner = ring(0.205, 0.081);
  const faces = [face(inner, '#803736')];
  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides;
    const shade = Math.round(165 + 65 * (1 + Math.sin(index / sides * Math.PI * 2)) / 2);
    faces.push(face([bottom[index], bottom[next], top[next], top[index]], `rgb(${shade} 76 71)`));
    faces.push(face([top[index], top[next], inner[next], inner[index]], '#f8b7a6'));
  }
  return faces;
}

function toView([x, y, z]) {
  const dx = x - player.x;
  const dy = y - 1.58;
  const dz = z - player.z;
  const sinYaw = Math.sin(player.yaw);
  const cosYaw = Math.cos(player.yaw);
  const forward = dz * cosYaw + dx * sinYaw;
  const sinPitch = Math.sin(player.pitch);
  const cosPitch = Math.cos(player.pitch);
  return [dx * cosYaw - dz * sinYaw, dy * cosPitch - forward * sinPitch, forward * cosPitch + dy * sinPitch];
}

function clipNear(points) {
  const near = 0.035;
  const clipped = [];
  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    const next = points[(index + 1) % points.length];
    if (point[2] >= near) clipped.push(point);
    if ((point[2] >= near) !== (next[2] >= near)) {
      const fraction = (near - point[2]) / (next[2] - point[2]);
      clipped.push([point[0] + (next[0] - point[0]) * fraction, point[1] + (next[1] - point[1]) * fraction, near]);
    }
  }
  return clipped;
}

function paint(faces, sort = false) {
  const prepared = faces.map(({ points, color }) => {
    const view = points.map(toView);
    const depth = view.reduce((sum, point) => sum + point[2], 0) / view.length;
    return { points: clipNear(view), depth, color };
  });
  if (sort) prepared.sort((left, right) => right.depth - left.depth);
  const focal = canvas.height * 0.91;
  for (const { points, color } of prepared) {
    if (points.length < 3) continue;
    context.beginPath();
    for (const [x, y, z] of points) {
      context.lineTo(canvas.width / 2 + x * focal / z, canvas.height / 2 - y * focal / z);
    }
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }
}

const surfaces = makeRoom();
const furniture = makeFurniture();

function frame(time) {
  const seconds = lastFrame === undefined ? 0 : Math.min(0.05, (time - lastFrame) / 1000);
  lastFrame = time;
  move(seconds);
  const width = Math.round(canvas.clientWidth * devicePixelRatio);
  const height = Math.round(canvas.clientHeight * devicePixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.fillStyle = '#a7b5ac';
  context.fillRect(0, 0, width, height);
  paint(surfaces);
  const support = cup === 'table' ? table : stand;
  paint(cup === 'held' ? furniture : [...furniture, ...makeCup(support.x, support.top, support.z)], true);
  if (cup === 'held') {
    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);
    paint(makeCup(player.x + 0.47 * sin + 0.18 * cos,
      1.58 + Math.tan(player.pitch) * 0.47 - 0.28, player.z + 0.47 * cos - 0.18 * sin), true);
  }
  context.fillStyle = '#fff';
  context.fillRect(width / 2 - 5, height / 2 - 1, 10, 2);
  context.fillRect(width / 2 - 1, height / 2 - 5, 2, 10);
  requestAnimationFrame(frame);
}

const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
canvas.addEventListener('keydown', (event) => {
  if (movementKeys.has(event.code)) {
    event.preventDefault();
    pressed.add(event.code);
  } else if (event.code === 'KeyE' && !event.repeat) {
    useObject();
  }
});
window.addEventListener('keyup', (event) => pressed.delete(event.code));
window.addEventListener('blur', () => pressed.clear());
canvas.addEventListener('blur', () => pressed.clear());
canvas.addEventListener('click', () => {
  canvas.focus();
  canvas.requestPointerLock?.()?.catch(() => {});
});
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === canvas) look(event.movementX * 0.0025, -event.movementY * 0.0025);
});
document.querySelector('#reset').addEventListener('click', resetRoom);
resetRoom();
requestAnimationFrame(frame);
