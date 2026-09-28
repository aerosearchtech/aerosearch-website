/* Dense magnetic display bounded by measured support. Values remain unchanged. */
'use strict';
const magneticDisplay=window.magneticDisplay={ready:false,layers:{},report:null};
for(const id of ['magdrone','magnimbus'])magneticDisplay.layers[id]={surface:true,tracks:false,width:5,image:null,edges:[],cache:document.createElement('canvas'),key:''};
const magneticBaseLayers=renderLayers;
renderLayers=function(){magneticBaseLayers();if(!['magdrone','magnimbus'].includes(selectedLayer))return;const id=selectedLayer,settings=magneticDisplay.layers[id],entry=$('layers').querySelector(`[data-layer="${id}"]`),controls=document.createElement('div');controls.className='emi-controls';
  controls.innerHTML=`<label><input type="checkbox" data-magnetic="surface" data-sensor="${id}" ${settings.surface?'checked':''}> Fill surveyed coverage</label><label><input type="checkbox" data-magnetic="tracks" data-sensor="${id}" ${settings.tracks?'checked':''}> Show measured tracks</label><label>Track width <input type="range" min="2" max="14" value="${settings.width}" data-magnetic="width" data-sensor="${id}" aria-label="${layer(id).name} track width"><output>${settings.width} px</output></label><small>Surface interpolates nearby readings; unsupported areas stay transparent.</small>`;
  entry.querySelector('.layer-note').before(controls);
};
$('layers').addEventListener('input',e=>{const key=e.target.dataset.magnetic,id=e.target.dataset.sensor;if(!key)return;magneticDisplay.layers[id][key]=key==='width'?Number(e.target.value):e.target.checked;if(key==='width')e.target.nextElementSibling.textContent=e.target.value+' px';updateLegend();invalidate();});
const magneticBaseLegend=updateLegend;
updateLegend=function(){magneticBaseLegend();const top=layers.find(l=>l.on&&l.id!=='rgb');if(top&&magneticDisplay.layers[top.id]){const s=magneticDisplay.layers[top.id],note=document.createElement('div');note.style.marginTop='5px';note.textContent=s.surface?'Interpolated display · coverage mask retained':'Measured tracks · no area interpolation';$('layerLegend').append(note);}};
magneticDisplay.draw=function(id){
  if(!magneticDisplay.ready)return;const s=magneticDisplay.layers[id];
  if(s.surface)ctx.drawImage(s.image,state.x,state.y,W*state.scale,H*state.scale);
  if(!s.tracks)return;
  const key=[width,height,dpr,state.x,state.y,state.scale,s.width].join('|');
  if(key!==s.key){s.cache.width=canvas.width;s.cache.height=canvas.height;const g=s.cache.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.lineWidth=s.width;g.lineCap='round';
    for(const [ai,bi] of s.edges){const a=measurements[id][ai],b=measurements[id][bi],[x,y]=screen(a[0],a[1]),[xx,yy]=screen(b[0],b[1]);const grad=g.createLinearGradient(x,y,xx,yy);grad.addColorStop(0,ramp(a[2]));grad.addColorStop(1,ramp(b[2]));g.strokeStyle=grad;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
    // Round caps also retain isolated observations separated by genuine breaks.
    for(const p of measurements[id]){const [x,y]=screen(p[0],p[1]);g.fillStyle=ramp(p[2]);g.beginPath();g.arc(x,y,s.width/2,0,Math.PI*2);g.fill();}s.key=key;
  }
  ctx.drawImage(s.cache,0,0,width,height);
};
for(const id of ['magdrone','magnimbus']){
  layer(id).sub='Interpolated response · measured tracks';
  layer(id).note='Continuous display surface from nearby measured responses. No extrapolation outside the sample hull; gaps beyond 0.75 m from a reading or across triangles wider than 1.5 m remain empty. Inspector reports original nearby readings.';
  sources[id].process+=' Display update: the default surface linearly interpolates normalized response within the sample hull, with a 0.75 m nearest-sample limit and 1.5 m maximum triangle edge. This is our display interpolation, distinct from the supplier’s processed R1 anomaly grid. Optional tracks connect source observations in time order, retaining spatial/time gaps.';
  sources[id].date='Raw CSV timestamps: May 9, 2024; publisher catalog lists May 12, 2024';
}
Promise.all([json('assets/magnetic-surfaces.json'),...['magdrone','magnimbus'].map(async id=>{const [image,tracks]=await Promise.all([loadImage(`assets/${id}_surface.png`),json(`assets/${id}_tracks.json`)]);magneticDisplay.layers[id].image=image;magneticDisplay.layers[id].edges=tracks.edges;})]).then(([report])=>{magneticDisplay.report=report;magneticDisplay.ready=true;renderLayers();invalidate();}).catch(e=>{toast('Magnetic surface could not load.');console.error(e);});
renderLayers();
