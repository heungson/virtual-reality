export const stairs = {
  entrance: {from:[110,336,2],to:[232,336,44],count:12},
  courtyard: {from:[262,104,44],to:[262,76,94],count:7,width:32},
  terrace: {from:[400,76,94],to:[603,76,224],count:15},
};

export const landings = {
  courtyard: {anchor:[246,104,44],width:32,depth:145,slab:18},
  turn: {anchor:[247,59,94],width:92,depth:37,slab:17,trim:true},
  midpoint: {anchor:[333,58,94],width:77,depth:36,slab:5,trim:true},
};

export const middleArch = {anchor:[363,61,94],span:38,height:43};
export const terraceLamp = {anchor:[717,61,225],scale:1};
export const route = [
  [68,336,2], stairs.entrance.from, stairs.entrance.to, [262,336,44],
  stairs.courtyard.from, stairs.courtyard.to, stairs.terrace.from, stairs.terrace.to,
  [662,76,225], [705,76,225],
];
