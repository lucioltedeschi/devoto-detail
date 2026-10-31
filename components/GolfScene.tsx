'use client';

import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {startSoftwareGolf} from '@/lib/software-golf';
import {Reflector} from 'three/addons/objects/Reflector.js';

type Props={progress:MutableRefObject<number>;onReady:(ready:boolean)=>void};
const clamp=THREE.MathUtils.clamp;
const cameraStops=[
 {p:0,pos:[4.4,2.3,6.2],target:[-.45,1.1,0]},
 {p:.20,pos:[3.8,2.0,6.3],target:[-.10,.85,.35]},
 {p:.36,pos:[1.20,1.65,3.25],target:[.0,.70,1.45]},
 {p:.59,pos:[-.05,1.30,2.95],target:[-.12,.65,1.45]},
 {p:.72,pos:[-2.3,1.9,5.3],target:[.0,.82,.35]},
 {p:.91,pos:[-5.4,2.5,7.2],target:[.35,1.05,0]},
 {p:1,pos:[-5.7,2.7,7.0],target:[.35,1.05,0]},
];

/** Native WebGL scene. The uploaded Golf mesh stays on screen throughout the story. */
export default function GolfScene({progress,onReady}:Props){
 const host=useRef<HTMLDivElement>(null);
 const [loading,setLoading]=useState(0),[failed,setFailed]=useState(false),[paused,setPaused]=useState(false),[software,setSoftware]=useState(false);
 const pausedRef=useRef(false);
 useEffect(()=>{pausedRef.current=paused},[paused]);
 useEffect(()=>{
  if(!host.current)return;
  const container=host.current;
  let disposed=false,loaded=false,inView=true,model:THREE.Group|undefined;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=window.matchMedia('(max-width:700px)').matches;
  let renderer:THREE.WebGLRenderer;
  try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});if(!gl){setSoftware(true);return startSoftwareGolf(container,progress,()=>{setLoading(100);onReady(true)},()=>{setFailed(true);onReady(false)})}renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true,alpha:false});}catch{setSoftware(true);return startSoftwareGolf(container,progress,()=>{setLoading(100);onReady(true)},()=>{setFailed(true);onReady(false)})}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,mobile?1.3:1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  container.insertBefore(renderer.domElement,container.firstChild);
  renderer.domElement.setAttribute('aria-label','Volkswagen Golf GTI Mk7.5 gris: escena 3D animada al recorrer la página');
  renderer.domElement.setAttribute('role','img');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#09100e');scene.fog=new THREE.Fog('#09100e',13,36);
  const camera=new THREE.PerspectiveCamera(mobile?42:32,1,.04,80);
  const pmrem=new THREE.PMREMGenerator(renderer);
  const envScene=new RoomEnvironment();
  // Long studio softboxes create reflections that move over the actual body geometry.
  const panelMat=new THREE.MeshBasicMaterial({color:new THREE.Color(5,5.3,5.5),side:THREE.DoubleSide});
  const panel=(w:number,h:number,pos:THREE.Vector3,target:THREE.Vector3)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),panelMat);mesh.position.copy(pos);mesh.lookAt(target);envScene.add(mesh);};
  panel(7,.3,new THREE.Vector3(-2,4,1),new THREE.Vector3(0,0,0));
  panel(7,.18,new THREE.Vector3(2,3,-1),new THREE.Vector3(0,0,0));
  panel(.5,4,new THREE.Vector3(4,2,3),new THREE.Vector3(0,0,0));
  const envTarget=pmrem.fromScene(envScene,.025);scene.environment=envTarget.texture;scene.environmentIntensity=.75;
  const hemisphere=new THREE.HemisphereLight('#dce8ef','#18231b',1.1);scene.add(hemisphere);
  const key=new THREE.DirectionalLight('#edf4ff',3.2);key.position.set(3,5,4);scene.add(key);
  const rim=new THREE.DirectionalLight('#cbdccf',2.0);rim.position.set(-4,3,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight('#a5bbc8',1.1);fill.position.set(-4,2,5);scene.add(fill);
  const floorGeometry=new THREE.PlaneGeometry(60,60);
  const floor=new Reflector(floorGeometry,{clipBias:.003,textureWidth:mobile?384:768,textureHeight:mobile?384:768,color:0x242c29,multisample:0});
  floor.rotation.x=-Math.PI/2;floor.position.y=-.142;scene.add(floor);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const shadowCtx=shadowCanvas.getContext('2d')!;const gradient=shadowCtx.createRadialGradient(128,128,10,128,128,125);gradient.addColorStop(0,'rgba(0,0,0,.9)');gradient.addColorStop(.5,'rgba(0,0,0,.7)');gradient.addColorStop(1,'rgba(0,0,0,0)');shadowCtx.fillStyle=gradient;shadowCtx.fillRect(0,0,256,256);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(3.1,6.0),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=-.137;scene.add(contactShadow);
  // Actual light strips remain geometry in the studio; they are not a background photograph.
  const studio=new THREE.Group();scene.add(studio);
  const stripMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,2.4,2.4)});
  for(const x of [-3.5,3.5])for(const z of [-3,1,5]){const strip=new THREE.Mesh(new THREE.BoxGeometry(.055,.035,2.5),stripMaterial);strip.position.set(x,3.6,z);studio.add(strip);}
  const backWall=new THREE.Mesh(new THREE.PlaneGeometry(35,9),new THREE.MeshStandardMaterial({color:'#0b110e',roughness:.8}));backWall.position.set(0,3,-7);scene.add(backWall);
  const finish={value:reduced?1:0};
  const paintMaterials:THREE.MeshPhysicalMaterial[]=[];
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load('/models/golf-gti-mk75.glb',gltf=>{
   if(disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});return;}
   model=gltf.scene;model.name='Volkswagen Golf GTI Mk7.5';
   model.traverse(obj=>{
    if(!(obj instanceof THREE.Mesh))return;
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const material of materials){
     if(!(material instanceof THREE.MeshStandardMaterial))continue;
     material.envMapIntensity=1;
     if(material.name==='DD_Graphite_Paint'){
      const paint=material as THREE.MeshPhysicalMaterial;paintMaterials.push(paint);
      paint.onBeforeCompile=shader=>{
       shader.uniforms.uDDFinish=finish;
       shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDDPosition;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvDDPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
       shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vDDPosition;
        uniform float uDDFinish;
        float ddHash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
        float ddNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(ddHash(i),ddHash(i+vec3(1,0,0)),f.x),mix(ddHash(i+vec3(0,1,0)),ddHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(ddHash(i+vec3(0,0,1)),ddHash(i+vec3(1,0,1)),f.x),mix(ddHash(i+vec3(0,1,1)),ddHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
       `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        float ddSweep=mix(-1.6,1.6,uDDFinish);
        float ddClean=smoothstep(vDDPosition.x-.20,vDDPosition.x+.20,ddSweep);
        vec2 ddDelta=vDDPosition.xz-vec2(.12,1.5);
        float ddRadius=length(ddDelta);
        float ddAngle=atan(ddDelta.y,ddDelta.x);
        float ddArc=pow(max(0.,sin(ddRadius*1450.+sin(ddAngle*27.)*.65)),24.);
        ddArc*=smoothstep(.30,.7,ddNoise(vDDPosition*90.));
        float ddRoad=ddNoise(vDDPosition*20.)*.55+ddNoise(vDDPosition*68.)*.25;
        roughnessFactor=mix(.55+ddRoad*.18+ddArc*.15,.15,ddClean);
        diffuseColor.rgb*=mix(vec3(.56,.50,.41)+vec3(ddRoad*.20+ddArc*.08),vec3(1.),ddClean);
       `);
      };
      paint.customProgramCacheKey=()=> 'devoto-paint-v1';
     }
    }
   });
   scene.add(model);loaded=true;setLoading(100);onReady(true);
  },event=>{if(!disposed&&event.total)setLoading(Math.round(event.loaded/event.total*100))},()=>{if(!disposed){setFailed(true);onReady(false)}});
  const size=()=>{const w=container.clientWidth,h=container.clientHeight;if(w&&h){renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}};
  const resize=new ResizeObserver(size);resize.observe(container);size();
  const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting},{rootMargin:'80px'});intersection.observe(container);
  const position=new THREE.Vector3(),target=new THREE.Vector3();let smoothed=progress.current,lastFrame=0;const clock=new THREE.Clock();
  renderer.setAnimationLoop((time:number)=>{
   if(disposed||document.hidden||!inView||time-lastFrame<1000/(mobile?30:45))return;
   lastFrame=time;
   const delta=clamp(clock.getDelta(),0,.1);
   smoothed=THREE.MathUtils.damp(smoothed,reduced?0:progress.current,8,delta);
   let i=0;while(i<cameraStops.length-2&&smoothed>cameraStops[i+1].p)i++;
   const a=cameraStops[i],b=cameraStops[i+1];let t=clamp((smoothed-a.p)/(b.p-a.p),0,1);t=t*t*(3-2*t);
   position.fromArray(a.pos).lerp(new THREE.Vector3().fromArray(b.pos),t);
   target.fromArray(a.target).lerp(new THREE.Vector3().fromArray(b.target),t);
   if(mobile){const far=smoothed<.27||smoothed>.73;position.multiplyScalar(far?1.65:1.04);if(far)target.y+=.15;}
   // A restrained living shot before scrolling. Pause control and reduced motion disable it.
   const drift=!reduced&&!pausedRef.current&&smoothed<.04?Math.sin(time*.0003)*.08:0;
   position.x+=drift;
   camera.position.copy(position);camera.lookAt(target);
   finish.value=reduced?1:clamp((smoothed-.34)/.33,0,1);
   if(loaded){paintMaterials.forEach(m=>{m.clearcoat=THREE.MathUtils.lerp(.3,1,finish.value);m.clearcoatRoughness=THREE.MathUtils.lerp(.38,.07,finish.value)})}
   renderer.render(scene,camera);
  });
  return()=>{
   disposed=true;onReady(false);resize.disconnect();intersection.disconnect();renderer.setAnimationLoop(null);
   scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
   floor.getRenderTarget().dispose();shadowTexture.dispose();envTarget.dispose();pmrem.dispose();envScene.dispose();renderer.dispose();renderer.domElement.remove();
  };
 },[progress,onReady]);
 return <div ref={host} className="golf-scene">
  {loading<100&&!failed&&<div className="scene-loading" role="status"><span>PREPARANDO EL PRÓXIMO DETALLE</span><i><b style={{width:`${loading}%`}}/></i><small>{loading}%</small></div>}
  {failed&&<div className="scene-loading" role="status"><span>LA ESCENA 3D NO PUDO INICIARSE</span><p>Podés seguir explorando nuestros servicios.</p><a href="#servicios">Ver servicios ↗</a></div>}
  {software&&loading===100&&<span className="software-badge">3D LIGERO</span>}
  {loading===100&&!software&&<button className="motion-control" onClick={()=>setPaused(!paused)} aria-pressed={paused} aria-label={paused?'Activar movimiento ambiental':'Pausar movimiento ambiental'}>{paused?'▶':'Ⅱ'}<span>{paused?'Activar movimiento':'Pausar movimiento'}</span></button>}
 </div>
}
