import {stairProfile} from './assets/stair.mjs';
import {landings, middleArch, route, stairs, terraceLamp} from './layout.mjs';

export const sceneVersion = 1;

const assets = [
  {id: 'stair', label: 'Stair', fields: ['from', 'to', 'count', 'width']},
  {id: 'landing', label: 'Landing', fields: ['anchor', 'width', 'depth', 'slab', 'trim']},
  {id: 'arch', label: 'Arch', fields: ['anchor', 'span', 'height']},
  {id: 'lamp', label: 'Lamp', fields: ['anchor', 'scale']},
  {id: 'light-cue', label: 'Warm light', fields: ['anchor', 'width', 'depth']},
  {id: 'joseon-roof', label: 'Joseon roof', fields: ['anchor', 'scale']},
  {id: 'table', label: 'Table', fields: ['anchor', 'scale']},
  {id: 'chair', label: 'Chair', fields: ['anchor', 'scale']},
  {id: 'tree', label: 'Tree', fields: ['anchor', 'scale']},
  {id: 'wall', label: 'Wall', fields: ['anchor', 'width', 'depth', 'height']},
  {id: 'pond', label: 'Pond', fields: ['anchor', 'width', 'depth']},
  {id: 'boardwalk', label: 'Boardwalk', fields: ['anchor', 'width', 'depth']},
  {id: 'stone-paving', label: 'Stone paving', fields: ['anchor', 'width', 'depth', 'finish']},
  {id: 'pavilion-roof', label: 'Pavilion roof', fields: ['anchor', 'span', 'depth', 'height', 'profile']},
];

const stock = [
  {id: 'entrance', asset: 'stair', placement: stairs.entrance},
  {id: 'courtyard-stair', asset: 'stair', placement: stairs.courtyard},
  {id: 'terrace-stair', asset: 'stair', placement: stairs.terrace},
  {id: 'courtyard-landing', asset: 'landing', placement: landings.courtyard},
  {id: 'turn', asset: 'landing', placement: landings.turn},
  {id: 'midpoint', asset: 'landing', placement: landings.midpoint},
  {id: 'middle-arch', asset: 'arch', placement: middleArch},
  {id: 'terrace-lamp', asset: 'lamp', placement: terraceLamp},
];
const stockById = new Map(stock.map(item => [item.id, item]));
const maxInstances = 128;

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function checkFields(value, fields, label) {
  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  requireValue(isObject, `${label} must be an object.`);
  requireValue(Object.keys(value).every(key => fields.includes(key)), `${label} has an unknown field.`);
}

function bounded(value, min, max, label) {
  requireValue(Number.isFinite(value) && value >= min && value <= max,
    `${label} must be a number from ${min} to ${max}.`);
  return value;
}

function point(value, label) {
  requireValue(Array.isArray(value) && value.length === 3, `${label} must contain x, y and z.`);
  return [
    bounded(value[0], 0, 850, `${label} x`),
    bounded(value[1], 0, 420, `${label} y`),
    bounded(value[2], -100, 360, `${label} z`),
  ];
}

function checkId(id) {
  requireValue(typeof id === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(id),
    'Instance ID must start with a lowercase letter and use up to 48 lowercase letters, digits or hyphens.');
}

function versioned(value, field) {
  checkFields(value, ['version', field, 'route', 'geometry', 'title', 'lighting'], field === 'instances' ? 'Scene' : 'Edit request');
  requireValue(value.version === sceneVersion, `Version must be ${sceneVersion}.`);
  requireValue(Array.isArray(value[field]) && value[field].length <= maxInstances,
    `${field} must be an array of up to ${maxInstances} items.`);
}

function checkPlacement(asset, placement, id) {
  const catalogEntry = assets.find(item => item.id === asset);
  requireValue(catalogEntry, `${id} uses an unknown asset.`);
  checkFields(placement, catalogEntry.fields, `${id} placement`);
  const size = (field, min, max, fallback) => bounded(
    Object.hasOwn(placement, field) ? placement[field] : fallback, min, max, `${id} ${field}`);

  if (asset === 'stair') {
    const from = point(placement.from, `${id} from`);
    const to = point(placement.to, `${id} to`);
    const count = size('count', 1, 64);
    const width = size('width', 8, 80, 34);
    requireValue(Number.isInteger(count), `${id} count must be an integer.`);
    requireValue(to[2] > from[2] && ((to[0] === from[0]) !== (to[1] === from[1])),
      `${id} must ascend along one horizontal axis.`);
    return {from, to, count, width};
  }

  const anchor = point(placement.anchor, `${id} anchor`);
  if (asset === 'landing') {
    const trim = Object.hasOwn(placement, 'trim') ? placement.trim : false;
    requireValue(typeof trim === 'boolean', `${id} trim must be true or false.`);
    return {anchor, width: size('width', 10, 240), depth: size('depth', 8, 240),
      slab: size('slab', 1, 70, 15), trim};
  }
  if (asset === 'arch') {
    const span = size('span', 8, 100);
    const height = size('height', 8, 130);
    requireValue(height >= span / 2 + 4, `${id} needs at least 4 units below the arch curve.`);
    return {anchor, span, height};
  }
  if (asset === 'pond' || asset === 'boardwalk' || asset === 'stone-paving' || asset === 'light-cue') {
    const dimensions = {anchor, width: size('width', 4, 400), depth: size('depth', 4, 400)};
    if (asset !== 'stone-paving') return dimensions;
    const finish = Object.hasOwn(placement, 'finish') ? placement.finish : 'stone';
    requireValue(['stone', 'court', 'garden'].includes(finish), `${id} finish must be stone, court, or garden.`);
    return {...dimensions, finish};
  }
  if (asset === 'wall') {
    return {anchor, width: size('width', 1, 400), depth: size('depth', 1, 400), height: size('height', 1, 160)};
  }
  if (asset === 'pavilion-roof') {
    const dimensions = {anchor, span: size('span', 8, 300), depth: size('depth', 8, 300), height: size('height', 8, 130)};
    const profile = Object.hasOwn(placement, 'profile') ? placement.profile : 'straight';
    requireValue(profile === 'straight' || profile === 'curved', `${id} profile must be straight or curved.`);
    return profile === 'curved' ? {...dimensions, profile} : dimensions;
  }
  return {anchor, scale: size('scale', 0.3, 3, 1)};
}

function contains(landing, [x, y, z]) {
  const [left, back, top] = landing.anchor;
  return z === top && x >= left && x <= left + landing.width && y >= back && y <= back + landing.depth;
}

function checkWalkAnchors(byId) {
  for (const {id, asset, placement} of stock) {
    if (asset !== 'stair') continue;
    const current = byId.get(id).placement;
    requireValue(['from', 'to'].every(end => current[end].every((value, axis) => value === placement[end][axis])),
      `${id} stair endpoints must stay at the verified walk anchors.`);
  }

  const courtyard = byId.get('courtyard-landing').placement;
  const turn = byId.get('turn').placement;
  const midpoint = byId.get('midpoint').placement;
  const surfaceJoin = [Math.max(midpoint.anchor[0], stairs.courtyard.to[0]), ...stairs.courtyard.to.slice(1)];
  requireValue(contains(courtyard, stairs.courtyard.from) && contains(courtyard, [262, 235, 44]),
    'The courtyard landing must support the path from the courtyard floor to the stair.');
  requireValue(contains(turn, stairs.courtyard.to) && contains(turn, surfaceJoin) &&
    contains(midpoint, surfaceJoin) && contains(midpoint, stairs.terrace.from),
    'The turn and midpoint landings must support the path between the stairs.');

  const {anchor: [x, y, z], span} = byId.get('middle-arch').placement;
  requireValue(contains(midpoint, [x - span * 0.64, y, z]) && contains(midpoint, [x + span * 0.64, y, z]),
    'Both feet of the middle arch must be on the midpoint landing.');

  const {anchor: [lampX, lampY, lampZ], scale} = byId.get('terrace-lamp').placement;
  requireValue(lampZ === 225 && lampX - 10 * scale >= 609 && lampX + 10 * scale <= 746 &&
    lampY - 6 * scale >= 39 && lampY + 10 * scale <= 138,
    'The terrace lamp base must fit on the terrace floor.');
}

export function listAssets() {
  return assets.map(asset => ({...asset, fields: [...asset.fields]}));
}

const legacyNames = new Map([[0, 'Entrance'], [2, 'Courtyard'], [5, 'Midpoint'], [9, 'Meeting terrace']]);
const fixedFloors = [
  {anchor: [55, 320, 2], width: 56, depth: 32},
  {anchor: [206, 235, 44], width: 152, depth: 128},
  {anchor: [604, 34, 224], width: 147, depth: 109},
  {anchor: [609, 39, 225], width: 137, depth: 99},
];

function onRoute(stop) {
  for (let i = 1; i < route.length; i++) {
    const start = route[i - 1];
    const end = route[i];
    const axis = start.findIndex((value, index) => value !== end[index]);
    const fraction = (stop[axis] - start[axis]) / (end[axis] - start[axis]);
    if (fraction >= 0 && fraction <= 1 && start.every((value, index) =>
      Math.abs(stop[index] - value - fraction * (end[index] - value)) < 1e-7)) {
      return i - 1 + fraction;
    }
  }
  return null;
}

function floorInterval(floor, from, to) {
  if (from[2] !== floor.anchor[2] || to[2] !== floor.anchor[2]) return null;
  let start = 0;
  let end = 1;
  for (const [axis, size] of [floor.width, floor.depth].entries()) {
    const offset = from[axis] - floor.anchor[axis];
    const delta = to[axis] - from[axis];
    if (delta === 0) {
      if (offset < -1e-7 || offset > size + 1e-7) return null;
      continue;
    }
    const first = -offset / delta;
    const last = (size - offset) / delta;
    start = Math.max(start, Math.min(first, last));
    end = Math.min(end, Math.max(first, last));
  }
  return start <= end ? [start, end] : null;
}

function checkRoute(stops, byId, geometry) {
  requireValue(Array.isArray(stops) && stops.length >= 2 && stops.length <= 32,
    'Route must contain 2 to 32 stops.');
  const floors = geometry?.floors ?? [...fixedFloors, ...['courtyard-landing', 'turn', 'midpoint'].map(id => byId.get(id).placement)];
  const names = new Set();
  const positions = new Set();
  return stops.map((stop, index) => {
    const label = `Route stop ${index + 1}`;
    checkFields(stop, ['name', 'point'], label);
    requireValue(typeof stop.name === 'string' && stop.name.trim().length > 0 &&
      stop.name.trim().length <= 48 && !/[\x00-\x1f\x7f]/.test(stop.name),
    `${label} needs a name of 1 to 48 characters.`);
    const name = stop.name.trim();
    const position = point(stop.point, label);
    requireValue(!names.has(name.toLowerCase()), `${label} has a duplicate name.`);
    requireValue(!positions.has(position.join(',')), `${label} has a duplicate position.`);
    names.add(name.toLowerCase());
    positions.add(position.join(','));
    requireValue((!geometry && onRoute(position) !== null) || floors.some(floor => contains(floor, position)),
      `${label} needs a supported position.`);
    if (index > 0) {
      const from = stops[index - 1].point;
      if (geometry) {
        requireValue(authoredPath(geometry, from, position), `${label} needs a supported path from the previous stop.`);
      } else if (onRoute(from) === null || onRoute(position) === null) {
        const intervals = floors.map(floor => floorInterval(floor, from, position))
          .filter(Boolean).sort(([a], [b]) => a - b);
        let covered = 0;
        for (const [start, end] of intervals) {
          if (start > covered + 1e-7) break;
          covered = Math.max(covered, end);
        }
        requireValue(covered === 1, `${label} needs a supported path from the previous stop.`);
      }
    }
    return {name, point: position};
  });
}

function checkLighting(lighting) {
  checkFields(lighting, ['direction', 'ambient', 'deckTreatment'], 'Lighting');
  const {direction, ambient, deckTreatment} = lighting;
  requireValue(Array.isArray(direction) && direction.length === 3, 'Light direction must have three components.');
  const [x, y, z] = direction;
  const vector = [x, y, z].map(value => bounded(value, -1, 1, 'Light direction component'));
  requireValue(vector.some(value => value !== 0), 'Light direction must be nonzero.');
  const result = {direction: vector, ambient: bounded(ambient, 0, 1, 'Ambient light')};
  if (Object.hasOwn(lighting, 'deckTreatment')) {
    requireValue(deckTreatment === 'soft-shadows', 'Deck treatment must be soft-shadows.');
    result.deckTreatment = deckTreatment;
  }
  return result;
}

export function validateScene(scene) {
  versioned(scene, 'instances');
  const result = {version: sceneVersion};
  if (Object.hasOwn(scene, 'title')) {
    const {title} = scene;
    requireValue(typeof title === 'string' && title.trim().length > 0 && title.length <= 80 &&
      !/[\x00-\x1f\x7f]/.test(title), 'Scene title must contain 1 to 80 characters without control characters.');
    result.title = title;
  }
  if (Object.hasOwn(scene, 'lighting')) result.lighting = checkLighting(scene.lighting);
  const geometry = Object.hasOwn(scene, 'geometry') ? checkGeometry(scene.geometry) : null;
  const byId = new Map();
  for (const instance of scene.instances) {
    checkFields(instance, ['id', 'asset', 'placement'], 'Instance');
    const {id, asset, placement} = instance;
    checkId(id);
    requireValue(!byId.has(id), `Duplicate instance ${id}.`);
    requireValue(geometry || !stockById.has(id) || stockById.get(id).asset === asset, `${id} requires its original asset.`);
    byId.set(id, {id, asset, placement: checkPlacement(asset, placement, id)});
  }
  if (geometry) return {...result, instances: [...byId.values()], geometry, route: checkRoute(scene.route, byId, geometry)};
  const stockIds = stock.map(({id}) => id);
  requireValue(stockIds.every(id => byId.has(id)), 'The scene must contain the original instances.');
  checkWalkAnchors(byId);
  const extras = [...byId.keys()].filter(id => !stockById.has(id)).sort();
  result.instances = [...stockIds, ...extras].map(id => byId.get(id));
  if (Object.hasOwn(scene, 'route')) result.route = checkRoute(scene.route, byId);
  return result;
}

export function createDefaultScene() {
  return validateScene({version: sceneVersion, instances: stock});
}

export function applySceneEdits(scene, request) {
  const current = validateScene(scene);
  versioned(request, 'edits');
  const byId = new Map(current.instances.map(instance => [instance.id, instance]));
  for (const edit of request.edits) {
    checkFields(edit, ['id', 'asset', 'placement', 'remove'], 'Edit');
    const {id, asset, placement, remove} = edit;
    checkId(id);
    const existing = byId.get(id);
    if (Object.hasOwn(edit, 'remove')) {
      requireValue(remove === true && Object.keys(edit).length === 2, `${id} removal accepts only id and remove: true.`);
      requireValue(existing && (current.geometry || !stockById.has(id)), `${id} must be an added instance before removal.`);
      byId.delete(id);
    } else if (existing) {
      requireValue(!Object.hasOwn(edit, 'asset'), `${id} already has an asset.`);
      requireValue(placement && typeof placement === 'object' && !Array.isArray(placement), `${id} needs a placement object.`);
      byId.set(id, {...existing, placement: checkPlacement(existing.asset, {...existing.placement, ...placement}, id)});
    } else {
      byId.set(id, {id, asset, placement: checkPlacement(asset, placement, id)});
    }
  }
  const result = {version: sceneVersion, instances: [...byId.values()]};
  if (Object.hasOwn(request, 'title')) {
    if (request.title !== null) result.title = request.title;
  } else if (Object.hasOwn(current, 'title')) {
    result.title = current.title;
  }
  if (Object.hasOwn(request, 'lighting')) {
    if (request.lighting !== null) result.lighting = request.lighting;
  } else if (Object.hasOwn(current, 'lighting')) {
    result.lighting = current.lighting;
  }
  const geometry = Object.hasOwn(request, 'geometry') ? request.geometry : current.geometry;
  if (geometry !== undefined) result.geometry = geometry;
  const nextRoute = Object.hasOwn(request, 'route') ? request.route : current.route;
  if (nextRoute !== undefined && nextRoute !== null) result.route = nextRoute;
  return validateScene(result);
}

function walkRoute(stops) {
  if (!stops) return {route: route.map(point => [...point]), routeStops: route.map((_, i) => legacyNames.get(i) ?? null)};

  const points = [stops[0].point];
  const routeStops = [stops[0].name];
  for (let i = 1; i < stops.length; i++) {
    const from = onRoute(stops[i - 1].point);
    const to = onRoute(stops[i].point);
    if (from !== null && to !== null) {
      const direction = Math.sign(to - from);
      for (let index = direction > 0 ? Math.floor(from) + 1 : Math.ceil(from) - 1;
        direction * index < direction * to; index += direction) {
        points.push([...route[index]]);
        routeStops.push(null);
      }
    }
    points.push(stops[i].point);
    routeStops.push(stops[i].name);
  }
  return {route: points, routeStops};
}

export function getLayout(scene) {
  const validated = validateScene(scene);
  if (validated.geometry) {
    const {geometry, route: stops} = validated;
    const points = [stops[0].point];
    const routeStops = [stops[0].name];
    for (let i = 1; i < stops.length; i++) {
      const path = authoredPath(geometry, stops[i - 1].point, stops[i].point);
      points.push(...path.slice(1));
      routeStops.push(...path.slice(2).map(() => null), stops[i].name);
    }
    return {geometry, route: points, routeStops};
  }
  const byId = new Map(validated.instances.map(({id, placement}) => [id, placement]));
  const modelStairs = {entrance: byId.get('entrance'), courtyard: byId.get('courtyard-stair'), terrace: byId.get('terrace-stair')};
  return {
    stairs: modelStairs,
    landings: {courtyard: byId.get('courtyard-landing'), turn: byId.get('turn'), midpoint: byId.get('midpoint')},
    middleArch: byId.get('middle-arch'),
    terraceLamp: byId.get('terrace-lamp'),
    ...walkRoute(validated.route),
  };
}

function onFloors(floors, from, to) {
  const intervals = floors.map(floor => floorInterval(floor, from, to))
    .filter(Boolean).sort(([a], [b]) => a - b);
  let covered = 0;
  for (const [start, end] of intervals) {
    if (start > covered + 1e-7) break;
    covered = Math.max(covered, end);
  }
  return covered >= 1 - 1e-7;
}

function authoredPath({floors, stairs}, from, to) {
  const nodes = [from, to, ...stairs.flatMap(stair => [stair.from, stair.to])];
  const paths = new Map([[0, [from]]]);
  const queue = [0];
  for (const index of queue) {
    if (index === 1) return paths.get(index);
    for (const [next, end] of nodes.entries()) {
      if (paths.has(next)) continue;
      const paired = index >= 2 && next >= 2 && Math.floor(index / 2) === Math.floor(next / 2);
      if (!paired && !onFloors(floors, nodes[index], end)) continue;
      const path = paths.get(index);
      const stair = paired ? stairs[Math.floor(index / 2) - 1] : null;
      if (stair?.treadRuns) {
        const {axis, edges, heights} = stairProfile(stair);
        const pointAt = (along, z) => axis === 0
          ? [along, stair.from[1], z]
          : [stair.from[0], along, z];
        const profile = [stair.from];
        for (let i = 0; i < stair.count; i++) {
          profile.push(pointAt(edges[i], heights[i + 1]), pointAt(edges[i + 1], heights[i + 1]));
        }
        if (index % 2) profile.reverse();
        paths.set(next, [...path, ...profile.slice(1)]);
      } else {
        paths.set(next, path.at(-1).every((value, axis) => value === end[axis])
          ? path : [...path, end]);
      }
      queue.push(next);
    }
  }
  return null;
}

function checkGeometry(value) {
  checkFields(value, ['floors', 'stairs', 'camera'], 'Geometry');
  requireValue(Array.isArray(value.floors) && value.floors.length > 0 && value.floors.length <= 64,
    'Geometry needs 1 to 64 floors.');
  requireValue(Array.isArray(value.stairs) && value.stairs.length <= 32, 'Geometry needs up to 32 stairs.');
  const ids = new Set();
  function placement(item, label, fields) {
    checkFields(item, ['id', ...fields], label);
    const {id, ...rest} = item;
    checkId(id);
    requireValue(!ids.has(id), `Duplicate geometry ID ${id}.`);
    ids.add(id);
    return rest;
  }
  const floors = value.floors.map(item => {
    const floor = placement(item, 'Floor', ['anchor', 'width', 'depth', 'slab']);
    const anchor = point(floor.anchor, `${item.id} anchor`);
    return {id: item.id, anchor, width: bounded(floor.width, 0.1, 850 - anchor[0], `${item.id} width`),
      depth: bounded(floor.depth, 0.1, 420 - anchor[1], `${item.id} depth`),
      slab: bounded(floor.slab, 0.1, anchor[2] + 100, `${item.id} slab`)};
  });
  const stairs = value.stairs.map(item => {
    const {profile, treadRuns, finish, ...parameters} = placement(item, 'Authored stair',
      ['from', 'to', 'width', 'count', 'profile', 'treadRuns', 'finish']);
    const stair = checkPlacement('stair', parameters, item.id);
    if (Object.hasOwn(item, 'finish')) {
      requireValue(finish === 'stone', `${item.id} finish must be stone.`);
      stair.finish = finish;
    }
    if (Object.hasOwn(item, 'profile')) {
      requireValue(profile === 'ramp', `${item.id} profile must be ramp.`);
      requireValue(!Object.hasOwn(item, 'treadRuns'), `${item.id} ramp cannot have treadRuns.`);
      stair.profile = profile;
    }
    if (Object.hasOwn(item, 'treadRuns')) {
      requireValue(Array.isArray(treadRuns) && treadRuns.length === stair.count &&
        Array.from(treadRuns).every(run => Number.isFinite(run) && run > 1e-7),
        `${item.id} treadRuns needs one positive length per tread.`);
      const length = Math.hypot(stair.to[0] - stair.from[0], stair.to[1] - stair.from[1]);
      const total = treadRuns.reduce((sum, run) => sum + run, 0);
      requireValue(Math.abs(total - length) <= 1e-7,
        `${item.id} treadRuns must add up to the stair run.`);
      stair.treadRuns = [...treadRuns];
    }
    const axis = stair.from[0] === stair.to[0] ? 0 : 1;
    const runAxis = 1 - axis;
    const half = stair.width / 2;
    requireValue(stair.from[axis] - half >= 0 && stair.from[axis] + half <= [850, 420][axis],
      `${item.id} stair width must stay inside the scene.`);
    requireValue([stair.from, stair.to].every(end => {
      const side = offset => end.map((value, index) => index === axis ? value + offset : value);
      return onFloors(floors, side(-half), side(half));
    }), `${item.id} stair endpoints need floor support across the stair width.`);
    const runLow = Math.min(stair.from[runAxis], stair.to[runAxis]);
    const runHigh = Math.max(stair.from[runAxis], stair.to[runAxis]);
    for (const floor of floors) {
      const sizes = [floor.width, floor.depth];
      if (floor.anchor[2] <= stair.from[2] || floor.anchor[2] > stair.to[2]) continue;
      const overlaps = (i, low, high) => Math.min(high, floor.anchor[i] + sizes[i]) - Math.max(low, floor.anchor[i]) > 1e-7;
      requireValue(!overlaps(axis, stair.from[axis] - half, stair.from[axis] + half) || !overlaps(runAxis, runLow, runHigh),
        `${item.id} needs a clear stair opening in ${floor.id}.`);
    }
    return {id: item.id, ...stair};
  });
  if (!Object.hasOwn(value, 'camera')) return {floors, stairs};
  checkFields(value.camera, ['yaw', 'elevation'], 'Geometry camera');
  const {yaw = 0, elevation = 0} = value.camera;
  return {floors, stairs, camera: {
    yaw: bounded(yaw, -25, 25, 'Camera yaw'),
    elevation: bounded(elevation, -15, 20, 'Camera elevation'),
  }};
}

export function importApproach(proposal) {
  const normalized = proposal?.contactNormalized;
  const surfaces = proposal?.source?.surfaces;
  requireValue(normalized && surfaces && Array.isArray(normalized.edges) && Array.isArray(normalized.clearFlightOpenings),
    'The approach needs contact-normalized geometry.');
  const arrival = 'arrival-gate';
  const crown = 'middle-arrival';
  const before = normalized.edges.find(edge => edge.start === arrival && edge.kind === 'floor');
  const flight = normalized.edges.find(edge => edge.start === before?.end && edge.end === crown && edge.kind === 'stair');
  const after = normalized.edges.find(edge => edge.start === crown && edge.kind === 'floor');
  const opening = normalized.clearFlightOpenings.find(item => item.floor === after?.support);
  requireValue(before && flight && after && opening && normalized.points && normalized.namedStops,
    'The approach needs a connected arrival, stair and middle landing.');
  const scale = 24;
  const units = value => Math.round(value * scale * 1e6) / 1e6;
  const world = ([x, y, z]) => [40 + units(x), units(y), units(z)];
  const floor = (id, [x, y, z], width, depth, slab) => ({id, anchor: world([x, y, z]),
    width: units(width), depth: units(depth), slab: units(slab)});
  const lower = surfaces[before.support];
  const middle = surfaces[after.support];
  requireValue(lower && middle, 'The approach needs arrival and middle floors.');
  const [x, y, z] = middle.anchor;
  const [width, depth] = middle.size;
  const [left, right] = opening.x;
  const [back, front] = opening.y;
  requireValue(x < left && left < right && right < x + width && y < back && Math.abs(front - y - depth) < 1e-7,
    'The middle stair opening must reach the low floor edge.');
  const floors = [
    floor(before.support, lower.anchor, ...lower.size, lower.thickness ?? 0.28),
    floor(after.support, [x, y, z], width, back - y, middle.thickness),
    floor(`${after.support}-left`, [x, back, z], left - x, front - back, middle.thickness),
    floor(`${after.support}-right`, [right, back, z], x + width - right, front - back, middle.thickness),
  ];
  const stairs = [{id: flight.support, from: world(normalized.points[flight.start]), to: world(normalized.points[crown]),
    count: flight.count, width: units(flight.width)}];
  const stops = [arrival, crown].map(id => ({name: normalized.namedStops[id], point: world(normalized.points[id])}));
  return validateScene({version: sceneVersion, instances: [], geometry: {floors, stairs}, route: stops});
}
