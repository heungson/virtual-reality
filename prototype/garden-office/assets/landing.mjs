const stone = ['#e5a27d','#9d5c57','#663f4c'];

export function drawLanding({block}, {anchor, width, depth, slab = 15, trim = false}) {
  const [x,y,z] = anchor;
  block(x,y,width,depth,z,z-slab,stone);
  if (trim) block(x+4,y+3,width-8,2,z+.35,z,['#f7c999','#cb8c70','#80515d']);
}
