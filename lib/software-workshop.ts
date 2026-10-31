import * as THREE from 'three';

/** Perspective room approximation used only when the browser cannot create WebGL. */
export function drawSoftwareWorkshop(ctx:CanvasRenderingContext2D,camera:THREE.PerspectiveCamera,width:number,height:number,sign:HTMLCanvasElement){
 const project=(p:number[])=>{const v=new THREE.Vector3().fromArray(p),depth=-v.clone().applyMatrix4(camera.matrixWorldInverse).z;v.project(camera);return {x:(v.x*.5+.5)*width,y:(-.5*v.y+.5)*height,depth}};
 const quad=(points:number[][],color:string)=>{const p=points.map(project);if(p.some(v=>v.depth<.05))return;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);p.slice(1).forEach(v=>ctx.lineTo(v.x,v.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();return p};
 const bg=ctx.createLinearGradient(0,0,0,height);bg.addColorStop(0,'#171d1b');bg.addColorStop(.6,'#222c26');bg.addColorStop(1,'#0e1510');ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 quad([[-6,-.14,-5.8],[6,-.14,-5.8],[6,4.6,-5.8],[-6,4.6,-5.8]],'#252c29');
 quad([[-6,-.14,4],[-6,-.14,-5.8],[-6,4.6,-5.8],[-6,4.6,4]],'#19221e');
 quad([[6,-.14,-5.8],[6,-.14,4],[6,4.6,4],[6,4.6,-5.8]],'#141c18');
 quad([[-6,-.14,-5.8],[-6,-.14,4],[6,-.14,4],[6,-.14,-5.8]],'#26312a');
 const line=(a:number[],b:number[],color:string,weight=.5)=>{const p=project(a),q=project(b);if(p.depth<.05||q.depth<.05)return;ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()};
 for(let x=-6;x<=6;x+=2){line([x,-.14,-5.8],[x,-.14,4],'#38423b');line([x,-.14,-5.78],[x,4.6,-5.78],'#131b17')}
 for(let z=-5.8;z<=4;z+=2)line([-6,-.14,z],[6,-.14,z],'#38423b');
 for(const x of [-3.4,0,3.4])line([x,4.45,-5],[x,4.45,4],'#e2eae1',Math.max(.8,width*.002));
 for(const x of [-5.78,5.78])for(const z of [-3,2.5])line([x,.9,z],[x,3.1,z],'#dbe6d8',Math.max(.8,width*.002));
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{
  quad([[x-w/2,y-h/2,z+d/2],[x+w/2,y-h/2,z+d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]],color);
  quad([[x-w/2,y+h/2,z-d/2],[x+w/2,y+h/2,z-d/2],[x+w/2,y+h/2,z+d/2],[x-w/2,y+h/2,z+d/2]],'#626d62');
  for(let dy=-h/2+.2;dy<h/2;dy+=.22)line([x-w*.4,y+dy,z+d/2+.01],[x+w*.4,y+dy,z+d/2+.01],'#4b574d');
 };
 for(const x of [-4.6,-3.5,3.5,4.6]){box(x,.43,-5.35,1.02,1,.62,'#101b15');for(let i=0;i<4;i++)box(x-.3+i*.19,1.1,-5.27,.09,.22,.09,'#879878')}
 const corners=[[-4.3,3.125,-5.76],[-.5,3.125,-5.76],[-.5,2.175,-5.76],[-4.3,2.175,-5.76]].map(project);
 if(corners.every(p=>p.depth>.05)){
  // Two clipped affine triangles preserve the sign's perspective and actual logo.
  const tri=(ids:number[],uv:number[][])=>{
   const p=ids.map(i=>corners[i]);ctx.save();ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);ctx.lineTo(p[1].x,p[1].y);ctx.lineTo(p[2].x,p[2].y);ctx.closePath();ctx.clip();
   const [[u0,v0],[u1,v1],[u2,v2]]=uv,den=u0*(v1-v2)+u1*(v2-v0)+u2*(v0-v1);
   const coefficient=(axis:'x'|'y')=>{const a=p.map(q=>q[axis]);return [(a[0]*(v1-v2)+a[1]*(v2-v0)+a[2]*(v0-v1))/den,(a[0]*(u2-u1)+a[1]*(u0-u2)+a[2]*(u1-u0))/den,(a[0]*(u1*v2-u2*v1)+a[1]*(u2*v0-u0*v2)+a[2]*(u0*v1-u1*v0))/den]};
   const a=coefficient('x'),b=coefficient('y');ctx.setTransform(a[0],b[0],a[1],b[1],a[2],b[2]);ctx.drawImage(sign,0,0);ctx.restore();
  };
  tri([0,1,2],[[0,0],[sign.width,0],[sign.width,sign.height]]);tri([0,2,3],[[0,0],[sign.width,sign.height],[0,sign.height]]);
 }
 line([-4.31,3.16,-5.74],[-.49,3.16,-5.74],'#e9f2e4',1.6);
}
