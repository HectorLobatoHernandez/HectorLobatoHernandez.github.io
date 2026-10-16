// Inspection positions in the source model coordinate system (metres, glTF Y-up).
// These are presentation cameras, independent of any installed lighting design.
export const projectViews={
 'mar-salada':{light:{center:[-20,0,-12],size:[25,4,15]},poses:[{eye:[-15,1.65,-12],target:[-27,1.45,-13]},{eye:[-28,1.65,-14],target:[-16,1.45,-8]}]},
 'can-furnet-club':{light:{center:[13,0,-15],size:[10,3.4,9]},poses:[{eye:[10,1.6,-10.7],target:[13,1.4,-18.2]},{eye:[16,1.6,-18],target:[9,1.4,-13]}]},
 'playa-soleil-bora-bora':{light:{center:[13,0,-11],size:[18,3.24,18]},poses:[{eye:[8,1.75,-3],target:[14,1.4,-17]},{eye:[18.5,1.75,-4],target:[12,1.4,-17]}],
  // User-identified uses; boxes frame source components and do not redraw the venue.
  zones:[{id:'main-dance-floor',name:'Main dance floor',type:'interior',bounds:[[3.34,0,-21.34],[22.84,3.24,-.83]]},{id:'exterior-01',name:'Exterior 01',type:'exterior',bounds:[[7,0,.2],[23,3.2,10]]},{id:'exterior-02',name:'Exterior 02',type:'exterior',bounds:[[-14.1,0,11],[23,2.8,18]]}]},
 'private-production-studio-canada':{light:{center:[1.8,0,-3],size:[4,3,6]},poses:[{eye:[1.8,1.45,-.8],target:[1.8,1.3,-4.7]},{eye:[1.8,1.45,-4.8],target:[1.8,1.3,-.8]}]},
 'private-production-studio-sta-eulalia':{light:{center:[3.3,0,-3.9],size:[4,3,4]},poses:[{eye:[3.25,1.5,-2.7],target:[3.25,1.35,-5.3]},{eye:[3.25,1.5,-5],target:[3.25,1.35,-2.7]}]},
 'acoustic-studio-italy':{light:{center:[2,0,-2.4],size:[4,2.3,5]},poses:[{eye:[1.6,1.5,-.65],target:[1.8,1.25,-4.4]},{eye:[1.7,1.5,-4.35],target:[2,1.25,-.7]}]}
};
