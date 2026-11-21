const timber = ['#9b6546', '#8e5e45', '#604330'];
const tabletop = ['#d4b279', '#ad7951', '#8b543b'];
const runner = ['#6f8f84', '#587b71', '#526c65'];
const seat = ['#a5b9a6', '#6c8b81', '#526c65'];
const backrest = ['#8fa69a', '#708d85', '#526b61'];

function localBlock(block, {anchor: [x, y, z], scale}) {
  return (left, back, width, depth, top, bottom, colors) => block(
    x + left * scale, y + back * scale, width * scale, depth * scale,
    z + top * scale, z + bottom * scale, colors,
  );
}

export function drawTable({block}, placement) {
  const box = localBlock(block, placement);
  const width = 139.2;
  const depth = 21.024;
  for (const y of [2.16, depth - 4.56]) {
    for (const x of [2.64, width - 5.28]) box(x, y, 2.16, 2.4, 12.96, 0, timber);
  }
  box(0, 0, width, depth, 15.12, 12.48, tabletop);
  box(4.32, 5.52, width - 8.64, depth - 11.04, 15.48, 15.12, runner);
}

export function drawChair({block}, placement) {
  const box = localBlock(block, placement);
  const width = 10.32;
  const depth = 10.08;
  for (const y of [0.6, 8.16]) {
    for (const x of [0.6, 8.16]) box(x, y, 1.4, 1.4, y === 8.16 ? 13.44 : 4.32, 0, timber);
  }
  box(0, 0, width, depth, 7.2, 4.32, seat);
  box(0, 8.16, width, 1.4, 13.44, 9, backrest);
}

export function furnitureContains(draw, project, context, placement, x, y) {
  const path = new Path2D();
  const face = points => {
    const [first, ...rest] = points.map(point => project(...point));
    path.moveTo(...first);
    for (const point of rest) path.lineTo(...point);
    path.closePath();
  };
  const block = (left, back, width, depth, top, bottom) => {
    const right = left + width;
    const front = back + depth;
    face([[left, back, top], [right, back, top], [right, front, top], [left, front, top]]);
    face([[left, front, top], [right, front, top], [right, front, bottom], [left, front, bottom]]);
    face([[right, back, top], [right, front, top], [right, front, bottom], [right, back, bottom]]);
  };
  draw({block}, placement);
  return context.isPointInPath(path, x, y);
}
