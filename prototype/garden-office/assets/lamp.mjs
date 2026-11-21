export const lampGlass = '#ffa957';
const brass = ['#dba26d','#b5745b','#80515d'];
const cap = ['#f3bf91','#ae695e','#7f4951'];

export function lampCenter({anchor, scale = 1}) {
  const [x,y,z] = anchor;
  return [x,y,z+45*scale];
}

export function drawLamp({block, project, glow, disc}, placement) {
  const {anchor:[x,y,z], scale = 1} = placement;
  const piece = (ox,oy,w,d,top,base,skin) =>
    block(x+ox*scale,y+oy*scale,w*scale,d*scale,z+top*scale,z+base*scale,skin);
  const center = lampCenter(placement);
  const [lx,ly] = project(...center);
  glow(lx,ly,96*scale,'#ffb96075');
  piece(-10,-6,20,16,10,0,brass);
  piece(-6,-3,12,11,57,10,['#f7cf8d','#b68265','#664650']);
  disc(lx,ly,9*scale,12*scale,lampGlass,center);
  disc(lx-scale,ly-scale,4.5*scale,8*scale,'#fff1b7',center);
  piece(-12,-8,24,21,64,57,brass);
  piece(-7,-5,15,15,71,64,cap);
}
