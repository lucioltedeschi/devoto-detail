'use client';

import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {startSoftwareGolf} from '@/lib/software-golf';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {makeSwirlCanvas,inspectionAmount} from '@/lib/detailing-assets';
import {createDetailingWorkshop} from '@/lib/detailing-workshop';

type Props={progress:MutableRefObject<number>;onReady:(ready:boolean)=>void};
const clamp=THREE.MathUtils.clamp;
const cameraStops=[
 {p:0,pos:[4.4,2.3,6.2],target:[-.45,1.1,0]},
 {p:.20,pos:[3.8,2.0,6.3],target:[-.10,.85,.35]},
 {p:.38,pos:[.12,1.22,1.98],target:[.03,.72,1.50]},
 {p:.47,pos:[.12,1.22,1.98],target:[.03,.72,1.50]},
 {p:.64,pos:[.10,1.20,1.97],target:[.03,.72,1.50]},
 {p:.72,pos:[-2.3,1.9,5.3],target:[.0,.82,.35]},
 {p:.91,pos:[-5.4,2.5,7.2],target:[.35,1.05,0]},
 {p:1,pos:[-5.7,2.7,7.0],target:[.35,1.05,0]},
];

/** Native WebGL scene. The uploaded Golf mesh stays on screen throughout the story. */
export default function GolfScene({progress,onReady}:Props){
 const host=useRef<HTMLDivElement>(null);
 const [loading,setLoading]=useState(0),[failed,setFailed]=useState(false),[paused,setPaused]=useState(false),[software,setSoftware]=useState(false),[retry,setRetry]=useState(0);
 const pausedRef=useRef(false);
 useEffect(()=>{pausedRef.current=paused},[paused]);
 useEffect(()=>{
  if(!host.current)return;
  const container=host.current;
  let disposed=false,loaded=false,inView=true,model:THREE.Group|undefined;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile=window.matchMedia('(max-width:700px)').matches;
  if(software){setFailed(false);return startSoftwareGolf(container,progress,()=>{setLoading(100);onReady(true)},()=>{setFailed(true);onReady(false)})}
  let renderer:THREE.WebGLRenderer;
  try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});if(!gl){setFailed(true);onReady(false);return}renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true,alpha:false});}catch{setFailed(true);onReady(false);return}
  setFailed(false);setLoading(0);
  // Supersample even on a 1x desktop display; never silently choose the CPU preview.
  renderer.setPixelRatio(Math.min(3,Math.max(window.devicePixelRatio,mobile?1.75:2)));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  container.insertBefore(renderer.domElement,container.firstChild);
  renderer.domElement.setAttribute('aria-label','Volkswagen Golf GTI Mk7.5 gris: escena 3D animada al recorrer la página');
  renderer.domElement.setAttribute('role','img');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080b0d');scene.fog=new THREE.Fog('#080b0d',13,36);
  const camera=new THREE.PerspectiveCamera(mobile?42:32,1,.04,80);
  const workshop=createDetailingWorkshop();scene.add(workshop.group);
  const pmrem=new THREE.PMREMGenerator(renderer);
  const envScene=new THREE.Scene();envScene.background=new THREE.Color(.04,.045,.042);
  envScene.add(workshop.group.clone(true));envScene.add(new THREE.HemisphereLight('#eef2ee','#171c19',2));
  // Broad photographic softboxes complement the bay's real LED strips.
  const panelMat=new THREE.MeshBasicMaterial({color:new THREE.Color(6,6,6),side:THREE.DoubleSide});
  const panel=(w:number,h:number,pos:THREE.Vector3,target:THREE.Vector3)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),panelMat);mesh.position.copy(pos);mesh.lookAt(target);envScene.add(mesh);return mesh};
  const envPanels=[panel(6,.55,new THREE.Vector3(-2,4,1),new THREE.Vector3(0,0,0)),panel(6,.35,new THREE.Vector3(2,3,-1),new THREE.Vector3(0,0,0)),panel(.7,3,new THREE.Vector3(4,2,3),new THREE.Vector3(0,0,0))];
  const envTarget=pmrem.fromScene(envScene,.02);scene.environment=envTarget.texture;scene.environmentIntensity=.9;
  const hemisphere=new THREE.HemisphereLight('#dce8ef','#14171c',.45);scene.add(hemisphere);
  const key=new THREE.DirectionalLight('#f1f5ff',1.4);key.position.set(3,6,4);key.castShadow=true;
  key.shadow.mapSize.set(mobile?2048:4096,mobile?2048:4096);
  Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:18});
  key.shadow.bias=-.0001;key.shadow.normalBias=.004;key.shadow.autoUpdate=false;key.shadow.needsUpdate=true;scene.add(key);
  const rim=new THREE.DirectionalLight('#e5edf5',.9);rim.position.set(-4,3,-3);scene.add(rim);
  const fill=new THREE.DirectionalLight('#c4d0e0',.45);fill.position.set(-4,2,5);scene.add(fill);
  const targetBuffer=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});
  const composer=new EffectComposer(renderer,targetBuffer);
  const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);
  const occlusion=new SSAOPass(scene,camera,1,1,32);occlusion.kernelRadius=.14;occlusion.minDistance=.0002;occlusion.maxDistance=.018;composer.addPass(occlusion);
  const outputPass=new OutputPass();composer.addPass(outputPass);
  const inspectionLight=new THREE.SpotLight('#ffffff',0,5,.32,.75,2);inspectionLight.position.set(.65,2.1,1.9);inspectionLight.target.position.set(.12,.72,1.5);scene.add(inspectionLight,inspectionLight.target);
  const swirls=new THREE.CanvasTexture(makeSwirlCanvas());swirls.minFilter=THREE.LinearMipmapLinearFilter;swirls.magFilter=THREE.LinearFilter;swirls.generateMipmaps=true;
  const inspection={value:0};
  const finish={value:reduced?1:0};
  const paintMaterials:THREE.MeshPhysicalMaterial[]=[];
  const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load('/models/golf-gti-mk75.glb?v=fullprecision4',gltf=>{
   if(disposed){gltf.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});return;}
   model=gltf.scene;model.name='Volkswagen Golf GTI Mk7.5';
   model.traverse(obj=>{
    if(!(obj instanceof THREE.Mesh))return;
    obj.castShadow=true;obj.receiveShadow=true;
    const materials=Array.isArray(obj.material)?obj.material:[obj.material];
    for(const material of materials){
     if(!(material instanceof THREE.MeshStandardMaterial))continue;
     material.envMapIntensity=1;
     for(const map of [material.map,material.normalMap,material.roughnessMap])if(map)map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
     if(material.name==='DD_Graphite_Paint'){
      const paint=material as THREE.MeshPhysicalMaterial;paint.color.set('#30343a');paint.metalness=.72;paintMaterials.push(paint);
      paint.onBeforeCompile=shader=>{
       shader.uniforms.uDDFinish=finish;shader.uniforms.uDDInspection=inspection;shader.uniforms.uDDSwirls={value:swirls};
       shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDDPosition;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvDDPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
       shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vDDPosition;
        uniform float uDDFinish;
        uniform float uDDInspection;
        uniform sampler2D uDDSwirls;
       `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        float ddSweep=mix(-.02,.26,uDDFinish);
        float ddClean=smoothstep(vDDPosition.x-.012,vDDPosition.x+.012,ddSweep);
        vec2 ddUV=(vDDPosition.xz-vec2(.12,1.5))/.28+.5;
        float ddSurface=smoothstep(.48,.62,vDDPosition.y)*step(0.,ddUV.x)*step(ddUV.x,1.)*step(0.,ddUV.y)*step(ddUV.y,1.);
        float ddArc=texture2D(uDDSwirls,clamp(ddUV,0.,1.)).r;
        float ddScratches=ddArc*ddSurface*uDDInspection*(1.-ddClean);
        // The whole car starts slightly hazy. Only actual scratch lines reveal locally.
        roughnessFactor=mix(.29,.14,uDDFinish)+ddScratches*.22;
        diffuseColor.rgb*=mix(.94,1.,uDDFinish);
        diffuseColor.rgb+=vec3(.18,.19,.20)*ddScratches;
       `).replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
        material.clearcoatRoughness=mix(.19,.055,uDDFinish)+ddScratches*.22;
        #endif
       `);
      };
      paint.customProgramCacheKey=()=> 'devoto-aureolas-v4';
     }
    }
   });
   scene.add(model);key.shadow.needsUpdate=true;loaded=true;setLoading(100);onReady(true);
  },event=>{if(!disposed&&event.total)setLoading(Math.round(event.loaded/event.total*100))},()=>{if(!disposed){setFailed(true);onReady(false)}});
  const size=()=>{const w=container.clientWidth,h=container.clientHeight;if(w&&h){renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()}};
  const resize=new ResizeObserver(size);resize.observe(container);size();
  const intersection=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting},{rootMargin:'80px'});intersection.observe(container);
  const position=new THREE.Vector3(),target=new THREE.Vector3();let smoothed=progress.current,lastFrame=0;const clock=new THREE.Clock();
  renderer.setAnimationLoop((time:number)=>{
   if(disposed||document.hidden||!inView||time-lastFrame<1000/(mobile?45:60))return;
   lastFrame=time;
   const delta=clamp(clock.getDelta(),0,.1);
   smoothed=THREE.MathUtils.damp(smoothed,reduced?0:progress.current,8,delta);
   let i=0;while(i<cameraStops.length-2&&smoothed>cameraStops[i+1].p)i++;
   const a=cameraStops[i],b=cameraStops[i+1];let t=clamp((smoothed-a.p)/(b.p-a.p),0,1);t=t*t*(3-2*t);
   position.fromArray(a.pos).lerp(new THREE.Vector3().fromArray(b.pos),t);
   target.fromArray(a.target).lerp(new THREE.Vector3().fromArray(b.target),t);
   if(mobile){const macro=THREE.MathUtils.smoothstep(smoothed,.20,.38)*(1-THREE.MathUtils.smoothstep(smoothed,.64,.82));target.x=THREE.MathUtils.lerp(target.x,.12,macro);position.sub(target).multiplyScalar(THREE.MathUtils.lerp(1.65,1,macro)).add(target);target.y+=.15*(1-macro);}
   // A restrained living shot before scrolling. Pause control and reduced motion disable it.
   const drift=!reduced&&!pausedRef.current&&smoothed<.04?Math.sin(time*.0003)*.08:0;
   position.x+=drift;
   camera.position.copy(position);camera.lookAt(target);
   finish.value=reduced?1:clamp((smoothed-.48)/.16,0,1);
   inspection.value=reduced?0:inspectionAmount(smoothed);inspectionLight.intensity=inspection.value*7;
   if(loaded){paintMaterials.forEach(m=>{m.clearcoat=1;m.clearcoatRoughness=THREE.MathUtils.lerp(.19,.055,finish.value)})}
   composer.render();
  });
  return()=>{
   disposed=true;onReady(false);resize.disconnect();intersection.disconnect();renderer.setAnimationLoop(null);
   scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});
   renderPass.dispose();occlusion.dispose();outputPass.dispose();composer.dispose();swirls.dispose();workshop.dispose();envTarget.dispose();pmrem.dispose();envPanels.forEach(p=>p.geometry.dispose());panelMat.dispose();key.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();
  };
 },[progress,onReady,software,retry]);
 return <div ref={host} className="golf-scene">
  {loading<100&&!failed&&<div className="scene-loading" role="status"><span>PREPARANDO EL PRÓXIMO DETALLE</span><i><b style={{width:`${loading}%`}}/></i><small>{loading}%</small></div>}
  {failed&&<div className="scene-loading" role="status"><span>EL RENDER COMPLETO NECESITA WEBGL</span><p>Activá la aceleración gráfica del navegador para ver los materiales, reflejos y detalles completos.</p><button onClick={()=>{setFailed(false);setRetry(v=>v+1)}}>Reintentar</button><button onClick={()=>setSoftware(true)}>Ver vista simplificada</button></div>}
  {software&&loading===100&&<span className="software-badge">3D LIGERO</span>}
  {loading===100&&!software&&<button className="motion-control" onClick={()=>setPaused(!paused)} aria-pressed={paused} aria-label={paused?'Activar movimiento ambiental':'Pausar movimiento ambiental'}>{paused?'▶':'Ⅱ'}<span>{paused?'Activar movimiento':'Pausar movimiento'}</span></button>}
 </div>
}
