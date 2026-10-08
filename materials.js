import * as THREE from 'three';

// Static, small cubemap. Reflections never render the scene a second time.
export function makeEnvironment(){
  const faces=Array.from({length:6},(_,i)=>{
    const c=document.createElement('canvas');c.width=c.height=128;
    const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
    g.addColorStop(0,'#b9d6e5');g.addColorStop(.48,'#eaf1ee');g.addColorStop(.54,'#92a699');g.addColorStop(1,'#53645e');
    x.fillStyle=i===2?'#ddebf0':i===3?'#718376':g;x.fillRect(0,0,128,128);
    if(i!==2&&i!==3){x.fillStyle='#ffffff70';x.fillRect(18,10,80,9);x.fillRect(60,30,50,5);}
    return c;
  });
  const t=new THREE.CubeTexture(faces);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t;
}

export function makeMaterials(){
  const standard=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const tile=standard('#c4bfad',.82);
  // World-space 300 x 100 mm tile pattern: scale is independent of panel size.
  tile.onBeforeCompile=s=>{
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWorldTile; varying vec3 vTileNormal;');
    s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
      vec4 tilePosition = vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      tilePosition = instanceMatrix * tilePosition;
      #endif
      vWorldTile = (modelMatrix * tilePosition).xyz;
      vTileNormal = normalize(mat3(modelMatrix) * objectNormal);`);
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWorldTile; varying vec3 vTileNormal;');
    s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      vec2 uvTile = abs(vTileNormal.x) > 0.5 ? vWorldTile.zy : vWorldTile.xy;
      float row = floor(uvTile.y / 0.1);
      vec2 cell = vec2((uvTile.x + mod(row,2.0)*0.15)/0.3,uvTile.y/0.1);
      vec2 f = fract(cell); vec2 aa = max(fwidth(cell),vec2(0.0001));
      vec2 line = 1.0 - smoothstep(vec2(0.014)-aa,vec2(0.014)+aa,min(f,1.0-f));
      float joint = max(line.x,line.y);
      float variation = fract(sin(dot(floor(cell),vec2(12.9898,78.233)))*43758.5453);
      diffuseColor.rgb *= mix(0.96,1.035,variation);
      diffuseColor.rgb = mix(diffuseColor.rgb,diffuseColor.rgb*0.69,joint*0.72);`);
  };
  tile.customProgramCacheKey=()=> 'world-tile-v1';
  return {tile,metal:standard('#a6afb0',.32,.7),darkMetal:standard('#535d5f',.48,.65),
    glass:new THREE.MeshStandardMaterial({color:'#8eb7bd',roughness:.14,metalness:.48,transparent:true,opacity:.67,depthWrite:false,envMapIntensity:1.15,side:THREE.DoubleSide}),
    recess:standard('#233338',.93),roof:standard('#a5a79d',.95),concrete:standard('#c5c7b9',.91),
    paving:standard('#c3bfb0',.94),asphalt:standard('#747d78',1),white:standard('#e9e8d8',.92),
    lawn:standard('#80936b',1),leaves:standard('#718766',1),trunk:standard('#74695a',1),tactile:standard('#c3ab57',.9)};
}
