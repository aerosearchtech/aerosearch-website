/* Site 02: a spatial comparison of independent surveys, with illustrative replay. */
'use strict';
const $ = id => document.getElementById(id);
const canvas = $('map'), ctx = canvas.getContext('2d');
const surface = document.createElement('canvas'), sc = surface.getContext('2d');
const W = 2000, H = 985, duration = 31, rows = 8, columns = 16;
const state = {ready:false, mode:'map', progress:0, playing:false, speed:1, scale:1, x:0, y:0, selected:null, recording:false};
let meta, manifest, grid, targets, refs, measurements, scores, valid, gridImage;
let width=0, height=0, dpr=1, dirty=true, lastTime=0, selectedLayer='rgb', tileErrors=0;
const tiles=new Map(), lods={};
const emiDisplay={width:6,samples:false};
let emiSegments=[];
const emiCache=document.createElement('canvas');let emiCacheKey='';
const rasterCache=new Map();
const layers=[
  {id:'targets', name:'Known placements', sub:'150 reference locations', color:'#79d5d0', glyph:'◉', on:false, opacity:1, note:'Reference labels: inert objects, clutter, controls and blank locations. These are not detections.'},
  {id:'gpr', name:'GPR interpretations', sub:'18 positive labels · no raw radar', color:'#c8a5e6', glyph:'◎', on:false, opacity:1, note:'Published AIU1 interpretation flags at target locations. Raw radargrams are not available in the downloaded release.'},
  {id:'fusion', name:'Combined contrast', sub:'RGB + thermal + EMI', color:'#f5ad63', glyph:'∴', on:false, opacity:.9, note:'Geometric mean of normalized contrasts at supported EMI samples. Survey pads excluded. An exploratory score, not a mine probability.'},
  {id:'magdrone', name:'MagDrone R1', sub:'Measured tracks · fluxgate', color:'#9ec9ee', glyph:'≋', on:false, opacity:.85, note:'6,676 display bins of positioned TMI measurements. Colors show relative deviation; click for nT. Gaps are unmeasured here.'},
  {id:'magnimbus', name:'MagNIMBUS', sub:'Measured tracks · total field', color:'#c5b5ee', glyph:'≋', on:false, opacity:.85, note:'4,701 display bins of positioned TMI measurements. Each bin aggregates original readings; it is not a full-area image.'},
  {id:'emi', name:'EMI metal response', sub:'Measured profiles · EM61', color:'#edb46c', glyph:'∿', on:false, opacity:.9, note:'Six measured profiles. Color blends between neighboring channel-1 samples within each line. Breaks over 0.35 m stay open; no interpolation between survey lines.'},
  {id:'grid', name:'Magnetic surface', sub:'Processed R1 grid · 0.10 m', color:'#bc6757', glyph:'▦', on:false, opacity:.72, note:'Supplier-interpolated R1 anomaly grid, 284 × 141 cells. Full-area support is a processed estimate. Registration is approximate.'},
  {id:'thermal', name:'Thermal', sub:'Rendered orthomosaic', thumb:'../assets/thermal.jpg', on:false, opacity:.65, note:'Source: 3,554 × 1,464 pixels. False-color image, not calibrated temperature. Reprojected to the RGB coordinate system.'},
  {id:'rgb', name:'RGB orthomosaic', sub:'Native tiles · 9,052 × 4,460', thumb:'../assets/rgb.jpg', on:true, opacity:1, note:'Zoom to load original-resolution image tiles. Mosaic pixel spacing is approximately 3.1 mm; that is not a guarantee of optical resolving power.'}
];
const layer=id=>layers.find(l=>l.id===id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function invalidate(){dirty=true;}
function toast(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').style.display='none',4000);}
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('survey-theme',theme);$('theme').innerHTML=`◐ <span>${theme==='light'?'Dark':'Light'}</span>`;$('theme').setAttribute('aria-label',`Switch to ${theme==='light'?'dark':'light'} theme`);invalidate();}
setTheme(localStorage.getItem('survey-theme')||'light');
$('theme').onclick=()=>setTheme(document.documentElement.dataset.theme==='light'?'dark':'light');
function renderLayers(){
  $('layers').innerHTML=layers.map((l,i)=>`<div class="layer ${l.id===selectedLayer?'selected':''}" data-layer="${l.id}"><div class="layer-main">${l.thumb?`<img class="layer-thumbnail" src="${l.thumb}" alt="">`:`<span class="layer-glyph" style="--layer-color:${l.color}">${l.glyph}</span>`}<button class="layer-text" data-select="${l.id}" aria-expanded="${l.id===selectedLayer}"><b>${l.name}</b><small>${l.sub}</small></button><button class="eye" data-toggle="${l.id}" aria-label="Toggle ${l.name}" aria-pressed="${l.on}"><svg viewBox="0 0 24 24"><path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>${l.on?'':'<path d="M4 3 20 21"/>'}</svg></button></div>${l.id===selectedLayer?`<div class="layer-controls"><input aria-label="${l.name} opacity" data-opacity="${l.id}" type="range" min="0" max="100" value="${Math.round(l.opacity*100)}"><output>${Math.round(l.opacity*100)}%</output><button data-move="${l.id}" data-direction="-1" aria-label="Move ${l.name} up" ${i===0?'disabled':''}>↑</button><button data-move="${l.id}" data-direction="1" aria-label="Move ${l.name} down" ${i===layers.length-1?'disabled':''}>↓</button></div><div class="layer-note">${l.note}</div>`:''}</div>`).join('');
  $('visibleCount').textContent=`${layers.filter(l=>l.on).length} visible`;
  if(selectedLayer==='emi'){
    const controls=document.createElement('div');controls.className='emi-controls';
    controls.innerHTML=`<label>Line width <input id="emiWidth" type="range" min="2" max="14" value="${emiDisplay.width}" aria-label="EMI line width"><output>${emiDisplay.width} px</output></label><label><input id="emiSamples" type="checkbox" ${emiDisplay.samples?'checked':''}> Show sample positions</label><small>Width is a display setting, not measured coverage.</small>`;
    $('layers').querySelector('[data-layer="emi"] .layer-note').before(controls);
  }
  updateLegend();
}
$('layers').onclick=e=>{
  const toggle=e.target.closest('[data-toggle]'), select=e.target.closest('[data-select]'), move=e.target.closest('[data-move]');
  if(!toggle&&!select&&!move)return;
  if(toggle){const l=layer(toggle.dataset.toggle);l.on=!l.on;selectedLayer=l.id;}
  if(select)selectedLayer=select.dataset.select;
  if(move){const i=layers.findIndex(l=>l.id===move.dataset.move),j=i+Number(move.dataset.direction);if(j>=0&&j<layers.length)[layers[i],layers[j]]=[layers[j],layers[i]];}
  renderLayers();invalidate();
};
$('layers').oninput=e=>{if(e.target.id==='emiWidth'){emiDisplay.width=Number(e.target.value);e.target.nextElementSibling.textContent=e.target.value+' px';invalidate();}else if(e.target.id==='emiSamples'){emiDisplay.samples=e.target.checked;invalidate();}else if(e.target.dataset.opacity){layer(e.target.dataset.opacity).opacity=Number(e.target.value)/100;e.target.nextElementSibling.textContent=e.target.value+'%';invalidate();}};
function updateLegend(){
  const l=layers.find(l=>l.on&&l.id!=='rgb');
  $('layerLegend').innerHTML=!l?'<strong>RGB orthomosaic</strong>2024 survey · zoom for native detail':l.id==='grid'?`<strong>Magnetic anomaly · supplier grid</strong><div class="legend-ramp"></div><div class="legend-ends"><span>−${manifest?manifest.magnetic_grid.color_limit.toFixed(0):108} nT</span><span>0</span><span>+${manifest?manifest.magnetic_grid.color_limit.toFixed(0):108} nT</span></div><div style="margin-top:5px">Colors clipped at the 98th percentile</div>`:['emi','magdrone','magnimbus','fusion'].includes(l.id)?`<strong>${l.name}</strong><div class="legend-ramp" style="background:linear-gradient(90deg,#384d66,#40bbb1,#ffb865)"></div><div class="legend-ends"><span>Low relative response</span><span>High</span></div>`:`<strong>${l.name}</strong>${l.id==='thermal'?'Rendered false color · no temperature scale':l.id==='targets'?'Known reference positions · not detections':'Positive interpretation labels · no radar image'}`;
}
async function json(url){const r=await fetch(url);if(!r.ok)throw Error(`${url}: ${r.status}`);return r.json();}
function loadImage(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(`Could not load ${url}`));im.src=url;});}
function pixels(im){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;}
function fit(){state.scale=Math.min((width-80)/W,(height-90)/H);state.x=(width-W*state.scale)/2;state.y=(height-H*state.scale)/2;invalidate();}
function resize(){const r=$('stage').getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);surface.width=canvas.width;surface.height=canvas.height;fit();}
new ResizeObserver(resize).observe($('stage'));
function screen(x,y){return [state.x+x*state.scale,state.y+y*state.scale];}
function world(x,y){return [(x-state.x)/state.scale,(y-state.y)/state.scale];}
function zoom(factor,cx=width/2,cy=height/2){const p=world(cx,cy),min=Math.min((width-80)/W,(height-90)/H);state.scale=clamp(state.scale*factor,min*.75,8);state.x=cx-p[0]*state.scale;state.y=cy-p[1]*state.scale;invalidate();}
function tile(name,z,x,y){const key=`${name}/${z}/${x}_${y}`;if(!tiles.has(key)){const item={image:null};tiles.set(key,item);loadImage(`assets/${key}.webp`).then(im=>{item.image=im;invalidate();}).catch(()=>{item.failed=true;tileErrors++;invalidate();});}return tiles.get(key).image;}
function raster(name,alpha=1,mask=null,postMask=null){
  const cacheId=name+(mask?'masked':''),key=[width,height,dpr,state.scale,state.x,state.y,[...tiles.values()].filter(t=>t.image).length].join('|');
  const cached=rasterCache.get(cacheId);
  if(cached&&cached.key===key){paintRaster(cached.canvas,alpha,postMask);return;}
  const levels=manifest.layers[name].levels;
  let z=levels.findIndex(l=>l.width>=W*state.scale*dpr);if(z<0)z=levels.length-1;lods[name]=z;
  sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,surface.width,surface.height);sc.setTransform(dpr,0,0,dpr,0,0);
  for(const level of (z===0?[0]:[0,z])){
    const info=levels[level],tw=256/info.width*W,th=256/info.height*H;
    const a=world(0,0),b=world(width,height);
    const x0=clamp(Math.floor(a[0]/tw),0,Math.ceil(info.width/256)-1),x1=clamp(Math.floor(b[0]/tw),0,Math.ceil(info.width/256)-1);
    const y0=clamp(Math.floor(a[1]/th),0,Math.ceil(info.height/256)-1),y1=clamp(Math.floor(b[1]/th),0,Math.ceil(info.height/256)-1);
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
      const im=tile(name,level,x,y);if(!im)continue;
      const [sx,sy]=screen(x*tw,y*th),sw=im.width/info.width*W*state.scale,sh=im.height/info.height*H*state.scale;
      sc.clearRect(sx,sy,sw,sh);sc.drawImage(im,sx,sy,sw+.25,sh+.25);
    }
  }
  if(mask){sc.globalCompositeOperation='destination-in';sc.drawImage(mask,state.x,state.y,W*state.scale,H*state.scale);sc.globalCompositeOperation='source-over';}
  const cache=cached?.canvas||document.createElement('canvas');cache.width=surface.width;cache.height=surface.height;cache.getContext('2d').drawImage(surface,0,0);rasterCache.set(cacheId,{key,canvas:cache});
  paintRaster(surface,alpha,postMask);
}
function ramp(v){v=clamp(v,0,1);const a=v<.5?[56,77,102]:[64,187,177],b=v<.5?[64,187,177]:[255,184,101],t=v<.5?v*2:(v-.5)*2;return `rgb(${a.map((c,i)=>Math.round(c+(b[i]-c)*t)).join(',')})`;}
function excluded(x,y){return refs.markers.some(p=>Math.hypot((x-p.x)*meta.rgb_pixel_size[0],(y-p.y)*meta.rgb_pixel_size[1])<=refs.exclusion_radius_m);}
function fusedAt(p){const x=Math.round(p[0]),y=Math.round(p[1]);if(x<0||y<0||x>=W||y>=H||excluded(x,y))return null;const i=(y*W+x)*4;if(valid[i]<128)return null;return Math.cbrt(scores[i]/255*scores[i+1]/255*p[2]);}
function drawPoints(id){
  for(const p of measurements[id==='fusion'?'emi':id]){
    const v=id==='fusion'?p.fusion:p[2];if(v===null)continue;
    const [x,y]=screen(p[0],p[1]);if(x<0||y<0||x>width||y>height)continue;
    ctx.fillStyle=ramp(v);ctx.beginPath();ctx.arc(x,y,id==='fusion'?2.5:1.6,0,Math.PI*2);ctx.fill();
  }
}
function buildEmiSegments(points,pixelSize){
  // Preserve acquisition order within each named profile. Never connect profiles,
  // nor bridge steps exceeding 0.35 m (observed source steps are <= 0.27 m).
  const result=[];let previous=null;
  for(const p of points){
    if(previous&&p[4]===previous[4]){
      const distance=Math.hypot((p[0]-previous[0])*pixelSize[0],(p[1]-previous[1])*pixelSize[1]);
      if(distance>0&&distance<=.35)result.push([previous,p]);
    }
    previous=p;
  }
  return result;
}
function drawEmi(){
  const key=[width,height,dpr,state.scale,state.x,state.y,emiDisplay.width,emiDisplay.samples,!!window.adaptiveView?.enabled].join('|');
  if(key===emiCacheKey){ctx.drawImage(emiCache,0,0,width,height);return;}
  // Compose at full alpha, then apply layer opacity once to avoid dark joints.
  sc.setTransform(1,0,0,1,0,0);sc.clearRect(0,0,surface.width,surface.height);sc.setTransform(dpr,0,0,dpr,0,0);
  sc.lineWidth=emiDisplay.width;sc.lineCap='round';sc.lineJoin='round';
  for(const [a,b] of emiSegments){
    sc.lineWidth=emiDisplay.width*(window.adaptiveView?.enabled ? 1+.5*(a[2]+b[2])/2 : 1);
    const [ax,ay]=screen(a[0],a[1]),[bx,by]=screen(b[0],b[1]);
    if(Math.max(ax,bx)<-14||Math.min(ax,bx)>width+14||Math.max(ay,by)<-14||Math.min(ay,by)>height+14)continue;
    const gradient=sc.createLinearGradient(ax,ay,bx,by);gradient.addColorStop(0,ramp(a[2]));gradient.addColorStop(1,ramp(b[2]));
    sc.strokeStyle=gradient;sc.beginPath();sc.moveTo(ax,ay);sc.lineTo(bx,by);sc.stroke();
  }
  // Small caps retain isolated samples if a source gap splits a profile.
  for(const p of measurements.emi){const [x,y]=screen(p[0],p[1]);sc.beginPath();sc.arc(x,y,emiDisplay.samples?2:Math.min(1.6,emiDisplay.width/2),0,Math.PI*2);sc.fillStyle=emiDisplay.samples?'#fff':ramp(p[2]);sc.fill();if(emiDisplay.samples){sc.strokeStyle='#263442';sc.lineWidth=.8;sc.stroke();}}
  emiCache.width=surface.width;emiCache.height=surface.height;emiCache.getContext('2d').drawImage(surface,0,0);emiCacheKey=key;
  ctx.drawImage(emiCache,0,0,width,height);
}
function drawReferences(id){
  for(const p of targets){if(id==='gpr'&&p.gpr!==1)continue;const [x,y]=screen(p.x,p.y);if(x<0||y<0||x>width||y>height)continue;ctx.beginPath();ctx.arc(x,y,id==='gpr'?6:4,0,Math.PI*2);ctx.fillStyle='#10232d66';ctx.fill();ctx.strokeStyle=id==='gpr'?'#dab8ff':p.name?'#a9efdf':'#c1c9c9';ctx.lineWidth=1.5;ctx.stroke();if(state.scale>1.1){ctx.font='10px Segoe UI';ctx.fillStyle='#fff';ctx.shadowColor='#15202b';ctx.shadowBlur=3;ctx.fillText(p.id,x+8,y+3);ctx.shadowBlur=0;}}
}
// Path lengths include turns; turns move the aircraft without inventing a new swath.
function scanAt(progress){
  if(progress*duration>=28-1e-9)return {row:7,f:1,x:0,y:7.5*H/8,turn:false};
  const rh=H/rows,turnLength=Math.PI*rh/2,total=W*rows+turnLength*(rows-1);let remaining=clamp(progress*duration/28,0,1)*total;
  for(let row=0;row<rows;row++){
    if(remaining<=W||row===rows-1){const f=clamp(remaining/W,0,1);return {row,f,x:row%2?W*(1-f):W*f,y:(row+.5)*rh,turn:false};}
    remaining-=W;
    if(remaining<turnLength){const t=remaining/turnLength,edge=row%2?0:W;return {row,f:1,x:edge+(row%2?-1:1)*Math.sin(Math.PI*t)*rh/2,y:(row+.5)*rh+(1-Math.cos(Math.PI*t))*rh/2,angle:row%2?Math.PI-Math.PI*t:Math.PI*t,turn:true};}
    remaining-=turnLength;
  }
}
function acquired(x,y){if(state.mode==='map'||state.progress===1)return true;const s=scanAt(state.progress),r=Math.floor(y/(H/rows));return r<s.row||(r===s.row&&(s.row%2?x>=W*(1-s.f):x<=W*s.f));}
function acquisitionClip(){
  const s=scanAt(state.progress),rh=H/rows;ctx.beginPath();ctx.rect(state.x,state.y,W*state.scale,s.row*rh*state.scale);
  const left=s.row%2?W*(1-s.f):0;ctx.rect(state.x+left*state.scale,state.y+s.row*rh*state.scale,W*s.f*state.scale,rh*state.scale);ctx.clip();
}
function drawDrone(s){
  const [x,y]=screen(s.x,s.y),angle=s.turn?s.angle:s.row%2?Math.PI:0;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowColor='#10202a66';ctx.shadowBlur=9;
  ctx.fillStyle='#fff';ctx.strokeStyle='#294754';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(5,5);ctx.moveTo(-5,5);ctx.lineTo(5,-5);ctx.stroke();
  for(const a of [-6,6])for(const b of [-6,6]){ctx.beginPath();ctx.arc(a,b,2.6,0,Math.PI*2);ctx.stroke();}
  ctx.fillStyle='#287580';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(12,-3);ctx.lineTo(12,3);ctx.fill();ctx.restore();
}
function render(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const dark=document.documentElement.dataset.theme==='dark';ctx.fillStyle=dark?'#12171d':'#e9edef';ctx.fillRect(0,0,width,height);
  if(!state.ready)return;
  // Very faint prior context is not treated as acquired data.
  if(state.mode==='replay'&&state.progress<1&&layer('rgb').on)raster('rgb',.055);
  ctx.save();ctx.beginPath();ctx.rect(state.x,state.y,W*state.scale,H*state.scale);ctx.clip();
  if(state.mode==='replay')acquisitionClip();
  if(window.adaptiveView?.enabled)window.adaptiveView.drawBase();
  for(const l of [...layers].reverse()){
    if(window.adaptiveView?.enabled&&['rgb','thermal'].includes(l.id))continue;
    if(!l.on||l.opacity===0)continue;ctx.save();ctx.globalAlpha=l.opacity;
    if(l.id==='rgb'||l.id==='thermal')raster(l.id);
    else if(l.id==='grid'){ctx.imageSmoothingEnabled=true;ctx.drawImage(gridImage,state.x,state.y,W*state.scale,H*state.scale);}
    else if(l.id==='targets'||l.id==='gpr')drawReferences(l.id);
    else if(l.id==='emi')drawEmi();
    else if(['magdrone','magnimbus'].includes(l.id)&&window.magneticDisplay)window.magneticDisplay.draw(l.id);
    else drawPoints(l.id);ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle=dark?'#49545c':'#b7c3c9';ctx.lineWidth=.8;ctx.strokeRect(state.x,state.y,W*state.scale,H*state.scale);
  if(state.mode==='replay'){
    const s=scanAt(state.progress),rh=H/rows,tw=W/columns;
    // Tile seams are visible only around the advancing assembly front.
    if(state.progress<28/duration){
      ctx.save();ctx.beginPath();ctx.rect(state.x,state.y,W*state.scale,H*state.scale);ctx.clip();
      ctx.strokeStyle=dark?'#81939d22':'#66808e25';ctx.lineWidth=.6;
      for(let r=s.row;r<=rows;r++){const [,y]=screen(0,r*rh);ctx.beginPath();ctx.moveTo(state.x,y);ctx.lineTo(state.x+W*state.scale,y);ctx.stroke();}
      for(let c=0;c<=columns;c++){const [x,y]=screen(c*tw,s.row*rh);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,state.y+H*state.scale);ctx.stroke();}
      const [fx,fy]=screen(s.x,s.row*rh);ctx.strokeStyle='#85cbd2';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx,fy+rh*state.scale);ctx.stroke();ctx.restore();
      drawDrone(s);
    }
    ctx.font='10px Segoe UI';ctx.fillStyle=dark?'#84939e':'#6d7e89';ctx.fillText('Simulated acquisition & processing',18,height-12);
    if(state.recording&&!window.cleanPresentation){ctx.fillText(`SITE 02  /  PASS ${String(s.row+1).padStart(2,'0')} OF 08`,18,24);ctx.fillText(layers.filter(l=>l.on).reverse().map(l=>l.name).join('  +  '),18,41);}
  }
  if(state.selected&&acquired(...state.selected)){const [x,y]=screen(...state.selected);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#253b45';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.stroke();}
  // A physical scale bar stays stable through playback and changes only with manual zoom.
  const meters=state.scale>1?1:5,bar=meters/meta.rgb_pixel_size[0]*state.scale;
  ctx.strokeStyle=dark?'#b4c1ca':'#5c6d77';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(width-22-bar,height-25);ctx.lineTo(width-22,height-25);ctx.stroke();ctx.font='10px Segoe UI';ctx.textAlign='right';ctx.fillText(`${meters} m`,width-22,height-31);ctx.textAlign='left';
  if(window.adaptiveView?.ready)window.adaptiveView.drawAnnotations();
  $('viewScale').textContent=`WGS 84 / UTM 14N · ${(meta.rgb_pixel_size[0]/state.scale*100).toFixed(1)} cm / screen px`;
  $('renderStatus').textContent=tileErrors?`${tileErrors} tiles unavailable`:`${layer('rgb').on?`RGB ${manifest.layers.rgb.levels[lods.rgb||0].width.toLocaleString()} px level`:'Spatially aligned layers'}`;
}
function updatePlayback(){
  const s=scanAt(state.progress);$('scrub').value=Math.round(state.progress*1000);$('elapsed').textContent='00:'+String(Math.floor(state.progress*duration)).padStart(2,'0');
  $('assemblyCount').textContent=`${Math.floor((s.row+s.f)*columns)} / 128 illustration tiles`;
  $('playTitle').textContent=state.progress===1?'Survey assembled':state.playing?'Assembling survey':state.progress?'Survey paused':'Ready to survey';
  $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause survey':'Start survey');
  $('replayBadge').querySelector('span').textContent=state.progress===1?'Survey complete':`Pass ${String(s.row+1).padStart(2,'0')} / 08${s.turn?' · turning':''}`;
}
function setMode(mode){if(state.recording)return;state.mode=mode;state.playing=false;$('playback').hidden=mode!=='replay';$('replayBadge').hidden=mode!=='replay';$('exploreMode').classList.toggle('active',mode==='map');$('replayMode').classList.toggle('active',mode==='replay');updatePlayback();invalidate();}
$('exploreMode').onclick=()=>setMode('map');$('replayMode').onclick=()=>{setMode('replay');fit();};
$('play').onclick=()=>{if(state.progress>=1)state.progress=0;state.playing=!state.playing;updatePlayback();invalidate();};
$('restart').onclick=()=>{state.progress=0;state.playing=false;updatePlayback();invalidate();};
$('scrub').oninput=e=>{state.progress=Number(e.target.value)/1000;updatePlayback();invalidate();};
$('speed').onchange=e=>state.speed=Number(e.target.value);
$('fit').onclick=fit;$('zoomIn').onclick=()=>zoom(1.4);$('zoomOut').onclick=()=>zoom(1/1.4);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.layout').requestFullscreen();}catch(e){toast('Fullscreen is unavailable in this browser.');}};
canvas.addEventListener('wheel',e=>{e.preventDefault();if(state.recording)return;const r=canvas.getBoundingClientRect();zoom(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top);},{passive:false});
let drag=null;
canvas.onpointerdown=e=>{if(!state.ready||state.recording)return;drag={x:e.clientX,y:e.clientY,sx:state.x,sy:state.y,moved:false};canvas.setPointerCapture(e.pointerId);};
canvas.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>3)drag.moved=true;if(drag.moved){state.x=drag.sx+dx;state.y=drag.sy+dy;invalidate();}};
canvas.onpointerup=e=>{if(!drag)return;if(!drag.moved){const r=canvas.getBoundingClientRect(),[x,y]=world(e.clientX-r.left,e.clientY-r.top);inspect(x,y);}drag=null;};
canvas.onpointercancel=()=>drag=null;
function nearest(id,x,y){let best=null;for(const p of measurements[id]){const d=Math.hypot((x-p[0])*meta.rgb_pixel_size[0],(y-p[1])*meta.rgb_pixel_size[1]);if(!best||d<best.d)best={p,d};}return best&&best.d<=.15?best:null;}
function inspect(x,y){
  if(x<0||y<0||x>=W||y>=H)return;if(!acquired(x,y)){toast('This part of the field has not been revealed yet.');return;}
  const reference=targets.find(p=>Math.hypot((p.x-x)*state.scale,(p.y-y)*state.scale)<10&&((layer('targets').on)||(layer('gpr').on&&p.gpr===1)));
  if(reference){x=reference.x;y=reference.y;}
  state.selected=[x,y];const east=meta.rgb_origin[0]+(x+.5)*meta.rgb_pixel_size[0],north=meta.rgb_origin[1]-(y+.5)*meta.rgb_pixel_size[1];
  $('selectedTitle').textContent=reference?`${reference.id} · ${reference.name||'Blank reference'}`:'Selected location';$('coordinates').textContent=`${east.toFixed(2)} E / ${north.toFixed(2)} N`;
  const gx=Math.round((east-grid.x0)/grid.dx),gy=Math.round((north-grid.y0)/grid.dy),gv=gx>=0&&gx<grid.width&&gy>=0&&gy<grid.height?grid.values[gy*grid.width+gx]:null;
  const e=nearest('emi',x,y),r=nearest('magdrone',x,y),n=nearest('magnimbus',x,y),f=e&&!excluded(x,y)?fusedAt([x,y,e.p[2]]):null;
  const item=(name,value,note)=>`<div class="reading"><span>${name}</span><b>${value}</b><small>${note}</small></div>`;
  $('readings').innerHTML=item('EMI channel 1',e?e.p[3].toFixed(1):'—',e?`${e.d.toFixed(2)} m to sample · source units`:'No sample within 0.15 m')+item('MagDrone R1',r?r.p[3].toFixed(1)+' nT':'—',r?`${r.d.toFixed(2)} m to display bin`:'No sample within 0.15 m')+item('MagNIMBUS',n?n.p[3].toFixed(1)+' nT':'—',n?`${n.d.toFixed(2)} m to display bin`:'No sample within 0.15 m')+item('Processed anomaly',gv===null?'—':gv.toFixed(1)+' nT','Nearest 0.10 m grid node · interpolated')+item('Combined contrast',f===null?'—':f.toFixed(2),excluded(x,y)?'Survey-pad exclusion':'RGB × thermal × EMI · cube root')+(reference?item('Reference label',escapeHTML(reference.kind||'Unspecified'),`Listed depth ${escapeHTML(reference.depth===''?'—':reference.depth)} cm · GPR flag ${reference.gpr===null?'—':reference.gpr}`):'');invalidate();
}
$('clearSelection').onclick=()=>{state.selected=null;$('selectedTitle').textContent='Select a location';$('coordinates').textContent='Click the map to compare nearby readings.';$('readings').innerHTML='<p>Raster values and point measurements have different spatial support. Unmeasured locations stay empty.</p>';invalidate();};
function info(open=true){
  $('infoContent').innerHTML=`<p class="info-copy">These are <b>independent surveys of the same seeded test field</b>, brought into a common coordinate system. Registration has not been independently validated. Layer overlap is useful for exploration; it is not a validated detector.</p><table class="info-table"><thead><tr><th>Source</th><th>Available resolution / coverage</th></tr></thead><tbody><tr><td>RGB</td><td>9,052 × 4,460 source pixels. Native-resolution tiles now load on zoom; the previous preview was 2,000 px wide.</td></tr><tr><td>Thermal</td><td>3,554 × 1,464 source pixels. Reprojected false-color mosaic, not radiometric temperature. Image pixel spacing is not optical resolution.</td></tr><tr><td>EMI / metal response</td><td>Positioned line samples, not an area raster. Thin coverage reflects the sampling pattern.</td></tr><tr><td>Raw magnetometers</td><td>Positioned tracks. This browser uses aggregated display bins; original raw readings are retained locally.</td></tr><tr><td>Processed MagDrone R1</td><td>284 × 141 anomaly grid, 0.10 m cells, ${manifest.magnetic_grid.valid_cells.toLocaleString()} valid cells. Supplier interpolation creates area coverage, not additional measurements.</td></tr><tr><td>GPR</td><td>18 positive AIU1 interpretation labels at reference positions. No raw radargrams or depth-slice rasters found in the downloaded public release.</td></tr></tbody></table><p class="info-copy"><b>Why gaps?</b> EMI and magnetic sensors sample along paths. A rendered dot or strip shows measured support. A processed grid estimates values between paths and retains its source no-data mask. A finer grid cell does not imply a sharper sensor.</p><p class="info-copy"><b>What is being fused?</b> Layers share spatial coordinates. The optional combined-contrast layer takes the geometric mean of normalized RGB, thermal and EMI contrasts only where all three are supported. Reference labels never enter that score. Visible checkerboard survey pads are excluded from the contrast score; they are mapping targets, not mines.</p><p class="info-copy"><b>Replay:</b> an illustrative eight-pass raster route revealing existing orthomosaics and sensor layers. The 128 display tiles are a visual device, not original flight frames. Surveys were collected separately; this is not a synchronized live acquisition or a reconstruction of the actual flight.</p><p class="info-copy"><b>References:</b> 150 published grid locations include inert mine-shaped objects, other test objects, clutter, controls and blanks. This is a shared research field, which is why multiple groups publish different sensor surveys of it.</p><p class="info-copy"><a href="https://www.sphengineering.com/news/uxo-detection-total-field-vs-fluxgate-magnetometer" target="_blank" rel="noopener">SPH Engineering: raw and processed magnetic surveys</a> · <a href="/demo/" target="_top">All demos</a></p>`;
  if(open)$('info').showModal();
}
$('dataInfo').onclick=info;$('closeInfo').onclick=()=>$('info').close();
let recorder=null, recordStream=null, stopAt=null;
$('record').onclick=async()=>{
  if(state.recording){recorder.stop();return;}
  if(!window.MediaRecorder||!canvas.captureStream){toast('This browser does not support canvas recording.');return;}
  const mime=['video/webm;codecs=vp8','video/webm;codecs=vp9','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime){toast('WebM recording is unavailable.');return;}
  try{
    fit();state.progress=0;state.speed=1;state.playing=true;state.recording=true;stopAt=null;recordStream=canvas.captureStream(30);recorder=new MediaRecorder(recordStream,{mimeType:mime,videoBitsPerSecond:5000000});const chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{const blob=new Blob(chunks,{type:mime});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=window.adaptiveView?.enabled?'site2-adaptive-fusion.webm':'site2-survey-assembly.webm';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);recordStream.getTracks().forEach(t=>t.stop());state.recording=false;state.playing=false;document.body.classList.remove('recording');$('record').textContent='Record';for(const id of ['scrub','speed','restart','play','exploreMode','replayMode','fit','zoomIn','zoomOut','fullscreen'])$(id).disabled=false;updatePlayback();toast('Recording saved.');};
    recorder.start();document.body.classList.add('recording');$('record').textContent='Stop & save';for(const id of ['scrub','speed','restart','play','exploreMode','replayMode','fit','zoomIn','zoomOut','fullscreen'])$(id).disabled=true;$('speed').value='1';updatePlayback();invalidate();
  }catch(e){state.recording=false;state.playing=false;if(recordStream)recordStream.getTracks().forEach(t=>t.stop());toast('Recording could not start: '+e.message);}
};
function frame(time){
  const dt=Math.min((time-lastTime)/1000,.1);lastTime=time;
  if(state.ready&&state.playing){state.progress=clamp(state.progress+dt*state.speed/duration,0,1);if(state.progress===1){state.playing=false;if(state.recording)stopAt=time+900;}updatePlayback();dirty=true;}
  if(state.recording&&stopAt&&time>=stopAt){stopAt=null;if(recorder.state==='recording')recorder.stop();}
  if(dirty||state.recording){render();dirty=false;}requestAnimationFrame(frame);
}
renderLayers();requestAnimationFrame(frame);
Promise.all([
  json('../assets/metadata.json'),json('assets/manifest.json'),json('assets/magnetic-grid.json'),json('assets/targets-projected.json'),json('../assets/references.json'),
  Promise.all(['emi','magnimbus','magdrone'].map(n=>json(`../assets/${n}_points.json`))),
  loadImage('../assets/scores.png'),loadImage('../assets/valid.png'),loadImage('assets/magnetic-grid.png')
]).then(async data=>{
  [meta,manifest,grid,targets,refs]=data;measurements=Object.fromEntries(['emi','magnimbus','magdrone'].map((n,i)=>[n,data[5][i]]));scores=pixels(data[6]);valid=pixels(data[7]);gridImage=data[8];
  for(const p of measurements.emi)p.fusion=fusedAt(p);
  emiSegments=buildEmiSegments(measurements.emi,meta.rgb_pixel_size);
  // Preload overview tiles, so a new replay never starts with missing imagery.
  await Promise.all(['rgb','thermal'].flatMap(name=>{const l=manifest.layers[name].levels[0],jobs=[];for(let y=0;y<Math.ceil(l.height/256);y++)for(let x=0;x<Math.ceil(l.width/256);x++){const key=`${name}/0/${x}_${y}`;jobs.push(loadImage(`assets/${key}.webp`).then(im=>tiles.set(key,{image:im})));}return jobs;}));
  state.ready=true;$('loading').hidden=true;updateLegend();fit();
}).catch(e=>{$('loading').textContent='Survey data could not load. '+e.message;console.error(e);});
