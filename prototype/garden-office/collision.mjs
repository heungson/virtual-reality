function axisInterval(start, delta, min, max) {
  if (delta === 0) {
    return start > min && start < max ? [-Infinity, Infinity] : null;
  }
  const a = (min - start) / delta;
  const b = (max - start) / delta;
  return [Math.min(a, b), Math.max(a, b)];
}

function intersect(a, b) {
  if (!a || !b) return null;
  const enter = Math.max(a[0], b[0]);
  const exit = Math.min(a[1], b[1]);
  return enter < exit ? [enter, exit] : null;
}

function circleInterval(x, z, dx, dz, radius) {
  const speed = dx * dx + dz * dz;
  const offset = x * x + z * z - radius * radius;
  if (speed === 0) return offset < 0 ? [-Infinity, Infinity] : null;
  const along = x * dx + z * dz;
  const cross = x * dz - z * dx;
  const discriminant = speed * radius * radius - cross * cross;
  if (discriminant <= 0) return null;
  const root = Math.sqrt(discriminant);
  return [(-along - root) / speed, (-along + root) / speed];
}

// Positions use foot height. Boxes use their center and full dimensions.
// Positive yaw rotates local +x toward world +z.
export function sweepAvatar(from, to, solids, {radius, height}) {
  let hit = null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;

  for (const {id, x, y, z, width, height: boxHeight, depth, yaw = 0} of solids) {
    const halfHeight = boxHeight / 2;
    const vertical = intersect(
      [0, hit?.t ?? 1],
      axisInterval(from.y, dy, y - halfHeight - height, y + halfHeight),
    );
    if (!vertical) continue;

    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const localX = (from.x - x) * cos + (from.z - z) * sin;
    const localZ = (from.z - z) * cos - (from.x - x) * sin;
    const localDx = dx * cos + dz * sin;
    const localDz = dz * cos - dx * sin;
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const wideX = axisInterval(localX, localDx, -halfWidth - radius, halfWidth + radius);
    const wideZ = axisInterval(localZ, localDz, -halfDepth - radius, halfDepth + radius);
    const broad = intersect(vertical, intersect(wideX, wideZ));
    if (!broad) continue;

    // The exact footprint is two strips and four corner discs.
    const stripX = axisInterval(localX, localDx, -halfWidth, halfWidth);
    const stripZ = axisInterval(localZ, localDz, -halfDepth, halfDepth);
    let first = Math.min(
      intersect(broad, stripX)?.[0] ?? Infinity,
      intersect(broad, stripZ)?.[0] ?? Infinity,
    );
    for (const cornerX of [-halfWidth, halfWidth]) {
      for (const cornerZ of [-halfDepth, halfDepth]) {
        const corner = circleInterval(localX - cornerX, localZ - cornerZ, localDx, localDz, radius);
        first = Math.min(first, intersect(broad, corner)?.[0] ?? Infinity);
      }
    }
    if (first < Infinity) hit = {t: first, id};
  }
  return hit;
}
