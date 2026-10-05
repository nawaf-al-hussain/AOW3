(()=>{var j9={rifle:{id:"rifle",name:"Rifle Squad",kind:"infantry",armorClass:"light",armor:{light:6,medium:4,heavy:2},health:120,price:120,cp:1,trainTime:4,speed:3.4,view:9,regen:0.6,captures:!0,radius:0.45,weapon:{damage:{light:16,medium:7,heavy:3},range:6.5,cooldown:1.1,accStatic:72,accWalk:48,splash:0,projectileSpeed:0},card:"/aow3/card-infantry.png",tint:"#8fb573",desc:"Cheap capture unit. Only infantry can seize depots."},mg:{id:"mg",name:"Machine Gunner",kind:"infantry",armorClass:"light",armor:{light:8,medium:5,heavy:2},health:150,price:180,cp:1,trainTime:5,speed:3.1,view:8.5,regen:0.6,captures:!0,radius:0.45,weapon:{damage:{light:30,medium:9,heavy:3},range:7,cooldown:0.9,accStatic:70,accWalk:52,splash:0,projectileSpeed:0},card:"/aow3/card-infantry.png",tint:"#b59b73",desc:"Shreds infantry. Nearly useless against armor."},rpg:{id:"rpg",name:"AT Team",kind:"infantry",armorClass:"light",armor:{light:5,medium:3,heavy:2},health:110,price:220,cp:1,trainTime:6,speed:3,view:8,regen:0.5,captures:!0,radius:0.45,weapon:{damage:{light:10,medium:34,heavy:42},range:7.5,cooldown:2.4,accStatic:78,accWalk:55,splash:1.1,projectileSpeed:14},card:"/aow3/card-mech.png",tint:"#c28f6d",desc:"Rocket team — punishes vehicles and tanks."},tank:{id:"tank",name:'MBT "Coyote"',kind:"vehicle",armorClass:"heavy",armor:{light:26,medium:20,heavy:14},health:640,price:520,cp:2,trainTime:11,speed:3.2,view:9,regen:0,captures:!1,radius:0.7,weapon:{damage:{light:42,medium:30,heavy:20},range:9,cooldown:1.8,accStatic:82,accWalk:62,splash:0.6,projectileSpeed:26},card:"/aow3/card-tank.png",tint:"#7d9c6a",desc:"Main battle tank. Heavy armor, solid all-round gun."},mammoth:{id:"mammoth",name:'Heavy Tank "Mammoth"',kind:"vehicle",armorClass:"heavy",armor:{light:44,medium:36,heavy:26},health:1050,price:880,cp:3,trainTime:16,speed:2.3,view:8.5,regen:0,captures:!1,radius:0.85,weapon:{damage:{light:64,medium:52,heavy:40},range:9.5,cooldown:2.6,accStatic:84,accWalk:60,splash:0.8,projectileSpeed:24},card:"/aow3/card-storm.png",tint:"#6d8a5e",desc:"Fortress on tracks. Slow, brutally expensive, nearly immune to infantry."},artillery:{id:"artillery",name:"Rocket Artillery",kind:"vehicle",armorClass:"light",armor:{light:10,medium:6,heavy:3},health:260,price:640,cp:2,trainTime:14,speed:2.6,view:11,regen:0,captures:!1,radius:0.65,weapon:{damage:{light:40,medium:38,heavy:46},range:16,cooldown:4.2,accStatic:62,accWalk:44,splash:2.6,projectileSpeed:12},card:"/aow3/card-rocket.png",tint:"#9c8a5e",desc:"Long-range splash damage. Fragile up close."},helicopter:{id:"helicopter",name:"Gunship",kind:"aircraft",armorClass:"medium",armor:{light:16,medium:12,heavy:8},health:340,price:560,cp:2,trainTime:12,speed:5.4,view:12,regen:0,captures:!1,radius:0.6,weapon:{damage:{light:34,medium:26,heavy:16},range:8.5,cooldown:1.2,accStatic:76,accWalk:68,splash:0.4,projectileSpeed:30},card:"/aow3/card-gunship.png",tint:"#739c93",desc:"Fast strike flyer. Ignores terrain, weak to AA-era MG fire."}},KQ=["rifle","mg","rpg","tank","mammoth","artillery","helicopter"],$Q={id:"hq",name:"Headquarters",health:4200,radius:2.2,view:13},y8={id:"depot",name:"Supply Depot",health:600,radius:1.6,view:8},v9={baseIncome:14,depotIncome:11,baseCP:10,depotCP:4,captureTimeNeutral:5,captureTimeEnemy:9};function DY(J,Q){if(Q<=0)return 0;if(J<Q){let K=0.9+0.1*((Q-J)/Q);return Math.min(1,Math.max(0.9,K))}let Z=0.9*(1+(Q-J)/(J+Q));return Math.min(0.9,Math.max(0.1,Z))}function E7(J,Q,Z){let K=J[Z],$=Q[Z];return K*DY($,K)}function SK(J,Q,Z,K,$){let X=Z?Q:J,Y=1-0.35*(K/$);return Math.min(0.98,Math.max(0.15,X/100*Y))}class XQ{grid;constructor(J){this.grid=J}h(J,Q,Z,K){let $=Math.abs(J-Z),X=Math.abs(Q-K);return $+X+(Math.SQRT2-2)*Math.min($,X)}find(J,Q,Z,K,$=!1){let X={x:Math.max(1,Math.min(W0-2,Math.round(J))),y:Math.max(1,Math.min(k0-2,Math.round(Q)))},Y={x:Math.max(1,Math.min(W0-2,Math.round(Z))),y:Math.max(1,Math.min(k0-2,Math.round(K)))};if(X.x===Y.x&&X.y===Y.y)return[{x:Z,y:K}];if(!$&&this.blocked(Y.x,Y.y)){let V=null,b=1e9;for(let P=1;P<=4&&!V;P++){for(let f=-P;f<=P;f++)for(let u=-P;u<=P;u++){let T=Y.x+u,p=Y.y+f;if(T<1||p<1||T>=W0-1||p>=k0-1||this.blocked(T,p))continue;let o=Math.hypot(T-Z,p-K);if(o<b)b=o,V={x:T,y:p}}if(V)break}if(!V)return[];Y.x=V.x,Y.y=V.y}if(!$&&this.blocked(X.x,X.y)){let V=this.nearestFree(X.x,X.y);if(V)X=V}let W=W0*k0,U=new Float32Array(W).fill(1/0),H=new Float32Array(W).fill(1/0),N=new Int32Array(W).fill(-1),F=new Uint8Array(W),G=(V,b)=>b*W0+V,D=G(X.x,X.y),R=G(Y.x,Y.y);U[D]=0,H[D]=this.h(X.x,X.y,Y.x,Y.y);let B=[[H[D],D]],q=(V)=>{B.push(V);let b=B.length-1;while(b>0){let P=b-1>>1;if(B[P][0]<=B[b][0])break;[B[P],B[b]]=[B[b],B[P]],b=P}},E=()=>{if(!B.length)return;let V=B[0],b=B.pop();if(B.length){B[0]=b;let P=0;for(;;){let f=P*2+1,u=f+1,T=P;if(f<B.length&&B[f][0]<B[T][0])T=f;if(u<B.length&&B[u][0]<B[T][0])T=u;if(T===P)break;[B[T],B[P]]=[B[P],B[T]],P=T}}return V},z=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],w=!1,k=0;while(B.length&&k++<60000){let[,V]=E();if(F[V])continue;if(F[V]=1,V===R){w=!0;break}let b=V%W0,P=V/W0|0;for(let[f,u]of z){let T=b+f,p=P+u;if(T<1||p<1||T>=W0-1||p>=k0-1)continue;let o=G(T,p);if(F[o])continue;if(!$&&this.blocked(T,p))continue;if(f!==0&&u!==0&&!$&&(this.blocked(b+f,P)||this.blocked(b,P+u)))continue;let m=U[V]+Math.hypot(f,u);if(m<U[o])U[o]=m,H[o]=m+this.h(T,p,Y.x,Y.y),N[o]=V,q([H[o],o])}}if(!w)return[];let C=[],_=R;while(_!==-1&&_!==D)C.push({x:_%W0+0.5-0.5,y:_/W0|0}),_=N[_];C.reverse();for(let V of C)V.x=Math.round(V.x)+0,V.y=V.y;let A=[],O=0;while(O<C.length){let V=C.length-1;for(;V>O+1;V--)if(this.los(C[O].x,C[O].y,C[V].x,C[V].y,$))break;if(A.push(C[V]),V===O)O++;else O=V;if(V===C.length-1)break}if(!A.length)A.push({x:Y.x,y:Y.y});return A}nearestFree(J,Q){for(let Z=1;Z<=5;Z++)for(let K=-Z;K<=Z;K++)for(let $=-Z;$<=Z;$++){let X=J+$,Y=Q+K;if(X<1||Y<1||X>=W0-1||Y>=k0-1)continue;if(!this.blocked(X,Y))return{x:X,y:Y}}return null}blocked(J,Q){return this.grid[Q*W0+J]===1}los(J,Q,Z,K,$){let X=Math.hypot(Z-J,K-Q),Y=Math.ceil(X*2);for(let W=0;W<=Y;W++){let U=Math.round(J+(Z-J)*W/Y),H=Math.round(Q+(K-Q)*W/Y);if(!$&&this.blocked(U,H))return!1}return!0}}var jK=20,W0=96,k0=96;class s7{units=[];buildings=[];projectiles=[];floats=[];booms=[];players;tick=0;time=0;nextId=1;winner=null;grid;explored;visible;pf;constructor(J=12345){this.grid=new Uint8Array(W0*k0),this.explored=new Uint8Array(W0*k0),this.visible=[new Uint8Array(W0*k0),new Uint8Array(W0*k0)],this.genTerrain(J),this.pf=new XQ(this.grid),this.players=[this.newPlayer(),this.newPlayer()],this.addBuilding("hq",1,8,k0/2),this.addBuilding("hq",2,W0-8,k0/2),this.addBuilding("depot",0,W0/2,14),this.addBuilding("depot",0,W0/2,k0-14),this.addBuilding("depot",0,W0/2,k0/2),this.spawn("rifle",1,12,k0/2-2),this.spawn("rifle",1,12,k0/2+2),this.spawn("mg",1,13,k0/2),this.spawn("rifle",2,W0-12,k0/2-2),this.spawn("rifle",2,W0-12,k0/2+2),this.spawn("mg",2,W0-13,k0/2)}newPlayer(){return{funds:350,income:v9.baseIncome,cpUsed:0,cpCap:v9.baseCP,queue:[],alive:!0}}genTerrain(J){let Q=J>>>0,Z=()=>{return Q=Q*1664525+1013904223>>>0,Q/4294967296};for(let K=0;K<90;K++){let $=6+Z()*(W0-12),X=6+Z()*(k0-12),Y=1.5+Z()*2.8;for(let W=Math.floor(X-Y);W<=X+Y;W++)for(let U=Math.floor($-Y);U<=$+Y;U++){if(U<1||W<1||U>=W0-1||W>=k0-1)continue;if(Math.hypot(U-$,W-X)<=Y&&Z()>0.25){if(Math.hypot(U-8,W-k0/2)<5||Math.hypot(U-(W0-8),W-k0/2)<5)continue;if(Math.hypot(U-W0/2,W-14)<3.5||Math.hypot(U-W0/2,W-(k0-14))<3.5||Math.hypot(U-W0/2,W-k0/2)<3.5)continue;this.grid[W*W0+U]=1}}}for(let K=0;K<W0;K++)this.grid[K]=1,this.grid[(k0-1)*W0+K]=1;for(let K=0;K<k0;K++)this.grid[K*W0]=1,this.grid[K*W0+W0-1]=1}addBuilding(J,Q,Z,K){let $=J==="hq"?$Q:y8,X={id:this.nextId++,defId:J,owner:Q,x:Z,y:K,hp:$.health,maxHp:$.health,captureT:0,captureBy:0};this.buildings.push(X);for(let Y=-2;Y<=2;Y++)for(let W=-2;W<=2;W++){let U=Math.round(Z+W),H=Math.round(K+Y);if(U>0&&H>0&&U<W0-1&&H<k0-1&&Math.hypot(W,Y)<=$.radius+0.5)this.grid[H*W0+U]=0}}spawn(J,Q,Z,K){let $=j9[J],X={id:this.nextId++,def:$,owner:Q,x:Z,y:K,hp:$.health,facing:Q===1?0:Math.PI,order:{kind:"idle"},cd:0,path:[],vx:0,vy:0};return this.units.push(X),X}cpUsed(J){let Q=0;for(let K of this.units)if(K.owner===J)Q+=K.def.cp;let Z=this.players[J-1];for(let K of Z.queue)Q+=j9[K.defId].cp;return Q}refreshEconomy(){for(let J of[1,2]){let Q=this.players[J-1],Z=0;for(let K of this.buildings)if(K.defId==="depot"&&K.owner===J)Z++;Q.income=v9.baseIncome+Z*v9.depotIncome,Q.cpCap=v9.baseCP+Z*v9.depotCP,Q.cpUsed=this.cpUsed(J)}}commandMove(J,Q,Z,K=!1){let $=0;for(let X of J){let Y=this.units.find((G)=>G.id===X);if(!Y)continue;let W=Math.floor($/8),U=$%8*(Math.PI/4)+W,H=W*1.2,N=Q+Math.cos(U)*H,F=Z+Math.sin(U)*H;Y.order={kind:K?"attackMove":"move",x:N,y:F},Y.targetId=void 0,Y.path=this.pf.find(Y.x,Y.y,N,F,Y.def.kind==="aircraft")??[],Y.dest={x:N,y:F},$++}}commandCapture(J,Q){for(let Z of J){let K=this.units.find((X)=>X.id===Z);if(!K||!K.def.captures)continue;let $=this.buildings.find((X)=>X.id===Q);if(!$)continue;K.order={kind:"capture",depotId:Q},K.targetId=void 0,K.path=this.pf.find(K.x,K.y,$.x,$.y,!1)??[],K.dest={x:$.x,y:$.y}}}commandAttack(J,Q){for(let Z of J){let K=this.units.find(($)=>$.id===Z);if(!K)continue;K.order={kind:"attackMove",x:void 0,y:void 0},K.targetId=Q,K.path=[]}}enqueue(J,Q){let Z=this.players[Q-1],K=j9[J];if(!K||!Z.alive)return!1;if(Z.funds<K.price)return!1;if(Z.queue.length>=8)return!1;if(Z.cpUsed+K.cp>Z.cpCap)return!1;return Z.funds-=K.price,Z.queue.push({defId:J,t:K.trainTime,total:K.trainTime}),this.refreshEconomy(),!0}step(J){if(this.winner!==null)return;this.time+=J,this.tick++;for(let K of[1,2]){let $=this.players[K-1];if($.funds+=$.income*J,$.queue.length){let X=$.queue[0];if(X.t-=J,X.t<=0){$.queue.shift();let Y=this.buildings.find((W)=>W.defId==="hq"&&W.owner===K);if(Y){let W=Y.x+(K===1?3.2:-3.2),U=this.spawn(X.defId,K,W,Y.y+(Math.random()*4-2));U.order={kind:"move",x:Y.x+(K===1?6.5:-6.5),y:U.y},U.path=this.pf.find(U.x,U.y,U.order.x,U.order.y,U.def.kind==="aircraft")??[]}this.refreshEconomy()}}}this.refreshEconomy(),this.updateUnits(J),this.updateProjectiles(J),this.updateDepots(J),this.updateVision();for(let K of this.booms)K.t+=J;this.booms=this.booms.filter((K)=>K.t<K.max);for(let K of this.floats)K.t+=J;this.floats=this.floats.filter((K)=>K.t<1.2);for(let K of this.units)if(K.def.regen>0&&K.hp<K.def.health)K.hp=Math.min(K.def.health,K.hp+K.def.regen*J);let Q=this.buildings.some((K)=>K.defId==="hq"&&K.owner===1&&K.hp>0),Z=this.buildings.some((K)=>K.defId==="hq"&&K.owner===2&&K.hp>0);if(!Q||!Z){this.winner=Q?1:2;for(let K of[1,2])this.players[K-1].alive=this.winner===K}}passable(J,Q,Z){if(J.def.kind==="aircraft")return!0;let K=Math.round(Q),$=Math.round(Z);if(K<0||$<0||K>=W0||$>=k0)return!1;return this.grid[$*W0+K]===0}updateUnits(J){for(let Q of this.units){if(Q.cd=Math.max(0,Q.cd-J),Q.targetId===void 0||!this.units.some(($)=>$.id===Q.targetId&&$.hp>0)){if(Q.targetId=void 0,Q.order.kind==="idle"||Q.order.kind==="attackMove"){let $=this.findTarget(Q);if($)Q.targetId=$.id}}let Z;if(Q.targetId===void 0&&(Q.order.kind==="attackMove"||Q.order.kind==="idle")){if(Z=this.buildings.find(($)=>$.hp>0&&$.owner!==Q.owner&&$.owner!==0&&Math.hypot($.x-Q.x,$.y-Q.y)<=Q.def.weapon.range+$.radius),!Z&&Q.order.kind==="attackMove"&&Q.order.x!==void 0){let $=this.buildings.find((X)=>X.hp>0&&X.owner!==Q.owner&&X.owner!==0&&Q.dest&&Math.hypot(X.x-Q.dest.x,X.y-Q.dest.y)<6);if($)Z=$}}let K=Q.targetId!==void 0?this.units.find(($)=>$.id===Q.targetId):void 0;if(K){let $=Math.hypot(K.x-Q.x,K.y-Q.y);if($<=Q.def.weapon.range)Q.path=[],this.shoot(Q,K.x,K.y,K,$);else this.moveToward(Q,K.x,K.y,J)}else if(Z){let $=Math.hypot(Z.x-Q.x,Z.y-Q.y);if($<=Q.def.weapon.range+Z.radius)Q.path=[],this.shootBuilding(Q,Z,$);else this.moveToward(Q,Z.x,Z.y,J)}else if(Q.order.kind==="capture"&&Q.order.depotId!==void 0){let $=this.buildings.find((X)=>X.id===Q.order.depotId);if(!$||$.owner===Q.owner)Q.order={kind:"idle"},Q.captureT=void 0;else if(Math.hypot($.x-Q.x,$.y-Q.y)<=y8.radius+1.4){Q.captureT=(Q.captureT??0)+J;let Y=$.owner===0?v9.captureTimeNeutral:v9.captureTimeEnemy;if(Q.captureT>=Y)$.owner=Q.owner,$.captureT=0,$.captureBy=0,Q.captureT=void 0,Q.order={kind:"idle"},this.floats.push({x:$.x,y:$.y-2,text:"DEPOT CAPTURED",color:Q.owner===1?"#ff7a6a":"#6ab4ff",t:0})}else this.moveToward(Q,$.x,$.y,J)}else if(Q.order.x!==void 0&&Q.order.y!==void 0){if(!Q.path.length&&Q.dest){if(Math.hypot(Q.dest.x-Q.x,Q.dest.y-Q.y)<0.8){if(Q.order.kind!=="attackMove")Q.order={kind:"idle"};Q.dest=void 0}else if(Q.path=this.pf.find(Q.x,Q.y,Q.order.x,Q.order.y,Q.def.kind==="aircraft")??[],!Q.path.length)Q.order={kind:"idle"},Q.dest=void 0}this.followPath(Q,J)}}if(this.units.some((Q)=>Q.hp<=0)){for(let Q of this.units)if(Q.hp<=0)this.booms.push({x:Q.x,y:Q.y,r:Q.def.radius+0.8,t:0,max:0.55});this.units=this.units.filter((Q)=>Q.hp>0),this.refreshEconomy()}}findTarget(J){let Q,Z=J.def.weapon.range+2.5;for(let K of this.units){if(K.owner===J.owner||K.hp<=0)continue;let X=Math.hypot(K.x-J.x,K.y-J.y)-(K.def.kind==="infantry"?0:0.5);if(X<Z)Z=X,Q=K}return Q}moveToward(J,Q,Z,K){if(J.repathCd=Math.max(0,(J.repathCd??0)-K),(!J.dest||Math.hypot(J.dest.x-Q,J.dest.y-Z)>1.5)&&(J.repathCd??0)<=0)J.path=this.pf.find(J.x,J.y,Q,Z,J.def.kind==="aircraft")??[],J.dest={x:Q,y:Z},J.repathCd=0.5;this.followPath(J,K)}followPath(J,Q){if(!J.path.length)return;let Z=J.path[0],K=Z.x-J.x,$=Z.y-J.y,X=Math.hypot(K,$);if(X<0.25){J.path.shift();return}let Y=Math.min(X,J.def.speed*Q),W=J.x+K/X*Y,U=J.y+$/X*Y;if(!this.passable(J,W,U))if(this.passable(J,W,J.y))U=J.y;else if(this.passable(J,J.x,U))W=J.x;else{J.path=this.pf.find(J.x,J.y,J.dest?.x??J.x,J.dest?.y??J.y,J.def.kind==="aircraft")??[];return}J.facing=Math.atan2($,K),J.vx=W-J.x,J.vy=U-J.y,J.x=W,J.y=U}shoot(J,Q,Z,K,$){if(J.cd>0)return;J.cd=J.def.weapon.cooldown,J.facing=Math.atan2(Z-J.y,Q-J.x);let X=SK(J.def.weapon.accStatic,J.def.weapon.accWalk,K.path.length>0,$,J.def.weapon.range),Y=E7(J.def.weapon.damage,K.def.armor,K.def.armorClass);if(J.def.weapon.projectileSpeed===0)this.applyHit(J,Q,Z,K,Y,X);else this.projectiles.push({x:J.x,y:J.y,tx:K.x,ty:K.y,speed:J.def.weapon.projectileSpeed,dmg:Y,armorClassOfTarget:K.def.armorClass,targetArmor:K.def.armor,splash:J.def.weapon.splash,acc:X,owner:J.owner,targetId:K.id,trail:0})}shootBuilding(J,Q,Z){if(J.cd>0)return;J.cd=J.def.weapon.cooldown,J.facing=Math.atan2(Q.y-J.y,Q.x-J.x);let K=E7(J.def.weapon.damage,{light:30,medium:24,heavy:18},"heavy");if(J.def.weapon.projectileSpeed===0){if(Math.random()<0.8)Q.hp-=K,this.floats.push({x:Q.x,y:Q.y-1,text:`${Math.round(K)}`,color:"#ffd28a",t:0})}else this.projectiles.push({x:J.x,y:J.y,tx:Q.x,ty:Q.y,speed:J.def.weapon.projectileSpeed,dmg:K,armorClassOfTarget:"heavy",targetArmor:{light:30,medium:24,heavy:18},splash:J.def.weapon.splash,acc:0.85,owner:J.owner,trail:0})}applyHit(J,Q,Z,K,$,X){if(K)if(Math.random()<X)K.hp-=$,this.floats.push({x:K.x,y:K.y-0.8,text:`${Math.round($)}`,color:"#ffd28a",t:0});else this.floats.push({x:K.x,y:K.y-0.8,text:"miss",color:"#999",t:0})}updateProjectiles(J){for(let Q of this.projectiles){let Z=Q.tx-Q.x,K=Q.ty-Q.y,$=Math.hypot(Z,K),X=Q.speed*J;if(Q.trail=Math.min(1,Q.trail+J*3),$<=X){if(Q.dead=!0,Q.splash>0){this.booms.push({x:Q.tx,y:Q.ty,r:Q.splash,t:0,max:0.5});for(let Y of this.units){if(Y.owner===Q.owner)continue;let W=Math.hypot(Y.x-Q.tx,Y.y-Q.ty);if(W<=Q.splash+Y.def.radius){let U=E7({light:Q.dmg/2,medium:Q.dmg/2,heavy:Q.dmg/2},Y.def.armor,Y.def.armorClass);Y.hp-=U*(1-0.5*(W/Q.splash))}}for(let Y of this.buildings){if(Y.owner===Q.owner||Y.owner===0)continue;if(Math.hypot(Y.x-Q.tx,Y.y-Q.ty)<=Q.splash+Y.radius)Y.hp-=Q.dmg*0.6}}else if(Q.targetId!==void 0){let Y=this.units.find((W)=>W.id===Q.targetId);if(Y&&Math.hypot(Y.x-Q.tx,Y.y-Q.ty)<1.5&&Math.random()<Q.acc){let W=E7(Q.armorClassOfTarget==="light"?{light:Q.dmg,medium:Q.dmg/2,heavy:Q.dmg/4}:Q.armorClassOfTarget==="medium"?{light:Q.dmg/2,medium:Q.dmg,heavy:Q.dmg/2}:{light:Q.dmg/4,medium:Q.dmg/2,heavy:Q.dmg},Y.def.armor,Y.def.armorClass);Y.hp-=W,this.floats.push({x:Y.x,y:Y.y-0.8,text:`${Math.round(W)}`,color:"#ffd28a",t:0})}else if(Y)this.floats.push({x:Y.x,y:Y.y-0.8,text:"miss",color:"#999",t:0});else for(let W of this.buildings){if(W.owner===Q.owner||W.owner===0)continue;if(Math.hypot(W.x-Q.tx,W.y-Q.ty)<W.radius+0.8){W.hp-=Q.dmg;break}}}}else Q.x+=Z/$*X,Q.y+=K/$*X}this.projectiles=this.projectiles.filter((Q)=>!Q.dead)}updateDepots(J){for(let Q of this.buildings){if(Q.defId!=="depot")continue;let Z;for(let K of this.units)if(K.order.kind==="capture"&&K.order.depotId===Q.id&&K.captureT!==void 0){Z=K;break}if(!Z&&Q.captureT>0){if(Q.captureT=Math.max(0,Q.captureT-J*2),Q.captureT===0)Q.captureBy=0}}}updateVision(){this.visible[0].fill(0),this.visible[1].fill(0);for(let J of[1,2]){let Q=this.visible[J-1],Z=(K,$,X)=>{let Y=Math.max(0,Math.floor(K-X)),W=Math.min(W0-1,Math.ceil(K+X)),U=Math.max(0,Math.floor($-X)),H=Math.min(k0-1,Math.ceil($+X));for(let N=U;N<=H;N++)for(let F=Y;F<=W;F++)if(Math.hypot(F-K,N-$)<=X){let G=N*W0+F;Q[G]=1,this.explored[G]=1}};for(let K of this.units)if(K.owner===J)Z(K.x,K.y,K.def.view);for(let K of this.buildings)if(K.owner===J)Z(K.x,K.y,K.defId==="hq"?$Q.view:y8.view)}}depots(){return this.buildings.filter((J)=>J.defId==="depot")}hq(J){return this.buildings.find((Q)=>Q.defId==="hq"&&Q.owner===J)}}class YQ{sim;me;t=0;nextThink=2;waveSize=5;wavePushing=!1;constructor(J,Q=2){this.sim=J;this.me=Q}step(J){if(this.sim.winner!==null)return;if(this.t+=J,this.t<this.nextThink)return;this.nextThink=this.t+0.5;let Q=this.sim,Z=Q.players[this.me-1];if(Z.queue.length<3){let U={};for(let R of Q.units)if(R.owner===this.me)U[R.def.id]=(U[R.def.id]??0)+1;let H=["rifle","rifle","rpg","tank","tank","mg","artillery","mammoth","helicopter"],N=H[Math.floor(Math.random()*H.length)],F=Q.units.filter((R)=>R.owner!==this.me&&R.def.kind==="infantry").length;if(Q.units.filter((R)=>R.owner!==this.me&&R.def.kind==="vehicle").length>=3)N=Math.random()<0.5?"rpg":"mammoth";else if(F>=5)N="mg";if(Q.time<60&&(N==="mammoth"||N==="artillery"||N==="helicopter"))N="tank";if(U[N]>=8)N="tank";let D=j9[N];if(Z.funds>=D.price&&Z.cpUsed+D.cp<=Z.cpCap)Q.enqueue(N,this.me)}let K=Q.units.filter((U)=>U.owner===this.me&&U.def.captures&&U.order.kind==="idle"),$=Q.buildings.filter((U)=>U.defId==="depot"&&U.owner!==this.me);if(K.length&&$.length){$.sort((G,D)=>(D.owner!==0?1:0)-(G.owner!==0?1:0));let U=$[0],H=K.slice(0,2),N=Q.units.find((G)=>G.owner===this.me&&G.def.kind==="vehicle"&&G.order.kind==="idle"),F=H.map((G)=>G.id);if(N)F.push(N.id);if(Q.commandCapture(F,U.id),N)N.order={kind:"attackMove",x:U.x,y:U.y},N.dest={x:U.x,y:U.y},N.path=[]}let X=Q.hq(this.me);if(X){let U=Q.units.filter((H)=>H.owner!==this.me&&Math.hypot(H.x-X.x,H.y-X.y)<14);if(U.length){let H=Q.units.filter((N)=>N.owner===this.me&&Math.hypot(N.x-X.x,N.y-X.y)<40);for(let N of H){let F=U[N.order.x?0:0];N.order={kind:"attackMove",x:X.x,y:X.y},N.dest={x:X.x,y:X.y},N.path=[]}return}}let Y=Q.units.filter((U)=>U.owner===this.me&&!U.def.captures&&U.order.kind==="idle"),W=Q.hq(1);if(W&&Y.length>=this.waveSize&&!this.wavePushing){this.wavePushing=!0;for(let U of Y)U.order={kind:"attackMove",x:W.x,y:W.y},U.dest={x:W.x,y:W.y},U.path=[];Q.commandMove(Y.map((U)=>U.id),W.x,W.y,!0)}if(this.wavePushing){if(Q.units.filter((H)=>H.owner===this.me&&!H.def.captures).length<Math.max(2,this.waveSize/3))this.wavePushing=!1,this.waveSize=Math.min(14,this.waveSize+2)}}}var Y$="186";var W$=0,jQ=1,U$=2;var O8=1,H$=2,Q7=3,Z7=0,oJ=1,SJ=2,M9=0,R8=1,$8=2,vQ=3,yQ=4,G$=5;var K7=100,N$=101,E$=102,F$=103,q$=104,D$=200,O$=201,R$=202,L$=203,V$=204,M$=205,k$=206,B$=207,I$=208,C$=209,z$=210,_$=211,A$=212,w$=213,P$=214,T$=0,S$=1,j$=2,fQ=3,v$=4,y$=5,f$=6,h$=7,b$=0,x$=1,g$=2,F9=0,hQ=1,bQ=2,xQ=3,z7=4,gQ=5,pQ=6,mQ=7;var $7=301,L8=302,V6=303,M6=304,_7=306,p$=1000,k6=1001,m$=1002,k9=1003,l$=1004;var A7=1005;var xJ=1006,B6=1007;var V8=1008;var q9=1009,d$=1010,u$=1011,w7=1012,lQ=1013,X8=1014,m9=1015,B9=1016,dQ=1017,uQ=1018,X7=1020,c$=35902,n$=35899,s$=1021,i$=1022,I9=1023,M8=1026,k8=1027,o$=1028,cQ=1029,B8=1030,nQ=1031;var sQ=1033,I6=33776,C6=33777,z6=33778,_6=33779,iQ=35840,oQ=35841,aQ=35842,rQ=35843,tQ=36196,eQ=37492,JZ=37496,QZ=37488,ZZ=37489,A6=37490,KZ=37491,$Z=37808,XZ=37809,YZ=37810,WZ=37811,UZ=37812,HZ=37813,GZ=37814,NZ=37815,EZ=37816,FZ=37817,qZ=37818,DZ=37819,OZ=37820,RZ=37821,LZ=36492,VZ=36494,MZ=36495,kZ=36283,BZ=36284,w6=36285,IZ=36286;var CZ=0,a$=1,I8="",Y8="srgb",zZ="srgb-linear",_Z="linear",UJ="srgb";var r$=512,t$=513,e$=514,P6=515,JX=516,QX=517,T6=518,ZX=519;var AZ="300 es",wZ=2000;function OY(J){for(let Q=J.length-1;Q>=0;--Q)if(J[Q]>=65535)return!0;return!1}function RY(J){return ArrayBuffer.isView(J)&&!(J instanceof DataView)}function B7(J){return document.createElementNS("http://www.w3.org/1999/xhtml",J)}function KX(){let J=B7("canvas");return J.style.display="block",J}var vK={},J7=null;function I7(...J){let Q="THREE."+J.shift();if(J7)J7("log",Q,...J);else console.log(Q,...J)}function $X(J){let Q=J[0];if(typeof Q==="string"&&Q.startsWith("TSL:")){let Z=J[1];if(Z&&Z.isStackTrace)J[0]+=" "+Z.getLocation();else J[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return J}function j0(...J){J=$X(J);let Q="THREE."+J.shift();if(J7)J7("warn",Q,...J);else{let Z=J[0];if(Z&&Z.isStackTrace)console.warn(Z.getError(Q));else console.warn(Q,...J)}}function P0(...J){J=$X(J);let Q="THREE."+J.shift();if(J7)J7("error",Q,...J);else{let Z=J[0];if(Z&&Z.isStackTrace)console.error(Z.getError(Q));else console.error(Q,...J)}}function D8(...J){let Q=J.join(" ");if(Q in vK)return;vK[Q]=!0,j0(...J)}function XX(J,Q,Z){return new Promise(function(K,$){function X(){switch(J.clientWaitSync(Q,J.SYNC_FLUSH_COMMANDS_BIT,0)){case J.WAIT_FAILED:$();break;case J.TIMEOUT_EXPIRED:setTimeout(X,Z);break;default:K()}}setTimeout(X,Z)})}var YX={[0]:1,[2]:6,[4]:7,[3]:5,[1]:0,[6]:2,[7]:4,[5]:3};class l9{addEventListener(J,Q){if(this._listeners===void 0)this._listeners={};let Z=this._listeners;if(Z[J]===void 0)Z[J]=[];if(Z[J].indexOf(Q)===-1)Z[J].push(Q)}hasEventListener(J,Q){let Z=this._listeners;if(Z===void 0)return!1;return Z[J]!==void 0&&Z[J].indexOf(Q)!==-1}removeEventListener(J,Q){let Z=this._listeners;if(Z===void 0)return;let K=Z[J];if(K!==void 0){let $=K.indexOf(Q);if($!==-1)K.splice($,1)}}dispatchEvent(J){let Q=this._listeners;if(Q===void 0)return;let Z=Q[J.type];if(Z!==void 0){J.target=this;let K=Z.slice(0);for(let $=0,X=K.length;$<X;$++)K[$].call(this,J);J.target=null}}}var fJ=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var WQ=Math.PI/180,R6=180/Math.PI;function K8(){let J=Math.random()*4294967295|0,Q=Math.random()*4294967295|0,Z=Math.random()*4294967295|0,K=Math.random()*4294967295|0;return(fJ[J&255]+fJ[J>>8&255]+fJ[J>>16&255]+fJ[J>>24&255]+"-"+fJ[Q&255]+fJ[Q>>8&255]+"-"+fJ[Q>>16&15|64]+fJ[Q>>24&255]+"-"+fJ[Z&63|128]+fJ[Z>>8&255]+"-"+fJ[Z>>16&255]+fJ[Z>>24&255]+fJ[K&255]+fJ[K>>8&255]+fJ[K>>16&255]+fJ[K>>24&255]).toLowerCase()}function n0(J,Q,Z){return Math.max(Q,Math.min(Z,J))}function LY(J,Q){return(J%Q+Q)%Q}function UQ(J,Q,Z){return(1-Z)*J+Z*Q}function V9(J,Q){switch(Q.constructor){case Float32Array:return J;case Uint32Array:return J/4294967295;case Uint16Array:return J/65535;case Uint8Array:case Uint8ClampedArray:return J/255;case Int32Array:return Math.max(J/2147483647,-1);case Int16Array:return Math.max(J/32767,-1);case Int8Array:return Math.max(J/127,-1);default:throw Error("THREE.MathUtils: Invalid component type.")}}function XJ(J,Q){switch(Q.constructor){case Float32Array:return J;case Uint32Array:return Math.round(J*4294967295);case Uint16Array:return Math.round(J*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(J*255);case Int32Array:return Math.round(J*2147483647);case Int16Array:return Math.round(J*32767);case Int8Array:return Math.round(J*127);default:throw Error("THREE.MathUtils: Invalid component type.")}}class v0{static{v0.prototype.isVector2=!0}constructor(J=0,Q=0){this.x=J,this.y=Q}get width(){return this.x}set width(J){this.x=J}get height(){return this.y}set height(J){this.y=J}set(J,Q){return this.x=J,this.y=Q,this}setScalar(J){return this.x=J,this.y=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setComponent(J,Q){switch(J){case 0:this.x=Q;break;case 1:this.y=Q;break;default:throw Error("THREE.Vector2: index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;default:throw Error("THREE.Vector2: index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y)}copy(J){return this.x=J.x,this.y=J.y,this}add(J){return this.x+=J.x,this.y+=J.y,this}addScalar(J){return this.x+=J,this.y+=J,this}addVectors(J,Q){return this.x=J.x+Q.x,this.y=J.y+Q.y,this}addScaledVector(J,Q){return this.x+=J.x*Q,this.y+=J.y*Q,this}sub(J){return this.x-=J.x,this.y-=J.y,this}subScalar(J){return this.x-=J,this.y-=J,this}subVectors(J,Q){return this.x=J.x-Q.x,this.y=J.y-Q.y,this}multiply(J){return this.x*=J.x,this.y*=J.y,this}multiplyScalar(J){return this.x*=J,this.y*=J,this}divide(J){return this.x/=J.x,this.y/=J.y,this}divideScalar(J){return this.multiplyScalar(1/J)}applyMatrix3(J){let Q=this.x,Z=this.y,K=J.elements;return this.x=K[0]*Q+K[3]*Z+K[6],this.y=K[1]*Q+K[4]*Z+K[7],this}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this}clamp(J,Q){return this.x=n0(this.x,J.x,Q.x),this.y=n0(this.y,J.y,Q.y),this}clampScalar(J,Q){return this.x=n0(this.x,J,Q),this.y=n0(this.y,J,Q),this}clampLength(J,Q){let Z=this.length();return this.divideScalar(Z||1).multiplyScalar(n0(Z,J,Q))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(J){return this.x*J.x+this.y*J.y}cross(J){return this.x*J.y-this.y*J.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(J){let Q=Math.sqrt(this.lengthSq()*J.lengthSq());if(Q===0)return Math.PI/2;let Z=this.dot(J)/Q;return Math.acos(n0(Z,-1,1))}distanceTo(J){return Math.sqrt(this.distanceToSquared(J))}distanceToSquared(J){let Q=this.x-J.x,Z=this.y-J.y;return Q*Q+Z*Z}manhattanDistanceTo(J){return Math.abs(this.x-J.x)+Math.abs(this.y-J.y)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,Q){return this.x+=(J.x-this.x)*Q,this.y+=(J.y-this.y)*Q,this}lerpVectors(J,Q,Z){return this.x=J.x+(Q.x-J.x)*Z,this.y=J.y+(Q.y-J.y)*Z,this}equals(J){return J.x===this.x&&J.y===this.y}fromArray(J,Q=0){return this.x=J[Q],this.y=J[Q+1],this}toArray(J=[],Q=0){return J[Q]=this.x,J[Q+1]=this.y,J}fromBufferAttribute(J,Q){return this.x=J.getX(Q),this.y=J.getY(Q),this}rotateAround(J,Q){let Z=Math.cos(Q),K=Math.sin(Q),$=this.x-J.x,X=this.y-J.y;return this.x=$*Z-X*K+J.x,this.y=$*K+X*Z+J.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class d9{constructor(J=0,Q=0,Z=0,K=1){this.isQuaternion=!0,this._x=J,this._y=Q,this._z=Z,this._w=K}static slerpFlat(J,Q,Z,K,$,X,Y){let W=Z[K+0],U=Z[K+1],H=Z[K+2],N=Z[K+3],F=$[X+0],G=$[X+1],D=$[X+2],R=$[X+3];if(N!==R||W!==F||U!==G||H!==D){let B=W*F+U*G+H*D+N*R;if(B<0)F=-F,G=-G,D=-D,R=-R,B=-B;let q=1-Y;if(B<0.9995){let E=Math.acos(B),z=Math.sin(E);q=Math.sin(q*E)/z,Y=Math.sin(Y*E)/z,W=W*q+F*Y,U=U*q+G*Y,H=H*q+D*Y,N=N*q+R*Y}else{W=W*q+F*Y,U=U*q+G*Y,H=H*q+D*Y,N=N*q+R*Y;let E=1/Math.sqrt(W*W+U*U+H*H+N*N);W*=E,U*=E,H*=E,N*=E}}J[Q]=W,J[Q+1]=U,J[Q+2]=H,J[Q+3]=N}static multiplyQuaternionsFlat(J,Q,Z,K,$,X){let Y=Z[K],W=Z[K+1],U=Z[K+2],H=Z[K+3],N=$[X],F=$[X+1],G=$[X+2],D=$[X+3];return J[Q]=Y*D+H*N+W*G-U*F,J[Q+1]=W*D+H*F+U*N-Y*G,J[Q+2]=U*D+H*G+Y*F-W*N,J[Q+3]=H*D-Y*N-W*F-U*G,J}get x(){return this._x}set x(J){this._x=J,this._onChangeCallback()}get y(){return this._y}set y(J){this._y=J,this._onChangeCallback()}get z(){return this._z}set z(J){this._z=J,this._onChangeCallback()}get w(){return this._w}set w(J){this._w=J,this._onChangeCallback()}set(J,Q,Z,K){return this._x=J,this._y=Q,this._z=Z,this._w=K,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(J){return this._x=J.x,this._y=J.y,this._z=J.z,this._w=J.w,this._onChangeCallback(),this}setFromEuler(J,Q=!0){let{_x:Z,_y:K,_z:$,_order:X}=J,Y=Math.cos,W=Math.sin,U=Y(Z/2),H=Y(K/2),N=Y($/2),F=W(Z/2),G=W(K/2),D=W($/2);switch(X){case"XYZ":this._x=F*H*N+U*G*D,this._y=U*G*N-F*H*D,this._z=U*H*D+F*G*N,this._w=U*H*N-F*G*D;break;case"YXZ":this._x=F*H*N+U*G*D,this._y=U*G*N-F*H*D,this._z=U*H*D-F*G*N,this._w=U*H*N+F*G*D;break;case"ZXY":this._x=F*H*N-U*G*D,this._y=U*G*N+F*H*D,this._z=U*H*D+F*G*N,this._w=U*H*N-F*G*D;break;case"ZYX":this._x=F*H*N-U*G*D,this._y=U*G*N+F*H*D,this._z=U*H*D-F*G*N,this._w=U*H*N+F*G*D;break;case"YZX":this._x=F*H*N+U*G*D,this._y=U*G*N+F*H*D,this._z=U*H*D-F*G*N,this._w=U*H*N-F*G*D;break;case"XZY":this._x=F*H*N-U*G*D,this._y=U*G*N-F*H*D,this._z=U*H*D+F*G*N,this._w=U*H*N+F*G*D;break;default:j0("Quaternion: .setFromEuler() encountered an unknown order: "+X)}if(Q===!0)this._onChangeCallback();return this}setFromAxisAngle(J,Q){let Z=Q/2,K=Math.sin(Z);return this._x=J.x*K,this._y=J.y*K,this._z=J.z*K,this._w=Math.cos(Z),this._onChangeCallback(),this}setFromRotationMatrix(J){let Q=J.elements,Z=Q[0],K=Q[4],$=Q[8],X=Q[1],Y=Q[5],W=Q[9],U=Q[2],H=Q[6],N=Q[10],F=Z+Y+N;if(F>0){let G=0.5/Math.sqrt(F+1);this._w=0.25/G,this._x=(H-W)*G,this._y=($-U)*G,this._z=(X-K)*G}else if(Z>Y&&Z>N){let G=2*Math.sqrt(1+Z-Y-N);this._w=(H-W)/G,this._x=0.25*G,this._y=(K+X)/G,this._z=($+U)/G}else if(Y>N){let G=2*Math.sqrt(1+Y-Z-N);this._w=($-U)/G,this._x=(K+X)/G,this._y=0.25*G,this._z=(W+H)/G}else{let G=2*Math.sqrt(1+N-Z-Y);this._w=(X-K)/G,this._x=($+U)/G,this._y=(W+H)/G,this._z=0.25*G}return this._onChangeCallback(),this}setFromUnitVectors(J,Q){let Z=J.dot(Q)+1;if(Z<0.00000001)if(Z=0,Math.abs(J.x)>Math.abs(J.z))this._x=-J.y,this._y=J.x,this._z=0,this._w=Z;else this._x=0,this._y=-J.z,this._z=J.y,this._w=Z;else this._x=J.y*Q.z-J.z*Q.y,this._y=J.z*Q.x-J.x*Q.z,this._z=J.x*Q.y-J.y*Q.x,this._w=Z;return this.normalize()}angleTo(J){return 2*Math.acos(Math.abs(n0(this.dot(J),-1,1)))}rotateTowards(J,Q){let Z=this.angleTo(J);if(Z===0)return this;let K=Math.min(1,Q/Z);return this.slerp(J,K),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(J){return this._x*J._x+this._y*J._y+this._z*J._z+this._w*J._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let J=this.length();if(J===0)this._x=0,this._y=0,this._z=0,this._w=1;else J=1/J,this._x=this._x*J,this._y=this._y*J,this._z=this._z*J,this._w=this._w*J;return this._onChangeCallback(),this}multiply(J){return this.multiplyQuaternions(this,J)}premultiply(J){return this.multiplyQuaternions(J,this)}multiplyQuaternions(J,Q){let{_x:Z,_y:K,_z:$,_w:X}=J,Y=Q._x,W=Q._y,U=Q._z,H=Q._w;return this._x=Z*H+X*Y+K*U-$*W,this._y=K*H+X*W+$*Y-Z*U,this._z=$*H+X*U+Z*W-K*Y,this._w=X*H-Z*Y-K*W-$*U,this._onChangeCallback(),this}slerp(J,Q){let{_x:Z,_y:K,_z:$,_w:X}=J,Y=this.dot(J);if(Y<0)Z=-Z,K=-K,$=-$,X=-X,Y=-Y;let W=1-Q;if(Y<0.9995){let U=Math.acos(Y),H=Math.sin(U);W=Math.sin(W*U)/H,Q=Math.sin(Q*U)/H,this._x=this._x*W+Z*Q,this._y=this._y*W+K*Q,this._z=this._z*W+$*Q,this._w=this._w*W+X*Q,this._onChangeCallback()}else this._x=this._x*W+Z*Q,this._y=this._y*W+K*Q,this._z=this._z*W+$*Q,this._w=this._w*W+X*Q,this.normalize();return this}slerpQuaternions(J,Q,Z){return this.copy(J).slerp(Q,Z)}random(){let J=2*Math.PI*Math.random(),Q=2*Math.PI*Math.random(),Z=Math.random(),K=Math.sqrt(1-Z),$=Math.sqrt(Z);return this.set(K*Math.sin(J),K*Math.cos(J),$*Math.sin(Q),$*Math.cos(Q))}equals(J){return J._x===this._x&&J._y===this._y&&J._z===this._z&&J._w===this._w}fromArray(J,Q=0){return this._x=J[Q],this._y=J[Q+1],this._z=J[Q+2],this._w=J[Q+3],this._onChangeCallback(),this}toArray(J=[],Q=0){return J[Q]=this._x,J[Q+1]=this._y,J[Q+2]=this._z,J[Q+3]=this._w,J}fromBufferAttribute(J,Q){return this._x=J.getX(Q),this._y=J.getY(Q),this._z=J.getZ(Q),this._w=J.getW(Q),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(J){return this._onChangeCallback=J,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class h{static{h.prototype.isVector3=!0}constructor(J=0,Q=0,Z=0){this.x=J,this.y=Q,this.z=Z}set(J,Q,Z){if(Z===void 0)Z=this.z;return this.x=J,this.y=Q,this.z=Z,this}setScalar(J){return this.x=J,this.y=J,this.z=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setZ(J){return this.z=J,this}setComponent(J,Q){switch(J){case 0:this.x=Q;break;case 1:this.y=Q;break;case 2:this.z=Q;break;default:throw Error("THREE.Vector3: index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error("THREE.Vector3: index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(J){return this.x=J.x,this.y=J.y,this.z=J.z,this}add(J){return this.x+=J.x,this.y+=J.y,this.z+=J.z,this}addScalar(J){return this.x+=J,this.y+=J,this.z+=J,this}addVectors(J,Q){return this.x=J.x+Q.x,this.y=J.y+Q.y,this.z=J.z+Q.z,this}addScaledVector(J,Q){return this.x+=J.x*Q,this.y+=J.y*Q,this.z+=J.z*Q,this}sub(J){return this.x-=J.x,this.y-=J.y,this.z-=J.z,this}subScalar(J){return this.x-=J,this.y-=J,this.z-=J,this}subVectors(J,Q){return this.x=J.x-Q.x,this.y=J.y-Q.y,this.z=J.z-Q.z,this}multiply(J){return this.x*=J.x,this.y*=J.y,this.z*=J.z,this}multiplyScalar(J){return this.x*=J,this.y*=J,this.z*=J,this}multiplyVectors(J,Q){return this.x=J.x*Q.x,this.y=J.y*Q.y,this.z=J.z*Q.z,this}applyEuler(J){return this.applyQuaternion(yK.setFromEuler(J))}applyAxisAngle(J,Q){return this.applyQuaternion(yK.setFromAxisAngle(J,Q))}applyMatrix3(J){let Q=this.x,Z=this.y,K=this.z,$=J.elements;return this.x=$[0]*Q+$[3]*Z+$[6]*K,this.y=$[1]*Q+$[4]*Z+$[7]*K,this.z=$[2]*Q+$[5]*Z+$[8]*K,this}applyNormalMatrix(J){return this.applyMatrix3(J).normalize()}applyMatrix4(J){let Q=this.x,Z=this.y,K=this.z,$=J.elements,X=1/($[3]*Q+$[7]*Z+$[11]*K+$[15]);return this.x=($[0]*Q+$[4]*Z+$[8]*K+$[12])*X,this.y=($[1]*Q+$[5]*Z+$[9]*K+$[13])*X,this.z=($[2]*Q+$[6]*Z+$[10]*K+$[14])*X,this}applyQuaternion(J){let Q=this.x,Z=this.y,K=this.z,$=J.x,X=J.y,Y=J.z,W=J.w,U=2*(X*K-Y*Z),H=2*(Y*Q-$*K),N=2*($*Z-X*Q);return this.x=Q+W*U+X*N-Y*H,this.y=Z+W*H+Y*U-$*N,this.z=K+W*N+$*H-X*U,this}project(J){return this.applyMatrix4(J.matrixWorldInverse).applyMatrix4(J.projectionMatrix)}unproject(J){return this.applyMatrix4(J.projectionMatrixInverse).applyMatrix4(J.matrixWorld)}transformDirection(J){let Q=this.x,Z=this.y,K=this.z,$=J.elements;return this.x=$[0]*Q+$[4]*Z+$[8]*K,this.y=$[1]*Q+$[5]*Z+$[9]*K,this.z=$[2]*Q+$[6]*Z+$[10]*K,this.normalize()}divide(J){return this.x/=J.x,this.y/=J.y,this.z/=J.z,this}divideScalar(J){return this.multiplyScalar(1/J)}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this.z=Math.min(this.z,J.z),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this.z=Math.max(this.z,J.z),this}clamp(J,Q){return this.x=n0(this.x,J.x,Q.x),this.y=n0(this.y,J.y,Q.y),this.z=n0(this.z,J.z,Q.z),this}clampScalar(J,Q){return this.x=n0(this.x,J,Q),this.y=n0(this.y,J,Q),this.z=n0(this.z,J,Q),this}clampLength(J,Q){let Z=this.length();return this.divideScalar(Z||1).multiplyScalar(n0(Z,J,Q))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(J){return this.x*J.x+this.y*J.y+this.z*J.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,Q){return this.x+=(J.x-this.x)*Q,this.y+=(J.y-this.y)*Q,this.z+=(J.z-this.z)*Q,this}lerpVectors(J,Q,Z){return this.x=J.x+(Q.x-J.x)*Z,this.y=J.y+(Q.y-J.y)*Z,this.z=J.z+(Q.z-J.z)*Z,this}cross(J){return this.crossVectors(this,J)}crossVectors(J,Q){let{x:Z,y:K,z:$}=J,X=Q.x,Y=Q.y,W=Q.z;return this.x=K*W-$*Y,this.y=$*X-Z*W,this.z=Z*Y-K*X,this}projectOnVector(J){let Q=J.lengthSq();if(Q===0)return this.set(0,0,0);let Z=J.dot(this)/Q;return this.copy(J).multiplyScalar(Z)}projectOnPlane(J){return HQ.copy(this).projectOnVector(J),this.sub(HQ)}reflect(J){return this.sub(HQ.copy(J).multiplyScalar(2*this.dot(J)))}angleTo(J){let Q=Math.sqrt(this.lengthSq()*J.lengthSq());if(Q===0)return Math.PI/2;let Z=this.dot(J)/Q;return Math.acos(n0(Z,-1,1))}distanceTo(J){return Math.sqrt(this.distanceToSquared(J))}distanceToSquared(J){let Q=this.x-J.x,Z=this.y-J.y,K=this.z-J.z;return Q*Q+Z*Z+K*K}manhattanDistanceTo(J){return Math.abs(this.x-J.x)+Math.abs(this.y-J.y)+Math.abs(this.z-J.z)}setFromSpherical(J){return this.setFromSphericalCoords(J.radius,J.phi,J.theta)}setFromSphericalCoords(J,Q,Z){let K=Math.sin(Q)*J;return this.x=K*Math.sin(Z),this.y=Math.cos(Q)*J,this.z=K*Math.cos(Z),this}setFromCylindrical(J){return this.setFromCylindricalCoords(J.radius,J.theta,J.y)}setFromCylindricalCoords(J,Q,Z){return this.x=J*Math.sin(Q),this.y=Z,this.z=J*Math.cos(Q),this}setFromMatrixPosition(J){let Q=J.elements;return this.x=Q[12],this.y=Q[13],this.z=Q[14],this}setFromMatrixScale(J){let Q=this.setFromMatrixColumn(J,0).length(),Z=this.setFromMatrixColumn(J,1).length(),K=this.setFromMatrixColumn(J,2).length();return this.x=Q,this.y=Z,this.z=K,this}setFromMatrixColumn(J,Q){return this.fromArray(J.elements,Q*4)}setFromMatrix3Column(J,Q){return this.fromArray(J.elements,Q*3)}setFromEuler(J){return this.x=J._x,this.y=J._y,this.z=J._z,this}setFromColor(J){return this.x=J.r,this.y=J.g,this.z=J.b,this}equals(J){return J.x===this.x&&J.y===this.y&&J.z===this.z}fromArray(J,Q=0){return this.x=J[Q],this.y=J[Q+1],this.z=J[Q+2],this}toArray(J=[],Q=0){return J[Q]=this.x,J[Q+1]=this.y,J[Q+2]=this.z,J}fromBufferAttribute(J,Q){return this.x=J.getX(Q),this.y=J.getY(Q),this.z=J.getZ(Q),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let J=Math.random()*Math.PI*2,Q=Math.random()*2-1,Z=Math.sqrt(1-Q*Q);return this.x=Z*Math.cos(J),this.y=Q,this.z=Z*Math.sin(J),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}var HQ=new h,yK=new d9;class f0{static{f0.prototype.isMatrix3=!0}constructor(J,Q,Z,K,$,X,Y,W,U){if(this.elements=[1,0,0,0,1,0,0,0,1],J!==void 0)this.set(J,Q,Z,K,$,X,Y,W,U)}set(J,Q,Z,K,$,X,Y,W,U){let H=this.elements;return H[0]=J,H[1]=K,H[2]=Y,H[3]=Q,H[4]=$,H[5]=W,H[6]=Z,H[7]=X,H[8]=U,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(J){let Q=this.elements,Z=J.elements;return Q[0]=Z[0],Q[1]=Z[1],Q[2]=Z[2],Q[3]=Z[3],Q[4]=Z[4],Q[5]=Z[5],Q[6]=Z[6],Q[7]=Z[7],Q[8]=Z[8],this}extractBasis(J,Q,Z){return J.setFromMatrix3Column(this,0),Q.setFromMatrix3Column(this,1),Z.setFromMatrix3Column(this,2),this}setFromMatrix4(J){let Q=J.elements;return this.set(Q[0],Q[4],Q[8],Q[1],Q[5],Q[9],Q[2],Q[6],Q[10]),this}multiply(J){return this.multiplyMatrices(this,J)}premultiply(J){return this.multiplyMatrices(J,this)}multiplyMatrices(J,Q){let Z=J.elements,K=Q.elements,$=this.elements,X=Z[0],Y=Z[3],W=Z[6],U=Z[1],H=Z[4],N=Z[7],F=Z[2],G=Z[5],D=Z[8],R=K[0],B=K[3],q=K[6],E=K[1],z=K[4],w=K[7],k=K[2],C=K[5],_=K[8];return $[0]=X*R+Y*E+W*k,$[3]=X*B+Y*z+W*C,$[6]=X*q+Y*w+W*_,$[1]=U*R+H*E+N*k,$[4]=U*B+H*z+N*C,$[7]=U*q+H*w+N*_,$[2]=F*R+G*E+D*k,$[5]=F*B+G*z+D*C,$[8]=F*q+G*w+D*_,this}multiplyScalar(J){let Q=this.elements;return Q[0]*=J,Q[3]*=J,Q[6]*=J,Q[1]*=J,Q[4]*=J,Q[7]*=J,Q[2]*=J,Q[5]*=J,Q[8]*=J,this}determinant(){let J=this.elements,Q=J[0],Z=J[1],K=J[2],$=J[3],X=J[4],Y=J[5],W=J[6],U=J[7],H=J[8];return Q*X*H-Q*Y*U-Z*$*H+Z*Y*W+K*$*U-K*X*W}invert(){let J=this.elements,Q=J[0],Z=J[1],K=J[2],$=J[3],X=J[4],Y=J[5],W=J[6],U=J[7],H=J[8],N=H*X-Y*U,F=Y*W-H*$,G=U*$-X*W,D=Q*N+Z*F+K*G;if(D===0)return this.set(0,0,0,0,0,0,0,0,0);let R=1/D;return J[0]=N*R,J[1]=(K*U-H*Z)*R,J[2]=(Y*Z-K*X)*R,J[3]=F*R,J[4]=(H*Q-K*W)*R,J[5]=(K*$-Y*Q)*R,J[6]=G*R,J[7]=(Z*W-U*Q)*R,J[8]=(X*Q-Z*$)*R,this}transpose(){let J,Q=this.elements;return J=Q[1],Q[1]=Q[3],Q[3]=J,J=Q[2],Q[2]=Q[6],Q[6]=J,J=Q[5],Q[5]=Q[7],Q[7]=J,this}getNormalMatrix(J){return this.setFromMatrix4(J).invert().transpose()}transposeIntoArray(J){let Q=this.elements;return J[0]=Q[0],J[1]=Q[3],J[2]=Q[6],J[3]=Q[1],J[4]=Q[4],J[5]=Q[7],J[6]=Q[2],J[7]=Q[5],J[8]=Q[8],this}setUvTransform(J,Q,Z,K,$,X,Y){let W=Math.cos($),U=Math.sin($);return this.set(Z*W,Z*U,-Z*(W*X+U*Y)+X+J,-K*U,K*W,-K*(-U*X+W*Y)+Y+Q,0,0,1),this}scale(J,Q){return D8("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(GQ.makeScale(J,Q)),this}rotate(J){return D8("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(GQ.makeRotation(-J)),this}translate(J,Q){return D8("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(GQ.makeTranslation(J,Q)),this}makeTranslation(J,Q){if(J.isVector2)this.set(1,0,J.x,0,1,J.y,0,0,1);else this.set(1,0,J,0,1,Q,0,0,1);return this}makeRotation(J){let Q=Math.cos(J),Z=Math.sin(J);return this.set(Q,-Z,0,Z,Q,0,0,0,1),this}makeScale(J,Q){return this.set(J,0,0,0,Q,0,0,0,1),this}equals(J){let Q=this.elements,Z=J.elements;for(let K=0;K<9;K++)if(Q[K]!==Z[K])return!1;return!0}fromArray(J,Q=0){for(let Z=0;Z<9;Z++)this.elements[Z]=J[Z+Q];return this}toArray(J=[],Q=0){let Z=this.elements;return J[Q]=Z[0],J[Q+1]=Z[1],J[Q+2]=Z[2],J[Q+3]=Z[3],J[Q+4]=Z[4],J[Q+5]=Z[5],J[Q+6]=Z[6],J[Q+7]=Z[7],J[Q+8]=Z[8],J}clone(){return new this.constructor().fromArray(this.elements)}}var GQ=new f0,fK=new f0().set(0.4123908,0.3575843,0.1804808,0.212639,0.7151687,0.0721923,0.0193308,0.1191948,0.9505322),hK=new f0().set(3.2409699,-1.5373832,-0.4986108,-0.9692436,1.8759675,0.0415551,0.0556301,-0.203977,1.0569715);function VY(){let J={enabled:!0,workingColorSpace:"srgb-linear",spaces:{},convert:function($,X,Y){if(this.enabled===!1||X===Y||!X||!Y)return $;if(this.spaces[X].transfer==="srgb")$.r=g9($.r),$.g=g9($.g),$.b=g9($.b);if(this.spaces[X].primaries!==this.spaces[Y].primaries)$.applyMatrix3(this.spaces[X].toXYZ),$.applyMatrix3(this.spaces[Y].fromXYZ);if(this.spaces[Y].transfer==="srgb")$.r=e8($.r),$.g=e8($.g),$.b=e8($.b);return $},workingToColorSpace:function($,X){return this.convert($,this.workingColorSpace,X)},colorSpaceToWorking:function($,X){return this.convert($,X,this.workingColorSpace)},getPrimaries:function($){return this.spaces[$].primaries},getTransfer:function($){if($==="")return"linear";return this.spaces[$].transfer},getToneMappingMode:function($){return this.spaces[$].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function($,X=this.workingColorSpace){return $.fromArray(this.spaces[X].luminanceCoefficients)},define:function($){Object.assign(this.spaces,$)},_getMatrix:function($,X,Y){return $.copy(this.spaces[X].toXYZ).multiply(this.spaces[Y].fromXYZ)},_getDrawingBufferColorSpace:function($){return this.spaces[$].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function($=this.workingColorSpace){return this.spaces[$].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function($,X){return D8("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),J.workingToColorSpace($,X)},toWorkingColorSpace:function($,X){return D8("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),J.colorSpaceToWorking($,X)}},Q=[0.64,0.33,0.3,0.6,0.15,0.06],Z=[0.2126,0.7152,0.0722],K=[0.3127,0.329];return J.define({["srgb-linear"]:{primaries:Q,whitePoint:K,transfer:"linear",toXYZ:fK,fromXYZ:hK,luminanceCoefficients:Z,workingColorSpaceConfig:{unpackColorSpace:"srgb"},outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}},["srgb"]:{primaries:Q,whitePoint:K,transfer:"srgb",toXYZ:fK,fromXYZ:hK,luminanceCoefficients:Z,outputColorSpaceConfig:{drawingBufferColorSpace:"srgb"}}}),J}var u0=VY();function g9(J){return J<0.04045?J*0.0773993808:Math.pow(J*0.9478672986+0.0521327014,2.4)}function e8(J){return J<0.0031308?J*12.92:1.055*Math.pow(J,0.41666)-0.055}var f8;class PZ{static getDataURL(J,Q="image/png"){if(/^data:/i.test(J.src))return J.src;if(typeof HTMLCanvasElement>"u")return J.src;let Z;if(J instanceof HTMLCanvasElement)Z=J;else{if(f8===void 0)f8=B7("canvas");f8.width=J.width,f8.height=J.height;let K=f8.getContext("2d");if(J instanceof ImageData)K.putImageData(J,0,0);else K.drawImage(J,0,0,J.width,J.height);Z=f8}return Z.toDataURL(Q)}static sRGBToLinear(J){if(typeof HTMLImageElement<"u"&&J instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&J instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&J instanceof ImageBitmap){let Q=B7("canvas");Q.width=J.width,Q.height=J.height;let Z=Q.getContext("2d");Z.drawImage(J,0,0,J.width,J.height);let K=Z.getImageData(0,0,J.width,J.height),$=K.data;for(let X=0;X<$.length;X++)$[X]=g9($[X]/255)*255;return Z.putImageData(K,0,0),Q}else if(J.data){let Q=J.data.slice(0);for(let Z=0;Z<Q.length;Z++)if(Q instanceof Uint8Array||Q instanceof Uint8ClampedArray)Q[Z]=Math.floor(g9(Q[Z]/255)*255);else Q[Z]=g9(Q[Z]);return{data:Q,width:J.width,height:J.height}}else return j0("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),J}}var MY=0;class P7{constructor(J=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:MY++}),this.uuid=K8(),this.data=J,this.dataReady=!0,this.version=0}getSize(J){let Q=this.data;if(typeof HTMLVideoElement<"u"&&Q instanceof HTMLVideoElement)J.set(Q.videoWidth,Q.videoHeight,0);else if(typeof VideoFrame<"u"&&Q instanceof VideoFrame)J.set(Q.displayWidth,Q.displayHeight,0);else if(Q!==null)J.set(Q.width,Q.height,Q.depth||0);else J.set(0,0,0);return J}set needsUpdate(J){if(J===!0)this.version++}toJSON(J){let Q=J===void 0||typeof J==="string";if(!Q&&J.images[this.uuid]!==void 0)return J.images[this.uuid];let Z={uuid:this.uuid,url:""},K=this.data;if(K!==null){let $;if(Array.isArray(K)){$=[];for(let X=0,Y=K.length;X<Y;X++)if(K[X].isDataTexture)$.push(NQ(K[X].image));else $.push(NQ(K[X]))}else $=NQ(K);Z.url=$}if(!Q)J.images[this.uuid]=Z;return Z}}function NQ(J){if(typeof HTMLImageElement<"u"&&J instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&J instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&J instanceof ImageBitmap)return PZ.getDataURL(J);else if(J.data)return{data:Array.from(J.data),width:J.width,height:J.height,type:J.data.constructor.name};else return j0("Texture: Unable to serialize Texture."),{}}var kY=0,EQ=new h;class vJ extends l9{constructor(J=vJ.DEFAULT_IMAGE,Q=vJ.DEFAULT_MAPPING,Z=1001,K=1001,$=1006,X=1008,Y=1023,W=1009,U=vJ.DEFAULT_ANISOTROPY,H=""){super();this.isTexture=!0,Object.defineProperty(this,"id",{value:kY++}),this.uuid=K8(),this.name="",this.source=new P7(J),this.mipmaps=[],this.mapping=Q,this.channel=0,this.wrapS=Z,this.wrapT=K,this.magFilter=$,this.minFilter=X,this.anisotropy=U,this.format=Y,this.internalFormat=null,this.type=W,this.offset=new v0(0,0),this.repeat=new v0(1,1),this.center=new v0(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new f0,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=H,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=J&&J.depth&&J.depth>1?!0:!1,this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(EQ).x}get height(){return this.source.getSize(EQ).y}get depth(){return this.source.getSize(EQ).z}get image(){return this.source.data}set image(J){this.source.data=J}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(J,Q){this.updateRanges.push({start:J,count:Q})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(J){return this.name=J.name,this.source=J.source,this.mipmaps=J.mipmaps.slice(0),this.mapping=J.mapping,this.channel=J.channel,this.wrapS=J.wrapS,this.wrapT=J.wrapT,this.magFilter=J.magFilter,this.minFilter=J.minFilter,this.anisotropy=J.anisotropy,this.format=J.format,this.internalFormat=J.internalFormat,this.type=J.type,this.normalized=J.normalized,this.offset.copy(J.offset),this.repeat.copy(J.repeat),this.center.copy(J.center),this.rotation=J.rotation,this.matrixAutoUpdate=J.matrixAutoUpdate,this.matrix.copy(J.matrix),this.generateMipmaps=J.generateMipmaps,this.premultiplyAlpha=J.premultiplyAlpha,this.flipY=J.flipY,this.unpackAlignment=J.unpackAlignment,this.colorSpace=J.colorSpace,this.renderTarget=J.renderTarget,this.isRenderTargetTexture=J.isRenderTargetTexture,this.isArrayTexture=J.isArrayTexture,this.userData=JSON.parse(JSON.stringify(J.userData)),this.needsUpdate=!0,this}setValues(J){for(let Q in J){let Z=J[Q];if(Z===void 0){j0(`Texture.setValues(): parameter '${Q}' has value of undefined.`);continue}let K=this[Q];if(K===void 0){j0(`Texture.setValues(): property '${Q}' does not exist.`);continue}if(K&&Z&&(K.isVector2&&Z.isVector2))K.copy(Z);else if(K&&Z&&(K.isVector3&&Z.isVector3))K.copy(Z);else if(K&&Z&&(K.isMatrix3&&Z.isMatrix3))K.copy(Z);else this[Q]=Z}}toJSON(J){let Q=J===void 0||typeof J==="string";if(!Q&&J.textures[this.uuid]!==void 0)return J.textures[this.uuid];let Z={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(J).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};if(Object.keys(this.userData).length>0)Z.userData=this.userData;if(!Q)J.textures[this.uuid]=Z;return Z}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(J){if(this.mapping!==300)return J;if(J.applyMatrix3(this.matrix),J.x<0||J.x>1)switch(this.wrapS){case 1000:J.x=J.x-Math.floor(J.x);break;case 1001:J.x=J.x<0?0:1;break;case 1002:if(Math.abs(Math.floor(J.x)%2)===1)J.x=Math.ceil(J.x)-J.x;else J.x=J.x-Math.floor(J.x);break}if(J.y<0||J.y>1)switch(this.wrapT){case 1000:J.y=J.y-Math.floor(J.y);break;case 1001:J.y=J.y<0?0:1;break;case 1002:if(Math.abs(Math.floor(J.y)%2)===1)J.y=Math.ceil(J.y)-J.y;else J.y=J.y-Math.floor(J.y);break}if(this.flipY)J.y=1-J.y;return J}set needsUpdate(J){if(J===!0)this.version++,this.source.needsUpdate=!0}set needsPMREMUpdate(J){if(J===!0)this.pmremVersion++}}vJ.DEFAULT_IMAGE=null;vJ.DEFAULT_MAPPING=300;vJ.DEFAULT_ANISOTROPY=1;class OJ{static{OJ.prototype.isVector4=!0}constructor(J=0,Q=0,Z=0,K=1){this.x=J,this.y=Q,this.z=Z,this.w=K}get width(){return this.z}set width(J){this.z=J}get height(){return this.w}set height(J){this.w=J}set(J,Q,Z,K){return this.x=J,this.y=Q,this.z=Z,this.w=K,this}setScalar(J){return this.x=J,this.y=J,this.z=J,this.w=J,this}setX(J){return this.x=J,this}setY(J){return this.y=J,this}setZ(J){return this.z=J,this}setW(J){return this.w=J,this}setComponent(J,Q){switch(J){case 0:this.x=Q;break;case 1:this.y=Q;break;case 2:this.z=Q;break;case 3:this.w=Q;break;default:throw Error("THREE.Vector4: index is out of range: "+J)}return this}getComponent(J){switch(J){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error("THREE.Vector4: index is out of range: "+J)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(J){return this.x=J.x,this.y=J.y,this.z=J.z,this.w=J.w!==void 0?J.w:1,this}add(J){return this.x+=J.x,this.y+=J.y,this.z+=J.z,this.w+=J.w,this}addScalar(J){return this.x+=J,this.y+=J,this.z+=J,this.w+=J,this}addVectors(J,Q){return this.x=J.x+Q.x,this.y=J.y+Q.y,this.z=J.z+Q.z,this.w=J.w+Q.w,this}addScaledVector(J,Q){return this.x+=J.x*Q,this.y+=J.y*Q,this.z+=J.z*Q,this.w+=J.w*Q,this}sub(J){return this.x-=J.x,this.y-=J.y,this.z-=J.z,this.w-=J.w,this}subScalar(J){return this.x-=J,this.y-=J,this.z-=J,this.w-=J,this}subVectors(J,Q){return this.x=J.x-Q.x,this.y=J.y-Q.y,this.z=J.z-Q.z,this.w=J.w-Q.w,this}multiply(J){return this.x*=J.x,this.y*=J.y,this.z*=J.z,this.w*=J.w,this}multiplyScalar(J){return this.x*=J,this.y*=J,this.z*=J,this.w*=J,this}applyMatrix4(J){let Q=this.x,Z=this.y,K=this.z,$=this.w,X=J.elements;return this.x=X[0]*Q+X[4]*Z+X[8]*K+X[12]*$,this.y=X[1]*Q+X[5]*Z+X[9]*K+X[13]*$,this.z=X[2]*Q+X[6]*Z+X[10]*K+X[14]*$,this.w=X[3]*Q+X[7]*Z+X[11]*K+X[15]*$,this}divide(J){return this.x/=J.x,this.y/=J.y,this.z/=J.z,this.w/=J.w,this}divideScalar(J){return this.multiplyScalar(1/J)}setAxisAngleFromQuaternion(J){this.w=2*Math.acos(J.w);let Q=Math.sqrt(1-J.w*J.w);if(Q<0.0001)this.x=1,this.y=0,this.z=0;else this.x=J.x/Q,this.y=J.y/Q,this.z=J.z/Q;return this}setAxisAngleFromRotationMatrix(J){let Q,Z,K,$,X=0.01,Y=0.1,W=J.elements,U=W[0],H=W[4],N=W[8],F=W[1],G=W[5],D=W[9],R=W[2],B=W[6],q=W[10];if(Math.abs(H-F)<0.01&&Math.abs(N-R)<0.01&&Math.abs(D-B)<0.01){if(Math.abs(H+F)<0.1&&Math.abs(N+R)<0.1&&Math.abs(D+B)<0.1&&Math.abs(U+G+q-3)<0.1)return this.set(1,0,0,0),this;Q=Math.PI;let z=(U+1)/2,w=(G+1)/2,k=(q+1)/2,C=(H+F)/4,_=(N+R)/4,A=(D+B)/4;if(z>w&&z>k)if(z<0.01)Z=0,K=0.707106781,$=0.707106781;else Z=Math.sqrt(z),K=C/Z,$=_/Z;else if(w>k)if(w<0.01)Z=0.707106781,K=0,$=0.707106781;else K=Math.sqrt(w),Z=C/K,$=A/K;else if(k<0.01)Z=0.707106781,K=0.707106781,$=0;else $=Math.sqrt(k),Z=_/$,K=A/$;return this.set(Z,K,$,Q),this}let E=Math.sqrt((B-D)*(B-D)+(N-R)*(N-R)+(F-H)*(F-H));if(Math.abs(E)<0.001)E=1;return this.x=(B-D)/E,this.y=(N-R)/E,this.z=(F-H)/E,this.w=Math.acos((U+G+q-1)/2),this}setFromMatrixPosition(J){let Q=J.elements;return this.x=Q[12],this.y=Q[13],this.z=Q[14],this.w=Q[15],this}min(J){return this.x=Math.min(this.x,J.x),this.y=Math.min(this.y,J.y),this.z=Math.min(this.z,J.z),this.w=Math.min(this.w,J.w),this}max(J){return this.x=Math.max(this.x,J.x),this.y=Math.max(this.y,J.y),this.z=Math.max(this.z,J.z),this.w=Math.max(this.w,J.w),this}clamp(J,Q){return this.x=n0(this.x,J.x,Q.x),this.y=n0(this.y,J.y,Q.y),this.z=n0(this.z,J.z,Q.z),this.w=n0(this.w,J.w,Q.w),this}clampScalar(J,Q){return this.x=n0(this.x,J,Q),this.y=n0(this.y,J,Q),this.z=n0(this.z,J,Q),this.w=n0(this.w,J,Q),this}clampLength(J,Q){let Z=this.length();return this.divideScalar(Z||1).multiplyScalar(n0(Z,J,Q))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(J){return this.x*J.x+this.y*J.y+this.z*J.z+this.w*J.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(J){return this.normalize().multiplyScalar(J)}lerp(J,Q){return this.x+=(J.x-this.x)*Q,this.y+=(J.y-this.y)*Q,this.z+=(J.z-this.z)*Q,this.w+=(J.w-this.w)*Q,this}lerpVectors(J,Q,Z){return this.x=J.x+(Q.x-J.x)*Z,this.y=J.y+(Q.y-J.y)*Z,this.z=J.z+(Q.z-J.z)*Z,this.w=J.w+(Q.w-J.w)*Z,this}equals(J){return J.x===this.x&&J.y===this.y&&J.z===this.z&&J.w===this.w}fromArray(J,Q=0){return this.x=J[Q],this.y=J[Q+1],this.z=J[Q+2],this.w=J[Q+3],this}toArray(J=[],Q=0){return J[Q]=this.x,J[Q+1]=this.y,J[Q+2]=this.z,J[Q+3]=this.w,J}fromBufferAttribute(J,Q){return this.x=J.getX(Q),this.y=J.getY(Q),this.z=J.getZ(Q),this.w=J.getW(Q),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class TZ extends l9{constructor(J=1,Q=1,Z={}){super();Z=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:1006,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},Z),this.isRenderTarget=!0,this.width=J,this.height=Q,this.depth=Z.depth,this.scissor=new OJ(0,0,J,Q),this.scissorTest=!1,this.viewport=new OJ(0,0,J,Q),this.textures=[];let K={width:J,height:Q,depth:Z.depth},$=new vJ(K),X=Z.count;for(let Y=0;Y<X;Y++)this.textures[Y]=$.clone(),this.textures[Y].isRenderTargetTexture=!0,this.textures[Y].renderTarget=this;this._setTextureOptions(Z),this.depthBuffer=Z.depthBuffer,this.stencilBuffer=Z.stencilBuffer,this.resolveColorBuffer=Z.resolveColorBuffer,this.resolveDepthBuffer=Z.resolveDepthBuffer,this.resolveStencilBuffer=Z.resolveStencilBuffer,this.storeMultisampledColorBuffer=Z.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=Z.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=Z.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=Z.depthTexture,this.samples=Z.samples,this.multiview=Z.multiview,this.useArrayDepthTexture=Z.useArrayDepthTexture}_setTextureOptions(J={}){let Q={minFilter:1006,generateMipmaps:!1,flipY:!1,internalFormat:null};if(J.mapping!==void 0)Q.mapping=J.mapping;if(J.wrapS!==void 0)Q.wrapS=J.wrapS;if(J.wrapT!==void 0)Q.wrapT=J.wrapT;if(J.wrapR!==void 0)Q.wrapR=J.wrapR;if(J.magFilter!==void 0)Q.magFilter=J.magFilter;if(J.minFilter!==void 0)Q.minFilter=J.minFilter;if(J.format!==void 0)Q.format=J.format;if(J.type!==void 0)Q.type=J.type;if(J.anisotropy!==void 0)Q.anisotropy=J.anisotropy;if(J.colorSpace!==void 0)Q.colorSpace=J.colorSpace;if(J.flipY!==void 0)Q.flipY=J.flipY;if(J.generateMipmaps!==void 0)Q.generateMipmaps=J.generateMipmaps;if(J.internalFormat!==void 0)Q.internalFormat=J.internalFormat;for(let Z=0;Z<this.textures.length;Z++)this.textures[Z].setValues(Q)}get texture(){return this.textures[0]}set texture(J){this.textures[0]=J}set depthTexture(J){if(this._depthTexture!==null&&this._depthTexture.renderTarget===this)this._depthTexture.renderTarget=null;if(J!==null&&J.renderTarget===null)J.renderTarget=this;this._depthTexture=J}get depthTexture(){return this._depthTexture}setSize(J,Q,Z=1){if(this.width!==J||this.height!==Q||this.depth!==Z){this.width=J,this.height=Q,this.depth=Z;for(let K=0,$=this.textures.length;K<$;K++)if(this.textures[K].image.width=J,this.textures[K].image.height=Q,this.textures[K].image.depth=Z,this.textures[K].isData3DTexture!==!0)this.textures[K].isArrayTexture=this.textures[K].image.depth>1;this.dispose()}this.viewport.set(0,0,J,Q),this.scissor.set(0,0,J,Q)}clone(){return new this.constructor().copy(this)}copy(J){this.width=J.width,this.height=J.height,this.depth=J.depth,this.scissor.copy(J.scissor),this.scissorTest=J.scissorTest,this.viewport.copy(J.viewport),this.textures.length=0;for(let Q=0,Z=J.textures.length;Q<Z;Q++){this.textures[Q]=J.textures[Q].clone(),this.textures[Q].isRenderTargetTexture=!0,this.textures[Q].renderTarget=this;let K=Object.assign({},J.textures[Q].image);this.textures[Q].source=new P7(K)}if(this.depthBuffer=J.depthBuffer,this.stencilBuffer=J.stencilBuffer,this.resolveColorBuffer=J.resolveColorBuffer,this.resolveDepthBuffer=J.resolveDepthBuffer,this.resolveStencilBuffer=J.resolveStencilBuffer,this.storeMultisampledColorBuffer=J.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=J.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=J.storeMultisampledStencilBuffer,J.depthTexture!==null)if(J.depthTexture.renderTarget===J){let Q=J.depthTexture.clone();Q.renderTarget=null,this.depthTexture=Q}else this.depthTexture=J.depthTexture;return this.samples=J.samples,this.multiview=J.multiview,this.useArrayDepthTexture=J.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class K9 extends TZ{constructor(J=1,Q=1,Z={}){super(J,Q,Z);this.isWebGLRenderTarget=!0}}class S6 extends vJ{constructor(J=null,Q=1,Z=1,K=1){super(null);this.isDataArrayTexture=!0,this.image={data:J,width:Q,height:Z,depth:K},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(J){return super.copy(J),this.wrapR=J.wrapR,this}addLayerUpdate(J){this.layerUpdates.add(J)}clearLayerUpdates(){this.layerUpdates.clear()}}class SZ extends vJ{constructor(J=null,Q=1,Z=1,K=1){super(null);this.isData3DTexture=!0,this.image={data:J,width:Q,height:Z,depth:K},this.magFilter=1003,this.minFilter=1003,this.wrapR=1001,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(J){return super.copy(J),this.wrapR=J.wrapR,this}}class KJ{static{KJ.prototype.isMatrix4=!0}constructor(J,Q,Z,K,$,X,Y,W,U,H,N,F,G,D,R,B){if(this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],J!==void 0)this.set(J,Q,Z,K,$,X,Y,W,U,H,N,F,G,D,R,B)}set(J,Q,Z,K,$,X,Y,W,U,H,N,F,G,D,R,B){let q=this.elements;return q[0]=J,q[4]=Q,q[8]=Z,q[12]=K,q[1]=$,q[5]=X,q[9]=Y,q[13]=W,q[2]=U,q[6]=H,q[10]=N,q[14]=F,q[3]=G,q[7]=D,q[11]=R,q[15]=B,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new KJ().fromArray(this.elements)}copy(J){let Q=this.elements,Z=J.elements;return Q[0]=Z[0],Q[1]=Z[1],Q[2]=Z[2],Q[3]=Z[3],Q[4]=Z[4],Q[5]=Z[5],Q[6]=Z[6],Q[7]=Z[7],Q[8]=Z[8],Q[9]=Z[9],Q[10]=Z[10],Q[11]=Z[11],Q[12]=Z[12],Q[13]=Z[13],Q[14]=Z[14],Q[15]=Z[15],this}copyPosition(J){let Q=this.elements,Z=J.elements;return Q[12]=Z[12],Q[13]=Z[13],Q[14]=Z[14],this}setFromMatrix3(J){let Q=J.elements;return this.set(Q[0],Q[3],Q[6],0,Q[1],Q[4],Q[7],0,Q[2],Q[5],Q[8],0,0,0,0,1),this}extractBasis(J,Q,Z){if(this.determinantAffine()===0)return J.set(1,0,0),Q.set(0,1,0),Z.set(0,0,1),this;return J.setFromMatrixColumn(this,0),Q.setFromMatrixColumn(this,1),Z.setFromMatrixColumn(this,2),this}makeBasis(J,Q,Z){return this.set(J.x,Q.x,Z.x,0,J.y,Q.y,Z.y,0,J.z,Q.z,Z.z,0,0,0,0,1),this}extractRotation(J){if(J.determinantAffine()===0)return this.identity();let Q=this.elements,Z=J.elements,K=1/h8.setFromMatrixColumn(J,0).length(),$=1/h8.setFromMatrixColumn(J,1).length(),X=1/h8.setFromMatrixColumn(J,2).length();return Q[0]=Z[0]*K,Q[1]=Z[1]*K,Q[2]=Z[2]*K,Q[3]=0,Q[4]=Z[4]*$,Q[5]=Z[5]*$,Q[6]=Z[6]*$,Q[7]=0,Q[8]=Z[8]*X,Q[9]=Z[9]*X,Q[10]=Z[10]*X,Q[11]=0,Q[12]=0,Q[13]=0,Q[14]=0,Q[15]=1,this}makeRotationFromEuler(J){let Q=this.elements,Z=J.x,K=J.y,$=J.z,X=Math.cos(Z),Y=Math.sin(Z),W=Math.cos(K),U=Math.sin(K),H=Math.cos($),N=Math.sin($);if(J.order==="XYZ"){let F=X*H,G=X*N,D=Y*H,R=Y*N;Q[0]=W*H,Q[4]=-W*N,Q[8]=U,Q[1]=G+D*U,Q[5]=F-R*U,Q[9]=-Y*W,Q[2]=R-F*U,Q[6]=D+G*U,Q[10]=X*W}else if(J.order==="YXZ"){let F=W*H,G=W*N,D=U*H,R=U*N;Q[0]=F+R*Y,Q[4]=D*Y-G,Q[8]=X*U,Q[1]=X*N,Q[5]=X*H,Q[9]=-Y,Q[2]=G*Y-D,Q[6]=R+F*Y,Q[10]=X*W}else if(J.order==="ZXY"){let F=W*H,G=W*N,D=U*H,R=U*N;Q[0]=F-R*Y,Q[4]=-X*N,Q[8]=D+G*Y,Q[1]=G+D*Y,Q[5]=X*H,Q[9]=R-F*Y,Q[2]=-X*U,Q[6]=Y,Q[10]=X*W}else if(J.order==="ZYX"){let F=X*H,G=X*N,D=Y*H,R=Y*N;Q[0]=W*H,Q[4]=D*U-G,Q[8]=F*U+R,Q[1]=W*N,Q[5]=R*U+F,Q[9]=G*U-D,Q[2]=-U,Q[6]=Y*W,Q[10]=X*W}else if(J.order==="YZX"){let F=X*W,G=X*U,D=Y*W,R=Y*U;Q[0]=W*H,Q[4]=R-F*N,Q[8]=D*N+G,Q[1]=N,Q[5]=X*H,Q[9]=-Y*H,Q[2]=-U*H,Q[6]=G*N+D,Q[10]=F-R*N}else if(J.order==="XZY"){let F=X*W,G=X*U,D=Y*W,R=Y*U;Q[0]=W*H,Q[4]=-N,Q[8]=U*H,Q[1]=F*N+R,Q[5]=X*H,Q[9]=G*N-D,Q[2]=D*N-G,Q[6]=Y*H,Q[10]=R*N+F}return Q[3]=0,Q[7]=0,Q[11]=0,Q[12]=0,Q[13]=0,Q[14]=0,Q[15]=1,this}makeRotationFromQuaternion(J){return this.compose(BY,J,IY)}lookAt(J,Q,Z){let K=this.elements;if(eJ.subVectors(J,Q),eJ.lengthSq()===0)eJ.z=1;if(eJ.normalize(),t9.crossVectors(Z,eJ),t9.lengthSq()===0){if(Math.abs(Z.z)===1)eJ.x+=0.0001;else eJ.z+=0.0001;eJ.normalize(),t9.crossVectors(Z,eJ)}return t9.normalize(),i7.crossVectors(eJ,t9),K[0]=t9.x,K[4]=i7.x,K[8]=eJ.x,K[1]=t9.y,K[5]=i7.y,K[9]=eJ.y,K[2]=t9.z,K[6]=i7.z,K[10]=eJ.z,this}multiply(J){return this.multiplyMatrices(this,J)}premultiply(J){return this.multiplyMatrices(J,this)}multiplyMatrices(J,Q){let Z=J.elements,K=Q.elements,$=this.elements,X=Z[0],Y=Z[4],W=Z[8],U=Z[12],H=Z[1],N=Z[5],F=Z[9],G=Z[13],D=Z[2],R=Z[6],B=Z[10],q=Z[14],E=Z[3],z=Z[7],w=Z[11],k=Z[15],C=K[0],_=K[4],A=K[8],O=K[12],V=K[1],b=K[5],P=K[9],f=K[13],u=K[2],T=K[6],p=K[10],o=K[14],m=K[3],Q0=K[7],n=K[11],r=K[15];return $[0]=X*C+Y*V+W*u+U*m,$[4]=X*_+Y*b+W*T+U*Q0,$[8]=X*A+Y*P+W*p+U*n,$[12]=X*O+Y*f+W*o+U*r,$[1]=H*C+N*V+F*u+G*m,$[5]=H*_+N*b+F*T+G*Q0,$[9]=H*A+N*P+F*p+G*n,$[13]=H*O+N*f+F*o+G*r,$[2]=D*C+R*V+B*u+q*m,$[6]=D*_+R*b+B*T+q*Q0,$[10]=D*A+R*P+B*p+q*n,$[14]=D*O+R*f+B*o+q*r,$[3]=E*C+z*V+w*u+k*m,$[7]=E*_+z*b+w*T+k*Q0,$[11]=E*A+z*P+w*p+k*n,$[15]=E*O+z*f+w*o+k*r,this}multiplyScalar(J){let Q=this.elements;return Q[0]*=J,Q[4]*=J,Q[8]*=J,Q[12]*=J,Q[1]*=J,Q[5]*=J,Q[9]*=J,Q[13]*=J,Q[2]*=J,Q[6]*=J,Q[10]*=J,Q[14]*=J,Q[3]*=J,Q[7]*=J,Q[11]*=J,Q[15]*=J,this}determinant(){let J=this.elements,Q=J[0],Z=J[4],K=J[8],$=J[12],X=J[1],Y=J[5],W=J[9],U=J[13],H=J[2],N=J[6],F=J[10],G=J[14],D=J[3],R=J[7],B=J[11],q=J[15],E=W*G-U*F,z=Y*G-U*N,w=Y*F-W*N,k=X*G-U*H,C=X*F-W*H,_=X*N-Y*H;return Q*(R*E-B*z+q*w)-Z*(D*E-B*k+q*C)+K*(D*z-R*k+q*_)-$*(D*w-R*C+B*_)}determinantAffine(){let J=this.elements,Q=J[0],Z=J[4],K=J[8],$=J[1],X=J[5],Y=J[9],W=J[2],U=J[6],H=J[10];return Q*(X*H-Y*U)-Z*($*H-Y*W)+K*($*U-X*W)}transpose(){let J=this.elements,Q;return Q=J[1],J[1]=J[4],J[4]=Q,Q=J[2],J[2]=J[8],J[8]=Q,Q=J[6],J[6]=J[9],J[9]=Q,Q=J[3],J[3]=J[12],J[12]=Q,Q=J[7],J[7]=J[13],J[13]=Q,Q=J[11],J[11]=J[14],J[14]=Q,this}setPosition(J,Q,Z){let K=this.elements;if(J.isVector3)K[12]=J.x,K[13]=J.y,K[14]=J.z;else K[12]=J,K[13]=Q,K[14]=Z;return this}invert(){let J=this.elements,Q=J[0],Z=J[1],K=J[2],$=J[3],X=J[4],Y=J[5],W=J[6],U=J[7],H=J[8],N=J[9],F=J[10],G=J[11],D=J[12],R=J[13],B=J[14],q=J[15],E=Q*Y-Z*X,z=Q*W-K*X,w=Q*U-$*X,k=Z*W-K*Y,C=Z*U-$*Y,_=K*U-$*W,A=H*R-N*D,O=H*B-F*D,V=H*q-G*D,b=N*B-F*R,P=N*q-G*R,f=F*q-G*B,u=E*f-z*P+w*b+k*V-C*O+_*A;if(u===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/u;return J[0]=(Y*f-W*P+U*b)*T,J[1]=(K*P-Z*f-$*b)*T,J[2]=(R*_-B*C+q*k)*T,J[3]=(F*C-N*_-G*k)*T,J[4]=(W*V-X*f-U*O)*T,J[5]=(Q*f-K*V+$*O)*T,J[6]=(B*w-D*_-q*z)*T,J[7]=(H*_-F*w+G*z)*T,J[8]=(X*P-Y*V+U*A)*T,J[9]=(Z*V-Q*P-$*A)*T,J[10]=(D*C-R*w+q*E)*T,J[11]=(N*w-H*C-G*E)*T,J[12]=(Y*O-X*b-W*A)*T,J[13]=(Q*b-Z*O+K*A)*T,J[14]=(R*z-D*k-B*E)*T,J[15]=(H*k-N*z+F*E)*T,this}scale(J){let Q=this.elements,Z=J.x,K=J.y,$=J.z;return Q[0]*=Z,Q[4]*=K,Q[8]*=$,Q[1]*=Z,Q[5]*=K,Q[9]*=$,Q[2]*=Z,Q[6]*=K,Q[10]*=$,Q[3]*=Z,Q[7]*=K,Q[11]*=$,this}getMaxScaleOnAxis(){let J=this.elements,Q=J[0]*J[0]+J[1]*J[1]+J[2]*J[2],Z=J[4]*J[4]+J[5]*J[5]+J[6]*J[6],K=J[8]*J[8]+J[9]*J[9]+J[10]*J[10];return Math.sqrt(Math.max(Q,Z,K))}makeTranslation(J,Q,Z){if(J.isVector3)this.set(1,0,0,J.x,0,1,0,J.y,0,0,1,J.z,0,0,0,1);else this.set(1,0,0,J,0,1,0,Q,0,0,1,Z,0,0,0,1);return this}makeRotationX(J){let Q=Math.cos(J),Z=Math.sin(J);return this.set(1,0,0,0,0,Q,-Z,0,0,Z,Q,0,0,0,0,1),this}makeRotationY(J){let Q=Math.cos(J),Z=Math.sin(J);return this.set(Q,0,Z,0,0,1,0,0,-Z,0,Q,0,0,0,0,1),this}makeRotationZ(J){let Q=Math.cos(J),Z=Math.sin(J);return this.set(Q,-Z,0,0,Z,Q,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(J,Q){let Z=Math.cos(Q),K=Math.sin(Q),$=1-Z,X=J.x,Y=J.y,W=J.z,U=$*X,H=$*Y;return this.set(U*X+Z,U*Y-K*W,U*W+K*Y,0,U*Y+K*W,H*Y+Z,H*W-K*X,0,U*W-K*Y,H*W+K*X,$*W*W+Z,0,0,0,0,1),this}makeScale(J,Q,Z){return this.set(J,0,0,0,0,Q,0,0,0,0,Z,0,0,0,0,1),this}makeShear(J,Q,Z,K,$,X){return this.set(1,Z,$,0,J,1,X,0,Q,K,1,0,0,0,0,1),this}compose(J,Q,Z){let K=this.elements,$=Q._x,X=Q._y,Y=Q._z,W=Q._w,U=$+$,H=X+X,N=Y+Y,F=$*U,G=$*H,D=$*N,R=X*H,B=X*N,q=Y*N,E=W*U,z=W*H,w=W*N,k=Z.x,C=Z.y,_=Z.z;return K[0]=(1-(R+q))*k,K[1]=(G+w)*k,K[2]=(D-z)*k,K[3]=0,K[4]=(G-w)*C,K[5]=(1-(F+q))*C,K[6]=(B+E)*C,K[7]=0,K[8]=(D+z)*_,K[9]=(B-E)*_,K[10]=(1-(F+R))*_,K[11]=0,K[12]=J.x,K[13]=J.y,K[14]=J.z,K[15]=1,this}decompose(J,Q,Z){let K=this.elements;J.x=K[12],J.y=K[13],J.z=K[14];let $=this.determinantAffine();if($===0)return Z.set(1,1,1),Q.identity(),this;let X=h8.set(K[0],K[1],K[2]).length(),Y=h8.set(K[4],K[5],K[6]).length(),W=h8.set(K[8],K[9],K[10]).length();if($<0)X=-X;G9.copy(this);let U=1/X,H=1/Y,N=1/W;return G9.elements[0]*=U,G9.elements[1]*=U,G9.elements[2]*=U,G9.elements[4]*=H,G9.elements[5]*=H,G9.elements[6]*=H,G9.elements[8]*=N,G9.elements[9]*=N,G9.elements[10]*=N,Q.setFromRotationMatrix(G9),Z.x=X,Z.y=Y,Z.z=W,this}makePerspective(J,Q,Z,K,$,X,Y=2000,W=!1){let U=this.elements,H=2*$/(Q-J),N=2*$/(Z-K),F=(Q+J)/(Q-J),G=(Z+K)/(Z-K),D,R;if(W)D=$/(X-$),R=X*$/(X-$);else if(Y===2000)D=-(X+$)/(X-$),R=-2*X*$/(X-$);else if(Y===2001)D=-X/(X-$),R=-X*$/(X-$);else throw Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+Y);return U[0]=H,U[4]=0,U[8]=F,U[12]=0,U[1]=0,U[5]=N,U[9]=G,U[13]=0,U[2]=0,U[6]=0,U[10]=D,U[14]=R,U[3]=0,U[7]=0,U[11]=-1,U[15]=0,this}makeOrthographic(J,Q,Z,K,$,X,Y=2000,W=!1){let U=this.elements,H=2/(Q-J),N=2/(Z-K),F=-(Q+J)/(Q-J),G=-(Z+K)/(Z-K),D,R;if(W)D=1/(X-$),R=X/(X-$);else if(Y===2000)D=-2/(X-$),R=-(X+$)/(X-$);else if(Y===2001)D=-1/(X-$),R=-$/(X-$);else throw Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+Y);return U[0]=H,U[4]=0,U[8]=0,U[12]=F,U[1]=0,U[5]=N,U[9]=0,U[13]=G,U[2]=0,U[6]=0,U[10]=D,U[14]=R,U[3]=0,U[7]=0,U[11]=0,U[15]=1,this}equals(J){let Q=this.elements,Z=J.elements;for(let K=0;K<16;K++)if(Q[K]!==Z[K])return!1;return!0}fromArray(J,Q=0){for(let Z=0;Z<16;Z++)this.elements[Z]=J[Z+Q];return this}toArray(J=[],Q=0){let Z=this.elements;return J[Q]=Z[0],J[Q+1]=Z[1],J[Q+2]=Z[2],J[Q+3]=Z[3],J[Q+4]=Z[4],J[Q+5]=Z[5],J[Q+6]=Z[6],J[Q+7]=Z[7],J[Q+8]=Z[8],J[Q+9]=Z[9],J[Q+10]=Z[10],J[Q+11]=Z[11],J[Q+12]=Z[12],J[Q+13]=Z[13],J[Q+14]=Z[14],J[Q+15]=Z[15],J}}var h8=new h,G9=new KJ,BY=new h(0,0,0),IY=new h(1,1,1),t9=new h,i7=new h,eJ=new h,bK=new KJ,xK=new d9;class p9{constructor(J=0,Q=0,Z=0,K=p9.DEFAULT_ORDER){this.isEuler=!0,this._x=J,this._y=Q,this._z=Z,this._order=K}get x(){return this._x}set x(J){this._x=J,this._onChangeCallback()}get y(){return this._y}set y(J){this._y=J,this._onChangeCallback()}get z(){return this._z}set z(J){this._z=J,this._onChangeCallback()}get order(){return this._order}set order(J){this._order=J,this._onChangeCallback()}set(J,Q,Z,K=this._order){return this._x=J,this._y=Q,this._z=Z,this._order=K,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(J){return this._x=J._x,this._y=J._y,this._z=J._z,this._order=J._order,this._onChangeCallback(),this}setFromRotationMatrix(J,Q=this._order,Z=!0){let K=J.elements,$=K[0],X=K[4],Y=K[8],W=K[1],U=K[5],H=K[9],N=K[2],F=K[6],G=K[10];switch(Q){case"XYZ":if(this._y=Math.asin(n0(Y,-1,1)),Math.abs(Y)<0.9999999)this._x=Math.atan2(-H,G),this._z=Math.atan2(-X,$);else this._x=Math.atan2(F,U),this._z=0;break;case"YXZ":if(this._x=Math.asin(-n0(H,-1,1)),Math.abs(H)<0.9999999)this._y=Math.atan2(Y,G),this._z=Math.atan2(W,U);else this._y=Math.atan2(-N,$),this._z=0;break;case"ZXY":if(this._x=Math.asin(n0(F,-1,1)),Math.abs(F)<0.9999999)this._y=Math.atan2(-N,G),this._z=Math.atan2(-X,U);else this._y=0,this._z=Math.atan2(W,$);break;case"ZYX":if(this._y=Math.asin(-n0(N,-1,1)),Math.abs(N)<0.9999999)this._x=Math.atan2(F,G),this._z=Math.atan2(W,$);else this._x=0,this._z=Math.atan2(-X,U);break;case"YZX":if(this._z=Math.asin(n0(W,-1,1)),Math.abs(W)<0.9999999)this._x=Math.atan2(-H,U),this._y=Math.atan2(-N,$);else this._x=0,this._y=Math.atan2(Y,G);break;case"XZY":if(this._z=Math.asin(-n0(X,-1,1)),Math.abs(X)<0.9999999)this._x=Math.atan2(F,U),this._y=Math.atan2(Y,$);else this._x=Math.atan2(-H,G),this._y=0;break;default:j0("Euler: .setFromRotationMatrix() encountered an unknown order: "+Q)}if(this._order=Q,Z===!0)this._onChangeCallback();return this}setFromQuaternion(J,Q,Z){return bK.makeRotationFromQuaternion(J),this.setFromRotationMatrix(bK,Q,Z)}setFromVector3(J,Q=this._order){return this.set(J.x,J.y,J.z,Q)}reorder(J){return xK.setFromEuler(this),this.setFromQuaternion(xK,J)}equals(J){return J._x===this._x&&J._y===this._y&&J._z===this._z&&J._order===this._order}fromArray(J){if(this._x=J[0],this._y=J[1],this._z=J[2],J[3]!==void 0)this._order=J[3];return this._onChangeCallback(),this}toArray(J=[],Q=0){return J[Q]=this._x,J[Q+1]=this._y,J[Q+2]=this._z,J[Q+3]=this._order,J}_onChange(J){return this._onChangeCallback=J,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}p9.DEFAULT_ORDER="XYZ";class T7{constructor(){this.mask=1}set(J){this.mask=(1<<J|0)>>>0}enable(J){this.mask|=1<<J|0}enableAll(){this.mask=-1}toggle(J){this.mask^=1<<J|0}disable(J){this.mask&=~(1<<J|0)}disableAll(){this.mask=0}test(J){return(this.mask&J.mask)!==0}isEnabled(J){return(this.mask&(1<<J|0))!==0}}var CY=0,gK=new h,b8=new d9,y9=new KJ,o7=new h,F7=new h,zY=new h,_Y=new d9,pK=new h(1,0,0),mK=new h(0,1,0),lK=new h(0,0,1),dK={type:"added"},AY={type:"removed"},x8={type:"childadded",child:null},FQ={type:"childremoved",child:null};class MJ extends l9{constructor(){super();this.isObject3D=!0,Object.defineProperty(this,"id",{value:CY++}),this.uuid=K8(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=MJ.DEFAULT_UP.clone();let J=new h,Q=new p9,Z=new d9,K=new h(1,1,1);function $(){Z.setFromEuler(Q,!1)}function X(){Q.setFromQuaternion(Z,void 0,!1)}Q._onChange($),Z._onChange(X),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:J},rotation:{configurable:!0,enumerable:!0,value:Q},quaternion:{configurable:!0,enumerable:!0,value:Z},scale:{configurable:!0,enumerable:!0,value:K},modelViewMatrix:{value:new KJ},normalMatrix:{value:new f0}}),this.matrix=new KJ,this.matrixWorld=new KJ,this.matrixAutoUpdate=MJ.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=MJ.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new T7,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(J){if(this.matrixAutoUpdate)this.updateMatrix();this.matrix.premultiply(J),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(J){return this.quaternion.premultiply(J),this}setRotationFromAxisAngle(J,Q){this.quaternion.setFromAxisAngle(J,Q)}setRotationFromEuler(J){this.quaternion.setFromEuler(J,!0)}setRotationFromMatrix(J){this.quaternion.setFromRotationMatrix(J)}setRotationFromQuaternion(J){this.quaternion.copy(J)}rotateOnAxis(J,Q){return b8.setFromAxisAngle(J,Q),this.quaternion.multiply(b8),this}rotateOnWorldAxis(J,Q){return b8.setFromAxisAngle(J,Q),this.quaternion.premultiply(b8),this}rotateX(J){return this.rotateOnAxis(pK,J)}rotateY(J){return this.rotateOnAxis(mK,J)}rotateZ(J){return this.rotateOnAxis(lK,J)}translateOnAxis(J,Q){return gK.copy(J).applyQuaternion(this.quaternion),this.position.add(gK.multiplyScalar(Q)),this}translateX(J){return this.translateOnAxis(pK,J)}translateY(J){return this.translateOnAxis(mK,J)}translateZ(J){return this.translateOnAxis(lK,J)}localToWorld(J){return this.updateWorldMatrix(!0,!1),J.applyMatrix4(this.matrixWorld)}worldToLocal(J){return this.updateWorldMatrix(!0,!1),J.applyMatrix4(y9.copy(this.matrixWorld).invert())}lookAt(J,Q,Z){if(J.isVector3)o7.copy(J);else o7.set(J,Q,Z);let K=this.parent;if(this.updateWorldMatrix(!0,!1),F7.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight)y9.lookAt(F7,o7,this.up);else y9.lookAt(o7,F7,this.up);if(this.quaternion.setFromRotationMatrix(y9),K)y9.extractRotation(K.matrixWorld),b8.setFromRotationMatrix(y9),this.quaternion.premultiply(b8.invert())}add(J){if(arguments.length>1){for(let Q=0;Q<arguments.length;Q++)this.add(arguments[Q]);return this}if(J===this)return P0("Object3D.add: object can't be added as a child of itself.",J),this;if(J&&J.isObject3D)J.removeFromParent(),J.parent=this,this.children.push(J),J.dispatchEvent(dK),x8.child=J,this.dispatchEvent(x8),x8.child=null;else P0("Object3D.add: object not an instance of THREE.Object3D.",J);return this}remove(J){if(arguments.length>1){for(let Z=0;Z<arguments.length;Z++)this.remove(arguments[Z]);return this}let Q=this.children.indexOf(J);if(Q!==-1)J.parent=null,this.children.splice(Q,1),J.dispatchEvent(AY),FQ.child=J,this.dispatchEvent(FQ),FQ.child=null;return this}removeFromParent(){let J=this.parent;if(J!==null)J.remove(this);return this}clear(){return this.remove(...this.children)}attach(J){if(this.updateWorldMatrix(!0,!1),y9.copy(this.matrixWorld).invert(),J.parent!==null)J.parent.updateWorldMatrix(!0,!1),y9.multiply(J.parent.matrixWorld);return J.applyMatrix4(y9),J.removeFromParent(),J.parent=this,this.children.push(J),J.updateWorldMatrix(!1,!0),J.dispatchEvent(dK),x8.child=J,this.dispatchEvent(x8),x8.child=null,this}getObjectById(J){return this.getObjectByProperty("id",J)}getObjectByName(J){return this.getObjectByProperty("name",J)}getObjectByProperty(J,Q){if(this[J]===Q)return this;for(let Z=0,K=this.children.length;Z<K;Z++){let X=this.children[Z].getObjectByProperty(J,Q);if(X!==void 0)return X}return}getObjectsByProperty(J,Q,Z=[]){if(this[J]===Q)Z.push(this);let K=this.children;for(let $=0,X=K.length;$<X;$++)K[$].getObjectsByProperty(J,Q,Z);return Z}getWorldPosition(J){return this.updateWorldMatrix(!0,!1),J.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(J){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(F7,J,zY),J}getWorldScale(J){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(F7,_Y,J),J}getWorldDirection(J){this.updateWorldMatrix(!0,!1);let Q=this.matrixWorld.elements;return J.set(Q[8],Q[9],Q[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(J){J(this);let Q=this.children;for(let Z=0,K=Q.length;Z<K;Z++)Q[Z].traverse(J)}traverseVisible(J){if(this.visible===!1)return;J(this);let Q=this.children;for(let Z=0,K=Q.length;Z<K;Z++)Q[Z].traverseVisible(J)}traverseAncestors(J){let Q=this.parent;if(Q!==null)J(Q),Q.traverseAncestors(J)}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let J=this.pivot;if(J!==null){let{x:Q,y:Z,z:K}=J,$=this.matrix.elements;$[12]+=Q-$[0]*Q-$[4]*Z-$[8]*K,$[13]+=Z-$[1]*Q-$[5]*Z-$[9]*K,$[14]+=K-$[2]*Q-$[6]*Z-$[10]*K}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(J){if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||J){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,J=!0}let Q=this.children;for(let Z=0,K=Q.length;Z<K;Z++)Q[Z].updateMatrixWorld(J)}updateWorldMatrix(J,Q,Z=!1){let K=this.parent;if(J===!0&&K!==null)K.updateWorldMatrix(!0,!1);if(this.matrixAutoUpdate)this.updateMatrix();if(this.matrixWorldNeedsUpdate||Z){if(this.matrixWorldAutoUpdate===!0)if(this.parent===null)this.matrixWorld.copy(this.matrix);else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);this.matrixWorldNeedsUpdate=!1,Z=!0}if(Q===!0){let $=this.children;for(let X=0,Y=$.length;X<Y;X++)$[X].updateWorldMatrix(!1,!0,Z)}}toJSON(J){let Q=J===void 0||typeof J==="string",Z={};if(Q)J={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},Z.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"};let K={};if(K.uuid=this.uuid,K.type=this.type,K.name=this.name,K.castShadow=this.castShadow,K.receiveShadow=this.receiveShadow,K.visible=this.visible,K.frustumCulled=this.frustumCulled,K.renderOrder=this.renderOrder,K.static=this.static,K.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0)K.userData=this.userData;if(K.layers=this.layers.mask,K.matrix=this.matrix.toArray(),K.up=this.up.toArray(),this.pivot!==null)K.pivot=this.pivot.toArray();if(this.morphTargetDictionary!==void 0)K.morphTargetDictionary=Object.assign({},this.morphTargetDictionary);if(this.morphTargetInfluences!==void 0)K.morphTargetInfluences=this.morphTargetInfluences.slice();if(this.isInstancedMesh){if(K.type="InstancedMesh",K.count=this.count,K.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null)K.instanceColor=this.instanceColor.toJSON()}if(this.isBatchedMesh){if(K.type="BatchedMesh",K.perObjectFrustumCulled=this.perObjectFrustumCulled,K.sortObjects=this.sortObjects,K.drawRanges=this._drawRanges,K.reservedRanges=this._reservedRanges,K.geometryInfo=this._geometryInfo.map((Y)=>({...Y,boundingBox:Y.boundingBox?Y.boundingBox.toJSON():void 0,boundingSphere:Y.boundingSphere?Y.boundingSphere.toJSON():void 0})),K.instanceInfo=this._instanceInfo.map((Y)=>({...Y})),K.availableInstanceIds=this._availableInstanceIds.slice(),K.availableGeometryIds=this._availableGeometryIds.slice(),K.nextIndexStart=this._nextIndexStart,K.nextVertexStart=this._nextVertexStart,K.geometryCount=this._geometryCount,K.maxInstanceCount=this._maxInstanceCount,K.maxVertexCount=this._maxVertexCount,K.maxIndexCount=this._maxIndexCount,K.geometryInitialized=this._geometryInitialized,K.matricesTexture=this._matricesTexture.toJSON(J),K.indirectTexture=this._indirectTexture.toJSON(J),this._colorsTexture!==null)K.colorsTexture=this._colorsTexture.toJSON(J);if(this.boundingSphere!==null)K.boundingSphere=this.boundingSphere.toJSON();if(this.boundingBox!==null)K.boundingBox=this.boundingBox.toJSON()}function $(Y,W){if(Y[W.uuid]===void 0)Y[W.uuid]=W.toJSON(J);return W.uuid}if(this.isScene){if(this.background){if(this.background.isColor)K.background=this.background.toJSON();else if(this.background.isTexture)K.background=this.background.toJSON(J).uuid}if(this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0)K.environment=this.environment.toJSON(J).uuid}else if(this.isMesh||this.isLine||this.isPoints){K.geometry=$(J.geometries,this.geometry);let Y=this.geometry.parameters;if(Y!==void 0&&Y.shapes!==void 0){let W=Y.shapes;if(Array.isArray(W))for(let U=0,H=W.length;U<H;U++){let N=W[U];$(J.shapes,N)}else $(J.shapes,W)}}if(this.isSkinnedMesh){if(K.bindMode=this.bindMode,K.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0)$(J.skeletons,this.skeleton),K.skeleton=this.skeleton.uuid}if(this.material!==void 0)if(Array.isArray(this.material)){let Y=[];for(let W=0,U=this.material.length;W<U;W++)Y.push($(J.materials,this.material[W]));K.material=Y}else K.material=$(J.materials,this.material);if(this.children.length>0){K.children=[];for(let Y=0;Y<this.children.length;Y++)K.children.push(this.children[Y].toJSON(J).object)}if(this.animations.length>0){K.animations=[];for(let Y=0;Y<this.animations.length;Y++){let W=this.animations[Y];K.animations.push($(J.animations,W))}}if(Q){let Y=X(J.geometries),W=X(J.materials),U=X(J.textures),H=X(J.images),N=X(J.shapes),F=X(J.skeletons),G=X(J.animations),D=X(J.nodes);if(Y.length>0)Z.geometries=Y;if(W.length>0)Z.materials=W;if(U.length>0)Z.textures=U;if(H.length>0)Z.images=H;if(N.length>0)Z.shapes=N;if(F.length>0)Z.skeletons=F;if(G.length>0)Z.animations=G;if(D.length>0)Z.nodes=D}return Z.object=K,Z;function X(Y){let W=[];for(let U in Y){let H=Y[U];delete H.metadata,W.push(H)}return W}}clone(J){return new this.constructor().copy(this,J)}copy(J,Q=!0){if(this.name=J.name,this.up.copy(J.up),this.position.copy(J.position),this.rotation.order=J.rotation.order,this.quaternion.copy(J.quaternion),this.scale.copy(J.scale),this.pivot=J.pivot!==null?J.pivot.clone():null,this.matrix.copy(J.matrix),this.matrixWorld.copy(J.matrixWorld),this.matrixAutoUpdate=J.matrixAutoUpdate,this.matrixWorldAutoUpdate=J.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=J.matrixWorldNeedsUpdate,this.layers.mask=J.layers.mask,this.visible=J.visible,this.castShadow=J.castShadow,this.receiveShadow=J.receiveShadow,this.frustumCulled=J.frustumCulled,this.renderOrder=J.renderOrder,this.static=J.static,this.animations=J.animations.slice(),this.userData=JSON.parse(JSON.stringify(J.userData)),Q===!0)for(let Z=0;Z<J.children.length;Z++){let K=J.children[Z];this.add(K.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}MJ.DEFAULT_UP=new h(0,1,0);MJ.DEFAULT_MATRIX_AUTO_UPDATE=!0;MJ.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class AJ extends MJ{constructor(){super();this.isGroup=!0,this.type="Group"}}var wY={type:"move"};class S7{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){if(this._hand===null)this._hand=new AJ,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1};return this._hand}getTargetRaySpace(){if(this._targetRay===null)this._targetRay=new AJ,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new h,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new h;return this._targetRay}getGripSpace(){if(this._grip===null)this._grip=new AJ,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new h,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new h,this._grip.eventsEnabled=!1;return this._grip}dispatchEvent(J){if(this._targetRay!==null)this._targetRay.dispatchEvent(J);if(this._grip!==null)this._grip.dispatchEvent(J);if(this._hand!==null)this._hand.dispatchEvent(J);return this}connect(J){if(J&&J.hand){let Q=this._hand;if(Q)for(let Z of J.hand.values())this._getHandJoint(Q,Z)}return this.dispatchEvent({type:"connected",data:J}),this}disconnect(J){if(this.dispatchEvent({type:"disconnected",data:J}),this._targetRay!==null)this._targetRay.visible=!1;if(this._grip!==null)this._grip.visible=!1;if(this._hand!==null)this._hand.visible=!1;return this}update(J,Q,Z){let K=null,$=null,X=null,Y=this._targetRay,W=this._grip,U=this._hand;if(J&&Q.session.visibilityState!=="visible-blurred"){if(U&&J.hand){X=!0;for(let R of J.hand.values()){let B=Q.getJointPose(R,Z),q=this._getHandJoint(U,R);if(B!==null)q.matrix.fromArray(B.transform.matrix),q.matrix.decompose(q.position,q.rotation,q.scale),q.matrixWorldNeedsUpdate=!0,q.jointRadius=B.radius;q.visible=B!==null}let H=U.joints["index-finger-tip"],N=U.joints["thumb-tip"],F=H.position.distanceTo(N.position),G=0.02,D=0.005;if(U.inputState.pinching&&F>G+D)U.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:J.handedness,target:this});else if(!U.inputState.pinching&&F<=G-D)U.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:J.handedness,target:this})}else if(W!==null&&J.gripSpace){if($=Q.getPose(J.gripSpace,Z),$!==null){if(W.matrix.fromArray($.transform.matrix),W.matrix.decompose(W.position,W.rotation,W.scale),W.matrixWorldNeedsUpdate=!0,$.linearVelocity)W.hasLinearVelocity=!0,W.linearVelocity.copy($.linearVelocity);else W.hasLinearVelocity=!1;if($.angularVelocity)W.hasAngularVelocity=!0,W.angularVelocity.copy($.angularVelocity);else W.hasAngularVelocity=!1;if(W.eventsEnabled)W.dispatchEvent({type:"gripUpdated",data:J,target:this})}}if(Y!==null){if(K=Q.getPose(J.targetRaySpace,Z),K===null&&$!==null)K=$;if(K!==null){if(Y.matrix.fromArray(K.transform.matrix),Y.matrix.decompose(Y.position,Y.rotation,Y.scale),Y.matrixWorldNeedsUpdate=!0,K.linearVelocity)Y.hasLinearVelocity=!0,Y.linearVelocity.copy(K.linearVelocity);else Y.hasLinearVelocity=!1;if(K.angularVelocity)Y.hasAngularVelocity=!0,Y.angularVelocity.copy(K.angularVelocity);else Y.hasAngularVelocity=!1;this.dispatchEvent(wY)}}}if(Y!==null)Y.visible=K!==null;if(W!==null)W.visible=$!==null;if(U!==null)U.visible=X!==null;return this}_getHandJoint(J,Q){if(J.joints[Q.jointName]===void 0){let Z=new AJ;Z.matrixAutoUpdate=!1,Z.visible=!1,J.joints[Q.jointName]=Z,J.add(Z)}return J.joints[Q.jointName]}}var WX={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},e9={h:0,s:0,l:0},a7={h:0,s:0,l:0};function qQ(J,Q,Z){if(Z<0)Z+=1;if(Z>1)Z-=1;if(Z<0.16666666666666666)return J+(Q-J)*6*Z;if(Z<0.5)return Q;if(Z<0.6666666666666666)return J+(Q-J)*6*(0.6666666666666666-Z);return J}class x0{constructor(J,Q,Z){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(J,Q,Z)}set(J,Q,Z){if(Q===void 0&&Z===void 0){let K=J;if(K&&K.isColor)this.copy(K);else if(typeof K==="number")this.setHex(K);else if(typeof K==="string")this.setStyle(K)}else this.setRGB(J,Q,Z);return this}setScalar(J){return this.r=J,this.g=J,this.b=J,this}setHex(J,Q="srgb"){return J=Math.floor(J),this.r=(J>>16&255)/255,this.g=(J>>8&255)/255,this.b=(J&255)/255,u0.colorSpaceToWorking(this,Q),this}setRGB(J,Q,Z,K=u0.workingColorSpace){return this.r=J,this.g=Q,this.b=Z,u0.colorSpaceToWorking(this,K),this}setHSL(J,Q,Z,K=u0.workingColorSpace){if(J=LY(J,1),Q=n0(Q,0,1),Z=n0(Z,0,1),Q===0)this.r=this.g=this.b=Z;else{let $=Z<=0.5?Z*(1+Q):Z+Q-Z*Q,X=2*Z-$;this.r=qQ(X,$,J+0.3333333333333333),this.g=qQ(X,$,J),this.b=qQ(X,$,J-0.3333333333333333)}return u0.colorSpaceToWorking(this,K),this}setStyle(J,Q="srgb"){function Z($){if($===void 0)return;if(parseFloat($)<1)j0("Color: Alpha component of "+J+" will be ignored.")}let K;if(K=/^(\w+)\(([^\)]*)\)/.exec(J)){let $,X=K[1],Y=K[2];switch(X){case"rgb":case"rgba":if($=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(Y))return Z($[4]),this.setRGB(Math.min(255,parseInt($[1],10))/255,Math.min(255,parseInt($[2],10))/255,Math.min(255,parseInt($[3],10))/255,Q);if($=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(Y))return Z($[4]),this.setRGB(Math.min(100,parseInt($[1],10))/100,Math.min(100,parseInt($[2],10))/100,Math.min(100,parseInt($[3],10))/100,Q);break;case"hsl":case"hsla":if($=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(Y))return Z($[4]),this.setHSL(parseFloat($[1])/360,parseFloat($[2])/100,parseFloat($[3])/100,Q);break;default:j0("Color: Unknown color model "+J)}}else if(K=/^\#([A-Fa-f\d]+)$/.exec(J)){let $=K[1],X=$.length;if(X===3)return this.setRGB(parseInt($.charAt(0),16)/15,parseInt($.charAt(1),16)/15,parseInt($.charAt(2),16)/15,Q);else if(X===6)return this.setHex(parseInt($,16),Q);else j0("Color: Invalid hex color "+J)}else if(J&&J.length>0)return this.setColorName(J,Q);return this}setColorName(J,Q="srgb"){let Z=WX[J.toLowerCase()];if(Z!==void 0)this.setHex(Z,Q);else j0("Color: Unknown color "+J);return this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(J){return this.r=J.r,this.g=J.g,this.b=J.b,this}copySRGBToLinear(J){return this.r=g9(J.r),this.g=g9(J.g),this.b=g9(J.b),this}copyLinearToSRGB(J){return this.r=e8(J.r),this.g=e8(J.g),this.b=e8(J.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(J="srgb"){return u0.workingToColorSpace(hJ.copy(this),J),Math.round(n0(hJ.r*255,0,255))*65536+Math.round(n0(hJ.g*255,0,255))*256+Math.round(n0(hJ.b*255,0,255))}getHexString(J="srgb"){return("000000"+this.getHex(J).toString(16)).slice(-6)}getHSL(J,Q=u0.workingColorSpace){u0.workingToColorSpace(hJ.copy(this),Q);let{r:Z,g:K,b:$}=hJ,X=Math.max(Z,K,$),Y=Math.min(Z,K,$),W,U,H=(Y+X)/2;if(Y===X)W=0,U=0;else{let N=X-Y;switch(U=H<=0.5?N/(X+Y):N/(2-X-Y),X){case Z:W=(K-$)/N+(K<$?6:0);break;case K:W=($-Z)/N+2;break;case $:W=(Z-K)/N+4;break}W/=6}return J.h=W,J.s=U,J.l=H,J}getRGB(J,Q=u0.workingColorSpace){return u0.workingToColorSpace(hJ.copy(this),Q),J.r=hJ.r,J.g=hJ.g,J.b=hJ.b,J}getStyle(J="srgb"){u0.workingToColorSpace(hJ.copy(this),J);let{r:Q,g:Z,b:K}=hJ;if(J!=="srgb")return`color(${J} ${Q.toFixed(3)} ${Z.toFixed(3)} ${K.toFixed(3)})`;return`rgb(${Math.round(Q*255)},${Math.round(Z*255)},${Math.round(K*255)})`}offsetHSL(J,Q,Z){return this.getHSL(e9),this.setHSL(e9.h+J,e9.s+Q,e9.l+Z)}add(J){return this.r+=J.r,this.g+=J.g,this.b+=J.b,this}addColors(J,Q){return this.r=J.r+Q.r,this.g=J.g+Q.g,this.b=J.b+Q.b,this}addScalar(J){return this.r+=J,this.g+=J,this.b+=J,this}sub(J){return this.r=Math.max(0,this.r-J.r),this.g=Math.max(0,this.g-J.g),this.b=Math.max(0,this.b-J.b),this}multiply(J){return this.r*=J.r,this.g*=J.g,this.b*=J.b,this}multiplyScalar(J){return this.r*=J,this.g*=J,this.b*=J,this}lerp(J,Q){return this.r+=(J.r-this.r)*Q,this.g+=(J.g-this.g)*Q,this.b+=(J.b-this.b)*Q,this}lerpColors(J,Q,Z){return this.r=J.r+(Q.r-J.r)*Z,this.g=J.g+(Q.g-J.g)*Z,this.b=J.b+(Q.b-J.b)*Z,this}lerpHSL(J,Q){this.getHSL(e9),J.getHSL(a7);let Z=UQ(e9.h,a7.h,Q),K=UQ(e9.s,a7.s,Q),$=UQ(e9.l,a7.l,Q);return this.setHSL(Z,K,$),this}setFromVector3(J){return this.r=J.x,this.g=J.y,this.b=J.z,this}applyMatrix3(J){let Q=this.r,Z=this.g,K=this.b,$=J.elements;return this.r=$[0]*Q+$[3]*Z+$[6]*K,this.g=$[1]*Q+$[4]*Z+$[7]*K,this.b=$[2]*Q+$[5]*Z+$[8]*K,this}equals(J){return J.r===this.r&&J.g===this.g&&J.b===this.b}fromArray(J,Q=0){return this.r=J[Q],this.g=J[Q+1],this.b=J[Q+2],this}toArray(J=[],Q=0){return J[Q]=this.r,J[Q+1]=this.g,J[Q+2]=this.b,J}fromBufferAttribute(J,Q){return this.r=J.getX(Q),this.g=J.getY(Q),this.b=J.getZ(Q),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}var hJ=new x0;x0.NAMES=WX;class j7{constructor(J,Q=1,Z=1000){this.isFog=!0,this.name="",this.color=new x0(J),this.near=Q,this.far=Z}clone(){return new j7(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class j6 extends MJ{constructor(){super();if(this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new p9,this.environmentIntensity=1,this.environmentRotation=new p9,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(J,Q){if(super.copy(J,Q),J.background!==null)this.background=J.background.clone();if(J.environment!==null)this.environment=J.environment.clone();if(J.fog!==null)this.fog=J.fog.clone();if(this.backgroundBlurriness=J.backgroundBlurriness,this.backgroundIntensity=J.backgroundIntensity,this.backgroundRotation.copy(J.backgroundRotation),this.environmentIntensity=J.environmentIntensity,this.environmentRotation.copy(J.environmentRotation),J.overrideMaterial!==null)this.overrideMaterial=J.overrideMaterial.clone();return this.matrixAutoUpdate=J.matrixAutoUpdate,this}toJSON(J){let Q=super.toJSON(J);if(this.fog!==null)Q.object.fog=this.fog.toJSON();return Q.object.backgroundBlurriness=this.backgroundBlurriness,Q.object.backgroundIntensity=this.backgroundIntensity,Q.object.backgroundRotation=this.backgroundRotation.toArray(),Q.object.environmentIntensity=this.environmentIntensity,Q.object.environmentRotation=this.environmentRotation.toArray(),Q}}var N9=new h,f9=new h,DQ=new h,h9=new h,g8=new h,p8=new h,uK=new h,OQ=new h,RQ=new h,LQ=new h,VQ=new OJ,MQ=new OJ,kQ=new OJ;class Q9{constructor(J=new h,Q=new h,Z=new h){this.a=J,this.b=Q,this.c=Z}static getNormal(J,Q,Z,K){K.subVectors(Z,Q),N9.subVectors(J,Q),K.cross(N9);let $=K.lengthSq();if($>0)return K.multiplyScalar(1/Math.sqrt($));return K.set(0,0,0)}static getBarycoord(J,Q,Z,K,$){N9.subVectors(K,Q),f9.subVectors(Z,Q),DQ.subVectors(J,Q);let X=N9.dot(N9),Y=N9.dot(f9),W=N9.dot(DQ),U=f9.dot(f9),H=f9.dot(DQ),N=X*U-Y*Y;if(N===0)return $.set(0,0,0),null;let F=1/N,G=(U*W-Y*H)*F,D=(X*H-Y*W)*F;return $.set(1-G-D,D,G)}static containsPoint(J,Q,Z,K){if(this.getBarycoord(J,Q,Z,K,h9)===null)return!1;return h9.x>=0&&h9.y>=0&&h9.x+h9.y<=1}static getInterpolation(J,Q,Z,K,$,X,Y,W){if(this.getBarycoord(J,Q,Z,K,h9)===null){if(W.x=0,W.y=0,"z"in W)W.z=0;if("w"in W)W.w=0;return null}return W.setScalar(0),W.addScaledVector($,h9.x),W.addScaledVector(X,h9.y),W.addScaledVector(Y,h9.z),W}static getInterpolatedAttribute(J,Q,Z,K,$,X){return VQ.setScalar(0),MQ.setScalar(0),kQ.setScalar(0),VQ.fromBufferAttribute(J,Q),MQ.fromBufferAttribute(J,Z),kQ.fromBufferAttribute(J,K),X.setScalar(0),X.addScaledVector(VQ,$.x),X.addScaledVector(MQ,$.y),X.addScaledVector(kQ,$.z),X}static isFrontFacing(J,Q,Z,K){return N9.subVectors(Z,Q),f9.subVectors(J,Q),N9.cross(f9).dot(K)<0}set(J,Q,Z){return this.a.copy(J),this.b.copy(Q),this.c.copy(Z),this}setFromPointsAndIndices(J,Q,Z,K){return this.a.copy(J[Q]),this.b.copy(J[Z]),this.c.copy(J[K]),this}setFromAttributeAndIndices(J,Q,Z,K){return this.a.fromBufferAttribute(J,Q),this.b.fromBufferAttribute(J,Z),this.c.fromBufferAttribute(J,K),this}clone(){return new this.constructor().copy(this)}copy(J){return this.a.copy(J.a),this.b.copy(J.b),this.c.copy(J.c),this}getArea(){return N9.subVectors(this.c,this.b),f9.subVectors(this.a,this.b),N9.cross(f9).length()*0.5}getMidpoint(J){return J.addVectors(this.a,this.b).add(this.c).multiplyScalar(0.3333333333333333)}getNormal(J){return Q9.getNormal(this.a,this.b,this.c,J)}getPlane(J){return J.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(J,Q){return Q9.getBarycoord(J,this.a,this.b,this.c,Q)}getInterpolation(J,Q,Z,K,$){return Q9.getInterpolation(J,this.a,this.b,this.c,Q,Z,K,$)}containsPoint(J){return Q9.containsPoint(J,this.a,this.b,this.c)}isFrontFacing(J){return Q9.isFrontFacing(this.a,this.b,this.c,J)}intersectsBox(J){return J.intersectsTriangle(this)}closestPointToPoint(J,Q){let Z=this.a,K=this.b,$=this.c,X,Y;g8.subVectors(K,Z),p8.subVectors($,Z),OQ.subVectors(J,Z);let W=g8.dot(OQ),U=p8.dot(OQ);if(W<=0&&U<=0)return Q.copy(Z);RQ.subVectors(J,K);let H=g8.dot(RQ),N=p8.dot(RQ);if(H>=0&&N<=H)return Q.copy(K);let F=W*N-H*U;if(F<=0&&W>=0&&H<=0)return X=W/(W-H),Q.copy(Z).addScaledVector(g8,X);LQ.subVectors(J,$);let G=g8.dot(LQ),D=p8.dot(LQ);if(D>=0&&G<=D)return Q.copy($);let R=G*U-W*D;if(R<=0&&U>=0&&D<=0)return Y=U/(U-D),Q.copy(Z).addScaledVector(p8,Y);let B=H*D-G*N;if(B<=0&&N-H>=0&&G-D>=0)return uK.subVectors($,K),Y=(N-H)/(N-H+(G-D)),Q.copy(K).addScaledVector(uK,Y);let q=1/(B+R+F);return X=R*q,Y=F*q,Q.copy(Z).addScaledVector(g8,X).addScaledVector(p8,Y)}equals(J){return J.a.equals(this.a)&&J.b.equals(this.b)&&J.c.equals(this.c)}}class u9{constructor(J=new h(1/0,1/0,1/0),Q=new h(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=J,this.max=Q}set(J,Q){return this.min.copy(J),this.max.copy(Q),this}setFromArray(J){this.makeEmpty();for(let Q=0,Z=J.length;Q<Z;Q+=3)this.expandByPoint(E9.fromArray(J,Q));return this}setFromBufferAttribute(J){this.makeEmpty();for(let Q=0,Z=J.count;Q<Z;Q++)this.expandByPoint(E9.fromBufferAttribute(J,Q));return this}setFromPoints(J){this.makeEmpty();for(let Q=0,Z=J.length;Q<Z;Q++)this.expandByPoint(J[Q]);return this}setFromCenterAndSize(J,Q){let Z=E9.copy(Q).multiplyScalar(0.5);return this.min.copy(J).sub(Z),this.max.copy(J).add(Z),this}setFromObject(J,Q=!1){return this.makeEmpty(),this.expandByObject(J,Q)}clone(){return new this.constructor().copy(this)}copy(J){return this.min.copy(J.min),this.max.copy(J.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(J){return this.isEmpty()?J.set(0,0,0):J.addVectors(this.min,this.max).multiplyScalar(0.5)}getSize(J){return this.isEmpty()?J.set(0,0,0):J.subVectors(this.max,this.min)}expandByPoint(J){return this.min.min(J),this.max.max(J),this}expandByVector(J){return this.min.sub(J),this.max.add(J),this}expandByScalar(J){return this.min.addScalar(-J),this.max.addScalar(J),this}expandByObject(J,Q=!1){J.updateWorldMatrix(!1,!1);let Z=J.geometry;if(Z!==void 0){let $=Z.getAttribute("position");if(Q===!0&&$!==void 0&&J.isInstancedMesh!==!0)for(let X=0,Y=$.count;X<Y;X++){if(J.isMesh===!0)J.getVertexPosition(X,E9);else E9.fromBufferAttribute($,X);E9.applyMatrix4(J.matrixWorld),this.expandByPoint(E9)}else{if(J.boundingBox!==void 0){if(J.boundingBox===null)J.computeBoundingBox();r7.copy(J.boundingBox)}else{if(Z.boundingBox===null)Z.computeBoundingBox();r7.copy(Z.boundingBox)}r7.applyMatrix4(J.matrixWorld),this.union(r7)}}let K=J.children;for(let $=0,X=K.length;$<X;$++)this.expandByObject(K[$],Q);return this}containsPoint(J){return J.x>=this.min.x&&J.x<=this.max.x&&J.y>=this.min.y&&J.y<=this.max.y&&J.z>=this.min.z&&J.z<=this.max.z}containsBox(J){return this.min.x<=J.min.x&&J.max.x<=this.max.x&&this.min.y<=J.min.y&&J.max.y<=this.max.y&&this.min.z<=J.min.z&&J.max.z<=this.max.z}getParameter(J,Q){return Q.set((J.x-this.min.x)/(this.max.x-this.min.x),(J.y-this.min.y)/(this.max.y-this.min.y),(J.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(J){return J.max.x>=this.min.x&&J.min.x<=this.max.x&&J.max.y>=this.min.y&&J.min.y<=this.max.y&&J.max.z>=this.min.z&&J.min.z<=this.max.z}intersectsSphere(J){return this.clampPoint(J.center,E9),E9.distanceToSquared(J.center)<=J.radius*J.radius}intersectsPlane(J){let Q,Z;if(J.normal.x>0)Q=J.normal.x*this.min.x,Z=J.normal.x*this.max.x;else Q=J.normal.x*this.max.x,Z=J.normal.x*this.min.x;if(J.normal.y>0)Q+=J.normal.y*this.min.y,Z+=J.normal.y*this.max.y;else Q+=J.normal.y*this.max.y,Z+=J.normal.y*this.min.y;if(J.normal.z>0)Q+=J.normal.z*this.min.z,Z+=J.normal.z*this.max.z;else Q+=J.normal.z*this.max.z,Z+=J.normal.z*this.min.z;return Q<=-J.constant&&Z>=-J.constant}intersectsTriangle(J){if(this.isEmpty())return!1;this.getCenter(q7),t7.subVectors(this.max,q7),m8.subVectors(J.a,q7),l8.subVectors(J.b,q7),d8.subVectors(J.c,q7),J8.subVectors(l8,m8),Q8.subVectors(d8,l8),N8.subVectors(m8,d8);let Q=[0,-J8.z,J8.y,0,-Q8.z,Q8.y,0,-N8.z,N8.y,J8.z,0,-J8.x,Q8.z,0,-Q8.x,N8.z,0,-N8.x,-J8.y,J8.x,0,-Q8.y,Q8.x,0,-N8.y,N8.x,0];if(!BQ(Q,m8,l8,d8,t7))return!1;if(Q=[1,0,0,0,1,0,0,0,1],!BQ(Q,m8,l8,d8,t7))return!1;return e7.crossVectors(J8,Q8),Q=[e7.x,e7.y,e7.z],BQ(Q,m8,l8,d8,t7)}clampPoint(J,Q){return Q.copy(J).clamp(this.min,this.max)}distanceToPoint(J){return this.clampPoint(J,E9).distanceTo(J)}getBoundingSphere(J){if(this.isEmpty())J.makeEmpty();else this.getCenter(J.center),J.radius=this.getSize(E9).length()*0.5;return J}intersect(J){if(this.min.max(J.min),this.max.min(J.max),this.isEmpty())this.makeEmpty();return this}union(J){return this.min.min(J.min),this.max.max(J.max),this}applyMatrix4(J){if(this.isEmpty())return this;return b9[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(J),b9[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(J),b9[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(J),b9[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(J),b9[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(J),b9[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(J),b9[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(J),b9[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(J),this.setFromPoints(b9),this}translate(J){return this.min.add(J),this.max.add(J),this}equals(J){return J.min.equals(this.min)&&J.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(J){return this.min.fromArray(J.min),this.max.fromArray(J.max),this}}var b9=[new h,new h,new h,new h,new h,new h,new h,new h],E9=new h,r7=new u9,m8=new h,l8=new h,d8=new h,J8=new h,Q8=new h,N8=new h,q7=new h,t7=new h,e7=new h,E8=new h;function BQ(J,Q,Z,K,$){for(let X=0,Y=J.length-3;X<=Y;X+=3){E8.fromArray(J,X);let W=$.x*Math.abs(E8.x)+$.y*Math.abs(E8.y)+$.z*Math.abs(E8.z),U=Q.dot(E8),H=Z.dot(E8),N=K.dot(E8);if(Math.max(-Math.max(U,H,N),Math.min(U,H,N))>W)return!1}return!0}var IJ=new h,J6=new v0,PY=0;class Z9 extends l9{constructor(J,Q,Z=!1){super();if(Array.isArray(J))throw TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:PY++}),this.name="",this.array=J,this.itemSize=Q,this.count=J!==void 0?J.length/Q:0,this.normalized=Z,this.usage=35044,this.updateRanges=[],this.gpuType=1015,this.version=0}onUploadCallback(){}set needsUpdate(J){if(J===!0)this.version++}setUsage(J){return this.usage=J,this}addUpdateRange(J,Q){this.updateRanges.push({start:J,count:Q})}clearUpdateRanges(){this.updateRanges.length=0}copy(J){return this.name=J.name,this.array=new J.array.constructor(J.array),this.itemSize=J.itemSize,this.count=J.count,this.normalized=J.normalized,this.usage=J.usage,this.gpuType=J.gpuType,this}copyAt(J,Q,Z){J*=this.itemSize,Z*=Q.itemSize;for(let K=0,$=this.itemSize;K<$;K++)this.array[J+K]=Q.array[Z+K];return this}copyArray(J){return this.array.set(J),this}applyMatrix3(J){if(this.itemSize===2)for(let Q=0,Z=this.count;Q<Z;Q++)J6.fromBufferAttribute(this,Q),J6.applyMatrix3(J),this.setXY(Q,J6.x,J6.y);else if(this.itemSize===3)for(let Q=0,Z=this.count;Q<Z;Q++)IJ.fromBufferAttribute(this,Q),IJ.applyMatrix3(J),this.setXYZ(Q,IJ.x,IJ.y,IJ.z);return this}applyMatrix4(J){for(let Q=0,Z=this.count;Q<Z;Q++)IJ.fromBufferAttribute(this,Q),IJ.applyMatrix4(J),this.setXYZ(Q,IJ.x,IJ.y,IJ.z);return this}applyNormalMatrix(J){for(let Q=0,Z=this.count;Q<Z;Q++)IJ.fromBufferAttribute(this,Q),IJ.applyNormalMatrix(J),this.setXYZ(Q,IJ.x,IJ.y,IJ.z);return this}transformDirection(J){for(let Q=0,Z=this.count;Q<Z;Q++)IJ.fromBufferAttribute(this,Q),IJ.transformDirection(J),this.setXYZ(Q,IJ.x,IJ.y,IJ.z);return this}set(J,Q=0){return this.array.set(J,Q),this}getComponent(J,Q){let Z=this.array[J*this.itemSize+Q];if(this.normalized)Z=V9(Z,this.array);return Z}setComponent(J,Q,Z){if(this.normalized)Z=XJ(Z,this.array);return this.array[J*this.itemSize+Q]=Z,this}getX(J){let Q=this.array[J*this.itemSize];if(this.normalized)Q=V9(Q,this.array);return Q}setX(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.array[J*this.itemSize]=Q,this}getY(J){let Q=this.array[J*this.itemSize+1];if(this.normalized)Q=V9(Q,this.array);return Q}setY(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.array[J*this.itemSize+1]=Q,this}getZ(J){let Q=this.array[J*this.itemSize+2];if(this.normalized)Q=V9(Q,this.array);return Q}setZ(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.array[J*this.itemSize+2]=Q,this}getW(J){let Q=this.array[J*this.itemSize+3];if(this.normalized)Q=V9(Q,this.array);return Q}setW(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.array[J*this.itemSize+3]=Q,this}setXY(J,Q,Z){if(J*=this.itemSize,this.normalized)Q=XJ(Q,this.array),Z=XJ(Z,this.array);return this.array[J+0]=Q,this.array[J+1]=Z,this}setXYZ(J,Q,Z,K){if(J*=this.itemSize,this.normalized)Q=XJ(Q,this.array),Z=XJ(Z,this.array),K=XJ(K,this.array);return this.array[J+0]=Q,this.array[J+1]=Z,this.array[J+2]=K,this}setXYZW(J,Q,Z,K,$){if(J*=this.itemSize,this.normalized)Q=XJ(Q,this.array),Z=XJ(Z,this.array),K=XJ(K,this.array),$=XJ($,this.array);return this.array[J+0]=Q,this.array[J+1]=Z,this.array[J+2]=K,this.array[J+3]=$,this}onUpload(J){return this.onUploadCallback=J,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let J={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return J.name=this.name,J.usage=this.usage,J.gpuType=this.gpuType,J}dispose(){this.dispatchEvent({type:"dispose"})}}class v6 extends Z9{constructor(J,Q,Z){super(new Uint16Array(J),Q,Z)}}class y6 extends Z9{constructor(J,Q,Z){super(new Uint32Array(J),Q,Z)}}class LJ extends Z9{constructor(J,Q,Z){super(new Float32Array(J),Q,Z)}}var TY=new u9,D7=new h,IQ=new h;class C8{constructor(J=new h,Q=-1){this.isSphere=!0,this.center=J,this.radius=Q}set(J,Q){return this.center.copy(J),this.radius=Q,this}setFromPoints(J,Q){let Z=this.center;if(Q!==void 0)Z.copy(Q);else TY.setFromPoints(J).getCenter(Z);let K=0;for(let $=0,X=J.length;$<X;$++)K=Math.max(K,Z.distanceToSquared(J[$]));return this.radius=Math.sqrt(K),this}copy(J){return this.center.copy(J.center),this.radius=J.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(J){return J.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(J){return J.distanceTo(this.center)-this.radius}intersectsSphere(J){let Q=this.radius+J.radius;return J.center.distanceToSquared(this.center)<=Q*Q}intersectsBox(J){return J.intersectsSphere(this)}intersectsPlane(J){return Math.abs(J.distanceToPoint(this.center))<=this.radius}clampPoint(J,Q){let Z=this.center.distanceToSquared(J);if(Q.copy(J),Z>this.radius*this.radius)Q.sub(this.center).normalize(),Q.multiplyScalar(this.radius).add(this.center);return Q}getBoundingBox(J){if(this.isEmpty())return J.makeEmpty(),J;return J.set(this.center,this.center),J.expandByScalar(this.radius),J}applyMatrix4(J){return this.center.applyMatrix4(J),this.radius=this.radius*J.getMaxScaleOnAxis(),this}translate(J){return this.center.add(J),this}expandByPoint(J){if(this.isEmpty())return this.center.copy(J),this.radius=0,this;D7.subVectors(J,this.center);let Q=D7.lengthSq();if(Q>this.radius*this.radius){let Z=Math.sqrt(Q),K=(Z-this.radius)*0.5;this.center.addScaledVector(D7,K/Z),this.radius+=K}return this}union(J){if(J.isEmpty())return this;if(this.isEmpty())return this.copy(J),this;if(this.center.equals(J.center)===!0)this.radius=Math.max(this.radius,J.radius);else IQ.subVectors(J.center,this.center).setLength(J.radius),this.expandByPoint(D7.copy(J.center).add(IQ)),this.expandByPoint(D7.copy(J.center).sub(IQ));return this}equals(J){return J.center.equals(this.center)&&J.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(J){return this.radius=J.radius,this.center.fromArray(J.center),this}}var SY=0,Y9=new KJ,CQ=new MJ,u8=new h,J9=new u9,O7=new u9,TJ=new h;class dJ extends l9{constructor(){super();this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:SY++}),this.uuid=K8(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(J){if(Array.isArray(J))this.index=new((OY(J))?y6:v6)(J,1);else this.index=J;return this}setIndirect(J,Q=0){return this.indirect=J,this.indirectOffset=Q,this}getIndirect(){return this.indirect}getAttribute(J){return this.attributes[J]}setAttribute(J,Q){return this.attributes[J]=Q,this}deleteAttribute(J){return delete this.attributes[J],this}hasAttribute(J){return this.attributes[J]!==void 0}addGroup(J,Q,Z=0){this.groups.push({start:J,count:Q,materialIndex:Z})}clearGroups(){this.groups=[]}setDrawRange(J,Q){this.drawRange.start=J,this.drawRange.count=Q}applyMatrix4(J){let Q=this.attributes.position;if(Q!==void 0)Q.applyMatrix4(J),Q.needsUpdate=!0;let Z=this.attributes.normal;if(Z!==void 0){let $=new f0().getNormalMatrix(J);Z.applyNormalMatrix($),Z.needsUpdate=!0}let K=this.attributes.tangent;if(K!==void 0)K.transformDirection(J),K.needsUpdate=!0;if(this.boundingBox!==null)this.computeBoundingBox();if(this.boundingSphere!==null)this.computeBoundingSphere();return this._transformed=!0,this}applyQuaternion(J){return Y9.makeRotationFromQuaternion(J),this.applyMatrix4(Y9),this}rotateX(J){return Y9.makeRotationX(J),this.applyMatrix4(Y9),this}rotateY(J){return Y9.makeRotationY(J),this.applyMatrix4(Y9),this}rotateZ(J){return Y9.makeRotationZ(J),this.applyMatrix4(Y9),this}translate(J,Q,Z){return Y9.makeTranslation(J,Q,Z),this.applyMatrix4(Y9),this}scale(J,Q,Z){return Y9.makeScale(J,Q,Z),this.applyMatrix4(Y9),this}lookAt(J){return CQ.lookAt(J),CQ.updateMatrix(),this.applyMatrix4(CQ.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(u8).negate(),this.translate(u8.x,u8.y,u8.z),this}setFromPoints(J){let Q=this.getAttribute("position");if(Q===void 0){let Z=[];for(let K=0,$=J.length;K<$;K++){let X=J[K];Z.push(X.x,X.y,X.z||0)}this.setAttribute("position",new LJ(Z,3))}else{let Z=Math.min(J.length,Q.count);for(let K=0;K<Z;K++){let $=J[K];Q.setXYZ(K,$.x,$.y,$.z||0)}if(J.length>Q.count)j0("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.");Q.needsUpdate=!0}return this}computeBoundingBox(){if(this.boundingBox===null)this.boundingBox=new u9;let J=this.attributes.position,Q=this.morphAttributes.position;if(J&&J.isGLBufferAttribute){P0("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new h(-1/0,-1/0,-1/0),new h(1/0,1/0,1/0));return}if(J!==void 0){if(this.boundingBox.setFromBufferAttribute(J),Q)for(let Z=0,K=Q.length;Z<K;Z++){let $=Q[Z];if(J9.setFromBufferAttribute($),this.morphTargetsRelative)TJ.addVectors(this.boundingBox.min,J9.min),this.boundingBox.expandByPoint(TJ),TJ.addVectors(this.boundingBox.max,J9.max),this.boundingBox.expandByPoint(TJ);else this.boundingBox.expandByPoint(J9.min),this.boundingBox.expandByPoint(J9.max)}}else this.boundingBox.makeEmpty();if(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))P0('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){if(this.boundingSphere===null)this.boundingSphere=new C8;let J=this.attributes.position,Q=this.morphAttributes.position;if(J&&J.isGLBufferAttribute){P0("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new h,1/0);return}if(J){let Z=this.boundingSphere.center;if(J9.setFromBufferAttribute(J),Q)for(let $=0,X=Q.length;$<X;$++){let Y=Q[$];if(O7.setFromBufferAttribute(Y),this.morphTargetsRelative)TJ.addVectors(J9.min,O7.min),J9.expandByPoint(TJ),TJ.addVectors(J9.max,O7.max),J9.expandByPoint(TJ);else J9.expandByPoint(O7.min),J9.expandByPoint(O7.max)}J9.getCenter(Z);let K=0;for(let $=0,X=J.count;$<X;$++)TJ.fromBufferAttribute(J,$),K=Math.max(K,Z.distanceToSquared(TJ));if(Q)for(let $=0,X=Q.length;$<X;$++){let Y=Q[$],W=this.morphTargetsRelative;for(let U=0,H=Y.count;U<H;U++){if(TJ.fromBufferAttribute(Y,U),W)u8.fromBufferAttribute(J,U),TJ.add(u8);K=Math.max(K,Z.distanceToSquared(TJ))}}if(this.boundingSphere.radius=Math.sqrt(K),isNaN(this.boundingSphere.radius))P0('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let J=this.index,Q=this.attributes;if(J===null||Q.position===void 0||Q.normal===void 0||Q.uv===void 0){P0("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let{position:Z,normal:K,uv:$}=Q,X=this.getAttribute("tangent");if(X===void 0||X.count!==Z.count)X=new Z9(new Float32Array(4*Z.count),4),this.setAttribute("tangent",X);let Y=[],W=[];for(let A=0;A<Z.count;A++)Y[A]=new h,W[A]=new h;let U=new h,H=new h,N=new h,F=new v0,G=new v0,D=new v0,R=new h,B=new h;function q(A,O,V){U.fromBufferAttribute(Z,A),H.fromBufferAttribute(Z,O),N.fromBufferAttribute(Z,V),F.fromBufferAttribute($,A),G.fromBufferAttribute($,O),D.fromBufferAttribute($,V),H.sub(U),N.sub(U),G.sub(F),D.sub(F);let b=1/(G.x*D.y-D.x*G.y);if(!isFinite(b))return;R.copy(H).multiplyScalar(D.y).addScaledVector(N,-G.y).multiplyScalar(b),B.copy(N).multiplyScalar(G.x).addScaledVector(H,-D.x).multiplyScalar(b),Y[A].add(R),Y[O].add(R),Y[V].add(R),W[A].add(B),W[O].add(B),W[V].add(B)}let E=this.groups;if(E.length===0)E=[{start:0,count:J.count}];for(let A=0,O=E.length;A<O;++A){let V=E[A],b=V.start,P=V.count;for(let f=b,u=b+P;f<u;f+=3)q(J.getX(f+0),J.getX(f+1),J.getX(f+2))}let z=new h,w=new h,k=new h,C=new h;function _(A){k.fromBufferAttribute(K,A),C.copy(k);let O=Y[A];z.copy(O),z.sub(k.multiplyScalar(k.dot(O))).normalize(),w.crossVectors(C,O);let b=w.dot(W[A])<0?-1:1;X.setXYZW(A,z.x,z.y,z.z,b)}for(let A=0,O=E.length;A<O;++A){let V=E[A],b=V.start,P=V.count;for(let f=b,u=b+P;f<u;f+=3)_(J.getX(f+0)),_(J.getX(f+1)),_(J.getX(f+2))}this._transformed=!0}computeVertexNormals(){let J=this.index,Q=this.getAttribute("position");if(Q!==void 0){let Z=this.getAttribute("normal");if(Z===void 0||Z.count!==Q.count)Z=new Z9(new Float32Array(Q.count*3),3),this.setAttribute("normal",Z);else for(let F=0,G=Z.count;F<G;F++)Z.setXYZ(F,0,0,0);let K=new h,$=new h,X=new h,Y=new h,W=new h,U=new h,H=new h,N=new h;if(J)for(let F=0,G=J.count;F<G;F+=3){let D=J.getX(F+0),R=J.getX(F+1),B=J.getX(F+2);K.fromBufferAttribute(Q,D),$.fromBufferAttribute(Q,R),X.fromBufferAttribute(Q,B),H.subVectors(X,$),N.subVectors(K,$),H.cross(N),Y.fromBufferAttribute(Z,D),W.fromBufferAttribute(Z,R),U.fromBufferAttribute(Z,B),Y.add(H),W.add(H),U.add(H),Z.setXYZ(D,Y.x,Y.y,Y.z),Z.setXYZ(R,W.x,W.y,W.z),Z.setXYZ(B,U.x,U.y,U.z)}else for(let F=0,G=Q.count;F<G;F+=3)K.fromBufferAttribute(Q,F+0),$.fromBufferAttribute(Q,F+1),X.fromBufferAttribute(Q,F+2),H.subVectors(X,$),N.subVectors(K,$),H.cross(N),Z.setXYZ(F+0,H.x,H.y,H.z),Z.setXYZ(F+1,H.x,H.y,H.z),Z.setXYZ(F+2,H.x,H.y,H.z);this.normalizeNormals(),Z.needsUpdate=!0}}normalizeNormals(){let J=this.attributes.normal;for(let Q=0,Z=J.count;Q<Z;Q++)TJ.fromBufferAttribute(J,Q),TJ.normalize(),J.setXYZ(Q,TJ.x,TJ.y,TJ.z)}toNonIndexed(){function J(Y,W){let{array:U,itemSize:H,normalized:N}=Y,F=new U.constructor(W.length*H),G=0,D=0;for(let R=0,B=W.length;R<B;R++){if(Y.isInterleavedBufferAttribute)G=W[R]*Y.data.stride+Y.offset;else G=W[R]*H;for(let q=0;q<H;q++)F[D++]=U[G++]}return new Z9(F,H,N)}if(this.index===null)return j0("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let Q=new dJ,Z=this.index.array,K=this.attributes;for(let Y in K){let W=K[Y],U=J(W,Z);Q.setAttribute(Y,U)}let $=this.morphAttributes;for(let Y in $){let W=[],U=$[Y];for(let H=0,N=U.length;H<N;H++){let F=U[H],G=J(F,Z);W.push(G)}Q.morphAttributes[Y]=W}Q.morphTargetsRelative=this.morphTargetsRelative;let X=this.groups;for(let Y=0,W=X.length;Y<W;Y++){let U=X[Y];Q.addGroup(U.start,U.count,U.materialIndex)}return Q}toJSON(){let J={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(J.uuid=this.uuid,J.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,J.name=this.name,Object.keys(this.userData).length>0)J.userData=this.userData;if(this.parameters!==void 0&&this._transformed!==!0){let W=this.parameters;for(let U in W)if(W[U]!==void 0)J[U]=W[U];return J}J.data={attributes:{}};let Q=this.index;if(Q!==null)J.data.index={type:Q.array.constructor.name,array:Array.prototype.slice.call(Q.array)};let Z=this.attributes;for(let W in Z){let U=Z[W];J.data.attributes[W]=U.toJSON(J.data)}let K={},$=!1;for(let W in this.morphAttributes){let U=this.morphAttributes[W],H=[];for(let N=0,F=U.length;N<F;N++){let G=U[N];H.push(G.toJSON(J.data))}if(H.length>0)K[W]=H,$=!0}if($)J.data.morphAttributes=K,J.data.morphTargetsRelative=this.morphTargetsRelative;let X=this.groups;if(X.length>0)J.data.groups=JSON.parse(JSON.stringify(X));let Y=this.boundingSphere;if(Y!==null)J.data.boundingSphere=Y.toJSON();return J}clone(){return new this.constructor().copy(this)}copy(J){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let Q={};this.name=J.name;let Z=J.index;if(Z!==null)this.setIndex(Z.clone());let K=J.attributes;for(let U in K){let H=K[U];this.setAttribute(U,H.clone(Q))}let $=J.morphAttributes;for(let U in $){let H=[],N=$[U];for(let F=0,G=N.length;F<G;F++)H.push(N[F].clone(Q));this.morphAttributes[U]=H}this.morphTargetsRelative=J.morphTargetsRelative;let X=J.groups;for(let U=0,H=X.length;U<H;U++){let N=X[U];this.addGroup(N.start,N.count,N.materialIndex)}let Y=J.boundingBox;if(Y!==null)this.boundingBox=Y.clone();let W=J.boundingSphere;if(W!==null)this.boundingSphere=W.clone();return this.drawRange.start=J.drawRange.start,this.drawRange.count=J.drawRange.count,this.userData=J.userData,this._transformed=J._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class jZ{constructor(J,Q){this.isInterleavedBuffer=!0,this.array=J,this.stride=Q,this.count=J!==void 0?J.length/Q:0,this.usage=35044,this.updateRanges=[],this.version=0,this.uuid=K8()}onUploadCallback(){}set needsUpdate(J){if(J===!0)this.version++}setUsage(J){return this.usage=J,this}addUpdateRange(J,Q){this.updateRanges.push({start:J,count:Q})}clearUpdateRanges(){this.updateRanges.length=0}copy(J){return this.array=new J.array.constructor(J.array),this.count=J.count,this.stride=J.stride,this.usage=J.usage,this}copyAt(J,Q,Z){J*=this.stride,Z*=Q.stride;for(let K=0,$=this.stride;K<$;K++)this.array[J+K]=Q.array[Z+K];return this}set(J,Q=0){return this.array.set(J,Q),this}clone(J){if(J.arrayBuffers===void 0)J.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=K8();if(J.arrayBuffers[this.array.buffer._uuid]===void 0)J.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer;let Q=new this.array.constructor(J.arrayBuffers[this.array.buffer._uuid]),Z=new this.constructor(Q,this.stride);return Z.setUsage(this.usage),Z}onUpload(J){return this.onUploadCallback=J,this}toJSON(J){if(J.arrayBuffers===void 0)J.arrayBuffers={};if(this.array.buffer._uuid===void 0)this.array.buffer._uuid=K8();if(J.arrayBuffers[this.array.buffer._uuid]===void 0)J.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer));let Q={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return Q.usage=this.usage,Q}}var lJ=new h;class C7{constructor(J,Q,Z,K=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=J,this.itemSize=Q,this.offset=Z,this.normalized=K}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(J){this.data.needsUpdate=J}applyMatrix4(J){for(let Q=0,Z=this.data.count;Q<Z;Q++)lJ.fromBufferAttribute(this,Q),lJ.applyMatrix4(J),this.setXYZ(Q,lJ.x,lJ.y,lJ.z);return this}applyNormalMatrix(J){for(let Q=0,Z=this.count;Q<Z;Q++)lJ.fromBufferAttribute(this,Q),lJ.applyNormalMatrix(J),this.setXYZ(Q,lJ.x,lJ.y,lJ.z);return this}transformDirection(J){for(let Q=0,Z=this.count;Q<Z;Q++)lJ.fromBufferAttribute(this,Q),lJ.transformDirection(J),this.setXYZ(Q,lJ.x,lJ.y,lJ.z);return this}getComponent(J,Q){let Z=this.array[J*this.data.stride+this.offset+Q];if(this.normalized)Z=V9(Z,this.array);return Z}setComponent(J,Q,Z){if(this.normalized)Z=XJ(Z,this.array);return this.data.array[J*this.data.stride+this.offset+Q]=Z,this}setX(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.data.array[J*this.data.stride+this.offset]=Q,this}setY(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.data.array[J*this.data.stride+this.offset+1]=Q,this}setZ(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.data.array[J*this.data.stride+this.offset+2]=Q,this}setW(J,Q){if(this.normalized)Q=XJ(Q,this.array);return this.data.array[J*this.data.stride+this.offset+3]=Q,this}getX(J){let Q=this.data.array[J*this.data.stride+this.offset];if(this.normalized)Q=V9(Q,this.array);return Q}getY(J){let Q=this.data.array[J*this.data.stride+this.offset+1];if(this.normalized)Q=V9(Q,this.array);return Q}getZ(J){let Q=this.data.array[J*this.data.stride+this.offset+2];if(this.normalized)Q=V9(Q,this.array);return Q}getW(J){let Q=this.data.array[J*this.data.stride+this.offset+3];if(this.normalized)Q=V9(Q,this.array);return Q}setXY(J,Q,Z){if(J=J*this.data.stride+this.offset,this.normalized)Q=XJ(Q,this.array),Z=XJ(Z,this.array);return this.data.array[J+0]=Q,this.data.array[J+1]=Z,this}setXYZ(J,Q,Z,K){if(J=J*this.data.stride+this.offset,this.normalized)Q=XJ(Q,this.array),Z=XJ(Z,this.array),K=XJ(K,this.array);return this.data.array[J+0]=Q,this.data.array[J+1]=Z,this.data.array[J+2]=K,this}setXYZW(J,Q,Z,K,$){if(J=J*this.data.stride+this.offset,this.normalized)Q=XJ(Q,this.array),Z=XJ(Z,this.array),K=XJ(K,this.array),$=XJ($,this.array);return this.data.array[J+0]=Q,this.data.array[J+1]=Z,this.data.array[J+2]=K,this.data.array[J+3]=$,this}clone(J){if(J===void 0){I7("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let Q=[];for(let Z=0;Z<this.count;Z++){let K=Z*this.data.stride+this.offset;for(let $=0;$<this.itemSize;$++)Q.push(this.data.array[K+$])}return new Z9(new this.array.constructor(Q),this.itemSize,this.normalized)}else{if(J.interleavedBuffers===void 0)J.interleavedBuffers={};if(J.interleavedBuffers[this.data.uuid]===void 0)J.interleavedBuffers[this.data.uuid]=this.data.clone(J);return new C7(J.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}}toJSON(J){if(J===void 0){I7("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let Q=[];for(let Z=0;Z<this.count;Z++){let K=Z*this.data.stride+this.offset;for(let $=0;$<this.itemSize;$++)Q.push(this.data.array[K+$])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:Q,normalized:this.normalized}}else{if(J.interleavedBuffers===void 0)J.interleavedBuffers={};if(J.interleavedBuffers[this.data.uuid]===void 0)J.interleavedBuffers[this.data.uuid]=this.data.toJSON(J);return{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}}var zQ=new h,jY=new h,vY=new f0;class W9{constructor(J=new h(1,0,0),Q=0){this.isPlane=!0,this.normal=J,this.constant=Q}set(J,Q){return this.normal.copy(J),this.constant=Q,this}setComponents(J,Q,Z,K){return this.normal.set(J,Q,Z),this.constant=K,this}setFromNormalAndCoplanarPoint(J,Q){return this.normal.copy(J),this.constant=-Q.dot(this.normal),this}setFromCoplanarPoints(J,Q,Z){let K=zQ.subVectors(Z,Q).cross(jY.subVectors(J,Q)).normalize();return this.setFromNormalAndCoplanarPoint(K,J),this}copy(J){return this.normal.copy(J.normal),this.constant=J.constant,this}normalize(){let J=1/this.normal.length();return this.normal.multiplyScalar(J),this.constant*=J,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(J){return this.normal.dot(J)+this.constant}distanceToSphere(J){return this.distanceToPoint(J.center)-J.radius}projectPoint(J,Q){return Q.copy(J).addScaledVector(this.normal,-this.distanceToPoint(J))}intersectLine(J,Q,Z=!0){let K=J.delta(zQ),$=this.normal.dot(K);if($===0){if(this.distanceToPoint(J.start)===0)return Q.copy(J.start);return null}let X=-(J.start.dot(this.normal)+this.constant)/$;if(Z===!0&&(X<0||X>1))return null;return Q.copy(J.start).addScaledVector(K,X)}intersectsLine(J){let Q=this.distanceToPoint(J.start),Z=this.distanceToPoint(J.end);return Q<0&&Z>0||Z<0&&Q>0}intersectsBox(J){return J.intersectsPlane(this)}intersectsSphere(J){return J.intersectsPlane(this)}coplanarPoint(J){return J.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(J,Q){let Z=Q||vY.getNormalMatrix(J),K=this.coplanarPoint(zQ).applyMatrix4(J),$=this.normal.applyMatrix3(Z).normalize();return this.constant=-K.dot($),this}translate(J){return this.constant-=J.dot(this.normal),this}equals(J){return J.normal.equals(this.normal)&&J.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(J){return this.normal.fromArray(J.normal),this.constant=J.constant,this}}var yY=0;class W8 extends l9{constructor(){super();this.isMaterial=!0,Object.defineProperty(this,"id",{value:yY++}),this.uuid=K8(),this.name="",this.type="Material",this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new x0(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=7680,this.stencilZFail=7680,this.stencilZPass=7680,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(J){if(this._alphaTest>0!==J>0)this.version++;this._alphaTest=J}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(J){if(J===void 0)return;for(let Q in J){let Z=J[Q];if(Z===void 0){j0(`Material: parameter '${Q}' has value of undefined.`);continue}let K=this[Q];if(K===void 0){j0(`Material: '${Q}' is not a property of THREE.${this.type}.`);continue}if(K&&K.isColor)K.set(Z);else if(K&&K.isVector2&&(Z&&Z.isVector2)||K&&K.isEuler&&(Z&&Z.isEuler)||K&&K.isVector3&&(Z&&Z.isVector3))K.copy(Z);else this[Q]=Z}}toJSON(J){let Q=J===void 0||typeof J==="string";if(Q)J={textures:{},images:{}};let Z={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};if(Z.uuid=this.uuid,Z.type=this.type,Z.blending=this.blending,Z.side=this.side,Z.shadowSide=this.shadowSide,Z.vertexColors=this.vertexColors,Z.opacity=this.opacity,Z.transparent=this.transparent,Z.blendSrc=this.blendSrc,Z.blendDst=this.blendDst,Z.blendEquation=this.blendEquation,Z.blendSrcAlpha=this.blendSrcAlpha,Z.blendDstAlpha=this.blendDstAlpha,Z.blendEquationAlpha=this.blendEquationAlpha,Z.blendColor=this.blendColor.getHex(),Z.blendAlpha=this.blendAlpha,Z.depthFunc=this.depthFunc,Z.depthTest=this.depthTest,Z.depthWrite=this.depthWrite,Z.colorWrite=this.colorWrite,Z.clipIntersection=this.clipIntersection,Z.clipShadows=this.clipShadows,Z.stencilWriteMask=this.stencilWriteMask,Z.stencilFunc=this.stencilFunc,Z.stencilRef=this.stencilRef,Z.stencilFuncMask=this.stencilFuncMask,Z.stencilFail=this.stencilFail,Z.stencilZFail=this.stencilZFail,Z.stencilZPass=this.stencilZPass,Z.stencilWrite=this.stencilWrite,Z.polygonOffset=this.polygonOffset,Z.polygonOffsetFactor=this.polygonOffsetFactor,Z.polygonOffsetUnits=this.polygonOffsetUnits,Z.dithering=this.dithering,Z.alphaTest=this.alphaTest,Z.alphaHash=this.alphaHash,Z.alphaToCoverage=this.alphaToCoverage,Z.premultipliedAlpha=this.premultipliedAlpha,Z.forceSinglePass=this.forceSinglePass,Z.allowOverride=this.allowOverride,Z.visible=this.visible,Z.toneMapped=this.toneMapped,Z.name=this.name,this.color&&this.color.isColor)Z.color=this.color.getHex();if(this.roughness!==void 0)Z.roughness=this.roughness;if(this.metalness!==void 0)Z.metalness=this.metalness;if(this.sheen!==void 0)Z.sheen=this.sheen;if(this.sheenColor&&this.sheenColor.isColor)Z.sheenColor=this.sheenColor.getHex();if(this.sheenRoughness!==void 0)Z.sheenRoughness=this.sheenRoughness;if(this.emissive&&this.emissive.isColor)Z.emissive=this.emissive.getHex();if(this.emissiveIntensity!==void 0)Z.emissiveIntensity=this.emissiveIntensity;if(this.specular&&this.specular.isColor)Z.specular=this.specular.getHex();if(this.specularIntensity!==void 0)Z.specularIntensity=this.specularIntensity;if(this.specularColor&&this.specularColor.isColor)Z.specularColor=this.specularColor.getHex();if(this.shininess!==void 0)Z.shininess=this.shininess;if(this.clearcoat!==void 0)Z.clearcoat=this.clearcoat;if(this.clearcoatRoughness!==void 0)Z.clearcoatRoughness=this.clearcoatRoughness;if(this.clearcoatMap&&this.clearcoatMap.isTexture)Z.clearcoatMap=this.clearcoatMap.toJSON(J).uuid;if(this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture)Z.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(J).uuid;if(this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture)Z.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(J).uuid,Z.clearcoatNormalScale=this.clearcoatNormalScale.toArray();if(this.sheenColorMap&&this.sheenColorMap.isTexture)Z.sheenColorMap=this.sheenColorMap.toJSON(J).uuid;if(this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture)Z.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(J).uuid;if(this.dispersion!==void 0)Z.dispersion=this.dispersion;if(this.retroreflectivity!==void 0)Z.retroreflectivity=this.retroreflectivity;if(this.iridescence!==void 0)Z.iridescence=this.iridescence;if(this.iridescenceIOR!==void 0)Z.iridescenceIOR=this.iridescenceIOR;if(this.iridescenceThicknessRange!==void 0)Z.iridescenceThicknessRange=this.iridescenceThicknessRange;if(this.iridescenceMap&&this.iridescenceMap.isTexture)Z.iridescenceMap=this.iridescenceMap.toJSON(J).uuid;if(this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture)Z.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(J).uuid;if(this.anisotropy!==void 0)Z.anisotropy=this.anisotropy;if(this.anisotropyRotation!==void 0)Z.anisotropyRotation=this.anisotropyRotation;if(this.anisotropyMap&&this.anisotropyMap.isTexture)Z.anisotropyMap=this.anisotropyMap.toJSON(J).uuid;if(this.map&&this.map.isTexture)Z.map=this.map.toJSON(J).uuid;if(this.matcap&&this.matcap.isTexture)Z.matcap=this.matcap.toJSON(J).uuid;if(this.alphaMap&&this.alphaMap.isTexture)Z.alphaMap=this.alphaMap.toJSON(J).uuid;if(this.lightMap&&this.lightMap.isTexture)Z.lightMap=this.lightMap.toJSON(J).uuid,Z.lightMapIntensity=this.lightMapIntensity;if(this.aoMap&&this.aoMap.isTexture)Z.aoMap=this.aoMap.toJSON(J).uuid,Z.aoMapIntensity=this.aoMapIntensity;if(this.bumpMap&&this.bumpMap.isTexture)Z.bumpMap=this.bumpMap.toJSON(J).uuid,Z.bumpScale=this.bumpScale;if(this.normalMap&&this.normalMap.isTexture)Z.normalMap=this.normalMap.toJSON(J).uuid,Z.normalMapType=this.normalMapType,Z.normalScale=this.normalScale.toArray();if(this.displacementMap&&this.displacementMap.isTexture)Z.displacementMap=this.displacementMap.toJSON(J).uuid,Z.displacementScale=this.displacementScale,Z.displacementBias=this.displacementBias;if(this.roughnessMap&&this.roughnessMap.isTexture)Z.roughnessMap=this.roughnessMap.toJSON(J).uuid;if(this.metalnessMap&&this.metalnessMap.isTexture)Z.metalnessMap=this.metalnessMap.toJSON(J).uuid;if(this.emissiveMap&&this.emissiveMap.isTexture)Z.emissiveMap=this.emissiveMap.toJSON(J).uuid;if(this.specularMap&&this.specularMap.isTexture)Z.specularMap=this.specularMap.toJSON(J).uuid;if(this.specularIntensityMap&&this.specularIntensityMap.isTexture)Z.specularIntensityMap=this.specularIntensityMap.toJSON(J).uuid;if(this.specularColorMap&&this.specularColorMap.isTexture)Z.specularColorMap=this.specularColorMap.toJSON(J).uuid;if(this.envMap&&this.envMap.isTexture){if(Z.envMap=this.envMap.toJSON(J).uuid,this.combine!==void 0)Z.combine=this.combine}if(this.envMapRotation!==void 0)Z.envMapRotation=this.envMapRotation.toArray();if(this.envMapIntensity!==void 0)Z.envMapIntensity=this.envMapIntensity;if(this.reflectivity!==void 0)Z.reflectivity=this.reflectivity;if(this.refractionRatio!==void 0)Z.refractionRatio=this.refractionRatio;if(this.gradientMap&&this.gradientMap.isTexture)Z.gradientMap=this.gradientMap.toJSON(J).uuid;if(this.transmission!==void 0)Z.transmission=this.transmission;if(this.transmissionMap&&this.transmissionMap.isTexture)Z.transmissionMap=this.transmissionMap.toJSON(J).uuid;if(this.thickness!==void 0)Z.thickness=this.thickness;if(this.thicknessMap&&this.thicknessMap.isTexture)Z.thicknessMap=this.thicknessMap.toJSON(J).uuid;if(this.attenuationDistance!==void 0)Z.attenuationDistance=this.attenuationDistance;if(this.attenuationColor!==void 0)Z.attenuationColor=this.attenuationColor.getHex();if(this.size!==void 0)Z.size=this.size;if(this.sizeAttenuation!==void 0)Z.sizeAttenuation=this.sizeAttenuation;if(Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0)Z.clippingPlanes=this.clippingPlanes.map(($)=>$.toJSON());if(this.rotation!==void 0)Z.rotation=this.rotation;if(this.depthPacking!==void 0)Z.depthPacking=this.depthPacking;if(this.linewidth!==void 0)Z.linewidth=this.linewidth;if(this.linecap!==void 0)Z.linecap=this.linecap;if(this.linejoin!==void 0)Z.linejoin=this.linejoin;if(this.dashSize!==void 0)Z.dashSize=this.dashSize;if(this.gapSize!==void 0)Z.gapSize=this.gapSize;if(this.scale!==void 0)Z.scale=this.scale;if(this.wireframe!==void 0)Z.wireframe=this.wireframe;if(this.wireframeLinewidth!==void 0)Z.wireframeLinewidth=this.wireframeLinewidth;if(this.wireframeLinecap!==void 0)Z.wireframeLinecap=this.wireframeLinecap;if(this.wireframeLinejoin!==void 0)Z.wireframeLinejoin=this.wireframeLinejoin;if(this.flatShading!==void 0)Z.flatShading=this.flatShading;if(this.fog!==void 0)Z.fog=this.fog;if(Object.keys(this.userData).length>0)Z.userData=this.userData;function K($){let X=[];for(let Y in $){let W=$[Y];delete W.metadata,X.push(W)}return X}if(Q){let $=K(J.textures),X=K(J.images);if($.length>0)Z.textures=$;if(X.length>0)Z.images=X}return Z}fromJSON(J,Q){if(J.uuid!==void 0)this.uuid=J.uuid;if(J.name!==void 0)this.name=J.name;if(J.color!==void 0&&this.color!==void 0)this.color.setHex(J.color);if(J.roughness!==void 0)this.roughness=J.roughness;if(J.metalness!==void 0)this.metalness=J.metalness;if(J.sheen!==void 0)this.sheen=J.sheen;if(J.sheenColor!==void 0)this.sheenColor=new x0().setHex(J.sheenColor);if(J.sheenRoughness!==void 0)this.sheenRoughness=J.sheenRoughness;if(J.emissive!==void 0&&this.emissive!==void 0)this.emissive.setHex(J.emissive);if(J.specular!==void 0&&this.specular!==void 0)this.specular.setHex(J.specular);if(J.specularIntensity!==void 0)this.specularIntensity=J.specularIntensity;if(J.specularColor!==void 0&&this.specularColor!==void 0)this.specularColor.setHex(J.specularColor);if(J.shininess!==void 0)this.shininess=J.shininess;if(J.clearcoat!==void 0)this.clearcoat=J.clearcoat;if(J.clearcoatRoughness!==void 0)this.clearcoatRoughness=J.clearcoatRoughness;if(J.dispersion!==void 0)this.dispersion=J.dispersion;if(J.retroreflectivity!==void 0)this.retroreflectivity=J.retroreflectivity;if(J.iridescence!==void 0)this.iridescence=J.iridescence;if(J.iridescenceIOR!==void 0)this.iridescenceIOR=J.iridescenceIOR;if(J.iridescenceThicknessRange!==void 0)this.iridescenceThicknessRange=J.iridescenceThicknessRange;if(J.transmission!==void 0)this.transmission=J.transmission;if(J.thickness!==void 0)this.thickness=J.thickness;if(J.attenuationDistance!==void 0)this.attenuationDistance=J.attenuationDistance;if(J.attenuationColor!==void 0&&this.attenuationColor!==void 0)this.attenuationColor.setHex(J.attenuationColor);if(J.anisotropy!==void 0)this.anisotropy=J.anisotropy;if(J.anisotropyRotation!==void 0)this.anisotropyRotation=J.anisotropyRotation;if(J.fog!==void 0)this.fog=J.fog;if(J.flatShading!==void 0)this.flatShading=J.flatShading;if(J.blending!==void 0)this.blending=J.blending;if(J.combine!==void 0)this.combine=J.combine;if(J.side!==void 0)this.side=J.side;if(J.shadowSide!==void 0)this.shadowSide=J.shadowSide;if(J.opacity!==void 0)this.opacity=J.opacity;if(J.transparent!==void 0)this.transparent=J.transparent;if(J.alphaTest!==void 0)this.alphaTest=J.alphaTest;if(J.alphaHash!==void 0)this.alphaHash=J.alphaHash;if(J.depthFunc!==void 0)this.depthFunc=J.depthFunc;if(J.depthTest!==void 0)this.depthTest=J.depthTest;if(J.depthWrite!==void 0)this.depthWrite=J.depthWrite;if(J.colorWrite!==void 0)this.colorWrite=J.colorWrite;if(J.clippingPlanes!==void 0)this.clippingPlanes=J.clippingPlanes.map((Z)=>new W9().fromJSON(Z));if(J.clipIntersection!==void 0)this.clipIntersection=J.clipIntersection;if(J.clipShadows!==void 0)this.clipShadows=J.clipShadows;if(J.depthPacking!==void 0)this.depthPacking=J.depthPacking;if(J.blendSrc!==void 0)this.blendSrc=J.blendSrc;if(J.blendDst!==void 0)this.blendDst=J.blendDst;if(J.blendEquation!==void 0)this.blendEquation=J.blendEquation;if(J.blendSrcAlpha!==void 0)this.blendSrcAlpha=J.blendSrcAlpha;if(J.blendDstAlpha!==void 0)this.blendDstAlpha=J.blendDstAlpha;if(J.blendEquationAlpha!==void 0)this.blendEquationAlpha=J.blendEquationAlpha;if(J.blendColor!==void 0&&this.blendColor!==void 0)this.blendColor.setHex(J.blendColor);if(J.blendAlpha!==void 0)this.blendAlpha=J.blendAlpha;if(J.stencilWriteMask!==void 0)this.stencilWriteMask=J.stencilWriteMask;if(J.stencilFunc!==void 0)this.stencilFunc=J.stencilFunc;if(J.stencilRef!==void 0)this.stencilRef=J.stencilRef;if(J.stencilFuncMask!==void 0)this.stencilFuncMask=J.stencilFuncMask;if(J.stencilFail!==void 0)this.stencilFail=J.stencilFail;if(J.stencilZFail!==void 0)this.stencilZFail=J.stencilZFail;if(J.stencilZPass!==void 0)this.stencilZPass=J.stencilZPass;if(J.stencilWrite!==void 0)this.stencilWrite=J.stencilWrite;if(J.wireframe!==void 0)this.wireframe=J.wireframe;if(J.wireframeLinewidth!==void 0)this.wireframeLinewidth=J.wireframeLinewidth;if(J.wireframeLinecap!==void 0)this.wireframeLinecap=J.wireframeLinecap;if(J.wireframeLinejoin!==void 0)this.wireframeLinejoin=J.wireframeLinejoin;if(J.rotation!==void 0)this.rotation=J.rotation;if(J.linewidth!==void 0)this.linewidth=J.linewidth;if(J.linecap!==void 0)this.linecap=J.linecap;if(J.linejoin!==void 0)this.linejoin=J.linejoin;if(J.dashSize!==void 0)this.dashSize=J.dashSize;if(J.gapSize!==void 0)this.gapSize=J.gapSize;if(J.scale!==void 0)this.scale=J.scale;if(J.polygonOffset!==void 0)this.polygonOffset=J.polygonOffset;if(J.polygonOffsetFactor!==void 0)this.polygonOffsetFactor=J.polygonOffsetFactor;if(J.polygonOffsetUnits!==void 0)this.polygonOffsetUnits=J.polygonOffsetUnits;if(J.dithering!==void 0)this.dithering=J.dithering;if(J.alphaToCoverage!==void 0)this.alphaToCoverage=J.alphaToCoverage;if(J.premultipliedAlpha!==void 0)this.premultipliedAlpha=J.premultipliedAlpha;if(J.forceSinglePass!==void 0)this.forceSinglePass=J.forceSinglePass;if(J.allowOverride!==void 0)this.allowOverride=J.allowOverride;if(J.visible!==void 0)this.visible=J.visible;if(J.toneMapped!==void 0)this.toneMapped=J.toneMapped;if(J.userData!==void 0)this.userData=J.userData;if(J.vertexColors!==void 0)if(typeof J.vertexColors==="number")this.vertexColors=J.vertexColors>0;else this.vertexColors=J.vertexColors;if(J.size!==void 0)this.size=J.size;if(J.sizeAttenuation!==void 0)this.sizeAttenuation=J.sizeAttenuation;if(J.map!==void 0)this.map=Q[J.map]||null;if(J.matcap!==void 0)this.matcap=Q[J.matcap]||null;if(J.alphaMap!==void 0)this.alphaMap=Q[J.alphaMap]||null;if(J.bumpMap!==void 0)this.bumpMap=Q[J.bumpMap]||null;if(J.bumpScale!==void 0)this.bumpScale=J.bumpScale;if(J.normalMap!==void 0)this.normalMap=Q[J.normalMap]||null;if(J.normalMapType!==void 0)this.normalMapType=J.normalMapType;if(J.normalScale!==void 0){let Z=J.normalScale;if(Array.isArray(Z)===!1)Z=[Z,Z];this.normalScale=new v0().fromArray(Z)}if(J.displacementMap!==void 0)this.displacementMap=Q[J.displacementMap]||null;if(J.displacementScale!==void 0)this.displacementScale=J.displacementScale;if(J.displacementBias!==void 0)this.displacementBias=J.displacementBias;if(J.roughnessMap!==void 0)this.roughnessMap=Q[J.roughnessMap]||null;if(J.metalnessMap!==void 0)this.metalnessMap=Q[J.metalnessMap]||null;if(J.emissiveMap!==void 0)this.emissiveMap=Q[J.emissiveMap]||null;if(J.emissiveIntensity!==void 0)this.emissiveIntensity=J.emissiveIntensity;if(J.specularMap!==void 0)this.specularMap=Q[J.specularMap]||null;if(J.specularIntensityMap!==void 0)this.specularIntensityMap=Q[J.specularIntensityMap]||null;if(J.specularColorMap!==void 0)this.specularColorMap=Q[J.specularColorMap]||null;if(J.envMap!==void 0)this.envMap=Q[J.envMap]||null;if(J.envMapRotation!==void 0)this.envMapRotation.fromArray(J.envMapRotation);if(J.envMapIntensity!==void 0)this.envMapIntensity=J.envMapIntensity;if(J.reflectivity!==void 0)this.reflectivity=J.reflectivity;if(J.refractionRatio!==void 0)this.refractionRatio=J.refractionRatio;if(J.lightMap!==void 0)this.lightMap=Q[J.lightMap]||null;if(J.lightMapIntensity!==void 0)this.lightMapIntensity=J.lightMapIntensity;if(J.aoMap!==void 0)this.aoMap=Q[J.aoMap]||null;if(J.aoMapIntensity!==void 0)this.aoMapIntensity=J.aoMapIntensity;if(J.gradientMap!==void 0)this.gradientMap=Q[J.gradientMap]||null;if(J.clearcoatMap!==void 0)this.clearcoatMap=Q[J.clearcoatMap]||null;if(J.clearcoatRoughnessMap!==void 0)this.clearcoatRoughnessMap=Q[J.clearcoatRoughnessMap]||null;if(J.clearcoatNormalMap!==void 0)this.clearcoatNormalMap=Q[J.clearcoatNormalMap]||null;if(J.clearcoatNormalScale!==void 0)this.clearcoatNormalScale=new v0().fromArray(J.clearcoatNormalScale);if(J.iridescenceMap!==void 0)this.iridescenceMap=Q[J.iridescenceMap]||null;if(J.iridescenceThicknessMap!==void 0)this.iridescenceThicknessMap=Q[J.iridescenceThicknessMap]||null;if(J.transmissionMap!==void 0)this.transmissionMap=Q[J.transmissionMap]||null;if(J.thicknessMap!==void 0)this.thicknessMap=Q[J.thicknessMap]||null;if(J.anisotropyMap!==void 0)this.anisotropyMap=Q[J.anisotropyMap]||null;if(J.sheenColorMap!==void 0)this.sheenColorMap=Q[J.sheenColorMap]||null;if(J.sheenRoughnessMap!==void 0)this.sheenRoughnessMap=Q[J.sheenRoughnessMap]||null;return this}clone(){return new this.constructor().copy(this)}copy(J){this.name=J.name,this.blending=J.blending,this.side=J.side,this.vertexColors=J.vertexColors,this.opacity=J.opacity,this.transparent=J.transparent,this.blendSrc=J.blendSrc,this.blendDst=J.blendDst,this.blendEquation=J.blendEquation,this.blendSrcAlpha=J.blendSrcAlpha,this.blendDstAlpha=J.blendDstAlpha,this.blendEquationAlpha=J.blendEquationAlpha,this.blendColor.copy(J.blendColor),this.blendAlpha=J.blendAlpha,this.depthFunc=J.depthFunc,this.depthTest=J.depthTest,this.depthWrite=J.depthWrite,this.stencilWriteMask=J.stencilWriteMask,this.stencilFunc=J.stencilFunc,this.stencilRef=J.stencilRef,this.stencilFuncMask=J.stencilFuncMask,this.stencilFail=J.stencilFail,this.stencilZFail=J.stencilZFail,this.stencilZPass=J.stencilZPass,this.stencilWrite=J.stencilWrite;let Q=J.clippingPlanes,Z=null;if(Q!==null){let K=Q.length;Z=Array(K);for(let $=0;$!==K;++$)Z[$]=Q[$].clone()}return this.clippingPlanes=Z,this.clipIntersection=J.clipIntersection,this.clipShadows=J.clipShadows,this.shadowSide=J.shadowSide,this.colorWrite=J.colorWrite,this.precision=J.precision,this.polygonOffset=J.polygonOffset,this.polygonOffsetFactor=J.polygonOffsetFactor,this.polygonOffsetUnits=J.polygonOffsetUnits,this.dithering=J.dithering,this.alphaTest=J.alphaTest,this.alphaHash=J.alphaHash,this.alphaToCoverage=J.alphaToCoverage,this.premultipliedAlpha=J.premultipliedAlpha,this.forceSinglePass=J.forceSinglePass,this.allowOverride=J.allowOverride,this.visible=J.visible,this.toneMapped=J.toneMapped,this.userData=JSON.parse(JSON.stringify(J.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(J){if(J===!0)this.version++}}class C9 extends W8{constructor(J){super();this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new x0(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.alphaMap=J.alphaMap,this.rotation=J.rotation,this.sizeAttenuation=J.sizeAttenuation,this.fog=J.fog,this}}var c8,R7=new h,n8=new h,s8=new h,i8=new v0,L7=new v0,UX=new KJ,Q6=new h,V7=new h,Z6=new h,cK=new v0,_Q=new v0,nK=new v0;class c9 extends MJ{constructor(J=new C9){super();if(this.isSprite=!0,this.type="Sprite",c8===void 0){c8=new dJ;let Q=new Float32Array([-0.5,-0.5,0,0,0,0.5,-0.5,0,1,0,0.5,0.5,0,1,1,-0.5,0.5,0,0,1]),Z=new jZ(Q,5);c8.setIndex([0,1,2,0,2,3]),c8.setAttribute("position",new C7(Z,3,0,!1)),c8.setAttribute("uv",new C7(Z,2,3,!1))}this.geometry=c8,this.material=J,this.center=new v0(0.5,0.5),this.count=1}intersectsFrustum(J){return J.intersectsSprite(this)}raycast(J,Q){if(J.camera===null)P0('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.');if(n8.setFromMatrixScale(this.matrixWorld),UX.copy(J.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(J.camera.matrixWorldInverse,this.matrixWorld),s8.setFromMatrixPosition(this.modelViewMatrix),J.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1)n8.multiplyScalar(-s8.z);let Z=this.material.rotation,K,$;if(Z!==0)$=Math.cos(Z),K=Math.sin(Z);let X=this.center;K6(Q6.set(-0.5,-0.5,0),s8,X,n8,K,$),K6(V7.set(0.5,-0.5,0),s8,X,n8,K,$),K6(Z6.set(0.5,0.5,0),s8,X,n8,K,$),cK.set(0,0),_Q.set(1,0),nK.set(1,1);let Y=J.ray.intersectTriangle(Q6,V7,Z6,!1,R7);if(Y===null){if(K6(V7.set(-0.5,0.5,0),s8,X,n8,K,$),_Q.set(0,1),Y=J.ray.intersectTriangle(Q6,Z6,V7,!1,R7),Y===null)return}let W=J.ray.origin.distanceTo(R7);if(W<J.near||W>J.far)return;Q.push({distance:W,point:R7.clone(),uv:Q9.getInterpolation(R7,Q6,V7,Z6,cK,_Q,nK,new v0),face:null,object:this})}copy(J,Q){if(super.copy(J,Q),J.center!==void 0)this.center.copy(J.center);return this.material=J.material,this}}function K6(J,Q,Z,K,$,X){if(i8.subVectors(J,Z).addScalar(0.5).multiply(K),$!==void 0)L7.x=X*i8.x-$*i8.y,L7.y=$*i8.x+X*i8.y;else L7.copy(i8);J.copy(Q),J.x+=L7.x,J.y+=L7.y,J.applyMatrix4(UX)}var x9=new h,AQ=new h,$6=new h,X6=new h;class f6{constructor(J=new h,Q=new h(0,0,-1)){this.origin=J,this.direction=Q}set(J,Q){return this.origin.copy(J),this.direction.copy(Q),this}copy(J){return this.origin.copy(J.origin),this.direction.copy(J.direction),this}at(J,Q){return Q.copy(this.origin).addScaledVector(this.direction,J)}lookAt(J){return this.direction.copy(J).sub(this.origin).normalize(),this}recast(J){return this.origin.copy(this.at(J,x9)),this}closestPointToPoint(J,Q){Q.subVectors(J,this.origin);let Z=Q.dot(this.direction);if(Z<0)return Q.copy(this.origin);return Q.copy(this.origin).addScaledVector(this.direction,Z)}distanceToPoint(J){return Math.sqrt(this.distanceSqToPoint(J))}distanceSqToPoint(J){let Q=x9.subVectors(J,this.origin).dot(this.direction);if(Q<0)return this.origin.distanceToSquared(J);return x9.copy(this.origin).addScaledVector(this.direction,Q),x9.distanceToSquared(J)}distanceSqToSegment(J,Q,Z,K){AQ.copy(J).add(Q).multiplyScalar(0.5),$6.copy(Q).sub(J).normalize(),X6.copy(this.origin).sub(AQ);let $=J.distanceTo(Q)*0.5,X=-this.direction.dot($6),Y=X6.dot(this.direction),W=-X6.dot($6),U=X6.lengthSq(),H=Math.abs(1-X*X),N,F,G,D;if(H>0)if(N=X*W-Y,F=X*Y-W,D=$*H,N>=0)if(F>=-D)if(F<=D){let R=1/H;N*=R,F*=R,G=N*(N+X*F+2*Y)+F*(X*N+F+2*W)+U}else F=$,N=Math.max(0,-(X*F+Y)),G=-N*N+F*(F+2*W)+U;else F=-$,N=Math.max(0,-(X*F+Y)),G=-N*N+F*(F+2*W)+U;else if(F<=-D)N=Math.max(0,-(-X*$+Y)),F=N>0?-$:Math.min(Math.max(-$,-W),$),G=-N*N+F*(F+2*W)+U;else if(F<=D)N=0,F=Math.min(Math.max(-$,-W),$),G=F*(F+2*W)+U;else N=Math.max(0,-(X*$+Y)),F=N>0?$:Math.min(Math.max(-$,-W),$),G=-N*N+F*(F+2*W)+U;else F=X>0?-$:$,N=Math.max(0,-(X*F+Y)),G=-N*N+F*(F+2*W)+U;if(Z)Z.copy(this.origin).addScaledVector(this.direction,N);if(K)K.copy(AQ).addScaledVector($6,F);return G}intersectSphere(J,Q){if(J.radius<0)return null;x9.subVectors(J.center,this.origin);let Z=x9.dot(this.direction),K=x9.dot(x9)-Z*Z,$=J.radius*J.radius;if(K>$)return null;let X=Math.sqrt($-K),Y=Z-X,W=Z+X;if(W<0)return null;if(Y<0)return this.at(W,Q);return this.at(Y,Q)}intersectsSphere(J){if(J.radius<0)return!1;return this.distanceSqToPoint(J.center)<=J.radius*J.radius}distanceToPlane(J){let Q=J.normal.dot(this.direction);if(Q===0){if(J.distanceToPoint(this.origin)===0)return 0;return null}let Z=-(this.origin.dot(J.normal)+J.constant)/Q;return Z>=0?Z:null}intersectPlane(J,Q){let Z=this.distanceToPlane(J);if(Z===null)return null;return this.at(Z,Q)}intersectsPlane(J){let Q=J.distanceToPoint(this.origin);if(Q===0)return!0;if(J.normal.dot(this.direction)*Q<0)return!0;return!1}intersectBox(J,Q){let Z,K,$,X,Y,W,U=1/this.direction.x,H=1/this.direction.y,N=1/this.direction.z,F=this.origin;if(U>=0)Z=(J.min.x-F.x)*U,K=(J.max.x-F.x)*U;else Z=(J.max.x-F.x)*U,K=(J.min.x-F.x)*U;if(H>=0)$=(J.min.y-F.y)*H,X=(J.max.y-F.y)*H;else $=(J.max.y-F.y)*H,X=(J.min.y-F.y)*H;if(Z>X||$>K)return null;if($>Z||isNaN(Z))Z=$;if(X<K||isNaN(K))K=X;if(N>=0)Y=(J.min.z-F.z)*N,W=(J.max.z-F.z)*N;else Y=(J.max.z-F.z)*N,W=(J.min.z-F.z)*N;if(Z>W||Y>K)return null;if(Y>Z||Z!==Z)Z=Y;if(W<K||K!==K)K=W;if(K<0)return null;return this.at(Z>=0?Z:K,Q)}intersectsBox(J){return this.intersectBox(J,x9)!==null}intersectTriangle(J,Q,Z,K,$){let X=this.origin,Y=this.direction,W=Y.x,U=Y.y,H=Y.z,N=J.x-X.x,F=J.y-X.y,G=J.z-X.z,D=Q.x-X.x,R=Q.y-X.y,B=Q.z-X.z,q=Z.x-X.x,E=Z.y-X.y,z=Z.z-X.z,w=Math.abs(W),k=Math.abs(U),C=Math.abs(H),_,A,O,V,b,P,f,u,T,p,o,m;if(w>=k&&w>=C)if(O=W,P=N,T=D,m=q,W>=0)_=U,A=H,V=F,b=G,f=R,u=B,p=E,o=z;else _=H,A=U,V=G,b=F,f=B,u=R,p=z,o=E;else if(k>=C)if(O=U,P=F,T=R,m=E,U>=0)_=H,A=W,V=G,b=N,f=B,u=D,p=z,o=q;else _=W,A=H,V=N,b=G,f=D,u=B,p=q,o=z;else if(O=H,P=G,T=B,m=z,H>=0)_=W,A=U,V=N,b=F,f=D,u=R,p=q,o=E;else _=U,A=W,V=F,b=N,f=R,u=D,p=E,o=q;if(O===0)return null;let Q0=_/O,n=A/O,r=1/O,J0=V-Q0*P,T0=b-n*P,_0=f-Q0*T,HJ=u-n*T,m0=p-Q0*m,s=o-n*m,Z0=m0*HJ-s*_0,$0=J0*s-T0*m0,A0=_0*T0-HJ*J0;if(K){if(Z0<0||$0<0||A0<0)return null}else if((Z0<0||$0<0||A0<0)&&(Z0>0||$0>0||A0>0))return null;let S0=Z0+$0+A0;if(S0===0)return null;let C0=r*(Z0*P+$0*T+A0*m);if(S0>0?C0<0:C0>0)return null;return this.at(C0/S0,$)}applyMatrix4(J){return this.origin.applyMatrix4(J),this.direction.transformDirection(J),this}equals(J){return J.origin.equals(this.origin)&&J.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class gJ extends W8{constructor(J){super();this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new x0(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new p9,this.combine=0,this.reflectivity=1,this.refractionRatio=0.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.color.copy(J.color),this.map=J.map,this.lightMap=J.lightMap,this.lightMapIntensity=J.lightMapIntensity,this.aoMap=J.aoMap,this.aoMapIntensity=J.aoMapIntensity,this.specularMap=J.specularMap,this.alphaMap=J.alphaMap,this.envMap=J.envMap,this.envMapRotation.copy(J.envMapRotation),this.combine=J.combine,this.reflectivity=J.reflectivity,this.refractionRatio=J.refractionRatio,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.wireframeLinecap=J.wireframeLinecap,this.wireframeLinejoin=J.wireframeLinejoin,this.fog=J.fog,this}}var sK=new KJ,F8=new f6,Y6=new C8,iK=new h,W6=new h,U6=new h,H6=new h,wQ=new h,G6=new h,oK=new h,N6=new h;class b0 extends MJ{constructor(J=new dJ,Q=new gJ){super();this.isMesh=!0,this.type="Mesh",this.geometry=J,this.material=Q,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(J,Q){if(super.copy(J,Q),J.morphTargetInfluences!==void 0)this.morphTargetInfluences=J.morphTargetInfluences.slice();if(J.morphTargetDictionary!==void 0)this.morphTargetDictionary=Object.assign({},J.morphTargetDictionary);return this.material=Array.isArray(J.material)?J.material.slice():J.material,this.geometry=J.geometry,this}updateMorphTargets(){let Q=this.geometry.morphAttributes,Z=Object.keys(Q);if(Z.length>0){let K=Q[Z[0]];if(K!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let $=0,X=K.length;$<X;$++){let Y=K[$].name||String($);this.morphTargetInfluences.push(0),this.morphTargetDictionary[Y]=$}}}}getVertexPosition(J,Q){let Z=this.geometry,K=Z.attributes.position,$=Z.morphAttributes.position,X=Z.morphTargetsRelative;Q.fromBufferAttribute(K,J);let Y=this.morphTargetInfluences;if($&&Y){G6.set(0,0,0);for(let W=0,U=$.length;W<U;W++){let H=Y[W],N=$[W];if(H===0)continue;if(wQ.fromBufferAttribute(N,J),X)G6.addScaledVector(wQ,H);else G6.addScaledVector(wQ.sub(Q),H)}Q.add(G6)}return Q}intersectsFrustum(J){return J.intersectsObject(this)}raycast(J,Q){let Z=this.geometry,K=this.material,$=this.matrixWorld;if(K===void 0)return;if(Z.boundingSphere===null)Z.computeBoundingSphere();if(Y6.copy(Z.boundingSphere),Y6.applyMatrix4($),F8.copy(J.ray).recast(J.near),Y6.containsPoint(F8.origin)===!1){if(F8.intersectSphere(Y6,iK)===null)return;if(F8.origin.distanceToSquared(iK)>(J.far-J.near)**2)return}if(sK.copy($).invert(),F8.copy(J.ray).applyMatrix4(sK),Z.boundingBox!==null){if(F8.intersectsBox(Z.boundingBox)===!1)return}this._computeIntersections(J,Q,F8)}_computeIntersections(J,Q,Z){let K,$=this.geometry,X=this.material,Y=$.index,W=$.attributes.position,U=$.attributes.uv,H=$.attributes.uv1,N=$.attributes.normal,F=$.groups,G=$.drawRange;if(Y!==null)if(Array.isArray(X))for(let D=0,R=F.length;D<R;D++){let B=F[D],q=X[B.materialIndex],E=Math.max(B.start,G.start),z=Math.min(Y.count,Math.min(B.start+B.count,G.start+G.count));for(let w=E,k=z;w<k;w+=3){let C=Y.getX(w),_=Y.getX(w+1),A=Y.getX(w+2);if(K=E6(this,q,J,Z,U,H,N,C,_,A),K)K.faceIndex=Math.floor(w/3),K.face.materialIndex=B.materialIndex,Q.push(K)}}else{let D=Math.max(0,G.start),R=Math.min(Y.count,G.start+G.count);for(let B=D,q=R;B<q;B+=3){let E=Y.getX(B),z=Y.getX(B+1),w=Y.getX(B+2);if(K=E6(this,X,J,Z,U,H,N,E,z,w),K)K.faceIndex=Math.floor(B/3),Q.push(K)}}else if(W!==void 0)if(Array.isArray(X))for(let D=0,R=F.length;D<R;D++){let B=F[D],q=X[B.materialIndex],E=Math.max(B.start,G.start),z=Math.min(W.count,Math.min(B.start+B.count,G.start+G.count));for(let w=E,k=z;w<k;w+=3){let C=w,_=w+1,A=w+2;if(K=E6(this,q,J,Z,U,H,N,C,_,A),K)K.faceIndex=Math.floor(w/3),K.face.materialIndex=B.materialIndex,Q.push(K)}}else{let D=Math.max(0,G.start),R=Math.min(W.count,G.start+G.count);for(let B=D,q=R;B<q;B+=3){let E=B,z=B+1,w=B+2;if(K=E6(this,X,J,Z,U,H,N,E,z,w),K)K.faceIndex=Math.floor(B/3),Q.push(K)}}}}function fY(J,Q,Z,K,$,X,Y,W){let U;if(Q.side===1)U=K.intersectTriangle(Y,X,$,!0,W);else U=K.intersectTriangle($,X,Y,Q.side===0,W);if(U===null)return null;N6.copy(W),N6.applyMatrix4(J.matrixWorld);let H=Z.ray.origin.distanceTo(N6);if(H<Z.near||H>Z.far)return null;return{distance:H,point:N6.clone(),object:J}}function E6(J,Q,Z,K,$,X,Y,W,U,H){J.getVertexPosition(W,W6),J.getVertexPosition(U,U6),J.getVertexPosition(H,H6);let N=fY(J,Q,Z,K,W6,U6,H6,oK);if(N){let F=new h;if(Q9.getBarycoord(oK,W6,U6,H6,F),$)N.uv=Q9.getInterpolatedAttribute($,W,U,H,F,new v0);if(X)N.uv1=Q9.getInterpolatedAttribute(X,W,U,H,F,new v0);if(Y){if(N.normal=Q9.getInterpolatedAttribute(Y,W,U,H,F,new h),N.normal.dot(K.direction)>0)N.normal.multiplyScalar(-1)}let G={a:W,b:U,c:H,normal:new h,materialIndex:0};Q9.getNormal(W6,U6,H6,G.normal),N.face=G,N.barycoord=F}return N}class h6 extends vJ{constructor(J=null,Q=1,Z=1,K,$,X,Y,W,U=1003,H=1003,N,F){super(null,X,Y,W,U,H,K,$,N,F);this.isDataTexture=!0,this.image={data:J,width:Q,height:Z},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class L6 extends Z9{constructor(J,Q,Z,K=1){super(J,Q,Z);this.isInstancedBufferAttribute=!0,this.meshPerAttribute=K}copy(J){return super.copy(J),this.meshPerAttribute=J.meshPerAttribute,this}toJSON(){let J=super.toJSON();return J.meshPerAttribute=this.meshPerAttribute,J.isInstancedBufferAttribute=!0,J}}var o8=new KJ,aK=new KJ,F6=[],rK=new u9,hY=new KJ,M7=new b0,k7=new C8;class U8 extends b0{constructor(J,Q,Z){super(J,Q);this.isInstancedMesh=!0,this.instanceMatrix=new L6(new Float32Array(Z*16),16),this.instanceColor=null,this.morphTexture=null,this.count=Z,this.boundingBox=null,this.boundingSphere=null;for(let K=0;K<Z;K++)this.setMatrixAt(K,hY)}computeBoundingBox(){let J=this.geometry,Q=this.count;if(this.boundingBox===null)this.boundingBox=new u9;if(J.boundingBox===null)J.computeBoundingBox();this.boundingBox.makeEmpty();for(let Z=0;Z<Q;Z++)this.getMatrixAt(Z,o8),rK.copy(J.boundingBox).applyMatrix4(o8),this.boundingBox.union(rK)}computeBoundingSphere(){let J=this.geometry,Q=this.count;if(this.boundingSphere===null)this.boundingSphere=new C8;if(J.boundingSphere===null)J.computeBoundingSphere();this.boundingSphere.makeEmpty();for(let Z=0;Z<Q;Z++)this.getMatrixAt(Z,o8),k7.copy(J.boundingSphere).applyMatrix4(o8),this.boundingSphere.union(k7)}copy(J,Q){if(super.copy(J,Q),this.instanceMatrix.copy(J.instanceMatrix),J.morphTexture!==null)this.morphTexture=J.morphTexture.clone();if(J.instanceColor!==null)this.instanceColor=J.instanceColor.clone();if(this.count=J.count,J.boundingBox!==null)this.boundingBox=J.boundingBox.clone();if(J.boundingSphere!==null)this.boundingSphere=J.boundingSphere.clone();return this}getColorAt(J,Q){if(this.instanceColor===null)return Q.setRGB(1,1,1);else return Q.fromArray(this.instanceColor.array,J*3)}getMatrixAt(J,Q){return Q.fromArray(this.instanceMatrix.array,J*16)}getMorphAt(J,Q){let Z=Q.morphTargetInfluences,K=this.morphTexture.source.data.data,$=Z.length+1,X=J*$+1;for(let Y=0;Y<Z.length;Y++)Z[Y]=K[X+Y]}raycast(J,Q){let Z=this.matrixWorld,K=this.count;if(M7.geometry=this.geometry,M7.material=this.material,M7.material===void 0)return;if(this.boundingSphere===null)this.computeBoundingSphere();if(k7.copy(this.boundingSphere),k7.applyMatrix4(Z),J.ray.intersectsSphere(k7)===!1)return;for(let $=0;$<K;$++){this.getMatrixAt($,o8),aK.multiplyMatrices(Z,o8),M7.matrixWorld=aK,M7.raycast(J,F6);for(let X=0,Y=F6.length;X<Y;X++){let W=F6[X];W.instanceId=$,W.object=this,Q.push(W)}F6.length=0}}setColorAt(J,Q){if(this.instanceColor===null)this.instanceColor=new L6(new Float32Array(this.instanceMatrix.count*3).fill(1),3);return Q.toArray(this.instanceColor.array,J*3),this}setMatrixAt(J,Q){return Q.toArray(this.instanceMatrix.array,J*16),this}setMorphAt(J,Q){let Z=Q.morphTargetInfluences,K=Z.length+1;if(this.morphTexture===null)this.morphTexture=new h6(new Float32Array(K*this.count),K,this.count,1028,1015);let $=this.morphTexture.source.data.data,X=0;for(let U=0;U<Z.length;U++)X+=Z[U];let Y=this.geometry.morphTargetsRelative?1:1-X,W=K*J;return $[W]=Y,$.set(Z,W+1),this}updateMorphTargets(){}dispose(){if(super.dispose(),this.morphTexture!==null)this.morphTexture.dispose(),this.morphTexture=null}}var q8=new C8,bY=new v0(0.5,0.5),q6=new h;class v7{constructor(J=new W9,Q=new W9,Z=new W9,K=new W9,$=new W9,X=new W9){this.planes=[J,Q,Z,K,$,X]}set(J,Q,Z,K,$,X){let Y=this.planes;return Y[0].copy(J),Y[1].copy(Q),Y[2].copy(Z),Y[3].copy(K),Y[4].copy($),Y[5].copy(X),this}copy(J){let Q=this.planes;for(let Z=0;Z<6;Z++)Q[Z].copy(J.planes[Z]);return this}setFromProjectionMatrix(J,Q=2000,Z=!1){let K=this.planes,$=J.elements,X=$[0],Y=$[1],W=$[2],U=$[3],H=$[4],N=$[5],F=$[6],G=$[7],D=$[8],R=$[9],B=$[10],q=$[11],E=$[12],z=$[13],w=$[14],k=$[15];if(K[0].setComponents(U-X,G-H,q-D,k-E).normalize(),K[1].setComponents(U+X,G+H,q+D,k+E).normalize(),K[2].setComponents(U+Y,G+N,q+R,k+z).normalize(),K[3].setComponents(U-Y,G-N,q-R,k-z).normalize(),Z)K[4].setComponents(W,F,B,w).normalize(),K[5].setComponents(U-W,G-F,q-B,k-w).normalize();else if(K[4].setComponents(U-W,G-F,q-B,k-w).normalize(),Q===2000)K[5].setComponents(U+W,G+F,q+B,k+w).normalize();else if(Q===2001)K[5].setComponents(W,F,B,w).normalize();else throw Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+Q);return this}intersectsObject(J){if(J.boundingSphere!==void 0){if(J.boundingSphere===null)J.computeBoundingSphere();q8.copy(J.boundingSphere).applyMatrix4(J.matrixWorld)}else{let Q=J.geometry;if(Q.boundingSphere===null)Q.computeBoundingSphere();q8.copy(Q.boundingSphere).applyMatrix4(J.matrixWorld)}return this.intersectsSphere(q8)}intersectsSprite(J){q8.center.set(0,0,0);let Q=bY.distanceTo(J.center);return q8.radius=0.7071067811865476+Q,q8.applyMatrix4(J.matrixWorld),this.intersectsSphere(q8)}intersectsSphere(J){let Q=this.planes,Z=J.center,K=-J.radius;for(let $=0;$<6;$++)if(Q[$].distanceToPoint(Z)<K)return!1;return!0}intersectsBox(J){let Q=this.planes;for(let Z=0;Z<6;Z++){let K=Q[Z];if(q6.x=K.normal.x>0?J.max.x:J.min.x,q6.y=K.normal.y>0?J.max.y:J.min.y,q6.z=K.normal.z>0?J.max.z:J.min.z,K.distanceToPoint(q6)<0)return!1}return!0}containsPoint(J){let Q=this.planes;for(let Z=0;Z<6;Z++)if(Q[Z].distanceToPoint(J)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class b6 extends vJ{constructor(J=[],Q=301,Z,K,$,X,Y,W,U,H){super(J,Q,Z,K,$,X,Y,W,U,H);this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(J){this.image=J}}class uJ extends vJ{constructor(J,Q,Z,K,$,X,Y,W,U){super(J,Q,Z,K,$,X,Y,W,U);this.isCanvasTexture=!0,this.needsUpdate=!0}}class z8 extends vJ{constructor(J,Q,Z=1014,K,$,X,Y=1003,W=1003,U,H=1026,N=1){if(H!==1026&&H!==1027)throw Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let F={width:J,height:Q,depth:N};super(F,K,$,X,Y,W,H,Z,U);this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(J){return super.copy(J),this.source=new P7(Object.assign({},J.image)),this.compareFunction=J.compareFunction,this}toJSON(J){let Q=super.toJSON(J);return Q.compareFunction=this.compareFunction,Q}}class vZ extends z8{constructor(J,Q=1014,Z=301,K,$,X=1003,Y=1003,W,U=1026){let H={width:J,height:J,depth:1},N=[H,H,H,H,H,H];super(J,J,Q,Z,K,$,X,Y,W,U);this.image=N,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(J){this.image=J}}class x6 extends vJ{constructor(J=null){super();this.sourceTexture=J,this.isExternalTexture=!0}copy(J){return super.copy(J),this.sourceTexture=J.sourceTexture,this}}class cJ extends dJ{constructor(J=1,Q=1,Z=1,K=1,$=1,X=1){super();this.type="BoxGeometry",this.parameters={width:J,height:Q,depth:Z,widthSegments:K,heightSegments:$,depthSegments:X};let Y=this;K=Math.floor(K),$=Math.floor($),X=Math.floor(X);let W=[],U=[],H=[],N=[],F=0,G=0;D("z","y","x",-1,-1,Z,Q,J,X,$,0),D("z","y","x",1,-1,Z,Q,-J,X,$,1),D("x","z","y",1,1,J,Z,Q,K,X,2),D("x","z","y",1,-1,J,Z,-Q,K,X,3),D("x","y","z",1,-1,J,Q,Z,K,$,4),D("x","y","z",-1,-1,J,Q,-Z,K,$,5),this.setIndex(W),this.setAttribute("position",new LJ(U,3)),this.setAttribute("normal",new LJ(H,3)),this.setAttribute("uv",new LJ(N,2));function D(R,B,q,E,z,w,k,C,_,A,O){let V=w/_,b=k/A,P=w/2,f=k/2,u=C/2,T=_+1,p=A+1,o=0,m=0,Q0=new h;for(let n=0;n<p;n++){let r=n*b-f;for(let J0=0;J0<T;J0++){let T0=J0*V-P;Q0[R]=T0*E,Q0[B]=r*z,Q0[q]=u,U.push(Q0.x,Q0.y,Q0.z),Q0[R]=0,Q0[B]=0,Q0[q]=C>0?1:-1,H.push(Q0.x,Q0.y,Q0.z),N.push(J0/_),N.push(1-n/A),o+=1}}for(let n=0;n<A;n++)for(let r=0;r<_;r++){let J0=F+r+T*n,T0=F+r+T*(n+1),_0=F+(r+1)+T*(n+1),HJ=F+(r+1)+T*n;W.push(J0,T0,HJ),W.push(T0,_0,HJ),m+=6}Y.addGroup(G,m,O),G+=m,F+=o}}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new cJ(J.width,J.height,J.depth,J.widthSegments,J.heightSegments,J.depthSegments)}}class aJ extends dJ{constructor(J=1,Q=1,Z=1,K=32,$=1,X=!1,Y=0,W=Math.PI*2){super();this.type="CylinderGeometry",this.parameters={radiusTop:J,radiusBottom:Q,height:Z,radialSegments:K,heightSegments:$,openEnded:X,thetaStart:Y,thetaLength:W};let U=this;K=Math.floor(K),$=Math.floor($);let H=[],N=[],F=[],G=[],D=0,R=[],B=Z/2,q=0;if(E(),X===!1){if(J>0)z(!0);if(Q>0)z(!1)}this.setIndex(H),this.setAttribute("position",new LJ(N,3)),this.setAttribute("normal",new LJ(F,3)),this.setAttribute("uv",new LJ(G,2));function E(){let w=new h,k=new h,C=0,_=(Q-J)/Z;for(let A=0;A<=$;A++){let O=[],V=A/$,b=V*(Q-J)+J;for(let P=0;P<=K;P++){let f=P/K,u=f*W+Y,T=Math.sin(u),p=Math.cos(u);k.x=b*T,k.y=-V*Z+B,k.z=b*p,N.push(k.x,k.y,k.z),w.set(T,_,p).normalize(),F.push(w.x,w.y,w.z),G.push(f,1-V),O.push(D++)}R.push(O)}for(let A=0;A<K;A++)for(let O=0;O<$;O++){let V=R[O][A],b=R[O+1][A],P=R[O+1][A+1],f=R[O][A+1];if(J>0||O!==0)H.push(V,b,f),C+=3;if(Q>0||O!==$-1)H.push(b,P,f),C+=3}U.addGroup(q,C,0),q+=C}function z(w){let k=D,C=new v0,_=new h,A=0,O=w===!0?J:Q,V=w===!0?1:-1;for(let P=1;P<=K;P++)N.push(0,B*V,0),F.push(0,V,0),G.push(0.5,0.5),D++;let b=D;for(let P=0;P<=K;P++){let u=P/K*W+Y,T=Math.cos(u),p=Math.sin(u);_.x=O*p,_.y=B*V,_.z=O*T,N.push(_.x,_.y,_.z),F.push(0,V,0),C.x=T*0.5+0.5,C.y=p*0.5*V+0.5,G.push(C.x,C.y),D++}for(let P=0;P<K;P++){let f=k+P,u=b+P;if(w===!0)H.push(u,u+1,f);else H.push(u+1,u,f);A+=3}U.addGroup(q,A,w===!0?1:2),q+=A}}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new aJ(J.radiusTop,J.radiusBottom,J.height,J.radialSegments,J.heightSegments,J.openEnded,J.thetaStart,J.thetaLength)}}class y7 extends aJ{constructor(J=1,Q=1,Z=32,K=1,$=!1,X=0,Y=Math.PI*2){super(0,J,Q,Z,K,$,X,Y);this.type="ConeGeometry",this.parameters={radius:J,height:Q,radialSegments:Z,heightSegments:K,openEnded:$,thetaStart:X,thetaLength:Y}}static fromJSON(J){return new y7(J.radius,J.height,J.radialSegments,J.heightSegments,J.openEnded,J.thetaStart,J.thetaLength)}}class g6 extends dJ{constructor(J=[],Q=[],Z=1,K=0){super();this.type="PolyhedronGeometry",this.parameters={vertices:J,indices:Q,radius:Z,detail:K};let $=[],X=[];if(Y(K),U(Z),H(),this.setAttribute("position",new LJ($,3)),this.setAttribute("normal",new LJ($.slice(),3)),this.setAttribute("uv",new LJ(X,2)),K===0)this.computeVertexNormals();else this.normalizeNormals();function Y(E){let z=new h,w=new h,k=new h;for(let C=0;C<Q.length;C+=3)G(Q[C+0],z),G(Q[C+1],w),G(Q[C+2],k),W(z,w,k,E)}function W(E,z,w,k){let C=k+1,_=[];for(let A=0;A<=C;A++){_[A]=[];let O=E.clone().lerp(w,A/C),V=z.clone().lerp(w,A/C),b=C-A;for(let P=0;P<=b;P++)if(P===0&&A===C)_[A][P]=O;else _[A][P]=O.clone().lerp(V,P/b)}for(let A=0;A<C;A++)for(let O=0;O<2*(C-A)-1;O++){let V=Math.floor(O/2);if(O%2===0)F(_[A][V+1]),F(_[A+1][V]),F(_[A][V]);else F(_[A][V+1]),F(_[A+1][V+1]),F(_[A+1][V])}}function U(E){let z=new h;for(let w=0;w<$.length;w+=3)z.x=$[w+0],z.y=$[w+1],z.z=$[w+2],z.normalize().multiplyScalar(E),$[w+0]=z.x,$[w+1]=z.y,$[w+2]=z.z}function H(){let E=new h;for(let z=0;z<$.length;z+=3){E.x=$[z+0],E.y=$[z+1],E.z=$[z+2];let w=B(E)/2/Math.PI+0.5,k=q(E)/Math.PI+0.5;X.push(w,1-k)}D(),N()}function N(){for(let E=0;E<X.length;E+=6){let z=X[E+0],w=X[E+2],k=X[E+4],C=Math.max(z,w,k),_=Math.min(z,w,k);if(C>0.9&&_<0.1){if(z<0.2)X[E+0]+=1;if(w<0.2)X[E+2]+=1;if(k<0.2)X[E+4]+=1}}}function F(E){$.push(E.x,E.y,E.z)}function G(E,z){let w=E*3;z.x=J[w+0],z.y=J[w+1],z.z=J[w+2]}function D(){let E=new h,z=new h,w=new h,k=new h,C=new v0,_=new v0,A=new v0;for(let O=0,V=0;O<$.length;O+=9,V+=6){E.set($[O+0],$[O+1],$[O+2]),z.set($[O+3],$[O+4],$[O+5]),w.set($[O+6],$[O+7],$[O+8]),C.set(X[V+0],X[V+1]),_.set(X[V+2],X[V+3]),A.set(X[V+4],X[V+5]),k.copy(E).add(z).add(w).divideScalar(3);let b=B(k);R(C,V+0,E,b),R(_,V+2,z,b),R(A,V+4,w,b)}}function R(E,z,w,k){if(k<0&&E.x===1)X[z]=E.x-1;if(w.x===0&&w.z===0)X[z]=k/2/Math.PI+0.5}function B(E){return Math.atan2(E.z,-E.x)}function q(E){return Math.atan2(-E.y,Math.sqrt(E.x*E.x+E.z*E.z))}}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new g6(J.vertices,J.indices,J.radius,J.detail)}}class f7 extends g6{constructor(J=1,Q=0){let Z=(1+Math.sqrt(5))/2,K=1/Z,$=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-K,-Z,0,-K,Z,0,K,-Z,0,K,Z,-K,-Z,0,-K,Z,0,K,-Z,0,K,Z,0,-Z,0,-K,Z,0,-K,-Z,0,K,Z,0,K],X=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super($,X,J,Q);this.type="DodecahedronGeometry",this.parameters={radius:J,detail:Q}}static fromJSON(J){return new f7(J.radius,J.detail)}}class $9 extends dJ{constructor(J=1,Q=1,Z=1,K=1){super();this.type="PlaneGeometry",this.parameters={width:J,height:Q,widthSegments:Z,heightSegments:K};let $=J/2,X=Q/2,Y=Math.floor(Z),W=Math.floor(K),U=Y+1,H=W+1,N=J/Y,F=Q/W,G=[],D=[],R=[],B=[];for(let q=0;q<H;q++){let E=q*F-X;for(let z=0;z<U;z++){let w=z*N-$;D.push(w,-E,0),R.push(0,0,1),B.push(z/Y),B.push(1-q/W)}}for(let q=0;q<W;q++)for(let E=0;E<Y;E++){let z=E+U*q,w=E+U*(q+1),k=E+1+U*(q+1),C=E+1+U*q;G.push(z,w,C),G.push(w,k,C)}this.setIndex(G),this.setAttribute("position",new LJ(D,3)),this.setAttribute("normal",new LJ(R,3)),this.setAttribute("uv",new LJ(B,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new $9(J.width,J.height,J.widthSegments,J.heightSegments)}}class D9 extends dJ{constructor(J=0.5,Q=1,Z=32,K=1,$=0,X=Math.PI*2){super();this.type="RingGeometry",this.parameters={innerRadius:J,outerRadius:Q,thetaSegments:Z,phiSegments:K,thetaStart:$,thetaLength:X},Z=Math.max(3,Z),K=Math.max(1,K);let Y=[],W=[],U=[],H=[],N=J,F=(Q-J)/K,G=new h,D=new v0;for(let R=0;R<=K;R++){for(let B=0;B<=Z;B++){let q=$+B/Z*X;G.x=N*Math.cos(q),G.y=N*Math.sin(q),W.push(G.x,G.y,G.z),U.push(0,0,1),D.x=(G.x/Q+1)/2,D.y=(G.y/Q+1)/2,H.push(D.x,D.y)}N+=F}for(let R=0;R<K;R++){let B=R*(Z+1);for(let q=0;q<Z;q++){let E=q+B,z=E,w=E+Z+1,k=E+Z+2,C=E+1;Y.push(z,w,C),Y.push(w,k,C)}}this.setIndex(Y),this.setAttribute("position",new LJ(W,3)),this.setAttribute("normal",new LJ(U,3)),this.setAttribute("uv",new LJ(H,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new D9(J.innerRadius,J.outerRadius,J.thetaSegments,J.phiSegments,J.thetaStart,J.thetaLength)}}class _8 extends dJ{constructor(J=1,Q=32,Z=16,K=0,$=Math.PI*2,X=0,Y=Math.PI){super();this.type="SphereGeometry",this.parameters={radius:J,widthSegments:Q,heightSegments:Z,phiStart:K,phiLength:$,thetaStart:X,thetaLength:Y},Q=Math.max(3,Math.floor(Q)),Z=Math.max(2,Math.floor(Z));let W=Math.min(X+Y,Math.PI),U=0,H=[],N=new h,F=new h,G=[],D=[],R=[],B=[];for(let q=0;q<=Z;q++){let E=[],z=q/Z,w=X+z*Y,k=J*Math.cos(w),C=Math.sqrt(J*J-k*k),_=0;if(q===0&&X===0)_=0.5/Q;else if(q===Z&&W===Math.PI)_=-0.5/Q;for(let A=0;A<=Q;A++){let O=A/Q,V=K+O*$;N.x=-C*Math.cos(V),N.y=k,N.z=C*Math.sin(V),D.push(N.x,N.y,N.z),F.copy(N).normalize(),R.push(F.x,F.y,F.z),B.push(O+_,1-z),E.push(U++)}H.push(E)}for(let q=0;q<Z;q++)for(let E=0;E<Q;E++){let z=H[q][E+1],w=H[q][E],k=H[q+1][E],C=H[q+1][E+1];if(q!==0||X>0)G.push(z,w,C);if(q!==Z-1||W<Math.PI)G.push(w,k,C)}this.setIndex(G),this.setAttribute("position",new LJ(D,3)),this.setAttribute("normal",new LJ(R,3)),this.setAttribute("uv",new LJ(B,2))}copy(J){return super.copy(J),this.parameters=Object.assign({},J.parameters),this}static fromJSON(J){return new _8(J.radius,J.widthSegments,J.heightSegments,J.phiStart,J.phiLength,J.thetaStart,J.thetaLength)}}function A8(J){let Q={};for(let Z in J){Q[Z]={};for(let K in J[Z]){let $=J[Z][K];if(tK($))if($.isRenderTargetTexture)j0("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),Q[Z][K]=null;else Q[Z][K]=$.clone();else if(Array.isArray($))if(tK($[0])){let X=[];for(let Y=0,W=$.length;Y<W;Y++)X[Y]=$[Y].clone();Q[Z][K]=X}else Q[Z][K]=$.slice();else Q[Z][K]=$}}return Q}function pJ(J){let Q={};for(let Z=0;Z<J.length;Z++){let K=A8(J[Z]);for(let $ in K)Q[$]=K[$]}return Q}function tK(J){return J&&(J.isColor||J.isMatrix3||J.isMatrix4||J.isVector2||J.isVector3||J.isVector4||J.isTexture||J.isQuaternion)}function xY(J){let Q=[];for(let Z=0;Z<J.length;Z++)Q.push(J[Z].clone());return Q}function yZ(J){let Q=J.getRenderTarget();if(Q===null)return J.outputColorSpace;if(Q.isXRRenderTarget===!0)return Q.texture.colorSpace;return u0.workingColorSpace}var HX={clone:A8,merge:pJ},gY=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,pY=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class U9 extends W8{constructor(J){super();if(this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=gY,this.fragmentShader=pY,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,J!==void 0)this.setValues(J)}copy(J){return super.copy(J),this.fragmentShader=J.fragmentShader,this.vertexShader=J.vertexShader,this.uniforms=A8(J.uniforms),this.uniformsGroups=xY(J.uniformsGroups),this.defines=Object.assign({},J.defines),this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.fog=J.fog,this.lights=J.lights,this.clipping=J.clipping,this.extensions=Object.assign({},J.extensions),this.glslVersion=J.glslVersion,this.defaultAttributeValues=Object.assign({},J.defaultAttributeValues),this.index0AttributeName=J.index0AttributeName,this.uniformsNeedUpdate=J.uniformsNeedUpdate,this}toJSON(J){let Q=super.toJSON(J);Q.glslVersion=this.glslVersion,Q.uniforms={};for(let K in this.uniforms){let X=this.uniforms[K].value;if(X&&X.isTexture)Q.uniforms[K]={type:"t",value:X.toJSON(J).uuid};else if(X&&X.isColor)Q.uniforms[K]={type:"c",value:X.getHex()};else if(X&&X.isVector2)Q.uniforms[K]={type:"v2",value:X.toArray()};else if(X&&X.isVector3)Q.uniforms[K]={type:"v3",value:X.toArray()};else if(X&&X.isVector4)Q.uniforms[K]={type:"v4",value:X.toArray()};else if(X&&X.isMatrix3)Q.uniforms[K]={type:"m3",value:X.toArray()};else if(X&&X.isMatrix4)Q.uniforms[K]={type:"m4",value:X.toArray()};else Q.uniforms[K]={value:X}}if(Object.keys(this.defines).length>0)Q.defines=this.defines;Q.vertexShader=this.vertexShader,Q.fragmentShader=this.fragmentShader,Q.lights=this.lights,Q.clipping=this.clipping;let Z={};for(let K in this.extensions)if(this.extensions[K]===!0)Z[K]=!0;if(Object.keys(Z).length>0)Q.extensions=Z;return Q}fromJSON(J,Q){if(super.fromJSON(J,Q),J.uniforms!==void 0)for(let Z in J.uniforms){let K=J.uniforms[Z];switch(this.uniforms[Z]={},K.type){case"t":this.uniforms[Z].value=Q[K.value]||null;break;case"c":this.uniforms[Z].value=new x0().setHex(K.value);break;case"v2":this.uniforms[Z].value=new v0().fromArray(K.value);break;case"v3":this.uniforms[Z].value=new h().fromArray(K.value);break;case"v4":this.uniforms[Z].value=new OJ().fromArray(K.value);break;case"m3":this.uniforms[Z].value=new f0().fromArray(K.value);break;case"m4":this.uniforms[Z].value=new KJ().fromArray(K.value);break;default:this.uniforms[Z].value=K.value}}if(J.defines!==void 0)this.defines=J.defines;if(J.vertexShader!==void 0)this.vertexShader=J.vertexShader;if(J.fragmentShader!==void 0)this.fragmentShader=J.fragmentShader;if(J.glslVersion!==void 0)this.glslVersion=J.glslVersion;if(J.extensions!==void 0)for(let Z in J.extensions)this.extensions[Z]=J.extensions[Z];if(J.lights!==void 0)this.lights=J.lights;if(J.clipping!==void 0)this.clipping=J.clipping;return this}}class fZ extends U9{constructor(J){super(J);this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class n9 extends W8{constructor(J){super();this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new x0(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new x0(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new v0(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new p9,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(J)}copy(J){return super.copy(J),this.defines={STANDARD:""},this.color.copy(J.color),this.roughness=J.roughness,this.metalness=J.metalness,this.map=J.map,this.lightMap=J.lightMap,this.lightMapIntensity=J.lightMapIntensity,this.aoMap=J.aoMap,this.aoMapIntensity=J.aoMapIntensity,this.emissive.copy(J.emissive),this.emissiveMap=J.emissiveMap,this.emissiveIntensity=J.emissiveIntensity,this.bumpMap=J.bumpMap,this.bumpScale=J.bumpScale,this.normalMap=J.normalMap,this.normalMapType=J.normalMapType,this.normalScale.copy(J.normalScale),this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this.roughnessMap=J.roughnessMap,this.metalnessMap=J.metalnessMap,this.alphaMap=J.alphaMap,this.envMap=J.envMap,this.envMapRotation.copy(J.envMapRotation),this.envMapIntensity=J.envMapIntensity,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this.wireframeLinecap=J.wireframeLinecap,this.wireframeLinejoin=J.wireframeLinejoin,this.flatShading=J.flatShading,this.fog=J.fog,this}}class hZ extends W8{constructor(J){super();this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(J)}copy(J){return super.copy(J),this.depthPacking=J.depthPacking,this.map=J.map,this.alphaMap=J.alphaMap,this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this.wireframe=J.wireframe,this.wireframeLinewidth=J.wireframeLinewidth,this}}class bZ extends W8{constructor(J){super();this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(J)}copy(J){return super.copy(J),this.map=J.map,this.alphaMap=J.alphaMap,this.displacementMap=J.displacementMap,this.displacementScale=J.displacementScale,this.displacementBias=J.displacementBias,this}}function a8(J,Q){if(!J||J.constructor===Q)return J;if(typeof Q.BYTES_PER_ELEMENT==="number")return new Q(J);return Array.prototype.slice.call(J)}function PQ(J){return J!==void 0&&J.inTangents!==void 0&&J.outTangents!==void 0}class w8{constructor(J,Q,Z,K){this.parameterPositions=J,this._cachedIndex=0,this.resultBuffer=K!==void 0?K:new Q.constructor(Z),this.sampleValues=Q,this.valueSize=Z,this.settings=null,this.DefaultSettings_={}}evaluate(J){let Q=this.parameterPositions,Z=this._cachedIndex,K=Q[Z],$=Q[Z-1];Z:{J:{let X;Q:{K:if(!(J<K)){for(let Y=Z+2;;){if(K===void 0){if(J<$)break K;return Z=Q.length,this._cachedIndex=Z,this.copySampleValue_(Z-1)}if(Z===Y)break;if($=K,K=Q[++Z],J<K)break J}X=Q.length;break Q}if(!(J>=$)){let Y=Q[1];if(J<Y)Z=2,$=Y;for(let W=Z-2;;){if($===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(Z===W)break;if(K=$,$=Q[--Z-1],J>=$)break J}X=Z,Z=0;break Q}break Z}while(Z<X){let Y=Z+X>>>1;if(J<Q[Y])X=Y;else Z=Y+1}if(K=Q[Z],$=Q[Z-1],$===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(K===void 0)return Z=Q.length,this._cachedIndex=Z,this.copySampleValue_(Z-1)}this._cachedIndex=Z,this.intervalChanged_(Z,$,K)}return this.interpolate_(Z,$,J,K)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(J){let Q=this.resultBuffer,Z=this.sampleValues,K=this.valueSize,$=J*K;for(let X=0;X!==K;++X)Q[X]=Z[$+X];return Q}interpolate_(){throw Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}}class xZ extends w8{constructor(J,Q,Z,K){super(J,Q,Z,K);this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:2400,endingEnd:2400}}intervalChanged_(J,Q,Z){let K=this.parameterPositions,$=J-2,X=J+1,Y=K[$],W=K[X];if(Y===void 0)switch(this.getSettings_().endingStart){case 2401:$=J,Y=2*Q-Z;break;case 2402:$=K.length-2,Y=Q+K[$]-K[$+1];break;default:$=J,Y=Z}if(W===void 0)switch(this.getSettings_().endingEnd){case 2401:X=J,W=2*Z-Q;break;case 2402:X=1,W=Z+K[1]-K[0];break;default:X=J-1,W=Q}let U=(Z-Q)*0.5,H=this.valueSize;this._weightPrev=U/(Q-Y),this._weightNext=U/(W-Z),this._offsetPrev=$*H,this._offsetNext=X*H}interpolate_(J,Q,Z,K){let $=this.resultBuffer,X=this.sampleValues,Y=this.valueSize,W=J*Y,U=W-Y,H=this._offsetPrev,N=this._offsetNext,F=this._weightPrev,G=this._weightNext,D=(Z-Q)/(K-Q),R=D*D,B=R*D,q=-F*B+2*F*R-F*D,E=(1+F)*B+(-1.5-2*F)*R+(-0.5+F)*D+1,z=(-1-G)*B+(1.5+G)*R+0.5*D,w=G*B-G*R;for(let k=0;k!==Y;++k)$[k]=q*X[H+k]+E*X[U+k]+z*X[W+k]+w*X[N+k];return $}}class gZ extends w8{constructor(J,Q,Z,K){super(J,Q,Z,K)}interpolate_(J,Q,Z,K){let $=this.resultBuffer,X=this.sampleValues,Y=this.valueSize,W=J*Y,U=W-Y,H=(Z-Q)/(K-Q),N=1-H;for(let F=0;F!==Y;++F)$[F]=X[U+F]*N+X[W+F]*H;return $}}class pZ extends w8{constructor(J,Q,Z,K){super(J,Q,Z,K)}interpolate_(J){return this.copySampleValue_(J-1)}}class mZ extends w8{interpolate_(J,Q,Z,K){let $=this.resultBuffer,X=this.sampleValues,Y=this.valueSize,W=J*Y,U=W-Y,H=this.inTangents,N=this.outTangents;if(!H||!N){let D=(Z-Q)/(K-Q),R=1-D;for(let B=0;B!==Y;++B)$[B]=X[U+B]*R+X[W+B]*D;return $}let F=Y*2,G=J-1;for(let D=0;D!==Y;++D){let R=X[U+D],B=X[W+D],q=G*F+D*2,E=N[q],z=N[q+1],w=J*F+D*2,k=H[w],C=H[w+1],_=lY(Z,Q,E,k,K);$[D]=GX(_,R,z,C,B)}return $}}function GX(J,Q,Z,K,$){let X=1-J;return X*X*X*Q+3*X*X*J*Z+3*X*J*J*K+J*J*J*$}function mY(J,Q,Z,K,$){let X=1-J;return 3*X*X*(Z-Q)+6*X*J*(K-Z)+3*J*J*($-K)}function lY(J,Q,Z,K,$){let X=(J-Q)/($-Q);for(let Y=0;Y<8;Y++){let W=GX(X,Q,Z,K,$)-J;if(Math.abs(W)<0.0000000001)break;let U=mY(X,Q,Z,K,$);if(Math.abs(U)<0.0000000001)break;X=Math.max(0,Math.min(1,X-W/U))}return X}class H9{constructor(J,Q,Z,K){if(J===void 0)throw Error("THREE.KeyframeTrack: track name is undefined");if(Q===void 0||Q.length===0)throw Error("THREE.KeyframeTrack: no keyframes in track named "+J);this.name=J,this.times=a8(Q,this.TimeBufferType),this.values=a8(Z,this.ValueBufferType),this.setInterpolation(K||this.DefaultInterpolation)}static toJSON(J){let Q=J.constructor,Z;if(Q.toJSON!==this.toJSON)Z=Q.toJSON(J);else{Z={name:J.name,times:a8(J.times,Array),values:a8(J.values,Array)};let K=J.getInterpolation();if(K!==J.DefaultInterpolation)Z.interpolation=K;if(PQ(J.settings))Z.settings={inTangents:a8(J.settings.inTangents,Array),outTangents:a8(J.settings.outTangents,Array)}}return Z.type=J.ValueTypeName,Z}InterpolantFactoryMethodDiscrete(J){return new pZ(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodLinear(J){return new gZ(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodSmooth(J){return new xZ(this.times,this.values,this.getValueSize(),J)}InterpolantFactoryMethodBezier(J){let Q=new mZ(this.times,this.values,this.getValueSize(),J);if(this.settings)Q.inTangents=this.settings.inTangents,Q.outTangents=this.settings.outTangents;return Q}setInterpolation(J){let Q;switch(J){case 2300:Q=this.InterpolantFactoryMethodDiscrete;break;case 2301:Q=this.InterpolantFactoryMethodLinear;break;case 2302:Q=this.InterpolantFactoryMethodSmooth;break;case 2303:Q=this.InterpolantFactoryMethodBezier;break}if(Q===void 0){let Z="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(J!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(Z);return j0("KeyframeTrack:",Z),this}return this.createInterpolant=Q,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return 2300;case this.InterpolantFactoryMethodLinear:return 2301;case this.InterpolantFactoryMethodSmooth:return 2302;case this.InterpolantFactoryMethodBezier:return 2303}}getValueSize(){return this.values.length/this.times.length}shift(J){if(J!==0){let Q=this.times;for(let Z=0,K=Q.length;Z!==K;++Z)Q[Z]+=J}return this}scale(J){if(J!==1){let Q=this.times;for(let Z=0,K=Q.length;Z!==K;++Z)Q[Z]*=J;if(PQ(this.settings))eK(this.settings.inTangents,J),eK(this.settings.outTangents,J)}return this}trim(J,Q){let Z=this.times,K=Z.length,$=0,X=K-1;while($!==K&&Z[$]<J)++$;while(X!==-1&&Z[X]>Q)--X;if(++X,$!==0||X!==K){if($>=X)X=Math.max(X,1),$=X-1;let Y=this.getValueSize();this.times=Z.slice($,X),this.values=this.values.slice($*Y,X*Y)}return this}validate(){let J=!0,Q=this.getValueSize();if(Q-Math.floor(Q)!==0)P0("KeyframeTrack: Invalid value size in track.",this),J=!1;let Z=this.times,K=this.values,$=Z.length;if($===0)P0("KeyframeTrack: Track is empty.",this),J=!1;let X=null;for(let Y=0;Y!==$;Y++){let W=Z[Y];if(typeof W==="number"&&isNaN(W)){P0("KeyframeTrack: Time is not a valid number.",this,Y,W),J=!1;break}if(X!==null&&X>W){P0("KeyframeTrack: Out of order keys.",this,Y,W,X),J=!1;break}X=W}if(K!==void 0){if(RY(K))for(let Y=0,W=K.length;Y!==W;++Y){let U=K[Y];if(isNaN(U)){P0("KeyframeTrack: Value is not a valid number.",this,Y,U),J=!1;break}}}return J}optimize(){let J=this.times.slice(),Q=this.values.slice(),Z=this.getValueSize(),K=this.getInterpolation()===2302,$=J.length-1,X=1;for(let Y=1;Y<$;++Y){let W=!1,U=J[Y],H=J[Y+1];if(U!==H&&(Y!==1||U!==J[0]))if(!K){let N=Y*Z,F=N-Z,G=N+Z;for(let D=0;D!==Z;++D){let R=Q[N+D];if(R!==Q[F+D]||R!==Q[G+D]){W=!0;break}}}else W=!0;if(W){if(Y!==X){J[X]=J[Y];let N=Y*Z,F=X*Z;for(let G=0;G!==Z;++G)Q[F+G]=Q[N+G]}++X}}if($>0){J[X]=J[$];for(let Y=$*Z,W=X*Z,U=0;U!==Z;++U)Q[W+U]=Q[Y+U];++X}if(X!==J.length)this.times=J.slice(0,X),this.values=Q.slice(0,X*Z);else this.times=J,this.values=Q;return this}clone(){let J=this.times.slice(),Q=this.values.slice(),K=new this.constructor(this.name,J,Q);if(K.createInterpolant=this.createInterpolant,PQ(this.settings))K.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()};return K}}function eK(J,Q){for(let Z=0,K=J.length;Z!==K;Z+=2)J[Z]*=Q}H9.prototype.ValueTypeName="";H9.prototype.TimeBufferType=Float32Array;H9.prototype.ValueBufferType=Float32Array;H9.prototype.DefaultInterpolation=2301;class P8 extends H9{constructor(J,Q,Z){super(J,Q,Z)}}P8.prototype.ValueTypeName="bool";P8.prototype.ValueBufferType=Array;P8.prototype.DefaultInterpolation=2300;P8.prototype.InterpolantFactoryMethodLinear=void 0;P8.prototype.InterpolantFactoryMethodSmooth=void 0;class lZ extends H9{constructor(J,Q,Z,K){super(J,Q,Z,K)}}lZ.prototype.ValueTypeName="color";class dZ extends H9{constructor(J,Q,Z,K){super(J,Q,Z,K)}}dZ.prototype.ValueTypeName="number";class uZ extends w8{constructor(J,Q,Z,K){super(J,Q,Z,K)}interpolate_(J,Q,Z,K){let $=this.resultBuffer,X=this.sampleValues,Y=this.valueSize,W=(Z-Q)/(K-Q),U=J*Y;for(let H=U+Y;U!==H;U+=4)d9.slerpFlat($,0,X,U-Y,X,U,W);return $}}class p6 extends H9{constructor(J,Q,Z,K){super(J,Q,Z,K)}InterpolantFactoryMethodLinear(J){return new uZ(this.times,this.values,this.getValueSize(),J)}}p6.prototype.ValueTypeName="quaternion";p6.prototype.InterpolantFactoryMethodSmooth=void 0;class T8 extends H9{constructor(J,Q,Z){super(J,Q,Z)}}T8.prototype.ValueTypeName="string";T8.prototype.ValueBufferType=Array;T8.prototype.DefaultInterpolation=2300;T8.prototype.InterpolantFactoryMethodLinear=void 0;T8.prototype.InterpolantFactoryMethodSmooth=void 0;class cZ extends H9{constructor(J,Q,Z,K){super(J,Q,Z,K)}}cZ.prototype.ValueTypeName="vector";class nZ{constructor(J,Q,Z){let K=this,$=!1,X=0,Y=0,W=void 0,U=[];this.onStart=void 0,this.onLoad=J,this.onProgress=Q,this.onError=Z,this._abortController=null,this.itemStart=function(H){if(Y++,$===!1){if(K.onStart!==void 0)K.onStart(H,X,Y)}$=!0},this.itemEnd=function(H){if(X++,K.onProgress!==void 0)K.onProgress(H,X,Y);if(X===Y){if($=!1,K.onLoad!==void 0)K.onLoad()}},this.itemError=function(H){if(K.onError!==void 0)K.onError(H)},this.resolveURL=function(H){if(H=H.normalize("NFC"),W)return W(H);return H},this.setURLModifier=function(H){return W=H,this},this.addHandler=function(H,N){return U.push(H,N),this},this.removeHandler=function(H){let N=U.indexOf(H);if(N!==-1)U.splice(N,2);return this},this.getHandler=function(H){for(let N=0,F=U.length;N<F;N+=2){let G=U[N],D=U[N+1];if(G.global)G.lastIndex=0;if(G.test(H))return D}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){if(!this._abortController)this._abortController=new AbortController;return this._abortController}}var NX=new nZ;class sZ{constructor(J){if(this.manager=J!==void 0?J:NX,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(J,Q){let Z=this;return new Promise(function(K,$){Z.load(J,K,Q,$)})}parse(){}setCrossOrigin(J){return this.crossOrigin=J,this}setWithCredentials(J){return this.withCredentials=J,this}setPath(J){return this.path=J,this}setResourcePath(J){return this.resourcePath=J,this}setRequestHeader(J){return this.requestHeader=J,this}abort(){return this}}sZ.DEFAULT_MATERIAL_NAME="__DEFAULT";class h7 extends MJ{constructor(J,Q=1){super();this.isLight=!0,this.type="Light",this.color=new x0(J),this.intensity=Q}copy(J,Q){return super.copy(J,Q),this.color.copy(J.color),this.intensity=J.intensity,this}toJSON(J){let Q=super.toJSON(J);return Q.object.color=this.color.getHex(),Q.object.intensity=this.intensity,Q}}class m6 extends h7{constructor(J,Q,Z){super(J,Z);this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(MJ.DEFAULT_UP),this.updateMatrix(),this.groundColor=new x0(Q)}copy(J,Q){return super.copy(J,Q),this.groundColor.copy(J.groundColor),this}toJSON(J){let Q=super.toJSON(J);return Q.object.groundColor=this.groundColor.getHex(),Q}}var TQ=new KJ,J$=new h,Q$=new h;class l6{constructor(J){this.camera=J,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new v0(512,512),this.mapType=1009,this.map=null,this.mapPass=null,this.matrix=new KJ,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new v7,this._frameExtents=new v0(1,1),this._viewportCount=1,this._viewports=[new OJ(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(J){let Q=this.camera;J$.setFromMatrixPosition(J.matrixWorld),Q.position.copy(J$),Q$.setFromMatrixPosition(J.target.matrixWorld),Q.lookAt(Q$),Q.updateMatrixWorld(),this._updateMatrix(Q,this.matrix,this._frustum)}_updateMatrix(J,Q,Z,K){TQ.multiplyMatrices(J.projectionMatrix,J.matrixWorldInverse),Z.setFromProjectionMatrix(TQ,J.coordinateSystem,J.reversedDepth);let $=this._frameExtents,X=K?K.z/$.x:1,Y=K?K.w/$.y:1,W=K?K.x/$.x:0,U=K?K.y/$.y:0;if(J.coordinateSystem===2001||J.reversedDepth)Q.set(0.5*X,0,0,0.5*X+W,0,0.5*Y,0,0.5*Y+U,0,0,1,0,0,0,0,1);else Q.set(0.5*X,0,0,0.5*X+W,0,0.5*Y,0,0.5*Y+U,0,0,0.5,0.5,0,0,0,1);Q.multiply(TQ)}getViewport(J){return this._viewports[J]}getFrameExtents(){return this._frameExtents}dispose(){if(this.map)this.map.dispose();if(this.mapPass)this.mapPass.dispose()}copy(J){return this.camera=J.camera.clone(),this.intensity=J.intensity,this.bias=J.bias,this.radius=J.radius,this.autoUpdate=J.autoUpdate,this.needsUpdate=J.needsUpdate,this.normalBias=J.normalBias,this.blurSamples=J.blurSamples,this.mapSize.copy(J.mapSize),this.biasNode=J.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let J={};return J.intensity=this.intensity,J.bias=this.bias,J.normalBias=this.normalBias,J.radius=this.radius,J.blurSamples=this.blurSamples,J.mapSize=this.mapSize.toArray(),J.camera=this.camera.toJSON(!1).object,delete J.camera.matrix,J}}var D6=new h,O6=new d9,L9=new h;class d6 extends MJ{constructor(){super();this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new KJ,this.projectionMatrix=new KJ,this.projectionMatrixInverse=new KJ,this.coordinateSystem=2000,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(J,Q){return super.copy(J,Q),this.matrixWorldInverse.copy(J.matrixWorldInverse),this.projectionMatrix.copy(J.projectionMatrix),this.projectionMatrixInverse.copy(J.projectionMatrixInverse),this.coordinateSystem=J.coordinateSystem,this}getWorldDirection(J){return super.getWorldDirection(J).negate()}updateMatrixWorld(J){if(super.updateMatrixWorld(J),this.matrixWorld.decompose(D6,O6,L9),L9.x===1&&L9.y===1&&L9.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(D6,O6,L9.set(1,1,1)).invert()}updateWorldMatrix(J,Q,Z=!1){if(super.updateWorldMatrix(J,Q,Z),this.matrixWorld.decompose(D6,O6,L9),L9.x===1&&L9.y===1&&L9.z===1)this.matrixWorldInverse.copy(this.matrixWorld).invert();else this.matrixWorldInverse.compose(D6,O6,L9.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}var Z8=new h,Z$=new v0,K$=new v0;class bJ extends d6{constructor(J=50,Q=1,Z=0.1,K=2000){super();this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=J,this.zoom=1,this.near=Z,this.far=K,this.focus=10,this.aspect=Q,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(J,Q){return super.copy(J,Q),this.fov=J.fov,this.zoom=J.zoom,this.near=J.near,this.far=J.far,this.focus=J.focus,this.aspect=J.aspect,this.view=J.view===null?null:Object.assign({},J.view),this.filmGauge=J.filmGauge,this.filmOffset=J.filmOffset,this}setFocalLength(J){let Q=0.5*this.getFilmHeight()/J;this.fov=R6*2*Math.atan(Q),this.updateProjectionMatrix()}getFocalLength(){let J=Math.tan(WQ*0.5*this.fov);return 0.5*this.getFilmHeight()/J}getEffectiveFOV(){return R6*2*Math.atan(Math.tan(WQ*0.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(J,Q,Z){Z8.set(-1,-1,0.5).applyMatrix4(this.projectionMatrixInverse),Q.set(Z8.x,Z8.y).multiplyScalar(-J/Z8.z),Z8.set(1,1,0.5).applyMatrix4(this.projectionMatrixInverse),Z.set(Z8.x,Z8.y).multiplyScalar(-J/Z8.z)}getViewSize(J,Q){return this.getViewBounds(J,Z$,K$),Q.subVectors(K$,Z$)}setViewOffset(J,Q,Z,K,$,X){if(this.aspect=J/Q,this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=J,this.view.fullHeight=Q,this.view.offsetX=Z,this.view.offsetY=K,this.view.width=$,this.view.height=X,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let J=this.near,Q=J*Math.tan(WQ*0.5*this.fov)/this.zoom,Z=2*Q,K=this.aspect*Z,$=-0.5*K,X=this.view;if(this.view!==null&&this.view.enabled){let{fullWidth:W,fullHeight:U}=X;$+=X.offsetX*K/W,Q-=X.offsetY*Z/U,K*=X.width/W,Z*=X.height/U}let Y=this.filmOffset;if(Y!==0)$+=J*Y/this.getFilmWidth();this.projectionMatrix.makePerspective($,$+K,Q,Q-Z,J,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(J){let Q=super.toJSON(J);if(Q.object.fov=this.fov,Q.object.zoom=this.zoom,Q.object.near=this.near,Q.object.far=this.far,Q.object.focus=this.focus,Q.object.aspect=this.aspect,this.view!==null)Q.object.view=Object.assign({},this.view);return Q.object.filmGauge=this.filmGauge,Q.object.filmOffset=this.filmOffset,Q}}class EX extends l6{constructor(){super(new bJ(90,1,0.5,500));this.isPointLightShadow=!0}}class u6 extends h7{constructor(J,Q,Z=0,K=2){super(J,Q);this.isPointLight=!0,this.type="PointLight",this.distance=Z,this.decay=K,this.shadow=new EX}get power(){return this.intensity*4*Math.PI}set power(J){this.intensity=J/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(J,Q){return super.copy(J,Q),this.distance=J.distance,this.decay=J.decay,this.shadow=J.shadow.clone(),this}toJSON(J){let Q=super.toJSON(J);return Q.object.distance=this.distance,Q.object.decay=this.decay,Q.object.shadow=this.shadow.toJSON(),Q}}class b7 extends d6{constructor(J=-1,Q=1,Z=1,K=-1,$=0.1,X=2000){super();this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=J,this.right=Q,this.top=Z,this.bottom=K,this.near=$,this.far=X,this.updateProjectionMatrix()}copy(J,Q){return super.copy(J,Q),this.left=J.left,this.right=J.right,this.top=J.top,this.bottom=J.bottom,this.near=J.near,this.far=J.far,this.zoom=J.zoom,this.view=J.view===null?null:Object.assign({},J.view),this}setViewOffset(J,Q,Z,K,$,X){if(this.view===null)this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1};this.view.enabled=!0,this.view.fullWidth=J,this.view.fullHeight=Q,this.view.offsetX=Z,this.view.offsetY=K,this.view.width=$,this.view.height=X,this.updateProjectionMatrix()}clearViewOffset(){if(this.view!==null)this.view.enabled=!1;this.updateProjectionMatrix()}updateProjectionMatrix(){let J=(this.right-this.left)/(2*this.zoom),Q=(this.top-this.bottom)/(2*this.zoom),Z=(this.right+this.left)/2,K=(this.top+this.bottom)/2,$=Z-J,X=Z+J,Y=K+Q,W=K-Q;if(this.view!==null&&this.view.enabled){let U=(this.right-this.left)/this.view.fullWidth/this.zoom,H=(this.top-this.bottom)/this.view.fullHeight/this.zoom;$+=U*this.view.offsetX,X=$+U*this.view.width,Y-=H*this.view.offsetY,W=Y-H*this.view.height}this.projectionMatrix.makeOrthographic($,X,Y,W,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(J){let Q=super.toJSON(J);if(Q.object.zoom=this.zoom,Q.object.left=this.left,Q.object.right=this.right,Q.object.top=this.top,Q.object.bottom=this.bottom,Q.object.near=this.near,Q.object.far=this.far,this.view!==null)Q.object.view=Object.assign({},this.view);return Q}}class FX extends l6{constructor(){super(new b7(-5,5,5,-5,0.5,500));this.isDirectionalLightShadow=!0}}class c6 extends h7{constructor(J,Q){super(J,Q);this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(MJ.DEFAULT_UP),this.updateMatrix(),this.target=new MJ,this.shadow=new FX}dispose(){super.dispose(),this.shadow.dispose()}copy(J){return super.copy(J),this.target=J.target.clone(),this.shadow=J.shadow.clone(),this}toJSON(J){let Q=super.toJSON(J);return Q.object.shadow=this.shadow.toJSON(),Q.object.target=this.target.uuid,Q}}var r8=-90,t8=1;class iZ extends MJ{constructor(J,Q,Z){super();this.type="CubeCamera",this.renderTarget=Z,this.coordinateSystem=null,this.activeMipmapLevel=0;let K=new bJ(r8,t8,J,Q);K.layers=this.layers,this.add(K);let $=new bJ(r8,t8,J,Q);$.layers=this.layers,this.add($);let X=new bJ(r8,t8,J,Q);X.layers=this.layers,this.add(X);let Y=new bJ(r8,t8,J,Q);Y.layers=this.layers,this.add(Y);let W=new bJ(r8,t8,J,Q);W.layers=this.layers,this.add(W);let U=new bJ(r8,t8,J,Q);U.layers=this.layers,this.add(U)}updateCoordinateSystem(){let J=this.coordinateSystem,Q=this.children.concat(),[Z,K,$,X,Y,W]=Q;for(let U of Q)this.remove(U);if(J===2000)Z.up.set(0,1,0),Z.lookAt(1,0,0),K.up.set(0,1,0),K.lookAt(-1,0,0),$.up.set(0,0,-1),$.lookAt(0,1,0),X.up.set(0,0,1),X.lookAt(0,-1,0),Y.up.set(0,1,0),Y.lookAt(0,0,1),W.up.set(0,1,0),W.lookAt(0,0,-1);else if(J===2001)Z.up.set(0,-1,0),Z.lookAt(-1,0,0),K.up.set(0,-1,0),K.lookAt(1,0,0),$.up.set(0,0,1),$.lookAt(0,1,0),X.up.set(0,0,-1),X.lookAt(0,-1,0),Y.up.set(0,-1,0),Y.lookAt(0,0,1),W.up.set(0,-1,0),W.lookAt(0,0,-1);else throw Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+J);for(let U of Q)this.add(U),U.updateMatrixWorld()}update(J,Q){if(this.parent===null)this.updateMatrixWorld();let{renderTarget:Z,activeMipmapLevel:K}=this;if(this.coordinateSystem!==J.coordinateSystem)this.coordinateSystem=J.coordinateSystem,this.updateCoordinateSystem();let[$,X,Y,W,U,H]=this.children,N=J.getRenderTarget(),F=J.getActiveCubeFace(),G=J.getActiveMipmapLevel(),D=J.xr.enabled;J.xr.enabled=!1;let R=Z.texture.generateMipmaps;Z.texture.generateMipmaps=!1;let B=!1;if(J.isWebGLRenderer===!0)B=J.state.buffers.depth.getReversed();else B=J.reversedDepthBuffer;if(J.setRenderTarget(Z,0,K),B&&J.autoClear===!1)J.clearDepth();if(J.render(Q,$),J.setRenderTarget(Z,1,K),B&&J.autoClear===!1)J.clearDepth();if(J.render(Q,X),J.setRenderTarget(Z,2,K),B&&J.autoClear===!1)J.clearDepth();if(J.render(Q,Y),J.setRenderTarget(Z,3,K),B&&J.autoClear===!1)J.clearDepth();if(J.render(Q,W),J.setRenderTarget(Z,4,K),B&&J.autoClear===!1)J.clearDepth();if(J.render(Q,U),Z.texture.generateMipmaps=R,J.setRenderTarget(Z,5,K),B&&J.autoClear===!1)J.clearDepth();J.render(Q,H),J.setRenderTarget(N,F,G),J.xr.enabled=D,Z.texture.needsPMREMUpdate=!0}}class oZ extends bJ{constructor(J=[]){super();this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=J}}var aZ="\\[\\]\\.:\\/",dY=new RegExp("["+aZ+"]","g"),rZ="[^"+aZ+"]",uY="[^"+aZ.replace("\\.","")+"]",cY=/((?:WC+[\/:])*)/.source.replace("WC",rZ),nY=/(WCOD+)?/.source.replace("WCOD",uY),sY=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",rZ),iY=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",rZ),oY=new RegExp("^"+cY+nY+sY+iY+"$"),aY=["material","materials","bones","map"];class qX{constructor(J,Q,Z){let K=Z||ZJ.parseTrackName(Q);this._targetGroup=J,this._bindings=J.subscribe_(Q,K)}getValue(J,Q){this.bind();let Z=this._targetGroup.nCachedObjects_,K=this._bindings[Z];if(K!==void 0)K.getValue(J,Q)}setValue(J,Q){let Z=this._bindings;for(let K=this._targetGroup.nCachedObjects_,$=Z.length;K!==$;++K)Z[K].setValue(J,Q)}bind(){let J=this._bindings;for(let Q=this._targetGroup.nCachedObjects_,Z=J.length;Q!==Z;++Q)J[Q].bind()}unbind(){let J=this._bindings;for(let Q=this._targetGroup.nCachedObjects_,Z=J.length;Q!==Z;++Q)J[Q].unbind()}}class ZJ{constructor(J,Q,Z){this.path=Q,this.parsedPath=Z||ZJ.parseTrackName(Q),this.node=ZJ.findNode(J,this.parsedPath.nodeName),this.rootNode=J,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(J,Q,Z){if(!(J&&J.isAnimationObjectGroup))return new ZJ(J,Q,Z);else return new ZJ.Composite(J,Q,Z)}static sanitizeNodeName(J){return J.replace(/\s/g,"_").replace(dY,"")}static parseTrackName(J){let Q=oY.exec(J);if(Q===null)throw Error("THREE.PropertyBinding: Cannot parse trackName: "+J);let Z={nodeName:Q[2],objectName:Q[3],objectIndex:Q[4],propertyName:Q[5],propertyIndex:Q[6]},K=Z.nodeName&&Z.nodeName.lastIndexOf(".");if(K!==void 0&&K!==-1){let $=Z.nodeName.substring(K+1);if(aY.indexOf($)!==-1)Z.nodeName=Z.nodeName.substring(0,K),Z.objectName=$}if(Z.propertyName===null||Z.propertyName.length===0)throw Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+J);return Z}static findNode(J,Q){if(Q===void 0||Q===""||Q==="."||Q===-1||Q===J.name||Q===J.uuid)return J;if(J.skeleton){let Z=J.skeleton.getBoneByName(Q);if(Z!==void 0)return Z}if(J.children){let Z=function($){for(let X=0;X<$.length;X++){let Y=$[X];if(Y.name===Q||Y.uuid===Q)return Y;let W=Z(Y.children);if(W)return W}return null},K=Z(J.children);if(K)return K}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(J,Q){J[Q]=this.targetObject[this.propertyName]}_getValue_array(J,Q){let Z=this.resolvedProperty;for(let K=0,$=Z.length;K!==$;++K)J[Q++]=Z[K]}_getValue_arrayElement(J,Q){J[Q]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(J,Q){this.resolvedProperty.toArray(J,Q)}_setValue_direct(J,Q){this.targetObject[this.propertyName]=J[Q]}_setValue_direct_setNeedsUpdate(J,Q){this.targetObject[this.propertyName]=J[Q],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(J,Q){this.targetObject[this.propertyName]=J[Q],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(J,Q){let Z=this.resolvedProperty;for(let K=0,$=Z.length;K!==$;++K)Z[K]=J[Q++]}_setValue_array_setNeedsUpdate(J,Q){let Z=this.resolvedProperty;for(let K=0,$=Z.length;K!==$;++K)Z[K]=J[Q++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(J,Q){let Z=this.resolvedProperty;for(let K=0,$=Z.length;K!==$;++K)Z[K]=J[Q++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(J,Q){this.resolvedProperty[this.propertyIndex]=J[Q]}_setValue_arrayElement_setNeedsUpdate(J,Q){this.resolvedProperty[this.propertyIndex]=J[Q],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(J,Q){this.resolvedProperty[this.propertyIndex]=J[Q],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(J,Q){this.resolvedProperty.fromArray(J,Q)}_setValue_fromArray_setNeedsUpdate(J,Q){this.resolvedProperty.fromArray(J,Q),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(J,Q){this.resolvedProperty.fromArray(J,Q),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(J,Q){this.bind(),this.getValue(J,Q)}_setValue_unbound(J,Q){this.bind(),this.setValue(J,Q)}bind(){let J=this.node,Q=this.parsedPath,Z=Q.objectName,K=Q.propertyName,$=Q.propertyIndex;if(!J)J=ZJ.findNode(this.rootNode,Q.nodeName),this.node=J;if(this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!J){j0("PropertyBinding: No target node found for track: "+this.path+".");return}if(Z){let U=Q.objectIndex;switch(Z){case"materials":if(!J.material){P0("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!J.material.materials){P0("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}J=J.material.materials;break;case"bones":if(!J.skeleton){P0("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}J=J.skeleton.bones;for(let H=0;H<J.length;H++)if(J[H].name===U){U=H;break}break;case"map":if("map"in J){J=J.map;break}if(!J.material){P0("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!J.material.map){P0("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}J=J.material.map;break;default:if(J[Z]===void 0){P0("PropertyBinding: Can not bind to objectName of node undefined.",this);return}J=J[Z]}if(U!==void 0){if(J[U]===void 0){P0("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,J);return}J=J[U]}}let X=J[K];if(X===void 0){let U=Q.nodeName;P0("PropertyBinding: Trying to update property for track: "+U+"."+K+" but it wasn't found.",J);return}let Y=this.Versioning.None;if(this.targetObject=J,J.isMaterial===!0)Y=this.Versioning.NeedsUpdate;else if(J.isObject3D===!0)Y=this.Versioning.MatrixWorldNeedsUpdate;let W=this.BindingType.Direct;if($!==void 0){if(K==="morphTargetInfluences"){if(!J.geometry){P0("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!J.geometry.morphAttributes){P0("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}if(J.morphTargetDictionary[$]!==void 0)$=J.morphTargetDictionary[$]}W=this.BindingType.ArrayElement,this.resolvedProperty=X,this.propertyIndex=$}else if(X.fromArray!==void 0&&X.toArray!==void 0)W=this.BindingType.HasFromToArray,this.resolvedProperty=X;else if(Array.isArray(X))W=this.BindingType.EntireArray,this.resolvedProperty=X;else this.propertyName=K;this.getValue=this.GetterByBindingType[W],this.setValue=this.SetterByBindingTypeAndVersioning[W][Y]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}ZJ.Composite=qX;ZJ.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ZJ.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ZJ.prototype.GetterByBindingType=[ZJ.prototype._getValue_direct,ZJ.prototype._getValue_array,ZJ.prototype._getValue_arrayElement,ZJ.prototype._getValue_toArray];ZJ.prototype.SetterByBindingTypeAndVersioning=[[ZJ.prototype._setValue_direct,ZJ.prototype._setValue_direct_setNeedsUpdate,ZJ.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ZJ.prototype._setValue_array,ZJ.prototype._setValue_array_setNeedsUpdate,ZJ.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ZJ.prototype._setValue_arrayElement,ZJ.prototype._setValue_arrayElement_setNeedsUpdate,ZJ.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ZJ.prototype._setValue_fromArray,ZJ.prototype._setValue_fromArray_setNeedsUpdate,ZJ.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var YN=new Float32Array(1);var $$=new KJ;class n6{constructor(J,Q,Z=0,K=1/0){this.ray=new f6(J,Q),this.near=Z,this.far=K,this.camera=null,this.layers=new T7,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(J,Q){this.ray.set(J,Q)}setFromCamera(J,Q){if(Q.isPerspectiveCamera)this.ray.origin.setFromMatrixPosition(Q.matrixWorld),this.ray.direction.set(J.x,J.y,0.5).unproject(Q).sub(this.ray.origin).normalize(),this.camera=Q;else if(Q.isOrthographicCamera)this.ray.origin.set(J.x,J.y,Q.projectionMatrix.elements[14]).unproject(Q),this.ray.direction.set(0,0,-1).transformDirection(Q.matrixWorld),this.camera=Q;else P0("Raycaster: Unsupported camera type: "+Q.type)}setFromXRController(J){return $$.identity().extractRotation(J.matrixWorld),this.ray.origin.setFromMatrixPosition(J.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4($$),this}intersectObject(J,Q=!0,Z=[]){return SQ(J,this,Z,Q),Z.sort(X$),Z}intersectObjects(J,Q=!0,Z=[]){for(let K=0,$=J.length;K<$;K++)SQ(J[K],this,Z,Q);return Z.sort(X$),Z}}function X$(J,Q){return J.distance-Q.distance}function SQ(J,Q,Z,K){let $=!0;if(J.layers.test(Q.layers)){if(J.raycast(Q,Z)===!1)$=!1}if($===!0&&K===!0){let X=J.children;for(let Y=0,W=X.length;Y<W;Y++)SQ(X[Y],Q,Z,!0)}}class tZ{static{tZ.prototype.isMatrix2=!0}constructor(J,Q,Z,K){if(this.elements=[1,0,0,1],J!==void 0)this.set(J,Q,Z,K)}identity(){return this.set(1,0,0,1),this}fromArray(J,Q=0){for(let Z=0;Z<4;Z++)this.elements[Z]=J[Z+Q];return this}set(J,Q,Z,K){let $=this.elements;return $[0]=J,$[2]=Q,$[1]=Z,$[3]=K,this}}function eZ(J,Q,Z,K){let $=rY(K);switch(Z){case 1021:return J*Q;case 1028:return J*Q/$.components*$.byteLength;case 1029:return J*Q/$.components*$.byteLength;case 1030:return J*Q*2/$.components*$.byteLength;case 1031:return J*Q*2/$.components*$.byteLength;case 1022:return J*Q*3/$.components*$.byteLength;case 1023:return J*Q*4/$.components*$.byteLength;case 1033:return J*Q*4/$.components*$.byteLength;case 33776:case 33777:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*8;case 33778:case 33779:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*16;case 35841:case 35843:return Math.max(J,16)*Math.max(Q,8)/4;case 35840:case 35842:return Math.max(J,8)*Math.max(Q,8)/2;case 36196:case 37492:case 37488:case 37489:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*8;case 37496:case 37490:case 37491:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*16;case 37808:return Math.floor((J+3)/4)*Math.floor((Q+3)/4)*16;case 37809:return Math.floor((J+4)/5)*Math.floor((Q+3)/4)*16;case 37810:return Math.floor((J+4)/5)*Math.floor((Q+4)/5)*16;case 37811:return Math.floor((J+5)/6)*Math.floor((Q+4)/5)*16;case 37812:return Math.floor((J+5)/6)*Math.floor((Q+5)/6)*16;case 37813:return Math.floor((J+7)/8)*Math.floor((Q+4)/5)*16;case 37814:return Math.floor((J+7)/8)*Math.floor((Q+5)/6)*16;case 37815:return Math.floor((J+7)/8)*Math.floor((Q+7)/8)*16;case 37816:return Math.floor((J+9)/10)*Math.floor((Q+4)/5)*16;case 37817:return Math.floor((J+9)/10)*Math.floor((Q+5)/6)*16;case 37818:return Math.floor((J+9)/10)*Math.floor((Q+7)/8)*16;case 37819:return Math.floor((J+9)/10)*Math.floor((Q+9)/10)*16;case 37820:return Math.floor((J+11)/12)*Math.floor((Q+9)/10)*16;case 37821:return Math.floor((J+11)/12)*Math.floor((Q+11)/12)*16;case 36492:case 36494:case 36495:return Math.ceil(J/4)*Math.ceil(Q/4)*16;case 36283:case 36284:return Math.ceil(J/4)*Math.ceil(Q/4)*8;case 36285:case 36286:return Math.ceil(J/4)*Math.ceil(Q/4)*16}throw Error(`Unable to determine texture byte length for ${Z} format.`)}function rY(J){switch(J){case 1009:case 1010:return{byteLength:1,components:1};case 1012:case 1011:case 1016:return{byteLength:2,components:1};case 1017:case 1018:return{byteLength:2,components:4};case 1014:case 1013:case 1015:return{byteLength:4,components:1};case 35902:case 35899:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${J}.`)}if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));if(typeof window<"u")if(window.__THREE__)j0("WARNING: Multiple instances of Three.js being imported.");else window.__THREE__="186";function hX(){let J=null,Q=!1,Z=null,K=null;function $(X,Y){K=J.requestAnimationFrame($),Z(X,Y)}return{start:function(){if(Q===!0)return;if(Z===null)return;if(J===null)return;K=J.requestAnimationFrame($),Q=!0},stop:function(){if(J!==null)J.cancelAnimationFrame(K);Q=!1},setAnimationLoop:function(X){Z=X},setContext:function(X){J=X}}}function tY(J){let Q=new WeakMap;function Z(W,U){let{array:H,usage:N}=W,F=H.byteLength,G=J.createBuffer();J.bindBuffer(U,G),J.bufferData(U,H,N),W.onUploadCallback();let D;if(H instanceof Float32Array)D=J.FLOAT;else if(typeof Float16Array<"u"&&H instanceof Float16Array)D=J.HALF_FLOAT;else if(H instanceof Uint16Array)if(W.isFloat16BufferAttribute)D=J.HALF_FLOAT;else D=J.UNSIGNED_SHORT;else if(H instanceof Int16Array)D=J.SHORT;else if(H instanceof Uint32Array)D=J.UNSIGNED_INT;else if(H instanceof Int32Array)D=J.INT;else if(H instanceof Int8Array)D=J.BYTE;else if(H instanceof Uint8Array)D=J.UNSIGNED_BYTE;else if(H instanceof Uint8ClampedArray)D=J.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+H);return{buffer:G,type:D,bytesPerElement:H.BYTES_PER_ELEMENT,version:W.version,size:F}}function K(W,U,H){let{array:N,updateRanges:F}=U;if(J.bindBuffer(H,W),F.length===0)J.bufferSubData(H,0,N);else{F.sort((D,R)=>D.start-R.start);let G=0;for(let D=1;D<F.length;D++){let R=F[G],B=F[D];if(B.start<=R.start+R.count+1)R.count=Math.max(R.count,B.start+B.count-R.start);else++G,F[G]=B}F.length=G+1;for(let D=0,R=F.length;D<R;D++){let B=F[D];J.bufferSubData(H,B.start*N.BYTES_PER_ELEMENT,N,B.start,B.count)}U.clearUpdateRanges()}U.onUploadCallback()}function $(W){if(W.isInterleavedBufferAttribute)W=W.data;return Q.get(W)}function X(W){if(W.isInterleavedBufferAttribute)W=W.data;let U=Q.get(W);if(U)J.deleteBuffer(U.buffer),Q.delete(W)}function Y(W,U){if(W.isInterleavedBufferAttribute)W=W.data;if(W.isGLBufferAttribute){let N=Q.get(W);if(!N||N.version<W.version)Q.set(W,{buffer:W.buffer,type:W.type,bytesPerElement:W.elementSize,version:W.version});return}let H=Q.get(W);if(H===void 0)Q.set(W,Z(W,U));else if(H.version<W.version){if(H.size!==W.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");K(H.buffer,W,U),H.version=W.version}}return{get:$,remove:X,update:Y}}var eY=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,JW=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,QW=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ZW=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,KW=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,$W=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,XW=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,YW=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,WW=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,UW=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,HW=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,GW=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,NW=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,EW=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,FW=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,qW=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,DW=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,OW=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,RW=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,LW=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,VW=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,MW=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,kW=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,BW=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,IW=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,CW=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,zW=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_W=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,AW=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,wW=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,PW="gl_FragColor = linearToOutputTexel( gl_FragColor );",TW=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,SW=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,jW=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,vW=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,yW=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,fW=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,hW=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,bW=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,xW=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,gW=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,pW=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,mW=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lW=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,dW=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,uW=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,cW=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,nW=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,sW=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,iW=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,oW=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,aW=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,rW=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,tW=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,eW=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,JU=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,QU=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,ZU=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,KU=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$U=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,XU=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,YU=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,WU=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,UU=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,HU=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,GU=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,NU=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,EU=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,FU=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,qU=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,DU=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,OU=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,RU=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,LU=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,VU=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,MU=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,kU=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,BU=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,IU=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,CU=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,zU=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_U=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,AU=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,wU=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,PU=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,TU=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,SU=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,jU=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,vU=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,yU=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,fU=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,hU=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,bU=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,xU=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,gU=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,pU=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,mU=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,lU=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,dU=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,uU=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,cU=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,nU=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,sU=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,iU=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,oU=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,aU=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,rU=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,tU=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,eU=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,JH=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,QH=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ZH=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,KH=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$H=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,XH=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,YH=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,WH=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,UH=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,HH=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,GH=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,NH=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,EH=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,FH=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,qH=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,DH=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,OH=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,RH=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,LH=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,VH=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,MH=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,kH=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,BH=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,IH=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,CH=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zH=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_H=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,AH=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,wH=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,PH=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,TH=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,SH=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,jH=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,p0={alphahash_fragment:eY,alphahash_pars_fragment:JW,alphamap_fragment:QW,alphamap_pars_fragment:ZW,alphatest_fragment:KW,alphatest_pars_fragment:$W,aomap_fragment:XW,aomap_pars_fragment:YW,batching_pars_vertex:WW,batching_vertex:UW,begin_vertex:HW,beginnormal_vertex:GW,bsdfs:NW,iridescence_fragment:EW,bumpmap_pars_fragment:FW,clipping_planes_fragment:qW,clipping_planes_pars_fragment:DW,clipping_planes_pars_vertex:OW,clipping_planes_vertex:RW,color_fragment:LW,color_pars_fragment:VW,color_pars_vertex:MW,color_vertex:kW,common:BW,cube_uv_reflection_fragment:IW,defaultnormal_vertex:CW,displacementmap_pars_vertex:zW,displacementmap_vertex:_W,emissivemap_fragment:AW,emissivemap_pars_fragment:wW,colorspace_fragment:PW,colorspace_pars_fragment:TW,envmap_fragment:SW,envmap_common_pars_fragment:jW,envmap_pars_fragment:vW,envmap_pars_vertex:yW,envmap_physical_pars_fragment:cW,envmap_vertex:fW,fog_vertex:hW,fog_pars_vertex:bW,fog_fragment:xW,fog_pars_fragment:gW,gradientmap_pars_fragment:pW,lightmap_pars_fragment:mW,lights_lambert_fragment:lW,lights_lambert_pars_fragment:dW,lights_pars_begin:uW,lights_toon_fragment:nW,lights_toon_pars_fragment:sW,lights_phong_fragment:iW,lights_phong_pars_fragment:oW,lights_physical_fragment:aW,lights_physical_pars_fragment:rW,lights_fragment_begin:tW,lights_fragment_maps:eW,lights_fragment_end:JU,lightprobes_pars_fragment:QU,logdepthbuf_fragment:ZU,logdepthbuf_pars_fragment:KU,logdepthbuf_pars_vertex:$U,logdepthbuf_vertex:XU,map_fragment:YU,map_pars_fragment:WU,map_particle_fragment:UU,map_particle_pars_fragment:HU,metalnessmap_fragment:GU,metalnessmap_pars_fragment:NU,morphinstance_vertex:EU,morphcolor_vertex:FU,morphnormal_vertex:qU,morphtarget_pars_vertex:DU,morphtarget_vertex:OU,normal_fragment_begin:RU,normal_fragment_maps:LU,normal_pars_fragment:VU,normal_pars_vertex:MU,normal_vertex:kU,normalmap_pars_fragment:BU,clearcoat_normal_fragment_begin:IU,clearcoat_normal_fragment_maps:CU,clearcoat_pars_fragment:zU,iridescence_pars_fragment:_U,opaque_fragment:AU,packing:wU,premultiplied_alpha_fragment:PU,project_vertex:TU,dithering_fragment:SU,dithering_pars_fragment:jU,roughnessmap_fragment:vU,roughnessmap_pars_fragment:yU,shadowmap_pars_fragment:fU,shadowmap_pars_vertex:hU,shadowmap_vertex:bU,shadowmask_pars_fragment:xU,skinbase_vertex:gU,skinning_pars_vertex:pU,skinning_vertex:mU,skinnormal_vertex:lU,specularmap_fragment:dU,specularmap_pars_fragment:uU,tonemapping_fragment:cU,tonemapping_pars_fragment:nU,transmission_fragment:sU,transmission_pars_fragment:iU,uv_pars_fragment:oU,uv_pars_vertex:aU,uv_vertex:rU,worldpos_vertex:tU,background_vert:eU,background_frag:JH,backgroundCube_vert:QH,backgroundCube_frag:ZH,cube_vert:KH,cube_frag:$H,depth_vert:XH,depth_frag:YH,distance_vert:WH,distance_frag:UH,equirect_vert:HH,equirect_frag:GH,linedashed_vert:NH,linedashed_frag:EH,meshbasic_vert:FH,meshbasic_frag:qH,meshlambert_vert:DH,meshlambert_frag:OH,meshmatcap_vert:RH,meshmatcap_frag:LH,meshnormal_vert:VH,meshnormal_frag:MH,meshphong_vert:kH,meshphong_frag:BH,meshphysical_vert:IH,meshphysical_frag:CH,meshtoon_vert:zH,meshtoon_frag:_H,points_vert:AH,points_frag:wH,shadow_vert:PH,shadow_frag:TH,sprite_vert:SH,sprite_frag:jH},N0={common:{diffuse:{value:new x0(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new f0},alphaMap:{value:null},alphaMapTransform:{value:new f0},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new f0}},envmap:{envMap:{value:null},envMapRotation:{value:new f0},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new f0}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new f0}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new f0},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new f0},normalScale:{value:new v0(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new f0},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new f0}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new f0}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new f0}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new x0(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new h},probesMax:{value:new h},probesResolution:{value:new h}},points:{diffuse:{value:new x0(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new f0},alphaTest:{value:0},uvTransform:{value:new f0}},sprite:{diffuse:{value:new x0(16777215)},opacity:{value:1},center:{value:new v0(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new f0},alphaMap:{value:null},alphaMapTransform:{value:new f0},alphaTest:{value:0}}},_9={basic:{uniforms:pJ([N0.common,N0.specularmap,N0.envmap,N0.aomap,N0.lightmap,N0.fog]),vertexShader:p0.meshbasic_vert,fragmentShader:p0.meshbasic_frag},lambert:{uniforms:pJ([N0.common,N0.specularmap,N0.envmap,N0.aomap,N0.lightmap,N0.emissivemap,N0.bumpmap,N0.normalmap,N0.displacementmap,N0.fog,N0.lights,{emissive:{value:new x0(0)},envMapIntensity:{value:1}}]),vertexShader:p0.meshlambert_vert,fragmentShader:p0.meshlambert_frag},phong:{uniforms:pJ([N0.common,N0.specularmap,N0.envmap,N0.aomap,N0.lightmap,N0.emissivemap,N0.bumpmap,N0.normalmap,N0.displacementmap,N0.fog,N0.lights,{emissive:{value:new x0(0)},specular:{value:new x0(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:p0.meshphong_vert,fragmentShader:p0.meshphong_frag},standard:{uniforms:pJ([N0.common,N0.envmap,N0.aomap,N0.lightmap,N0.emissivemap,N0.bumpmap,N0.normalmap,N0.displacementmap,N0.roughnessmap,N0.metalnessmap,N0.fog,N0.lights,{emissive:{value:new x0(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:p0.meshphysical_vert,fragmentShader:p0.meshphysical_frag},toon:{uniforms:pJ([N0.common,N0.aomap,N0.lightmap,N0.emissivemap,N0.bumpmap,N0.normalmap,N0.displacementmap,N0.gradientmap,N0.fog,N0.lights,{emissive:{value:new x0(0)}}]),vertexShader:p0.meshtoon_vert,fragmentShader:p0.meshtoon_frag},matcap:{uniforms:pJ([N0.common,N0.bumpmap,N0.normalmap,N0.displacementmap,N0.fog,{matcap:{value:null}}]),vertexShader:p0.meshmatcap_vert,fragmentShader:p0.meshmatcap_frag},points:{uniforms:pJ([N0.points,N0.fog]),vertexShader:p0.points_vert,fragmentShader:p0.points_frag},dashed:{uniforms:pJ([N0.common,N0.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:p0.linedashed_vert,fragmentShader:p0.linedashed_frag},depth:{uniforms:pJ([N0.common,N0.displacementmap]),vertexShader:p0.depth_vert,fragmentShader:p0.depth_frag},normal:{uniforms:pJ([N0.common,N0.bumpmap,N0.normalmap,N0.displacementmap,{opacity:{value:1}}]),vertexShader:p0.meshnormal_vert,fragmentShader:p0.meshnormal_frag},sprite:{uniforms:pJ([N0.sprite,N0.fog]),vertexShader:p0.sprite_vert,fragmentShader:p0.sprite_frag},background:{uniforms:{uvTransform:{value:new f0},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:p0.background_vert,fragmentShader:p0.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new f0}},vertexShader:p0.backgroundCube_vert,fragmentShader:p0.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:p0.cube_vert,fragmentShader:p0.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:p0.equirect_vert,fragmentShader:p0.equirect_frag},distance:{uniforms:pJ([N0.common,N0.displacementmap,{referencePosition:{value:new h},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:p0.distance_vert,fragmentShader:p0.distance_frag},shadow:{uniforms:pJ([N0.lights,N0.fog,{color:{value:new x0(0)},opacity:{value:1}}]),vertexShader:p0.shadow_vert,fragmentShader:p0.shadow_frag}};_9.physical={uniforms:pJ([_9.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new f0},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new f0},clearcoatNormalScale:{value:new v0(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new f0},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new f0},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new f0},sheen:{value:0},sheenColor:{value:new x0(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new f0},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new f0},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new f0},transmissionSamplerSize:{value:new v0},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new f0},attenuationDistance:{value:0},attenuationColor:{value:new x0(0)},specularColor:{value:new x0(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new f0},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new f0},anisotropyVector:{value:new v0},anisotropyMap:{value:null},anisotropyMapTransform:{value:new f0}}]),vertexShader:p0.meshphysical_vert,fragmentShader:p0.meshphysical_frag};var s6={r:0,b:0,g:0},vH=new KJ,bX=new f0;bX.set(-1,0,0,0,1,0,0,0,1);function yH(J,Q,Z,K,$,X){let Y=new x0(0),W=$===!0?0:1,U,H,N=null,F=0,G=null;function D(z){let w=z.isScene===!0?z.background:null;if(w&&w.isTexture){let k=z.backgroundBlurriness>0;w=Q.get(w,k)}return w}function R(z){let w=!1,k=D(z);if(k===null)q(Y,W);else if(k&&k.isColor)q(k,1),w=!0;let C=J.xr.getEnvironmentBlendMode();if(C==="additive")Z.buffers.color.setClear(0,0,0,1,X);else if(C==="alpha-blend")Z.buffers.color.setClear(0,0,0,0,X);if(J.autoClear||w)Z.buffers.depth.setTest(!0),Z.buffers.depth.setMask(!0),Z.buffers.color.setMask(!0),J.clear(J.autoClearColor,J.autoClearDepth,J.autoClearStencil)}function B(z,w){let k=D(w);if(k&&(k.isCubeTexture||k.mapping===_7)){if(H===void 0)H=new b0(new cJ(1,1,1),new U9({name:"BackgroundCubeMaterial",uniforms:A8(_9.backgroundCube.uniforms),vertexShader:_9.backgroundCube.vertexShader,fragmentShader:_9.backgroundCube.fragmentShader,side:oJ,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),H.geometry.deleteAttribute("normal"),H.geometry.deleteAttribute("uv"),H.onBeforeRender=function(C,_,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(H.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),K.update(H);if(H.material.uniforms.envMap.value=k,H.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,H.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,H.material.uniforms.backgroundRotation.value.setFromMatrix4(vH.makeRotationFromEuler(w.backgroundRotation)).transpose(),k.isCubeTexture&&k.isRenderTargetTexture===!1)H.material.uniforms.backgroundRotation.value.premultiply(bX);if(H.material.toneMapped=u0.getTransfer(k.colorSpace)!==UJ,N!==k||F!==k.version||G!==J.toneMapping)H.material.needsUpdate=!0,N=k,F=k.version,G=J.toneMapping;H.layers.enableAll(),z.unshift(H,H.geometry,H.material,0,0,null)}else if(k&&k.isTexture){if(U===void 0)U=new b0(new $9(2,2),new U9({name:"BackgroundMaterial",uniforms:A8(_9.background.uniforms),vertexShader:_9.background.vertexShader,fragmentShader:_9.background.fragmentShader,side:Z7,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),U.geometry.deleteAttribute("normal"),Object.defineProperty(U.material,"map",{get:function(){return this.uniforms.t2D.value}}),K.update(U);if(U.material.uniforms.t2D.value=k,U.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,U.material.toneMapped=u0.getTransfer(k.colorSpace)!==UJ,k.matrixAutoUpdate===!0)k.updateMatrix();if(U.material.uniforms.uvTransform.value.copy(k.matrix),N!==k||F!==k.version||G!==J.toneMapping)U.material.needsUpdate=!0,N=k,F=k.version,G=J.toneMapping;U.layers.enableAll(),z.unshift(U,U.geometry,U.material,0,0,null)}}function q(z,w){z.getRGB(s6,yZ(J)),Z.buffers.color.setClear(s6.r,s6.g,s6.b,w,X)}function E(){if(H!==void 0)H.geometry.dispose(),H.material.dispose(),H=void 0;if(U!==void 0)U.geometry.dispose(),U.material.dispose(),U=void 0}return{getClearColor:function(){return Y},setClearColor:function(z,w=1){Y.set(z),W=w,q(Y,W)},getClearAlpha:function(){return W},setClearAlpha:function(z){W=z,q(Y,W)},render:R,addToRenderList:B,dispose:E}}function fH(J,Q){let Z=J.getParameter(J.MAX_VERTEX_ATTRIBS),K={},$=G(null),X=$,Y=!1;function W(P,f,u,T,p){let o=!1,m=F(P,T,u,f);if(X!==m)X=m,H(X.object);if(o=D(P,T,u,p),o)R(P,T,u,p);if(p!==null)Q.update(p,J.ELEMENT_ARRAY_BUFFER);if(o||Y){if(Y=!1,k(P,f,u,T),p!==null)J.bindBuffer(J.ELEMENT_ARRAY_BUFFER,Q.get(p).buffer)}}function U(){return J.createVertexArray()}function H(P){return J.bindVertexArray(P)}function N(P){return J.deleteVertexArray(P)}function F(P,f,u,T){let p=T.wireframe===!0,o=K[f.id];if(o===void 0)o={},K[f.id]=o;let m=P.isInstancedMesh===!0?P.id:0,Q0=o[m];if(Q0===void 0)Q0={},o[m]=Q0;let n=Q0[u.id];if(n===void 0)n={},Q0[u.id]=n;let r=n[p];if(r===void 0)r=G(U()),n[p]=r;return r}function G(P){let f=[],u=[],T=[];for(let p=0;p<Z;p++)f[p]=0,u[p]=0,T[p]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:f,enabledAttributes:u,attributeDivisors:T,object:P,attributes:{},index:null}}function D(P,f,u,T){let p=X.attributes,o=f.attributes,m=0,Q0=u.getAttributes();for(let n in Q0)if(Q0[n].location>=0){let J0=p[n],T0=o[n];if(T0===void 0){if(n==="instanceMatrix"&&P.instanceMatrix)T0=P.instanceMatrix;if(n==="instanceColor"&&P.instanceColor)T0=P.instanceColor}if(J0===void 0)return!0;if(J0.attribute!==T0)return!0;if(T0&&J0.data!==T0.data)return!0;m++}if(X.attributesNum!==m)return!0;if(X.index!==T)return!0;return!1}function R(P,f,u,T){let p={},o=f.attributes,m=0,Q0=u.getAttributes();for(let n in Q0)if(Q0[n].location>=0){let J0=o[n];if(J0===void 0){if(n==="instanceMatrix"&&P.instanceMatrix)J0=P.instanceMatrix;if(n==="instanceColor"&&P.instanceColor)J0=P.instanceColor}let T0={};if(T0.attribute=J0,J0&&J0.data)T0.data=J0.data;p[n]=T0,m++}X.attributes=p,X.attributesNum=m,X.index=T}function B(){let P=X.newAttributes;for(let f=0,u=P.length;f<u;f++)P[f]=0}function q(P){E(P,0)}function E(P,f){let{newAttributes:u,enabledAttributes:T,attributeDivisors:p}=X;if(u[P]=1,T[P]===0)J.enableVertexAttribArray(P),T[P]=1;if(p[P]!==f)J.vertexAttribDivisor(P,f),p[P]=f}function z(){let{newAttributes:P,enabledAttributes:f}=X;for(let u=0,T=f.length;u<T;u++)if(f[u]!==P[u])J.disableVertexAttribArray(u),f[u]=0}function w(P,f,u,T,p,o,m){if(m===!0)J.vertexAttribIPointer(P,f,u,p,o);else J.vertexAttribPointer(P,f,u,T,p,o)}function k(P,f,u,T){B();let p=T.attributes,o=u.getAttributes(),m=f.defaultAttributeValues;for(let Q0 in o){let n=o[Q0];if(n.location>=0){let r=p[Q0];if(r===void 0){if(Q0==="instanceMatrix"&&P.instanceMatrix)r=P.instanceMatrix;if(Q0==="instanceColor"&&P.instanceColor)r=P.instanceColor}if(r!==void 0){let{normalized:J0,itemSize:T0}=r,_0=Q.get(r);if(_0===void 0)continue;let{buffer:HJ,type:m0,bytesPerElement:s}=_0,Z0=m0===J.INT||m0===J.UNSIGNED_INT||r.gpuType===lQ;if(r.isInterleavedBufferAttribute){let $0=r.data,A0=$0.stride,S0=r.offset;if($0.isInstancedInterleavedBuffer){for(let C0=0;C0<n.locationSize;C0++)E(n.location+C0,$0.meshPerAttribute);if(P.isInstancedMesh!==!0&&T._maxInstanceCount===void 0)T._maxInstanceCount=$0.meshPerAttribute*$0.count}else for(let C0=0;C0<n.locationSize;C0++)q(n.location+C0);J.bindBuffer(J.ARRAY_BUFFER,HJ);for(let C0=0;C0<n.locationSize;C0++)w(n.location+C0,T0/n.locationSize,m0,J0,A0*s,(S0+T0/n.locationSize*C0)*s,Z0)}else{if(r.isInstancedBufferAttribute){for(let $0=0;$0<n.locationSize;$0++)E(n.location+$0,r.meshPerAttribute);if(P.isInstancedMesh!==!0&&T._maxInstanceCount===void 0)T._maxInstanceCount=r.meshPerAttribute*r.count}else for(let $0=0;$0<n.locationSize;$0++)q(n.location+$0);J.bindBuffer(J.ARRAY_BUFFER,HJ);for(let $0=0;$0<n.locationSize;$0++)w(n.location+$0,T0/n.locationSize,m0,J0,T0*s,T0/n.locationSize*$0*s,Z0)}}else if(m!==void 0){let J0=m[Q0];if(J0!==void 0)switch(J0.length){case 2:J.vertexAttrib2fv(n.location,J0);break;case 3:J.vertexAttrib3fv(n.location,J0);break;case 4:J.vertexAttrib4fv(n.location,J0);break;default:J.vertexAttrib1fv(n.location,J0)}}}}z()}function C(){V();for(let P in K){let f=K[P];for(let u in f){let T=f[u];for(let p in T){let o=T[p];for(let m in o)N(o[m].object),delete o[m];delete T[p]}}delete K[P]}}function _(P){if(K[P.id]===void 0)return;let f=K[P.id];for(let u in f){let T=f[u];for(let p in T){let o=T[p];for(let m in o)N(o[m].object),delete o[m];delete T[p]}}delete K[P.id]}function A(P){for(let f in K){let u=K[f];for(let T in u){let p=u[T];if(p[P.id]===void 0)continue;let o=p[P.id];for(let m in o)N(o[m].object),delete o[m];delete p[P.id]}}}function O(P){for(let f in K){let u=K[f],T=P.isInstancedMesh===!0?P.id:0,p=u[T];if(p===void 0)continue;for(let o in p){let m=p[o];for(let Q0 in m)N(m[Q0].object),delete m[Q0];delete p[o]}if(delete u[T],Object.keys(u).length===0)delete K[f]}}function V(){if(b(),Y=!0,X===$)return;X=$,H(X.object)}function b(){$.geometry=null,$.program=null,$.wireframe=!1}return{setup:W,reset:V,resetDefaultState:b,dispose:C,releaseStatesOfGeometry:_,releaseStatesOfObject:O,releaseStatesOfProgram:A,initAttributes:B,enableAttribute:q,disableUnusedAttributes:z}}function hH(J,Q,Z){let K;function $(U){K=U}function X(U,H){J.drawArrays(K,U,H),Z.update(H,K,1)}function Y(U,H,N){if(N===0)return;J.drawArraysInstanced(K,U,H,N),Z.update(H,K,N)}function W(U,H,N){if(N===0)return;Q.get("WEBGL_multi_draw").multiDrawArraysWEBGL(K,U,0,H,0,N);let G=0;for(let D=0;D<N;D++)G+=H[D];Z.update(G,K,1)}this.setMode=$,this.render=X,this.renderInstances=Y,this.renderMultiDraw=W}function bH(J,Q,Z,K){let $;function X(){if($!==void 0)return $;if(Q.has("EXT_texture_filter_anisotropic")===!0){let A=Q.get("EXT_texture_filter_anisotropic");$=J.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else $=0;return $}function Y(A){if(A!==I9&&K.convert(A)!==J.getParameter(J.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function W(A){let O=A===B9&&(Q.has("EXT_color_buffer_half_float")||Q.has("EXT_color_buffer_float"));if(A!==q9&&A!==m9&&!O&&K.convert(A)!==J.getParameter(J.IMPLEMENTATION_COLOR_READ_TYPE))return!1;return!0}function U(A){if(A==="highp"){if(J.getShaderPrecisionFormat(J.VERTEX_SHADER,J.HIGH_FLOAT).precision>0&&J.getShaderPrecisionFormat(J.FRAGMENT_SHADER,J.HIGH_FLOAT).precision>0)return"highp";A="mediump"}if(A==="mediump"){if(J.getShaderPrecisionFormat(J.VERTEX_SHADER,J.MEDIUM_FLOAT).precision>0&&J.getShaderPrecisionFormat(J.FRAGMENT_SHADER,J.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let H=Z.precision!==void 0?Z.precision:"highp",N=U(H);if(N!==H)j0("WebGLRenderer:",H,"not supported, using",N,"instead."),H=N;let F=Z.logarithmicDepthBuffer===!0,G=Z.reversedDepthBuffer===!0&&Q.has("EXT_clip_control");if(Z.reversedDepthBuffer===!0&&G===!1)j0("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let D=J.getParameter(J.MAX_TEXTURE_IMAGE_UNITS),R=J.getParameter(J.MAX_VERTEX_TEXTURE_IMAGE_UNITS),B=J.getParameter(J.MAX_TEXTURE_SIZE),q=J.getParameter(J.MAX_CUBE_MAP_TEXTURE_SIZE),E=J.getParameter(J.MAX_VERTEX_ATTRIBS),z=J.getParameter(J.MAX_VERTEX_UNIFORM_VECTORS),w=J.getParameter(J.MAX_VARYING_VECTORS),k=J.getParameter(J.MAX_FRAGMENT_UNIFORM_VECTORS),C=J.getParameter(J.MAX_SAMPLES),_=J.getParameter(J.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:X,getMaxPrecision:U,textureFormatReadable:Y,textureTypeReadable:W,precision:H,logarithmicDepthBuffer:F,reversedDepthBuffer:G,maxTextures:D,maxVertexTextures:R,maxTextureSize:B,maxCubemapSize:q,maxAttributes:E,maxVertexUniforms:z,maxVaryings:w,maxFragmentUniforms:k,maxSamples:C,samples:_}}function xH(J){let Q=this,Z=null,K=0,$=!1,X=!1,Y=new W9,W=new f0,U={value:null,needsUpdate:!1};this.uniform=U,this.numPlanes=0,this.numIntersection=0,this.init=function(F,G){let D=F.length!==0||G||K!==0||$;return $=G,K=F.length,D},this.beginShadows=function(){X=!0,N(null)},this.endShadows=function(){X=!1},this.setGlobalState=function(F,G){Z=N(F,G,0)},this.setState=function(F,G,D){let{clippingPlanes:R,clipIntersection:B,clipShadows:q}=F,E=J.get(F);if(!$||R===null||R.length===0||X&&!q)if(X)N(null);else H();else{let z=X?0:K,w=z*4,k=E.clippingState||null;U.value=k,k=N(R,G,w,D);for(let C=0;C!==w;++C)k[C]=Z[C];E.clippingState=k,this.numIntersection=B?this.numPlanes:0,this.numPlanes+=z}};function H(){if(U.value!==Z)U.value=Z,U.needsUpdate=K>0;Q.numPlanes=K,Q.numIntersection=0}function N(F,G,D,R){let B=F!==null?F.length:0,q=null;if(B!==0){if(q=U.value,R!==!0||q===null){let E=D+B*4,z=G.matrixWorldInverse;if(W.getNormalMatrix(z),q===null||q.length<E)q=new Float32Array(E);for(let w=0,k=D;w!==B;++w,k+=4)Y.copy(F[w]).applyMatrix4(z,W),Y.normal.toArray(q,k),q[k+3]=Y.constant}U.value=q,U.needsUpdate=!0}return Q.numPlanes=B,Q.numIntersection=0,q}}var W7=4,gH=6,pH=20,mH=256,x7=new b7,DX=new x0,JK=null,QK=0,ZK=0,KK=!1,lH=new h,S8=new h;class YK{constructor(J){this._renderer=J,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(J,Q=0,Z=0.1,K=100,$={}){let{size:X=256,position:Y=lH}=$;JK=this._renderer.getRenderTarget(),QK=this._renderer.getActiveCubeFace(),ZK=this._renderer.getActiveMipmapLevel(),KK=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(X);let W=this._allocateTargets();if(W.depthBuffer=!0,this._sceneToCubeUV(J,Z,K,W,Y),Q>0)this._blur(W,0,0,Q);return this._applyPMREM(W),this._cleanup(W),W}fromEquirectangular(J,Q=null){return this._fromTexture(J,Q)}fromCubemap(J,Q=null){return this._fromTexture(J,Q)}compileCubemapShader(){if(this._cubemapMaterial===null)this._cubemapMaterial=LX(),this._compileMaterial(this._cubemapMaterial)}compileEquirectangularShader(){if(this._equirectMaterial===null)this._equirectMaterial=RX(),this._compileMaterial(this._equirectMaterial)}dispose(){if(this._dispose(),this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose();if(this._backgroundBox!==null)this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose()}_setSize(J){this._lodMax=Math.floor(Math.log2(J)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._ggxMaterial!==null)this._ggxMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let J=0;J<this._lodMeshes.length;J++)this._lodMeshes[J].geometry.dispose()}_cleanup(J){this._renderer.setRenderTarget(JK,QK,ZK),this._renderer.xr.enabled=KK,J.scissorTest=!1,Y7(J,0,0,J.width,J.height)}_fromTexture(J,Q){if(J.mapping===$7||J.mapping===L8)this._setSize(J.image.length===0?16:J.image[0].width||J.image[0].image.width);else this._setSize(J.image.width/4);JK=this._renderer.getRenderTarget(),QK=this._renderer.getActiveCubeFace(),ZK=this._renderer.getActiveMipmapLevel(),KK=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let Z=Q||this._allocateTargets();return this._textureToCubeUV(J,Z),this._applyPMREM(Z),this._cleanup(Z),Z}_allocateTargets(){let J=3*Math.max(this._cubeSize,112),Q=4*this._cubeSize,Z={magFilter:xJ,minFilter:xJ,generateMipmaps:!1,type:B9,format:I9,colorSpace:zZ,depthBuffer:!1},K=OX(J,Q,Z);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==J||this._pingPongRenderTarget.height!==Q){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=OX(J,Q,Z);let{_lodMax:$}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=dH($)),this._blurMaterial=cH($,J,Q),this._ggxMaterial=uH($,J,Q)}return K}_compileMaterial(J){let Q=new b0(new dJ,J);this._renderer.compile(Q,x7)}_sceneToCubeUV(J,Q,Z,K,$){let W=new bJ(90,1,Q,Z),U=[1,-1,1,1,1,1],H=[1,1,1,-1,-1,-1],N=this._renderer,F=N.autoClear,G=N.toneMapping;if(N.getClearColor(DX),N.toneMapping=F9,N.autoClear=!1,N.state.buffers.depth.getReversed())N.setRenderTarget(K),N.clearDepth(),N.setRenderTarget(null);if(this._backgroundBox===null)this._backgroundBox=new b0(new cJ,new gJ({name:"PMREM.Background",side:oJ,depthWrite:!1,depthTest:!1}));let R=this._backgroundBox,B=R.material,q=!1,E=J.background;if(E){if(E.isColor)B.color.copy(E),J.background=null,q=!0}else B.color.copy(DX),q=!0;for(let z=0;z<6;z++){let w=z%3;if(w===0)W.up.set(0,U[z],0),W.position.set($.x,$.y,$.z),W.lookAt($.x+H[z],$.y,$.z);else if(w===1)W.up.set(0,0,U[z]),W.position.set($.x,$.y,$.z),W.lookAt($.x,$.y+H[z],$.z);else W.up.set(0,U[z],0),W.position.set($.x,$.y,$.z),W.lookAt($.x,$.y,$.z+H[z]);let k=this._cubeSize;if(Y7(K,w*k,z>2?k:0,k,k),N.setRenderTarget(K),q)N.render(R,W);N.render(J,W)}N.toneMapping=G,N.autoClear=F,J.background=E}_textureToCubeUV(J,Q){let Z=this._renderer,K=J.mapping===$7||J.mapping===L8;if(K){if(this._cubemapMaterial===null)this._cubemapMaterial=LX();this._cubemapMaterial.uniforms.flipEnvMap.value=J.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=RX();let $=K?this._cubemapMaterial:this._equirectMaterial,X=this._lodMeshes[0];X.material=$;let Y=$.uniforms;Y.envMap.value=J;let W=this._cubeSize;Y7(Q,0,0,3*W,2*W),Z.setRenderTarget(Q),Z.render(X,x7)}_applyPMREM(J){let Q=this._renderer,Z=Q.autoClear;Q.autoClear=!1;let K=this._lodMeshes.length;for(let $=1;$<K;$++)this._applyGGXFilter(J,$-1,$);Q.autoClear=Z}_applyGGXFilter(J,Q,Z){let K=this._renderer,$=this._pingPongRenderTarget,X=this._ggxMaterial,Y=this._lodMeshes[Z];Y.material=X;let W=X.uniforms,U=Z/(this._lodMeshes.length-1),H=Q/(this._lodMeshes.length-1),N=Math.sqrt(U*U-H*H),F=U*1.25,G=N*F,{_lodMax:D}=this,R=this._sizeLods[Z],B=3*R*(Z>D-W7?Z-D+W7:0),q=4*(this._cubeSize-R);W.envMap.value=J.texture,W.roughness.value=G,W.mipInt.value=D-Q,Y7($,B,q,3*R,2*R),K.setRenderTarget($),K.render(Y,x7),W.envMap.value=$.texture,W.roughness.value=0,W.mipInt.value=D-Z,Y7(J,B,q,3*R,2*R),K.setRenderTarget(J),K.render(Y,x7)}_blur(J,Q,Z,K){let $=this._pingPongRenderTarget,X=Math.min(K,Math.PI)/Math.SQRT2;this._blurPass(J,$,Q,Z,X),this._blurPass($,J,Z,Z,X)}_blurPass(J,Q,Z,K,$){let X=this._renderer,Y=this._blurMaterial,W=this._lodMeshes[K];W.material=Y;let U=Y.uniforms;U.envMap.value=J.texture,U.sigma.value=$,U.mipInt.value=this._lodMax-Z;let H=this._sizeLods[K],N=3*H*(K>this._lodMax-W7?K-this._lodMax+W7:0),F=4*(this._cubeSize-H);Y7(Q,N,F,3*H,2*H),X.setRenderTarget(Q),X.render(W,x7)}}function dH(J){let Q=[],Z=[],K=J,$=J-W7+1+gH;for(let X=0;X<$;X++){let Y=Math.pow(2,K);Q.push(Y);let W=1/(Y-2),U=-W,H=1+W,N=[U,U,H,U,H,H,U,U,H,H,U,H],F=6,G=6,D=3,R=new Float32Array(D*G*F),B=new Float32Array(D*G*F);for(let E=0;E<F;E++){let z=E%3*2/3-1,w=E>2?0:-1,k=[z,w,0,z+0.6666666666666666,w,0,z+0.6666666666666666,w+1,0,z,w,0,z+0.6666666666666666,w+1,0,z,w+1,0];R.set(k,D*G*E);for(let C=0;C<G;C++){let _=N[C*2]*2-1,A=N[C*2+1]*2-1;if(E===0)S8.set(1,A,_);else if(E===1)S8.set(-_,1,-A);else if(E===2)S8.set(-_,A,1);else if(E===3)S8.set(-1,A,-_);else if(E===4)S8.set(-_,-1,A);else S8.set(_,A,-1);S8.toArray(B,(E*G+C)*D)}}let q=new dJ;if(q.setAttribute("position",new Z9(R,D)),q.setAttribute("outputDirection",new Z9(B,D)),Z.push(new b0(q,null)),K>W7)K--}return{lodMeshes:Z,sizeLods:Q}}function OX(J,Q,Z){let K=new K9(J,Q,Z);return K.texture.mapping=_7,K.texture.name="PMREM.cubeUv",K.scissorTest=!0,K}function Y7(J,Q,Z,K,$){J.viewport.set(Q,Z,K,$),J.scissor.set(Q,Z,K,$)}function uH(J,Q,Z){return new U9({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:mH,CUBEUV_TEXEL_WIDTH:1/Q,CUBEUV_TEXEL_HEIGHT:1/Z,CUBEUV_MAX_MIP:`${J}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:o6(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:M9,depthTest:!1,depthWrite:!1})}function cH(J,Q,Z){return new U9({name:"SphericalGaussianBlur",defines:{SAMPLES:pH,CUBEUV_TEXEL_WIDTH:1/Q,CUBEUV_TEXEL_HEIGHT:1/Z,CUBEUV_MAX_MIP:`${J}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:o6(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:M9,depthTest:!1,depthWrite:!1})}function RX(){return new U9({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:o6(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:M9,depthTest:!1,depthWrite:!1})}function LX(){return new U9({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:o6(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:M9,depthTest:!1,depthWrite:!1})}function o6(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class HK extends K9{constructor(J=1,Q={}){super(J,J,Q);this.isWebGLCubeRenderTarget=!0;let Z={width:J,height:J,depth:1},K=[Z,Z,Z,Z,Z,Z];this.texture=new b6(K),this._setTextureOptions(Q),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(J,Q){this.texture.type=Q.type,this.texture.colorSpace=Q.colorSpace,this.texture.generateMipmaps=Q.generateMipmaps,this.texture.minFilter=Q.minFilter,this.texture.magFilter=Q.magFilter;let Z={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},K=new cJ(5,5,5),$=new U9({name:"CubemapFromEquirect",uniforms:A8(Z.uniforms),vertexShader:Z.vertexShader,fragmentShader:Z.fragmentShader,side:oJ,blending:M9});$.uniforms.tEquirect.value=Q;let X=new b0(K,$),Y=Q.minFilter;if(Q.minFilter===V8)Q.minFilter=xJ;return new iZ(1,10,this).update(J,X),Q.minFilter=Y,X.geometry.dispose(),X.material.dispose(),this}clear(J,Q=!0,Z=!0,K=!0){let $=J.getRenderTarget();for(let X=0;X<6;X++)J.setRenderTarget(this,X),J.clear(Q,Z,K);J.setRenderTarget($)}}function nH(J){let Q=new WeakMap,Z=new WeakMap,K=null;function $(G,D=!1){if(G===null||G===void 0)return null;if(D)return Y(G);return X(G)}function X(G){if(G&&G.isTexture){let D=G.mapping;if(D===V6||D===M6)if(Q.has(G)){let R=Q.get(G).texture;return W(R,G.mapping)}else{let R=G.image;if(R&&R.height>0){let B=new HK(R.height);return B.fromEquirectangularTexture(J,G),Q.set(G,B),G.addEventListener("dispose",H),W(B.texture,G.mapping)}else return null}}return G}function Y(G){if(G&&G.isTexture){let D=G.mapping,R=D===V6||D===M6,B=D===$7||D===L8;if(R||B){let q=Z.get(G),E=q!==void 0?q.texture.pmremVersion:0;if(G.isRenderTargetTexture&&G.pmremVersion!==E){if(K===null)K=new YK(J);return q=R?K.fromEquirectangular(G,q):K.fromCubemap(G,q),q.texture.pmremVersion=G.pmremVersion,Z.set(G,q),q.texture}else if(q!==void 0)return q.texture;else{let z=G.image;if(R&&z&&z.height>0||B&&z&&U(z)){if(K===null)K=new YK(J);return q=R?K.fromEquirectangular(G):K.fromCubemap(G),q.texture.pmremVersion=G.pmremVersion,Z.set(G,q),G.addEventListener("dispose",N),q.texture}else return null}}}return G}function W(G,D){if(D===V6)G.mapping=$7;else if(D===M6)G.mapping=L8;return G}function U(G){let D=0,R=6;for(let B=0;B<R;B++)if(G[B]!==void 0)D++;return D===R}function H(G){let D=G.target;D.removeEventListener("dispose",H);let R=Q.get(D);if(R!==void 0)Q.delete(D),R.dispose()}function N(G){let D=G.target;D.removeEventListener("dispose",N);let R=Z.get(D);if(R!==void 0)Z.delete(D),R.dispose()}function F(){if(Q=new WeakMap,Z=new WeakMap,K!==null)K.dispose(),K=null}return{get:$,dispose:F}}function sH(J){let Q={};function Z(K){if(Q[K]!==void 0)return Q[K];let $=J.getExtension(K);return Q[K]=$,$}return{has:function(K){return Z(K)!==null},init:function(){Z("EXT_color_buffer_float"),Z("WEBGL_clip_cull_distance"),Z("OES_texture_float_linear"),Z("EXT_color_buffer_half_float"),Z("WEBGL_multisampled_render_to_texture"),Z("WEBGL_render_shared_exponent")},get:function(K){let $=Z(K);if($===null)D8("WebGLRenderer: "+K+" extension not supported.");return $}}}function iH(J,Q,Z,K){let $={},X=new WeakMap;function Y(F){let G=F.target;if(G.index!==null)Q.remove(G.index);for(let R in G.attributes)Q.remove(G.attributes[R]);G.removeEventListener("dispose",Y),delete $[G.id];let D=X.get(G);if(D)Q.remove(D),X.delete(G);if(K.releaseStatesOfGeometry(G),G.isInstancedBufferGeometry===!0)delete G._maxInstanceCount;Z.memory.geometries--}function W(F,G){if($[G.id]===!0)return G;return G.addEventListener("dispose",Y),$[G.id]=!0,Z.memory.geometries++,G}function U(F){let G=F.attributes;for(let D in G)Q.update(G[D],J.ARRAY_BUFFER)}function H(F){let G=[],D=F.index,R=F.attributes.position,B=0;if(R===void 0)return;if(D!==null){let z=D.array;B=D.version;for(let w=0,k=z.length;w<k;w+=3){let C=z[w+0],_=z[w+1],A=z[w+2];G.push(C,_,_,A,A,C)}}else{let z=R.array;B=R.version;for(let w=0,k=z.length/3-1;w<k;w+=3){let C=w+0,_=w+1,A=w+2;G.push(C,_,_,A,A,C)}}let q=new(R.count>=65535?y6:v6)(G,1);q.version=B;let E=X.get(F);if(E)Q.remove(E);X.set(F,q)}function N(F){let G=X.get(F);if(G){let D=F.index;if(D!==null){if(G.version<D.version)H(F)}}else H(F);return X.get(F)}return{get:W,update:U,getWireframeAttribute:N}}function oH(J,Q,Z){let K;function $(F){K=F}let X,Y;function W(F){X=F.type,Y=F.bytesPerElement}function U(F,G){J.drawElements(K,G,X,F*Y),Z.update(G,K,1)}function H(F,G,D){if(D===0)return;J.drawElementsInstanced(K,G,X,F*Y,D),Z.update(G,K,D)}function N(F,G,D){if(D===0)return;Q.get("WEBGL_multi_draw").multiDrawElementsWEBGL(K,G,0,X,F,0,D);let B=0;for(let q=0;q<D;q++)B+=G[q];Z.update(B,K,1)}this.setMode=$,this.setIndex=W,this.render=U,this.renderInstances=H,this.renderMultiDraw=N}function aH(J){let Q={geometries:0,textures:0},Z={frame:0,calls:0,triangles:0,points:0,lines:0};function K(X,Y,W){switch(Z.calls++,Y){case J.TRIANGLES:Z.triangles+=W*(X/3);break;case J.LINES:Z.lines+=W*(X/2);break;case J.LINE_STRIP:Z.lines+=W*(X-1);break;case J.LINE_LOOP:Z.lines+=W*X;break;case J.POINTS:Z.points+=W*X;break;default:P0("WebGLInfo: Unknown draw mode:",Y);break}}function $(){Z.calls=0,Z.triangles=0,Z.points=0,Z.lines=0}return{memory:Q,render:Z,programs:null,autoReset:!0,reset:$,update:K}}function rH(J,Q,Z){let K=new WeakMap,$=new OJ;function X(Y,W,U){let H=Y.morphTargetInfluences,N=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,F=N!==void 0?N.length:0,G=K.get(W);if(G===void 0||G.count!==F){let V=function(){A.dispose(),K.delete(W),W.removeEventListener("dispose",V)};if(G!==void 0)G.texture.dispose();let D=W.morphAttributes.position!==void 0,R=W.morphAttributes.normal!==void 0,B=W.morphAttributes.color!==void 0,q=W.morphAttributes.position||[],E=W.morphAttributes.normal||[],z=W.morphAttributes.color||[],w=0;if(D===!0)w=1;if(R===!0)w=2;if(B===!0)w=3;let k=W.attributes.position.count*w,C=1;if(k>Q.maxTextureSize)C=Math.ceil(k/Q.maxTextureSize),k=Q.maxTextureSize;let _=new Float32Array(k*C*4*F),A=new S6(_,k,C,F);A.type=m9,A.needsUpdate=!0;let O=w*4;for(let b=0;b<F;b++){let P=q[b],f=E[b],u=z[b],T=k*C*4*b;for(let p=0;p<P.count;p++){let o=p*O;if(D===!0)$.fromBufferAttribute(P,p),_[T+o+0]=$.x,_[T+o+1]=$.y,_[T+o+2]=$.z,_[T+o+3]=0;if(R===!0)$.fromBufferAttribute(f,p),_[T+o+4]=$.x,_[T+o+5]=$.y,_[T+o+6]=$.z,_[T+o+7]=0;if(B===!0)$.fromBufferAttribute(u,p),_[T+o+8]=$.x,_[T+o+9]=$.y,_[T+o+10]=$.z,_[T+o+11]=u.itemSize===4?$.w:1}}G={count:F,texture:A,size:new v0(k,C)},K.set(W,G),W.addEventListener("dispose",V)}if(Y.isInstancedMesh===!0&&Y.morphTexture!==null)U.getUniforms().setValue(J,"morphTexture",Y.morphTexture,Z);else{let D=0;for(let B=0;B<H.length;B++)D+=H[B];let R=W.morphTargetsRelative?1:1-D;U.getUniforms().setValue(J,"morphTargetBaseInfluence",R),U.getUniforms().setValue(J,"morphTargetInfluences",H)}U.getUniforms().setValue(J,"morphTargetsTexture",G.texture,Z),U.getUniforms().setValue(J,"morphTargetsTextureSize",G.size)}return{update:X}}function tH(J,Q,Z,K,$){let X=new WeakMap;function Y(H){let N=$.render.frame,F=H.geometry,G=Q.get(H,F);if(X.get(G)!==N)Q.update(G),X.set(G,N);if(H.isInstancedMesh){if(H.hasEventListener("dispose",U)===!1)H.addEventListener("dispose",U);if(X.get(H)!==N){if(Z.update(H.instanceMatrix,J.ARRAY_BUFFER),H.instanceColor!==null)Z.update(H.instanceColor,J.ARRAY_BUFFER);X.set(H,N)}}if(H.isSkinnedMesh){let D=H.skeleton;if(X.get(D)!==N)D.update(),X.set(D,N)}return G}function W(){X=new WeakMap}function U(H){let N=H.target;if(N.removeEventListener("dispose",U),K.releaseStatesOfObject(N),Z.remove(N.instanceMatrix),N.instanceColor!==null)Z.remove(N.instanceColor)}return{update:Y,dispose:W}}var eH={[hQ]:"LINEAR_TONE_MAPPING",[bQ]:"REINHARD_TONE_MAPPING",[xQ]:"CINEON_TONE_MAPPING",[z7]:"ACES_FILMIC_TONE_MAPPING",[pQ]:"AGX_TONE_MAPPING",[mQ]:"NEUTRAL_TONE_MAPPING",[gQ]:"CUSTOM_TONE_MAPPING"};function JG(J,Q,Z,K,$,X){let Y=new K9(Q,Z,{type:J,depthBuffer:$,stencilBuffer:X,samples:K?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),W=null,U=null,H=new dJ;H.setAttribute("position",new LJ([-1,3,0,-1,-1,0,3,-1,0],3)),H.setAttribute("uv",new LJ([0,2,0,0,2,0],2));let N=new fZ({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),F=new b0(H,N),G=new b7(-1,1,1,-1,0,1),D=null,R=null,B=!1,q,E=null,z=[],w=!1;this.setSize=function(k,C){if(Y.setSize(k,C),W!==null)W.setSize(k,C);if(U!==null)U.setSize(k,C);for(let _=0;_<z.length;_++){let A=z[_];if(A.setSize)A.setSize(k,C)}},this.setEffects=function(k){z=k,w=z.length>0&&z[0].isRenderPass===!0;let{width:C,height:_}=Y;if(z.length>0&&W===null)W=new K9(C,_,{type:B9,depthBuffer:!1,stencilBuffer:!1}),U=new K9(C,_,{type:B9,depthBuffer:!1,stencilBuffer:!1});for(let A=0;A<z.length;A++){let O=z[A];if(O.setSize)O.setSize(C,_)}},this.begin=function(k,C){if(B)return!1;if(k.toneMapping===F9&&z.length===0)return!1;if(E=C,C!==null){let{width:_,height:A}=C;if(Y.width!==_||Y.height!==A)this.setSize(_,A)}if(w===!1)k.setRenderTarget(Y);return q=k.toneMapping,k.toneMapping=F9,!0},this.hasRenderPass=function(){return w},this.end=function(k,C){k.toneMapping=q,B=!0;let _=Y,A=W;for(let O=0;O<z.length;O++){let V=z[O];if(V.enabled===!1)continue;if(V.render(k,A,_,C),V.needsSwap!==!1)_=A,A=A===W?U:W}if(D!==k.outputColorSpace||R!==k.toneMapping){if(D=k.outputColorSpace,R=k.toneMapping,N.defines={},u0.getTransfer(D)===UJ)N.defines.SRGB_TRANSFER="";let O=eH[R];if(O)N.defines[O]="";N.needsUpdate=!0}N.uniforms.tDiffuse.value=_.texture,k.setRenderTarget(E),k.render(F,G),E=null,B=!1},this.isCompositing=function(){return B},this.dispose=function(){if(Y.dispose(),W!==null)W.dispose();if(U!==null)U.dispose();H.dispose(),N.dispose()}}var xX=new vJ,WK=new z8(1,1),gX=new S6,pX=new SZ,mX=new b6,VX=[],MX=[],kX=new Float32Array(16),BX=new Float32Array(9),IX=new Float32Array(4);function U7(J,Q,Z){let K=J[0];if(K<=0||K>0)return J;let $=Q*Z,X=VX[$];if(X===void 0)X=new Float32Array($),VX[$]=X;if(Q!==0){K.toArray(X,0);for(let Y=1,W=0;Y!==Q;++Y)W+=Z,J[Y].toArray(X,W)}return X}function wJ(J,Q){if(J.length!==Q.length)return!1;for(let Z=0,K=J.length;Z<K;Z++)if(J[Z]!==Q[Z])return!1;return!0}function PJ(J,Q){for(let Z=0,K=Q.length;Z<K;Z++)J[Z]=Q[Z]}function a6(J,Q){let Z=MX[Q];if(Z===void 0)Z=new Int32Array(Q),MX[Q]=Z;for(let K=0;K!==Q;++K)Z[K]=J.allocateTextureUnit();return Z}function QG(J,Q){let Z=this.cache;if(Z[0]===Q)return;J.uniform1f(this.addr,Q),Z[0]=Q}function ZG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y)J.uniform2f(this.addr,Q.x,Q.y),Z[0]=Q.x,Z[1]=Q.y}else{if(wJ(Z,Q))return;J.uniform2fv(this.addr,Q),PJ(Z,Q)}}function KG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y||Z[2]!==Q.z)J.uniform3f(this.addr,Q.x,Q.y,Q.z),Z[0]=Q.x,Z[1]=Q.y,Z[2]=Q.z}else if(Q.r!==void 0){if(Z[0]!==Q.r||Z[1]!==Q.g||Z[2]!==Q.b)J.uniform3f(this.addr,Q.r,Q.g,Q.b),Z[0]=Q.r,Z[1]=Q.g,Z[2]=Q.b}else{if(wJ(Z,Q))return;J.uniform3fv(this.addr,Q),PJ(Z,Q)}}function $G(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y||Z[2]!==Q.z||Z[3]!==Q.w)J.uniform4f(this.addr,Q.x,Q.y,Q.z,Q.w),Z[0]=Q.x,Z[1]=Q.y,Z[2]=Q.z,Z[3]=Q.w}else{if(wJ(Z,Q))return;J.uniform4fv(this.addr,Q),PJ(Z,Q)}}function XG(J,Q){let Z=this.cache,K=Q.elements;if(K===void 0){if(wJ(Z,Q))return;J.uniformMatrix2fv(this.addr,!1,Q),PJ(Z,Q)}else{if(wJ(Z,K))return;IX.set(K),J.uniformMatrix2fv(this.addr,!1,IX),PJ(Z,K)}}function YG(J,Q){let Z=this.cache,K=Q.elements;if(K===void 0){if(wJ(Z,Q))return;J.uniformMatrix3fv(this.addr,!1,Q),PJ(Z,Q)}else{if(wJ(Z,K))return;BX.set(K),J.uniformMatrix3fv(this.addr,!1,BX),PJ(Z,K)}}function WG(J,Q){let Z=this.cache,K=Q.elements;if(K===void 0){if(wJ(Z,Q))return;J.uniformMatrix4fv(this.addr,!1,Q),PJ(Z,Q)}else{if(wJ(Z,K))return;kX.set(K),J.uniformMatrix4fv(this.addr,!1,kX),PJ(Z,K)}}function UG(J,Q){let Z=this.cache;if(Z[0]===Q)return;J.uniform1i(this.addr,Q),Z[0]=Q}function HG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y)J.uniform2i(this.addr,Q.x,Q.y),Z[0]=Q.x,Z[1]=Q.y}else{if(wJ(Z,Q))return;J.uniform2iv(this.addr,Q),PJ(Z,Q)}}function GG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y||Z[2]!==Q.z)J.uniform3i(this.addr,Q.x,Q.y,Q.z),Z[0]=Q.x,Z[1]=Q.y,Z[2]=Q.z}else{if(wJ(Z,Q))return;J.uniform3iv(this.addr,Q),PJ(Z,Q)}}function NG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y||Z[2]!==Q.z||Z[3]!==Q.w)J.uniform4i(this.addr,Q.x,Q.y,Q.z,Q.w),Z[0]=Q.x,Z[1]=Q.y,Z[2]=Q.z,Z[3]=Q.w}else{if(wJ(Z,Q))return;J.uniform4iv(this.addr,Q),PJ(Z,Q)}}function EG(J,Q){let Z=this.cache;if(Z[0]===Q)return;J.uniform1ui(this.addr,Q),Z[0]=Q}function FG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y)J.uniform2ui(this.addr,Q.x,Q.y),Z[0]=Q.x,Z[1]=Q.y}else{if(wJ(Z,Q))return;J.uniform2uiv(this.addr,Q),PJ(Z,Q)}}function qG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y||Z[2]!==Q.z)J.uniform3ui(this.addr,Q.x,Q.y,Q.z),Z[0]=Q.x,Z[1]=Q.y,Z[2]=Q.z}else{if(wJ(Z,Q))return;J.uniform3uiv(this.addr,Q),PJ(Z,Q)}}function DG(J,Q){let Z=this.cache;if(Q.x!==void 0){if(Z[0]!==Q.x||Z[1]!==Q.y||Z[2]!==Q.z||Z[3]!==Q.w)J.uniform4ui(this.addr,Q.x,Q.y,Q.z,Q.w),Z[0]=Q.x,Z[1]=Q.y,Z[2]=Q.z,Z[3]=Q.w}else{if(wJ(Z,Q))return;J.uniform4uiv(this.addr,Q),PJ(Z,Q)}}function OG(J,Q,Z){let K=this.cache,$=Z.allocateTextureUnit();if(K[0]!==$)J.uniform1i(this.addr,$),K[0]=$;let X;if(this.type===J.SAMPLER_2D_SHADOW)WK.compareFunction=Z.isReversedDepthBuffer()?T6:P6,X=WK;else X=xX;Z.setTexture2D(Q||X,$)}function RG(J,Q,Z){let K=this.cache,$=Z.allocateTextureUnit();if(K[0]!==$)J.uniform1i(this.addr,$),K[0]=$;Z.setTexture3D(Q||pX,$)}function LG(J,Q,Z){let K=this.cache,$=Z.allocateTextureUnit();if(K[0]!==$)J.uniform1i(this.addr,$),K[0]=$;Z.setTextureCube(Q||mX,$)}function VG(J,Q,Z){let K=this.cache,$=Z.allocateTextureUnit();if(K[0]!==$)J.uniform1i(this.addr,$),K[0]=$;Z.setTexture2DArray(Q||gX,$)}function MG(J){switch(J){case 5126:return QG;case 35664:return ZG;case 35665:return KG;case 35666:return $G;case 35674:return XG;case 35675:return YG;case 35676:return WG;case 5124:case 35670:return UG;case 35667:case 35671:return HG;case 35668:case 35672:return GG;case 35669:case 35673:return NG;case 5125:return EG;case 36294:return FG;case 36295:return qG;case 36296:return DG;case 35678:case 36198:case 36298:case 36306:case 35682:return OG;case 35679:case 36299:case 36307:return RG;case 35680:case 36300:case 36308:case 36293:return LG;case 36289:case 36303:case 36311:case 36292:return VG}}function kG(J,Q){J.uniform1fv(this.addr,Q)}function BG(J,Q){let Z=U7(Q,this.size,2);J.uniform2fv(this.addr,Z)}function IG(J,Q){let Z=U7(Q,this.size,3);J.uniform3fv(this.addr,Z)}function CG(J,Q){let Z=U7(Q,this.size,4);J.uniform4fv(this.addr,Z)}function zG(J,Q){let Z=U7(Q,this.size,4);J.uniformMatrix2fv(this.addr,!1,Z)}function _G(J,Q){let Z=U7(Q,this.size,9);J.uniformMatrix3fv(this.addr,!1,Z)}function AG(J,Q){let Z=U7(Q,this.size,16);J.uniformMatrix4fv(this.addr,!1,Z)}function wG(J,Q){J.uniform1iv(this.addr,Q)}function PG(J,Q){J.uniform2iv(this.addr,Q)}function TG(J,Q){J.uniform3iv(this.addr,Q)}function SG(J,Q){J.uniform4iv(this.addr,Q)}function jG(J,Q){J.uniform1uiv(this.addr,Q)}function vG(J,Q){J.uniform2uiv(this.addr,Q)}function yG(J,Q){J.uniform3uiv(this.addr,Q)}function fG(J,Q){J.uniform4uiv(this.addr,Q)}function hG(J,Q,Z){let K=this.cache,$=Q.length,X=a6(Z,$);if(!wJ(K,X))J.uniform1iv(this.addr,X),PJ(K,X);let Y;if(this.type===J.SAMPLER_2D_SHADOW)Y=WK;else Y=xX;for(let W=0;W!==$;++W)Z.setTexture2D(Q[W]||Y,X[W])}function bG(J,Q,Z){let K=this.cache,$=Q.length,X=a6(Z,$);if(!wJ(K,X))J.uniform1iv(this.addr,X),PJ(K,X);for(let Y=0;Y!==$;++Y)Z.setTexture3D(Q[Y]||pX,X[Y])}function xG(J,Q,Z){let K=this.cache,$=Q.length,X=a6(Z,$);if(!wJ(K,X))J.uniform1iv(this.addr,X),PJ(K,X);for(let Y=0;Y!==$;++Y)Z.setTextureCube(Q[Y]||mX,X[Y])}function gG(J,Q,Z){let K=this.cache,$=Q.length,X=a6(Z,$);if(!wJ(K,X))J.uniform1iv(this.addr,X),PJ(K,X);for(let Y=0;Y!==$;++Y)Z.setTexture2DArray(Q[Y]||gX,X[Y])}function pG(J){switch(J){case 5126:return kG;case 35664:return BG;case 35665:return IG;case 35666:return CG;case 35674:return zG;case 35675:return _G;case 35676:return AG;case 5124:case 35670:return wG;case 35667:case 35671:return PG;case 35668:case 35672:return TG;case 35669:case 35673:return SG;case 5125:return jG;case 36294:return vG;case 36295:return yG;case 36296:return fG;case 35678:case 36198:case 36298:case 36306:case 35682:return hG;case 35679:case 36299:case 36307:return bG;case 35680:case 36300:case 36308:case 36293:return xG;case 36289:case 36303:case 36311:case 36292:return gG}}class lX{constructor(J,Q,Z){this.id=J,this.addr=Z,this.cache=[],this.type=Q.type,this.setValue=MG(Q.type)}}class dX{constructor(J,Q,Z){this.id=J,this.addr=Z,this.cache=[],this.type=Q.type,this.size=Q.size,this.setValue=pG(Q.type)}}class uX{constructor(J){this.id=J,this.seq=[],this.map={}}setValue(J,Q,Z){let K=this.seq;for(let $=0,X=K.length;$!==X;++$){let Y=K[$];Y.setValue(J,Q[Y.id],Z)}}}var $K=/(\w+)(\])?(\[|\.)?/g;function CX(J,Q){J.seq.push(Q),J.map[Q.id]=Q}function mG(J,Q,Z){let K=J.name,$=K.length;$K.lastIndex=0;while(!0){let X=$K.exec(K),Y=$K.lastIndex,W=X[1],U=X[2]==="]",H=X[3];if(U)W=W|0;if(H===void 0||H==="["&&Y+2===$){CX(Z,H===void 0?new lX(W,J,Q):new dX(W,J,Q));break}else{let F=Z.map[W];if(F===void 0)F=new uX(W),CX(Z,F);Z=F}}}class m7{constructor(J,Q){this.seq=[],this.map={};let Z=J.getProgramParameter(Q,J.ACTIVE_UNIFORMS);for(let X=0;X<Z;++X){let Y=J.getActiveUniform(Q,X),W=J.getUniformLocation(Q,Y.name);mG(Y,W,this)}let K=[],$=[];for(let X of this.seq)if(X.type===J.SAMPLER_2D_SHADOW||X.type===J.SAMPLER_CUBE_SHADOW||X.type===J.SAMPLER_2D_ARRAY_SHADOW)K.push(X);else $.push(X);if(K.length>0)this.seq=K.concat($)}setValue(J,Q,Z,K){let $=this.map[Q];if($!==void 0)$.setValue(J,Z,K)}setOptional(J,Q,Z){let K=Q[Z];if(K!==void 0)this.setValue(J,Z,K)}static upload(J,Q,Z,K){for(let $=0,X=Q.length;$!==X;++$){let Y=Q[$],W=Z[Y.id];if(W.needsUpdate!==!1)Y.setValue(J,W.value,K)}}static seqWithValue(J,Q){let Z=[];for(let K=0,$=J.length;K!==$;++K){let X=J[K];if(X.id in Q)Z.push(X)}return Z}}function zX(J,Q,Z){let K=J.createShader(Q);return J.shaderSource(K,Z),J.compileShader(K),K}var lG=37297,dG=0;function uG(J,Q){let Z=J.split(`
`),K=[],$=Math.max(Q-6,0),X=Math.min(Q+6,Z.length);for(let Y=$;Y<X;Y++){let W=Y+1;K.push(`${W===Q?">":" "} ${W}: ${Z[Y]}`)}return K.join(`
`)}var _X=new f0;function cG(J){u0._getMatrix(_X,u0.workingColorSpace,J);let Q=`mat3( ${_X.elements.map((Z)=>Z.toFixed(4))} )`;switch(u0.getTransfer(J)){case _Z:return[Q,"LinearTransferOETF"];case UJ:return[Q,"sRGBTransferOETF"];default:return j0("WebGLProgram: Unsupported color space: ",J),[Q,"LinearTransferOETF"]}}function AX(J,Q,Z){let K=J.getShaderParameter(Q,J.COMPILE_STATUS),X=(J.getShaderInfoLog(Q)||"").trim();if(K&&X==="")return"";let Y=/ERROR: 0:(\d+)/.exec(X);if(Y){let W=parseInt(Y[1]);return Z.toUpperCase()+`

`+X+`

`+uG(J.getShaderSource(Q),W)}else return X}function nG(J,Q){let Z=cG(Q);return[`vec4 ${J}( vec4 value ) {`,`	return ${Z[1]}( vec4( value.rgb * ${Z[0]}, value.a ) );`,"}"].join(`
`)}var sG={[hQ]:"Linear",[bQ]:"Reinhard",[xQ]:"Cineon",[z7]:"ACESFilmic",[pQ]:"AgX",[mQ]:"Neutral",[gQ]:"Custom"};function iG(J,Q){let Z=sG[Q];if(Z===void 0)return j0("WebGLProgram: Unsupported toneMapping:",Q),"vec3 "+J+"( vec3 color ) { return LinearToneMapping( color ); }";return"vec3 "+J+"( vec3 color ) { return "+Z+"ToneMapping( color ); }"}var i6=new h;function oG(){u0.getLuminanceCoefficients(i6);let J=i6.x.toFixed(4),Q=i6.y.toFixed(4),Z=i6.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${J}, ${Q}, ${Z} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function aG(J){return[J.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",J.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(p7).join(`
`)}function rG(J){let Q=[];for(let Z in J){let K=J[Z];if(K===!1)continue;Q.push("#define "+Z+" "+K)}return Q.join(`
`)}function tG(J,Q){let Z={},K=J.getProgramParameter(Q,J.ACTIVE_ATTRIBUTES);for(let $=0;$<K;$++){let X=J.getActiveAttrib(Q,$),Y=X.name,W=1;if(X.type===J.FLOAT_MAT2)W=2;if(X.type===J.FLOAT_MAT3)W=3;if(X.type===J.FLOAT_MAT4)W=4;Z[Y]={type:X.type,location:J.getAttribLocation(Q,Y),locationSize:W}}return Z}function p7(J){return J!==""}function wX(J,Q){let Z=Q.numSpotLightShadows+Q.numSpotLightMaps-Q.numSpotLightShadowsWithMaps;return J.replace(/NUM_SUN_LIGHTS/g,Q.numSunLights).replace(/NUM_DIR_LIGHTS/g,Q.numDirLights).replace(/NUM_SPOT_LIGHTS/g,Q.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,Q.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,Z).replace(/NUM_RECT_AREA_LIGHTS/g,Q.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,Q.numPointLights).replace(/NUM_HEMI_LIGHTS/g,Q.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,Q.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,Q.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,Q.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,Q.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,Q.numPointLightShadows)}function PX(J,Q){return J.replace(/NUM_CLIPPING_PLANES/g,Q.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,Q.numClippingPlanes-Q.numClipIntersection)}var eG=/^[ \t]*#include +<([\w\d./]+)>/gm;function UK(J){return J.replace(eG,Q5)}var J5=new Map;function Q5(J,Q){let Z=p0[Q];if(Z===void 0){let K=J5.get(Q);if(K!==void 0)Z=p0[K],j0('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',Q,K);else throw Error("THREE.WebGLProgram: Can not resolve #include <"+Q+">")}return UK(Z)}var Z5=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function TX(J){return J.replace(Z5,K5)}function K5(J,Q,Z,K){let $="";for(let X=parseInt(Q);X<parseInt(Z);X++)$+=K.replace(/\[\s*i\s*\]/g,"[ "+X+" ]").replace(/UNROLLED_LOOP_INDEX/g,X);return $}function SX(J){let Q=`precision ${J.precision} float;
	precision ${J.precision} int;
	precision ${J.precision} sampler2D;
	precision ${J.precision} samplerCube;
	precision ${J.precision} sampler3D;
	precision ${J.precision} sampler2DArray;
	precision ${J.precision} sampler2DShadow;
	precision ${J.precision} samplerCubeShadow;
	precision ${J.precision} sampler2DArrayShadow;
	precision ${J.precision} isampler2D;
	precision ${J.precision} isampler3D;
	precision ${J.precision} isamplerCube;
	precision ${J.precision} isampler2DArray;
	precision ${J.precision} usampler2D;
	precision ${J.precision} usampler3D;
	precision ${J.precision} usamplerCube;
	precision ${J.precision} usampler2DArray;
	`;if(J.precision==="highp")Q+=`
#define HIGH_PRECISION`;else if(J.precision==="mediump")Q+=`
#define MEDIUM_PRECISION`;else if(J.precision==="lowp")Q+=`
#define LOW_PRECISION`;return Q}var $5={[O8]:"SHADOWMAP_TYPE_PCF",[Q7]:"SHADOWMAP_TYPE_VSM"};function X5(J){return $5[J.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Y5={[$7]:"ENVMAP_TYPE_CUBE",[L8]:"ENVMAP_TYPE_CUBE",[_7]:"ENVMAP_TYPE_CUBE_UV"};function W5(J){if(J.envMap===!1)return"ENVMAP_TYPE_CUBE";return Y5[J.envMapMode]||"ENVMAP_TYPE_CUBE"}var U5={[L8]:"ENVMAP_MODE_REFRACTION"};function H5(J){if(J.envMap===!1)return"ENVMAP_MODE_REFLECTION";return U5[J.envMapMode]||"ENVMAP_MODE_REFLECTION"}var G5={[b$]:"ENVMAP_BLENDING_MULTIPLY",[x$]:"ENVMAP_BLENDING_MIX",[g$]:"ENVMAP_BLENDING_ADD"};function N5(J){if(J.envMap===!1)return"ENVMAP_BLENDING_NONE";return G5[J.combine]||"ENVMAP_BLENDING_NONE"}function E5(J){let Q=J.envMapCubeUVHeight;if(Q===null)return null;let Z=Math.log2(Q)-2,K=1/Q;return{texelWidth:1/(3*Math.max(Math.pow(2,Z),112)),texelHeight:K,maxMip:Z}}function F5(J,Q,Z,K){let $=J.getContext(),X=Z.defines,Y=Z.vertexShader,W=Z.fragmentShader,U=X5(Z),H=W5(Z),N=H5(Z),F=N5(Z),G=E5(Z),D=aG(Z),R=rG(X),B=$.createProgram(),q,E,z=Z.glslVersion?"#version "+Z.glslVersion+`
`:"";if(Z.isRawShaderMaterial){if(q=["#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R].filter(p7).join(`
`),q.length>0)q+=`
`;if(E=["#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R].filter(p7).join(`
`),E.length>0)E+=`
`}else q=[SX(Z),"#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R,Z.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",Z.batching?"#define USE_BATCHING":"",Z.batchingColor?"#define USE_BATCHING_COLOR":"",Z.instancing?"#define USE_INSTANCING":"",Z.instancingColor?"#define USE_INSTANCING_COLOR":"",Z.instancingMorph?"#define USE_INSTANCING_MORPH":"",Z.useFog&&Z.fog?"#define USE_FOG":"",Z.useFog&&Z.fogExp2?"#define FOG_EXP2":"",Z.map?"#define USE_MAP":"",Z.envMap?"#define USE_ENVMAP":"",Z.envMap?"#define "+N:"",Z.lightMap?"#define USE_LIGHTMAP":"",Z.aoMap?"#define USE_AOMAP":"",Z.bumpMap?"#define USE_BUMPMAP":"",Z.normalMap?"#define USE_NORMALMAP":"",Z.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",Z.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",Z.displacementMap?"#define USE_DISPLACEMENTMAP":"",Z.emissiveMap?"#define USE_EMISSIVEMAP":"",Z.anisotropy?"#define USE_ANISOTROPY":"",Z.anisotropyMap?"#define USE_ANISOTROPYMAP":"",Z.clearcoatMap?"#define USE_CLEARCOATMAP":"",Z.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",Z.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",Z.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",Z.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",Z.specularMap?"#define USE_SPECULARMAP":"",Z.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",Z.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",Z.roughnessMap?"#define USE_ROUGHNESSMAP":"",Z.metalnessMap?"#define USE_METALNESSMAP":"",Z.alphaMap?"#define USE_ALPHAMAP":"",Z.alphaHash?"#define USE_ALPHAHASH":"",Z.transmission?"#define USE_TRANSMISSION":"",Z.transmissionMap?"#define USE_TRANSMISSIONMAP":"",Z.thicknessMap?"#define USE_THICKNESSMAP":"",Z.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",Z.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",Z.mapUv?"#define MAP_UV "+Z.mapUv:"",Z.alphaMapUv?"#define ALPHAMAP_UV "+Z.alphaMapUv:"",Z.lightMapUv?"#define LIGHTMAP_UV "+Z.lightMapUv:"",Z.aoMapUv?"#define AOMAP_UV "+Z.aoMapUv:"",Z.emissiveMapUv?"#define EMISSIVEMAP_UV "+Z.emissiveMapUv:"",Z.bumpMapUv?"#define BUMPMAP_UV "+Z.bumpMapUv:"",Z.normalMapUv?"#define NORMALMAP_UV "+Z.normalMapUv:"",Z.displacementMapUv?"#define DISPLACEMENTMAP_UV "+Z.displacementMapUv:"",Z.metalnessMapUv?"#define METALNESSMAP_UV "+Z.metalnessMapUv:"",Z.roughnessMapUv?"#define ROUGHNESSMAP_UV "+Z.roughnessMapUv:"",Z.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+Z.anisotropyMapUv:"",Z.clearcoatMapUv?"#define CLEARCOATMAP_UV "+Z.clearcoatMapUv:"",Z.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+Z.clearcoatNormalMapUv:"",Z.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+Z.clearcoatRoughnessMapUv:"",Z.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+Z.iridescenceMapUv:"",Z.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+Z.iridescenceThicknessMapUv:"",Z.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+Z.sheenColorMapUv:"",Z.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+Z.sheenRoughnessMapUv:"",Z.specularMapUv?"#define SPECULARMAP_UV "+Z.specularMapUv:"",Z.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+Z.specularColorMapUv:"",Z.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+Z.specularIntensityMapUv:"",Z.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+Z.transmissionMapUv:"",Z.thicknessMapUv?"#define THICKNESSMAP_UV "+Z.thicknessMapUv:"",Z.vertexTangents&&Z.flatShading===!1?"#define USE_TANGENT":"",Z.vertexNormals?"#define HAS_NORMAL":"",Z.vertexColors?"#define USE_COLOR":"",Z.vertexAlphas?"#define USE_COLOR_ALPHA":"",Z.vertexUv1s?"#define USE_UV1":"",Z.vertexUv2s?"#define USE_UV2":"",Z.vertexUv3s?"#define USE_UV3":"",Z.pointsUvs?"#define USE_POINTS_UV":"",Z.flatShading?"#define FLAT_SHADED":"",Z.skinning?"#define USE_SKINNING":"",Z.morphTargets?"#define USE_MORPHTARGETS":"",Z.morphNormals&&Z.flatShading===!1?"#define USE_MORPHNORMALS":"",Z.morphColors?"#define USE_MORPHCOLORS":"",Z.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+Z.morphTextureStride:"",Z.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+Z.morphTargetsCount:"",Z.doubleSided?"#define DOUBLE_SIDED":"",Z.flipSided?"#define FLIP_SIDED":"",Z.shadowMapEnabled?"#define USE_SHADOWMAP":"",Z.shadowMapEnabled?"#define "+U:"",Z.sizeAttenuation?"#define USE_SIZEATTENUATION":"",Z.numLightProbes>0?"#define USE_LIGHT_PROBES":"",Z.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",Z.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(p7).join(`
`),E=[SX(Z),"#define SHADER_TYPE "+Z.shaderType,"#define SHADER_NAME "+Z.shaderName,R,Z.useFog&&Z.fog?"#define USE_FOG":"",Z.useFog&&Z.fogExp2?"#define FOG_EXP2":"",Z.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",Z.map?"#define USE_MAP":"",Z.matcap?"#define USE_MATCAP":"",Z.envMap?"#define USE_ENVMAP":"",Z.envMap?"#define "+H:"",Z.envMap?"#define "+N:"",Z.envMap?"#define "+F:"",G?"#define CUBEUV_TEXEL_WIDTH "+G.texelWidth:"",G?"#define CUBEUV_TEXEL_HEIGHT "+G.texelHeight:"",G?"#define CUBEUV_MAX_MIP "+G.maxMip+".0":"",Z.lightMap?"#define USE_LIGHTMAP":"",Z.aoMap?"#define USE_AOMAP":"",Z.bumpMap?"#define USE_BUMPMAP":"",Z.normalMap?"#define USE_NORMALMAP":"",Z.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",Z.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",Z.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",Z.emissiveMap?"#define USE_EMISSIVEMAP":"",Z.anisotropy?"#define USE_ANISOTROPY":"",Z.anisotropyMap?"#define USE_ANISOTROPYMAP":"",Z.clearcoat?"#define USE_CLEARCOAT":"",Z.clearcoatMap?"#define USE_CLEARCOATMAP":"",Z.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",Z.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",Z.dispersion?"#define USE_DISPERSION":"",Z.retroreflection?"#define USE_RETROREFLECTION":"",Z.iridescence?"#define USE_IRIDESCENCE":"",Z.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",Z.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",Z.specularMap?"#define USE_SPECULARMAP":"",Z.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",Z.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",Z.roughnessMap?"#define USE_ROUGHNESSMAP":"",Z.metalnessMap?"#define USE_METALNESSMAP":"",Z.alphaMap?"#define USE_ALPHAMAP":"",Z.alphaTest?"#define USE_ALPHATEST":"",Z.alphaHash?"#define USE_ALPHAHASH":"",Z.sheen?"#define USE_SHEEN":"",Z.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",Z.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",Z.transmission?"#define USE_TRANSMISSION":"",Z.transmissionMap?"#define USE_TRANSMISSIONMAP":"",Z.thicknessMap?"#define USE_THICKNESSMAP":"",Z.vertexTangents&&Z.flatShading===!1?"#define USE_TANGENT":"",Z.vertexColors||Z.instancingColor?"#define USE_COLOR":"",Z.vertexAlphas||Z.batchingColor?"#define USE_COLOR_ALPHA":"",Z.vertexUv1s?"#define USE_UV1":"",Z.vertexUv2s?"#define USE_UV2":"",Z.vertexUv3s?"#define USE_UV3":"",Z.pointsUvs?"#define USE_POINTS_UV":"",Z.gradientMap?"#define USE_GRADIENTMAP":"",Z.flatShading?"#define FLAT_SHADED":"",Z.doubleSided?"#define DOUBLE_SIDED":"",Z.flipSided?"#define FLIP_SIDED":"",Z.shadowMapEnabled?"#define USE_SHADOWMAP":"",Z.shadowMapEnabled?"#define "+U:"",Z.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",Z.numLightProbes>0?"#define USE_LIGHT_PROBES":"",Z.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",Z.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",Z.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",Z.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",Z.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",Z.toneMapping!==F9?"#define TONE_MAPPING":"",Z.toneMapping!==F9?p0.tonemapping_pars_fragment:"",Z.toneMapping!==F9?iG("toneMapping",Z.toneMapping):"",Z.dithering?"#define DITHERING":"",Z.opaque?"#define OPAQUE":"",p0.colorspace_pars_fragment,nG("linearToOutputTexel",Z.outputColorSpace),oG(),Z.useDepthPacking?"#define DEPTH_PACKING "+Z.depthPacking:"",`
`].filter(p7).join(`
`);if(Y=UK(Y),Y=wX(Y,Z),Y=PX(Y,Z),W=UK(W),W=wX(W,Z),W=PX(W,Z),Y=TX(Y),W=TX(W),Z.isRawShaderMaterial!==!0)z=`#version 300 es
`,q=[D,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+q,E=["#define varying in",Z.glslVersion===AZ?"":"layout(location = 0) out highp vec4 pc_fragColor;",Z.glslVersion===AZ?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+E;let w=z+q+Y,k=z+E+W,C=zX($,$.VERTEX_SHADER,w),_=zX($,$.FRAGMENT_SHADER,k);if($.attachShader(B,C),$.attachShader(B,_),Z.index0AttributeName!==void 0)$.bindAttribLocation(B,0,Z.index0AttributeName);else if(Z.hasPositionAttribute===!0)$.bindAttribLocation(B,0,"position");$.linkProgram(B);function A(P){if(J.debug.checkShaderErrors){let f=$.getProgramInfoLog(B)||"",u=$.getShaderInfoLog(C)||"",T=$.getShaderInfoLog(_)||"",p=f.trim(),o=u.trim(),m=T.trim(),Q0=!0,n=!0;if($.getProgramParameter(B,$.LINK_STATUS)===!1)if(Q0=!1,typeof J.debug.onShaderError==="function")J.debug.onShaderError($,B,C,_);else{let r=AX($,C,"vertex"),J0=AX($,_,"fragment");P0("WebGLProgram: Shader Error "+$.getError()+" - VALIDATE_STATUS "+$.getProgramParameter(B,$.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+p+`
`+r+`
`+J0)}else if(p!=="")j0("WebGLProgram: Program Info Log:",p);else if(o===""||m==="")n=!1;if(n)P.diagnostics={runnable:Q0,programLog:p,vertexShader:{log:o,prefix:q},fragmentShader:{log:m,prefix:E}}}$.deleteShader(C),$.deleteShader(_),O=new m7($,B),V=tG($,B)}let O;this.getUniforms=function(){if(O===void 0)A(this);return O};let V;this.getAttributes=function(){if(V===void 0)A(this);return V};let b=Z.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){if(b===!1)b=$.getProgramParameter(B,lG);return b},this.destroy=function(){K.releaseStatesOfProgram(this),$.deleteProgram(B),this.program=void 0},this.type=Z.shaderType,this.name=Z.shaderName,this.id=dG++,this.cacheKey=Q,this.usedTimes=1,this.program=B,this.vertexShader=C,this.fragmentShader=_,this}var q5=0;class cX{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(J,Q,Z){let K=this._getShaderCacheForMaterial(J);if(K.has(Q)===!1)K.add(Q),Q.usedTimes++;if(K.has(Z)===!1)K.add(Z),Z.usedTimes++;return this}remove(J){let Q=this.materialCache.get(J);for(let Z of Q)if(Z.usedTimes--,Z.usedTimes===0)this.shaderCache.delete(Z.code);return this.materialCache.delete(J),this}getVertexShaderStage(J){return this._getShaderStage(J.vertexShader)}getFragmentShaderStage(J){return this._getShaderStage(J.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(J){let Q=this.materialCache,Z=Q.get(J);if(Z===void 0)Z=new Set,Q.set(J,Z);return Z}_getShaderStage(J){let Q=this.shaderCache,Z=Q.get(J);if(Z===void 0)Z=new nX(J),Q.set(J,Z);return Z}}class nX{constructor(J){this.id=q5++,this.code=J,this.usedTimes=0}}function D5(J){return J===B8||J===A6||J===w6}function O5(J,Q,Z,K,$,X){let Y=new T7,W=new cX,U=new Set,H=[],N=new Map,F=K.logarithmicDepthBuffer,G=K.precision,D={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function R(O){if(U.add(O),O===0)return"uv";return`uv${O}`}function B(O,V,b,P,f,u){let T=P.fog,p=f.geometry,o=O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial?P.environment:null,m=O.isMeshStandardMaterial||O.isMeshLambertMaterial&&!O.envMap||O.isMeshPhongMaterial&&!O.envMap,Q0=Q.get(O.envMap||o,m),n=!!Q0&&Q0.mapping===_7?Q0.image.height:null,r=D[O.type];if(O.precision!==null){if(G=K.getMaxPrecision(O.precision),G!==O.precision)j0("WebGLProgram.getParameters:",O.precision,"not supported, using",G,"instead.")}let J0=p.morphAttributes.position||p.morphAttributes.normal||p.morphAttributes.color,T0=J0!==void 0?J0.length:0,_0=0;if(p.morphAttributes.position!==void 0)_0=1;if(p.morphAttributes.normal!==void 0)_0=2;if(p.morphAttributes.color!==void 0)_0=3;let HJ,m0,s,Z0;if(r){let GJ=_9[r];HJ=GJ.vertexShader,m0=GJ.fragmentShader}else{HJ=O.vertexShader,m0=O.fragmentShader;let GJ=W.getVertexShaderStage(O),e0=W.getFragmentShaderStage(O);W.update(O,GJ,e0),s=GJ.id,Z0=e0.id}let $0=J.getRenderTarget(),A0=J.state.buffers.depth.getReversed(),S0=f.isInstancedMesh===!0,C0=f.isBatchedMesh===!0,CJ=!!O.map,d0=!!O.matcap,i0=!!Q0,QJ=!!O.aoMap,o0=!!O.lightMap,jJ=!!O.bumpMap&&O.wireframe===!1,qJ=!!O.normalMap,sJ=!!O.displacementMap,zJ=!!O.emissiveMap,_J=!!O.metalnessMap,j=!!O.roughnessMap,iJ=O.anisotropy>0,t0=O.clearcoat>0,RJ=O.dispersion>0,I=O.retroreflectivity>0,L=O.iridescence>0,S=O.sheen>0,l=O.transmission>0,e=iJ&&!!O.anisotropyMap,X0=t0&&!!O.clearcoatMap,H0=t0&&!!O.clearcoatNormalMap,c=t0&&!!O.clearcoatRoughnessMap,a=L&&!!O.iridescenceMap,D0=L&&!!O.iridescenceThicknessMap,I0=S&&!!O.sheenColorMap,G0=S&&!!O.sheenRoughnessMap,K0=!!O.specularMap,z0=!!O.specularColorMap,w0=!!O.specularIntensityMap,r0=l&&!!O.transmissionMap,y=l&&!!O.thicknessMap,Y0=!!O.gradientMap,i=!!O.alphaMap,U0=O.alphaTest>0,O0=!!O.alphaHash,t=!!O.extensions,E0=F9;if(O.toneMapped){if($0===null||$0.isXRRenderTarget===!0)E0=J.toneMapping}let h0={shaderID:r,shaderType:O.type,shaderName:O.name,vertexShader:HJ,fragmentShader:m0,defines:O.defines,customVertexShaderID:s,customFragmentShaderID:Z0,isRawShaderMaterial:O.isRawShaderMaterial===!0,glslVersion:O.glslVersion,precision:G,batching:C0,batchingColor:C0&&f._colorsTexture!==null,instancing:S0,instancingColor:S0&&f.instanceColor!==null,instancingMorph:S0&&f.morphTexture!==null,outputColorSpace:$0===null?J.outputColorSpace:$0.isXRRenderTarget===!0?$0.texture.colorSpace:u0.workingColorSpace,alphaToCoverage:!!O.alphaToCoverage,map:CJ,matcap:d0,envMap:i0,envMapMode:i0&&Q0.mapping,envMapCubeUVHeight:n,aoMap:QJ,lightMap:o0,bumpMap:jJ,normalMap:qJ,displacementMap:sJ,emissiveMap:zJ,normalMapObjectSpace:qJ&&O.normalMapType===a$,normalMapTangentSpace:qJ&&O.normalMapType===CZ,packedNormalMap:qJ&&O.normalMapType===CZ&&D5(O.normalMap.format),metalnessMap:_J,roughnessMap:j,anisotropy:iJ,anisotropyMap:e,clearcoat:t0,clearcoatMap:X0,clearcoatNormalMap:H0,clearcoatRoughnessMap:c,dispersion:RJ,retroreflection:I,iridescence:L,iridescenceMap:a,iridescenceThicknessMap:D0,sheen:S,sheenColorMap:I0,sheenRoughnessMap:G0,specularMap:K0,specularColorMap:z0,specularIntensityMap:w0,transmission:l,transmissionMap:r0,thicknessMap:y,gradientMap:Y0,opaque:O.transparent===!1&&O.blending===R8&&O.alphaToCoverage===!1,alphaMap:i,alphaTest:U0,alphaHash:O0,combine:O.combine,mapUv:CJ&&R(O.map.channel),aoMapUv:QJ&&R(O.aoMap.channel),lightMapUv:o0&&R(O.lightMap.channel),bumpMapUv:jJ&&R(O.bumpMap.channel),normalMapUv:qJ&&R(O.normalMap.channel),displacementMapUv:sJ&&R(O.displacementMap.channel),emissiveMapUv:zJ&&R(O.emissiveMap.channel),metalnessMapUv:_J&&R(O.metalnessMap.channel),roughnessMapUv:j&&R(O.roughnessMap.channel),anisotropyMapUv:e&&R(O.anisotropyMap.channel),clearcoatMapUv:X0&&R(O.clearcoatMap.channel),clearcoatNormalMapUv:H0&&R(O.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:c&&R(O.clearcoatRoughnessMap.channel),iridescenceMapUv:a&&R(O.iridescenceMap.channel),iridescenceThicknessMapUv:D0&&R(O.iridescenceThicknessMap.channel),sheenColorMapUv:I0&&R(O.sheenColorMap.channel),sheenRoughnessMapUv:G0&&R(O.sheenRoughnessMap.channel),specularMapUv:K0&&R(O.specularMap.channel),specularColorMapUv:z0&&R(O.specularColorMap.channel),specularIntensityMapUv:w0&&R(O.specularIntensityMap.channel),transmissionMapUv:r0&&R(O.transmissionMap.channel),thicknessMapUv:y&&R(O.thicknessMap.channel),alphaMapUv:i&&R(O.alphaMap.channel),vertexTangents:!!p.attributes.tangent&&(qJ||iJ),vertexNormals:!!p.attributes.normal,vertexColors:O.vertexColors,vertexAlphas:O.vertexColors===!0&&!!p.attributes.color&&p.attributes.color.itemSize===4,pointsUvs:f.isPoints===!0&&!!p.attributes.uv&&(CJ||i),fog:!!T,useFog:O.fog===!0,fogExp2:!!T&&T.isFogExp2,flatShading:O.wireframe===!1&&(O.flatShading===!0||p.attributes.normal===void 0&&qJ===!1&&(O.isMeshLambertMaterial||O.isMeshPhongMaterial||O.isMeshStandardMaterial||O.isMeshPhysicalMaterial)),sizeAttenuation:O.sizeAttenuation===!0,logarithmicDepthBuffer:F,reversedDepthBuffer:A0,skinning:f.isSkinnedMesh===!0,hasPositionAttribute:p.attributes.position!==void 0,morphTargets:p.morphAttributes.position!==void 0,morphNormals:p.morphAttributes.normal!==void 0,morphColors:p.morphAttributes.color!==void 0,morphTargetsCount:T0,morphTextureStride:_0,numSunLights:V.sun.length,numDirLights:V.directional.length,numPointLights:V.point.length,numSpotLights:V.spot.length,numSpotLightMaps:V.spotLightMap.length,numRectAreaLights:V.rectArea.length,numHemiLights:V.hemi.length,numSunLightShadows:V.sunShadowMap.length,numDirLightShadows:V.directionalShadowMap.length,numPointLightShadows:V.pointShadowMap.length,numSpotLightShadows:V.spotShadowMap.length,numSpotLightShadowsWithMaps:V.numSpotLightShadowsWithMaps,numLightProbes:V.numLightProbes,numLightProbeGrids:u.length,numClippingPlanes:X.numPlanes,numClipIntersection:X.numIntersection,dithering:O.dithering,shadowMapEnabled:J.shadowMap.enabled&&b.length>0,shadowMapType:J.shadowMap.type,toneMapping:E0,decodeVideoTexture:CJ&&O.map.isVideoTexture===!0&&u0.getTransfer(O.map.colorSpace)===UJ,decodeVideoTextureEmissive:zJ&&O.emissiveMap.isVideoTexture===!0&&u0.getTransfer(O.emissiveMap.colorSpace)===UJ,premultipliedAlpha:O.premultipliedAlpha,doubleSided:O.side===SJ,flipSided:O.side===oJ,useDepthPacking:O.depthPacking>=0,depthPacking:O.depthPacking||0,index0AttributeName:O.index0AttributeName,extensionClipCullDistance:t&&O.extensions.clipCullDistance===!0&&Z.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(t&&O.extensions.multiDraw===!0||C0)&&Z.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:Z.has("KHR_parallel_shader_compile"),customProgramCacheKey:O.customProgramCacheKey()};return h0.vertexUv1s=U.has(1),h0.vertexUv2s=U.has(2),h0.vertexUv3s=U.has(3),U.clear(),h0}function q(O){let V=[];if(O.shaderID)V.push(O.shaderID);else V.push(O.customVertexShaderID),V.push(O.customFragmentShaderID);if(O.defines!==void 0)for(let b in O.defines)V.push(b),V.push(O.defines[b]);if(O.isRawShaderMaterial===!1)E(V,O),z(V,O),V.push(J.outputColorSpace);return V.push(O.customProgramCacheKey),V.join()}function E(O,V){O.push(V.precision),O.push(V.outputColorSpace),O.push(V.envMapMode),O.push(V.envMapCubeUVHeight),O.push(V.mapUv),O.push(V.alphaMapUv),O.push(V.lightMapUv),O.push(V.aoMapUv),O.push(V.bumpMapUv),O.push(V.normalMapUv),O.push(V.displacementMapUv),O.push(V.emissiveMapUv),O.push(V.metalnessMapUv),O.push(V.roughnessMapUv),O.push(V.anisotropyMapUv),O.push(V.clearcoatMapUv),O.push(V.clearcoatNormalMapUv),O.push(V.clearcoatRoughnessMapUv),O.push(V.iridescenceMapUv),O.push(V.iridescenceThicknessMapUv),O.push(V.sheenColorMapUv),O.push(V.sheenRoughnessMapUv),O.push(V.specularMapUv),O.push(V.specularColorMapUv),O.push(V.specularIntensityMapUv),O.push(V.transmissionMapUv),O.push(V.thicknessMapUv),O.push(V.combine),O.push(V.fogExp2),O.push(V.sizeAttenuation),O.push(V.morphTargetsCount),O.push(V.morphAttributeCount),O.push(V.numSunLights),O.push(V.numDirLights),O.push(V.numPointLights),O.push(V.numSpotLights),O.push(V.numSpotLightMaps),O.push(V.numHemiLights),O.push(V.numRectAreaLights),O.push(V.numSunLightShadows),O.push(V.numDirLightShadows),O.push(V.numPointLightShadows),O.push(V.numSpotLightShadows),O.push(V.numSpotLightShadowsWithMaps),O.push(V.numLightProbes),O.push(V.shadowMapType),O.push(V.toneMapping),O.push(V.numClippingPlanes),O.push(V.numClipIntersection),O.push(V.depthPacking)}function z(O,V){if(Y.disableAll(),V.instancing)Y.enable(0);if(V.instancingColor)Y.enable(1);if(V.instancingMorph)Y.enable(2);if(V.matcap)Y.enable(3);if(V.envMap)Y.enable(4);if(V.normalMapObjectSpace)Y.enable(5);if(V.normalMapTangentSpace)Y.enable(6);if(V.clearcoat)Y.enable(7);if(V.iridescence)Y.enable(8);if(V.alphaTest)Y.enable(9);if(V.vertexColors)Y.enable(10);if(V.vertexAlphas)Y.enable(11);if(V.vertexUv1s)Y.enable(12);if(V.vertexUv2s)Y.enable(13);if(V.vertexUv3s)Y.enable(14);if(V.vertexTangents)Y.enable(15);if(V.anisotropy)Y.enable(16);if(V.alphaHash)Y.enable(17);if(V.batching)Y.enable(18);if(V.dispersion)Y.enable(19);if(V.retroreflection)Y.enable(24);if(V.batchingColor)Y.enable(20);if(V.gradientMap)Y.enable(21);if(V.packedNormalMap)Y.enable(22);if(V.vertexNormals)Y.enable(23);if(O.push(Y.mask),Y.disableAll(),V.fog)Y.enable(0);if(V.useFog)Y.enable(1);if(V.flatShading)Y.enable(2);if(V.logarithmicDepthBuffer)Y.enable(3);if(V.reversedDepthBuffer)Y.enable(4);if(V.skinning)Y.enable(5);if(V.morphTargets)Y.enable(6);if(V.morphNormals)Y.enable(7);if(V.morphColors)Y.enable(8);if(V.premultipliedAlpha)Y.enable(9);if(V.shadowMapEnabled)Y.enable(10);if(V.doubleSided)Y.enable(11);if(V.flipSided)Y.enable(12);if(V.useDepthPacking)Y.enable(13);if(V.dithering)Y.enable(14);if(V.transmission)Y.enable(15);if(V.sheen)Y.enable(16);if(V.opaque)Y.enable(17);if(V.pointsUvs)Y.enable(18);if(V.decodeVideoTexture)Y.enable(19);if(V.decodeVideoTextureEmissive)Y.enable(20);if(V.alphaToCoverage)Y.enable(21);if(V.numLightProbeGrids>0)Y.enable(22);if(V.hasPositionAttribute)Y.enable(23);O.push(Y.mask)}function w(O){let V=D[O.type],b;if(V){let P=_9[V];b=HX.clone(P.uniforms)}else b=O.uniforms;return b}function k(O,V){let b=N.get(V);if(b!==void 0)++b.usedTimes;else b=new F5(J,V,O,$),H.push(b),N.set(V,b);return b}function C(O){if(--O.usedTimes===0){let V=H.indexOf(O);H[V]=H[H.length-1],H.pop(),N.delete(O.cacheKey),O.destroy()}}function _(O){W.remove(O)}function A(){W.dispose()}return{getParameters:B,getProgramCacheKey:q,getUniforms:w,acquireProgram:k,releaseProgram:C,releaseShaderCache:_,programs:H,dispose:A}}function R5(){let J=new WeakMap;function Q(Y){return J.has(Y)}function Z(Y){let W=J.get(Y);if(W===void 0)W={},J.set(Y,W);return W}function K(Y){J.delete(Y)}function $(Y,W,U){J.get(Y)[W]=U}function X(){J=new WeakMap}return{has:Q,get:Z,remove:K,update:$,dispose:X}}function L5(J,Q){if(J.groupOrder!==Q.groupOrder)return J.groupOrder-Q.groupOrder;else if(J.renderOrder!==Q.renderOrder)return J.renderOrder-Q.renderOrder;else if(J.material.id!==Q.material.id)return J.material.id-Q.material.id;else if(J.materialVariant!==Q.materialVariant)return J.materialVariant-Q.materialVariant;else if(J.z!==Q.z)return J.z-Q.z;else return J.id-Q.id}function jX(J,Q){if(J.groupOrder!==Q.groupOrder)return J.groupOrder-Q.groupOrder;else if(J.renderOrder!==Q.renderOrder)return J.renderOrder-Q.renderOrder;else if(J.z!==Q.z)return Q.z-J.z;else return J.id-Q.id}function vX(){let J=[],Q=0,Z=[],K=[],$=[];function X(){Q=0,Z.length=0,K.length=0,$.length=0}function Y(G){let D=0;if(G.isInstancedMesh)D+=2;if(G.isSkinnedMesh)D+=1;return D}function W(G,D,R,B,q,E){let z=J[Q];if(z===void 0)z={id:G.id,object:G,geometry:D,material:R,materialVariant:Y(G),groupOrder:B,renderOrder:G.renderOrder,z:q,group:E},J[Q]=z;else z.id=G.id,z.object=G,z.geometry=D,z.material=R,z.materialVariant=Y(G),z.groupOrder=B,z.renderOrder=G.renderOrder,z.z=q,z.group=E;return Q++,z}function U(G,D,R,B,q,E,z){if(z.reversedDepth===!0)q=-q;let w=W(G,D,R,B,q,E);if(R.transmission>0)K.push(w);else if(R.transparent===!0)$.push(w);else Z.push(w)}function H(G,D,R,B,q,E){let z=W(G,D,R,B,q,E);if(R.transmission>0)K.unshift(z);else if(R.transparent===!0)$.unshift(z);else Z.unshift(z)}function N(G,D){if(Z.length>1)Z.sort(G||L5);if(K.length>1)K.sort(D||jX);if($.length>1)$.sort(D||jX)}function F(){for(let G=Q,D=J.length;G<D;G++){let R=J[G];if(R.id===null)break;R.id=null,R.object=null,R.geometry=null,R.material=null,R.group=null}}return{opaque:Z,transmissive:K,transparent:$,init:X,push:U,unshift:H,finish:F,sort:N}}function V5(){let J=new WeakMap;function Q(K,$){let X=J.get(K),Y;if(X===void 0)Y=new vX,J.set(K,[Y]);else if($>=X.length)Y=new vX,X.push(Y);else Y=X[$];return Y}function Z(){J=new WeakMap}return{get:Q,dispose:Z}}function M5(){let J={};return{get:function(Q){if(J[Q.id]!==void 0)return J[Q.id];let Z;switch(Q.type){case"SunLight":case"DirectionalLight":Z={direction:new h,color:new x0};break;case"SpotLight":Z={position:new h,direction:new h,color:new x0,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":Z={position:new h,color:new x0,distance:0,decay:0};break;case"HemisphereLight":Z={direction:new h,skyColor:new x0,groundColor:new x0};break;case"RectAreaLight":Z={color:new x0,position:new h,halfWidth:new h,halfHeight:new h};break}return J[Q.id]=Z,Z}}}function k5(){let J={};return{get:function(Q){if(J[Q.id]!==void 0)return J[Q.id];let Z;switch(Q.type){case"SunLight":case"DirectionalLight":Z={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new v0};break;case"SpotLight":Z={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new v0};break;case"PointLight":Z={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new v0,shadowCameraNear:1,shadowCameraFar:1000};break}return J[Q.id]=Z,Z}}}var B5=0;function I5(J,Q){return(Q.castShadow?2:0)-(J.castShadow?2:0)+(Q.map?1:0)-(J.map?1:0)}function C5(J){let Q=new M5,Z=k5(),K={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let H=0;H<9;H++)K.probe.push(new h);let $=new h,X=new KJ,Y=new KJ;function W(H){let N=0,F=0,G=0;for(let f=0;f<9;f++)K.probe[f].set(0,0,0);let D=0,R=0,B=0,q=0,E=0,z=0,w=0,k=0,C=0,_=0,A=0,O=0,V=0,b=0;H.sort(I5);for(let f=0,u=H.length;f<u;f++){let T=H[f],p=T.color,o=T.intensity,m=T.distance,Q0=null;if(T.shadow&&T.shadow.map)if(T.shadow.map.texture.format===B8)Q0=T.shadow.map.texture;else Q0=T.shadow.map.depthTexture||T.shadow.map.texture;if(T.isAmbientLight)N+=p.r*o,F+=p.g*o,G+=p.b*o;else if(T.isLightProbe){for(let n=0;n<9;n++)K.probe[n].addScaledVector(T.sh.coefficients[n],o);b++}else if(T.isSunLight){let n=Q.get(T);if(n.color.copy(T.color).multiplyScalar(T.intensity),T.castShadow){let r=T.shadow,J0=Z.get(T);J0.shadowIntensity=r.intensity,J0.shadowBias=r.bias,J0.shadowNormalBias=r.normalBias,J0.shadowRadius=r.radius,J0.shadowMapSize.copy(r.mapSize).multiply(r.getFrameExtents()),K.sunShadow[R]=J0,K.sunShadowMap[R]=Q0;let T0=r.getViewportCount();for(let _0=0;_0<T0;_0++)K.sunShadowMatrix[B+_0]=r.getMatrix(_0),K.sunShadowCascade[B+_0]=r._cascadeData[_0];B+=T0,R++}K.sun[D]=n,D++}else if(T.isDirectionalLight){let n=Q.get(T);if(n.color.copy(T.color).multiplyScalar(T.intensity),T.castShadow){let r=T.shadow,J0=Z.get(T);J0.shadowIntensity=r.intensity,J0.shadowBias=r.bias,J0.shadowNormalBias=r.normalBias,J0.shadowRadius=r.radius,J0.shadowMapSize=r.mapSize,K.directionalShadow[q]=J0,K.directionalShadowMap[q]=Q0,K.directionalShadowMatrix[q]=T.shadow.matrix,C++}K.directional[q]=n,q++}else if(T.isSpotLight){let n=Q.get(T);n.position.setFromMatrixPosition(T.matrixWorld),n.color.copy(p).multiplyScalar(o),n.distance=m,n.coneCos=Math.cos(T.angle),n.penumbraCos=Math.cos(T.angle*(1-T.penumbra)),n.decay=T.decay,K.spot[z]=n;let r=T.shadow;if(T.map){if(K.spotLightMap[O]=T.map,O++,r.updateMatrices(T),T.castShadow)V++}if(K.spotLightMatrix[z]=r.matrix,T.castShadow){let J0=Z.get(T);J0.shadowIntensity=r.intensity,J0.shadowBias=r.bias,J0.shadowNormalBias=r.normalBias,J0.shadowRadius=r.radius,J0.shadowMapSize=r.mapSize,K.spotShadow[z]=J0,K.spotShadowMap[z]=Q0,A++}z++}else if(T.isRectAreaLight){let n=Q.get(T);n.color.copy(p).multiplyScalar(o),n.halfWidth.set(T.width*0.5,0,0),n.halfHeight.set(0,T.height*0.5,0),K.rectArea[w]=n,w++}else if(T.isPointLight){let n=Q.get(T);if(n.color.copy(T.color).multiplyScalar(T.intensity),n.distance=T.distance,n.decay=T.decay,T.castShadow){let r=T.shadow,J0=Z.get(T);J0.shadowIntensity=r.intensity,J0.shadowBias=r.bias,J0.shadowNormalBias=r.normalBias,J0.shadowRadius=r.radius,J0.shadowMapSize=r.mapSize,J0.shadowCameraNear=r.camera.near,J0.shadowCameraFar=r.camera.far,K.pointShadow[E]=J0,K.pointShadowMap[E]=Q0,K.pointShadowMatrix[E]=T.shadow.matrix,_++}K.point[E]=n,E++}else if(T.isHemisphereLight){let n=Q.get(T);n.skyColor.copy(T.color).multiplyScalar(o),n.groundColor.copy(T.groundColor).multiplyScalar(o),K.hemi[k]=n,k++}}if(w>0)if(J.has("OES_texture_float_linear")===!0)K.rectAreaLTC1=N0.LTC_FLOAT_1,K.rectAreaLTC2=N0.LTC_FLOAT_2;else K.rectAreaLTC1=N0.LTC_HALF_1,K.rectAreaLTC2=N0.LTC_HALF_2;K.ambient[0]=N,K.ambient[1]=F,K.ambient[2]=G;let P=K.hash;if(P.sunLength!==D||P.directionalLength!==q||P.pointLength!==E||P.spotLength!==z||P.rectAreaLength!==w||P.hemiLength!==k||P.numSunShadows!==R||P.numDirectionalShadows!==C||P.numPointShadows!==_||P.numSpotShadows!==A||P.numSpotMaps!==O||P.numLightProbes!==b)K.sun.length=D,K.directional.length=q,K.spot.length=z,K.rectArea.length=w,K.point.length=E,K.hemi.length=k,K.sunShadow.length=R,K.sunShadowMap.length=R,K.sunShadowMatrix.length=B,K.sunShadowCascade.length=B,K.directionalShadow.length=C,K.directionalShadowMap.length=C,K.directionalShadowMatrix.length=C,K.pointShadow.length=_,K.pointShadowMap.length=_,K.pointShadowMatrix.length=_,K.spotShadow.length=A,K.spotShadowMap.length=A,K.spotLightMatrix.length=A+O-V,K.spotLightMap.length=O,K.numSpotLightShadowsWithMaps=V,K.numLightProbes=b,P.sunLength=D,P.directionalLength=q,P.pointLength=E,P.spotLength=z,P.rectAreaLength=w,P.hemiLength=k,P.numSunShadows=R,P.numDirectionalShadows=C,P.numPointShadows=_,P.numSpotShadows=A,P.numSpotMaps=O,P.numLightProbes=b,K.version=B5++}function U(H,N){let F=0,G=0,D=0,R=0,B=0,q=0,E=N.matrixWorldInverse;for(let z=0,w=H.length;z<w;z++){let k=H[z];if(k.isSunLight){let C=K.sun[F];C.direction.setFromMatrixPosition(k.matrixWorld),C.direction.transformDirection(E),F++}else if(k.isDirectionalLight){let C=K.directional[G];C.direction.setFromMatrixPosition(k.matrixWorld),$.setFromMatrixPosition(k.target.matrixWorld),C.direction.sub($),C.direction.transformDirection(E),G++}else if(k.isSpotLight){let C=K.spot[R];C.position.setFromMatrixPosition(k.matrixWorld),C.position.applyMatrix4(E),C.direction.setFromMatrixPosition(k.matrixWorld),$.setFromMatrixPosition(k.target.matrixWorld),C.direction.sub($),C.direction.transformDirection(E),R++}else if(k.isRectAreaLight){let C=K.rectArea[B];C.position.setFromMatrixPosition(k.matrixWorld),C.position.applyMatrix4(E),Y.identity(),X.copy(k.matrixWorld),X.premultiply(E),Y.extractRotation(X),C.halfWidth.set(k.width*0.5,0,0),C.halfHeight.set(0,k.height*0.5,0),C.halfWidth.applyMatrix4(Y),C.halfHeight.applyMatrix4(Y),B++}else if(k.isPointLight){let C=K.point[D];C.position.setFromMatrixPosition(k.matrixWorld),C.position.applyMatrix4(E),D++}else if(k.isHemisphereLight){let C=K.hemi[q];C.direction.setFromMatrixPosition(k.matrixWorld),C.direction.transformDirection(E),q++}}}return{setup:W,setupView:U,state:K}}function yX(J){let Q=new C5(J),Z=[],K=[],$=[];function X(G){F.camera=G,Z.length=0,K.length=0,$.length=0}function Y(G){Z.push(G)}function W(G){K.push(G)}function U(G){$.push(G)}function H(){Q.setup(Z)}function N(G){Q.setupView(Z,G)}let F={lightsArray:Z,shadowsArray:K,lightProbeGridArray:$,camera:null,lights:Q,transmissionRenderTarget:{},textureUnits:0};return{init:X,state:F,setupLights:H,setupLightsView:N,pushLight:Y,pushShadow:W,pushLightProbeGrid:U}}function z5(J){let Q=new WeakMap;function Z($,X=0){let Y=Q.get($),W;if(Y===void 0)W=new yX(J),Q.set($,[W]);else if(X>=Y.length)W=new yX(J),Y.push(W);else W=Y[X];return W}function K(){Q=new WeakMap}return{get:Z,dispose:K}}var _5=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,A5=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,w5=[new h(1,0,0),new h(-1,0,0),new h(0,1,0),new h(0,-1,0),new h(0,0,1),new h(0,0,-1)],P5=[new h(0,-1,0),new h(0,-1,0),new h(0,0,1),new h(0,0,-1),new h(0,-1,0),new h(0,-1,0)],fX=new KJ,g7=new h,XK=new h;function T5(J,Q,Z){let K=new v7,$=new v0,X=new v0,Y=new OJ,W=new hZ,U=new bZ,H={},N=Z.maxTextureSize,F={[Z7]:oJ,[oJ]:Z7,[SJ]:SJ},G=new U9({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new v0},radius:{value:4}},vertexShader:_5,fragmentShader:A5}),D=G.clone();D.defines.HORIZONTAL_PASS=1;let R=new dJ;R.setAttribute("position",new Z9(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));let B=new b0(R,G),q=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=O8;let E=this.type;this.render=function(_,A,O){if(q.enabled===!1)return;if(q.autoUpdate===!1&&q.needsUpdate===!1)return;if(_.length===0)return;if(this.type===H$)j0("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=O8;let V=J.getRenderTarget(),b=J.getActiveCubeFace(),P=J.getActiveMipmapLevel(),f=J.state;if(f.setBlending(M9),f.buffers.depth.getReversed()===!0)f.buffers.color.setClear(0,0,0,0);else f.buffers.color.setClear(1,1,1,1);f.buffers.depth.setTest(!0),f.setScissorTest(!1);let u=E!==this.type;if(u)A.traverse(function(T){if(T.material)if(Array.isArray(T.material))T.material.forEach((p)=>p.needsUpdate=!0);else T.material.needsUpdate=!0});for(let T=0,p=_.length;T<p;T++){let o=_[T],m=o.shadow;if(m===void 0){j0("WebGLShadowMap:",o,"has no shadow.");continue}if(m.autoUpdate===!1&&m.needsUpdate===!1)continue;$.copy(m.mapSize);let Q0=m.getFrameExtents();if($.multiply(Q0),X.copy(m.mapSize),$.x>N||$.y>N){if($.x>N)X.x=Math.floor(N/Q0.x),$.x=X.x*Q0.x,m.mapSize.x=X.x;if($.y>N)X.y=Math.floor(N/Q0.y),$.y=X.y*Q0.y,m.mapSize.y=X.y}let n=J.state.buffers.depth.getReversed();if(m.camera._reversedDepth=n,m.map===null||u===!0){if(m.map!==null){if(m.map.depthTexture!==null)m.map.depthTexture.dispose(),m.map.depthTexture=null;m.map.dispose()}if(this.type===Q7){if(o.isPointLight){j0("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}m.map=new K9($.x,$.y,{format:B8,type:B9,minFilter:xJ,magFilter:xJ,generateMipmaps:!1}),m.map.texture.name=o.name+".shadowMap",m.map.depthTexture=new z8($.x,$.y,m9),m.map.depthTexture.name=o.name+".shadowMapDepth",m.map.depthTexture.format=M8,m.map.depthTexture.compareFunction=null,m.map.depthTexture.minFilter=k9,m.map.depthTexture.magFilter=k9}else{if(o.isPointLight)m.map=new HK($.x),m.map.depthTexture=new vZ($.x,X8);else m.map=new K9($.x,$.y),m.map.depthTexture=new z8($.x,$.y,X8);if(m.map.depthTexture.name=o.name+".shadowMap",m.map.depthTexture.format=M8,this.type===O8)m.map.depthTexture.compareFunction=n?T6:P6,m.map.depthTexture.minFilter=xJ,m.map.depthTexture.magFilter=xJ;else m.map.depthTexture.compareFunction=null,m.map.depthTexture.minFilter=k9,m.map.depthTexture.magFilter=k9}m.camera.updateProjectionMatrix()}if(m.map.isWebGLCubeRenderTarget!==!0&&(m.map.width!==$.x||m.map.height!==$.y))m.map.setSize($.x,$.y);let r=m.map.isWebGLCubeRenderTarget?6:m.getViewportCount();if(o.isPointLight!==!0)m.updateMatrices(o,O);for(let J0=0;J0<r;J0++){let T0=m.getCamera(J0);if(o.isPointLight){let{camera:_0,matrix:HJ}=m,m0=o.distance||_0.far;if(m0!==_0.far)_0.far=m0,_0.updateProjectionMatrix();g7.setFromMatrixPosition(o.matrixWorld),_0.position.copy(g7),XK.copy(_0.position),XK.add(w5[J0]),_0.up.copy(P5[J0]),_0.lookAt(XK),_0.updateMatrixWorld(),HJ.makeTranslation(-g7.x,-g7.y,-g7.z),fX.multiplyMatrices(_0.projectionMatrix,_0.matrixWorldInverse),m._frustum.setFromProjectionMatrix(fX,_0.coordinateSystem,_0.reversedDepth)}if(m.map.isWebGLCubeRenderTarget)J.setRenderTarget(m.map,J0),J.clear();else{if(J0===0)J.setRenderTarget(m.map),J.clear();let _0=m.getViewport(J0);Y.set(X.x*_0.x,X.y*_0.y,X.x*_0.z,X.y*_0.w),f.viewport(Y)}K=m.getFrustum(J0),k(A,O,T0,o,this.type)}if(m.isPointLightShadow!==!0&&this.type===Q7)z(m,O);m.needsUpdate=!1}E=this.type,q.needsUpdate=!1,J.setRenderTarget(V,b,P)};function z(_,A){let O=Q.update(B);if(G.defines.VSM_SAMPLES!==_.blurSamples)G.defines.VSM_SAMPLES=_.blurSamples,D.defines.VSM_SAMPLES=_.blurSamples,G.needsUpdate=!0,D.needsUpdate=!0;if(_.mapPass===null)_.mapPass=new K9($.x,$.y,{format:B8,type:B9});else if(_.mapPass.width!==_.map.width||_.mapPass.height!==_.map.height)_.mapPass.setSize(_.map.width,_.map.height);G.uniforms.shadow_pass.value=_.map.depthTexture,G.uniforms.resolution.value.set(_.map.width,_.map.height),G.uniforms.radius.value=_.radius,J.setRenderTarget(_.mapPass),J.clear(),J.renderBufferDirect(A,null,O,G,B,null),D.uniforms.shadow_pass.value=_.mapPass.texture,D.uniforms.resolution.value.set(_.map.width,_.map.height),D.uniforms.radius.value=_.radius,J.setRenderTarget(_.map),J.clear(),J.renderBufferDirect(A,null,O,D,B,null)}function w(_,A,O,V){let b=null,P=O.isPointLight===!0?_.customDistanceMaterial:_.customDepthMaterial;if(P!==void 0)b=P;else if(b=O.isPointLight===!0?U:W,J.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0||A.alphaToCoverage===!0){let f=b.uuid,u=A.uuid,T=H[f];if(T===void 0)T={},H[f]=T;let p=T[u];if(p===void 0)p=b.clone(),T[u]=p,A.addEventListener("dispose",C);b=p}if(b.visible=A.visible,b.wireframe=A.wireframe,V===Q7)b.side=A.shadowSide!==null?A.shadowSide:A.side;else b.side=A.shadowSide!==null?A.shadowSide:F[A.side];if(b.alphaMap=A.alphaMap,b.alphaTest=A.alphaToCoverage===!0?0.5:A.alphaTest,b.map=A.map,b.clipShadows=A.clipShadows,b.clippingPlanes=A.clippingPlanes,b.clipIntersection=A.clipIntersection,b.displacementMap=A.displacementMap,b.displacementScale=A.displacementScale,b.displacementBias=A.displacementBias,b.wireframeLinewidth=A.wireframeLinewidth,b.linewidth=A.linewidth,O.isPointLight===!0&&b.isMeshDistanceMaterial===!0){let f=J.properties.get(b);f.light=O}return b}function k(_,A,O,V,b){if(_.visible===!1)return;if(_.layers.test(A.layers)&&(_.isMesh||_.isLine||_.isPoints)){if((_.castShadow||_.receiveShadow&&b===Q7)&&(!_.frustumCulled||_.intersectsFrustum(K))){_.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,_.matrixWorld);let u=Q.update(_),T=_.material;if(Array.isArray(T)){let p=u.groups;for(let o=0,m=p.length;o<m;o++){let Q0=p[o],n=T[Q0.materialIndex];if(n&&n.visible){let r=w(_,n,V,b);_.onBeforeShadow(J,_,A,O,u,r,Q0),J.renderBufferDirect(O,null,u,r,_,Q0),_.onAfterShadow(J,_,A,O,u,r,Q0)}}}else if(T.visible){let p=w(_,T,V,b);_.onBeforeShadow(J,_,A,O,u,p,null),J.renderBufferDirect(O,null,u,p,_,null),_.onAfterShadow(J,_,A,O,u,p,null)}}}let f=_.children;for(let u=0,T=f.length;u<T;u++)k(f[u],A,O,V,b)}function C(_){_.target.removeEventListener("dispose",C);for(let O in H){let V=H[O],b=_.target.uuid;if(b in V)V[b].dispose(),delete V[b]}}}function S5(J,Q){function Z(){let y=!1,Y0=new OJ,i=null,U0=new OJ(0,0,0,0);return{setMask:function(O0){if(i!==O0&&!y)J.colorMask(O0,O0,O0,O0),i=O0},setLocked:function(O0){y=O0},setClear:function(O0,t,E0,h0,GJ){if(GJ===!0)O0*=h0,t*=h0,E0*=h0;if(Y0.set(O0,t,E0,h0),U0.equals(Y0)===!1)J.clearColor(O0,t,E0,h0),U0.copy(Y0)},reset:function(){y=!1,i=null,U0.set(-1,0,0,0)}}}function K(){let y=!1,Y0=!1,i=null,U0=null,O0=null;return{setReversed:function(t){if(Y0!==t){let E0=Q.get("EXT_clip_control");if(t)E0.clipControlEXT(E0.LOWER_LEFT_EXT,E0.ZERO_TO_ONE_EXT);else E0.clipControlEXT(E0.LOWER_LEFT_EXT,E0.NEGATIVE_ONE_TO_ONE_EXT);Y0=t;let h0=O0;O0=null,this.setClear(h0)}},getReversed:function(){return Y0},setTest:function(t){if(t)$0(J.DEPTH_TEST);else A0(J.DEPTH_TEST)},setMask:function(t){if(i!==t&&!y)J.depthMask(t),i=t},setFunc:function(t){if(Y0)t=YX[t];if(U0!==t){switch(t){case T$:J.depthFunc(J.NEVER);break;case S$:J.depthFunc(J.ALWAYS);break;case j$:J.depthFunc(J.LESS);break;case fQ:J.depthFunc(J.LEQUAL);break;case v$:J.depthFunc(J.EQUAL);break;case y$:J.depthFunc(J.GEQUAL);break;case f$:J.depthFunc(J.GREATER);break;case h$:J.depthFunc(J.NOTEQUAL);break;default:J.depthFunc(J.LEQUAL)}U0=t}},setLocked:function(t){y=t},setClear:function(t){if(O0!==t){if(O0=t,Y0)t=1-t;J.clearDepth(t)}},reset:function(){y=!1,i=null,U0=null,O0=null,Y0=!1}}}function $(){let y=!1,Y0=null,i=null,U0=null,O0=null,t=null,E0=null,h0=null,GJ=null;return{setTest:function(e0){if(!y)if(e0)$0(J.STENCIL_TEST);else A0(J.STENCIL_TEST)},setMask:function(e0){if(Y0!==e0&&!y)J.stencilMask(e0),Y0=e0},setFunc:function(e0,O9,S9){if(i!==e0||U0!==O9||O0!==S9)J.stencilFunc(e0,O9,S9),i=e0,U0=O9,O0=S9},setOp:function(e0,O9,S9){if(t!==e0||E0!==O9||h0!==S9)J.stencilOp(e0,O9,S9),t=e0,E0=O9,h0=S9},setLocked:function(e0){y=e0},setClear:function(e0){if(GJ!==e0)J.clearStencil(e0),GJ=e0},reset:function(){y=!1,Y0=null,i=null,U0=null,O0=null,t=null,E0=null,h0=null,GJ=null}}}let X=new Z,Y=new K,W=new $,U=new WeakMap,H=new WeakMap,N={},F={},G={},D=new WeakMap,R=[],B=null,q=!1,E=null,z=null,w=null,k=null,C=null,_=null,A=null,O=new x0(0,0,0),V=0,b=!1,P=null,f=null,u=null,T=null,p=null,o=J.getParameter(J.MAX_COMBINED_TEXTURE_IMAGE_UNITS),m=!1,Q0=0,n=J.getParameter(J.VERSION);if(n.indexOf("WebGL")!==-1)Q0=parseFloat(/^WebGL (\d)/.exec(n)[1]),m=Q0>=1;else if(n.indexOf("OpenGL ES")!==-1)Q0=parseFloat(/^OpenGL ES (\d)/.exec(n)[1]),m=Q0>=2;let r=null,J0={},T0=J.getParameter(J.SCISSOR_BOX),_0=J.getParameter(J.VIEWPORT),HJ=new OJ().fromArray(T0),m0=new OJ().fromArray(_0);function s(y,Y0,i,U0){let O0=new Uint8Array(4),t=J.createTexture();J.bindTexture(y,t),J.texParameteri(y,J.TEXTURE_MIN_FILTER,J.NEAREST),J.texParameteri(y,J.TEXTURE_MAG_FILTER,J.NEAREST);for(let E0=0;E0<i;E0++)if(y===J.TEXTURE_3D||y===J.TEXTURE_2D_ARRAY)J.texImage3D(Y0,0,J.RGBA,1,1,U0,0,J.RGBA,J.UNSIGNED_BYTE,O0);else J.texImage2D(Y0+E0,0,J.RGBA,1,1,0,J.RGBA,J.UNSIGNED_BYTE,O0);return t}let Z0={};Z0[J.TEXTURE_2D]=s(J.TEXTURE_2D,J.TEXTURE_2D,1),Z0[J.TEXTURE_CUBE_MAP]=s(J.TEXTURE_CUBE_MAP,J.TEXTURE_CUBE_MAP_POSITIVE_X,6),Z0[J.TEXTURE_2D_ARRAY]=s(J.TEXTURE_2D_ARRAY,J.TEXTURE_2D_ARRAY,1,1),Z0[J.TEXTURE_3D]=s(J.TEXTURE_3D,J.TEXTURE_3D,1,1),X.setClear(0,0,0,1),Y.setClear(1),W.setClear(0),$0(J.DEPTH_TEST),Y.setFunc(fQ),jJ(!1),qJ(jQ),$0(J.CULL_FACE),QJ(M9);function $0(y){if(N[y]!==!0)J.enable(y),N[y]=!0}function A0(y){if(N[y]!==!1)J.disable(y),N[y]=!1}function S0(y,Y0){if(G[y]!==Y0){if(J.bindFramebuffer(y,Y0),G[y]=Y0,y===J.DRAW_FRAMEBUFFER)G[J.FRAMEBUFFER]=Y0;if(y===J.FRAMEBUFFER)G[J.DRAW_FRAMEBUFFER]=Y0;return!0}return!1}function C0(y,Y0){let i=R,U0=!1;if(y){if(i=D.get(Y0),i===void 0)i=[],D.set(Y0,i);let O0=y.textures;if(i.length!==O0.length||i[0]!==J.COLOR_ATTACHMENT0){for(let t=0,E0=O0.length;t<E0;t++)i[t]=J.COLOR_ATTACHMENT0+t;i.length=O0.length,U0=!0}}else if(i[0]!==J.BACK)i[0]=J.BACK,U0=!0;if(U0)J.drawBuffers(i)}function CJ(y){if(B!==y)return J.useProgram(y),B=y,!0;return!1}let d0={[K7]:J.FUNC_ADD,[N$]:J.FUNC_SUBTRACT,[E$]:J.FUNC_REVERSE_SUBTRACT};d0[F$]=J.MIN,d0[q$]=J.MAX;let i0={[D$]:J.ZERO,[O$]:J.ONE,[R$]:J.SRC_COLOR,[V$]:J.SRC_ALPHA,[z$]:J.SRC_ALPHA_SATURATE,[I$]:J.DST_COLOR,[k$]:J.DST_ALPHA,[L$]:J.ONE_MINUS_SRC_COLOR,[M$]:J.ONE_MINUS_SRC_ALPHA,[C$]:J.ONE_MINUS_DST_COLOR,[B$]:J.ONE_MINUS_DST_ALPHA,[_$]:J.CONSTANT_COLOR,[A$]:J.ONE_MINUS_CONSTANT_COLOR,[w$]:J.CONSTANT_ALPHA,[P$]:J.ONE_MINUS_CONSTANT_ALPHA};function QJ(y,Y0,i,U0,O0,t,E0,h0,GJ,e0){if(y===M9){if(q===!0)A0(J.BLEND),q=!1;return}if(q===!1)$0(J.BLEND),q=!0;if(y!==G$){if(y!==E||e0!==b){if(z!==K7||C!==K7)J.blendEquation(J.FUNC_ADD),z=K7,C=K7;if(e0)switch(y){case R8:J.blendFuncSeparate(J.ONE,J.ONE_MINUS_SRC_ALPHA,J.ONE,J.ONE_MINUS_SRC_ALPHA);break;case $8:J.blendFunc(J.ONE,J.ONE);break;case vQ:J.blendFuncSeparate(J.ZERO,J.ONE_MINUS_SRC_COLOR,J.ZERO,J.ONE);break;case yQ:J.blendFuncSeparate(J.DST_COLOR,J.ONE_MINUS_SRC_ALPHA,J.ZERO,J.ONE);break;default:P0("WebGLState: Invalid blending: ",y);break}else switch(y){case R8:J.blendFuncSeparate(J.SRC_ALPHA,J.ONE_MINUS_SRC_ALPHA,J.ONE,J.ONE_MINUS_SRC_ALPHA);break;case $8:J.blendFuncSeparate(J.SRC_ALPHA,J.ONE,J.ONE,J.ONE);break;case vQ:P0("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case yQ:P0("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:P0("WebGLState: Invalid blending: ",y);break}w=null,k=null,_=null,A=null,O.set(0,0,0),V=0,E=y,b=e0}return}if(O0=O0||Y0,t=t||i,E0=E0||U0,Y0!==z||O0!==C)J.blendEquationSeparate(d0[Y0],d0[O0]),z=Y0,C=O0;if(i!==w||U0!==k||t!==_||E0!==A)J.blendFuncSeparate(i0[i],i0[U0],i0[t],i0[E0]),w=i,k=U0,_=t,A=E0;if(h0.equals(O)===!1||GJ!==V)J.blendColor(h0.r,h0.g,h0.b,GJ),O.copy(h0),V=GJ;E=y,b=!1}function o0(y,Y0){y.side===SJ?A0(J.CULL_FACE):$0(J.CULL_FACE);let i=y.side===oJ;if(Y0)i=!i;jJ(i),y.blending===R8&&y.transparent===!1?QJ(M9):QJ(y.blending,y.blendEquation,y.blendSrc,y.blendDst,y.blendEquationAlpha,y.blendSrcAlpha,y.blendDstAlpha,y.blendColor,y.blendAlpha,y.premultipliedAlpha),Y.setFunc(y.depthFunc),Y.setTest(y.depthTest),Y.setMask(y.depthWrite),X.setMask(y.colorWrite);let U0=y.stencilWrite;if(W.setTest(U0),U0)W.setMask(y.stencilWriteMask),W.setFunc(y.stencilFunc,y.stencilRef,y.stencilFuncMask),W.setOp(y.stencilFail,y.stencilZFail,y.stencilZPass);zJ(y.polygonOffset,y.polygonOffsetFactor,y.polygonOffsetUnits),y.alphaToCoverage===!0?$0(J.SAMPLE_ALPHA_TO_COVERAGE):A0(J.SAMPLE_ALPHA_TO_COVERAGE)}function jJ(y){if(P!==y){if(y)J.frontFace(J.CW);else J.frontFace(J.CCW);P=y}}function qJ(y){if(y!==W$){if($0(J.CULL_FACE),y!==f)if(y===jQ)J.cullFace(J.BACK);else if(y===U$)J.cullFace(J.FRONT);else J.cullFace(J.FRONT_AND_BACK)}else A0(J.CULL_FACE);f=y}function sJ(y){if(y!==u){if(m)J.lineWidth(y);u=y}}function zJ(y,Y0,i){if(y){if($0(J.POLYGON_OFFSET_FILL),T!==Y0||p!==i){if(T=Y0,p=i,Y.getReversed())Y0=-Y0;J.polygonOffset(Y0,i)}}else A0(J.POLYGON_OFFSET_FILL)}function _J(y){if(y)$0(J.SCISSOR_TEST);else A0(J.SCISSOR_TEST)}function j(y){if(y===void 0)y=J.TEXTURE0+o-1;if(r!==y)J.activeTexture(y),r=y}function iJ(y,Y0,i){if(i===void 0)if(r===null)i=J.TEXTURE0+o-1;else i=r;let U0=J0[i];if(U0===void 0)U0={type:void 0,texture:void 0},J0[i]=U0;if(U0.type!==y||U0.texture!==Y0){if(r!==i)J.activeTexture(i),r=i;J.bindTexture(y,Y0||Z0[y]),U0.type=y,U0.texture=Y0}}function t0(){let y=J0[r];if(y!==void 0&&y.type!==void 0)J.bindTexture(y.type,null),y.type=void 0,y.texture=void 0}function RJ(){try{J.compressedTexImage2D(...arguments)}catch(y){P0("WebGLState:",y)}}function I(){try{J.compressedTexImage3D(...arguments)}catch(y){P0("WebGLState:",y)}}function L(){try{J.texSubImage2D(...arguments)}catch(y){P0("WebGLState:",y)}}function S(){try{J.texSubImage3D(...arguments)}catch(y){P0("WebGLState:",y)}}function l(){try{J.compressedTexSubImage2D(...arguments)}catch(y){P0("WebGLState:",y)}}function e(){try{J.compressedTexSubImage3D(...arguments)}catch(y){P0("WebGLState:",y)}}function X0(){try{J.texStorage2D(...arguments)}catch(y){P0("WebGLState:",y)}}function H0(){try{J.texStorage3D(...arguments)}catch(y){P0("WebGLState:",y)}}function c(){try{J.texImage2D(...arguments)}catch(y){P0("WebGLState:",y)}}function a(){try{J.texImage3D(...arguments)}catch(y){P0("WebGLState:",y)}}function D0(y){if(F[y]!==void 0)return F[y];else return J.getParameter(y)}function I0(y,Y0){if(F[y]!==Y0)J.pixelStorei(y,Y0),F[y]=Y0}function G0(y){if(HJ.equals(y)===!1)J.scissor(y.x,y.y,y.z,y.w),HJ.copy(y)}function K0(y){if(m0.equals(y)===!1)J.viewport(y.x,y.y,y.z,y.w),m0.copy(y)}function z0(y,Y0){let i=H.get(Y0);if(i===void 0)i=new WeakMap,H.set(Y0,i);let U0=i.get(y);if(U0===void 0)U0=J.getUniformBlockIndex(Y0,y.name),i.set(y,U0)}function w0(y,Y0){let U0=H.get(Y0).get(y);if(U.get(Y0)!==U0)J.uniformBlockBinding(Y0,U0,y.__bindingPointIndex),U.set(Y0,U0)}function r0(){J.disable(J.BLEND),J.disable(J.CULL_FACE),J.disable(J.DEPTH_TEST),J.disable(J.POLYGON_OFFSET_FILL),J.disable(J.SCISSOR_TEST),J.disable(J.STENCIL_TEST),J.disable(J.SAMPLE_ALPHA_TO_COVERAGE),J.blendEquation(J.FUNC_ADD),J.blendFunc(J.ONE,J.ZERO),J.blendFuncSeparate(J.ONE,J.ZERO,J.ONE,J.ZERO),J.blendColor(0,0,0,0),J.colorMask(!0,!0,!0,!0),J.clearColor(0,0,0,0),J.depthMask(!0),J.depthFunc(J.LESS),Y.setReversed(!1),J.clearDepth(1),J.stencilMask(4294967295),J.stencilFunc(J.ALWAYS,0,4294967295),J.stencilOp(J.KEEP,J.KEEP,J.KEEP),J.clearStencil(0),J.cullFace(J.BACK),J.frontFace(J.CCW),J.polygonOffset(0,0),J.activeTexture(J.TEXTURE0),J.bindFramebuffer(J.FRAMEBUFFER,null),J.bindFramebuffer(J.DRAW_FRAMEBUFFER,null),J.bindFramebuffer(J.READ_FRAMEBUFFER,null),J.useProgram(null),J.lineWidth(1),J.scissor(0,0,J.canvas.width,J.canvas.height),J.viewport(0,0,J.canvas.width,J.canvas.height),J.pixelStorei(J.PACK_ALIGNMENT,4),J.pixelStorei(J.UNPACK_ALIGNMENT,4),J.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,!1),J.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),J.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,J.BROWSER_DEFAULT_WEBGL),J.pixelStorei(J.PACK_ROW_LENGTH,0),J.pixelStorei(J.PACK_SKIP_PIXELS,0),J.pixelStorei(J.PACK_SKIP_ROWS,0),J.pixelStorei(J.UNPACK_ROW_LENGTH,0),J.pixelStorei(J.UNPACK_IMAGE_HEIGHT,0),J.pixelStorei(J.UNPACK_SKIP_PIXELS,0),J.pixelStorei(J.UNPACK_SKIP_ROWS,0),J.pixelStorei(J.UNPACK_SKIP_IMAGES,0),N={},F={},r=null,J0={},G={},D=new WeakMap,R=[],B=null,q=!1,E=null,z=null,w=null,k=null,C=null,_=null,A=null,O=new x0(0,0,0),V=0,b=!1,P=null,f=null,u=null,T=null,p=null,HJ.set(0,0,J.canvas.width,J.canvas.height),m0.set(0,0,J.canvas.width,J.canvas.height),X.reset(),Y.reset(),W.reset()}return{buffers:{color:X,depth:Y,stencil:W},enable:$0,disable:A0,bindFramebuffer:S0,drawBuffers:C0,useProgram:CJ,setBlending:QJ,setMaterial:o0,setFlipSided:jJ,setCullFace:qJ,setLineWidth:sJ,setPolygonOffset:zJ,setScissorTest:_J,activeTexture:j,bindTexture:iJ,unbindTexture:t0,compressedTexImage2D:RJ,compressedTexImage3D:I,texImage2D:c,texImage3D:a,pixelStorei:I0,getParameter:D0,updateUBOMapping:z0,uniformBlockBinding:w0,texStorage2D:X0,texStorage3D:H0,texSubImage2D:L,texSubImage3D:S,compressedTexSubImage2D:l,compressedTexSubImage3D:e,scissor:G0,viewport:K0,reset:r0}}function j5(J,Q,Z,K,$,X,Y){let W=Q.has("WEBGL_multisampled_render_to_texture")?Q.get("WEBGL_multisampled_render_to_texture"):null,U=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),H=new v0,N=new WeakMap,F=new Set,G,D=new WeakMap,R=!1;try{R=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(I){}function B(I,L){return R?new OffscreenCanvas(I,L):B7("canvas")}function q(I,L,S){let l=1,e=RJ(I);if(e.width>S||e.height>S)l=S/Math.max(e.width,e.height);if(l<1)if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&I instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&I instanceof ImageBitmap||typeof VideoFrame<"u"&&I instanceof VideoFrame){let X0=Math.floor(l*e.width),H0=Math.floor(l*e.height);if(G===void 0)G=B(X0,H0);let c=L?B(X0,H0):G;return c.width=X0,c.height=H0,c.getContext("2d").drawImage(I,0,0,X0,H0),j0("WebGLRenderer: Texture has been resized from ("+e.width+"x"+e.height+") to ("+X0+"x"+H0+")."),c}else{if("data"in I)j0("WebGLRenderer: Image in DataTexture is too big ("+e.width+"x"+e.height+").");return I}return I}function E(I){return I.generateMipmaps}function z(I){J.generateMipmap(I)}function w(I){if(I.isWebGLCubeRenderTarget)return J.TEXTURE_CUBE_MAP;if(I.isWebGL3DRenderTarget)return J.TEXTURE_3D;if(I.isWebGLArrayRenderTarget||I.isCompressedArrayTexture)return J.TEXTURE_2D_ARRAY;return J.TEXTURE_2D}function k(I,L,S,l,e,X0=!1){if(I!==null){if(J[I]!==void 0)return J[I];j0("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+I+"'")}let H0;if(l){if(H0=Q.get("EXT_texture_norm16"),!H0)j0("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension")}let c=L;if(L===J.RED){if(S===J.FLOAT)c=J.R32F;if(S===J.HALF_FLOAT)c=J.R16F;if(S===J.UNSIGNED_BYTE)c=J.R8;if(S===J.UNSIGNED_SHORT&&H0)c=H0.R16_EXT;if(S===J.SHORT&&H0)c=H0.R16_SNORM_EXT}if(L===J.RED_INTEGER){if(S===J.UNSIGNED_BYTE)c=J.R8UI;if(S===J.UNSIGNED_SHORT)c=J.R16UI;if(S===J.UNSIGNED_INT)c=J.R32UI;if(S===J.BYTE)c=J.R8I;if(S===J.SHORT)c=J.R16I;if(S===J.INT)c=J.R32I}if(L===J.RG){if(S===J.FLOAT)c=J.RG32F;if(S===J.HALF_FLOAT)c=J.RG16F;if(S===J.UNSIGNED_BYTE)c=J.RG8;if(S===J.UNSIGNED_SHORT&&H0)c=H0.RG16_EXT;if(S===J.SHORT&&H0)c=H0.RG16_SNORM_EXT}if(L===J.RG_INTEGER){if(S===J.UNSIGNED_BYTE)c=J.RG8UI;if(S===J.UNSIGNED_SHORT)c=J.RG16UI;if(S===J.UNSIGNED_INT)c=J.RG32UI;if(S===J.BYTE)c=J.RG8I;if(S===J.SHORT)c=J.RG16I;if(S===J.INT)c=J.RG32I}if(L===J.RGB_INTEGER){if(S===J.UNSIGNED_BYTE)c=J.RGB8UI;if(S===J.UNSIGNED_SHORT)c=J.RGB16UI;if(S===J.UNSIGNED_INT)c=J.RGB32UI;if(S===J.BYTE)c=J.RGB8I;if(S===J.SHORT)c=J.RGB16I;if(S===J.INT)c=J.RGB32I}if(L===J.RGBA_INTEGER){if(S===J.UNSIGNED_BYTE)c=J.RGBA8UI;if(S===J.UNSIGNED_SHORT)c=J.RGBA16UI;if(S===J.UNSIGNED_INT)c=J.RGBA32UI;if(S===J.BYTE)c=J.RGBA8I;if(S===J.SHORT)c=J.RGBA16I;if(S===J.INT)c=J.RGBA32I}if(L===J.RGB){if(S===J.UNSIGNED_SHORT&&H0)c=H0.RGB16_EXT;if(S===J.SHORT&&H0)c=H0.RGB16_SNORM_EXT;if(S===J.UNSIGNED_INT_5_9_9_9_REV)c=J.RGB9_E5;if(S===J.UNSIGNED_INT_10F_11F_11F_REV)c=J.R11F_G11F_B10F}if(L===J.RGBA){let a=X0?_Z:u0.getTransfer(e);if(S===J.FLOAT)c=J.RGBA32F;if(S===J.HALF_FLOAT)c=J.RGBA16F;if(S===J.UNSIGNED_BYTE)c=a===UJ?J.SRGB8_ALPHA8:J.RGBA8;if(S===J.UNSIGNED_SHORT&&H0)c=H0.RGBA16_EXT;if(S===J.SHORT&&H0)c=H0.RGBA16_SNORM_EXT;if(S===J.UNSIGNED_SHORT_4_4_4_4)c=J.RGBA4;if(S===J.UNSIGNED_SHORT_5_5_5_1)c=J.RGB5_A1}if(c===J.R16F||c===J.R32F||c===J.RG16F||c===J.RG32F||c===J.RGBA16F||c===J.RGBA32F)Q.get("EXT_color_buffer_float");return c}function C(I,L){let S;if(I){if(L===null||L===X8||L===X7)S=J.DEPTH24_STENCIL8;else if(L===m9)S=J.DEPTH32F_STENCIL8;else if(L===w7)S=J.DEPTH24_STENCIL8,j0("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}else if(L===null||L===X8||L===X7)S=J.DEPTH_COMPONENT24;else if(L===m9)S=J.DEPTH_COMPONENT32F;else if(L===w7)S=J.DEPTH_COMPONENT16;return S}function _(I,L){if(E(I)===!0||I.isFramebufferTexture&&I.minFilter!==k9&&I.minFilter!==xJ)return Math.log2(Math.max(L.width,L.height))+1;else if(I.mipmaps!==void 0&&I.mipmaps.length>0)return I.mipmaps.length;else if(I.isCompressedTexture&&Array.isArray(I.image))return L.mipmaps.length;else return 1}function A(I){let L=I.target;if(L.removeEventListener("dispose",A),V(L),L.isVideoTexture)N.delete(L);if(L.isHTMLTexture)F.delete(L)}function O(I){let L=I.target;L.removeEventListener("dispose",O),P(L)}function V(I){let L=K.get(I);if(L.__webglInit===void 0)return;let S=I.source,l=D.get(S);if(l){let e=l[L.__cacheKey];if(e.usedTimes--,e.usedTimes===0)b(I);if(Object.keys(l).length===0)D.delete(S)}K.remove(I)}function b(I){let L=K.get(I);J.deleteTexture(L.__webglTexture);let S=I.source,l=D.get(S);delete l[L.__cacheKey],Y.memory.textures--}function P(I){let L=K.get(I);if(I.depthTexture)I.depthTexture.dispose(),K.remove(I.depthTexture);if(I.isWebGLCubeRenderTarget)for(let l=0;l<6;l++){if(Array.isArray(L.__webglFramebuffer[l]))for(let e=0;e<L.__webglFramebuffer[l].length;e++)J.deleteFramebuffer(L.__webglFramebuffer[l][e]);else J.deleteFramebuffer(L.__webglFramebuffer[l]);if(L.__webglDepthbuffer)J.deleteRenderbuffer(L.__webglDepthbuffer[l])}else{if(Array.isArray(L.__webglFramebuffer))for(let l=0;l<L.__webglFramebuffer.length;l++)J.deleteFramebuffer(L.__webglFramebuffer[l]);else J.deleteFramebuffer(L.__webglFramebuffer);if(L.__webglDepthbuffer)J.deleteRenderbuffer(L.__webglDepthbuffer);if(L.__webglMultisampledFramebuffer)J.deleteFramebuffer(L.__webglMultisampledFramebuffer);if(L.__webglColorRenderbuffer){for(let l=0;l<L.__webglColorRenderbuffer.length;l++)if(L.__webglColorRenderbuffer[l])J.deleteRenderbuffer(L.__webglColorRenderbuffer[l])}if(L.__webglDepthRenderbuffer)J.deleteRenderbuffer(L.__webglDepthRenderbuffer)}let S=I.textures;for(let l=0,e=S.length;l<e;l++){let X0=K.get(S[l]);if(X0.__webglTexture)J.deleteTexture(X0.__webglTexture),Y.memory.textures--;K.remove(S[l])}K.remove(I)}let f=0;function u(){f=0}function T(){return f}function p(I){f=I}function o(){let I=f;if(I>=$.maxTextures)j0("WebGLTextures: Trying to use "+(I+1)+" texture units while this GPU supports only "+$.maxTextures);return f+=1,I}function m(I){let L=[];return L.push(I.wrapS),L.push(I.wrapT),L.push(I.wrapR||0),L.push(I.magFilter),L.push(I.minFilter),L.push(I.anisotropy),L.push(I.internalFormat),L.push(I.format),L.push(I.type),L.push(I.generateMipmaps),L.push(I.premultiplyAlpha),L.push(I.flipY),L.push(I.unpackAlignment),L.push(I.colorSpace),L.join()}function Q0(I,L){let S=K.get(I);if(I.isVideoTexture)iJ(I);if(I.isRenderTargetTexture===!1&&I.isExternalTexture!==!0&&I.version>0&&S.__version!==I.version){let l=I.image;if(l===null)j0("WebGLRenderer: Texture marked for update but no image data found.");else if(l.complete===!1)j0("WebGLRenderer: Texture marked for update but image is incomplete");else{A0(S,I,L);return}}else if(I.isExternalTexture)S.__webglTexture=I.sourceTexture?I.sourceTexture:null;Z.bindTexture(J.TEXTURE_2D,S.__webglTexture,J.TEXTURE0+L)}function n(I,L){let S=K.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&S.__version!==I.version){A0(S,I,L);return}else if(I.isExternalTexture)S.__webglTexture=I.sourceTexture?I.sourceTexture:null;Z.bindTexture(J.TEXTURE_2D_ARRAY,S.__webglTexture,J.TEXTURE0+L)}function r(I,L){let S=K.get(I);if(I.isRenderTargetTexture===!1&&I.version>0&&S.__version!==I.version){A0(S,I,L);return}Z.bindTexture(J.TEXTURE_3D,S.__webglTexture,J.TEXTURE0+L)}function J0(I,L){let S=K.get(I);if(I.isCubeDepthTexture!==!0&&I.version>0&&S.__version!==I.version){S0(S,I,L);return}Z.bindTexture(J.TEXTURE_CUBE_MAP,S.__webglTexture,J.TEXTURE0+L)}let T0={[p$]:J.REPEAT,[k6]:J.CLAMP_TO_EDGE,[m$]:J.MIRRORED_REPEAT},_0={[k9]:J.NEAREST,[l$]:J.NEAREST_MIPMAP_NEAREST,[A7]:J.NEAREST_MIPMAP_LINEAR,[xJ]:J.LINEAR,[B6]:J.LINEAR_MIPMAP_NEAREST,[V8]:J.LINEAR_MIPMAP_LINEAR},HJ={[r$]:J.NEVER,[ZX]:J.ALWAYS,[t$]:J.LESS,[P6]:J.LEQUAL,[e$]:J.EQUAL,[T6]:J.GEQUAL,[JX]:J.GREATER,[QX]:J.NOTEQUAL};function m0(I,L){if(L.type===m9&&Q.has("OES_texture_float_linear")===!1&&(L.magFilter===xJ||L.magFilter===B6||L.magFilter===A7||L.magFilter===V8||L.minFilter===xJ||L.minFilter===B6||L.minFilter===A7||L.minFilter===V8))j0("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");if(J.texParameteri(I,J.TEXTURE_WRAP_S,T0[L.wrapS]),J.texParameteri(I,J.TEXTURE_WRAP_T,T0[L.wrapT]),I===J.TEXTURE_3D||I===J.TEXTURE_2D_ARRAY)J.texParameteri(I,J.TEXTURE_WRAP_R,T0[L.wrapR]);if(J.texParameteri(I,J.TEXTURE_MAG_FILTER,_0[L.magFilter]),J.texParameteri(I,J.TEXTURE_MIN_FILTER,_0[L.minFilter]),L.compareFunction)J.texParameteri(I,J.TEXTURE_COMPARE_MODE,J.COMPARE_REF_TO_TEXTURE),J.texParameteri(I,J.TEXTURE_COMPARE_FUNC,HJ[L.compareFunction]);if(Q.has("EXT_texture_filter_anisotropic")===!0){if(L.magFilter===k9)return;if(L.minFilter!==A7&&L.minFilter!==V8)return;if(L.type===m9&&Q.has("OES_texture_float_linear")===!1)return;if(L.anisotropy>1||K.get(L).__currentAnisotropy){let S=Q.get("EXT_texture_filter_anisotropic");J.texParameterf(I,S.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(L.anisotropy,$.getMaxAnisotropy())),K.get(L).__currentAnisotropy=L.anisotropy}}}function s(I,L){let S=!1;if(I.__webglInit===void 0)I.__webglInit=!0,L.addEventListener("dispose",A);let l=L.source,e=D.get(l);if(e===void 0)e={},D.set(l,e);let X0=m(L);if(X0!==I.__cacheKey){if(e[X0]===void 0)e[X0]={texture:J.createTexture(),usedTimes:0},Y.memory.textures++,S=!0;e[X0].usedTimes++;let H0=e[I.__cacheKey];if(H0!==void 0){if(e[I.__cacheKey].usedTimes--,H0.usedTimes===0)b(L)}I.__cacheKey=X0,I.__webglTexture=e[X0].texture}return S}function Z0(I,L,S){return Math.floor(Math.floor(I/S)/L)}function $0(I,L,S,l){let X0=I.updateRanges;if(X0.length===0)Z.texSubImage2D(J.TEXTURE_2D,0,0,0,L.width,L.height,S,l,L.data);else{X0.sort((I0,G0)=>I0.start-G0.start);let H0=0;for(let I0=1;I0<X0.length;I0++){let G0=X0[H0],K0=X0[I0],z0=G0.start+G0.count,w0=Z0(K0.start,L.width,4),r0=Z0(G0.start,L.width,4);if(K0.start<=z0+1&&w0===r0&&Z0(K0.start+K0.count-1,L.width,4)===w0)G0.count=Math.max(G0.count,K0.start+K0.count-G0.start);else++H0,X0[H0]=K0}X0.length=H0+1;let c=Z.getParameter(J.UNPACK_ROW_LENGTH),a=Z.getParameter(J.UNPACK_SKIP_PIXELS),D0=Z.getParameter(J.UNPACK_SKIP_ROWS);Z.pixelStorei(J.UNPACK_ROW_LENGTH,L.width);for(let I0=0,G0=X0.length;I0<G0;I0++){let K0=X0[I0],z0=Math.floor(K0.start/4),w0=Math.ceil(K0.count/4),r0=z0%L.width,y=Math.floor(z0/L.width),Y0=w0,i=1;Z.pixelStorei(J.UNPACK_SKIP_PIXELS,r0),Z.pixelStorei(J.UNPACK_SKIP_ROWS,y),Z.texSubImage2D(J.TEXTURE_2D,0,r0,y,Y0,1,S,l,L.data)}I.clearUpdateRanges(),Z.pixelStorei(J.UNPACK_ROW_LENGTH,c),Z.pixelStorei(J.UNPACK_SKIP_PIXELS,a),Z.pixelStorei(J.UNPACK_SKIP_ROWS,D0)}}function A0(I,L,S){let l=J.TEXTURE_2D;if(L.isDataArrayTexture||L.isCompressedArrayTexture)l=J.TEXTURE_2D_ARRAY;if(L.isData3DTexture)l=J.TEXTURE_3D;let e=s(I,L),X0=L.source;Z.bindTexture(l,I.__webglTexture,J.TEXTURE0+S);let H0=K.get(X0);if(X0.version!==H0.__version||e===!0){if(Z.activeTexture(J.TEXTURE0+S),(typeof ImageBitmap<"u"&&L.image instanceof ImageBitmap)===!1){let i=u0.getPrimaries(u0.workingColorSpace),U0=L.colorSpace===I8?null:u0.getPrimaries(L.colorSpace),O0=L.colorSpace===I8||i===U0?J.NONE:J.BROWSER_DEFAULT_WEBGL;Z.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,L.flipY),Z.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),Z.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,O0)}Z.pixelStorei(J.UNPACK_ALIGNMENT,L.unpackAlignment);let a=q(L.image,!1,$.maxTextureSize);a=t0(L,a);let D0=X.convert(L.format,L.colorSpace),I0=X.convert(L.type),G0=k(L.internalFormat,D0,I0,L.normalized,L.colorSpace,L.isVideoTexture);m0(l,L);let K0,z0=L.mipmaps,w0=L.isVideoTexture!==!0,r0=H0.__version===void 0||e===!0,y=X0.dataReady,Y0=_(L,a);if(L.isDepthTexture){if(G0=C(L.format===k8,L.type),r0)if(w0)Z.texStorage2D(J.TEXTURE_2D,1,G0,a.width,a.height);else Z.texImage2D(J.TEXTURE_2D,0,G0,a.width,a.height,0,D0,I0,null)}else if(L.isDataTexture)if(z0.length>0){if(w0&&r0)Z.texStorage2D(J.TEXTURE_2D,Y0,G0,z0[0].width,z0[0].height);for(let i=0,U0=z0.length;i<U0;i++)if(K0=z0[i],w0){if(y)Z.texSubImage2D(J.TEXTURE_2D,i,0,0,K0.width,K0.height,D0,I0,K0.data)}else Z.texImage2D(J.TEXTURE_2D,i,G0,K0.width,K0.height,0,D0,I0,K0.data);L.generateMipmaps=!1}else if(w0){if(r0)Z.texStorage2D(J.TEXTURE_2D,Y0,G0,a.width,a.height);if(y)$0(L,a,D0,I0)}else Z.texImage2D(J.TEXTURE_2D,0,G0,a.width,a.height,0,D0,I0,a.data);else if(L.isCompressedTexture)if(L.isCompressedArrayTexture){if(w0&&r0)Z.texStorage3D(J.TEXTURE_2D_ARRAY,Y0,G0,z0[0].width,z0[0].height,a.depth);for(let i=0,U0=z0.length;i<U0;i++)if(K0=z0[i],L.format!==I9)if(D0!==null)if(w0){if(y)if(L.layerUpdates.size>0){let O0=eZ(K0.width,K0.height,L.format,L.type);for(let t of L.layerUpdates){let E0=K0.data.subarray(t*O0/K0.data.BYTES_PER_ELEMENT,(t+1)*O0/K0.data.BYTES_PER_ELEMENT);Z.compressedTexSubImage3D(J.TEXTURE_2D_ARRAY,i,0,0,t,K0.width,K0.height,1,D0,E0)}}else Z.compressedTexSubImage3D(J.TEXTURE_2D_ARRAY,i,0,0,0,K0.width,K0.height,a.depth,D0,K0.data)}else Z.compressedTexImage3D(J.TEXTURE_2D_ARRAY,i,G0,K0.width,K0.height,a.depth,0,K0.data,0,0);else j0("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(w0){if(y)Z.texSubImage3D(J.TEXTURE_2D_ARRAY,i,0,0,0,K0.width,K0.height,a.depth,D0,I0,K0.data)}else Z.texImage3D(J.TEXTURE_2D_ARRAY,i,G0,K0.width,K0.height,a.depth,0,D0,I0,K0.data);if(L.layerUpdates.size>0)L.clearLayerUpdates()}else{if(w0&&r0)Z.texStorage2D(J.TEXTURE_2D,Y0,G0,z0[0].width,z0[0].height);for(let i=0,U0=z0.length;i<U0;i++)if(K0=z0[i],L.format!==I9)if(D0!==null)if(w0){if(y)Z.compressedTexSubImage2D(J.TEXTURE_2D,i,0,0,K0.width,K0.height,D0,K0.data)}else Z.compressedTexImage2D(J.TEXTURE_2D,i,G0,K0.width,K0.height,0,K0.data);else j0("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(w0){if(y)Z.texSubImage2D(J.TEXTURE_2D,i,0,0,K0.width,K0.height,D0,I0,K0.data)}else Z.texImage2D(J.TEXTURE_2D,i,G0,K0.width,K0.height,0,D0,I0,K0.data)}else if(L.isDataArrayTexture)if(w0){if(r0)Z.texStorage3D(J.TEXTURE_2D_ARRAY,Y0,G0,a.width,a.height,a.depth);if(y)if(L.layerUpdates.size>0){let i=eZ(a.width,a.height,L.format,L.type);for(let U0 of L.layerUpdates){let O0=a.data.subarray(U0*i/a.data.BYTES_PER_ELEMENT,(U0+1)*i/a.data.BYTES_PER_ELEMENT);Z.texSubImage3D(J.TEXTURE_2D_ARRAY,0,0,0,U0,a.width,a.height,1,D0,I0,O0)}L.clearLayerUpdates()}else Z.texSubImage3D(J.TEXTURE_2D_ARRAY,0,0,0,0,a.width,a.height,a.depth,D0,I0,a.data)}else Z.texImage3D(J.TEXTURE_2D_ARRAY,0,G0,a.width,a.height,a.depth,0,D0,I0,a.data);else if(L.isData3DTexture)if(w0){if(r0)Z.texStorage3D(J.TEXTURE_3D,Y0,G0,a.width,a.height,a.depth);if(y)Z.texSubImage3D(J.TEXTURE_3D,0,0,0,0,a.width,a.height,a.depth,D0,I0,a.data)}else Z.texImage3D(J.TEXTURE_3D,0,G0,a.width,a.height,a.depth,0,D0,I0,a.data);else if(L.isFramebufferTexture){if(r0)if(w0)Z.texStorage2D(J.TEXTURE_2D,Y0,G0,a.width,a.height);else{let{width:i,height:U0}=a;for(let O0=0;O0<Y0;O0++)Z.texImage2D(J.TEXTURE_2D,O0,G0,i,U0,0,D0,I0,null),i>>=1,U0>>=1}}else if(L.isHTMLTexture){if("texElementImage2D"in J){let i=J.canvas;if(!i.hasAttribute("layoutsubtree"))i.setAttribute("layoutsubtree","true");if(a.parentNode!==i){i.appendChild(a),F.add(L),i.onpaint=(U0)=>{let O0=U0.changedElements;for(let t of F)if(O0.includes(t.image))t.needsUpdate=!0},i.requestPaint();return}if(J.texElementImage2D.length===3)J.texElementImage2D(J.TEXTURE_2D,J.RGBA8,a);else{let{RGBA:O0,RGBA:t,UNSIGNED_BYTE:E0}=J;J.texElementImage2D(J.TEXTURE_2D,0,O0,t,E0,a)}J.texParameteri(J.TEXTURE_2D,J.TEXTURE_MIN_FILTER,J.LINEAR),J.texParameteri(J.TEXTURE_2D,J.TEXTURE_WRAP_S,J.CLAMP_TO_EDGE),J.texParameteri(J.TEXTURE_2D,J.TEXTURE_WRAP_T,J.CLAMP_TO_EDGE)}}else if(z0.length>0){if(w0&&r0){let i=RJ(z0[0]);Z.texStorage2D(J.TEXTURE_2D,Y0,G0,i.width,i.height)}for(let i=0,U0=z0.length;i<U0;i++)if(K0=z0[i],w0){if(y)Z.texSubImage2D(J.TEXTURE_2D,i,0,0,D0,I0,K0)}else Z.texImage2D(J.TEXTURE_2D,i,G0,D0,I0,K0);L.generateMipmaps=!1}else if(w0){if(r0){let i=RJ(a);Z.texStorage2D(J.TEXTURE_2D,Y0,G0,i.width,i.height)}if(y)Z.texSubImage2D(J.TEXTURE_2D,0,0,0,D0,I0,a)}else Z.texImage2D(J.TEXTURE_2D,0,G0,D0,I0,a);if(E(L))z(l);if(H0.__version=X0.version,L.onUpdate)L.onUpdate(L)}I.__version=L.version}function S0(I,L,S){if(L.image.length!==6)return;let l=s(I,L),e=L.source;Z.bindTexture(J.TEXTURE_CUBE_MAP,I.__webglTexture,J.TEXTURE0+S);let X0=K.get(e);if(e.version!==X0.__version||l===!0){Z.activeTexture(J.TEXTURE0+S);let H0=u0.getPrimaries(u0.workingColorSpace),c=L.colorSpace===I8?null:u0.getPrimaries(L.colorSpace),a=L.colorSpace===I8||H0===c?J.NONE:J.BROWSER_DEFAULT_WEBGL;Z.pixelStorei(J.UNPACK_FLIP_Y_WEBGL,L.flipY),Z.pixelStorei(J.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),Z.pixelStorei(J.UNPACK_ALIGNMENT,L.unpackAlignment),Z.pixelStorei(J.UNPACK_COLORSPACE_CONVERSION_WEBGL,a);let D0=L.isCompressedTexture||L.image[0].isCompressedTexture,I0=L.image[0]&&L.image[0].isDataTexture,G0=[];for(let t=0;t<6;t++){if(!D0&&!I0)G0[t]=q(L.image[t],!0,$.maxCubemapSize);else G0[t]=I0?L.image[t].image:L.image[t];G0[t]=t0(L,G0[t])}let K0=G0[0],z0=X.convert(L.format,L.colorSpace),w0=X.convert(L.type),r0=k(L.internalFormat,z0,w0,L.normalized,L.colorSpace),y=L.isVideoTexture!==!0,Y0=X0.__version===void 0||l===!0,i=e.dataReady,U0=_(L,K0);m0(J.TEXTURE_CUBE_MAP,L);let O0;if(D0){if(y&&Y0)Z.texStorage2D(J.TEXTURE_CUBE_MAP,U0,r0,K0.width,K0.height);for(let t=0;t<6;t++){O0=G0[t].mipmaps;for(let E0=0;E0<O0.length;E0++){let h0=O0[E0];if(L.format!==I9)if(z0!==null)if(y){if(i)Z.compressedTexSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0,0,0,h0.width,h0.height,z0,h0.data)}else Z.compressedTexImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0,r0,h0.width,h0.height,0,h0.data);else j0("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(y){if(i)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0,0,0,h0.width,h0.height,z0,w0,h0.data)}else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0,r0,h0.width,h0.height,0,z0,w0,h0.data)}}}else{if(O0=L.mipmaps,y&&Y0){if(O0.length>0)U0++;let t=RJ(G0[0]);Z.texStorage2D(J.TEXTURE_CUBE_MAP,U0,r0,t.width,t.height)}for(let t=0;t<6;t++)if(I0){if(y){if(i)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,G0[t].width,G0[t].height,z0,w0,G0[t].data)}else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,r0,G0[t].width,G0[t].height,0,z0,w0,G0[t].data);for(let E0=0;E0<O0.length;E0++){let GJ=O0[E0].image[t].image;if(y){if(i)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0+1,0,0,GJ.width,GJ.height,z0,w0,GJ.data)}else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0+1,r0,GJ.width,GJ.height,0,z0,w0,GJ.data)}}else{if(y){if(i)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,z0,w0,G0[t])}else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,r0,z0,w0,G0[t]);for(let E0=0;E0<O0.length;E0++){let h0=O0[E0];if(y){if(i)Z.texSubImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0+1,0,0,z0,w0,h0.image[t])}else Z.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+t,E0+1,r0,z0,w0,h0.image[t])}}}if(E(L))z(J.TEXTURE_CUBE_MAP);if(X0.__version=e.version,L.onUpdate)L.onUpdate(L)}I.__version=L.version}function C0(I,L,S,l,e,X0){let H0=X.convert(S.format,S.colorSpace),c=X.convert(S.type),a=k(S.internalFormat,H0,c,S.normalized,S.colorSpace),D0=K.get(L),I0=K.get(S);if(I0.__renderTarget=L,!D0.__hasExternalTextures){let G0=Math.max(1,L.width>>X0),K0=Math.max(1,L.height>>X0);if(e===J.TEXTURE_3D||e===J.TEXTURE_2D_ARRAY)Z.texImage3D(e,X0,a,G0,K0,L.depth,0,H0,c,null);else Z.texImage2D(e,X0,a,G0,K0,0,H0,c,null)}if(Z.bindFramebuffer(J.FRAMEBUFFER,I),j(L))W.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,l,e,I0.__webglTexture,0,_J(L));else if(e===J.TEXTURE_2D||e>=J.TEXTURE_CUBE_MAP_POSITIVE_X&&e<=J.TEXTURE_CUBE_MAP_NEGATIVE_Z)J.framebufferTexture2D(J.FRAMEBUFFER,l,e,I0.__webglTexture,X0);Z.bindFramebuffer(J.FRAMEBUFFER,null)}function CJ(I,L,S){if(J.bindRenderbuffer(J.RENDERBUFFER,I),L.depthBuffer){let l=L.depthTexture,e=l&&l.isDepthTexture?l.type:null,X0=C(L.stencilBuffer,e),H0=L.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT;if(j(L))W.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,_J(L),X0,L.width,L.height);else if(S)J.renderbufferStorageMultisample(J.RENDERBUFFER,_J(L),X0,L.width,L.height);else J.renderbufferStorage(J.RENDERBUFFER,X0,L.width,L.height);J.framebufferRenderbuffer(J.FRAMEBUFFER,H0,J.RENDERBUFFER,I)}else{let l=L.textures;for(let e=0;e<l.length;e++){let X0=l[e],H0=X.convert(X0.format,X0.colorSpace),c=X.convert(X0.type),a=k(X0.internalFormat,H0,c,X0.normalized,X0.colorSpace);if(j(L))W.renderbufferStorageMultisampleEXT(J.RENDERBUFFER,_J(L),a,L.width,L.height);else if(S)J.renderbufferStorageMultisample(J.RENDERBUFFER,_J(L),a,L.width,L.height);else J.renderbufferStorage(J.RENDERBUFFER,a,L.width,L.height)}}J.bindRenderbuffer(J.RENDERBUFFER,null)}function d0(I,L,S){let l=L.isWebGLCubeRenderTarget===!0;if(Z.bindFramebuffer(J.FRAMEBUFFER,I),!(L.depthTexture&&L.depthTexture.isDepthTexture))throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let e=K.get(L.depthTexture);if(e.__renderTarget=L,!e.__webglTexture||L.depthTexture.image.width!==L.width||L.depthTexture.image.height!==L.height)L.depthTexture.image.width=L.width,L.depthTexture.image.height=L.height,L.depthTexture.needsUpdate=!0;if(l){if(e.__webglInit===void 0)e.__webglInit=!0,L.depthTexture.addEventListener("dispose",A);if(e.__webglTexture===void 0){e.__webglTexture=J.createTexture(),Z.bindTexture(J.TEXTURE_CUBE_MAP,e.__webglTexture),m0(J.TEXTURE_CUBE_MAP,L.depthTexture);let D0=X.convert(L.depthTexture.format),I0=X.convert(L.depthTexture.type),G0;if(L.depthTexture.format===M8)G0=J.DEPTH_COMPONENT24;else if(L.depthTexture.format===k8)G0=J.DEPTH24_STENCIL8;for(let K0=0;K0<6;K0++)J.texImage2D(J.TEXTURE_CUBE_MAP_POSITIVE_X+K0,0,G0,L.width,L.height,0,D0,I0,null)}}else Q0(L.depthTexture,0);let X0=e.__webglTexture,H0=_J(L),c=l?J.TEXTURE_CUBE_MAP_POSITIVE_X+S:J.TEXTURE_2D,a=L.depthTexture.format===k8?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT;if(L.depthTexture.format===M8)if(j(L))W.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,a,c,X0,0,H0);else J.framebufferTexture2D(J.FRAMEBUFFER,a,c,X0,0);else if(L.depthTexture.format===k8)if(j(L))W.framebufferTexture2DMultisampleEXT(J.FRAMEBUFFER,a,c,X0,0,H0);else J.framebufferTexture2D(J.FRAMEBUFFER,a,c,X0,0);else throw Error("THREE.WebGLTextures: Unknown depthTexture format.")}function i0(I){let L=K.get(I),S=I.isWebGLCubeRenderTarget===!0;if(L.__boundDepthTexture!==I.depthTexture){let l=I.depthTexture;if(L.__depthDisposeCallback)L.__depthDisposeCallback();if(l){let e=()=>{delete L.__boundDepthTexture,delete L.__depthDisposeCallback,l.removeEventListener("dispose",e)};l.addEventListener("dispose",e),L.__depthDisposeCallback=e}L.__boundDepthTexture=l}if(I.depthTexture&&!L.__autoAllocateDepthBuffer)if(S)for(let l=0;l<6;l++)d0(L.__webglFramebuffer[l],I,l);else{let l=I.texture.mipmaps;if(l&&l.length>0)d0(L.__webglFramebuffer[0],I,0);else d0(L.__webglFramebuffer,I,0)}else if(S){L.__webglDepthbuffer=[];for(let l=0;l<6;l++)if(Z.bindFramebuffer(J.FRAMEBUFFER,L.__webglFramebuffer[l]),L.__webglDepthbuffer[l]===void 0)L.__webglDepthbuffer[l]=J.createRenderbuffer(),CJ(L.__webglDepthbuffer[l],I,!1);else{let e=I.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,X0=L.__webglDepthbuffer[l];J.bindRenderbuffer(J.RENDERBUFFER,X0),J.framebufferRenderbuffer(J.FRAMEBUFFER,e,J.RENDERBUFFER,X0)}}else{let l=I.texture.mipmaps;if(l&&l.length>0)Z.bindFramebuffer(J.FRAMEBUFFER,L.__webglFramebuffer[0]);else Z.bindFramebuffer(J.FRAMEBUFFER,L.__webglFramebuffer);if(L.__webglDepthbuffer===void 0)L.__webglDepthbuffer=J.createRenderbuffer(),CJ(L.__webglDepthbuffer,I,!1);else{let e=I.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,X0=L.__webglDepthbuffer;J.bindRenderbuffer(J.RENDERBUFFER,X0),J.framebufferRenderbuffer(J.FRAMEBUFFER,e,J.RENDERBUFFER,X0)}}Z.bindFramebuffer(J.FRAMEBUFFER,null)}function QJ(I,L,S){let l=K.get(I);if(L!==void 0)C0(l.__webglFramebuffer,I,I.texture,J.COLOR_ATTACHMENT0,J.TEXTURE_2D,0);if(S!==void 0)i0(I)}function o0(I){let L=I.texture,S=K.get(I),l=K.get(L);I.addEventListener("dispose",O);let e=I.textures,X0=I.isWebGLCubeRenderTarget===!0,H0=e.length>1;if(!H0){if(l.__webglTexture===void 0)l.__webglTexture=J.createTexture();l.__version=L.version,Y.memory.textures++}if(X0){S.__webglFramebuffer=[];for(let c=0;c<6;c++)if(L.mipmaps&&L.mipmaps.length>0){S.__webglFramebuffer[c]=[];for(let a=0;a<L.mipmaps.length;a++)S.__webglFramebuffer[c][a]=J.createFramebuffer()}else S.__webglFramebuffer[c]=J.createFramebuffer()}else{if(L.mipmaps&&L.mipmaps.length>0){S.__webglFramebuffer=[];for(let c=0;c<L.mipmaps.length;c++)S.__webglFramebuffer[c]=J.createFramebuffer()}else S.__webglFramebuffer=J.createFramebuffer();if(H0)for(let c=0,a=e.length;c<a;c++){let D0=K.get(e[c]);if(D0.__webglTexture===void 0)D0.__webglTexture=J.createTexture(),Y.memory.textures++}if(I.samples>0&&j(I)===!1){S.__webglMultisampledFramebuffer=J.createFramebuffer(),S.__webglColorRenderbuffer=[],Z.bindFramebuffer(J.FRAMEBUFFER,S.__webglMultisampledFramebuffer);for(let c=0;c<e.length;c++){let a=e[c];S.__webglColorRenderbuffer[c]=J.createRenderbuffer(),J.bindRenderbuffer(J.RENDERBUFFER,S.__webglColorRenderbuffer[c]);let D0=X.convert(a.format,a.colorSpace),I0=X.convert(a.type),G0=k(a.internalFormat,D0,I0,a.normalized,a.colorSpace,I.isXRRenderTarget===!0),K0=_J(I);J.renderbufferStorageMultisample(J.RENDERBUFFER,K0,G0,I.width,I.height),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+c,J.RENDERBUFFER,S.__webglColorRenderbuffer[c])}if(J.bindRenderbuffer(J.RENDERBUFFER,null),I.depthBuffer)S.__webglDepthRenderbuffer=J.createRenderbuffer(),CJ(S.__webglDepthRenderbuffer,I,!0);Z.bindFramebuffer(J.FRAMEBUFFER,null)}}if(X0){Z.bindTexture(J.TEXTURE_CUBE_MAP,l.__webglTexture),m0(J.TEXTURE_CUBE_MAP,L);for(let c=0;c<6;c++)if(L.mipmaps&&L.mipmaps.length>0)for(let a=0;a<L.mipmaps.length;a++)C0(S.__webglFramebuffer[c][a],I,L,J.COLOR_ATTACHMENT0,J.TEXTURE_CUBE_MAP_POSITIVE_X+c,a);else C0(S.__webglFramebuffer[c],I,L,J.COLOR_ATTACHMENT0,J.TEXTURE_CUBE_MAP_POSITIVE_X+c,0);if(E(L))z(J.TEXTURE_CUBE_MAP);Z.unbindTexture()}else if(H0){for(let c=0,a=e.length;c<a;c++){let D0=e[c],I0=K.get(D0),G0=J.TEXTURE_2D;if(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)G0=I.isWebGL3DRenderTarget?J.TEXTURE_3D:J.TEXTURE_2D_ARRAY;if(Z.bindTexture(G0,I0.__webglTexture),m0(G0,D0),C0(S.__webglFramebuffer,I,D0,J.COLOR_ATTACHMENT0+c,G0,0),E(D0))z(G0)}Z.unbindTexture()}else{let c=J.TEXTURE_2D;if(I.isWebGL3DRenderTarget||I.isWebGLArrayRenderTarget)c=I.isWebGL3DRenderTarget?J.TEXTURE_3D:J.TEXTURE_2D_ARRAY;if(Z.bindTexture(c,l.__webglTexture),m0(c,L),L.mipmaps&&L.mipmaps.length>0)for(let a=0;a<L.mipmaps.length;a++)C0(S.__webglFramebuffer[a],I,L,J.COLOR_ATTACHMENT0,c,a);else C0(S.__webglFramebuffer,I,L,J.COLOR_ATTACHMENT0,c,0);if(E(L))z(c);Z.unbindTexture()}if(I.depthBuffer)i0(I)}function jJ(I){let L=I.textures;for(let S=0,l=L.length;S<l;S++){let e=L[S];if(E(e)){let X0=w(I),H0=K.get(e).__webglTexture;Z.bindTexture(X0,H0),z(X0),Z.unbindTexture()}}}let qJ=[],sJ=[];function zJ(I){if(I.samples>0){if(j(I)===!1){let{textures:L,width:S,height:l}=I,e=J.COLOR_BUFFER_BIT,X0=I.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT,H0=K.get(I),c=L.length>1;if(c)for(let D0=0;D0<L.length;D0++)Z.bindFramebuffer(J.FRAMEBUFFER,H0.__webglMultisampledFramebuffer),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+D0,J.RENDERBUFFER,null),Z.bindFramebuffer(J.FRAMEBUFFER,H0.__webglFramebuffer),J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0+D0,J.TEXTURE_2D,null,0);Z.bindFramebuffer(J.READ_FRAMEBUFFER,H0.__webglMultisampledFramebuffer);let a=I.texture.mipmaps;if(a&&a.length>0)Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,H0.__webglFramebuffer[0]);else Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,H0.__webglFramebuffer);for(let D0=0;D0<L.length;D0++){if(I.resolveDepthBuffer){if(I.depthBuffer)e|=J.DEPTH_BUFFER_BIT;if(I.stencilBuffer&&I.resolveStencilBuffer)e|=J.STENCIL_BUFFER_BIT}if(c){J.framebufferRenderbuffer(J.READ_FRAMEBUFFER,J.COLOR_ATTACHMENT0,J.RENDERBUFFER,H0.__webglColorRenderbuffer[D0]);let I0=K.get(L[D0]).__webglTexture;J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0,J.TEXTURE_2D,I0,0)}if(J.blitFramebuffer(0,0,S,l,0,0,S,l,e,J.NEAREST),U===!0){if(qJ.length=0,sJ.length=0,qJ.push(J.COLOR_ATTACHMENT0+D0),I.depthBuffer&&I.storeMultisampledDepthBuffer===!1)qJ.push(X0),sJ.push(X0),J.invalidateFramebuffer(J.DRAW_FRAMEBUFFER,sJ);J.invalidateFramebuffer(J.READ_FRAMEBUFFER,qJ)}}if(Z.bindFramebuffer(J.READ_FRAMEBUFFER,null),Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,null),c)for(let D0=0;D0<L.length;D0++){Z.bindFramebuffer(J.FRAMEBUFFER,H0.__webglMultisampledFramebuffer),J.framebufferRenderbuffer(J.FRAMEBUFFER,J.COLOR_ATTACHMENT0+D0,J.RENDERBUFFER,H0.__webglColorRenderbuffer[D0]);let I0=K.get(L[D0]).__webglTexture;Z.bindFramebuffer(J.FRAMEBUFFER,H0.__webglFramebuffer),J.framebufferTexture2D(J.DRAW_FRAMEBUFFER,J.COLOR_ATTACHMENT0+D0,J.TEXTURE_2D,I0,0)}Z.bindFramebuffer(J.DRAW_FRAMEBUFFER,H0.__webglMultisampledFramebuffer)}else if(I.depthBuffer&&I.storeMultisampledDepthBuffer===!1&&U){let L=I.stencilBuffer?J.DEPTH_STENCIL_ATTACHMENT:J.DEPTH_ATTACHMENT;J.invalidateFramebuffer(J.DRAW_FRAMEBUFFER,[L])}}}function _J(I){return Math.min($.maxSamples,I.samples)}function j(I){let L=K.get(I);return I.samples>0&&Q.has("WEBGL_multisampled_render_to_texture")===!0&&L.__useRenderToTexture!==!1}function iJ(I){let L=Y.render.frame;if(N.get(I)!==L)N.set(I,L),I.update()}function t0(I,L){let{colorSpace:S,format:l,type:e}=I;if(I.isCompressedTexture===!0||I.isVideoTexture===!0)return L;if(S!==zZ&&S!==I8)if(u0.getTransfer(S)===UJ){if(l!==I9||e!==q9)j0("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else P0("WebGLTextures: Unsupported texture color space:",S);return L}function RJ(I){if(typeof HTMLImageElement<"u"&&I instanceof HTMLImageElement)H.width=I.naturalWidth||I.width,H.height=I.naturalHeight||I.height;else if(typeof VideoFrame<"u"&&I instanceof VideoFrame)H.width=I.displayWidth,H.height=I.displayHeight;else H.width=I.width,H.height=I.height;return H}this.allocateTextureUnit=o,this.resetTextureUnits=u,this.getTextureUnits=T,this.setTextureUnits=p,this.setTexture2D=Q0,this.setTexture2DArray=n,this.setTexture3D=r,this.setTextureCube=J0,this.rebindTextures=QJ,this.setupRenderTarget=o0,this.updateRenderTargetMipmap=jJ,this.updateMultisampleRenderTarget=zJ,this.setupDepthRenderbuffer=i0,this.setupFrameBufferTexture=C0,this.useMultisampledRTT=j,this.isReversedDepthBuffer=function(){return Z.buffers.depth.getReversed()}}function v5(J,Q){function Z(K,$=I8){let X,Y=u0.getTransfer($);if(K===q9)return J.UNSIGNED_BYTE;if(K===dQ)return J.UNSIGNED_SHORT_4_4_4_4;if(K===uQ)return J.UNSIGNED_SHORT_5_5_5_1;if(K===c$)return J.UNSIGNED_INT_5_9_9_9_REV;if(K===n$)return J.UNSIGNED_INT_10F_11F_11F_REV;if(K===d$)return J.BYTE;if(K===u$)return J.SHORT;if(K===w7)return J.UNSIGNED_SHORT;if(K===lQ)return J.INT;if(K===X8)return J.UNSIGNED_INT;if(K===m9)return J.FLOAT;if(K===B9)return J.HALF_FLOAT;if(K===s$)return J.ALPHA;if(K===i$)return J.RGB;if(K===I9)return J.RGBA;if(K===M8)return J.DEPTH_COMPONENT;if(K===k8)return J.DEPTH_STENCIL;if(K===o$)return J.RED;if(K===cQ)return J.RED_INTEGER;if(K===B8)return J.RG;if(K===nQ)return J.RG_INTEGER;if(K===sQ)return J.RGBA_INTEGER;if(K===I6||K===C6||K===z6||K===_6)if(Y===UJ)if(X=Q.get("WEBGL_compressed_texture_s3tc_srgb"),X!==null){if(K===I6)return X.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(K===C6)return X.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(K===z6)return X.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(K===_6)return X.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(X=Q.get("WEBGL_compressed_texture_s3tc"),X!==null){if(K===I6)return X.COMPRESSED_RGB_S3TC_DXT1_EXT;if(K===C6)return X.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(K===z6)return X.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(K===_6)return X.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(K===iQ||K===oQ||K===aQ||K===rQ)if(X=Q.get("WEBGL_compressed_texture_pvrtc"),X!==null){if(K===iQ)return X.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(K===oQ)return X.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(K===aQ)return X.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(K===rQ)return X.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(K===tQ||K===eQ||K===JZ||K===QZ||K===ZZ||K===A6||K===KZ)if(X=Q.get("WEBGL_compressed_texture_etc"),X!==null){if(K===tQ||K===eQ)return Y===UJ?X.COMPRESSED_SRGB8_ETC2:X.COMPRESSED_RGB8_ETC2;if(K===JZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:X.COMPRESSED_RGBA8_ETC2_EAC;if(K===QZ)return X.COMPRESSED_R11_EAC;if(K===ZZ)return X.COMPRESSED_SIGNED_R11_EAC;if(K===A6)return X.COMPRESSED_RG11_EAC;if(K===KZ)return X.COMPRESSED_SIGNED_RG11_EAC}else return null;if(K===$Z||K===XZ||K===YZ||K===WZ||K===UZ||K===HZ||K===GZ||K===NZ||K===EZ||K===FZ||K===qZ||K===DZ||K===OZ||K===RZ)if(X=Q.get("WEBGL_compressed_texture_astc"),X!==null){if(K===$Z)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:X.COMPRESSED_RGBA_ASTC_4x4_KHR;if(K===XZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:X.COMPRESSED_RGBA_ASTC_5x4_KHR;if(K===YZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:X.COMPRESSED_RGBA_ASTC_5x5_KHR;if(K===WZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:X.COMPRESSED_RGBA_ASTC_6x5_KHR;if(K===UZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:X.COMPRESSED_RGBA_ASTC_6x6_KHR;if(K===HZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:X.COMPRESSED_RGBA_ASTC_8x5_KHR;if(K===GZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:X.COMPRESSED_RGBA_ASTC_8x6_KHR;if(K===NZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:X.COMPRESSED_RGBA_ASTC_8x8_KHR;if(K===EZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:X.COMPRESSED_RGBA_ASTC_10x5_KHR;if(K===FZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:X.COMPRESSED_RGBA_ASTC_10x6_KHR;if(K===qZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:X.COMPRESSED_RGBA_ASTC_10x8_KHR;if(K===DZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:X.COMPRESSED_RGBA_ASTC_10x10_KHR;if(K===OZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:X.COMPRESSED_RGBA_ASTC_12x10_KHR;if(K===RZ)return Y===UJ?X.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:X.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(K===LZ||K===VZ||K===MZ)if(X=Q.get("EXT_texture_compression_bptc"),X!==null){if(K===LZ)return Y===UJ?X.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:X.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(K===VZ)return X.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(K===MZ)return X.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(K===kZ||K===BZ||K===w6||K===IZ)if(X=Q.get("EXT_texture_compression_rgtc"),X!==null){if(K===kZ)return X.COMPRESSED_RED_RGTC1_EXT;if(K===BZ)return X.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(K===w6)return X.COMPRESSED_RED_GREEN_RGTC2_EXT;if(K===IZ)return X.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;if(K===X7)return J.UNSIGNED_INT_24_8;return J[K]!==void 0?J[K]:null}return{convert:Z}}var y5=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,f5=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class sX{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(J,Q){if(this.texture===null){let Z=new x6(J.texture);if(J.depthNear!==Q.depthNear||J.depthFar!==Q.depthFar)this.depthNear=J.depthNear,this.depthFar=J.depthFar;this.texture=Z}}getMesh(J){if(this.texture!==null){if(this.mesh===null){let Q=J.cameras[0].viewport,Z=new U9({vertexShader:y5,fragmentShader:f5,uniforms:{depthColor:{value:this.texture},depthWidth:{value:Q.z},depthHeight:{value:Q.w}}});this.mesh=new b0(new $9(20,20),Z)}}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class iX extends l9{constructor(J,Q){super();let Z=this,K=null,$=1,X=null,Y="local-floor",W=1,U=null,H=null,N=null,F=null,G=null,D=null,R=typeof XRWebGLBinding<"u",B=new sX,q={},E=Q.getContextAttributes(),z=null,w=null,k=[],C=[],_=new v0,A=null,O=null,V=new bJ;V.viewport=new OJ;let b=new bJ;b.viewport=new OJ;let P=[V,b],f=new oZ,u=null,T=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(s){let Z0=k[s];if(Z0===void 0)Z0=new S7,k[s]=Z0;return Z0.getTargetRaySpace()},this.getControllerGrip=function(s){let Z0=k[s];if(Z0===void 0)Z0=new S7,k[s]=Z0;return Z0.getGripSpace()},this.getHand=function(s){let Z0=k[s];if(Z0===void 0)Z0=new S7,k[s]=Z0;return Z0.getHandSpace()};function p(s){let Z0=C.indexOf(s.inputSource);if(Z0===-1)return;let $0=k[Z0];if($0!==void 0)$0.update(s.inputSource,s.frame,U||X),$0.dispatchEvent({type:s.type,data:s.inputSource})}function o(){K.removeEventListener("select",p),K.removeEventListener("selectstart",p),K.removeEventListener("selectend",p),K.removeEventListener("squeeze",p),K.removeEventListener("squeezestart",p),K.removeEventListener("squeezeend",p),K.removeEventListener("end",o),K.removeEventListener("inputsourceschange",m);for(let s=0;s<k.length;s++){let Z0=C[s];if(Z0===null)continue;C[s]=null,k[s].disconnect(Z0)}u=null,T=null,B.reset();for(let s in q)delete q[s];if(J.setRenderTarget(z),G=null,F=null,N=null,K=null,w=null,m0.stop(),Z.isPresenting=!1,J.setPixelRatio(A),J.setSize(_.width,_.height,!1),O!==null){let s=O.camera;s.fov=O.fov,s.zoom=O.zoom,s.updateProjectionMatrix(),O=null}Z.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(s){if($=s,Z.isPresenting===!0)j0("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(s){if(Y=s,Z.isPresenting===!0)j0("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return U||X},this.setReferenceSpace=function(s){U=s},this.getBaseLayer=function(){return F!==null?F:G},this.getBinding=function(){if(N===null&&R)N=new XRWebGLBinding(K,Q);return N},this.getFrame=function(){return D},this.getSession=function(){return K},this.setSession=async function(s){if(K=s,K!==null){if(z=J.getRenderTarget(),K.addEventListener("select",p),K.addEventListener("selectstart",p),K.addEventListener("selectend",p),K.addEventListener("squeeze",p),K.addEventListener("squeezestart",p),K.addEventListener("squeezeend",p),K.addEventListener("end",o),K.addEventListener("inputsourceschange",m),E.xrCompatible!==!0)await Q.makeXRCompatible();if(A=J.getPixelRatio(),J.getSize(_),!(R&&("createProjectionLayer"in XRWebGLBinding.prototype))){let $0={antialias:E.antialias,alpha:!0,depth:E.depth,stencil:E.stencil,framebufferScaleFactor:$};G=new XRWebGLLayer(K,Q,$0),K.updateRenderState({baseLayer:G}),J.setPixelRatio(1),J.setSize(G.framebufferWidth,G.framebufferHeight,!1),w=new K9(G.framebufferWidth,G.framebufferHeight,{format:I9,type:q9,colorSpace:J.outputColorSpace,stencilBuffer:E.stencil,resolveDepthBuffer:G.ignoreDepthValues===!1,resolveStencilBuffer:G.ignoreDepthValues===!1,storeMultisampledDepthBuffer:G.ignoreDepthValues===!1,storeMultisampledStencilBuffer:G.ignoreDepthValues===!1})}else{let $0=null,A0=null,S0=null;if(E.depth)S0=E.stencil?Q.DEPTH24_STENCIL8:Q.DEPTH_COMPONENT24,$0=E.stencil?k8:M8,A0=E.stencil?X7:X8;let C0={colorFormat:Q.RGBA8,depthFormat:S0,scaleFactor:$};N=this.getBinding(),F=N.createProjectionLayer(C0),K.updateRenderState({layers:[F]}),J.setPixelRatio(1),J.setSize(F.textureWidth,F.textureHeight,!1),w=new K9(F.textureWidth,F.textureHeight,{format:I9,type:q9,depthTexture:new z8(F.textureWidth,F.textureHeight,A0,void 0,void 0,void 0,void 0,void 0,void 0,$0),stencilBuffer:E.stencil,colorSpace:J.outputColorSpace,samples:E.antialias?4:0,resolveDepthBuffer:F.ignoreDepthValues===!1,resolveStencilBuffer:F.ignoreDepthValues===!1,storeMultisampledDepthBuffer:F.ignoreDepthValues===!1,storeMultisampledStencilBuffer:F.ignoreDepthValues===!1})}w.isXRRenderTarget=!0,this.setFoveation(W),U=null,X=await K.requestReferenceSpace(Y),m0.setContext(K),m0.start(),Z.isPresenting=!0,Z.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(K!==null)return K.environmentBlendMode},this.getDepthTexture=function(){return B.getDepthTexture()};function m(s){for(let Z0=0;Z0<s.removed.length;Z0++){let $0=s.removed[Z0],A0=C.indexOf($0);if(A0>=0)C[A0]=null,k[A0].disconnect($0)}for(let Z0=0;Z0<s.added.length;Z0++){let $0=s.added[Z0],A0=C.indexOf($0);if(A0===-1){for(let C0=0;C0<k.length;C0++)if(C0>=C.length){C.push($0),A0=C0;break}else if(C[C0]===null){C[C0]=$0,A0=C0;break}if(A0===-1)break}let S0=k[A0];if(S0)S0.connect($0)}}let Q0=new h,n=new h;function r(s,Z0,$0){Q0.setFromMatrixPosition(Z0.matrixWorld),n.setFromMatrixPosition($0.matrixWorld);let A0=Q0.distanceTo(n),S0=Z0.projectionMatrix.elements,C0=$0.projectionMatrix.elements,CJ=S0[14]/(S0[10]-1),d0=S0[14]/(S0[10]+1),i0=(S0[9]+1)/S0[5],QJ=(S0[9]-1)/S0[5],o0=(S0[8]-1)/S0[0],jJ=(C0[8]+1)/C0[0],qJ=CJ*o0,sJ=CJ*jJ,zJ=A0/(-o0+jJ),_J=zJ*-o0;if(Z0.matrixWorld.decompose(s.position,s.quaternion,s.scale),s.translateX(_J),s.translateZ(zJ),s.matrixWorld.compose(s.position,s.quaternion,s.scale),s.matrixWorldInverse.copy(s.matrixWorld).invert(),S0[10]===-1)s.projectionMatrix.copy(Z0.projectionMatrix),s.projectionMatrixInverse.copy(Z0.projectionMatrixInverse);else{let j=CJ+zJ,iJ=d0+zJ,t0=qJ-_J,RJ=sJ+(A0-_J),I=i0*d0/iJ*j,L=QJ*d0/iJ*j;s.projectionMatrix.makePerspective(t0,RJ,I,L,j,iJ),s.projectionMatrixInverse.copy(s.projectionMatrix).invert()}}function J0(s,Z0){if(Z0===null)s.matrixWorld.copy(s.matrix);else s.matrixWorld.multiplyMatrices(Z0.matrixWorld,s.matrix);s.matrixWorldInverse.copy(s.matrixWorld).invert()}this.updateCamera=function(s){if(K===null)return;let{near:Z0,far:$0}=s;if(B.texture!==null){if(B.depthNear>0)Z0=B.depthNear;if(B.depthFar>0)$0=B.depthFar}if(f.near=b.near=V.near=Z0,f.far=b.far=V.far=$0,u!==f.near||T!==f.far)K.updateRenderState({depthNear:f.near,depthFar:f.far}),u=f.near,T=f.far;f.layers.mask=s.layers.mask|6,V.layers.mask=f.layers.mask&-5,b.layers.mask=f.layers.mask&-3;let A0=s.parent,S0=f.cameras;J0(f,A0);for(let C0=0;C0<S0.length;C0++)J0(S0[C0],A0);if(S0.length===2)r(f,V,b);else f.projectionMatrix.copy(V.projectionMatrix);if(O===null&&s.isPerspectiveCamera)O={camera:s,fov:s.fov,zoom:s.zoom};T0(s,f,A0)};function T0(s,Z0,$0){if($0===null)s.matrix.copy(Z0.matrixWorld);else s.matrix.copy($0.matrixWorld),s.matrix.invert(),s.matrix.multiply(Z0.matrixWorld);if(s.matrix.decompose(s.position,s.quaternion,s.scale),s.updateMatrixWorld(!0),s.projectionMatrix.copy(Z0.projectionMatrix),s.projectionMatrixInverse.copy(Z0.projectionMatrixInverse),s.isPerspectiveCamera)s.fov=R6*2*Math.atan(1/s.projectionMatrix.elements[5]),s.zoom=1}this.getCamera=function(){return f},this.getFoveation=function(){if(F===null&&G===null)return;return W},this.setFoveation=function(s){if(W=s,F!==null)F.fixedFoveation=s;if(G!==null&&G.fixedFoveation!==void 0)G.fixedFoveation=s},this.hasDepthSensing=function(){return B.texture!==null},this.getDepthSensingMesh=function(){return B.getMesh(f)},this.getCameraTexture=function(s){return q[s]};let _0=null;function HJ(s,Z0){if(H=Z0.getViewerPose(U||X),D=Z0,H!==null){let $0=H.views;if(G!==null)J.setRenderTargetFramebuffer(w,G.framebuffer),J.setRenderTarget(w);let A0=!1;if($0.length!==f.cameras.length)f.cameras.length=0,A0=!0;for(let d0=0;d0<$0.length;d0++){let i0=$0[d0],QJ=null;if(G!==null)QJ=G.getViewport(i0);else{let jJ=N.getViewSubImage(F,i0);if(QJ=jJ.viewport,d0===0)J.setRenderTargetTextures(w,jJ.colorTexture,jJ.depthStencilTexture),J.setRenderTarget(w)}let o0=P[d0];if(o0===void 0)o0=new bJ,o0.layers.enable(d0),o0.viewport=new OJ,P[d0]=o0;if(o0.matrix.fromArray(i0.transform.matrix),o0.matrix.decompose(o0.position,o0.quaternion,o0.scale),o0.projectionMatrix.fromArray(i0.projectionMatrix),o0.projectionMatrixInverse.copy(o0.projectionMatrix).invert(),o0.viewport.set(QJ.x,QJ.y,QJ.width,QJ.height),d0===0)f.matrix.copy(o0.matrix),f.matrix.decompose(f.position,f.quaternion,f.scale);if(A0===!0)f.cameras.push(o0)}let S0=K.enabledFeatures;if(S0&&S0.includes("depth-sensing")&&K.depthUsage=="gpu-optimized"&&R){N=Z.getBinding();let d0=N.getDepthInformation($0[0]);if(d0&&d0.isValid&&d0.texture)B.init(d0,K.renderState)}if(S0&&S0.includes("camera-access")&&R){J.state.unbindTexture(),N=Z.getBinding();for(let d0=0;d0<$0.length;d0++){let i0=$0[d0].camera;if(i0){let QJ=q[i0];if(!QJ)QJ=new x6,q[i0]=QJ;let o0=N.getCameraImage(i0);QJ.sourceTexture=o0}}}}for(let $0=0;$0<k.length;$0++){let A0=C[$0],S0=k[$0];if(A0!==null&&S0!==void 0)S0.update(A0,Z0,U||X)}if(_0)_0(s,Z0);if(Z0.detectedPlanes)Z.dispatchEvent({type:"planesdetected",data:Z0});D=null}let m0=new hX;m0.setAnimationLoop(HJ),this.setAnimationLoop=function(s){_0=s},this.dispose=function(){}}}var h5=new KJ,oX=new f0;oX.set(-1,0,0,0,1,0,0,0,1);function b5(J,Q){function Z(q,E){if(q.matrixAutoUpdate===!0)q.updateMatrix();E.value.copy(q.matrix)}function K(q,E){if(E.color.getRGB(q.fogColor.value,yZ(J)),E.isFog)q.fogNear.value=E.near,q.fogFar.value=E.far;else if(E.isFogExp2)q.fogDensity.value=E.density}function $(q,E,z,w,k){if(E.isNodeMaterial)E.uniformsNeedUpdate=!1;else if(E.isMeshBasicMaterial)X(q,E);else if(E.isMeshLambertMaterial){if(X(q,E),E.envMap)q.envMapIntensity.value=E.envMapIntensity}else if(E.isMeshToonMaterial)X(q,E),F(q,E);else if(E.isMeshPhongMaterial){if(X(q,E),N(q,E),E.envMap)q.envMapIntensity.value=E.envMapIntensity}else if(E.isMeshStandardMaterial){if(X(q,E),G(q,E),E.isMeshPhysicalMaterial)D(q,E,k)}else if(E.isMeshMatcapMaterial)X(q,E),R(q,E);else if(E.isMeshDepthMaterial)X(q,E);else if(E.isMeshDistanceMaterial)X(q,E),B(q,E);else if(E.isMeshNormalMaterial)X(q,E);else if(E.isLineBasicMaterial){if(Y(q,E),E.isLineDashedMaterial)W(q,E)}else if(E.isPointsMaterial)U(q,E,z,w);else if(E.isSpriteMaterial)H(q,E);else if(E.isShadowMaterial)q.color.value.copy(E.color),q.opacity.value=E.opacity;else if(E.isShaderMaterial)E.uniformsNeedUpdate=!1}function X(q,E){if(q.opacity.value=E.opacity,E.color)q.diffuse.value.copy(E.color);if(E.emissive)q.emissive.value.copy(E.emissive).multiplyScalar(E.emissiveIntensity);if(E.map)q.map.value=E.map,Z(E.map,q.mapTransform);if(E.alphaMap)q.alphaMap.value=E.alphaMap,Z(E.alphaMap,q.alphaMapTransform);if(E.bumpMap){if(q.bumpMap.value=E.bumpMap,Z(E.bumpMap,q.bumpMapTransform),q.bumpScale.value=E.bumpScale,E.side===oJ)q.bumpScale.value*=-1}if(E.normalMap){if(q.normalMap.value=E.normalMap,Z(E.normalMap,q.normalMapTransform),q.normalScale.value.copy(E.normalScale),E.side===oJ)q.normalScale.value.negate()}if(E.displacementMap)q.displacementMap.value=E.displacementMap,Z(E.displacementMap,q.displacementMapTransform),q.displacementScale.value=E.displacementScale,q.displacementBias.value=E.displacementBias;if(E.emissiveMap)q.emissiveMap.value=E.emissiveMap,Z(E.emissiveMap,q.emissiveMapTransform);if(E.specularMap)q.specularMap.value=E.specularMap,Z(E.specularMap,q.specularMapTransform);if(E.alphaTest>0)q.alphaTest.value=E.alphaTest;let z=Q.get(E),w=z.envMap,k=z.envMapRotation;if(w){if(q.envMap.value=w,q.envMapRotation.value.setFromMatrix4(h5.makeRotationFromEuler(k)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1)q.envMapRotation.value.premultiply(oX);q.reflectivity.value=E.reflectivity,q.ior.value=E.ior,q.refractionRatio.value=E.refractionRatio}if(E.lightMap)q.lightMap.value=E.lightMap,q.lightMapIntensity.value=E.lightMapIntensity,Z(E.lightMap,q.lightMapTransform);if(E.aoMap)q.aoMap.value=E.aoMap,q.aoMapIntensity.value=E.aoMapIntensity,Z(E.aoMap,q.aoMapTransform)}function Y(q,E){if(q.diffuse.value.copy(E.color),q.opacity.value=E.opacity,E.map)q.map.value=E.map,Z(E.map,q.mapTransform)}function W(q,E){q.dashSize.value=E.dashSize,q.totalSize.value=E.dashSize+E.gapSize,q.scale.value=E.scale}function U(q,E,z,w){if(q.diffuse.value.copy(E.color),q.opacity.value=E.opacity,q.size.value=E.size*z,q.scale.value=w*0.5,E.map)q.map.value=E.map,Z(E.map,q.uvTransform);if(E.alphaMap)q.alphaMap.value=E.alphaMap,Z(E.alphaMap,q.alphaMapTransform);if(E.alphaTest>0)q.alphaTest.value=E.alphaTest}function H(q,E){if(q.diffuse.value.copy(E.color),q.opacity.value=E.opacity,q.rotation.value=E.rotation,E.map)q.map.value=E.map,Z(E.map,q.mapTransform);if(E.alphaMap)q.alphaMap.value=E.alphaMap,Z(E.alphaMap,q.alphaMapTransform);if(E.alphaTest>0)q.alphaTest.value=E.alphaTest}function N(q,E){q.specular.value.copy(E.specular),q.shininess.value=Math.max(E.shininess,0.0001)}function F(q,E){if(E.gradientMap)q.gradientMap.value=E.gradientMap}function G(q,E){if(q.metalness.value=E.metalness,E.metalnessMap)q.metalnessMap.value=E.metalnessMap,Z(E.metalnessMap,q.metalnessMapTransform);if(q.roughness.value=E.roughness,E.roughnessMap)q.roughnessMap.value=E.roughnessMap,Z(E.roughnessMap,q.roughnessMapTransform);if(E.envMap)q.envMapIntensity.value=E.envMapIntensity}function D(q,E,z){if(q.ior.value=E.ior,E.sheen>0){if(q.sheenColor.value.copy(E.sheenColor).multiplyScalar(E.sheen),q.sheenRoughness.value=E.sheenRoughness,E.sheenColorMap)q.sheenColorMap.value=E.sheenColorMap,Z(E.sheenColorMap,q.sheenColorMapTransform);if(E.sheenRoughnessMap)q.sheenRoughnessMap.value=E.sheenRoughnessMap,Z(E.sheenRoughnessMap,q.sheenRoughnessMapTransform)}if(E.clearcoat>0){if(q.clearcoat.value=E.clearcoat,q.clearcoatRoughness.value=E.clearcoatRoughness,E.clearcoatMap)q.clearcoatMap.value=E.clearcoatMap,Z(E.clearcoatMap,q.clearcoatMapTransform);if(E.clearcoatRoughnessMap)q.clearcoatRoughnessMap.value=E.clearcoatRoughnessMap,Z(E.clearcoatRoughnessMap,q.clearcoatRoughnessMapTransform);if(E.clearcoatNormalMap){if(q.clearcoatNormalMap.value=E.clearcoatNormalMap,Z(E.clearcoatNormalMap,q.clearcoatNormalMapTransform),q.clearcoatNormalScale.value.copy(E.clearcoatNormalScale),E.side===oJ)q.clearcoatNormalScale.value.negate()}}if(E.dispersion>0)q.dispersion.value=E.dispersion;if(E.retroreflectivity>0)q.retroreflectivity.value=E.retroreflectivity;if(E.iridescence>0){if(q.iridescence.value=E.iridescence,q.iridescenceIOR.value=E.iridescenceIOR,q.iridescenceThicknessMinimum.value=E.iridescenceThicknessRange[0],q.iridescenceThicknessMaximum.value=E.iridescenceThicknessRange[1],E.iridescenceMap)q.iridescenceMap.value=E.iridescenceMap,Z(E.iridescenceMap,q.iridescenceMapTransform);if(E.iridescenceThicknessMap)q.iridescenceThicknessMap.value=E.iridescenceThicknessMap,Z(E.iridescenceThicknessMap,q.iridescenceThicknessMapTransform)}if(E.transmission>0){if(q.transmission.value=E.transmission,q.transmissionSamplerMap.value=z.texture,q.transmissionSamplerSize.value.set(z.width,z.height),E.transmissionMap)q.transmissionMap.value=E.transmissionMap,Z(E.transmissionMap,q.transmissionMapTransform);if(q.thickness.value=E.thickness,E.thicknessMap)q.thicknessMap.value=E.thicknessMap,Z(E.thicknessMap,q.thicknessMapTransform);q.attenuationDistance.value=E.attenuationDistance,q.attenuationColor.value.copy(E.attenuationColor)}if(E.anisotropy>0){if(q.anisotropyVector.value.set(E.anisotropy*Math.cos(E.anisotropyRotation),E.anisotropy*Math.sin(E.anisotropyRotation)),E.anisotropyMap)q.anisotropyMap.value=E.anisotropyMap,Z(E.anisotropyMap,q.anisotropyMapTransform)}if(q.specularIntensity.value=E.specularIntensity,q.specularColor.value.copy(E.specularColor),E.specularColorMap)q.specularColorMap.value=E.specularColorMap,Z(E.specularColorMap,q.specularColorMapTransform);if(E.specularIntensityMap)q.specularIntensityMap.value=E.specularIntensityMap,Z(E.specularIntensityMap,q.specularIntensityMapTransform)}function R(q,E){if(E.matcap)q.matcap.value=E.matcap}function B(q,E){let z=Q.get(E).light;q.referencePosition.value.setFromMatrixPosition(z.matrixWorld),q.nearDistance.value=z.shadow.camera.near,q.farDistance.value=z.shadow.camera.far}return{refreshFogUniforms:K,refreshMaterialUniforms:$}}function x5(J,Q,Z,K){let $={},X={},Y=[],W=J.getParameter(J.MAX_UNIFORM_BUFFER_BINDINGS);function U(k,C){let _=C.program;K.uniformBlockBinding(k,_)}function H(k,C){let _=$[k.id];if(_===void 0)q(k),_=N(k),$[k.id]=_,k.addEventListener("dispose",z);let A=C.program;K.updateUBOMapping(k,A);let O=Q.render.frame;if(X[k.id]!==O)G(k),X[k.id]=O}function N(k){let C=F();k.__bindingPointIndex=C;let _=J.createBuffer(),A=k.__size,O=k.usage;return J.bindBuffer(J.UNIFORM_BUFFER,_),J.bufferData(J.UNIFORM_BUFFER,A,O),J.bindBuffer(J.UNIFORM_BUFFER,null),J.bindBufferBase(J.UNIFORM_BUFFER,C,_),_}function F(){for(let k=0;k<W;k++)if(Y.indexOf(k)===-1)return Y.push(k),k;return P0("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function G(k){let C=$[k.id],_=k.uniforms,A=k.__cache;J.bindBuffer(J.UNIFORM_BUFFER,C);for(let O=0,V=_.length;O<V;O++){let b=_[O];if(Array.isArray(b))for(let P=0,f=b.length;P<f;P++)D(b[P],O,P,A);else D(b,O,0,A)}J.bindBuffer(J.UNIFORM_BUFFER,null)}function D(k,C,_,A){if(B(k,C,_,A)===!0){let{__offset:O,value:V}=k;if(Array.isArray(V)){let b=0;for(let P=0;P<V.length;P++){let f=V[P],u=E(f);if(R(f,k.__data,b),typeof f!=="number"&&typeof f!=="boolean"&&!f.isMatrix3&&!ArrayBuffer.isView(f))b+=u.storage/Float32Array.BYTES_PER_ELEMENT}}else R(V,k.__data,0);J.bufferSubData(J.UNIFORM_BUFFER,O,k.__data)}}function R(k,C,_){if(typeof k==="number"||typeof k==="boolean")C[0]=k;else if(k.isMatrix3)C[0]=k.elements[0],C[1]=k.elements[1],C[2]=k.elements[2],C[3]=0,C[4]=k.elements[3],C[5]=k.elements[4],C[6]=k.elements[5],C[7]=0,C[8]=k.elements[6],C[9]=k.elements[7],C[10]=k.elements[8],C[11]=0;else if(ArrayBuffer.isView(k))C.set(new k.constructor(k.buffer,k.byteOffset,C.length));else k.toArray(C,_)}function B(k,C,_,A){let O=k.value,V=C+"_"+_;if(A[V]===void 0){if(typeof O==="number"||typeof O==="boolean")A[V]=O;else if(ArrayBuffer.isView(O))A[V]=O.slice();else A[V]=O.clone();return!0}else{let b=A[V];if(typeof O==="number"||typeof O==="boolean"){if(b!==O)return A[V]=O,!0}else if(ArrayBuffer.isView(O))return!0;else if(b.equals(O)===!1)return b.copy(O),!0}return!1}function q(k){let C=k.uniforms,_=0,A=16;for(let V=0,b=C.length;V<b;V++){let P=Array.isArray(C[V])?C[V]:[C[V]];for(let f=0,u=P.length;f<u;f++){let T=P[f],p=Array.isArray(T.value)?T.value:[T.value];for(let o=0,m=p.length;o<m;o++){let Q0=p[o],n=E(Q0),r=_%A,J0=r%n.boundary,T0=r+J0;if(_+=J0,T0!==0&&A-T0<n.storage)_+=A-T0;T.__data=new Float32Array(n.storage/Float32Array.BYTES_PER_ELEMENT),T.__offset=_,_+=n.storage}}}let O=_%A;if(O>0)_+=A-O;return k.__size=_,k.__cache={},this}function E(k){let C={boundary:0,storage:0};if(typeof k==="number"||typeof k==="boolean")C.boundary=4,C.storage=4;else if(k.isVector2)C.boundary=8,C.storage=8;else if(k.isVector3||k.isColor)C.boundary=16,C.storage=12;else if(k.isVector4)C.boundary=16,C.storage=16;else if(k.isMatrix3)C.boundary=48,C.storage=48;else if(k.isMatrix4)C.boundary=64,C.storage=64;else if(k.isTexture)j0("WebGLRenderer: Texture samplers can not be part of an uniforms group.");else if(ArrayBuffer.isView(k))C.boundary=16,C.storage=k.byteLength;else j0("WebGLRenderer: Unsupported uniform value type.",k);return C}function z(k){let C=k.target;C.removeEventListener("dispose",z);let _=Y.indexOf(C.__bindingPointIndex);Y.splice(_,1),J.deleteBuffer($[C.id]),delete $[C.id],delete X[C.id]}function w(){for(let k in $)J.deleteBuffer($[k]);Y=[],$={},X={}}return{bind:U,update:H,dispose:w}}var g5=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),z9=null;function p5(){if(z9===null)z9=new h6(g5,16,16,B8,B9),z9.name="DFG_LUT",z9.minFilter=xJ,z9.magFilter=xJ,z9.wrapS=k6,z9.wrapT=k6,z9.generateMipmaps=!1,z9.needsUpdate=!0;return z9}class GK{constructor(J={}){let{canvas:Q=KX(),context:Z=null,depth:K=!0,stencil:$=!1,alpha:X=!1,antialias:Y=!1,premultipliedAlpha:W=!0,preserveDrawingBuffer:U=!1,powerPreference:H="default",failIfMajorPerformanceCaveat:N=!1,reversedDepthBuffer:F=!1,outputBufferType:G=q9}=J;this.isWebGLRenderer=!0;let D;if(Z!==null){if(typeof WebGLRenderingContext<"u"&&Z instanceof WebGLRenderingContext)throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");D=Z.getContextAttributes().alpha}else D=X;let R=G,B=new Set([sQ,nQ,cQ]),q=new Set([q9,X8,w7,X7,dQ,uQ]),E=new Uint32Array(4),z=new Int32Array(4),w=new h,k=null,C=null,_=[],A=[],O=null;this.domElement=Q,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=F9,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let V=this,b=!1,P=null,f=null,u=null,T=null;this._outputColorSpace=Y8;let p=0,o=0,m=null,Q0=-1,n=null,r=new OJ,J0=new OJ,T0=null,_0=new x0(0),HJ=0,m0=Q.width,s=Q.height,Z0=1,$0=null,A0=null,S0=new OJ(0,0,m0,s),C0=new OJ(0,0,m0,s),CJ=!1,d0=new v7,i0=!1,QJ=!1,o0=new KJ,jJ=new h,qJ=new OJ,sJ={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},zJ=!1;function _J(){return m===null?Z0:1}let j=Z;function iJ(M,v){return Q.getContext(M,v)}let t0,RJ,I,L,S,l,e,X0,H0,c,a,D0,I0,G0,K0,z0,w0,r0,y,Y0,i,U0,O0;try{let M={alpha:!0,depth:K,stencil:$,antialias:Y,premultipliedAlpha:W,preserveDrawingBuffer:U,powerPreference:H,failIfMajorPerformanceCaveat:N};if("setAttribute"in Q)Q.setAttribute("data-engine",`three.js r${Y$}`);if(Q.addEventListener("webglcontextlost",h0,!1),Q.addEventListener("webglcontextrestored",GJ,!1),Q.addEventListener("webglcontextcreationerror",e0,!1),j===null){if(j=iJ("webgl2",M),j===null)if(iJ("webgl2"))throw Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.");else throw Error("THREE.WebGLRenderer: Error creating WebGL context.")}t()}catch(M){throw Q.removeEventListener("webglcontextlost",h0,!1),Q.removeEventListener("webglcontextrestored",GJ,!1),Q.removeEventListener("webglcontextcreationerror",e0,!1),P0("WebGLRenderer: "+M.message),M}function t(){if(t0=new sH(j),t0.init(),i=new v5(j,t0),RJ=new bH(j,t0,J,i),I=new S5(j,t0),RJ.reversedDepthBuffer&&F)I.buffers.depth.setReversed(!0);f=j.createFramebuffer(),u=j.createFramebuffer(),T=j.createFramebuffer(),L=new aH(j),S=new R5,l=new j5(j,t0,I,S,RJ,i,L),e=new nH(V),X0=new tY(j),U0=new fH(j,X0),H0=new iH(j,X0,L,U0),c=new tH(j,H0,X0,U0,L),r0=new rH(j,RJ,l),K0=new xH(S),a=new O5(V,e,t0,RJ,U0,K0),D0=new b5(V,S),I0=new V5,G0=new z5(t0),w0=new yH(V,e,I,c,D,W),z0=new T5(V,c,RJ),O0=new x5(j,L,RJ,I),y=new hH(j,t0,L),Y0=new oH(j,t0,L),L.programs=a.programs,V.capabilities=RJ,V.extensions=t0,V.properties=S,V.renderLists=I0,V.shadowMap=z0,V.state=I,V.info=L}if(R!==q9)O=new JG(R,Q.width,Q.height,Y,K,$);let E0=new iX(V,j);this.xr=E0,this.getContext=function(){return j},this.getContextAttributes=function(){return j.getContextAttributes()},this.forceContextLoss=function(){let M=t0.get("WEBGL_lose_context");if(M)M.loseContext()},this.forceContextRestore=function(){let M=t0.get("WEBGL_lose_context");if(M)M.restoreContext()},this.getPixelRatio=function(){return Z0},this.setPixelRatio=function(M){if(M===void 0)return;Z0=M,this.setSize(m0,s,!1)},this.getSize=function(M){return M.set(m0,s)},this.setSize=function(M,v,d=!0){if(E0.isPresenting){j0("WebGLRenderer: Can't change size while VR device is presenting.");return}if(m0=M,s=v,Q.width=Math.floor(M*Z0),Q.height=Math.floor(v*Z0),d===!0)Q.style.width=M+"px",Q.style.height=v+"px";if(O!==null)O.setSize(Q.width,Q.height);this.setViewport(0,0,M,v)},this.getDrawingBufferSize=function(M){return M.set(m0*Z0,s*Z0).floor()},this.setDrawingBufferSize=function(M,v,d){m0=M,s=v,Z0=d,Q.width=Math.floor(M*d),Q.height=Math.floor(v*d),this.setViewport(0,0,M,v)},this.setEffects=function(M){if(R===q9){P0("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let v=0;v<M.length;v++)if(M[v].isOutputPass===!0){j0("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}O.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(r)},this.getViewport=function(M){return M.copy(S0)},this.setViewport=function(M,v,d,x){if(M.isVector4)S0.set(M.x,M.y,M.z,M.w);else S0.set(M,v,d,x);I.viewport(r.copy(S0).multiplyScalar(Z0).round())},this.getScissor=function(M){return M.copy(C0)},this.setScissor=function(M,v,d,x){if(M.isVector4)C0.set(M.x,M.y,M.z,M.w);else C0.set(M,v,d,x);I.scissor(J0.copy(C0).multiplyScalar(Z0).round())},this.getScissorTest=function(){return CJ},this.setScissorTest=function(M){I.setScissorTest(CJ=M)},this.setOpaqueSort=function(M){$0=M},this.setTransparentSort=function(M){A0=M},this.getClearColor=function(M){return M.copy(w0.getClearColor())},this.setClearColor=function(){w0.setClearColor(...arguments)},this.getClearAlpha=function(){return w0.getClearAlpha()},this.setClearAlpha=function(){w0.setClearAlpha(...arguments)},this.clear=function(M=!0,v=!0,d=!0){let x=0;if(M){let g=!1;if(m!==null){let q0=m.texture.format;g=B.has(q0)}if(g){let q0=m.texture.type,L0=q.has(q0),F0=w0.getClearColor(),V0=w0.getClearAlpha(),B0=F0.r,g0=F0.g,l0=F0.b;if(L0)E[0]=B0,E[1]=g0,E[2]=l0,E[3]=V0,j.clearBufferuiv(j.COLOR,0,E);else z[0]=B0,z[1]=g0,z[2]=l0,z[3]=V0,j.clearBufferiv(j.COLOR,0,z)}else x|=j.COLOR_BUFFER_BIT}if(v)x|=j.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0);if(d)x|=j.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295);if(x!==0)j.clear(x)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),P=M},this.dispose=function(){Q.removeEventListener("webglcontextlost",h0,!1),Q.removeEventListener("webglcontextrestored",GJ,!1),Q.removeEventListener("webglcontextcreationerror",e0,!1),w0.dispose(),I0.dispose(),G0.dispose(),S.dispose(),e.dispose(),c.dispose(),U0.dispose(),O0.dispose(),a.dispose(),E0.dispose(),E0.removeEventListener("sessionstart",BK),E0.removeEventListener("sessionend",IK),G8.stop()};function h0(M){M.preventDefault(),I7("WebGLRenderer: Context Lost."),b=!0}function GJ(){I7("WebGLRenderer: Context Restored."),b=!1;let M=L.autoReset,v=z0.enabled,d=z0.autoUpdate,x=z0.needsUpdate,g=z0.type;t(),L.autoReset=M,z0.enabled=v,z0.autoUpdate=d,z0.needsUpdate=x,z0.type=g}function e0(M){P0("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function O9(M){let v=M.target;v.removeEventListener("dispose",O9),S9(v)}function S9(M){HY(M),S.remove(M)}function HY(M){let v=S.get(M).programs;if(v!==void 0){if(v.forEach(function(d){a.releaseProgram(d)}),M.isShaderMaterial)a.releaseShaderCache(M)}}this.renderBufferDirect=function(M,v,d,x,g,q0){if(v===null)v=sJ;let L0=g.isMesh&&g.matrixWorld.determinantAffine()<0,F0=EY(M,v,d,x,g);I.setMaterial(x,L0);let V0=d.index,B0=1;if(x.wireframe===!0){if(V0=H0.getWireframeAttribute(d),V0===void 0)return;B0=2}let g0=d.drawRange,l0=d.attributes.position,M0=g0.start*B0,JJ=(g0.start+g0.count)*B0;if(q0!==null)M0=Math.max(M0,q0.start*B0),JJ=Math.min(JJ,(q0.start+q0.count)*B0);if(V0!==null)M0=Math.max(M0,0),JJ=Math.min(JJ,V0.count);else if(l0!==void 0&&l0!==null)M0=Math.max(M0,0),JJ=Math.min(JJ,l0.count);let BJ=JJ-M0;if(BJ<0||BJ===1/0)return;U0.setup(g,x,F0,d,V0);let DJ,WJ=y;if(V0!==null)DJ=X0.get(V0),WJ=Y0,WJ.setIndex(DJ);if(g.isMesh)if(x.wireframe===!0)I.setLineWidth(x.wireframeLinewidth*_J()),WJ.setMode(j.LINES);else WJ.setMode(j.TRIANGLES);else if(g.isLine){let yJ=x.linewidth;if(yJ===void 0)yJ=1;if(I.setLineWidth(yJ*_J()),g.isLineSegments)WJ.setMode(j.LINES);else if(g.isLineLoop)WJ.setMode(j.LINE_LOOP);else WJ.setMode(j.LINE_STRIP)}else if(g.isPoints)WJ.setMode(j.POINTS);else if(g.isSprite)WJ.setMode(j.TRIANGLES);if(g.isBatchedMesh)if(!t0.get("WEBGL_multi_draw")){let{_multiDrawStarts:yJ,_multiDrawCounts:R0,_multiDrawCount:mJ}=g,a0=V0?X0.get(V0).bytesPerElement:1,X9=S.get(x).currentProgram.getUniforms();for(let R9=0;R9<mJ;R9++)X9.setValue(j,"_gl_DrawID",R9),WJ.render(yJ[R9]/a0,R0[R9])}else WJ.renderMultiDraw(g._multiDrawStarts,g._multiDrawCounts,g._multiDrawCount);else if(g.isInstancedMesh)WJ.renderInstances(M0,BJ,g.count);else if(d.isInstancedBufferGeometry){let yJ=d._maxInstanceCount!==void 0?d._maxInstanceCount:1/0,R0=Math.min(d.instanceCount,yJ);WJ.renderInstances(M0,BJ,R0)}else WJ.render(M0,BJ)};function kK(M,v,d,x){if(P!==null&&M.isNodeMaterial)P.setObject(x,M);if(i0===!0)K0.setState(M,d,!1);if(M.transparent===!0&&M.side===SJ&&M.forceSinglePass===!1)M.side=oJ,M.needsUpdate=!0,n7(M,v,x),M.side=Z7,M.needsUpdate=!0,n7(M,v,x),M.side=SJ;else n7(M,v,x)}this.compile=function(M,v,d=null){if(d===null)d=M;if(P!==null)P.renderStart(M,v,d);if(C=G0.get(d),C.init(v),A.push(C),d.traverseVisible(function(g){if(g.isLight&&g.layers.test(v.layers)){if(C.pushLight(g),g.castShadow)C.pushShadow(g)}}),M!==d)M.traverseVisible(function(g){if(g.isLight&&g.layers.test(v.layers)){if(C.pushLight(g),g.castShadow)C.pushShadow(g)}});if(C.setupLights(),P!==null)P.updateLights(C.state.lightsArray);if(QJ=this.localClippingEnabled,i0=K0.init(this.clippingPlanes,QJ),i0===!0)K0.setGlobalState(this.clippingPlanes,v);if(P!==null)z0.render(C.state.shadowsArray,d,v);let x=new Set;if(M.traverse(function(g){if(!(g.isMesh||g.isPoints||g.isLine||g.isSprite))return;let q0=g.material;if(q0)if(Array.isArray(q0))for(let L0=0;L0<q0.length;L0++){let F0=q0[L0];kK(F0,d,v,g),x.add(F0)}else kK(q0,d,v,g),x.add(q0)}),C=A.pop(),P!==null)P.renderEnd();return x},this.compileAsync=function(M,v,d=null){let x=this.compile(M,v,d);return new Promise((g)=>{function q0(){if(x.forEach(function(L0){let V0=S.get(L0).currentProgram;if(V0===void 0||V0.isReady())x.delete(L0)}),x.size===0){g(M);return}setTimeout(q0,10)}if(t0.get("KHR_parallel_shader_compile")!==null)q0();else setTimeout(q0,10)})};let QQ=null;function GY(M){if(QQ)QQ(M)}function BK(){G8.stop()}function IK(){G8.start()}let G8=new hX;if(G8.setAnimationLoop(GY),typeof self<"u")G8.setContext(self);this.setAnimationLoop=function(M){QQ=M,E0.setAnimationLoop(M),M===null?G8.stop():G8.start()},E0.addEventListener("sessionstart",BK),E0.addEventListener("sessionend",IK),this.render=function(M,v){if(v!==void 0&&v.isCamera!==!0){P0("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(P!==null)P.renderStart(M,v);let d=E0.enabled===!0&&E0.isPresenting===!0,x=O!==null&&(m===null||d)&&O.begin(V,m);if(M.matrixWorldAutoUpdate===!0)M.updateMatrixWorld();if(v.parent===null&&v.matrixWorldAutoUpdate===!0)v.updateMatrixWorld();if(E0.enabled===!0&&E0.isPresenting===!0&&(O===null||O.isCompositing()===!1)){if(E0.cameraAutoUpdate===!0)E0.updateCamera(v);v=E0.getCamera()}if(M.isScene===!0)M.onBeforeRender(V,M,v,m);if(C=G0.get(M,A.length),C.init(v),C.state.textureUnits=l.getTextureUnits(),A.push(C),o0.multiplyMatrices(v.projectionMatrix,v.matrixWorldInverse),d0.setFromProjectionMatrix(o0,wZ,v.reversedDepth),QJ=this.localClippingEnabled,i0=K0.init(this.clippingPlanes,QJ),k=I0.get(M,_.length),k.init(),_.push(k),E0.enabled===!0&&E0.isPresenting===!0){let L0=V.xr.getDepthSensingMesh();if(L0!==null)ZQ(L0,v,-1/0,V.sortObjects)}if(ZQ(M,v,0,V.sortObjects),k.finish(),P!==null)P.updateLights(C.state.lightsArray);if(V.sortObjects===!0)k.sort($0,A0);if(zJ=E0.enabled===!1||E0.isPresenting===!1||E0.hasDepthSensing()===!1,zJ)w0.addToRenderList(k,M);if(this.info.render.frame++,this.info.autoReset===!0)this.info.reset();if(i0===!0)K0.beginShadows();let g=C.state.shadowsArray;if(z0.render(g,M,v),i0===!0)K0.endShadows();if((x&&O.hasRenderPass())===!1){let{opaque:L0,transmissive:F0}=k;if(C.setupLights(),v.isArrayCamera){let V0=v.cameras;if(F0.length>0)for(let B0=0,g0=V0.length;B0<g0;B0++){let l0=V0[B0];zK(L0,F0,M,l0)}if(zJ)w0.render(M);for(let B0=0,g0=V0.length;B0<g0;B0++){let l0=V0[B0];CK(k,M,l0,l0.viewport)}}else{if(F0.length>0)zK(L0,F0,M,v);if(zJ)w0.render(M);CK(k,M,v)}}if(m!==null&&o===0)l.updateMultisampleRenderTarget(m),l.updateRenderTargetMipmap(m);if(x)O.end(V);if(M.isScene===!0)M.onAfterRender(V,M,v);if(U0.resetDefaultState(),Q0=-1,n=null,A.pop(),A.length>0){if(C=A[A.length-1],l.setTextureUnits(C.state.textureUnits),i0===!0)K0.setGlobalState(V.clippingPlanes,C.state.camera)}else C=null;if(_.pop(),_.length>0)k=_[_.length-1];else k=null;if(P!==null)P.renderEnd()};function ZQ(M,v,d,x){if(M.visible===!1)return;if(M.layers.test(v.layers)){if(M.isGroup)d=M.renderOrder;else if(M.isLOD){if(M.autoUpdate===!0)M.update(v)}else if(M.isLightProbeGrid)C.pushLightProbeGrid(M);else if(M.isLight){if(C.pushLight(M),M.castShadow)C.pushShadow(M)}else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(d0)){if(x)qJ.setFromMatrixPosition(M.matrixWorld).applyMatrix4(o0);let L0=c.update(M),F0=M.material;if(F0.visible)k.push(M,L0,F0,d,qJ.z,null,v)}}else if(M.isMesh||M.isLine||M.isPoints){if(!M.frustumCulled||M.intersectsFrustum(d0)){let L0=c.update(M),F0=M.material;if(x){if(M.boundingSphere!==void 0){if(M.boundingSphere===null)M.computeBoundingSphere();qJ.copy(M.boundingSphere.center)}else{if(L0.boundingSphere===null)L0.computeBoundingSphere();qJ.copy(L0.boundingSphere.center)}qJ.applyMatrix4(M.matrixWorld).applyMatrix4(o0)}if(Array.isArray(F0)){let V0=L0.groups;for(let B0=0,g0=V0.length;B0<g0;B0++){let l0=V0[B0],M0=F0[l0.materialIndex];if(M0&&M0.visible)k.push(M,L0,M0,d,qJ.z,l0,v)}}else if(F0.visible)k.push(M,L0,F0,d,qJ.z,null,v)}}}let q0=M.children;for(let L0=0,F0=q0.length;L0<F0;L0++)ZQ(q0[L0],v,d,x)}function CK(M,v,d,x){let{opaque:g,transmissive:q0,transparent:L0}=M;if(C.setupLightsView(d),i0===!0)K0.setGlobalState(V.clippingPlanes,d);if(x)I.viewport(r.copy(x));if(g.length>0)c7(g,v,d);if(q0.length>0)c7(q0,v,d);if(L0.length>0)c7(L0,v,d);I.buffers.depth.setTest(!0),I.buffers.depth.setMask(!0),I.buffers.color.setMask(!0),I.setPolygonOffset(!1)}function zK(M,v,d,x){if((d.isScene===!0?d.overrideMaterial:null)!==null)return;if(C.state.transmissionRenderTarget[x.id]===void 0){let M0=t0.has("EXT_color_buffer_half_float")||t0.has("EXT_color_buffer_float");C.state.transmissionRenderTarget[x.id]=new K9(1,1,{generateMipmaps:!0,type:M0?B9:q9,minFilter:V8,samples:Math.max(4,RJ.samples),stencilBuffer:$,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:u0.workingColorSpace})}let q0=C.state.transmissionRenderTarget[x.id],L0=x.viewport||r;q0.setSize(L0.z*V.transmissionResolutionScale,L0.w*V.transmissionResolutionScale);let F0=V.getRenderTarget(),V0=V.getActiveCubeFace(),B0=V.getActiveMipmapLevel();if(V.setRenderTarget(q0),V.getClearColor(_0),HJ=V.getClearAlpha(),HJ<1)V.setClearColor(16777215,0.5);if(V.clear(),zJ)w0.render(d);let g0=V.toneMapping;V.toneMapping=F9;let l0=x.viewport;if(x.viewport!==void 0)x.viewport=void 0;if(C.setupLightsView(x),i0===!0)K0.setGlobalState(V.clippingPlanes,x);if(c7(M,d,x),l.updateMultisampleRenderTarget(q0),l.updateRenderTargetMipmap(q0),t0.has("WEBGL_multisampled_render_to_texture")===!1){let M0=!1;for(let JJ=0,BJ=v.length;JJ<BJ;JJ++){let DJ=v[JJ],{object:WJ,geometry:yJ,material:R0,group:mJ}=DJ;if(R0.side===SJ&&WJ.layers.test(x.layers)){let a0=R0.side;R0.side=oJ,R0.needsUpdate=!0,_K(WJ,d,x,yJ,R0,mJ),R0.side=a0,R0.needsUpdate=!0,M0=!0}}if(M0===!0)l.updateMultisampleRenderTarget(q0),l.updateRenderTargetMipmap(q0)}if(V.setRenderTarget(F0,V0,B0),V.setClearColor(_0,HJ),l0!==void 0)x.viewport=l0;V.toneMapping=g0}function c7(M,v,d){let x=v.isScene===!0?v.overrideMaterial:null;for(let g=0,q0=M.length;g<q0;g++){let L0=M[g],{object:F0,geometry:V0,group:B0}=L0,g0=L0.material;if(g0.allowOverride===!0&&x!==null)g0=x;if(F0.layers.test(d.layers))_K(F0,v,d,V0,g0,B0)}}function _K(M,v,d,x,g,q0){if(P!==null&&g.isNodeMaterial)P.setObject(M,g);if(M.onBeforeRender(V,v,d,x,g,q0),M.modelViewMatrix.multiplyMatrices(d.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),g.onBeforeRender(V,v,d,x,M,q0),g.transparent===!0&&g.side===SJ&&g.forceSinglePass===!1)g.side=oJ,g.needsUpdate=!0,V.renderBufferDirect(d,v,x,g,M,q0),g.side=Z7,g.needsUpdate=!0,V.renderBufferDirect(d,v,x,g,M,q0),g.side=SJ;else V.renderBufferDirect(d,v,x,g,M,q0);M.onAfterRender(V,v,d,x,g,q0)}function n7(M,v,d){if(v.isScene!==!0)v=sJ;let x=S.get(M),g=C.state.lights,q0=C.state.shadowsArray,L0=g.state.version,F0=a.getParameters(M,g.state,q0,v,d,C.state.lightProbeGridArray),V0=a.getProgramCacheKey(F0),B0=x.programs;x.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?v.environment:null,x.fog=v.fog;let g0=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;if(x.envMap=e.get(M.envMap||x.environment,g0),x.envMapRotation=x.environment!==null&&M.envMap===null?v.environmentRotation:M.envMapRotation,B0===void 0)M.addEventListener("dispose",O9),B0=new Map,x.programs=B0;let l0=B0.get(V0);if(l0!==void 0){if(x.currentProgram===l0&&x.lightsStateVersion===L0)return wK(M,F0),l0}else{if(F0.uniforms=a.getUniforms(M),P!==null&&M.isNodeMaterial)P.build(M,d,F0);M.onBeforeCompile(F0,V),l0=a.acquireProgram(F0,V0),B0.set(V0,l0),x.uniforms=F0.uniforms}let M0=x.uniforms;if(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)M0.clippingPlanes=K0.uniform;if(wK(M,F0),x.needsLights=qY(M),x.lightsStateVersion=L0,x.needsLights)M0.ambientLightColor.value=g.state.ambient,M0.lightProbe.value=g.state.probe,M0.sunLights.value=g.state.sun,M0.sunLightShadows.value=g.state.sunShadow,M0.directionalLights.value=g.state.directional,M0.directionalLightShadows.value=g.state.directionalShadow,M0.spotLights.value=g.state.spot,M0.spotLightShadows.value=g.state.spotShadow,M0.rectAreaLights.value=g.state.rectArea,M0.ltc_1.value=g.state.rectAreaLTC1,M0.ltc_2.value=g.state.rectAreaLTC2,M0.pointLights.value=g.state.point,M0.pointLightShadows.value=g.state.pointShadow,M0.hemisphereLights.value=g.state.hemi,M0.sunShadowMatrix.value=g.state.sunShadowMatrix,M0.sunShadowCascade.value=g.state.sunShadowCascade,M0.directionalShadowMatrix.value=g.state.directionalShadowMatrix,M0.spotLightMatrix.value=g.state.spotLightMatrix,M0.spotLightMap.value=g.state.spotLightMap,M0.pointShadowMatrix.value=g.state.pointShadowMatrix;return x.lightProbeGrid=C.state.lightProbeGridArray.length>0,x.currentProgram=l0,x.uniformsList=null,l0}function AK(M){if(M.uniformsList===null){let v=M.currentProgram.getUniforms();M.uniformsList=m7.seqWithValue(v.seq,M.uniforms)}return M.uniformsList}function wK(M,v){let d=S.get(M);d.outputColorSpace=v.outputColorSpace,d.batching=v.batching,d.batchingColor=v.batchingColor,d.instancing=v.instancing,d.instancingColor=v.instancingColor,d.instancingMorph=v.instancingMorph,d.skinning=v.skinning,d.morphTargets=v.morphTargets,d.morphNormals=v.morphNormals,d.morphColors=v.morphColors,d.morphTargetsCount=v.morphTargetsCount,d.numClippingPlanes=v.numClippingPlanes,d.numIntersection=v.numClipIntersection,d.vertexAlphas=v.vertexAlphas,d.vertexTangents=v.vertexTangents,d.toneMapping=v.toneMapping}function NY(M,v){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;w.setFromMatrixPosition(v.matrixWorld);for(let d=0,x=M.length;d<x;d++){let g=M[d];if(g.texture!==null&&g.boundingBox.containsPoint(w))return g}return null}function EY(M,v,d,x,g){if(v.isScene!==!0)v=sJ;l.resetTextureUnits();let q0=v.fog,L0=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?v.environment:null,F0=m===null?V.outputColorSpace:m.isXRRenderTarget===!0?m.texture.colorSpace:u0.workingColorSpace,V0=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,B0=e.get(x.envMap||L0,V0),g0=x.vertexColors===!0&&!!d.attributes.color&&d.attributes.color.itemSize===4,l0=!!d.attributes.tangent&&(!!x.normalMap||x.anisotropy>0),M0=!!d.morphAttributes.position,JJ=!!d.morphAttributes.normal,BJ=!!d.morphAttributes.color,DJ=F9;if(x.toneMapped){if(m===null||m.isXRRenderTarget===!0)DJ=V.toneMapping}let WJ=d.morphAttributes.position||d.morphAttributes.normal||d.morphAttributes.color,yJ=WJ!==void 0?WJ.length:0,R0=S.get(x),mJ=C.state.lights;if(i0===!0){if(QJ===!0||M!==n){let NJ=M===n&&x.id===Q0;K0.setState(x,M,NJ)}}let a0=!1;if(x.version===R0.__version){if(R0.needsLights&&R0.lightsStateVersion!==mJ.state.version)a0=!0;else if(R0.outputColorSpace!==F0)a0=!0;else if(g.isBatchedMesh&&R0.batching===!1)a0=!0;else if(!g.isBatchedMesh&&R0.batching===!0)a0=!0;else if(g.isBatchedMesh&&R0.batchingColor===!0&&g._colorsTexture===null)a0=!0;else if(g.isBatchedMesh&&R0.batchingColor===!1&&g._colorsTexture!==null)a0=!0;else if(g.isInstancedMesh&&R0.instancing===!1)a0=!0;else if(!g.isInstancedMesh&&R0.instancing===!0)a0=!0;else if(g.isSkinnedMesh&&R0.skinning===!1)a0=!0;else if(!g.isSkinnedMesh&&R0.skinning===!0)a0=!0;else if(g.isInstancedMesh&&R0.instancingColor===!0&&g.instanceColor===null)a0=!0;else if(g.isInstancedMesh&&R0.instancingColor===!1&&g.instanceColor!==null)a0=!0;else if(g.isInstancedMesh&&R0.instancingMorph===!0&&g.morphTexture===null)a0=!0;else if(g.isInstancedMesh&&R0.instancingMorph===!1&&g.morphTexture!==null)a0=!0;else if(R0.envMap!==B0)a0=!0;else if(x.fog===!0&&R0.fog!==q0)a0=!0;else if(R0.numClippingPlanes!==void 0&&(R0.numClippingPlanes!==K0.numPlanes||R0.numIntersection!==K0.numIntersection))a0=!0;else if(R0.vertexAlphas!==g0)a0=!0;else if(R0.vertexTangents!==l0)a0=!0;else if(R0.morphTargets!==M0)a0=!0;else if(R0.morphNormals!==JJ)a0=!0;else if(R0.morphColors!==BJ)a0=!0;else if(R0.toneMapping!==DJ)a0=!0;else if(R0.morphTargetsCount!==yJ)a0=!0;else if(!!R0.lightProbeGrid!==C.state.lightProbeGridArray.length>0)a0=!0}else a0=!0,R0.__version=x.version;let X9=R0.currentProgram;if(a0===!0){if(X9=n7(x,v,g),P&&x.isNodeMaterial)P.onUpdateProgram(x,X9,R0)}let R9=!1,o9=!1,j8=!1,$J=X9.getUniforms(),VJ=R0.uniforms;if(I.useProgram(X9.program))R9=!0,o9=!0,j8=!0;if(x.id!==Q0)Q0=x.id,o9=!0;if(R0.needsLights){let NJ=NY(C.state.lightProbeGridArray,g);if(R0.lightProbeGrid!==NJ)R0.lightProbeGrid=NJ,o9=!0}if(R9||n!==M){if(I.buffers.depth.getReversed()&&M.reversedDepth!==!0)M._reversedDepth=!0,M.updateProjectionMatrix();$J.setValue(j,"projectionMatrix",M.projectionMatrix),$J.setValue(j,"viewMatrix",M.matrixWorldInverse);let r9=$J.map.cameraPosition;if(r9!==void 0)r9.setValue(j,jJ.setFromMatrixPosition(M.matrixWorld));if(RJ.logarithmicDepthBuffer)$J.setValue(j,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2));if(x.isMeshPhongMaterial||x.isMeshToonMaterial||x.isMeshLambertMaterial||x.isMeshBasicMaterial||x.isMeshStandardMaterial||x.isShaderMaterial)$J.setValue(j,"isOrthographic",M.isOrthographicCamera===!0);if(n!==M)n=M,o9=!0,j8=!0}if(R0.needsLights){if(mJ.state.sunShadowMap.length>0)$J.setValue(j,"sunShadowMap",mJ.state.sunShadowMap,l);if(mJ.state.directionalShadowMap.length>0)$J.setValue(j,"directionalShadowMap",mJ.state.directionalShadowMap,l);if(mJ.state.spotShadowMap.length>0)$J.setValue(j,"spotShadowMap",mJ.state.spotShadowMap,l);if(mJ.state.pointShadowMap.length>0)$J.setValue(j,"pointShadowMap",mJ.state.pointShadowMap,l)}if(g.isSkinnedMesh){$J.setOptional(j,g,"bindMatrix"),$J.setOptional(j,g,"bindMatrixInverse");let NJ=g.skeleton;if(NJ){if(NJ.boneTexture===null)NJ.computeBoneTexture();$J.setValue(j,"boneTexture",NJ.boneTexture,l)}}if(g.isBatchedMesh){if($J.setOptional(j,g,"batchingTexture"),$J.setValue(j,"batchingTexture",g._matricesTexture,l),$J.setOptional(j,g,"batchingIdTexture"),$J.setValue(j,"batchingIdTexture",g._indirectTexture,l),$J.setOptional(j,g,"batchingColorTexture"),g._colorsTexture!==null)$J.setValue(j,"batchingColorTexture",g._colorsTexture,l)}let a9=d.morphAttributes;if(a9.position!==void 0||a9.normal!==void 0||a9.color!==void 0)r0.update(g,d,X9);if(o9||R0.receiveShadow!==g.receiveShadow)R0.receiveShadow=g.receiveShadow,$J.setValue(j,"receiveShadow",g.receiveShadow);if((x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial)&&x.envMap===null&&v.environment!==null)VJ.envMapIntensity.value=v.environmentIntensity;if(VJ.dfgLUT!==void 0)VJ.dfgLUT.value=p5();if(o9){if($J.setValue(j,"toneMappingExposure",V.toneMappingExposure),R0.needsLights)FY(VJ,j8);if(q0&&x.fog===!0)D0.refreshFogUniforms(VJ,q0);if(D0.refreshMaterialUniforms(VJ,x,Z0,s,C.state.transmissionRenderTarget[M.id]),R0.needsLights&&R0.lightProbeGrid){let NJ=R0.lightProbeGrid;VJ.probesSH.value=NJ.texture,VJ.probesMin.value.copy(NJ.boundingBox.min),VJ.probesMax.value.copy(NJ.boundingBox.max),VJ.probesResolution.value.copy(NJ.resolution)}m7.upload(j,AK(R0),VJ,l)}if(x.isShaderMaterial&&x.uniformsNeedUpdate===!0)m7.upload(j,AK(R0),VJ,l),x.uniformsNeedUpdate=!1;if(x.isSpriteMaterial)$J.setValue(j,"center",g.center);if($J.setValue(j,"modelViewMatrix",g.modelViewMatrix),$J.setValue(j,"normalMatrix",g.normalMatrix),$J.setValue(j,"modelMatrix",g.matrixWorld),x.uniformsGroups!==void 0){let NJ=x.uniformsGroups;for(let r9=0,v8=NJ.length;r9<v8;r9++){let TK=NJ[r9];O0.update(TK,X9),O0.bind(TK,X9)}}return X9}function FY(M,v){M.ambientLightColor.needsUpdate=v,M.lightProbe.needsUpdate=v,M.sunLights.needsUpdate=v,M.sunLightShadows.needsUpdate=v,M.directionalLights.needsUpdate=v,M.directionalLightShadows.needsUpdate=v,M.pointLights.needsUpdate=v,M.pointLightShadows.needsUpdate=v,M.spotLights.needsUpdate=v,M.spotLightShadows.needsUpdate=v,M.rectAreaLights.needsUpdate=v,M.hemisphereLights.needsUpdate=v}function qY(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return p},this.getActiveMipmapLevel=function(){return o},this.getRenderTarget=function(){return m},this.setRenderTargetTextures=function(M,v,d){let x=S.get(M);if(x.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,x.__autoAllocateDepthBuffer===!1)x.__useRenderToTexture=!1;S.get(M.texture).__webglTexture=v,S.get(M.depthTexture).__webglTexture=x.__autoAllocateDepthBuffer?void 0:d,x.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,v){let d=S.get(M);d.__webglFramebuffer=v,d.__useDefaultFramebuffer=v===void 0},this.setRenderTarget=function(M,v=0,d=0){m=M,p=v,o=d;let x=null,g=!1,q0=!1;if(M){let F0=S.get(M);if(F0.__useDefaultFramebuffer!==void 0){I.bindFramebuffer(j.FRAMEBUFFER,F0.__webglFramebuffer),r.copy(M.viewport),J0.copy(M.scissor),T0=M.scissorTest,I.viewport(r),I.scissor(J0),I.setScissorTest(T0),Q0=-1;return}else if(F0.__webglFramebuffer===void 0)l.setupRenderTarget(M);else if(F0.__hasExternalTextures)l.rebindTextures(M,S.get(M.texture).__webglTexture,S.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let g0=M.depthTexture;if(F0.__boundDepthTexture!==g0){if(g0!==null&&S.has(g0)&&(M.width!==g0.image.width||M.height!==g0.image.height))throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");l.setupDepthRenderbuffer(M)}}let V0=M.texture;if(V0.isData3DTexture||V0.isDataArrayTexture||V0.isCompressedArrayTexture)q0=!0;let B0=S.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget){if(Array.isArray(B0[v]))x=B0[v][d];else x=B0[v];g=!0}else if(M.samples>0&&l.useMultisampledRTT(M)===!1)x=S.get(M).__webglMultisampledFramebuffer;else if(Array.isArray(B0))x=B0[d];else x=B0;r.copy(M.viewport),J0.copy(M.scissor),T0=M.scissorTest}else r.copy(S0).multiplyScalar(Z0).floor(),J0.copy(C0).multiplyScalar(Z0).floor(),T0=CJ;if(d!==0)x=f;if(I.bindFramebuffer(j.FRAMEBUFFER,x))I.drawBuffers(M,x);if(I.viewport(r),I.scissor(J0),I.setScissorTest(T0),g){let F0=S.get(M.texture);j.framebufferTexture2D(j.FRAMEBUFFER,j.COLOR_ATTACHMENT0,j.TEXTURE_CUBE_MAP_POSITIVE_X+v,F0.__webglTexture,d)}else if(q0){let F0=v;for(let V0=0;V0<M.textures.length;V0++){let B0=S.get(M.textures[V0]);j.framebufferTextureLayer(j.FRAMEBUFFER,j.COLOR_ATTACHMENT0+V0,B0.__webglTexture,d,F0)}}else if(M!==null&&d!==0){let F0=S.get(M.texture);j.framebufferTexture2D(j.FRAMEBUFFER,j.COLOR_ATTACHMENT0,j.TEXTURE_2D,F0.__webglTexture,d)}Q0=-1};function PK(M){let v=S.get(M);if(v.__readFormat!==M.format||v.__readType!==M.type)v.__readFormat=M.format,v.__readType=M.type,v.__formatReadable=RJ.textureFormatReadable(M.format),v.__typeReadable=RJ.textureTypeReadable(M.type);return v}if(this.readRenderTargetPixels=function(M,v,d,x,g,q0,L0,F0=0){if(!(M&&M.isWebGLRenderTarget)){P0("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let V0=S.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&L0!==void 0)V0=V0[L0];if(V0){I.bindFramebuffer(j.FRAMEBUFFER,V0);try{let B0=M.textures[F0],g0=B0.format,l0=B0.type;if(M.textures.length>1)j.readBuffer(j.COLOR_ATTACHMENT0+F0);let M0=PK(B0);if(M0.__formatReadable===!1){P0("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(M0.__typeReadable===!1){P0("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(v>=0&&v<=M.width-x&&(d>=0&&d<=M.height-g))j.readPixels(v,d,x,g,i.convert(g0),i.convert(l0),q0)}finally{let B0=m!==null?S.get(m).__webglFramebuffer:null;I.bindFramebuffer(j.FRAMEBUFFER,B0)}}},this.readRenderTargetPixelsAsync=async function(M,v,d,x,g,q0,L0,F0=0){if(!(M&&M.isWebGLRenderTarget))throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let V0=S.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&L0!==void 0)V0=V0[L0];if(V0)if(v>=0&&v<=M.width-x&&(d>=0&&d<=M.height-g)){I.bindFramebuffer(j.FRAMEBUFFER,V0);let B0=M.textures[F0],g0=B0.format,l0=B0.type;if(M.textures.length>1)j.readBuffer(j.COLOR_ATTACHMENT0+F0);let M0=PK(B0);if(M0.__formatReadable===!1)throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(M0.__typeReadable===!1)throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let JJ=j.createBuffer();j.bindBuffer(j.PIXEL_PACK_BUFFER,JJ),j.bufferData(j.PIXEL_PACK_BUFFER,q0.byteLength,j.STREAM_READ),j.readPixels(v,d,x,g,i.convert(g0),i.convert(l0),0),j.bindBuffer(j.PIXEL_PACK_BUFFER,null);let BJ=m!==null?S.get(m).__webglFramebuffer:null;I.bindFramebuffer(j.FRAMEBUFFER,BJ);let DJ=j.fenceSync(j.SYNC_GPU_COMMANDS_COMPLETE,0);return j.flush(),await XX(j,DJ,4),j.bindBuffer(j.PIXEL_PACK_BUFFER,JJ),j.getBufferSubData(j.PIXEL_PACK_BUFFER,0,q0),j.bindBuffer(j.PIXEL_PACK_BUFFER,null),j.deleteBuffer(JJ),j.deleteSync(DJ),q0}else throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,v=null,d=0){let x=Math.pow(2,-d),g=Math.floor(M.image.width*x),q0=Math.floor(M.image.height*x),L0=v!==null?v.x:0,F0=v!==null?v.y:0;l.setTexture2D(M,0),j.copyTexSubImage2D(j.TEXTURE_2D,d,0,0,L0,F0,g,q0),I.unbindTexture()},this.copyTextureToTexture=function(M,v,d=null,x=null,g=0,q0=0){let L0,F0,V0,B0,g0,l0,M0,JJ,BJ,DJ=M.isCompressedTexture?M.mipmaps[q0]:M.image;if(d!==null)L0=d.max.x-d.min.x,F0=d.max.y-d.min.y,V0=d.isBox3?d.max.z-d.min.z:1,B0=d.min.x,g0=d.min.y,l0=d.isBox3?d.min.z:0;else{let VJ=Math.pow(2,-g);if(L0=Math.floor(DJ.width*VJ),F0=Math.floor(DJ.height*VJ),M.isDataArrayTexture)V0=DJ.depth;else if(M.isData3DTexture)V0=Math.floor(DJ.depth*VJ);else V0=1;B0=0,g0=0,l0=0}if(x!==null)M0=x.x,JJ=x.y,BJ=x.z;else M0=0,JJ=0,BJ=0;let WJ=i.convert(v.format),yJ=i.convert(v.type),R0;if(v.isData3DTexture)l.setTexture3D(v,0),R0=j.TEXTURE_3D;else if(v.isDataArrayTexture||v.isCompressedArrayTexture)l.setTexture2DArray(v,0),R0=j.TEXTURE_2D_ARRAY;else l.setTexture2D(v,0),R0=j.TEXTURE_2D;I.activeTexture(j.TEXTURE0),I.pixelStorei(j.UNPACK_FLIP_Y_WEBGL,v.flipY),I.pixelStorei(j.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),I.pixelStorei(j.UNPACK_ALIGNMENT,v.unpackAlignment);let mJ=I.getParameter(j.UNPACK_ROW_LENGTH),a0=I.getParameter(j.UNPACK_IMAGE_HEIGHT),X9=I.getParameter(j.UNPACK_SKIP_PIXELS),R9=I.getParameter(j.UNPACK_SKIP_ROWS),o9=I.getParameter(j.UNPACK_SKIP_IMAGES);I.pixelStorei(j.UNPACK_ROW_LENGTH,DJ.width),I.pixelStorei(j.UNPACK_IMAGE_HEIGHT,DJ.height),I.pixelStorei(j.UNPACK_SKIP_PIXELS,B0),I.pixelStorei(j.UNPACK_SKIP_ROWS,g0),I.pixelStorei(j.UNPACK_SKIP_IMAGES,l0);let j8=M.isDataArrayTexture||M.isData3DTexture,$J=v.isDataArrayTexture||v.isData3DTexture;if(M.isDepthTexture){let VJ=S.get(M),a9=S.get(v),NJ=S.get(VJ.__renderTarget),r9=S.get(a9.__renderTarget);I.bindFramebuffer(j.READ_FRAMEBUFFER,NJ.__webglFramebuffer),I.bindFramebuffer(j.DRAW_FRAMEBUFFER,r9.__webglFramebuffer);for(let v8=0;v8<V0;v8++){if(j8)j.framebufferTextureLayer(j.READ_FRAMEBUFFER,j.COLOR_ATTACHMENT0,S.get(M).__webglTexture,g,l0+v8),j.framebufferTextureLayer(j.DRAW_FRAMEBUFFER,j.COLOR_ATTACHMENT0,S.get(v).__webglTexture,q0,BJ+v8);j.blitFramebuffer(B0,g0,L0,F0,M0,JJ,L0,F0,j.DEPTH_BUFFER_BIT,j.NEAREST)}I.bindFramebuffer(j.READ_FRAMEBUFFER,null),I.bindFramebuffer(j.DRAW_FRAMEBUFFER,null)}else if(g!==0||M.isRenderTargetTexture||S.has(M)){let VJ=S.get(M),a9=S.get(v);I.bindFramebuffer(j.READ_FRAMEBUFFER,u),I.bindFramebuffer(j.DRAW_FRAMEBUFFER,T);for(let NJ=0;NJ<V0;NJ++){if(j8)j.framebufferTextureLayer(j.READ_FRAMEBUFFER,j.COLOR_ATTACHMENT0,VJ.__webglTexture,g,l0+NJ);else j.framebufferTexture2D(j.READ_FRAMEBUFFER,j.COLOR_ATTACHMENT0,j.TEXTURE_2D,VJ.__webglTexture,g);if($J)j.framebufferTextureLayer(j.DRAW_FRAMEBUFFER,j.COLOR_ATTACHMENT0,a9.__webglTexture,q0,BJ+NJ);else j.framebufferTexture2D(j.DRAW_FRAMEBUFFER,j.COLOR_ATTACHMENT0,j.TEXTURE_2D,a9.__webglTexture,q0);if(g!==0)j.blitFramebuffer(B0,g0,L0,F0,M0,JJ,L0,F0,j.COLOR_BUFFER_BIT,j.NEAREST);else if($J)j.copyTexSubImage3D(R0,q0,M0,JJ,BJ+NJ,B0,g0,L0,F0);else j.copyTexSubImage2D(R0,q0,M0,JJ,B0,g0,L0,F0)}I.bindFramebuffer(j.READ_FRAMEBUFFER,null),I.bindFramebuffer(j.DRAW_FRAMEBUFFER,null)}else if($J)if(M.isDataTexture||M.isData3DTexture)j.texSubImage3D(R0,q0,M0,JJ,BJ,L0,F0,V0,WJ,yJ,DJ.data);else if(v.isCompressedArrayTexture)j.compressedTexSubImage3D(R0,q0,M0,JJ,BJ,L0,F0,V0,WJ,DJ.data);else j.texSubImage3D(R0,q0,M0,JJ,BJ,L0,F0,V0,WJ,yJ,DJ);else if(M.isDataTexture)j.texSubImage2D(j.TEXTURE_2D,q0,M0,JJ,L0,F0,WJ,yJ,DJ.data);else if(M.isCompressedTexture)j.compressedTexSubImage2D(j.TEXTURE_2D,q0,M0,JJ,DJ.width,DJ.height,WJ,DJ.data);else j.texSubImage2D(j.TEXTURE_2D,q0,M0,JJ,L0,F0,WJ,yJ,DJ);if(I.pixelStorei(j.UNPACK_ROW_LENGTH,mJ),I.pixelStorei(j.UNPACK_IMAGE_HEIGHT,a0),I.pixelStorei(j.UNPACK_SKIP_PIXELS,X9),I.pixelStorei(j.UNPACK_SKIP_ROWS,R9),I.pixelStorei(j.UNPACK_SKIP_IMAGES,o9),q0===0&&v.generateMipmaps)j.generateMipmap(R0);I.unbindTexture()},this.initRenderTarget=function(M){if(S.get(M).__webglFramebuffer===void 0)l.setupRenderTarget(M)},this.initTexture=function(M){if(M.isCubeTexture)l.setTextureCube(M,0);else if(M.isData3DTexture)l.setTexture3D(M,0);else if(M.isDataArrayTexture||M.isCompressedArrayTexture)l.setTexture2DArray(M,0);else l.setTexture2D(M,0);I.unbindTexture()},this.resetState=function(){p=0,o=0,m=null,I.reset(),U0.reset()},typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return wZ}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(J){this._outputColorSpace=J;let Q=this.getContext();Q.drawingBufferColorSpace=u0._getDrawingBufferColorSpace(J),Q.unpackColorSpace=u0._getUnpackColorSpace()}}function t6(J){let Q=J>>>0;return()=>{return Q=Q*1664525+1013904223>>>0,Q/4294967296}}function FK(J){return new Promise((Q,Z)=>{let K=new Image;K.crossOrigin="anonymous",K.onload=()=>Q(K),K.onerror=()=>Z(Error("img "+J)),K.src=J})}function qK(J,Q=26,Z=26){let K=document.createElement("canvas");K.width=J.naturalWidth,K.height=J.naturalHeight;let $=K.getContext("2d");$.drawImage(J,0,0);let X=$.getImageData(0,0,K.width,K.height),Y=X.data;for(let W=0;W<Y.length;W+=4){let U=Math.max(Y[W],Y[W+1],Y[W+2]);if(U<=Q){Y[W+3]=0;continue}if(U<Q+Z)Y[W+3]=Math.min(Y[W+3],Math.floor((U-Q)/Z*255))}return $.putImageData(X,0,0),K}function aX(J,Q){if(Q==="blue")return J;let Z=document.createElement("canvas");Z.width=J.width,Z.height=J.height;let K=Z.getContext("2d");return K.filter="hue-rotate(140deg) saturate(1.25) brightness(1.02)",K.drawImage(J,0,0),K.filter="none",Z}function H7(J,Q){let Z=document.createElement("canvas");Z.width=Z.height=J;let K=Z.getContext("2d"),$=K.createRadialGradient(J/2,J/2,0,J/2,J/2,J/2);for(let[X,Y]of Q)$.addColorStop(X,Y);return K.fillStyle=$,K.fillRect(0,0,J,J),Z}var r6={sandBlobs:[[0.005,0.02,0.185,0.2],[0.205,0.02,0.175,0.2],[0.39,0.02,0.19,0.21],[0.06,0.24,0.17,0.16],[0.56,0.25,0.21,0.18],[0.2,0.24,0.17,0.16]],cracked:[[0.585,0.03,0.13,0.12],[0.735,0.03,0.11,0.12],[0.86,0.02,0.13,0.18]],grass:[[0.4,0.24,0.16,0.16],[0.02,0.25,0.16,0.14],[0.79,0.28,0.12,0.13],[0.88,0.27,0.1,0.16],[0.45,0.42,0.12,0.1],[0.02,0.41,0.17,0.07],[0.75,0.44,0.22,0.16],[0.74,0.62,0.24,0.18],[0.75,0.82,0.22,0.16],[0.5,0.78,0.2,0.16],[0.55,0.47,0.16,0.12]]},EK=[205,181,138];function rX(J,Q=1337){let K=2048/W0,$=document.createElement("canvas");$.width=$.height=2048;let X=$.getContext("2d"),Y=t6(Q);for(let N=0;N<k0;N++)for(let F=0;F<W0;F++){let G=(Y()-0.5)*26,D=(Y()-0.5)*10,R=EK[0]+G+D,B=EK[1]+G*0.9+D,q=EK[2]+G*0.7;X.fillStyle=`rgb(${R|0},${B|0},${q|0})`,X.fillRect(F*K,N*K,K+1,K+1)}for(let N=0;N<46;N++){let F=Y()*2048,G=Y()*2048,D=120+Y()*320,R=Y()<0.5,B=X.createRadialGradient(F,G,0,F,G,D);B.addColorStop(0,R?"rgba(150,125,88,0.14)":"rgba(228,208,164,0.13)"),B.addColorStop(1,"rgba(0,0,0,0)"),X.fillStyle=B,X.fillRect(F-D,G-D,D*2,D*2)}let W=(N,F)=>{X.lineCap="round",X.lineJoin="round";let G=()=>{X.beginPath(),X.moveTo(N[0][0]*K,N[0][1]*K);for(let D=1;D<N.length;D++)X.lineTo(N[D][0]*K,N[D][1]*K)};X.strokeStyle="rgba(120,98,66,0.35)",X.lineWidth=F*1.28,G(),X.stroke(),X.strokeStyle="#c9b083",X.lineWidth=F,G(),X.stroke(),X.strokeStyle="rgba(176,152,110,0.9)",X.lineWidth=F*0.62,G(),X.stroke(),X.strokeStyle="rgba(122,100,70,0.5)",X.lineWidth=Math.max(1.5,F*0.07);for(let D of[-0.18,0.18]){X.beginPath();for(let R=0;R<N.length-1;R++){let[B,q]=N[R],[E,z]=N[R+1],w=E-B,k=z-q,C=Math.hypot(w,k)||1,_=-k/C*D*F,A=w/C*D*F;X.moveTo(B*K+_,q*K+A),X.lineTo(E*K+_,z*K+A)}X.stroke()}},U=W0/2;if(W([[8.5,k0/2],[U,k0/2]],K*1.15),W([[U,k0/2],[U,14.5]],K*0.85),W([[U,k0/2],[U,k0-14.5]],K*0.85),J){let N=qK(J),F=(D,R,B,q,E=0)=>{let[z,w,k,C]=D,_=z*N.width,A=w*N.height,O=k*N.width,V=C*N.height;X.save(),X.translate(R,B),X.rotate(E);let b=V/O;X.drawImage(N,_,A,O,V,-q/2,-(q*b)/2,q,q*b),X.restore()},G=[...r6.sandBlobs.map((D)=>({r:D,kind:0})),...r6.cracked.map((D)=>({r:D,kind:1})),...r6.grass.map((D)=>({r:D,kind:2}))];for(let D=0;D<150;D++){let R=G[Math.floor(Y()*G.length)],B=(R.kind===2?70:110)+Y()*190;F(R.r,Y()*2048,Y()*2048,B,Y()*Math.PI*2)}for(let D=0;D<26;D++){let R=Y(),B=(8.5+(U-8.5)*R)*K,q=k0/2*K+(Y()-0.5)*K*2.4;F(r6.grass[6],B,q,60+Y()*90,Y()*6.28)}}let H=new uJ($);return H.colorSpace=Y8,H.anisotropy=8,{canvas:$,texture:H}}function tX(J,Q,Z){let K=document.createElement("canvas");return K.width=Q,K.height=Z,K.getContext("2d").drawImage(J,0,0,Q,Z),K}var H8={1:{body:11026478,accent:14184526,dark:6168084,light:13129784},2:{body:3828392,accent:6725848,dark:1849956,light:4882622},0:{body:9078136,accent:11907232,dark:5591626,light:10130826}},l7=3817284,G7=2500651;var m5=14198904,eX=new Map;function y0(J,Q={}){let Z=`${J}-${Q.rough??0.8}-${Q.metal??0.15}-${Q.emissive??0}-${Q.opacity??1}`,K=eX.get(Z);if(!K)K=new n9({color:J,roughness:Q.rough??0.8,metalness:Q.metal??0.15,emissive:Q.emissive??0,emissiveIntensity:Q.emissive?1:0,transparent:Q.transparent??!1,opacity:Q.opacity??1}),eX.set(Z,K);return K}function YJ(J,Q,Z,K,$=0,X=0,Y=0){let W=new b0(new cJ(J,Q,Z),K);return W.position.set($,X,Y),W.castShadow=!0,W}function s9(J,Q,Z,K=0,$=0,X=0,Y=10){let W=new b0(new aJ(J,J,Q,Y),Z);return W.position.set(K,$,X),W.castShadow=!0,W}function e6(J,Q,Z=0,K=0,$=0){let X=new b0(new _8(J,10,8),Q);return X.position.set(Z,K,$),X.castShadow=!0,X}function l5(J,Q){let Z=new AJ,K=y0(J.body,{rough:0.85}),$=y0(J.dark,{rough:0.9});Z.add(YJ(0.09,0.16,0.11,y0(G7),0,0.08,0));let X=YJ(0.17,0.2,0.13,K,0,0.27,0);Z.add(X),Z.add(YJ(0.11,0.15,0.07,$,-0.02,0.3,-0.11)),Z.add(e6(0.072,y0(m5,{rough:0.9}),0,0.43,0));let Y=e6(0.088,$,0,0.45,0);if(Y.scale.y=0.72,Z.add(Y),Q==="rifle"){let W=YJ(0.03,0.03,0.3,y0(l7,{metal:0.5,rough:0.5}),0.1,0.28,0.08);W.rotation.x=-0.12,Z.add(W)}else if(Q==="mg")Z.add(YJ(0.05,0.06,0.36,y0(l7,{metal:0.5,rough:0.5}),0.12,0.26,0.06)),Z.add(YJ(0.08,0.08,0.1,$,-0.05,0.24,0.1));else{let W=s9(0.045,0.52,y0(4870712,{rough:0.7}),0.06,0.38,0.05,8);W.rotation.x=Math.PI/2-0.28,Z.add(W)}return Z}function JY(J,Q,Z){let K=new AJ,$=y0(G7,{rough:0.95});return K.add(YJ(0.36,0.32,Q,$,Z,0.16,0)),K.add(YJ(0.36,0.32,Q,$,-Z,0.16,0)),K.add(YJ(0.4,0.05,Q*0.9,y0(H8[1].dark),Z,0.36,0)),K.add(YJ(0.4,0.05,Q*0.9,y0(H8[1].dark),-Z,0.36,0)),K}function d5(J,Q,Z,K){let $=new AJ,X=y0(J.body,{rough:0.75,metal:0.25});$.add(YJ(Q,Z,K*0.62,X,0,0,-K*0.06));let Y=YJ(Q*0.96,Z*0.8,K*0.34,X,0,-Z*0.06,K*0.38);Y.rotation.x=-0.32,$.add(Y);let W=YJ(Q*0.96,Z*0.7,K*0.14,y0(J.dark),0,-Z*0.08,-K*0.42);return W.rotation.x=0.25,$.add(W),$}function QY(J,Q){let Z=H8[Q],K=new AJ,$=[],X,Y,W=0.8;if(J.kind==="infantry"){let U=J.id==="mg"?"mg":J.id==="rpg"?"rpg":"rifle",H=3,N=new AJ;for(let F=0;F<3;F++){let G=l5(Z,U),D=F/3*Math.PI*2;G.position.set(Math.cos(D)*0.2,0,Math.sin(D)*0.2),G.rotation.y=-D+0.4,G.scale.setScalar(1.3),N.add(G),$.push(G.children[1])}K.add(N),W=0.78}else if(J.id==="tank"||J.id==="mammoth"){let U=J.id==="mammoth",H=U?1.32:1,N=2.15*H,F=1.15*H;K.add(JY(Z,N,F/2+0.06)),K.add(d5(Z,F,0.4*H,N)),X=new AJ,X.position.set(0,0.62*H,-0.08*H);let G=y0(Z.body,{rough:0.7,metal:0.3});X.add(YJ(0.78*H,0.3*H,1*H,G)),X.add(YJ(0.6*H,0.14*H,0.7*H,y0(Z.dark),0,0.2*H,0.05*H));let D=s9(0.17*H,0.09*H,y0(Z.dark),-0.15*H,0.3*H,-0.1*H,8);X.add(D);let R=new AJ,B=y0(l7,{metal:0.55,rough:0.45});if(U)for(let z of[-0.13,0.13]){let w=s9(0.062*H,1.55*H,B,z,0.02,0.95*H,8);w.rotation.x=Math.PI/2,R.add(w)}else{let z=s9(0.07,1.5*H,B,0,0.02,0.95*H,8);z.rotation.x=Math.PI/2,R.add(z)}X.add(R);let q=YJ(0.3*H,0.22*H,0.25*H,y0(Z.dark),0,0.02,0.42*H);X.add(q);let E=s9(0.012,0.7,y0(G7),-0.3*H,0.5*H,-0.4*H,4);X.add(E),K.add(X),W=0.95*H}else if(J.id==="artillery"){K.add(JY(Z,1.6,0.62));let H=y0(Z.body,{rough:0.75,metal:0.25});K.add(YJ(1.05,0.34,1.32,H,0,0.4,-0.12)),K.add(YJ(0.95,0.42,0.55,y0(Z.dark),0,0.72,0.55)),K.add(YJ(0.97,0.16,0.3,y0(10406104,{rough:0.2,metal:0.4}),0,0.78,0.72));let N=new AJ;N.position.set(0,0.78,-0.35),N.rotation.x=-0.42;let F=YJ(0.85,0.52,1.05,y0(4869954,{rough:0.8,metal:0.3}));N.add(F);let G=s9(0.075,0.06,y0(1974564,{rough:0.9}),0,0,0.54,8);G.rotation.x=Math.PI/2,N.add(G);for(let[D,R]of[[-0.2,0.42],[0.2,0.42],[-0.2,0.6],[0.2,0.6]]){let B=s9(0.075,0.06,y0(1974564,{rough:0.9}),D,R-0.5,0.54,8);B.rotation.x=Math.PI/2,N.add(B)}X=N,K.add(N),W=1.15}else{let U=y0(Z.body,{rough:0.6,metal:0.35}),H=e6(0.42,U,0,0,0.1);H.scale.set(0.75,0.7,1.35),K.add(H),K.add(e6(0.26,y0(1582126,{rough:0.15,metal:0.6}),0,0.06,0.52));let N=YJ(0.13,0.13,1.15,U,0,0.05,-0.85);K.add(N);let F=YJ(0.05,0.42,0.3,y0(Z.dark),0,0.24,-1.35);K.add(F);let G=YJ(1.7,0.06,0.34,y0(Z.dark),0,0.02,0.05);K.add(G);for(let q of[-0.72,0.72]){let E=s9(0.09,0.42,y0(l7,{metal:0.5,rough:0.5}),q,-0.06,0.1,8);E.rotation.x=Math.PI/2,K.add(E)}for(let q of[-0.28,0.28])K.add(YJ(0.05,0.05,0.9,y0(G7),q,-0.42,0.05)),K.add(YJ(0.04,0.24,0.05,y0(G7),q,-0.3,0.3)),K.add(YJ(0.04,0.24,0.05,y0(G7),q,-0.3,-0.2));Y=new AJ,Y.position.set(0,0.52,0);let D=YJ(2.1,0.02,0.14,y0(3027510,{rough:0.7})),R=D.clone();R.rotation.y=Math.PI/2,Y.add(D,R),Y.add(s9(0.06,0.14,y0(l7),0,0.02,0,8)),K.add(Y);let B=YJ(0.02,0.5,0.08,y0(3027510),0.08,0.24,-1.38);K.add(B),W=0.9}return K.traverse((U)=>{if(U instanceof b0)U.receiveShadow=!1}),{group:K,turret:X,rotor:Y,animNodes:$,height:W,radius:J.radius}}var A9=W0/2,rJ=(J,Q)=>[J-A9,Q-A9],u5=(J,Q)=>[J+A9,Q+A9];class DK{canvas;assetBase;renderer;scene=new j6;camera;sun;boomLight;raycaster=new n6;groundPlane=new W9(new h(0,1,0),0);unitViews=new Map;bldViews=new Map;tracerViews=new Map;handledBooms=new Set;fxSprites=[];debris=[];burners=[];markers=[];scorches=[];textTexCache=new Map;fogCanvas;fogTex;fogData;fogAcc=0;miniBg=null;groundCanvas=null;texFlash;texSmoke;texScorch;texGlow;texShadow;canvasW=1;canvasH=1;disposed=!1;time=0;constructor(J,Q="/aow3/"){this.canvas=J;this.assetBase=Q;this.renderer=new GK({canvas:J,antialias:!0,powerPreference:"high-performance"}),this.renderer.outputColorSpace=Y8,this.renderer.toneMapping=z7,this.renderer.toneMappingExposure=1.12,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=O8,this.renderer.setClearColor(11060444),this.camera=new bJ(38,1,1,500),this.scene.fog=new j7(13616034,110,260);let Z=new m6(14215423,9075285,0.9);this.scene.add(Z),this.sun=new c6(16773848,2.7),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048);let K=this.sun.shadow.camera;K.left=-46,K.right=46,K.top=46,K.bottom=-46,K.near=5,K.far=180,this.sun.shadow.bias=-0.0005,this.sun.shadow.normalBias=0.03,this.scene.add(this.sun,this.sun.target),this.boomLight=new u6(16756832,0,20,1.6),this.scene.add(this.boomLight),this.texFlash=new uJ(H7(64,[[0,"rgba(255,255,230,1)"],[0.3,"rgba(255,220,120,0.95)"],[1,"rgba(255,180,60,0)"]])),this.texGlow=new uJ(H7(64,[[0,"rgba(255,240,190,1)"],[0.4,"rgba(255,160,60,0.8)"],[1,"rgba(255,120,40,0)"]])),this.texSmoke=new uJ(H7(64,[[0,"rgba(70,64,58,0.85)"],[0.6,"rgba(90,82,72,0.4)"],[1,"rgba(100,95,85,0)"]])),this.texScorch=new uJ(H7(64,[[0,"rgba(20,16,12,0.75)"],[0.55,"rgba(30,24,18,0.4)"],[1,"rgba(40,34,26,0)"]])),this.texShadow=new uJ(H7(64,[[0,"rgba(0,0,0,0.42)"],[0.7,"rgba(0,0,0,0.22)"],[1,"rgba(0,0,0,0)"]]))}async load(){let J=this.assetBase,[Q,Z]=await Promise.allSettled([FK(J+"ground-jungle.png"),FK(J+"bld-sprite.png")]),K=Q.status==="fulfilled"?Q.value:null,$=rX(K,1337);this.groundCanvas=$.canvas,this.buildStaticWorld($.texture,Z.status==="fulfilled"?Z.value:null)}buildStaticWorld(J,Q){let Z=new b0(new $9(W0,k0),new n9({map:J,roughness:1,metalness:0}));Z.rotation.x=-Math.PI/2,Z.receiveShadow=!0,this.scene.add(Z);let K=new b0(new $9(560,560),new n9({color:12167294,roughness:1}));K.rotation.x=-Math.PI/2,K.position.y=-0.08,this.scene.add(K),this.fogCanvas=document.createElement("canvas"),this.fogCanvas.width=W0,this.fogCanvas.height=k0,this.fogData=this.fogCanvas.getContext("2d").createImageData(W0,k0),this.fogTex=new uJ(this.fogCanvas),this.fogTex.magFilter=k9,this.fogTex.minFilter=xJ;let $=new b0(new $9(W0,k0),new gJ({map:this.fogTex,transparent:!0,depthWrite:!1}));$.rotation.x=-Math.PI/2,$.position.y=0.18,$.renderOrder=30,this.scene.add($),this.hqTextures(Q),this.placeBaseProps()}applyTerrainGrid(J){for(let _ of this.scatterMeshes)this.scene.remove(_),_.dispose();if(this.scatterMeshes=[],!this.scatterGeo)this.scatterGeo={trunk:new aJ(0.09,0.16,1,6),cone:new y7(0.62,1.5,7),rock:new f7(0.55),bush:new _8(0.42,7,5)};let Q=this.scatterGeo,Z=[],K=[];for(let _=0;_<k0;_++)for(let A=0;A<W0;A++){if(J[_*W0+A]!==1)continue;(A===0||_===0||A===W0-1||_===k0-1?K:Z).push([A,_])}let $=t6(424242),X=new MJ,Y=new x0(4873776),W=new x0(6257210),U=y0(6967864,{rough:0.95}),H=new n9({color:16777215,roughness:0.9}),N=y0(11049088,{rough:1}),F=new n9({color:16777215,roughness:0.95}),G={tree:Math.max(64,Z.length),rock:Math.max(64,Z.length+K.length),bush:Math.max(64,Math.ceil(Z.length*0.3)+K.length)},D=new U8(Q.trunk,U,G.tree),R=new U8(Q.cone,H,G.tree),B=new U8(Q.cone,H,G.tree),q=new U8(Q.rock,N,G.rock),E=new U8(Q.bush,F,G.bush);[D,R,B,q,E].forEach((_)=>{_.castShadow=!0,_.receiveShadow=!0});let z=0,w=0,k=0,C=(_,A,O,V,b,P,f,u)=>{X.position.set(O,V,b),X.rotation.set(0,f,0),X.scale.set(P,u??P,P),X.updateMatrix(),_.setMatrixAt(A,X.matrix)};for(let[_,A]of Z){let[O,V]=rJ(_,A),b=$();if(b<0.58&&z<G.tree){let P=1.5+$()*1.1;C(D,z,O,P*0.33,V,0.9+$()*0.5,$()*6.28,P/1);let f=Y.clone().lerp(W,$());C(R,z,O,P*0.78,V,1+$()*0.45,$()*6.28),C(B,z,O,P*1.18,V,0.72+$()*0.3,$()*6.28),R.setColorAt(z,f),B.setColorAt(z,f.clone().multiplyScalar(1.12)),z++}else if(b<0.85&&w<G.rock)C(q,w,O,0.16+$()*0.12,V,0.7+$()*0.9,$()*6.28,0.55+$()*0.4),w++;else if(k<G.bush)C(E,k,O,0.18,V,0.7+$()*0.7,$()*6.28,0.6),E.setColorAt(k,Y.clone().lerp(W,$()).multiplyScalar(0.85)),k++}for(let[_,A]of K){let[O,V]=rJ(_,A);if(w<G.rock)C(q,w,O,0.3+$()*0.4,V,1.6+$()*1.4,$()*6.28,0.9+$()*0.8),w++;if($()<0.2&&k<G.bush)C(E,k,O,0.2,V,1,$()*6.28,0.7),E.setColorAt(k,Y),k++}D.count=z,R.count=z,B.count=z,q.count=w,E.count=k,[D,R,B,q,E].forEach((_)=>{if(_.instanceMatrix.needsUpdate=!0,_.instanceColor)_.instanceColor.needsUpdate=!0;this.scene.add(_),this.scatterMeshes.push(_)})}hqBlue;hqRed;scatterMeshes=[];scatterGeo=null;hqTextures(J){let Q=document.createElement("canvas");Q.width=8,Q.height=8;let Z=J?qK(J,30,30):Q;this.hqBlue=new uJ(Z),this.hqBlue.colorSpace=Y8,this.hqRed=new uJ(aX(Z,"red")),this.hqRed.colorSpace=Y8}placeBaseProps(){let J=t6(777),Q=new AJ,Z=[11031114,4881320,9079378,11567168,7371396],K=[[8,k0/2],[W0-8,k0/2],[W0/2,14],[W0/2,k0-14]];for(let[$,X]of K){let[Y,W]=rJ($,X);for(let U=0;U<5;U++){let H=J()*Math.PI*2,N=4.2+J()*2.6,F=Y+Math.cos(H)*N,G=W+Math.sin(H)*N,D=Math.round(F+A9),R=Math.round(G+A9);if(D<2||R<2||D>=W0-2||R>=k0-2)continue;let B=J();if(B<0.45){let q=Z[Math.floor(J()*Z.length)],E=new b0(new cJ(2.6,1.15,1.15),y0(q,{rough:0.7,metal:0.35}));E.position.set(F,0.58,G),E.rotation.y=J()*Math.PI,E.castShadow=!0,Q.add(E)}else if(B<0.75){let q=new b0(new cJ(1.7,0.55,0.5),y0(12560506,{rough:1}));q.position.set(F,0.28,G),q.rotation.y=J()*Math.PI,q.castShadow=!0,Q.add(q)}else{let q=new b0(new aJ(0.3,0.3,0.72,9),y0(11561520,{rough:0.7,metal:0.3}));q.position.set(F,0.36,G),q.castShadow=!0,Q.add(q)}}}this.scene.add(Q)}render(J,Q,Z,K){c5(J),this.time+=J,this.syncCamera(Z,Q),this.syncBuildings(Q),this.syncUnits(Q,K),this.syncProjectiles(Q),this.syncBooms(Q),this.syncFx(J),this.updateFog(Q,J),this.renderer.render(this.scene,this.camera)}syncCamera(J,Q){let[Z,K]=rJ(J.x,J.y);this.camera.position.set(Z,J.dist*0.98,K+J.dist*0.44),this.camera.lookAt(Z,0,K),this.sun.position.set(Z-30,58,K-22),this.sun.target.position.set(Z,0,K),this.sun.target.updateMatrixWorld()}syncBuildings(J){let Q=new Set;for(let Z of J.buildings){Q.add(Z.id);let K=this.bldViews.get(Z.id);if(!K)K=this.makeBuilding(Z),this.bldViews.set(Z.id,K);if(K.flag){let X=Z.owner===1?H8[1].accent:Z.owner===2?H8[2].accent:13157556;K.flag.material.color.setHex(X)}if(K.capRing){let X=Z.captureT;if(X>0.05){K.capRing.visible=!0;let Y=Math.min(1,X/9)*Math.PI*2,W=K.capRing.geometry;K.capRing.geometry=new D9(1.55,1.85,28,1,-Math.PI/2,Y),W.dispose(),K.capRing.material.color.setHex(Z.captureBy===1?H8[1].accent:Z.captureBy===2?H8[2].accent:14540253)}else K.capRing.visible=!1}let $=Z.defId==="depot"&&Z.owner!==1&&!J.explored[Math.round(Z.y)*W0+Math.round(Z.x)];if(K.group.visible=!$,K.shadow)K.shadow.visible=!$}for(let[Z,K]of this.bldViews)if(!Q.has(Z))this.scene.remove(K.group),this.bldViews.delete(Z)}makeBuilding(J){let Q=new AJ,[Z,K]=rJ(J.x,J.y);Q.position.set(Z,0,K);let $={group:Q},X=new c9(new C9({map:this.texShadow,transparent:!0,depthWrite:!1}));if(X.scale.set(J.defId==="hq"?10:5.4,J.defId==="hq"?10:5.4,1),X.position.set(0.9,0.03,0.8),X.renderOrder=2,Q.add(X),$.shadow=X,J.defId==="hq"){let Y=new b0(new aJ(2.3,2.5,0.2,10),y0(8222571,{rough:1}));Y.receiveShadow=!0,Q.add(Y);let W=J.owner===1,U=new b0(new $9(7,7),new gJ({map:W?this.hqRed:this.hqBlue,transparent:!0,depthWrite:!1}));U.position.y=2.6,U.renderOrder=5,Q.add(U);let H=new b0(new aJ(0.045,0.045,1.7,6),y0(5592405,{metal:0.5,rough:0.5}));H.position.set(0,6.1,0),Q.add(H);let N=new b0(new $9(1.15,0.7),new gJ({color:13157556,side:SJ}));N.position.set(0.62,6.55,0),Q.add(N),$.flag=N}else{let Y=new b0(new aJ(1.9,2,0.16,9),y0(10130052,{rough:1}));Y.receiveShadow=!0,Q.add(Y);let W=new b0(new aJ(0.62,0.62,2,10),y0(13156528,{rough:0.5,metal:0.45}));W.rotation.z=Math.PI/2,W.position.y=0.85,W.castShadow=!0,Q.add(W);for(let G of[-0.7,0.7]){let D=new b0(new cJ(0.14,0.5,0.14),y0(5592400));D.position.set(G,0.3,0),Q.add(D)}let U=new b0(new cJ(0.9,0.6,0.8),y0(9078136));U.position.set(1,0.4,0.7),U.castShadow=!0,Q.add(U);let H=new b0(new aJ(0.04,0.04,2.3,6),y0(5592405,{metal:0.5,rough:0.5}));H.position.set(-1.2,1.2,-0.6),Q.add(H);let N=new b0(new $9(0.85,0.5),new gJ({color:13157556,side:SJ}));N.position.set(-0.78,2.1,-0.6),Q.add(N),$.flag=N;let F=new b0(new D9(1.55,1.85,28,1,-Math.PI/2,Math.PI*2),new gJ({color:16777215,transparent:!0,opacity:0.9,depthWrite:!1,side:SJ}));F.rotation.x=-Math.PI/2,F.position.y=0.28,F.visible=!1,Q.add(F),$.capRing=F}return this.scene.add(Q),$}syncUnits(J,Q){let Z=J.visible[0],K=new Set;for(let $ of J.units){K.add($.id);let X=$.owner===1||!!Z[Math.round($.y)*W0+Math.round($.x)],Y=this.unitViews.get($.id);if(!Y){if(!X)continue;Y=this.makeUnitView($),this.unitViews.set($.id,Y)}let W=Y.model.group;if(W.visible=X,!X)continue;let[U,H]=rJ($.x,$.y),N=1-Math.exp(-16*N7());Y.pos.x+=(U-Y.pos.x)*N,Y.pos.z+=(H-Y.pos.z)*N;let F=-$.facing,G=F-Y.yaw;while(G>Math.PI)G-=Math.PI*2;while(G<-Math.PI)G+=Math.PI*2;Y.yaw+=G*Math.min(1,12*N7());let D=$.def.kind==="aircraft";if(W.position.set(Y.pos.x,D?2.1+Math.sin(this.time*2.1+$.id)*0.09:0,Y.pos.z),W.rotation.y=Y.yaw,Y.model.turret){let E=F-Y.yaw-Y.model.turret.rotation.y;while(E>Math.PI)E-=Math.PI*2;while(E<-Math.PI)E+=Math.PI*2;Y.model.turret.rotation.y+=E*Math.min(1,6*N7())}if(Y.model.rotor)Y.model.rotor.rotation.y+=26*N7();if(Math.hypot($.vx,$.vy)>0.008){let E=this.time*11+$.id*1.7;Y.model.animNodes.forEach((z,w)=>{z.position.y=0.27+Math.abs(Math.sin(E+w*2.1))*0.045})}else Y.model.animNodes.forEach((E)=>{E.position.y*=0.85});if(Y.spawnT<1){Y.spawnT=Math.min(1,Y.spawnT+N7()*5);let E=0.3+0.7*Y.spawnT;W.scale.setScalar(E)}if(Y.shadow)Y.shadow.position.set(Y.pos.x+0.7,0.05,Y.pos.z+0.6),Y.shadow.visible=W.visible;let B=Q.has($.id);if(Y.selRing.visible=B,B){let E=1+Math.sin(this.time*7)*0.05,z=$.def.radius*1.5+0.45;Y.selRing.scale.setScalar(z*E)}if($.captureT!==void 0&&$.captureT>0.05){Y.capRing.visible=!0;let E=Math.min(1,$.captureT/9)*Math.PI*2,z=Y.capRing.geometry;Y.capRing.geometry=new D9($.def.radius+0.25,$.def.radius+0.42,22,1,-Math.PI/2,E),z.dispose()}else Y.capRing.visible=!1;let q=$.hp/$.def.health;if(q<0.999||B){if(Y.hpSprite.visible=!0,Math.abs(q-Y.lastHp)>0.01)Y.lastHp=q,this.paintHp(Y.hpCanvas,q),Y.hpTex.needsUpdate=!0;Y.hpSprite.position.y=Y.model.height+0.42}else Y.hpSprite.visible=!1}for(let[$,X]of this.unitViews){if(K.has($))continue;let Y=X.model.group.userData.unit;if(this.spawnWreck(X),this.scene.remove(X.model.group,X.hpSprite,X.selRing,X.capRing),X.shadow)this.scene.remove(X.shadow);this.unitViews.delete($)}}makeUnitView(J){let Q=QY(J.def,J.owner);Q.group.userData.unit=J;let[Z,K]=rJ(J.x,J.y);Q.group.position.set(Z,J.def.kind==="aircraft"?2.1:0,K),this.scene.add(Q.group);let $=document.createElement("canvas");$.width=64,$.height=10;let X=new uJ($),Y=new c9(new C9({map:X,transparent:!0,depthWrite:!1}));Y.scale.set(1.5,0.24,1),Y.visible=!1,Y.renderOrder=40,this.scene.add(Y);let W=new b0(new D9(0.82,1,26),new gJ({color:9109354,transparent:!0,opacity:0.95,depthWrite:!1,side:SJ}));W.rotation.x=-Math.PI/2,W.position.y=0.07,W.visible=!1,this.scene.add(W);let U=new b0(new D9(0.7,0.85,22,1,-Math.PI/2,Math.PI*2),new gJ({color:16769658,transparent:!0,opacity:0.9,depthWrite:!1,side:SJ}));U.rotation.x=-Math.PI/2,U.position.y=0.06,U.visible=!1,this.scene.add(U);let H={model:Q,hpSprite:Y,hpCanvas:$,hpTex:X,selRing:W,capRing:U,pos:new h(Z,0,K),yaw:-J.facing,spawnT:0,lastHp:-1};if(J.def.kind==="aircraft"){let N=new c9(new C9({map:this.texShadow,transparent:!0,depthWrite:!1}));N.scale.set(2.6,2.6,1),this.scene.add(N),H.shadow=N}return H}paintHp(J,Q){let Z=J.getContext("2d");Z.clearRect(0,0,64,10),Z.fillStyle="rgba(8,8,8,0.78)",Z.fillRect(0,0,64,10),Z.strokeStyle="rgba(0,0,0,0.9)",Z.strokeRect(0.5,0.5,63,9),Z.fillStyle=Q>0.55?"#58d858":Q>0.25?"#d8c840":"#e05840",Z.fillRect(2,2,60*Math.max(0,Q),6)}spawnWreck(J){let Q=J.model.group.userData.unit,[Z,K]=rJ(Q.x,Q.y);if(this.addScorch(Z,K,Q.def.radius*2.4),Q.def.kind==="infantry")this.puff(Z,0.3,K,0.5,0.7);else this.explosion(Z,0.4,K,Q.def.radius+1),this.burners.push({x:Z,z:K,ttl:6,acc:0})}syncProjectiles(J){let Q=new Set;for(let Z of J.projectiles){Q.add(Z);let K=this.tracerViews.get(Z);if(!K){let N=Z.splash<=0.6&&Z.speed>=20,F=new cJ(N?0.55:0.28,0.05,0.05),G=new b0(F,new gJ({color:N?16773304:16756832,transparent:!0,opacity:0.95,blending:$8,depthWrite:!1})),D=new c9(new C9({map:this.texGlow,transparent:!0,blending:$8,depthWrite:!1}));D.scale.setScalar(N?0.32:0.7),this.scene.add(G,D),this.flash(Z.x,Z.y),K={mesh:G,glow:D,trailAcc:0,prev:new h(Z.x-A9,0.6,Z.y-A9)},this.tracerViews.set(Z,K)}let[$,X]=rJ(Z.x,Z.y),Y=new h($,0.55,X),W=Y.x-K.prev.x,U=Y.z-K.prev.z,H=Math.atan2(U,W);if(K.mesh.position.copy(Y),K.mesh.rotation.y=-H,K.glow.position.copy(Y),K.prev.copy(Y),Z.splash>0.6||Z.speed<20){if(K.trailAcc+=N7(),K.trailAcc>0.045)K.trailAcc=0,this.puff(Y.x,Y.y,Y.z,0.28,0.5,!0)}}for(let[Z,K]of this.tracerViews)if(!Q.has(Z)){if(this.scene.remove(K.mesh,K.glow),this.tracerViews.delete(Z),Z.splash<=0.6)this.puff(Z.tx-A9,0.4,Z.ty-A9,0.34,0.4)}}syncBooms(J){for(let Q of J.booms){if(this.handledBooms.has(Q))continue;this.handledBooms.add(Q);let[Z,K]=rJ(Q.x,Q.y);this.explosion(Z,0.35,K,Q.r)}if(this.handledBooms.size>500)this.handledBooms.clear()}explosion(J,Q,Z,K){let $=Math.max(0.8,K*0.9);this.addFx(this.texFlash,J,Q+0.4,Z,$*2.4,0.09,1.6,!0),this.addFx(this.texGlow,J,Q+0.55,Z,$*1.4,0.42,$*3.4,!0,0.5);let X=new b0(new D9(0.75,1,26),new gJ({color:16767120,transparent:!0,opacity:0.85,depthWrite:!1,side:SJ,blending:$8}));X.rotation.x=-Math.PI/2,X.position.set(J,0.12,Z),this.scene.add(X),this.markers.push({ring:X,ttl:0.38,max:0.38});for(let Y=0;Y<5;Y++){let W=Math.random()*Math.PI*2;this.addFx(this.texSmoke,J+Math.cos(W)*$*0.5,Q+0.5+Math.random()*0.6,Z+Math.sin(W)*$*0.5,$*(1.1+Math.random()),0.9+Math.random()*0.5,$*2.2,!1,-1.4)}if(K>1.2)this.spitDebris(J,Q,Z,K);this.boomLight.position.set(J,Q+2,Z),this.boomLight.intensity=55*$,this.addScorch(J,Z,K*1.9)}flash(J,Q){let[Z,K]=rJ(J,Q);this.addFx(this.texFlash,Z,0.7,K,0.85,0.07,1,!0)}puff(J,Q,Z,K,$,X=!1){this.addFx(X?this.texGlow:this.texSmoke,J,Q,Z,K,$,K*2.2,X,-0.9)}addFx(J,Q,Z,K,$,X,Y,W,U=0){let H=new c9(new C9({map:J,transparent:!0,depthWrite:!1,blending:W?$8:R8,opacity:1}));H.position.set(Q,Z,K),H.scale.setScalar($),H.renderOrder=25,this.scene.add(H);let N={s:H,ttl:X,max:X,vx:0,vy:U,grow:Y,fade:1,spin:0};return this.fxSprites.push(N),N}addScorch(J,Q,Z){let K=new b0(new $9(Z,Z),new gJ({map:this.texScorch,transparent:!0,depthWrite:!1,opacity:0.85}));if(K.rotation.x=-Math.PI/2,K.rotation.z=Math.random()*6.28,K.position.set(J,0.06+Math.random()*0.02,Q),K.renderOrder=3,this.scene.add(K),this.scorches.push({s:K,ttl:24,max:24,vx:0,vy:0,grow:1,fade:0,spin:0}),this.scorches.length>46){let $=this.scorches.shift();this.scene.remove($.s)}}spitDebris(J,Q,Z,K){for(let $=0;$<7;$++){let X=new b0(new cJ(0.14,0.1,0.14),y0(3814702,{rough:1}));X.position.set(J,Q+0.4,Z),X.castShadow=!1,this.scene.add(X);let Y=Math.random()*Math.PI*2,W=3+Math.random()*5;this.debris.push({m:X,ttl:0.9,vx:Math.cos(Y)*W,vy:4+Math.random()*4,vz:Math.sin(Y)*W,rv:new h(Math.random()*12,Math.random()*12,Math.random()*12)})}}syncFx(J){for(let Q=this.fxSprites.length-1;Q>=0;Q--){let Z=this.fxSprites[Q];if(Z.ttl-=J,Z.ttl<=0){this.scene.remove(Z.s),this.fxSprites.splice(Q,1);continue}let K=1-Z.ttl/Z.max;Z.s.scale.setScalar(Z.s.scale.x+Z.grow*J),Z.s.position.y+=Z.vy*J,Z.s.material.opacity=Math.min(1,Z.ttl/Z.max*2.2)}for(let Q=this.scorches.length-1;Q>=0;Q--){let Z=this.scorches[Q];if(Z.ttl-=J,Z.ttl<=0){this.scene.remove(Z.s),this.scorches.splice(Q,1);continue}if(Z.ttl<5)Z.s.material&&(Z.s.material.opacity=Math.min(0.85,Z.ttl/5*0.85+0.15));else Z.s.material.opacity=0.85}for(let Q=this.markers.length-1;Q>=0;Q--){let Z=this.markers[Q];if(Z.ttl-=J,Z.ttl<=0){this.scene.remove(Z.ring),Z.ring.geometry.dispose(),this.markers.splice(Q,1);continue}let K=1-Z.ttl/Z.max,$=Z.max>1?0.5+K*2.6:0.5+K*1.4;Z.ring.scale.setScalar($),Z.ring.material.opacity=0.9*(1-K)}for(let Q=this.debris.length-1;Q>=0;Q--){let Z=this.debris[Q];if(Z.ttl-=J,Z.ttl<=0){this.scene.remove(Z.m),this.debris.splice(Q,1);continue}if(Z.vy-=22*J,Z.m.position.x+=Z.vx*J,Z.m.position.y+=Z.vy*J,Z.m.position.z+=Z.vz*J,Z.m.position.y<0.05)Z.m.position.y=0.05,Z.vy*=-0.35,Z.vx*=0.7,Z.vz*=0.7;Z.m.rotation.x+=Z.rv.x*J,Z.m.rotation.y+=Z.rv.y*J}for(let Q=this.burners.length-1;Q>=0;Q--){let Z=this.burners[Q];if(Z.ttl-=J,Z.ttl<=0){this.burners.splice(Q,1);continue}if(Z.acc+=J,Z.acc>0.3)Z.acc=0,this.addFx(this.texSmoke,Z.x+(Math.random()-0.5)*0.5,0.5,Z.z+(Math.random()-0.5)*0.5,0.8,1.6,2.2,!1,1.6)}if(this.boomLight.intensity*=Math.pow(0.0001,J),this.boomLight.intensity<0.4)this.boomLight.intensity=0}mark(J,Q,Z){let[K,$]=rJ(J,Q),X=Z==="attack"?16738890:Z==="capture"?16769658:9109354,Y=new b0(new D9(0.75,1,26),new gJ({color:X,transparent:!0,opacity:0.95,depthWrite:!1,side:SJ}));Y.rotation.x=-Math.PI/2,Y.position.set(K,0.14,$),this.scene.add(Y),this.markers.push({ring:Y,ttl:0.55,max:0.55})}syncFloats(J){for(let Q of J.floats){if(!/^(ATTACK|CAPTURING|DEPOT CAPTURED)/.test(Q.text))continue;let Z=Q.text+"|"+Q.color,K=this.textTexCache.get(Z);if(!K){let W=document.createElement("canvas");W.width=256,W.height=64;let U=W.getContext("2d");U.font="bold 30px system-ui, sans-serif",U.textAlign="center",U.textBaseline="middle",U.lineWidth=6,U.strokeStyle="rgba(0,0,0,0.85)",U.strokeText(Q.text,128,32),U.fillStyle=Q.color,U.fillText(Q.text,128,32),K=new uJ(W),this.textTexCache.set(Z,K)}let[$,X]=rJ(Q.x,Q.y),Y=new c9(new C9({map:K,transparent:!0,depthWrite:!1}));Y.position.set($,2.2,X),Y.scale.set(3.4,0.85,1),Y.renderOrder=45,this.scene.add(Y),this.fxSprites.push({s:Y,ttl:1.1,max:1.1,vx:0,vy:1.1,grow:0,fade:1,spin:0})}}updateFog(J,Q){if(this.fogAcc+=Q,this.fogAcc<0.2)return;this.fogAcc=0;let Z=J.visible[0],K=J.explored,$=this.fogData.data;for(let X=0;X<W0*k0;X++){let Y=X*4;if(Z[X])$[Y]=10,$[Y+1]=9,$[Y+2]=7,$[Y+3]=0;else if(K[X])$[Y]=12,$[Y+1]=10,$[Y+2]=8,$[Y+3]=120;else $[Y]=10,$[Y+1]=9,$[Y+2]=7,$[Y+3]=232}this.fogCanvas.getContext("2d").putImageData(this.fogData,0,0),this.fogTex.needsUpdate=!0}resize(J,Q,Z){this.canvasW=J,this.canvasH=Q,this.renderer.setPixelRatio(Z),this.renderer.setSize(J,Q,!1),this.camera.aspect=J/Q,this.camera.updateProjectionMatrix()}screenToTile(J,Q){let Z=new v0(J/this.canvasW*2-1,-(Q/this.canvasH)*2+1);this.raycaster.setFromCamera(Z,this.camera);let K=new h;if(!this.raycaster.ray.intersectPlane(this.groundPlane,K))return null;let[$,X]=u5(K.x,K.z);return{x:$,y:X}}tileToScreen(J,Q){let[Z,K]=rJ(J,Q),$=new h(Z,0.5,K).project(this.camera);return{sx:($.x*0.5+0.5)*this.canvasW,sy:(-$.y*0.5+0.5)*this.canvasH}}drawMinimap(J,Q,Z,K,$,X,Y,W){if(!this.miniBg&&this.groundCanvas)this.miniBg=tX(this.groundCanvas,$,X);if(J.clearRect(0,0,$,X),this.miniBg)J.drawImage(this.miniBg,0,0);let U=$/W0,H=X/k0,N=Q.visible[0],F=Q.explored;J.fillStyle="rgba(20,26,18,0.5)";for(let R=0;R<k0;R+=2)for(let B=0;B<W0;B+=2){let q=R*W0+B;if(!N[q]){if(!F[q])J.fillRect(B*U,R*H,2*U,2*H)}}J.globalAlpha=0.35,J.fillStyle="rgba(20,26,18,0.8)";for(let R=0;R<k0;R+=2)for(let B=0;B<W0;B+=2){let q=R*W0+B;if(!N[q]&&F[q])J.fillRect(B*U,R*H,2*U,2*H)}J.globalAlpha=1;for(let R of Q.buildings){if(R.defId==="depot"&&R.owner!==1&&!F[Math.round(R.y)*W0+Math.round(R.x)])continue;let B=R.owner===1?"#ff8a70":R.owner===2?"#7ab4ff":"#e8e4d0";J.fillStyle=B;let q=R.defId==="hq"?6:4;J.fillRect(R.x*U-q/2,R.y*H-q/2,q,q)}for(let R of Q.units){if(R.owner!==1&&!N[Math.round(R.y)*W0+Math.round(R.x)])continue;J.fillStyle=R.owner===1?K.has(R.id)?"#ffffff":"#ffb060":"#6aa8ff",J.fillRect(R.x*U-1.5,R.y*H-1.5,3,3)}let G=[[0,0],[Y,0],[Y,W],[0,W]];J.strokeStyle="rgba(255,255,255,0.85)",J.lineWidth=1,J.beginPath();let D=!1;for(let[R,B]of G){let q=this.screenToTile(R,B);if(!q)continue;let E=Math.max(0,Math.min($,q.x*U)),z=Math.max(0,Math.min(X,q.y*H));if(!D)J.moveTo(E,z),D=!0;else J.lineTo(E,z)}J.closePath(),J.stroke()}dispose(){if(this.disposed)return;this.disposed=!0,this.renderer.dispose()}}var ZY=0.016666666666666666;function N7(){return ZY}function c5(J){ZY=J}var n5=document.getElementById("app");n5.innerHTML=`
<div id="wrap">
  <canvas id="cv"></canvas>
  <div id="selbox"></div>

  <div id="menu" class="overlay">
    <div class="menu-inner">
      <div class="title-row">
        <img src="assets/emblem-red.png" class="emb" />
        <h1>ART OF WAR 3 · BROWSER TRIBUTE</h1>
        <img src="assets/emblem-blue.png" class="emb" />
      </div>
      <p class="sub">Real-time 3D skirmish rebuilt from the real APK: damage &amp; armor math
      reverse-engineered from <code>libil2cpp.so</code>, battlefield dressed with the game's own
      extracted terrain decals, HQ art and unit cards. Fan project — not affiliated with Gear Games.</p>
      <div class="hintgrid">
        <div>\uD83D\uDDB1 Drag = select · Right-click / long-press = order</div>
        <div>\uD83C\uDFAF Capture depots with infantry for income &amp; CP</div>
        <div>\uD83C\uDFF0 Destroy the enemy HQ · WASD / wheel / pinch</div>
      </div>
      <button id="start">▶ START SKIRMISH</button>
      <div id="baking">… BAKING BATTLEFIELD</div>
    </div>
  </div>

  <div id="over" class="overlay hidden">
    <h1 id="verdict">VICTORY</h1>
    <p id="verdict-sub"></p>
    <button id="rematch">⟳ REMATCH</button>
  </div>

  <div id="resbar" class="panel hidden">
    <img src="assets/emblem-red.png" class="emb-sm" />
    <img src="assets/ico-credits.png" class="ico" />
    <b id="funds" class="gold">0</b>
    <span id="income" class="green"></span>
    <span id="cp" class="cp"></span>
    <button id="home">⌂ HQ</button>
  </div>
  <div id="clock" class="panel hidden">⏱ 0:00</div>

  <div id="minimap-wrap" class="panel hidden"><canvas id="mini" width="172" height="172"></canvas></div>

  <div id="prodwrap" class="hidden">
    <div id="cards" class="panel"></div>
    <div id="prodhint">drag = select · right-click / long-press = move · attack · capture · wheel / pinch = zoom · WASD = pan</div>
  </div>
</div>
`;var FJ=(J)=>document.getElementById(J),i9=FJ("cv"),d7=FJ("mini"),KY=FJ("wrap"),XY=document.createElement("style");XY.textContent=`
html,body{margin:0;height:100%;background:#0c100c;font-family:system-ui,Segoe UI,Roboto,sans-serif;overflow:hidden}
#wrap{position:relative;width:100vw;height:100vh;overflow:hidden;background:#000;user-select:none;-webkit-user-select:none}
#cv{position:absolute;inset:0;touch-action:none;cursor:crosshair}
#selbox{position:absolute;display:none;border:1px dashed rgba(140,240,140,.9);background:rgba(140,240,140,.1);z-index:5;pointer-events:none}
.overlay{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#15120c,#0a0906);text-align:center;color:#fff}
.overlay.hidden{display:none}
.menu-inner{max-width:720px;padding:24px}
.title-row{display:flex;align-items:center;justify-content:center;gap:16px}
.title-row h1{font-size:26px;letter-spacing:1px;color:#f0d896;text-shadow:0 2px 12px #000}
.emb{height:56px}.emb-sm{height:30px}
.sub{color:rgba(255,255,255,.7);font-size:13px;line-height:1.6}
code{background:rgba(255,255,255,.1);padding:0 4px;border-radius:3px}
.hintgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;font-size:11px;color:rgba(255,255,255,.6);margin:18px 0}
.hintgrid div{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);border-radius:8px;padding:10px}
button{cursor:pointer;border:0;border-radius:8px}
#start,#rematch{background:linear-gradient(180deg,#d86a4a,#a83a26);color:#fff;font-size:18px;font-weight:800;padding:12px 40px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
#start:disabled{opacity:.5}
#baking{color:rgba(255,255,255,.5);font-size:12px;margin-top:10px}
.panel{position:absolute;z-index:10;display:flex;align-items:center;gap:10px;padding:8px 12px;color:#fff;
 background:linear-gradient(180deg,rgba(38,42,46,.92),rgba(16,18,20,.94));border:1px solid #565e66;
 box-shadow:0 2px 10px rgba(0,0,0,.55);border-radius:6px}
#resbar{left:8px;top:8px;font-size:14px}
#clock{right:8px;top:8px;font-weight:700}
#minimap-wrap{left:8px;bottom:8px;padding:6px}
#mini{display:block;border-radius:3px;cursor:pointer}
#prodwrap{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:10;text-align:center}
#cards{position:static;display:flex;gap:6px;overflow-x:auto;max-width:94vw}
#prodhint{color:rgba(255,255,255,.4);font-size:10px;margin-top:4px}
.card{position:relative;width:92px;flex:0 0 auto;border:1px solid rgba(255,255,255,.25);border-radius:6px;overflow:hidden;background:#111;padding:0}
.card img{width:100%;height:64px;object-fit:cover;display:block}
.card .nm{font-size:10px;font-weight:800;background:rgba(0,0,0,.7);padding:2px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card .pr{font-size:10px;font-weight:700;background:rgba(0,0,0,.8);padding:2px;color:#fcd34d}
.card .pr .cp{color:#7dd3fc;margin-left:6px}
.card:disabled{opacity:.4}
.card .qn{position:absolute;right:4px;top:4px;background:rgba(16,185,129,.95);color:#000;font-size:10px;font-weight:800;border-radius:3px;padding:0 4px}
.gold{color:#fcd34d}.green{color:#6ee7b7;font-size:11px;font-weight:400}.cp{color:#7dd3fc;font-size:12px;font-weight:700}
#home{background:rgba(255,255,255,.1);color:#fff;font-size:11px;padding:4px 8px;border:1px solid rgba(255,255,255,.2)}
#over{background:rgba(0,0,0,.75)}
#verdict{font-size:52px;font-weight:900}
.hidden{display:none!important}
`;document.head.appendChild(XY);var s0=null,VK=null,kJ=null,YY=!1,EJ={x:W0/2,y:k0/2,dist:26},nJ=new Set,w9=new Set;{let J=new s7(1),Q=new DK(i9,"assets/");kJ=Q,Q.load().then(()=>{YY=!0,FJ("baking").style.display="none",FJ("start").disabled=!1}).catch(console.error)}function WY(){if(!YY)return;s0=new s7(Math.floor(Math.random()*1e9)),VK=new YQ(s0,2),nJ.clear(),kJ.applyTerrainGrid(s0.grid);let J=s0.hq(1);EJ.x=J?J.x+6:12,EJ.y=J?J.y:k0/2,EJ.dist=26,FJ("menu").classList.add("hidden"),FJ("over").classList.add("hidden"),["resbar","clock","minimap-wrap","prodwrap"].forEach((Q)=>FJ(Q).classList.remove("hidden")),s5(),JQ=performance.now()}FJ("start").onclick=WY;FJ("rematch").onclick=WY;FJ("start").disabled=!0;FJ("home").onclick=()=>{let J=s0?.hq(1);if(J)EJ.x=J.x+5,EJ.y=J.y};function s5(){let J=s0.players[0],Q=FJ("cards");Q.innerHTML="";for(let Z of KQ){let K=j9[Z],$=document.createElement("button");$.className="card",$.title=`${K.name} — ${K.desc}`,$.innerHTML=`<img src="${K.card.replace("/aow3/","assets/")}?v=2" alt="${K.name}"/><div class="nm">${K.name.split('"')[0]}</div>
      <div class="pr">${K.price}¤<span class="cp">CP${K.cp}</span></div>`,$.onclick=()=>s0?.enqueue(Z,1),Q.appendChild($)}}var P9=new Map,u7=0,T9=null,OK={t:0,id:-2},c0={active:!1,sx:0,sy:0,cx:0,cy:0,box:!1},tJ={active:!1,wx:0,wy:0,camX:0,camY:0},MK=(J)=>{let Q=i9.getBoundingClientRect();return{x:J.clientX-Q.left,y:J.clientY-Q.top}};function $Y(J,Q){if(!s0||!nJ.size||!kJ)return;let Z=kJ.screenToTile(J,Q);if(!Z)return;let K,$=1.6;for(let W of s0.units){if(W.owner===1)continue;if(!s0.visible[0][Math.round(W.y)*W0+Math.round(W.x)])continue;let U=Math.hypot(W.x-Z.x,W.y-Z.y);if(U<$+W.def.radius)$=U,K=W}let X=[...nJ];if(K){s0.commandAttack(X,K.id),kJ.mark(K.x,K.y,"attack");return}let Y=s0.buildings.find((W)=>W.defId==="depot"&&W.owner!==1&&Math.hypot(W.x-Z.x,W.y-Z.y)<y8.radius+1);if(Y&&X.some((W)=>s0.units.find((U)=>U.id===W&&U.def.captures))){s0.commandCapture(X.filter((W)=>s0.units.find((U)=>U.id===W&&U.def.captures)),Y.id),kJ.mark(Y.x,Y.y,"capture");return}s0.commandMove(X,Math.max(1,Math.min(W0-2,Z.x)),Math.max(1,Math.min(k0-2,Z.y)),!1),kJ.mark(Z.x,Z.y,"move")}i9.addEventListener("pointerdown",(J)=>{i9.setPointerCapture(J.pointerId);let Q=MK(J);if(P9.set(J.pointerId,Q),P9.size===2){let[Z,K]=[...P9.values()];if(u7=Math.hypot(Z.x-K.x,Z.y-K.y),c0.active=!1,tJ.active=!1,T9)clearTimeout(T9),T9=null;return}if(J.button===2){$Y(Q.x,Q.y);return}if(J.button===1||J.shiftKey){let Z=kJ.screenToTile(Q.x,Q.y);if(Z)tJ.active=!0,tJ.wx=Z.x,tJ.wy=Z.y,tJ.camX=EJ.x,tJ.camY=EJ.y;return}if(c0.active=!0,c0.sx=Q.x,c0.sy=Q.y,c0.cx=Q.x,c0.cy=Q.y,c0.box=!1,J.pointerType==="touch")T9=setTimeout(()=>{if(c0.active&&!c0.box)c0.active=!1,$Y(Q.x,Q.y)},420)});i9.addEventListener("pointermove",(J)=>{let Q=MK(J);if(P9.has(J.pointerId))P9.set(J.pointerId,Q);if(P9.size===2){let[Z,K]=[...P9.values()],$=Math.hypot(Z.x-K.x,Z.y-K.y);if(u7>0)EJ.dist=Math.min(70,Math.max(12,EJ.dist*(u7/$)));u7=$;return}if(tJ.active){let Z=kJ.screenToTile(Q.x,Q.y);if(Z)EJ.x=Math.max(3,Math.min(W0-3,tJ.camX-(Z.x-tJ.wx))),EJ.y=Math.max(3,Math.min(k0-3,tJ.camY-(Z.y-tJ.wy)));return}if(!c0.active)return;if(c0.cx=Q.x,c0.cy=Q.y,Math.hypot(Q.x-c0.sx,Q.y-c0.sy)>12){if(c0.box=!0,T9)clearTimeout(T9),T9=null;let Z=FJ("selbox");Z.style.display="block",Z.style.left=Math.min(c0.sx,c0.cx)+"px",Z.style.top=Math.min(c0.sy,c0.cy)+"px",Z.style.width=Math.abs(c0.cx-c0.sx)+"px",Z.style.height=Math.abs(c0.cy-c0.sy)+"px"}});i9.addEventListener("pointerup",(J)=>{let Q=MK(J);if(P9.delete(J.pointerId),P9.size<2)u7=0;if(T9)clearTimeout(T9),T9=null;if(tJ.active){tJ.active=!1;return}if(!c0.active)return;if(c0.active=!1,FJ("selbox").style.display="none",!s0||!kJ)return;if(c0.box){let Z=Math.min(c0.sx,c0.cx),K=Math.max(c0.sx,c0.cx),$=Math.min(c0.sy,c0.cy),X=Math.max(c0.sy,c0.cy);nJ.clear();for(let Y of s0.units){if(Y.owner!==1)continue;let W=kJ.tileToScreen(Y.x,Y.y);if(W.sx>=Z-4&&W.sx<=K+4&&W.sy>=$-8&&W.sy<=X+4)nJ.add(Y.id)}}else{let Z,K=30;for(let X of s0.units){if(X.owner!==1)continue;let Y=kJ.tileToScreen(X.x,X.y),W=Math.hypot(Y.sx-Q.x,Y.sy-Q.y-10);if(W<K)K=W,Z=X}let $=performance.now();if(Z){if($-OK.t<350&&OK.id===Z.id){nJ.clear();for(let X of s0.units)if(X.owner===1&&X.def.id===Z.def.id)nJ.add(X.id)}else{if(!J.ctrlKey)nJ.clear();nJ.add(Z.id)}OK={t:$,id:Z.id}}else{let X,Y=34;for(let W of s0.units){if(W.owner===1)continue;if(!s0.visible[0][Math.round(W.y)*W0+Math.round(W.x)])continue;let U=kJ.tileToScreen(W.x,W.y),H=Math.hypot(U.sx-Q.x,U.sy-Q.y-10);if(H<Y)Y=H,X=W}if(X&&nJ.size)s0.commandAttack([...nJ],X.id),kJ.mark(X.x,X.y,"attack");else if(!J.ctrlKey)nJ.clear()}}});i9.addEventListener("pointercancel",(J)=>{P9.delete(J.pointerId),c0.active=!1,tJ.active=!1});i9.addEventListener("contextmenu",(J)=>J.preventDefault());i9.addEventListener("wheel",(J)=>{J.preventDefault(),EJ.dist=Math.min(70,Math.max(12,EJ.dist*(J.deltaY>0?1.1:0.9)))},{passive:!1});window.addEventListener("keydown",(J)=>{if(w9.add(J.key.toLowerCase()),J.key==="Escape")nJ.clear()});window.addEventListener("keyup",(J)=>w9.delete(J.key.toLowerCase()));d7.addEventListener("pointerdown",(J)=>{let Q=d7.getBoundingClientRect();EJ.x=(J.clientX-Q.left)/Q.width*W0,EJ.y=(J.clientY-Q.top)/Q.height*k0});function i5(){if(!s0)return;let J=s0.players[0];FJ("funds").textContent=Math.floor(J.funds).toLocaleString(),FJ("income").textContent=`+${J.income}/s`,FJ("cp").textContent=`CP ${J.cpUsed}/${J.cpCap}`,FJ("clock").textContent=`⏱ ${Math.floor(s0.time/60)}:${String(Math.floor(s0.time%60)).padStart(2,"0")}`;let Q=FJ("cards").children;KQ.forEach((Z,K)=>{let $=j9[Z],X=Q[K];if(!X)return;let Y=J.funds>=$.price&&J.cpUsed+$.cp<=J.cpCap;X.disabled=!Y;let W=J.queue.filter((H)=>H.defId===Z).length,U=X.querySelector(".qn");if(W>0){if(!U)U=document.createElement("span"),U.className="qn",X.appendChild(U);U.textContent="×"+W}else if(U)U.remove()})}var JQ=performance.now(),RK=0,LK=0;function UY(J){if(requestAnimationFrame(UY),!s0||!VK||!kJ||!FJ("resbar")||FJ("resbar").classList.contains("hidden")){JQ=J;return}let Q=(J-JQ)/1000;if(JQ=J,Q>0.25)Q=0.25;RK+=Q;let Z=1/jK,K=0;while(RK>=Z&&K<8)s0.step(Z),VK.step(Z),RK-=Z,K++;let $=EJ.dist*0.85*Q;if(w9.has("w")||w9.has("arrowup"))EJ.y-=$;if(w9.has("s")||w9.has("arrowdown"))EJ.y+=$;if(w9.has("a")||w9.has("arrowleft"))EJ.x-=$;if(w9.has("d")||w9.has("arrowright"))EJ.x+=$;EJ.x=Math.max(3,Math.min(W0-3,EJ.x)),EJ.y=Math.max(3,Math.min(k0-3,EJ.y));let X=Math.min(2,window.devicePixelRatio||1),Y=KY.clientWidth,W=KY.clientHeight;if(kJ.canvasW!==Y||kJ.canvasH!==W)kJ.resize(Y,W,X);if(kJ.render(Q,s0,EJ,nJ),kJ.syncFloats(s0),LK+=Q,LK>0.16){LK=0;let U=d7.getContext("2d");kJ.drawMinimap(U,s0,EJ,nJ,d7.width,d7.height,Y,W),i5()}if(s0.winner!==null){let U=s0.winner===1;FJ("verdict").style.color=U?"#34d399":"#f87171",FJ("verdict").textContent=U?"VICTORY":"DEFEAT",FJ("verdict-sub").textContent=U?"Enemy HQ destroyed. The region is yours.":"Your HQ has fallen. Regroup and try again.",FJ("over").classList.remove("hidden"),s0=null}}requestAnimationFrame(UY);})();
