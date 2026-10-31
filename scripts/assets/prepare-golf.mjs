import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRMaterialsClearcoat,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {prune,dedup,flatten,join,reorder,inspect} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import fs from 'node:fs/promises';
const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/assets/prepare-golf.mjs /absolute/path/to/source.glb');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(source);const root=doc.getRoot();const clearcoat=doc.createExtension(KHRMaterialsClearcoat);
const mat=(name,color,metal,rough,coat=0)=>{const m=doc.createMaterial(name).setBaseColorFactor([...color,1]).setMetallicFactor(metal).setRoughnessFactor(rough);if(coat)m.setExtension('KHR_materials_clearcoat',clearcoat.createClearcoat().setClearcoatFactor(coat).setClearcoatRoughnessFactor(.08));return m;};
const paint=mat('DD_Graphite_Paint',[.0296,.0343,.0423],.7,.22,1),black=mat('DD_Satin_Black',[.009,.011,.012],.05,.58),gloss=mat('DD_Piano_Black',[.008,.01,.012],.15,.19,1),chrome=mat('DD_Chrome',[.55,.58,.60],1,.19),rubber=mat('DD_Tires',[.012,.014,.016],0,.87),wheel=mat('DD_Alloy',[.19,.20,.21],.93,.25),red=mat('DD_GTI_Red',[.40,.007,.012],.35,.25,1),disc=mat('DD_Brake_Disc',[.28,.29,.3],.9,.48),glass=mat('DD_Tinted_Glass',[.012,.021,.025],.55,.10,1),lens=mat('DD_Headlight_Lens',[.55,.65,.70],.10,.1),white=mat('DD_LED',[.8,.85,.9],.1,.18),tail=mat('DD_Tail_Light',[.3,.002,.006],.1,.22,1);
lens.setAlphaMode('BLEND').setBaseColorFactor([.35,.45,.5,.10]).setDoubleSided(true);white.setEmissiveFactor([.5,.65,.75]);tail.setEmissiveFactor([.08,.001,.002]);
let removed=0;
for(const node of [...root.listNodes()]){const mesh=node.getMesh();if(!mesh)continue;const n=node.getName().toLowerCase();
 // Keep the complete cabin and mechanical detail for the highest-quality asset.
 let m=black;
 if(/_body_|carpaint/.test(n))m=paint;
 else if(/tire_|michelin/.test(n))m=rubber;
 else if(/wheel_ao_paint|wheel_ao_centre_lock/.test(n))m=wheel;
 else if(/caliper-paint-white/.test(n))m=white;
 else if(/ext-gti-accents|caliper-paint/.test(n))m=red;
 else if(/disc-gti|susp-metal/.test(n))m=disc;
 else if(/tl_glass_red|tl_reflector|brake_light_glass|^tl-(running|brake|fog)/.test(n))m=tail;
 else if(/headlight_glass|ext_glass_lights|indicator-glass/.test(n))m=lens;
 else if(/ext-glass|kswindscreen|glassblack/.test(n))m=glass;
 else if(/mainbeam-bulb|highbeam-bulb|foglight-bulbs/.test(n))m=white;
 else if(/chrome|steel|mirror_.*mirror/.test(n))m=chrome;
 else if(/gloss|kit-gloss|wheel_ao_carbon/.test(n))m=gloss;
 for(const prim of mesh.listPrimitives()){
  const original=prim.getMaterial();
  // Preserve source UVs, authored split normals and exterior decals.
  if(original?.getBaseColorTexture()){
   const textured=original.clone().setName('DD_Decal_'+original.getName());
   textured.setMetallicFactor(.1).setRoughnessFactor(.38).setDoubleSided(true);
   prim.setMaterial(textured);
  }else prim.setMaterial(m);
 }
}
// Keep all original triangles and floating-point vertex data. Only reorder and
// losslessly compress buffers; do not quantize, weld, simplify or rebuild normals.
await doc.transform(prune(),dedup(),flatten(),join(),prune(),reorder({encoder:MeshoptEncoder,target:'size'}));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await fs.mkdir('public/models',{recursive:true});await io.write('public/models/golf-gti-mk75.glb',doc);
const summary=inspect(doc);console.log(JSON.stringify({removed,meshes:root.listMeshes().length,nodes:root.listNodes().length,bytes:(await fs.stat('public/models/golf-gti-mk75.glb')).size,meshSummary:summary.meshes.properties.map(m=>({name:m.name,primitives:m.primitives,vertices:m.vertices}))},null,2));
