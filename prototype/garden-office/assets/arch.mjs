const clay = ['#d39572','#9f625b','#68434d'];
const stone = ['#f2bd8b','#c18468','#986157'];

export function drawArch({block,surface}, {anchor, span, height}) {
  const [x,y,z] = anchor;
  const radius = span/2;
  const spring = z+height-radius;
  const thickness = span*.14;
  block(x-radius-thickness,y-4,thickness,8,spring,z,clay);
  block(x+radius,y-4,thickness,8,spring,z,clay);
  block(x-radius-thickness-2,y-6,thickness+4,12,z+4,z,stone);
  block(x+radius-2,y-6,thickness+4,12,z+4,z,stone);
  for (let i=0; i<9; i++) {
    const a=i*Math.PI/9+.018;
    const b=(i+1)*Math.PI/9-.018;
    const point = (r,angle) => [x+Math.cos(angle)*r,y+4,spring+Math.sin(angle)*r];
    surface([point(radius,a),point(radius,b),point(radius+thickness,b),point(radius+thickness,a)],
      i===4 ? '#f6cb92' : i%2===0 ? '#dc9a77' : '#c88b71');
  }
}
