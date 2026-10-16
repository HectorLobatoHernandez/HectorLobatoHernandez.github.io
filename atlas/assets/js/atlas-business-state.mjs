// Fictional businesses belong to existing ground-floor bays of the navigation city.
const catalog=[
 [-90,-78,'RAMEN','NOODLE HOUSE','food','bowl','#ff6950'],[-50,-78,'NIGHT BAR','DRINKS · LATE','bar','glass','#f451b8'],[-10,-78,'TATTOO','INK · ART','shop','star','#ad83ff'],
 [10,-78,'KITCHEN','SEASONAL FOOD','food','fork','#71ffc4'],[50,-78,'BAKERY','BREAD · COFFEE','cafe','cup','#ffb449'],[90,-78,'BOOKS','READ · DISCOVER','shop','book','#48dfff'],
 [-90,67,'CAFÉ','COFFEE · TERRACE','cafe','cup','#ffa45e'],[-50,67,'BISTRO','TABLE · WINE','food','glass','#ff6f9f'],[-10,67,'FLOR','FLOWERS · PLANTS','shop','flower','#9cff72'],
 [10,67,'CLUB','SOUND · DANCE','club','note','#f56aff'],[50,67,'MUSIC','LIVE · SESSIONS','club','note','#5eeaff'],[90,67,'VINYL','RECORDS · SOUND','shop','record','#bfff58']
];
export function businessForBuilding(b){
 const row=catalog.find(r=>r[0]===b.x&&r[1]===b.z);if(!row)return null;
 const [x,z,name,subtitle,type,symbol,color]=row,side=z<0?1:-1;
 return {signStyle:['oval','ticket','diamond','arrow','marquee','wing'][catalog.indexOf(row)%6],id:'business-'+b.id,buildingId:b.id,district:b.district,name,subtitle,type,symbol,color,side,x,z:z+side*b.depth/2,yaw:side===1?0:Math.PI,width:Math.min(8,b.width-2),classification:'CONCEPTUAL_GROUND_FLOOR_BUSINESS'};
}
export function businessPoint(b,x,z){return [b.x+Math.cos(b.yaw)*x+Math.sin(b.yaw)*z,b.z-Math.sin(b.yaw)*x+Math.cos(b.yaw)*z]}
export function symbolPaths(type){
 const circle=(x,y,r,n=32)=>Array.from({length:n+1},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*r,y+Math.sin(i/n*Math.PI*2)*r]);
 const icons={cup:[[[.12,.35],[.72,.35],[.67,.75],[.24,.75],[.12,.35]],[[.72,.4],[.9,.4],[.9,.62],[.7,.62]],[[.17,.88],[.78,.88]],[[.3,.22],[.34,.1]],[[.5,.22],[.54,.1]]],
 bowl:[[[.08,.48],[.2,.78],[.8,.78],[.92,.48],[.08,.48]],[[.35,.4],[.3,.22],[.38,.1]],[[.55,.4],[.5,.22],[.58,.1]],[[.7,.28],[.96,.05]],[[.78,.33],[1,.12]]],
 glass:[[[.17,.12],[.83,.12],[.68,.53],[.5,.61],[.32,.53],[.17,.12]],[[.5,.61],[.5,.89]],[[.25,.9],[.75,.9]]],
 note:[[[.32,.73],[.32,.22],[.82,.1],[.82,.62]],circle(.2,.78,.12),circle(.7,.67,.12),[[.32,.35],[.82,.23]]],
 book:[[[.5,.25],[.15,.15],[.08,.2],[.08,.8],[.5,.9],[.92,.8],[.92,.2],[.85,.15],[.5,.25],[.5,.9]]],
 record:[circle(.5,.5,.43),circle(.5,.5,.14),[[.2,.4],[.24,.27],[.38,.18]],[[.75,.62],[.7,.75],[.58,.8]]],
 flower:[circle(.5,.36,.13),...Array.from({length:5},(_,i)=>circle(.5+Math.sin(i*1.256)*.23,.36+Math.cos(i*1.256)*.23,.13)),[[.5,.64],[.5,.96]],[[.5,.83],[.25,.68]]],
 fork:[[[.2,.1],[.2,.4],[.45,.4],[.45,.1]],[[.32,.1],[.32,.95]],[[.82,.1],[.68,.42],[.82,.49],[.82,.95]]],
 star:[Array.from({length:11},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,r=i%2?.2:.47;return [.5+Math.cos(a)*r,.5+Math.sin(a)*r]})]};return icons[type]||icons.star;
}

export function businessFixtures(b){
 const parts=[],patrons=[];
  const place=(mat,x,y,z,w,h,d)=>{const [wx,wz]=businessPoint(b,x,z);parts.push({mat,x:wx,y,z:wz,w,h,d,rotation:b.yaw})};
  // The open bay is physically recessed into its parent building, behind its facade line.
  place('wood',0,.45,-1.8,b.width,.16,3.8);place('iron',0,1.65,-3.6,b.width,2.5,.16);
  for(const side of [-1,1])place('wood',side*b.width/2,1.65,-1.8,.14,2.5,3.8);
  for(const x of [-b.width/2, -1.1, 1.1, b.width/2])place('iron',x,1.65,.03,.075,2.5,.1);
  place('iron',0,2.75,.03,b.width,.08,.12);
  place('cream',0,2.78,-1.75,b.width,.1,3.6);place('warm',0,2.65,-1.75,b.width*.7,.05,.7);
  place(b.type==='club'?'iron':'red',0,2.6,.48,b.width+.5,.13,1.25);
  for(let stripe=0;stripe<8;stripe++)place(stripe%2?'cream':'red',-b.width/2+(stripe+.5)*b.width/8,2.68,.5,b.width/8,.025,1.22);
  for(const dx of [-b.width*.4,b.width*.4])place('iron',dx,2.95,.45,.06,.6,.85);
  for(const side of [-1,1])for(let k=0;k<3;k++)place('leaf',side*(b.width/2+.15)+(k-1)*.15,.93+Math.abs(k-1)*.12,.8,.18,.7,.18);
  if(b.type==='club'){
   place('wood',0,1.05,-2.75,3,1,.7);
   for(const dx of [-2.8,2.8]){place('iron',dx,1.5,-2.8,.65,1.9,.6);place('cyan',dx,1.65,-2.46,.4,.07,.03)}
   place('pink',0,1.45,-2.34,2.8,.05,.04);
   for(let j=0;j<16;j++){const [x,z]=businessPoint(b,-2.65+(j%8)*.75,-1.8+Math.floor(j/8)*1.1);patrons.push({x,z,baseY:.5,angle:b.yaw,mode:'dance',phase:j*.9})}
  }else if(b.type==='shop'){
   for(let shelf=0;shelf<3;shelf++){place('wood',0,.8+shelf*.65,-3.3,b.width*.85,.08,.55);for(let k=0;k<7;k++)place(k%2?'cream':'cyan',-2.6+k*.8,1+shelf*.65,-3.25,.35,.35,.3)}
   place('wood',b.width*.28,1,-1,1.5,1,.7);
  }else{
   place('wood',0,1.05,-2.85,b.width*.8,1,.7);place('cream',0,1.6,-3.4,b.width*.7,.65,.08);
   // Connected, shallow terrace remains between the facade and the carriageway.
   place('stone',0,-.04,2.2,b.width+.4,.16,3.3);
   for(let t=0;t<3;t++){const tx=-2.5+t*2.5;place('wood',tx,.68,2.2,1.1,.1,1.1);place('iron',tx,.3,2.2,.1,.7,.1);for(const side of [-1,1]){place('wood',tx,.3,2.2+side*.85,.55,.1,.55);place('iron',tx,.65,2.2+side*1.1,.55,.6,.07);const [x,z]=businessPoint(b,tx,2.2+side*.85);patrons.push({x,z,angle:b.yaw+(side>0?Math.PI:0),mode:'sit',phase:t+side})}}
  }
  for(const side of [-1,1]){place('stone',side*(b.width/2+.15),.2,.8,.45,.55,.6);place('leaf',side*(b.width/2+.15),.65,.8,.65,.65,.65)}
 return {parts,patrons};
}
