const base = ['#c3a686', '#8a6b5b', '#634e49'];
const timber = ['#94705e', '#684d44', '#4d3b39'];
const backTiles = ['#676675', '#74727f'];
const frontTiles = ['#494f60', '#535968'];
const bays = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

function roofPanels({anchor, scale}, surface) {
  const [x, y, z] = anchor;
  const point = (distance, depth, height) => [
    x + distance * scale, y + depth * scale, z + height * scale,
  ];
  for (let i = 0; i < bays.length - 1; i++) {
    const left = bays[i];
    const right = bays[i + 1];
    const ridge = offset => point(offset * .84, 0, 25 + 2 * (offset / 20) ** 4);
    const eave = (offset, side) => point(offset, side * 14, 15 + 5 * (offset / 20) ** 4);
    const nearLeft = eave(left, 1);
    const nearRight = eave(right, 1);
    surface([eave(left, -1), ridge(left), ridge(right), eave(right, -1)], backTiles[i % 2]);
    surface([ridge(left), nearLeft, nearRight, ridge(right)], frontTiles[i % 2]);
    surface([nearLeft, nearRight, point(right, 13.5, 13 + 5 * (right / 20) ** 4),
      point(left, 13.5, 13 + 5 * (left / 20) ** 4)], '#302e3d');
    surface([ridge(left), ridge(right), point(right * .84, 1.3, 24 + 2 * (right / 20) ** 4),
      point(left * .84, 1.3, 24 + 2 * (left / 20) ** 4)], '#999097');
  }
}

export function drawJoseonRoof({block, surface}, placement) {
  const {anchor: [x, y, z], scale} = placement;
  block(x - 15 * scale, y - 9 * scale, 30 * scale, 18 * scale, z + 2 * scale, z, base);
  for (const [dx, dy] of [[-12, -6], [9, -6], [-12, 6], [9, 6]]) {
    block(x + dx * scale, y + dy * scale, 3 * scale, 3 * scale,
      z + 17 * scale, z + 2 * scale, timber);
  }
  roofPanels(placement, ([a, b, c, d], fill) => {
    surface([a, b, c], fill);
    surface([a, c, d], fill);
  });
}

export function joseonRoofContains(project, context, placement, x, y) {
  let contains = false;
  roofPanels(placement, points => {
    if (contains) return;
    const path = new Path2D();
    const [first, ...rest] = points.map(point => project(...point));
    path.moveTo(...first);
    for (const point of rest) path.lineTo(...point);
    path.closePath();
    contains = context.isPointInPath(path, x, y);
  });
  return contains;
}
