import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {makeConcreteCanvas,makeWorkshopSign} from './detailing-assets';

/** A physical detailing bay: all walls, equipment and signage stay in world space. */
export function createDetailingWorkshop() {
 const group=new THREE.Group();group.name='Devoto Detail — atelier';
 const concrete=new THREE.CanvasTexture(makeConcreteCanvas());concrete.wrapS=concrete.wrapT=THREE.RepeatWrapping;concrete.repeat.set(5,5);concrete.colorSpace=THREE.SRGBColorSpace;
 const wall=new THREE.MeshStandardMaterial({color:'#555c58',map:concrete,bumpMap:concrete,bumpScale:.008,roughness:.92});
 const charcoal=new THREE.MeshStandardMaterial({color:'#161c1b',roughness:.56,metalness:.25});
 const metal=new THREE.MeshStandardMaterial({color:'#414844',roughness:.3,metalness:.82});
 const rubber=new THREE.MeshStandardMaterial({color:'#111715',roughness:.88});
 const led=new THREE.MeshStandardMaterial({color:'#f4f8f3',emissive:'#f4f8f3',emissiveIntensity:7,roughness:.24});
 const accent=new THREE.MeshStandardMaterial({color:'#a4b883',emissive:'#a4b883',emissiveIntensity:.5});
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material)=>{
  const mesh=new THREE.Mesh(Math.min(w,h,d)>.04?new RoundedBoxGeometry(w,h,d,2,Math.min(.018,Math.min(w,h,d)*.15)):new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 const cylinder=(r:number,h:number,x:number,y:number,z:number,material:THREE.Material)=>{
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),material);mesh.position.set(x,y,z);mesh.castShadow=true;group.add(mesh);return mesh;
 };
 // Structural shell, concrete panels and metal skirting.
 box(12,4.8,.18,0,2.25,-5.9,wall);
 for(const side of [-1,1]){
  box(.18,4.8,16,side*6,2.25,1.9,wall);
  box(.13,.20,16,side*5.89,-.02,1.9,charcoal);
  for(let z=-5;z<9;z+=2.4)box(.045,4.6,.06,side*5.88,2.25,z,metal);
 }
 for(let x=-5;x<=5;x+=2)box(.025,4.6,.035,x,2.25,-5.79,metal);
 box(12,.18,16,0,4.65,1.9,charcoal);
 for(const x of [-3.4,0,3.4]){
  box(.055,.065,10,x,4.50,0,metal);box(.035,.025,9.7,x,4.455,0,led);
 }
 for(const x of [-5.7,5.7])for(const z of [-3,2.5]){box(.08,2.4,.1,x,2,z,metal);box(.035,2.2,.025,x*.994,2,z+.06,led)}
 // Epoxy bay floor with subtle microtexture, expansion joints and a drain.
 const floorMaterial=new THREE.MeshStandardMaterial({color:'#414944',map:concrete,bumpMap:concrete,bumpScale:.004,roughness:.29,metalness:.13});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(24,28),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.143;floor.receiveShadow=true;group.add(floor);
 const grout=new THREE.MeshStandardMaterial({color:'#151d19',roughness:.8});
 for(let x=-6;x<=6;x+=2)box(.009,.002,16,x,-.141,1.8,grout);
 for(let z=-6;z<=10;z+=2)box(12,.002,.009,0,-.141,z,grout);
 box(.22,.007,5,-3.7,-.137,.5,metal);for(let z=-1.9;z<3;z+=.09)box(.18,.009,.018,-3.7,-.132,z,rubber);
 // Back wall cabinets, worktop, tool rails and organised products.
 for(const x of [-4.6,-3.5,3.5,4.6]){
  box(1.02,1.0,.62,x,.43,-5.35,charcoal);box(1.08,.055,.73,x,.96,-5.32,metal);
  for(let y=.15;y<.9;y+=.22){box(.94,.016,.015,x,y,-5.03,metal);box(.38,.035,.04,x,y+.13,-4.995,metal)}
  for(let i=0;i<4;i++){
   const bx=x-.3+i*.19;const bottle=cylinder(.055,.22,bx,1.10,-5.27,charcoal);
   cylinder(.022,.055,bx,1.235,-5.27,metal);box(.065,.065,.008,bottle.position.x,1.12,-5.211,accent);
  }
 }
 // A restrained trolley, hose reel and shelves give the room a working scale.
 box(.66,.55,.48,4.4,.41,-2.8,charcoal);box(.74,.04,.56,4.4,.72,-2.8,metal);
 for(const x of [4.12,4.68])for(const z of [-3,-2.6])cylinder(.055,.06,x,.05,z,rubber);
 const reel=new THREE.Mesh(new THREE.TorusGeometry(.22,.048,12,48),rubber);reel.position.set(-5.76,1.7,-2.9);reel.rotation.y=Math.PI/2;group.add(reel);
 box(.11,.45,.54,-5.84,1.7,-2.9,metal);
 let signTexture:THREE.CanvasTexture|undefined;
 const signCanvas=makeWorkshopSign(()=>{if(signTexture)signTexture.needsUpdate=true});signTexture=new THREE.CanvasTexture(signCanvas);signTexture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.95),new THREE.MeshStandardMaterial({map:signTexture,roughness:.42,metalness:.25,emissive:'#ffffff',emissiveMap:signTexture,emissiveIntensity:.18}));sign.position.set(-2.4,2.65,-5.77);group.add(sign);
 box(3.82,.025,.08,-2.4,3.16,-5.74,led);
 const light=new THREE.PointLight('#ecf4e3',20,8,2);light.position.set(0,3.25,-4.8);group.add(light);
 return {group,dispose:()=>{concrete.dispose();signTexture?.dispose()}};
}
