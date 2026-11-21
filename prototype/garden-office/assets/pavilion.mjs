const wood = ['#a87853', '#ae7e58', '#a37553'];

export function drawPond({surface}, {anchor: [x, y, z], width, depth}) {
  surface([[x,y,z],[x+width,y,z],[x+width,y+depth,z],[x,y+depth,z]], '#385e60');
  for (const [across, along, length] of [[.12,.22,.15],[.60,.32,.19],[.17,.53,.11],[.70,.61,.20],[.31,.82,.16]]) {
    const left = x + across * width;
    const row = y + along * depth;
    const size = length * width;
    const ripple = Math.min(1.6, depth * .012);
    surface([[left,row,z],[left+size,row,z],[left+size*.86,row+ripple,z],
      [left+size*.10,row+ripple,z]], '#7fa69a66');
  }
}

export function drawBoardwalk({surface}, {anchor: [x, y, z], width, depth}) {
  const runsAlongY = depth >= width;
  const length = runsAlongY ? depth : width;
  const count = Math.max(1, Math.ceil(length / 9));
  const point = (along, across) => runsAlongY ? [x+across,y+along,z] : [x+along,y+across,z];
  const cross = runsAlongY ? width : depth;
  for (let i = 0; i < count; i++) {
    const start = length * i / count;
    const end = length * (i+1) / count;
    surface([point(start,0),point(end,0),point(end,cross),point(start,cross)], wood[i % wood.length]);
    if (i) {
      const edge = start + Math.min(.55, (end-start)*.12);
      surface([point(start,0),point(edge,0),point(edge,cross),point(start,cross)], '#694a3d66');
    }
  }
}

function drawCurvedRoof({block, surface}, {anchor: [x, y, z], span, depth, height}) {
  const bays = 8;
  const sections = [[0, .70], [.23, .76], [.5, .88], [.77, .76], [1, .70]];
  const tiles = ['#4d5857', '#565e5e', '#606966', '#565f60'];
  const lift = bay => .12 * (2 * bay / bays - 1) ** 4;
  const point = (bay, [row, level]) => [x + span * bay / bays, y + depth * row, z + height * (level + lift(bay))];
  const post = Math.min(4.2, span * .0625, depth * .0625);
  const lip = Math.min(2.2, height * .055);
  for (const row of [.28, .82]) {
    for (const col of [span * .10, span * .90 - post]) {
      const bay = (col < span / 2 ? col + post : col) * bays / span;
      const leftBay = Math.floor(bay);
      const rise = lift(leftBay) + (lift(leftBay + 1) - lift(leftBay)) * (bay - leftBay);
      const outerRow = row < .5 ? row : row + post / depth;
      const strip = sections.findIndex(([end]) => end > outerRow);
      const [[start, low], [end, high]] = sections.slice(strip - 1, strip + 1);
      const level = low + (high - low) * (outerRow - start) / (end - start);
      block(x + col, y + depth * row, post, post, z + height * (level + rise) - lip / 2, z,
        ['#9e7151','#754d39','#593c31']);
    }
  }
  for (let bay = 0; bay < bays; bay++) {
    for (let strip = 0; strip < tiles.length; strip++) {
      const panel = [point(bay, sections[strip]), point(bay + 1, sections[strip]),
        point(bay + 1, sections[strip + 1]), point(bay, sections[strip + 1])];
      surface(panel, tiles[strip]);
      surface(panel.map(([px, py, pz]) => [px, py, pz - lip]), '#43494a');
    }
    for (const edge of [sections[0], sections.at(-1)]) {
      const left = point(bay, edge);
      const right = point(bay + 1, edge);
      surface([left, right, [right[0], right[1], right[2] - lip], [left[0], left[1], left[2] - lip]], '#43494a');
    }
  }
  for (const end of [0, bays]) {
    const base = point(end, sections[0])[2] - lip;
    for (let strip = 0; strip < tiles.length; strip++) {
      const back = point(end, sections[strip]);
      const front = point(end, sections[strip + 1]);
      surface([back, front, [front[0], front[1], base], [back[0], back[1], base]], '#644b45', [end ? 1 : -1, 0]);
    }
  }
}

export function drawPavilionRoof(draw, placement) {
  if (placement.profile === 'curved') return drawCurvedRoof(draw, placement);
  const {block, surface} = draw;
  const {anchor: [x, y, z], span, depth, height} = placement;
  const right = x + span;
  const front = y + depth;
  const middle = y + depth / 2;
  const apex = z + height;
  const eave = z + height * .70;
  const post = Math.min(4.2, span * .0625, depth * .0625);
  for (const row of [y + depth*.28, y + depth*.82]) {
    for (const col of [x + span*.10, x + span*.90 - post]) {
      block(col, row, post, post, eave, z, ['#9e7151','#754d39','#593c31']);
    }
  }
  surface([[right,y,eave],[right,middle,apex],[right,front,eave]], '#644b45');
  surface([[x,y,eave],[x,middle,apex],[x,front,eave]], '#644b45');
  surface([[x,y,eave],[right,y,eave],[right,middle,apex],[x,middle,apex]], '#4d5857');
  surface([[x,middle,apex],[right,middle,apex],[right,front,eave],[x,front,eave]], '#606966');
  const lip = Math.min(2.2, height*.055);
  surface([[x,front,eave],[right,front,eave],[right,front,eave-lip],[x,front,eave-lip]], '#43494a');
  for (let i = 1; i < 9; i++) {
    const start = x + span * i / 9;
    const end = start + Math.min(.65, span*.012);
    surface([[start,middle,apex],[end,middle,apex],[end,front,eave],[start,front,eave]], '#283d4266');
  }
}

export function drawStonePaving({surface}, {anchor: [x, y, z], width, depth, finish = 'stone'}) {
  if (finish === 'garden') {
    const right = x + width;
    const front = y + depth;
    const border = Math.min(2, width / 4, depth / 4);
    const rectangle = (left, back, right, front, fill) =>
      surface([[left,back,z],[right,back,z],[right,front,z],[left,front,z]], fill);
    rectangle(x + border, y + border, right - border, front - border, '#82835e');
    rectangle(x, y, right, y + border, '#626648');
    rectangle(x, front - border, right, front, '#626648');
    rectangle(x, y + border, x + border, front - border, '#626648');
    rectangle(right - border, y + border, right, front - border, '#626648');
    return;
  }
  const court = finish === 'court';
  surface([[x,y,z],[x+width,y,z],[x+width,y+depth,z],[x,y+depth,z]],
    court ? '#c5aa87' : '#87979a');
  const acrossX = depth >= width;
  const run = acrossX ? depth : width;
  const count = Math.ceil(run / (court ? 22 : 13));
  for (let i = 1; i < count; i++) {
    const edge = run * i / count;
    const joint = Math.min(.7, run / count * .12);
    const points = acrossX
      ? [[x,y+edge,z],[x+width,y+edge,z],[x+width,y+edge+joint,z],[x,y+edge+joint,z]]
      : [[x+edge,y,z],[x+edge+joint,y,z],[x+edge+joint,y+depth,z],[x+edge,y+depth,z]];
    surface(points, court ? '#8f765a88' : '#48595d88');
  }
}
