/** Browser-generated surface assets, shared by WebGL and the compatibility renderer. */
export function makeSwirlCanvas() {
 const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
 const ctx=canvas.getContext('2d')!;ctx.fillStyle='#000';ctx.fillRect(0,0,2048,2048);
 let seed=8317;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 // Long, fine overlapping arcs, with offset centres: no solid circular patch.
 for(let i=0;i<260;i++){
  const cx=1024+(random()-.5)*420,cy=1024+(random()-.5)*420;
  const r=90+random()*790,start=random()*Math.PI*2,length=.22+random()*1.8;
  ctx.strokeStyle=`rgba(255,255,255,${.12+random()*.48})`;ctx.lineWidth=.65+random()*1.2;
  ctx.beginPath();ctx.arc(cx,cy,r,start,start+length);ctx.stroke();
 }
 // Feather only the scratch lines at their outer extent, not the paint underneath.
 ctx.globalCompositeOperation='destination-in';const fade=ctx.createRadialGradient(1024,1024,650,1024,1024,1024);
 fade.addColorStop(0,'#fff');fade.addColorStop(1,'#0000');ctx.fillStyle=fade;ctx.fillRect(0,0,2048,2048);
 ctx.globalCompositeOperation='source-over';return canvas;
}

export function makeConcreteCanvas() {
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d')!;
 const image=ctx.createImageData(512,512);let seed=293;
 for(let i=0;i<image.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const n=108+(seed/4294967296)*18;image.data[i]=n;image.data[i+1]=n+1;image.data[i+2]=n+2;image.data[i+3]=255}
 ctx.putImageData(image,0,0);return c;
}

export function makeWorkshopSign(onChange?:()=>void) {
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;
 const ctx=canvas.getContext('2d')!;
 const draw=(logo?:HTMLImageElement)=>{
  ctx.fillStyle='#111715';ctx.fillRect(0,0,2048,512);
  ctx.strokeStyle='#394039';ctx.lineWidth=3;ctx.strokeRect(4,4,2040,504);
  if(logo){ctx.save();ctx.beginPath();ctx.arc(270,254,180,0,Math.PI*2);ctx.clip();ctx.drawImage(logo,90,74,360,360);ctx.restore();}
  ctx.fillStyle='#efefe7';ctx.font='600 132px Arial';ctx.fillText('DEVOTO DETAIL',510,240);
  ctx.fillStyle='#a6b19d';ctx.font='32px Arial';ctx.fillText('E S T É T I C A   V E H I C U L A R',518,320);
  ctx.fillStyle='#d6efab';ctx.fillRect(518,365,100,5);onChange?.();
 };
 draw();const logo=new Image();logo.onload=()=>draw(logo);logo.src='/images/logo.webp';
 return canvas;
}

export const inspectionAmount=(p:number)=>{
 const smooth=(a:number,b:number)=>{const t=Math.max(0,Math.min(1,(p-a)/(b-a)));return t*t*(3-2*t)};
 return smooth(.31,.38)*(1-smooth(.64,.70));
};
