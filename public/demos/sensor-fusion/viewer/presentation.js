/* Minimal presentation and explicit simulated fusion latency. */
'use strict';
window.cleanPresentation=true;
const processing={delay:1.8,fade:1.2,flight:28};
const temporalCanvas=document.createElement('canvas'),temporalContext=temporalCanvas.getContext('2d');
function paintRaster(image,alpha,postMask){
  let source=image;
  if(postMask){
    if(temporalCanvas.width!==canvas.width||temporalCanvas.height!==canvas.height){temporalCanvas.width=canvas.width;temporalCanvas.height=canvas.height;}
    const g=temporalContext;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);g.drawImage(image,0,0);g.setTransform(dpr,0,0,dpr,0,0);g.globalCompositeOperation='destination-in';g.imageSmoothingEnabled=false;g.drawImage(postMask,state.x,state.y,W*state.scale,H*state.scale);g.globalCompositeOperation='source-over';source=temporalCanvas;
  }
  ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(source,0,0,width,height);ctx.restore();
}
const delayMask=document.createElement('canvas');delayMask.width=256;delayMask.height=128;
const delayContext=delayMask.getContext('2d'),delayPixels=delayContext.createImageData(256,128);
function arrivalTime(x,y){const row=clamp(Math.floor(y/H*8),0,7),turn=Math.PI*(H/8)/2,total=W*8+turn*7;return (row*(W+turn)+(row%2?W-x:x))/total*processing.flight;}
function fusionPhase(x,y,time=state.progress*duration){const t=clamp((time-arrivalTime(x,y)-processing.delay)/processing.fade,0,1);return t*t*(3-2*t);}
function updateDelayMask(){for(let y=0;y<128;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;delayPixels.data[i]=delayPixels.data[i+1]=delayPixels.data[i+2]=255;delayPixels.data[i+3]=Math.round(255*fusionPhase((x+.5)/256*W,(y+.5)/128*H));}delayContext.putImageData(delayPixels,0,0);}
adaptiveView.drawBase=function(){const rgb=layer('rgb').on,thermal=layer('thermal').on;if(rgb)raster('rgb');if(thermal){const delayed=state.mode==='replay'&&rgb;if(delayed)updateDelayMask();raster('thermal',1,rgb?adaptiveView.mask:null,delayed?delayMask:null);}};
function processingTile(){const t=Math.max(0,state.progress*duration-processing.delay-processing.fade/2),s=scanAt(t/duration);return tileAt(clamp(s.x,0,W-1),clamp(s.turn?(s.row+.5)*H/8:s.y,0,H-1));}
function displayedThermal(tile){if(!layer('thermal').on)return 0;if(!layer('rgb').on)return 1;if(state.mode!=='replay')return tile.thermal;let total=0;for(let j=0;j<8;j++)for(let i=0;i<16;i++){const x=(tile.col+(i+.5)/16)*W/16,y=(tile.row+(j+.5)/8)*H/8,index=(Math.floor(y)*W+Math.floor(x))*4;total+=adaptiveView.maskPixels[index+3]/255*fusionPhase(x,y);}return total/128;}
const detailedAnnotations=adaptiveView.drawAnnotations;
adaptiveView.drawAnnotations=function(){
  // Keep optional alignment diagnostics, without the verbose default HUD.
  if(adaptiveView.alignment){const enabled=adaptiveView.enabled;adaptiveView.enabled=false;detailedAnnotations();adaptiveView.enabled=enabled;}
  if(!adaptiveView.enabled)return;
  const tile=state.mode==='replay'?processingTile():activeTile(),thermal=displayedThermal(tile),time=state.progress*duration;
  const label=state.mode!=='replay'?'Adaptive':time<processing.delay?'RGB capture':time>=processing.flight+processing.delay+processing.fade?'Fused':'Fusing';
  const boxWidth=234,x=Math.max(14,width-boxWidth-58),y=16;ctx.save();ctx.fillStyle='#17232ded';ctx.beginPath();ctx.roundRect(x,y,boxWidth,56,7);ctx.fill();ctx.font='11px Segoe UI';ctx.fillStyle='#91d0cc';ctx.fillText(label,x+12,y+19);ctx.fillStyle='#dce7ed';ctx.fillText(`RGB ${Math.round((1-thermal)*100)}%  /  Thermal ${Math.round(thermal*100)}%`,x+12,y+40);
  if(state.mode==='replay'&&time>processing.delay&&state.progress<1){ctx.beginPath();acquisitionClip();const [xx,yy]=screen(tile.col*W/16,tile.row*H/8);ctx.strokeStyle='#dceceba0';ctx.lineWidth=1;ctx.strokeRect(xx,yy,W/16*state.scale,H/8*state.scale);}
  ctx.restore();
};
document.body.classList.add('clean-ui');
$('selectedTitle').textContent='Inspect';$('mapHint').textContent='Drag · zoom · inspect';
$('dataInfo').firstChild.textContent='Options ';
document.querySelector('.sidebar-title p').textContent='Pawnee · Site 02';
document.querySelector('.sidebar-title h1').textContent='AeroSurvey';
$('fixedView').textContent='Fixed';$('adaptiveView').textContent='Adaptive';
$('alignmentAudit').textContent='Alignment';
$('replayMode').textContent='Replay';
$('replayBadge').querySelector('small').textContent='Simulated';
const others=document.createElement('button');others.id='otherSensors';others.className='other-sensors';others.textContent='Other layers';others.setAttribute('aria-expanded','false');$('layers').before(others);
others.onclick=()=>{const show=document.body.classList.toggle('show-other-layers');others.setAttribute('aria-expanded',String(show));others.textContent=show?'Hide other layers':'Other layers';};
const compactLayers=renderLayers;renderLayers=function(){compactLayers();document.querySelectorAll('.source-button').forEach(b=>b.textContent='Details');};renderLayers();
const inspectBase=inspect;inspect=function(x,y){inspectBase(x,y);$('selection').classList.toggle('has-selection',!!state.selected);};
const clearBase=$('clearSelection').onclick;$('clearSelection').onclick=()=>{clearBase();$('selection').classList.remove('has-selection');};
const replayBase=$('replayMode').onclick;
$('replayMode').onclick=()=>{if(!state.ready||!adaptiveView.ready)return;for(const l of layers)l.on=['rgb','thermal'].includes(l.id);setAdaptive(true);adaptiveView.showTiles=false;adaptiveView.alignment=false;selectedLayer='thermal';$('clearSelection').click();replayBase();renderLayers();invalidate();};
const playbackBase=updatePlayback;updatePlayback=function(){playbackBase();$('assemblyCount').textContent='RGB → thermal blend';if(state.progress*duration>=processing.flight&&state.progress<1){$('playTitle').textContent='Finishing fusion';$('replayBadge').querySelector('span').textContent='Processing';}};
// Start in the concise optical view; retain all other layers behind one control.
const selectOptical=setInterval(()=>{if(!state.ready||!adaptiveView.ready)return;clearInterval(selectOptical);selectedLayer='rgb';renderLayers();},50);

$('alignmentAudit').remove();
const recordBase=$('record').onclick;$('record').onclick=()=>{if(!state.recording){for(const l of layers)l.on=['rgb','thermal'].includes(l.id);setAdaptive(true);adaptiveView.alignment=false;renderLayers();}recordBase();};

// One options popup, with data and alignment in separate tabs.
const optionsDialog=$('info');
optionsDialog.setAttribute('aria-labelledby','optionsTitle');
optionsDialog.querySelector('h2').id='optionsTitle';
optionsDialog.querySelector('h2').textContent='Options';
$('closeInfo').setAttribute('aria-label','Close options');
const optionsTabs=document.createElement('div');
optionsTabs.className='options-tabs';optionsTabs.setAttribute('role','tablist');optionsTabs.setAttribute('aria-label','Options');
optionsTabs.innerHTML='<button id="dataTab" role="tab" aria-controls="infoContent" aria-selected="true">About the data</button><button id="alignmentTab" role="tab" aria-controls="infoContent" aria-selected="false" tabindex="-1">Alignment</button>';
$('infoContent').before(optionsTabs);
$('infoContent').setAttribute('role','tabpanel');$('infoContent').tabIndex=0;
function selectOptionsTab(id){
  for(const tab of optionsTabs.children){const active=tab.id===id;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
  $('infoContent').setAttribute('aria-labelledby',id);
  if(id==='dataTab')info(false);else{$('infoContent').innerHTML=alignmentContent();bindAlignment(optionsDialog);}
  optionsDialog.scrollTop=0;
}
for(const tab of optionsTabs.children){tab.onclick=()=>selectOptionsTab(tab.id);tab.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const id=e.key==='Home'?'dataTab':e.key==='End'?'alignmentTab':tab.id==='dataTab'?'alignmentTab':'dataTab';selectOptionsTab(id);$(id).focus();};}
$('dataInfo').onclick=()=>{selectOptionsTab('dataTab');optionsDialog.showModal();};

$('siteSelect').onchange=()=>{const site=$('siteSelect');if(site.value!=='drc')toast(site.selectedOptions[0].textContent+' preview - displaying DRC data.');};
