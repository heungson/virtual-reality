export function stairProfile({from, to, count, treadRuns}) {
  const axis = from[0] === to[0] ? 1 : 0;
  const run = to[axis] - from[axis];
  const rise = to[2] - from[2];
  let offset = 0;
  const edges = [from[axis]];
  const heights = [from[2]];
  for (let i = 1; i < count; i++) {
    if (treadRuns) offset += treadRuns[i - 1];
    edges.push(from[axis] + (treadRuns ? Math.sign(run) * offset : run * i / count));
    heights.push(from[2] + rise * i / count);
  }
  edges.push(to[axis]);
  heights.push(to[2]);
  return {axis, run, edges, heights};
}

const stone = ['#f3bf91','#ae695e','#7f4951'];

export function drawStair({block}, {from, to, count, width = 34}) {
  const [x,y,z] = from;
  const [endX,endY,endZ] = to;
  const dx = (endX - x) / count;
  const dy = (endY - y) / count;
  for (let i = count-1; i >= 0; i--) {
    const top = z + (endZ-z)*(i+1)/count;
    if (dx !== 0) block(x+(dx > 0 ? i : i+1)*dx,y-width/2,Math.abs(dx)+.15,width,top,top-15,stone);
    else block(x-width/2,y+(dy > 0 ? i : i+1)*dy,width,Math.abs(dy)+.1,top,top-11,stone);
  }
}
