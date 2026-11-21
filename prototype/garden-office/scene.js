'use strict';

import {drawArch} from './assets/arch.mjs';
import {drawChair, drawTable, furnitureContains} from './assets/furniture.mjs';
import {drawJoseonRoof, joseonRoofContains} from './assets/joseon-roof.mjs';
import {drawLanding} from './assets/landing.mjs';
import {drawLamp, lampCenter} from './assets/lamp.mjs';
import {drawBoardwalk, drawPavilionRoof, drawPond, drawStonePaving} from './assets/pavilion.mjs';
import {drawStair, stairProfile} from './assets/stair.mjs';
import {attachLayoutEditor} from './editor.mjs';
import {createDefaultScene, getLayout} from './scene-model.mjs';
import {createDepthRaster, linearDepthFill} from './depth-raster.mjs';
import {createWebGlDepthRaster} from './webgl-depth-raster.mjs';
import {sweepAvatar} from './collision.mjs';

const canvas = document.querySelector('#scene');
const status = document.querySelector('#progress');
const gpuButton = document.querySelector('#toggle-gpu');
const rendererStatus = document.querySelector('#renderer-status');
const stopControls = document.querySelector('#walk-stops');
const paint = canvas.getContext('2d');
const background = document.createElement('canvas');
background.width = canvas.width;
background.height = canvas.height;
const art = background.getContext('2d');
const cpuDepthRaster = createDepthRaster(art);
let gpuDepthRaster = null;
let depthRaster = cpuDepthRaster;
const drawers = {arch:drawArch, landing:drawLanding, lamp:drawLamp, stair:drawStair,
  'joseon-roof':drawJoseonRoof, table:drawTable, chair:drawChair, wall:drawWall,
  pond:drawPond, boardwalk:drawBoardwalk, 'pavilion-roof':drawPavilionRoof, 'stone-paving':drawStonePaving,
  'light-cue':drawLightCue, tree:drawTree};
const initialScene = createDefaultScene();
const stockIds = new Set(initialScene.instances.map(instance => instance.id));
let approach = null;
let lighting = null;

function project(x, y, height) {
  if (approach) {
    const {scale, transform} = approach;
    if (transform) {
      const {xx, xy, yx, yy, yz} = transform;
      return [approach.x + (xx * x + xy * y) * scale,
        approach.y + (yx * x + yy * y - yz * height) * scale];
    }
    return [approach.x + (x - y) * scale, approach.y + (.52 * (x + y) - 1.14 * height) * scale];
  }
  return [240 + x - .57 * y, 272 + .27 * x + .34 * y - height];
}

function polygon(points, fill) {
  art.beginPath();
  points.forEach(([x, y], index) => index ? art.lineTo(x, y) : art.moveTo(x, y));
  art.closePath();
  art.fillStyle = fill;
  art.fill();
}

function shade(points, fill, sideNormal) {
  if (!lighting || (typeof fill === 'string' && fill.length !== 7)) return fill;
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay, az] = points[i];
    const [bx, by, bz] = points[(i + 1) % points.length];
    nx += ay * bz - az * by;
    ny += az * bx - ax * bz;
    nz += ax * by - ay * bx;
  }
  const length = Math.hypot(nx, ny, nz);
  if (!length) return fill;
  // Top faces point up. For legacy vertical faces, use the visible side.
  const facing = sideNormal ? nx * sideNormal[0] + ny * sideNormal[1] : nz || nx + ny;
  const sign = facing < 0 ? -1 : 1;
  const [x, y, z] = lighting.direction;
  const strength = lighting.ambient + (1 - lighting.ambient) *
    Math.max(0, sign * (nx * x + ny * y + nz * z) / length);
  const dim = channel => Math.round(channel * strength);
  if (typeof fill !== 'string') {
    const stops = channels => channels.map((channel, i) => i < 3 ? dim(channel) : channel);
    return {...fill, near: stops(fill.near), far: stops(fill.far)};
  }
  const value = Number.parseInt(fill.slice(1), 16);
  return '#' + ((dim(value >> 16) << 16) | (dim((value >> 8) & 255) << 8) |
    dim(value & 255)).toString(16).padStart(6, '0');
}

function surface(points, fill, sideNormal) {
  // Every screen ray meets higher world elevations closer to this camera.
  depthRaster.polygon(points.map(([x, y, z]) => [...project(x, y, z), z]), shade(points, fill, sideNormal));
}

function gradient(x, y, x2, y2, near, far) {
  const fill = art.createLinearGradient(x, y, x2, y2);
  fill.addColorStop(0, near);
  fill.addColorStop(1, far);
  return fill;
}

function glow(x, y, radius, color) {
  const fill = art.createRadialGradient(x, y, 0, x, y, radius);
  fill.addColorStop(0, color);
  fill.addColorStop(1, '#ffb06100');
  art.fillStyle = fill;
  art.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function block(x, y, w, d, z, base, colors) {
  const right = x + w;
  const front = y + d;
  surface([[x,y,z],[x,front,z],[x,front,base],[x,y,base]], colors[2], [-1, 0]);
  surface([[x,y,z],[right,y,z],[right,y,base],[x,y,base]], colors[1], [0, -1]);
  surface([[right,y,z],[right,front,z],[right,front,base],[right,y,base]], colors[2], [1, 0]);
  surface([[x,front,z],[right,front,z],[right,front,base],[x,front,base]], colors[1], [0, 1]);
  surface([[x,y,z],[right,y,z],[right,front,z],[x,front,z]], colors[0]);
}

const clay = ['#e5a27d','#9d5c57','#663f4c'];
const transitionStone = ['#a1abaa','#667777','#495c61'];
const steps = ['#f3bf91','#ae695e','#7f4951'];
const jade = ['#659e8c','#466e66','#314d4f'];
const ochre = ['#dba26d','#b5745b','#80515d'];

function drawWall({block}, {anchor:[x,y,z], width, depth, height}) {
  block(x, y, width, depth, z + height, z, ochre);
}

function drawLightCue({surface, softDeck}, {anchor:[x,y,z], width, depth}) {
  if (softDeck) {
    const centerX = x + width / 2;
    const centerY = y + depth / 2;
    ['08', '0b', '0f', '13', '17', '1b', '1f'].forEach((alpha, index) => {
      const size = 1 - index * .14;
      const points = Array.from({length: 24}, (_, side) => {
        const angle = side * Math.PI / 12;
        return [centerX + Math.cos(angle) * width * size / 2,
          centerY + Math.sin(angle) * depth * size / 2, z];
      });
      surface(points, '#ffd080' + alpha);
    });
    return;
  }
  surface([[x,y,z],[x+width,y,z],[x+width,y+depth,z],[x,y+depth,z]], '#ffd08070');
}

function convexOutline(points) {
  const sorted = points.sort(([ax, ay], [bx, by]) => ax - bx || ay - by);
  const edge = sequence => {
    const result = [];
    for (const [x, y] of sequence) {
      while (result.length >= 2) {
        const [ax, ay] = result.at(-2);
        const [bx, by] = result.at(-1);
        if ((bx - ax) * (y - ay) > (by - ay) * (x - ax)) break;
        result.pop();
      }
      result.push([x, y]);
    }
    return result.slice(0, -1);
  };
  return [...edge(sorted), ...edge(sorted.reverse())];
}

function clipDeck(points, x, y, width, depth) {
  for (const [axis, limit, sign] of [[0, x, 1], [0, x + width, -1], [1, y, 1], [1, y + depth, -1]]) {
    const clipped = [];
    for (let index = 0; index < points.length; index++) {
      const from = points.at(index - 1);
      const to = points[index];
      const a = (from[axis] - limit) * sign;
      const b = (to[axis] - limit) * sign;
      if ((a >= 0) !== (b >= 0)) {
        const ratio = a / (a - b);
        clipped.push(from.map((value, i) => value + (to[i] - value) * ratio));
      }
      if (b >= 0) clipped.push(to);
    }
    points = clipped;
  }
  return points;
}

function drawDeckShadows(instances, floors) {
  if (!lighting || lighting.direction[2] <= 1e-8) return;
  const [dx, dy, dz] = lighting.direction;
  const alpha = Math.round((1 - lighting.ambient) * 150).toString(16).padStart(2, '0');
  for (const {asset, placement} of instances) {
    if (asset !== 'pavilion-roof') continue;
    const [left, back, base] = placement.anchor;
    const roof = [];
    const casters = [roof];
    drawPavilionRoof({
      surface(points, fill) { if (fill.length === 7) roof.push(...points); },
      block(x, y, width, depth, top, bottom) {
        casters.push([bottom, top].flatMap(z => [[x,y,z], [x+width,y,z],
          [x+width,y+depth,z], [x,y+depth,z]]));
      },
    }, placement);
    for (const {anchor:[x, y, z], width, depth} of floors) {
      if (x >= left + placement.span || x + width <= left ||
          y >= back + placement.depth || y + depth <= back || z >= base + placement.height) continue;
      for (const caster of casters) {
        if (caster.every(point => point[2] <= z)) continue;
        const outline = convexOutline(caster.map(([px, py, pz]) => {
          const drop = Math.max(0, pz - z) / dz;
          return [px - dx * drop, py - dy * drop];
        }));
        const shadow = clipDeck(outline, x, y, width, depth);
        if (shadow.length >= 3) surface(shadow.map(([px, py]) => [px, py, z]), '#223335' + alpha);
      }
    }
  }
}

function getSolids(instances) {
  return instances.flatMap(({id, asset, placement}) => {
    if (asset !== 'table' && asset !== 'chair' && asset !== 'wall') return [];
    const boxes = [];
    drawers[asset]({block(x,z,width,depth,top,bottom) {
      const height = top - bottom;
      boxes.push({id, x:x + width / 2, y:bottom + height / 2, z:z + depth / 2, width, height, depth});
    }}, placement);
    return boxes;
  });
}

function cliff(outline, top, bottom, topColor) {
  for (let i = 0; i < outline.length; i++) {
    const [ax, ay] = outline[i];
    const [bx, by] = outline[(i + 1) % outline.length];
    const [sx, sy] = project(ax, ay, top);
    const shade = i % 3 === 0 ? '#a1625d' : '#915654';
    surface([[ax,ay,top],[bx,by,top],[bx,by,bottom],[ax,ay,bottom]],
      linearDepthFill(sx, sy, sx+34, sy + top - bottom, shade, '#352d3a'));
    for (const [offset, thickness] of [[14,4],[37,6],[67,3],[98,8],[122,3]]) {
      if (top - offset - thickness < bottom) continue;
      const end = top - offset + (i % 3 - 1) * 7;
      surface([[ax,ay,top-offset],[bx,by,end],[bx,by,end-thickness],[ax,ay,top-offset-thickness]],
        offset % 2 === 0 ? '#d1866d66' : '#422b4266');
    }
  }
  surface(outline.map(([x,y]) => [x,y,top]), topColor);
}

function disc(x, y, rx, ry, color) {
  art.fillStyle = color;
  art.beginPath();
  art.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  art.fill();
}

function ellipsePoints(x, y, rx, ry) {
  return Array.from({length: 20}, (_, index) => {
    const angle = index * Math.PI / 10;
    return [x + Math.cos(angle) * rx, y + Math.sin(angle) * ry];
  });
}

function pixelsPerHeight() {
  return approach ? approach.scale * (approach.transform?.yz ?? 1.14) : 1;
}

function lampDisc(x, y, rx, ry, color, center) {
  const [, centerY] = project(...center);
  const depth = center[2] + ry * .8 / pixelsPerHeight();
  depthRaster.polygon(ellipsePoints(x, y, rx, ry).map(([px, py]) =>
    [px, py, depth + (centerY - py) / pixelsPerHeight()]), color);
}

const treeCrown = [
  [[[0,1],[14,.54],[8,.35],[-13,.35]], '#548f79'],
  [[[0,1],[14,.54],[8,.35],[1,.47]], '#32675f'],
  [[[0,1],[1,.47],[-13,.35],[-17,.57]], '#83ad83'],
];

function tree(x, y, z, height) {
  const [sx, sy] = project(x, y, z);
  depthRaster.polygon(ellipsePoints(sx + 13, sy + 3, 22, 7).map(([px, py]) =>
    [px, py, z]), '#243d405c');
  const billboard = (points, color) => depthRaster.polygon(points.map(([px, py]) =>
    [sx + px, sy + py, z - py + .1]), color);
  block(x - 3, y - 3, 6, 6, z + height / 2, z, ochre);
  for (const [points, color] of treeCrown) {
    billboard(points.map(([offset, fraction]) => [offset, -height * fraction]), color);
  }
}

function drawTree({block, surface}, {anchor:[x,y,z], scale}) {
  block(x - 3 * scale, y - 3 * scale, 6 * scale, 6 * scale, z + 28 * scale, z, ochre);
  const ring = [[8.5,0],[6,6],[0,8.5],[-6,6],[-8.5,0],[-6,-6],[0,-8.5],[6,-6]]
    .map(([dx,dy]) => [x + dx * scale, y + dy * scale, z + 19.6 * scale]);
  const tip = [x, y, z + 56 * scale];
  const colors = ['#32675f','#548f79','#83ad83','#83ad83','#548f79','#32675f','#32675f','#32675f'];
  surface([...ring].reverse(), '#32675f');
  for (const [index, point] of ring.entries()) {
    surface([point, ring[(index + 1) % ring.length], tip], colors[index]);
  }
}

function renderArt(scene, {stairs, landings, middleArch, terraceLamp}) {
  const vector = {block, surface, project, glow, disc:lampDisc};
  art.fillStyle = gradient(0,0,260,690,'#23373b','#70515a');
  art.fillRect(0,0,1000,690);
  glow(737,130,500,'#f3a76e35');
  disc(140,153,46,46,'#efbf8c20');
  disc(140,153,35,35,'#e4c19b40');
  polygon([[0,420],[94,371],[123,392],[166,355],[252,439],[319,414],[435,482],[561,449],[762,364],[841,415],[915,355],[1000,404],[1000,690],[0,690]],'#514651');
  polygon([[0,520],[110,469],[230,538],[358,485],[525,565],[685,522],[851,442],[1000,503],[1000,690],[0,690]],'#3f3c47');
  polygon([[0,587],[198,558],[326,586],[491,558],[606,585],[764,536],[1000,570],[1000,690],[0,690]],'#393843');
  for (const [x,y,w] of [[30,319,152],[420,322,125],[88,400,65],[810,367,151],[37,570,127],[801,617,148]]) {
    polygon([[x,y],[x+w*.6,y-2],[x+w,y+1],[x+w*.18,y+4]],'#deab8b35');
  }

  cliff([[596,18],[735,18],[774,49],[771,142],[742,174],[605,164],[581,111]],220,-73,'#bb765e');
  block(604,34,147,109,224,213,clay);
  block(609,39,137,99,225,224,jade);
  block(637,100,67,26,226,225,['#d68f6a','#a66158','#674653']);
  block(644,108,53,13,240,226,ochre);

  cliff([[328,48],[419,40],[446,74],[425,115],[334,112],[300,86]],91,-79,'#c27b64');
  drawLanding(vector, landings.midpoint);
  drawArch(vector, middleArch);
  drawStair(vector, stairs.terrace);

  cliff([[196,234],[222,220],[350,214],[385,246],[377,349],[331,389],[212,385],[178,344]],42,-150,'#b57761');
  block(206,235,152,128,44,39,clay);
  block(285,256,55,78,45,44,jade);
  block(291,264,43,62,46,45,['#2f7b79','#3a8178','#2a5e66']);
  for (const row of [277,294,312]) {
    surface([[298,row,47],[325,row+1,47],[331,row+2,47],[299,row+2,47]],'#97d2ae7b');
  }
  tree(341,242,44,56);
  tree(345,349,44,41);
  tree(231,247,44,32);

  drawLanding(vector, landings.courtyard);
  drawStair(vector, stairs.courtyard);
  drawLanding(vector, landings.turn);
  block(58,316,61,43,1,-51,clay);
  cliff([[30,312],[78,304],[116,316],[118,352],[100,377],[49,374],[26,341]],0,-101,'#b97c6b');
  block(55,320,56,32,2,-1,steps);
  block(107,330,9,12,16,2,ochre);
  drawStair(vector, stairs.entrance);
  block(144,326,9,19,13,-51,clay);
  block(184,326,9,19,28,-63,clay);

  drawLamp(vector, terraceLamp);
  tree(739,122,225,48);
  tree(622,133,225,38);

  for (const {id, asset, placement} of scene.instances) {
    if (!stockIds.has(id)) drawers[asset](vector, placement);
  }

  for (let i=0;i<26;i++) {
    const x = 120 + i*109 % 793;
    const y = 141 + i*43 % 309;
    disc(x,y,i%5===0 ? 1.5 : .7,i%5===0 ? 1.5 : .7,'#ffdc9a82');
  }
}

function drawApproachRamp({from, to, width}, colors) {
  const axis = from[0] === to[0] ? 1 : 0;
  const crossAxis = 1 - axis;
  const start = from[axis];
  const end = to[axis];
  const lower = from[crossAxis] - width / 2;
  const upper = from[crossAxis] + width / 2;
  const point = (along, across, height) => axis === 0
    ? [along, across, height]
    : [across, along, height];
  surface([point(start, upper, from[2]), point(end, upper, to[2]),
    point(end, upper, from[2])], colors[crossAxis === 0 ? 2 : 1]);
  surface([point(start, lower, from[2]), point(end, lower, to[2]),
    point(end, lower, from[2])], colors[crossAxis === 0 ? 2 : 1]);
  surface([point(end, lower, to[2]), point(end, upper, to[2]),
    point(end, upper, from[2]), point(end, lower, from[2])], colors[axis === 0 ? 2 : 1]);
  surface([point(start, lower, from[2]), point(end, lower, to[2]),
    point(end, upper, to[2]), point(start, upper, from[2])], colors[0]);
}

function drawApproachStair(stair, colors) {
  const {from, count, width} = stair;
  const {axis, run, edges, heights} = stairProfile(stair);
  const crossAxis = 1 - axis;
  const lower = from[crossAxis] - width / 2;
  const upper = from[crossAxis] + width / 2;
  const point = (along, across, height) => axis === 0
    ? [along, across, height]
    : [across, along, height];
  const edge = index => edges[index];
  const height = index => heights[index];
  const cheek = [point(edge(0), upper, from[2])];
  for (let i = 0; i < count; i++) {
    cheek.push(point(edge(i), upper, height(i + 1)), point(edge(i + 1), upper, height(i + 1)));
  }
  cheek.push(point(edge(count), upper, from[2]));
  surface(cheek, colors[crossAxis === 0 ? 2 : 1]);
  surface(cheek.map(point => point.map((value, index) => index === crossAxis ? lower : value)),
    colors[crossAxis === 0 ? 2 : 1]);
  for (let step = 0; step < count; step++) {
    const i = run < 0 ? count - 1 - step : step;
    const start = edge(i);
    const end = edge(i + 1);
    const top = height(i + 1);
    surface([point(start, lower, top), point(end, lower, top),
      point(end, upper, top), point(start, upper, top)], colors[0]);
    surface([point(start, lower, top), point(start, upper, top),
      point(start, upper, height(i)), point(start, lower, height(i))], colors[axis === 0 ? 2 : 1]);
    if (run >= 0) {
      // The next tread hides the far edge. Shade the visible leading edge within this tread.
      const joint = start + (end - start) * .08;
      surface([point(start, lower, top), point(joint, lower, top),
        point(joint, upper, top), point(start, upper, top)],
        stair.finish === 'stone' ? '#47575b88' : '#925e4baa');
    }
  }
  surface([point(edge(count), lower, height(count)), point(edge(count), upper, height(count)),
    point(edge(count), upper, from[2]), point(edge(count), lower, from[2])], colors[axis === 0 ? 2 : 1]);
}

function drawApproachDeck({anchor: [x, y, z], width, depth, slab}, flights, colors) {
  const edges = [x + width, y + depth];
  const starts = [x, y];
  const bottom = z - slab;
  for (const axis of [0, 1]) {
    const cross = 1 - axis;
    const backPoint = (along, h) => axis === 0 ? [starts[axis], along, h] : [along, starts[axis], h];
    surface([backPoint(starts[cross], z), backPoint(edges[cross], z),
      backPoint(edges[cross], bottom), backPoint(starts[cross], bottom)], colors[axis === 0 ? 2 : 1]);
    const face = (start, end, top) => {
      if (start >= end || top <= bottom) return;
      const point = (along, h) => axis === 0 ? [edges[axis], along, h] : [along, edges[axis], h];
      surface([point(start, top), point(end, top), point(end, bottom), point(start, bottom)],
        colors[axis === 0 ? 2 : 1]);
    };
    const joints = flights.filter(({from, to}) => to[2] === z &&
      from[axis] > to[axis] && Math.abs(to[axis] - edges[axis]) < 1e-7)
      .map(({from, to, width}) => ({
        start: Math.max(starts[cross], to[cross] - width / 2),
        end: Math.min(edges[cross], to[cross] + width / 2),
        base: from[2],
      })).filter(({start, end}) => end - start > 1e-7).sort((a, b) => a.start - b.start);
    let cursor = starts[cross];
    for (const {start, end, base} of joints) {
      face(cursor, start, z);
      face(Math.max(cursor, start), end, base);
      cursor = Math.max(cursor, end);
    }
    face(cursor, edges[cross], z);
  }
  surface([[x, y, z], [edges[0], y, z],
    [edges[0], edges[1], z], [x, edges[1], z]], colors[0]);
}

function renderApproach(scene, {floors, stairs}) {
  const softDeck = scene.lighting?.deckTreatment === 'soft-shadows';
  const vector = {block, surface, project, glow, disc:lampDisc, softDeck};
  art.fillStyle = gradient(0,0,260,690,'#23373b','#70515a');
  art.fillRect(0,0,1000,690);
  for (const floor of floors) drawApproachDeck(floor, stairs, clay);
  for (const flight of stairs) {
    const colors = flight.finish === 'stone' ? transitionStone : clay;
    if (flight.profile === 'ramp') drawApproachRamp(flight, colors);
    else drawApproachStair(flight, colors);
  }
  if (softDeck) drawDeckShadows(scene.instances, floors);
  for (const {asset, placement} of scene.instances) {
    drawers[asset](vector, placement);
  }
}

const commands = {ArrowUp:1,ArrowRight:1,w:1,d:1,ArrowDown:-1,ArrowLeft:-1,s:-1,a:-1};
let route = [];
let routeElevation = [];
let worldRoute = [];
let solids = [];
let blockedBy = null;
const avatarSize = {radius:6, height:22};
let lengths = [];
let distanceAt = [];
let finish = 0;
let lantern;
let scene;
let selectedPlacement;
let selectedFloor;
let editing = false;
let walk = 0;
let destination = 0;
let namedDestination = null;
let stops = [];
let movement = 0;
let lastTime = 0;

function preview(nextScene, placement, floor) {
  selectedPlacement = placement;
  selectedFloor = floor;
  if (nextScene === scene) return;
  const changedSite = Boolean(scene?.geometry) !== Boolean(nextScene.geometry);
  scene = nextScene;
  solids = getSolids(scene.instances);
  blockedBy = null;
  const layout = getLayout(scene);
  approach = null;
  if (layout.geometry) {
    const edges = layout.geometry.floors.flatMap(({anchor:[x,y,z],width,depth,slab}) =>
      [[x,y,z],[x+width,y+depth,z-slab],[x,y+depth,z],[x+width,y,z]]);
    const widths = edges.map(([x,y]) => x - y);
    const heights = edges.map(([x,y,z]) => .52 * (x+y) - 1.14 * z);
    const scale = Math.min(790 / (Math.max(...widths) - Math.min(...widths)),
      510 / (Math.max(...heights) - Math.min(...heights)));
    const centerAcross = (Math.max(...widths) + Math.min(...widths)) / 2;
    const centerDown = (Math.max(...heights) + Math.min(...heights)) / 2;
    approach = {scale, x:500 - scale * centerAcross, y:345 - scale * centerDown};
    const {camera} = layout.geometry;
    if (camera && (camera.yaw !== 0 || camera.elevation !== 0)) {
      const azimuth = (45 + camera.yaw) * Math.PI / 180;
      const flatGain = .52 * Math.SQRT2;
      const verticalGain = Math.hypot(flatGain, 1.14);
      const elevation = Math.atan2(flatGain, 1.14) + camera.elevation * Math.PI / 180;
      const transform = {
        xx: Math.SQRT2 * Math.sin(azimuth),
        xy: -Math.SQRT2 * Math.cos(azimuth),
        yx: verticalGain * Math.sin(elevation) * Math.cos(azimuth),
        yy: verticalGain * Math.sin(elevation) * Math.sin(azimuth),
        yz: verticalGain * Math.cos(elevation),
      };
      const centerX = (centerDown / .52 + centerAcross) / 2;
      const centerY = (centerDown / .52 - centerAcross) / 2;
      approach.transform = transform;
      approach.x = 500 - scale * (transform.xx * centerX + transform.xy * centerY);
      approach.y = 345 - scale * (transform.yx * centerX + transform.yy * centerY);
    }
  }
  const previousFinish = finish;
  const previousRoute = route;
  route = [];
  routeElevation = [];
  worldRoute = [];
  const stopIndexes = [];
  for (const [index, point] of layout.route.entries()) {
    const projected = project(...point);
    const previous = route.at(-1);
    if (!previous || Math.hypot(projected[0] - previous[0], projected[1] - previous[1]) > .001) {
      route.push(projected);
      routeElevation.push(point[2]);
      worldRoute.push({x:point[0], y:point[2], z:point[1]});
    }
    const name = layout.routeStops?.[index];
    if (name) stopIndexes.push({name, index:route.length - 1});
  }
  lengths = route.slice(1).map(([x,y], i) => Math.hypot(x-route[i][0],y-route[i][1]));
  distanceAt = lengths.reduce((values, length) => [...values, values.at(-1)+length], [0]);
  finish = distanceAt.at(-1);
  const sameRoute = JSON.stringify(route) === JSON.stringify(previousRoute);
  stops = stopIndexes.map(({name, index}) => ({name, distance:distanceAt[index], point:route[index]}));
  if (changedSite) {
    goTo(0);
    walk = 0;
  } else if (previousFinish && !sameRoute) {
    walk = walk / previousFinish * finish;
    destination = walk;
  }
  if (namedDestination) namedDestination = stops.find(stop => stop.name === namedDestination.name && stop.distance === destination) ?? null;
  stopControls.replaceChildren(...(scene.route ? stops.map(stop => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = stop.name;
    button.addEventListener('click', () => goTo(stop.distance, stop));
    return button;
  }) : []));
  showStopControls();
  lantern = layout.terraceLamp ? project(...lampCenter(layout.terraceLamp)) : null;
  canvas.setAttribute('aria-label', scene.title ?? (approach ? 'Seowon approach' : 'Garden Office cliff path'));
  document.querySelector('h1').textContent = scene.title ?? (approach ? 'Seowon approach' : 'Garden Office');
  document.querySelector('#controls').textContent = approach
    ? 'Select the path or a stop to walk. Press Up or Right to advance, Down or Left to return.'
    : 'Select the path or lantern to walk. Press Up or Right to advance, Down or Left to return.';
  renderBackground(layout);
}

function drawBackground(layout) {
  const light = scene.lighting;
  const length = light && Math.hypot(...light.direction);
  lighting = length && light.ambient < 1
    ? {direction: light.direction.map(value => value / length), ambient: light.ambient}
    : null;
  depthRaster.begin(background.width, background.height);
  if (approach) renderApproach(scene, layout.geometry);
  else renderArt(scene, layout);
  return depthRaster.present();
}

function showRenderer(message) {
  const gpuActive = depthRaster !== cpuDepthRaster;
  gpuButton.textContent = gpuActive ? 'Disable GPU' : 'Enable GPU';
  rendererStatus.value = message ?? (gpuActive ? 'Renderer: GPU (WebGL2)' : 'Renderer: CPU');
}

function renderBackground(layout) {
  if (depthRaster === cpuDepthRaster) {
    drawBackground(layout);
    return;
  }
  try {
    if (drawBackground(layout)) return;
  } catch {
    // Draw the same scene with CPU depth if the WebGL2 renderer fails.
  }
  depthRaster = cpuDepthRaster;
  gpuDepthRaster = null;
  drawBackground(layout);
  showRenderer('Renderer: CPU (GPU rendering failed)');
}

gpuButton.addEventListener('click', () => {
  if (depthRaster !== cpuDepthRaster) {
    depthRaster = cpuDepthRaster;
    renderBackground(getLayout(scene));
    showRenderer();
    return;
  }
  if (!gpuDepthRaster) {
    let candidate;
    try {
      candidate = createWebGlDepthRaster(art, () => {
        if (gpuDepthRaster !== candidate) return;
        gpuDepthRaster = null;
        if (depthRaster !== candidate) return;
        depthRaster = cpuDepthRaster;
        renderBackground(getLayout(scene));
        showRenderer('Renderer: CPU (WebGL2 context lost)');
      });
    } catch {
      candidate = null;
    }
    gpuDepthRaster = candidate;
  }
  if (!gpuDepthRaster) {
    showRenderer('Renderer: CPU (WebGL2 unavailable)');
    return;
  }
  depthRaster = gpuDepthRaster;
  renderBackground(getLayout(scene));
  if (depthRaster !== cpuDepthRaster) showRenderer();
});

function showStopControls() {
  stopControls.hidden = editing || !scene.route;
}

function goTo(distance, stop = null) {
  movement = 0;
  destination = distance;
  namedDestination = stop;
  blockedBy = null;
}

function advanceWalk(target) {
  while (walk !== target) {
    const forward = target > walk;
    const index = forward ? distanceAt.findIndex(distance => distance > walk) - 1
      : distanceAt.findLastIndex(distance => distance < walk);
    const end = forward ? Math.min(target, distanceAt[index + 1]) : Math.max(target, distanceAt[index]);
    const pointAt = distance => {
      const part = (distance - distanceAt[index]) / lengths[index];
      const from = worldRoute[index];
      const to = worldRoute[index + 1];
      return {x:from.x + (to.x - from.x) * part, y:from.y + (to.y - from.y) * part,
        z:from.z + (to.z - from.z) * part};
    };
    const hit = solids.length ? sweepAvatar(pointAt(walk), pointAt(end), solids, avatarSize) : null;
    if (hit) {
      walk += (end - walk) * Math.max(0, hit.t - .001);
      destination = walk;
      namedDestination = null;
      blockedBy = hit.id;
      return;
    }
    walk = end;
    blockedBy = null;
  }
}

function routePosition(distance) {
  if (distance >= finish) return [...route.at(-1), routeElevation.at(-1)];
  const index = distanceAt.slice(1).findIndex(end => end >= distance);
  const [a,b] = [route[index], route[index+1]];
  const part = (distance-distanceAt[index])/lengths[index];
  return [a[0]+(b[0]-a[0])*part,a[1]+(b[1]-a[1])*part,
    routeElevation[index] + (routeElevation[index + 1] - routeElevation[index]) * part];
}

function clipWalker(x, y, z) {
  const heightScale = pixelsPerHeight();
  paint.beginPath();
  for (let row = Math.floor(y - 29); row <= Math.ceil(y + 5); row++) {
    const depth = z + Math.max(0, y - row - .5) / heightScale + .1;
    let start = null;
    for (let col = Math.floor(x - 10); col <= Math.ceil(x + 15); col++) {
      if (col < Math.ceil(x + 15) && depth >= depthRaster.depthAt(col, row)) {
        start ??= col;
      } else if (start !== null) {
        paint.rect(start, row, col - start, 1);
        start = null;
      }
    }
  }
  paint.clip();
}

function renderFrame(time) {
  const elapsed = Math.min(36,time-lastTime);
  lastTime = time;
  if (movement) destination = Math.max(0,Math.min(finish,walk+movement*elapsed*.23));
  const delta = destination-walk;
  advanceWalk(Math.abs(delta) <= elapsed * .23 ? destination : walk + Math.sign(delta) * elapsed * .23);
  const [x,y,z] = routePosition(walk);
  let message = 'Entrance landing';
  const exactStop = movement && scene.geometry
    ? stops.find(({distance}) => Math.abs(distance - walk) <= .01) : null;
  const keyboardMoving = movement && (!scene.geometry || (movement > 0 ? walk < finish : walk > 0));
  if (blockedBy) message = `Path blocked by ${blockedBy}.`;
  else if (Math.abs(destination - walk) > .01 || (keyboardMoving && !exactStop)) {
    message = namedDestination ? `Walking to ${namedDestination.name}.` : 'Walking';
  } else if (namedDestination) message = `${namedDestination.name} reached.`;
  else if (scene.route) {
    const stop = exactStop ?? stops.find(({distance}) => Math.abs(distance - walk) <= 2);
    message = stop ? `${stop.name} reached.` : 'On the path';
  } else if (walk >= finish - 2) message = 'Meeting terrace reached.';
  else if (walk >= distanceAt[5] - 16) message = 'Midpoint reached.';
  else if (walk >= distanceAt[2] - 16) message = 'Courtyard reached.';
  if (status.value !== message) status.value = message;

  paint.drawImage(background,0,0);
  if (scene.route && !editing) {
    paint.fillStyle = '#ffd18a';
    paint.strokeStyle = '#21343a';
    for (const {point:[stopX,stopY]} of stops) {
      paint.beginPath();
      paint.arc(stopX,stopY,4,0,Math.PI*2);
      paint.fill();
      paint.stroke();
    }
  }
  if (selectedFloor) {
    const [floorX, floorY] = project(...selectedFloor);
    paint.fillStyle = '#21343a';
    paint.strokeStyle = '#ffd18a';
    paint.lineWidth = 2;
    paint.beginPath();
    paint.ellipse(floorX,floorY,9,5,0,0,Math.PI*2);
    paint.fill();
    paint.stroke();
  }
  if (selectedPlacement) {
    const [anchorX, anchorY] = project(...(selectedPlacement.anchor ?? selectedPlacement.from));
    paint.save();
    paint.strokeStyle = '#fff0bd';
    paint.lineWidth = 2;
    paint.setLineDash([4, 3]);
    paint.beginPath();
    paint.ellipse(anchorX,anchorY,17,9,0,0,Math.PI*2);
    paint.stroke();
    paint.restore();
  }
  paint.save();
  clipWalker(x, y, z);
  paint.translate(x,y);
  paint.fillStyle = '#342c416c';
  paint.beginPath();
  paint.ellipse(3,1,10,4,0,0,Math.PI*2);
  paint.fill();
  paint.fillStyle = '#203639';
  paint.fillRect(-5,-11,4,12);
  paint.fillRect(2,-11,4,12);
  paint.fillStyle = '#f3ce86';
  paint.beginPath();
  paint.moveTo(0,-28);
  paint.lineTo(9,-6);
  paint.quadraticCurveTo(0,-2,-8,-7);
  paint.fill();
  paint.fillStyle = '#c97055';
  paint.fillRect(-5,-18,10,3);
  paint.fillStyle = '#ffe5b4';
  paint.beginPath();
  paint.arc(1,-22,4,0,Math.PI*2);
  paint.fill();
  paint.restore();
  requestAnimationFrame(renderFrame);
}

function targetAt(x,y) {
  let best = 37;
  let target = null;
  for (const [index,length] of lengths.entries()) {
    const [ax,ay] = route[index];
    const [bx,by] = route[index+1];
    const fraction = Math.max(0,Math.min(1,((x-ax)*(bx-ax)+(y-ay)*(by-ay))/(length*length)));
    const gap = Math.hypot(x-(ax+(bx-ax)*fraction),y-(ay+(by-ay)*fraction));
    if (gap >= best) continue;
    best = gap;
    target = distanceAt[index]+fraction*length;
  }
  return target;
}

function pointOnHeight(x, y, z) {
  if (approach) {
    const difference = (x - approach.x) / approach.scale;
    const projectedY = (y - approach.y) / approach.scale;
    if (approach.transform) {
      const {xx, xy, yx, yy, yz} = approach.transform;
      const horizontal = projectedY + yz * z;
      const det = xx * yy - xy * yx;
      return [(yy * difference - xy * horizontal) / det,
        (xx * horizontal - yx * difference) / det, z];
    }
    const sum = (projectedY + 1.14 * z) / .52;
    return [(sum + difference) / 2, (sum - difference) / 2, z];
  }
  const worldY = (y - 272 + z - .27 * (x - 240)) / (.34 + .27 * .57);
  return [x - 240 + .57 * worldY, worldY, z];
}

function floorAt(x, y) {
  const addedFloors = scene.instances.filter(({id,asset}) => asset === 'landing' && !stockIds.has(id)).reverse();
  const instances = new Map(scene.instances.map(instance => [instance.id, instance.placement]));
  const authoredFloors = scene.geometry?.floors.slice().sort((a,b) => b.anchor[2] - a.anchor[2]);
  const floors = [
    ...addedFloors.map(({id,placement}) => [id, placement]),
    ...(authoredFloors ? authoredFloors.map(floor => [floor.id, floor]) : [
    ['entrance landing',{anchor:[55,320,2],width:56,depth:32}],
    ['turn landing',instances.get('turn')],
    ['courtyard landing',instances.get('courtyard-landing')],
    ['courtyard',{anchor:[206,235,44],width:152,depth:128}],
    ['midpoint',instances.get('midpoint')],
    ['meeting terrace',{anchor:[609,39,225],width:137,depth:99}],
    ]),
  ];
  for (const [name, {anchor:[left,back,z],width,depth}] of floors) {
    const point = pointOnHeight(x,y,z);
    const [px,py] = point;
    if (px < left || px > left + width || py < back || py > back + depth) continue;
    if (name === 'courtyard' && px >= 285 && px <= 340 && py >= 256 && py <= 334) continue;
    if (name === 'meeting terrace' && px >= 637 && px <= 704 && py >= 100 && py <= 126) continue;
    return {name, point:[Math.round(px * 10) / 10, Math.round(py * 10) / 10, z]};
  }
  return null;
}

function componentAt(x, y) {
  for (const {id,asset,placement} of [...scene.instances].reverse()) {
    if (asset === 'joseon-roof' && joseonRoofContains(project, art, placement, x, y)) return id;
    if ((asset === 'table' || asset === 'chair' || asset === 'wall') && furnitureContains(drawers[asset], project, art, placement, x, y)) return id;
    if (asset !== 'lamp') continue;
    const [lx,ly] = project(...lampCenter(placement));
    const scale = placement.scale;
    if (Math.abs(x-lx) <= 16*scale && y >= ly-28*scale && y <= ly+47*scale) return id;
  }
  return null;
}

canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const bounds = canvas.getBoundingClientRect();
  const x=(event.clientX-bounds.left)*canvas.width/bounds.width;
  const y=(event.clientY-bounds.top)*canvas.height/bounds.height;
  if (editing) {
    const id = componentAt(x,y);
    selectFromScene({id, target:id ? null : floorAt(x,y)});
    return;
  }
  const stop = scene.route && stops.find(({point:[px,py]}) => Math.hypot(x-px,y-py) < 12);
  if (stop) goTo(stop.distance, stop);
  else if (lantern && Math.hypot(x-lantern[0],y-lantern[1]) < 50) goTo(finish, scene.route ? stops.at(-1) : null);
  else {
    const target = targetAt(x,y);
    if (target !== null) goTo(target);
  }
  canvas.focus({preventScroll:true});
});
canvas.addEventListener('keydown', event => {
  if (editing) return;
  const direction=commands[event.key] ?? commands[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  namedDestination = null;
  if (!event.repeat) destination=Math.max(0,Math.min(finish,walk+direction*13));
  movement=direction;
});
canvas.addEventListener('keyup', event => {
  const direction=commands[event.key] ?? commands[event.key.toLowerCase()];
  if (direction === movement) movement=0;
});
canvas.addEventListener('blur', () => { movement=0; });
document.querySelector('#return').addEventListener('click', () => {
  goTo(0);
  canvas.focus({preventScroll:true});
});

const selectFromScene = attachLayoutEditor(initialScene, preview, active => {
  editing = active;
  canvas.dataset.editing = String(active);
  showStopControls();
  if (active) {
    goTo(walk);
  }
});
requestAnimationFrame(renderFrame);
