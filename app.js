import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {makeMaterials,makeEnvironment} from './materials.js';
import {createBuilding,dimensions} from './building.js';

const $=s=>document.querySelector(s);
try {
  const container=$('#viewport');
  const mobile=matchMedia('(pointer:coarse)').matches;
  if(innerWidth<700){document.body.classList.add('panel-collapsed');$('#panel-toggle').setAttribute('aria-expanded','false');$('#panel-toggle span').textContent='+';}
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  container.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','ドラッグやタッチで回転できる建築外観');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#e7ede9');
  scene.environment=makeEnvironment();scene.environmentIntensity=.6;
  const camera=new THREE.PerspectiveCamera(40,1,.2,300);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;
  controls.minDistance=9;controls.maxDistance=180;controls.maxPolarAngle=Math.PI*.485;controls.screenSpacePanning=true;
  controls.autoRotateSpeed=.45;controls.target.set(0,9,0);
  controls.touches.ONE=THREE.TOUCH.ROTATE;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  const sky=new THREE.HemisphereLight('#e5f3ff','#a29c82',2.25);scene.add(sky);
  const sun=new THREE.DirectionalLight('#fff5df',3.2);sun.position.set(-25,45,-35);sun.castShadow=true;
  sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.near=.5;sun.shadow.camera.far=140;
  sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;sun.shadow.radius=2;scene.add(sun);
  const materials=makeMaterials(),model=createBuilding(materials);scene.add(model.root);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:'#d6ddd1',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.275;ground.receiveShadow=true;scene.add(ground);
  const names={overview:'北西からの外観',north:'正面・北立面',south:'南立面',east:'東立面',west:'西立面',roof:'屋上・鳥瞰'};
  const offsets={overview:[-42,29,-48],north:[0,7,-61],south:[0,7,61],east:[56,7,0],west:[-56,7,0],roof:[-15,63,22]};
  let view='overview',animation=null,pending=false,disposed=false,quality='auto',lastStats='',renderCount=0;
  const target=new THREE.Vector3(0,9,0);
  function fitOffset(v){
    const aspect=innerWidth/innerHeight;
    // Vertical phones retain the entire 32.65m width and room for header / panel.
    const scale=aspect<1?Math.max(1,1/aspect*.78):1;
    return new THREE.Vector3(...v).multiplyScalar(scale);
  }
  function requestRender(){if(!pending&&!disposed&&!document.hidden){pending=true;requestAnimationFrame(frame);}}
  function frame(now){
    pending=false;if(disposed||document.hidden)return;
    if(animation){const t=Math.min(1,(now-animation.start)/650),ease=1-(1-t)**3;
      camera.position.lerpVectors(animation.from,animation.to,ease);controls.target.lerpVectors(animation.targetFrom,target,ease);
      if(t===1)animation=null;
    }
    const changed=controls.update();renderer.render(scene,camera);renderCount++;
    const info=renderer.info.render;
    const st=`${info.triangles.toLocaleString()} tris · ${info.calls} draws`;
    if(st!==lastStats){$('#stats').textContent=st;lastStats=st;}
    if(animation||controls.autoRotate||changed)requestRender();
  }
  function setView(name,instant=false){
    view=name;const dest=target.clone().add(fitOffset(offsets[name]));
    if(instant){camera.position.copy(dest);controls.target.copy(target);controls.update();}
    else animation={from:camera.position.clone(),to:dest,targetFrom:controls.target.clone(),start:performance.now()};
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
    $('#view-name').textContent=names[name];requestRender();
  }
  function applyQuality(){
    const lite=quality==='light'||(quality==='auto'&&(mobile||innerWidth<700));
    const ratio=lite?Math.min(devicePixelRatio,1.25):Math.min(devicePixelRatio,1.75);
    renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);
    sun.shadow.mapSize.set(lite?1024:2048,lite?1024:2048);
    if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
    renderer.shadowMap.needsUpdate=true;requestRender();
  }
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();applyQuality();setView(view,true);}
  controls.addEventListener('change',requestRender);
  controls.addEventListener('start',()=>{animation=null;});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.querySelectorAll('[data-layer]').forEach(el=>el.addEventListener('change',()=>{
    model.groups[el.dataset.layer].visible=el.checked;renderer.shadowMap.needsUpdate=true;requestRender();
  }));
  document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{
    const warm=b.dataset.light==='warm';sun.position.set(warm?-35:-25,warm?24:45,warm?18:-35);sun.color.set(warm?'#ffd5a0':'#fff5df');
    sky.intensity=warm?1.7:2.25;scene.background.set(warm?'#e8e4d8':'#e7ede9');
    document.querySelectorAll('[data-light]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderer.shadowMap.needsUpdate=true;requestRender();
  }));
  $('#quality').addEventListener('change',e=>{quality=e.target.value;applyQuality();});
  $('#rotate').addEventListener('change',e=>{controls.autoRotate=e.target.checked;requestRender();});
  $('#panel-toggle').addEventListener('click',()=>{const collapsed=document.body.classList.toggle('panel-collapsed');$('#panel-toggle').setAttribute('aria-expanded',String(!collapsed));$('#panel-toggle span').textContent=collapsed?'+':'−';});
  $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('#fullscreen').textContent='全画面は非対応';}});
  $('#capture').addEventListener('click',()=>{
    renderer.render(scene,camera);
    renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`architecture-${view}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
  });
  addEventListener('resize',resize);document.addEventListener('visibilitychange',requestRender);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;$('#error').textContent='3D描画が中断されました。ページを再読み込みしてください。';});
  // Exposed read-only diagnostics for model / browser QA, useful on physical phones too.
  window.modelDiagnostics=()=>({dimensions,instances:model.instanceCount,drawCalls:renderer.info.render.calls,
    triangles:renderer.info.render.triangles,pixelRatio:renderer.getPixelRatio(),shadowSize:sun.shadow.mapSize.x,
    renderedFrames:renderCount,view,visible:Object.fromEntries(Object.entries(model.groups).map(([k,g])=>[k,g.visible])),
    canvas:[renderer.domElement.width,renderer.domElement.height],camera:camera.position.toArray(),
    openingCount:Object.fromEntries(Object.entries(model.openings).map(([k,a])=>[k,a.length]))});
  resize();$('#loading').remove();requestRender();
  addEventListener('pagehide',()=>{disposed=true;controls.dispose();renderer.dispose();});
}catch(e){
  $('#loading')?.remove();$('#error').hidden=false;$('#error').textContent=`3Dを開始できませんでした。WebGL対応ブラウザとHTTP配信を確認してください。 ${e.message}`;console.error(e);
}
