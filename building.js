import * as THREE from 'three';

export const dimensions={gridWidth:32,gridDepth:24,outerWidth:32.65,outerDepth:24.65,
  levels:[.3,4.4,8.5,12.6,16.7,21.05],mainParapet:17.4,topParapet:21.75};

export function createBuilding(materials){
  const root=new THREE.Group();root.name='Exterior / metres';
  const groups={};for(const k of ['walls','glass','roof','details','site']){groups[k]=new THREE.Group();groups[k].name=k;root.add(groups[k]);}
  const cube=new THREE.BoxGeometry(1,1,1),batches=new Map();
  const dummy=new THREE.Object3D();
  function box(layer,mat,x,y,z,w,h,d){
    if(Math.min(w,h,d)<=0)throw new Error('Invalid model dimension');
    const key=layer+':'+mat; if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push({x,y,z,w,h,d});
  }
  function faceBox(face,u,y,n,w,h,d,mat,layer='details'){
    // n is distance outward from wall centre; u is global x (N/S), global z (E/W).
    if(face==='south')box(layer,mat,u,y,12.175+n,w,h,d);
    if(face==='north')box(layer,mat,u,y,-12.175-n,w,h,d);
    if(face==='east')box(layer,mat,16.175+n,y,u,d,h,w);
    if(face==='west')box(layer,mat,-16.175-n,y,u,d,h,w);
    if(face==='pentWest')box(layer,mat,9-n,y,u,d,h,w);
    if(face==='pentSouth')box(layer,mat,u,y,10.68+n,w,h,d);
  }
  const openings={south:[],north:[],east:[],west:[],pentWest:[],pentSouth:[]};
  const add=(face,u,bottom,w,h,type='window',panes=1)=>openings[face].push({u,bottom,w,h,type,panes});
  for(let f=0;f<4;f++){
    const fl=dimensions.levels[f];
    [-12.5,-6,0,6].forEach((u,i)=>add('south',u,fl+1.1,i===0?5.345:4.74,1.585,'window',i===0?6:5));
    add('south',11.65,fl+2.685, f===0?2.1:4.2,f===0?.45:.35,'louver');
    [-6,6].forEach(u=>add('north',u,fl+1.1,4.74,u===-6?1.585:1.785,'window',5));
    if(f>0){add('north',-2.05,fl+1.1,.5,1.385);add('north',-2.05,fl+2.5,1.6,.2,'louver');add('north',1.6,fl+2.5,1.6,.2,'louver');add('north',3.3,fl+1.1,.5,1.785);}
    else{add('north',-2.05,.3,.95,2,'door');add('north',3.15,.3,.495,3.05,'window');}
    add('north',13.25,fl+2.55,1.1,.35,'louver');
    // East elevation A-B is mainly blank; B-C carries service doors and grilles.
    if(f<2)add('east',7.25,fl+2.55,2.1,.45,'louver');
    add('east',1.9,fl+2.55,2.5,.35,'louver');
    if(f>0)add('east',-2.7,fl+1.1,1.1,1.585);
    else{add('east',1.9,.3,2.5,2.585,'door',2);add('east',-2.7,.3,1.11,2.57,'door');add('east',-.9,.3,.5,2.685);add('east',-9.8,1.7,1.1,.35,'louver');}
    // West elevation: AW-03 6.55m, AW-04 4.74m and narrow service windows.
    add('west',8,fl+1.1,6.55,1.585,'window',7);
    add('west',1.15,fl+1.1,4.74,1.785,'window',5);
    if(f>0)add('west',-2.65,fl+1.1,1.1,1.585);
    else add('west',-2.65,.3,1.11,2.57,'door');
    if(f===0)add('west',-9.7,1.7,1.1,.35,'louver');
  }
  // Main entrance interrupts the northern ground-floor glazing.
  add('north',-12.5,.3,4.005,3.05,'entrance',4);
  add('pentWest',-9.6,16.7,1.6,2.3,'door',2);
  add('pentWest',-9.6,19.3,1.1,.35,'louver');
  add('pentWest',-3.6,16.7,.95,2.685,'door');
  add('east',-2.7,18.15,1.1,.35,'louver');
  add('north',13.25,17.8,1.1,1.685);
  add('pentSouth',13.6,16.7,2.5,2.585,'door',2);
  
  function wall(face,a,b,y0,y1,holes){
    // Rectangle subtraction produces actual holes without CSG or hidden interior meshes.
    let pieces=[{a,b,c:y0,d:y1}];
    for(const o of holes){const l=o.u-o.w/2,r=o.u+o.w/2,lo=o.bottom,hi=lo+o.h;
      const next=[];
      for(const p of pieces){const A=Math.max(p.a,l),B=Math.min(p.b,r),C=Math.max(p.c,lo),D=Math.min(p.d,hi);
        if(A>=B||C>=D){next.push(p);continue;}
        if(p.a<A)next.push({a:p.a,b:A,c:p.c,d:p.d});
        if(B<p.b)next.push({a:B,b:p.b,c:p.c,d:p.d});
        if(p.c<C)next.push({a:A,b:B,c:p.c,d:C});
        if(D<p.d)next.push({a:A,b:B,c:D,d:p.d});
      }pieces=next;
    }
    for(const p of pieces)faceBox(face,(p.a+p.b)/2,(p.c+p.d)/2,0,p.b-p.a,p.d-p.c,.3,'tile','walls');
  }
  wall('south',-16.325,16.325,.3,17.4,openings.south);
  wall('north',-16.325,9,.3,17.4,openings.north);
  wall('north',9,16.325,.3,21.75,openings.north);
  wall('west',-12.325,12.325,.3,17.4,openings.west);
  wall('east',-12.325,10.68,.3,21.75,openings.east);
  wall('east',10.68,12.325,.3,17.4,openings.east);
  wall('pentWest',-12.325,10.68,16.7,21.75,openings.pentWest);
  wall('pentSouth',8.85,16.325,16.7,21.75,openings.pentSouth);

  for(const [face,list] of Object.entries(openings))for(const o of list){
    const cy=o.bottom+o.h/2;
    // Shadow backing and reveals are exterior substitutes, with no room geometry.
    faceBox(face,o.u,cy,-.18,o.w,o.h,.035,'recess');
    const frame=.055;
    for(const u of [o.u-o.w/2+frame/2,o.u+o.w/2-frame/2])faceBox(face,u,cy,.09,frame,o.h,.1,'metal');
    for(const y of [o.bottom+frame/2,o.bottom+o.h-frame/2])faceBox(face,o.u,y,.09,o.w,frame,.1,'metal');
    if(o.type==='louver'){
      for(let yy=o.bottom+.045;yy<o.bottom+o.h-.015;yy+=.055)faceBox(face,o.u,yy,.105,o.w-.1,.018,.055,'darkMetal');
    }else{
      if(o.type==='door'){
        faceBox(face,o.u,cy,.055,o.w-.11,o.h-.11,.035,'metal');
        for(let p=1;p<o.panes;p++)faceBox(face,o.u-o.w/2+o.w*p/o.panes,cy,.085,.02,o.h-.11,.016,'darkMetal');
        faceBox(face,o.u+.15,o.bottom+1.05,.14,.025,.28,.035,'darkMetal');
      }else{
        // Each pane is a separate transparent object so Three.js can sort glazing.
        const geo=new THREE.PlaneGeometry(o.w-.11,o.h-.11),glass=new THREE.Mesh(geo,materials.glass);
        if(face==='north'){glass.position.set(o.u,cy,-12.19);glass.rotation.y=Math.PI;}
        if(face==='south')glass.position.set(o.u,cy,12.19);
        if(face==='east'){glass.position.set(16.19,cy,o.u);glass.rotation.y=Math.PI/2;}
        if(face==='west'){glass.position.set(-16.19,cy,o.u);glass.rotation.y=-Math.PI/2;}
        if(face==='pentWest'){glass.position.set(8.99,cy,o.u);glass.rotation.y=-Math.PI/2;}
        if(face==='pentSouth')glass.position.set(o.u,cy,10.69);
        groups.glass.add(glass);
        for(let p=1;p<o.panes;p++)faceBox(face,o.u-o.w/2+o.w*p/o.panes,cy,.1,.04,o.h-.1,.075,'metal');
        if(o.type==='entrance'){
          faceBox(face,o.u,o.bottom+2.35,.1,o.w,.06,.075,'metal');
          faceBox(face,o.u,o.bottom+2,.1,o.w,.04,.075,'metal');
          for(let u of [o.u-.3,o.u+.3])faceBox(face,u,o.bottom+1.05,.16,.02,.4,.025,'darkMetal');
        }
      }
      faceBox(face,o.u,o.bottom-.025,.17,o.w+.12,.035,.24,'metal');
      if(o.type==='window'&&o.w>3)faceBox(face,o.u,o.bottom+o.h+.035,.37,o.w+.18,.055,.7,'metal');
    }
  }

  // Construction joints and facade control joints shown in elevations.
  for(const face of ['north','south','east','west']){
    const len=['north','south'].includes(face)?32.65:24.65;
    for(const y of [4.4,8.5,12.6,16.7])faceBox(face,0,y,.153,len,.012,.006,'darkMetal','walls');
    const joints=len>30?[-15.5,-9.4,-8.6,-3.4,-2.6,2.6,3.4,8.6,9.4,15.5]:[-11.55,-4.4,-3.6,3.6,4.4,11.55];
    for(const u of joints)faceBox(face,u,8.5,.153,.013,16.4,.006,'darkMetal','walls');
  }
  // Plinth, entrance canopy, service canopies and accessible approach.
  box('walls','concrete',0,.15,0,32.65,.3,24.65);
  box('details','metal',-12.5,3.7,-13.15,6.6,.18,2.1);
  box('details','white',-12.5,3.6,-13.15,6.35,.035,1.9);
  box('details','metal',-15.7,1.95,-14.05,.08,3.3,.08);
  box('details','metal',-9.3,1.95,-14.05,.08,3.3,.08);
  for(const face of ['east','west'])faceBox(face,-2.65,3.05,.53,1.65,.08,1.15,'metal');
  box('site','paving',-12.5,.15,-14.2,7,.3,3.9);
  for(let i=0;i<3;i++)box('site','concrete',-12.5,.05*(3-i),-16.2-i*.33,5.5,.1*(3-i),.33);
  // Accessible ramp along front (drawing gives 1% site falls, detailed ramp gradient inferred).
  const rampGeo=new THREE.BufferGeometry();
  rampGeo.setAttribute('position',new THREE.Float32BufferAttribute([-9,.3,-15.3,-3.6,.02,-15.3,-3.6,.02,-13.7,-9,.3,-13.7],3));
  rampGeo.setIndex([0,2,1,0,3,2]);rampGeo.computeVertexNormals();groups.site.add(new THREE.Mesh(rampGeo,materials.paving));
  for(let x=-8.9;x<=-3.6;x+=1.05)for(const z of [-15.3,-13.7])box('site','metal',x,.62-(x+8.9)*.052,z,.035,.95,.035);
  for(const z of [-15.3,-13.7]){
    const rail=new THREE.Mesh(cube,materials.metal);rail.position.set(-6.3,1.08,z);rail.scale.set(5.5,.045,.045);rail.rotation.z=-.052;groups.site.add(rail);
  }
  // Roof terrace at 5FL, raised eastern volume and aluminium coping.
  box('roof','roof',-3.65,16.63,0,25.35,.14,24.05);
  box('roof','roof',12.575,20.98,-.8,7.05,.14,22.65);
  for(const [x,z,w,d,y] of [[0,12.175,32.65,.35,17.4],[-3.65,-12.175,25.35,.35,17.4],[-16.175,0,.35,24.65,17.4],[16.175,11.5,.35,1.65,17.4],[9,11.5,.35,1.65,17.4],[12.575,10.68,7.65,.35,21.75],[12.575,-12.175,7.65,.35,21.75],[9,-.75,.35,22.85,21.75],[16.175,-.75,.35,22.85,21.75]])box('roof','metal',x,y+.025,z,w,.05,d);
  // Terrace safety railing H >= 1100 from roof surface (solid parapet 700mm).
  for(const z of [-11.6,11.6]){
    box('roof','darkMetal',-3.65,17.82,z,24.65,.045,.045);
    for(let x=-15.95;x<8.75;x+=.17)box('roof','darkMetal',x,17.25,z,.018,1.1,.018);
  }
  box('roof','darkMetal',-15.65,17.82,0,.045,.045,23.2);
  for(let z=-11.6;z<=11.6;z+=.17)box('roof','darkMetal',-15.65,17.25,z,.018,1.1,.018);
  for(let x=-15.5;x<9;x+=1.5)for(const z of [-11.6,11.6])box('roof','metal',x,17.25,z,.04,1.1,.04);
  for(let z=-11.5;z<12;z+=1.5)box('roof','metal',-15.65,17.25,z,.04,1.1,.04);
  // Foundations only: equipment dimensions are absent from this drawing set.
  [[-1,1,3.7,2.5,.3],[6.2,-4.8,3,3,.3],[-5,-4,1.6,.4,.3],[2,-3,4,.5,.5],
    [-12,8,3.6,.5,.5],[-5,8,3.6,.5,.5],[2,8,3.6,.5,.5],[-12,4,1.2,.5,.5],[-12,1.5,1.2,.5,.5],[-12,-1,1.2,.5,.5],[-12,-3.5,1.2,.5,.5]].forEach(([x,z,w,d,h])=>box('roof','concrete',x,16.7+h/2,z,w,h,d));
  box('roof','concrete',-2,-8.5,1.3,.95,1.3);box('roof','metal',-2,17.23,-8.5,1.5,.12,1.5);
  // Rooftop drainage joints are geometry lines, no high-resolution texture.
  for(let x=-14;x<9;x+=3)box('roof','darkMetal',x,16.708,0,.012,.008,23.8);
  for(let z=-10;z<12;z+=3)box('roof','darkMetal',-3.65,16.708,z,25.1,.008,.012);
  // Rainwater downpipes and ladder, shared low-sided geometry.
  const pipeGeo=new THREE.CylinderGeometry(.0375,.0375,1,8);
  const pipePositions=[[-16.45,-11.7],[-16.45,11.7],[16.45,-11.7],[16.45,11.7],[-3,-12.42],[3,12.42]];
  const pipes=new THREE.InstancedMesh(pipeGeo,materials.metal,pipePositions.length);
  pipePositions.forEach(([x,z],i)=>{dummy.position.set(x,8.5,z);dummy.scale.set(1,16.4,1);dummy.updateMatrix();pipes.setMatrixAt(i,dummy.matrix);});groups.details.add(pipes);
  for(const z of [10.98,-3.7]){
    for(const x of [9.28,9.88])box('roof','metal',x,20.6,z,.04,5.2,.04);
    for(let y=18.1;y<=23.1;y+=.3)box('roof','metal',9.58,y,z,.65,.035,.035);
  }
  // North elevation sign: anonymous sample building; match nine 500mm letters.
  const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=128;
  const ctx=signCanvas.getContext('2d');ctx.clearRect(0,0,1024,128);ctx.fillStyle='#45534f';ctx.font='600 100px "Yu Gothic", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('○ ○ 合 同 庁 舎',512,68);
  const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.3,.64),new THREE.MeshBasicMaterial({map:signTex,transparent:true,depthWrite:false}));sign.position.set(-12.7,16.95,-12.336);sign.rotation.y=Math.PI;groups.details.add(sign);

  // Site diagram: 48 x 49m; roads to north, parking, paths, planting bands.
  box('site','concrete',-1,-.14,-10,48,.25,49);
  box('site','asphalt',-1,.002,-23.5,42,.025,20);
  box('site','paving',-19,.025,-3,4,.045,43);
  box('site','paving',0,.025,13.4,34,.045,2);
  box('site','paving',17.7,.025,0,2.1,.045,27);
  box('site','paving',-9,.028,-16.7,26,.045,3);
  box('site','lawn',-1,.035,-32,37,.07,2);
  box('site','lawn',-21.8,.035,11.5,4.1,.07,5.2);
  box('site','lawn',21.5,.035,-18,2.2,.07,28);
  for(let i=0;i<11;i++)box('site','white',-17+i*2.8,.027,-28,.065,.009,5.5);
  for(let i=0;i<4;i++)box('site','white',2+i*3.1,.027,-17,.065,.009,5.3);
  for(let x=-6.5;x> -20;x-=.3)box('site','tactile',x,.06,-16.5,.26,.015,.29);
  for(let z=-16.5;z> -33;z-=.3)box('site','tactile',-20,.06,z,.29,.015,.26);
  // Visual planting is schematic because external landscape details are not provided.
  const treePositions=[[-16,-32],[-10,-32],[-4,-32],[2,-32],[8,-32],[14,-32],[-21,10],[-21,14]];
  const crown=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),materials.leaves,treePositions.length);
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.09,.13,1,7),materials.trunk,treePositions.length);
  treePositions.forEach(([x,z],i)=>{dummy.position.set(x,2.35,z);dummy.scale.set(1.2,1.65,1.2);dummy.rotation.set(0,i*.7,0);dummy.updateMatrix();crown.setMatrixAt(i,dummy.matrix);dummy.position.y=1.05;dummy.scale.set(1,2.1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);});crown.castShadow=true;groups.site.add(crown,trunks);
  // Bicycle shelter: approximate outline indicated in site plan.
  box('site','metal',-20.3,2.5,0,2.25,.1,12);
  for(const z of [-5.6,0,5.6])box('site','metal',-21.1,1.25,z,.065,2.5,.065);
  for(let z=-5;z<6;z+=.9){box('site','darkMetal',-20.3,.35,z,.04,.7,.045);box('site','darkMetal',-20.3,.68,z,.8,.04,.045);}
  // Fence only along the south/east/west edges as depicted in configuration.
  for(const z of [14.3]){box('site','metal',-1,1.05,z,48,.05,.05);for(let x=-25;x<=23;x+=.5)box('site','darkMetal',x,1,z,.025,2,.035);}
  for(const x of [-24.8,22.8]){box('site','metal',x,1.05,-3,.05,.05,34);for(let z=-20;z<=14;z+=.5)box('site','darkMetal',x,1,z,.025,2,.035);}

  let instanceCount=0;
  for(const [key,rows] of batches){const [layer,mat]=key.split(':');const mesh=new THREE.InstancedMesh(cube,materials[mat],rows.length);
    mesh.name=key;rows.forEach((r,i)=>{dummy.position.set(r.x,r.y,r.z);dummy.rotation.set(0,0,0);dummy.scale.set(r.w,r.h,r.d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
    mesh.castShadow=layer!=='site'&&mat!=='recess';mesh.receiveShadow=true;mesh.computeBoundingSphere();groups[layer].add(mesh);instanceCount+=rows.length;
  }
  return {root,groups,openings,instanceCount};
}
