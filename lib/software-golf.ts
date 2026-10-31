import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

type Face={a:THREE.Vector3;b:THREE.Vector3;c:THREE.Vector3;n:THREE.Vector3;normals:THREE.Vector3[];center:THREE.Vector3;material:string};
type Projected={coords:number[];depth:number;color:string};
const stops=[{p:0,pos:[4.4,2.3,6.2],target:[-.45,1.1,0]},{p:.20,pos:[3.8,2,6.3],target:[-.1,.85,.35]},{p:.36,pos:[1.2,1.65,3.25],target:[0,.7,1.45]},{p:.59,pos:[-.05,1.3,2.95],target:[-.12,.65,1.45]},{p:.72,pos:[-2.3,1.9,5.3],target:[0,.82,.35]},{p:.91,pos:[-5.4,2.5,7.2],target:[.35,1.05,0]},{p:1,pos:[-5.7,2.7,7],target:[.35,1.05,0]}];

/** CPU raster fallback for browsers where WebGL is unavailable. Still actual 3D mesh projection. */
export function startSoftwareGolf(container:HTMLElement,progress:{current:number},onLoaded:()=>void,onError:()=>void,mode:'story'|'comparison'='story',finishOverride?:{current:number}){
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Volkswagen Golf GTI Mk7.5 gris, render 3D liviano');container.insertBefore(canvas,container.firstChild);
 const ctx=canvas.getContext('2d',{alpha:false})!;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const mobile=window.matchMedia('(max-width:700px)').matches;
 const camera=new THREE.PerspectiveCamera(mobile?42:32,1,.04,80);let width=1,height=1,disposed=false,frame=0,previous=-1,previousFinish=-1,inView=true,faces:Face[]=[];
 const resize=new ResizeObserver(()=>{const scale=Math.min(1,720/container.clientWidth,540/container.clientHeight);width=Math.round(container.clientWidth*scale);height=Math.round(container.clientHeight*scale);canvas.width=width;canvas.height=height;camera.aspect=width/height;camera.updateProjectionMatrix();previous=-1});resize.observe(container);
 const intersection=new IntersectionObserver(es=>{inView=es[0].isIntersecting});intersection.observe(container);
 const key=new THREE.Vector3(3,5,4).normalize(),rim=new THREE.Vector3(-4,3,-3).normalize(),view=new THREE.Vector3(),projected=new THREE.Vector3(),viewSpace=new THREE.Vector3();
 const render=(p:number)=>{
  let i=0;while(i<stops.length-2&&p>stops[i+1].p)i++;const a=stops[i],b=stops[i+1];let t=THREE.MathUtils.clamp((p-a.p)/(b.p-a.p),0,1);t=t*t*(3-2*t);
  const position=new THREE.Vector3().fromArray(a.pos).lerp(new THREE.Vector3().fromArray(b.pos),t),target=new THREE.Vector3().fromArray(a.target).lerp(new THREE.Vector3().fromArray(b.target),t);
  if(mobile){const far=p<.27||p>.73;position.multiplyScalar(far?1.65:1.04);if(far)target.y+=.15}
  camera.position.copy(position);camera.lookAt(target);camera.updateMatrixWorld();
  const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,'#09100e');bg.addColorStop(.65,'#141e19');bg.addColorStop(1,'#0a100d');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
  // World-space floor and contact shadow are projected with the same camera.
  const point=(v:THREE.Vector3)=>{projected.copy(v).project(camera);return [(projected.x*.5+.5)*width,(-projected.y*.5+.5)*height]};
  ctx.strokeStyle='#27352d';ctx.lineWidth=.7;
  for(let z=-8;z<=8;z+=2){const aa=point(new THREE.Vector3(-12,-.14,z)),bb=point(new THREE.Vector3(12,-.14,z));ctx.beginPath();ctx.moveTo(aa[0],aa[1]);ctx.lineTo(bb[0],bb[1]);ctx.stroke()}
  const shadow=point(new THREE.Vector3(0,-.13,0));const shadowSize=Math.min(width*.40,width*(p>.3&&p<.65?.8:.4));
  const g=ctx.createRadialGradient(shadow[0],shadow[1],0,shadow[0],shadow[1],shadowSize);g.addColorStop(0,'#000b');g.addColorStop(1,'#0000');ctx.save();ctx.translate(shadow[0],shadow[1]);ctx.scale(1,.25);ctx.translate(-shadow[0],-shadow[1]);ctx.fillStyle=g;ctx.fillRect(shadow[0]-shadowSize,shadow[1]-shadowSize,shadowSize*2,shadowSize*2);ctx.restore();
  const finish=finishOverride?finishOverride.current:reduced?1:THREE.MathUtils.clamp((p-.34)/.33,0,1);
  const pixels=ctx.getImageData(0,0,width,height),data=pixels.data,zBuffer=new Float32Array(width*height);zBuffer.fill(Infinity);
  const shade=(m:string,n:THREE.Vector3,pos:THREE.Vector3)=>{
   const v=camera.position.clone().sub(pos).normalize();const facing=Math.max(0,n.dot(v));let base=[.022,.028,.027],metal=0,rough=.55;
   if(m==='DD_Graphite_Paint'){const clean=THREE.MathUtils.smoothstep(finish*3.2-1.6,pos.x-.2,pos.x+.2);base=[.16+clean*.085,.165+clean*.09,.16+clean*.105];metal=.7;rough=.62-clean*.44;}
   else if(m==='DD_Chrome'){base=[.52,.55,.57];metal=1;rough=.18}
   else if(m==='DD_Alloy'){base=[.23,.25,.27];metal=.9;rough=.25}
   else if(m==='DD_Tinted_Glass'){base=[.016,.03,.035];metal=.9;rough=.10}
   else if(m==='DD_GTI_Red'||m==='DD_Tail_Light'){base=[.42,.013,.02];metal=.4;rough=.25}
   else if(m==='DD_LED'){base=[.85,.91,.94];metal=.1;rough=.15}
   else if(m==='DD_Tires'){base=[.018,.021,.023];rough=.85}
   else if(m==='DD_Brake_Disc'){base=[.32,.34,.35];metal=.9;rough=.5}
   else if(m==='DD_Piano_Black'){base=[.012,.016,.018];metal=.6;rough=.15}
   const diffuse=.35+Math.max(0,n.dot(key))*.7+Math.max(0,n.dot(rim))*.3;
   const half=v.clone().add(key).normalize(),spec=Math.pow(Math.max(0,n.dot(half)),Math.max(3,40*(1-rough)))*(.08+metal*.32);
   const reflection=n.clone().multiplyScalar(2*n.dot(v)).sub(v);
   const band=(Math.exp(-Math.pow((reflection.y-.75)*22,2))+Math.exp(-Math.pow((reflection.x+.48)*28,2))*.8)*metal*(1-rough)*.35;
   const fresnel=Math.pow(1-facing,4)*metal*.12;
   return base.map(c=>Math.min(255,(c*diffuse+spec+band+fresnel)*255));
  };
  for(const f of faces){
   view.copy(camera.position).sub(f.center).normalize();const geometric=f.b.clone().sub(f.a).cross(f.c.clone().sub(f.a)).normalize();if(geometric.dot(view)<=0)continue;
   const vs=[f.a,f.b,f.c],cs=vs.map(point),zs=vs.map(v=>-viewSpace.copy(v).applyMatrix4(camera.matrixWorldInverse).z);if(zs.some(z=>z<.04))continue;
   const [[x0,y0],[x1,y1],[x2,y2]]=cs,den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2);if(Math.abs(den)<.15)continue;
   const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2))),maxX=Math.min(width-1,Math.ceil(Math.max(x0,x1,x2))),minY=Math.max(0,Math.floor(Math.min(y0,y1,y2))),maxY=Math.min(height-1,Math.ceil(Math.max(y0,y1,y2)));if(minX>maxX||minY>maxY)continue;
   const colors=vs.map((v,j)=>shade(f.material,f.normals[j],v));const [iz0,iz1,iz2]=zs.map(z=>1/z);
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const w0=((y1-y2)*(x-x2)+(x2-x1)*(y-y2))/den,w1=((y2-y0)*(x-x2)+(x0-x2)*(y-y2))/den,w2=1-w0-w1;if(w0<-.001||w1<-.001||w2<-.001)continue;
    const z=1/(w0*iz0+w1*iz1+w2*iz2),index=y*width+x;if(z>=zBuffer[index])continue;zBuffer[index]=z;
    const a=w0*iz0*z,b=w1*iz1*z,c=w2*iz2*z;let scratch=0;
    if(f.material==='DD_Graphite_Paint'&&p>.26&&p<.72){const wx=a*f.a.x+b*f.b.x+c*f.c.x,wz=a*f.a.z+b*f.b.z+c*f.c.z,dx=wx-.12,dz=wz-1.5,r=Math.sqrt(dx*dx+dz*dz),angle=Math.atan2(dz,dx);const clean=THREE.MathUtils.smoothstep(finish*3.2-1.6,wx-.2,wx+.2);scratch=Math.pow(Math.max(0,Math.sin(r*1450+Math.sin(angle*27)*.65)),28)*(1-clean)*28;}
    const j=index*4;for(let k=0;k<3;k++)data[j+k]=Math.min(255,a*colors[0][k]+b*colors[1][k]+c*colors[2][k]+scratch);data[j+3]=255;
   }
  }
  ctx.putImageData(pixels,0,0);
 };
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 loader.load('/models/golf-gti-mk75-lite.glb',gltf=>{
  if(disposed)return;gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const mat=Array.isArray(o.material)?o.material[0]:o.material;if(mat.name==='DD_Headlight_Lens')return;const pos=o.geometry.attributes.position,norm=o.geometry.attributes.normal,idx=o.geometry.index;const nmat=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
   for(let k=0;k<(idx?idx.count:pos.count);k+=3){const ids=[0,1,2].map(v=>idx?idx.getX(k+v):k+v);const pts=ids.map(j=>new THREE.Vector3().fromBufferAttribute(pos,j).applyMatrix4(o.matrixWorld));const normal=new THREE.Vector3();ids.forEach(j=>normal.add(new THREE.Vector3().fromBufferAttribute(norm,j)));normal.normalize().applyMatrix3(nmat).normalize();faces.push({a:pts[0],b:pts[1],c:pts[2],n:normal,normals:ids.map(j=>new THREE.Vector3().fromBufferAttribute(norm,j).applyMatrix3(nmat).normalize()),center:pts[0].clone().add(pts[1]).add(pts[2]).multiplyScalar(1/3),material:mat.name})}
   o.geometry.dispose();mat.dispose();
  });
  onLoaded();previous=-1;
 },undefined,()=>{if(!disposed)onError()});
 const tick=()=>{if(disposed)return;const p=mode==='comparison'?0:reduced?0:progress.current;const f=finishOverride?.current??0;if(inView&&faces.length&&(Math.abs(p-previous)>.001||Math.abs(f-previousFinish)>.001)){render(p);previous=p;previousFinish=f}frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);
 return()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();intersection.disconnect();canvas.remove();faces=[]};
}
