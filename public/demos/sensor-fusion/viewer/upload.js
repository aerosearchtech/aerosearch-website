/* Local, already-aligned RGB/thermal pairs. No survey coordinates are inferred. */
(() => {
  const button=document.createElement('button');button.textContent='Upload pair';button.id='uploadPair';
  document.querySelector('.sidebar-bottom').prepend(button);
  const dialog=document.createElement('dialog');dialog.className='upload-dialog';dialog.setAttribute('aria-labelledby','uploadTitle');
  dialog.innerHTML=`<div class="dialog-heading"><h2 id="uploadTitle">Fuse an image pair</h2><button aria-label="Close upload">×</button></div>
  <p class="info-copy">Choose aligned images of the same area. Processed locally in your browser.</p>
  <div class="upload-inputs"><label>RGB image<input id="uploadRGB" type="file" accept="image/png,image/jpeg,image/webp"></label><label>Thermal image<input id="uploadThermal" type="file" accept="image/png,image/jpeg,image/webp"></label><button id="fusePair">Fuse pair</button></div>
  <p id="uploadStatus" role="status">PNG, JPEG or WebP · up to 25 MB each.</p>
  <section id="uploadResult" hidden><div class="upload-toolbar"><div class="mode-switch" role="group" aria-label="Uploaded image view"><button data-upload-mode="rgb">RGB</button><button data-upload-mode="thermal">Thermal</button><button data-upload-mode="adaptive" class="active">Adaptive</button><button data-upload-mode="manual">Manual</button></div><label id="uploadOpacityLabel" hidden>Thermal <input id="uploadOpacity" type="range" min="0" max="100" value="50"><output id="uploadOpacityValue">50%</output></label><button id="saveFusion">Save PNG</button></div><div class="upload-preview"><canvas id="uploadCanvas" aria-label="Uploaded image fusion preview"></canvas></div><p class="info-copy">Blend uses local image contrast, not temperature or detection confidence. Alignment is assumed; no alignment correction is applied.</p></section>`;
  document.body.append(dialog);
  const el=id=>dialog.querySelector('#'+id),canvas=el('uploadCanvas'),context=canvas.getContext('2d');
  let pair=null,mode='adaptive',revision=0;
  button.onclick=()=>dialog.showModal();dialog.querySelector('[aria-label="Close upload"]').onclick=()=>dialog.close();
  function reset(){revision++;pair=null;el('uploadResult').hidden=true;el('uploadStatus').textContent='Ready to fuse the selected pair.';}
  el('uploadRGB').onchange=reset;el('uploadThermal').onchange=reset;
  async function decode(file){
    if(!file)throw Error('Choose both an RGB image and a thermal image.');
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Use PNG, JPEG or WebP images.');
    if(file.size>25*1024*1024)throw Error('Each image must be smaller than 25 MB.');
    try{return await createImageBitmap(file);}catch{throw Error('One image could not be decoded. Choose a valid image file.');}
  }
  function imageData(image,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(image,0,0,w,h);return g.getImageData(0,0,w,h);}
  function contrast(data,w,h){
    const gray=new Float32Array(w*h),gradient=new Float32Array(w*h),integral=new Float64Array((w+1)*(h+1));
    for(let i=0;i<gray.length;i++)gray[i]=(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])/255;
    let peak=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(data[i*4+3]<250)continue;const left=y*w+Math.max(0,x-1),right=y*w+Math.min(w-1,x+1),top=Math.max(0,y-1)*w+x,bottom=Math.min(h-1,y+1)*w+x;if([left,right,top,bottom].some(j=>data[j*4+3]<250))continue;gradient[i]=Math.hypot(gray[right]-gray[left],gray[bottom]-gray[top]);peak=Math.max(peak,gradient[i]);}
    for(let y=0;y<h;y++){let sum=0;for(let x=0;x<w;x++){sum+=gradient[y*w+x]/Math.max(peak,.001);integral[(y+1)*(w+1)+x+1]=integral[y*(w+1)+x+1]+sum;}}
    const radius=Math.max(2,Math.round(Math.min(w,h)/40)),out=new Float32Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=Math.max(0,x-radius),b=Math.min(w,x+radius+1),c=Math.max(0,y-radius),d=Math.min(h,y+radius+1);out[y*w+x]=(integral[d*(w+1)+b]-integral[c*(w+1)+b]-integral[d*(w+1)+a]+integral[c*(w+1)+a])/((b-a)*(d-c));}
    return out;
  }
  function render(){if(!pair)return;const {rgb,thermal,weights}=pair,out=context.createImageData(canvas.width,canvas.height),manual=Number(el('uploadOpacity').value)/100;
    for(let i=0;i<weights.length;i++){const p=i*4,t=mode==='rgb'?0:mode==='thermal'?1:mode==='manual'?manual:weights[i];const ra=rgb.data[p+3]/255,ta=thermal.data[p+3]/255,a=ra*(1-t)+ta*t;for(let c=0;c<3;c++)out.data[p+c]=a?(rgb.data[p+c]*ra*(1-t)+thermal.data[p+c]*ta*t)/a:0;out.data[p+3]=a*255;}
    context.putImageData(out,0,0);el('uploadOpacityLabel').hidden=mode!=='manual';
    dialog.querySelectorAll('[data-upload-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.uploadMode===mode);b.setAttribute('aria-pressed',String(b.dataset.uploadMode===mode));});
  }
  dialog.querySelectorAll('[data-upload-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.uploadMode;render();});
  el('uploadOpacity').oninput=()=>{el('uploadOpacityValue').textContent=el('uploadOpacity').value+'%';render();};
  el('fusePair').onclick=async()=>{
    const token=++revision;let rgb,thermal;el('fusePair').disabled=true;el('uploadResult').hidden=true;pair=null;el('uploadStatus').textContent='Computing blend…';
    try{
      rgb=await decode(el('uploadRGB').files[0]);thermal=await decode(el('uploadThermal').files[0]);
      if(token!==revision)return;
      if(Math.abs((rgb.width/rgb.height)/(thermal.width/thermal.height)-1)>.01)throw Error('Images must have matching aspect ratios and cover the same area. Align or crop them first.');
      const scale=Math.min(1,2048/Math.max(rgb.width,rgb.height)),w=Math.max(1,Math.round(rgb.width*scale)),h=Math.max(1,Math.round(rgb.height*scale));
      const r=imageData(rgb,w,h),t=imageData(thermal,w,h);await new Promise(resolve=>setTimeout(resolve,20));if(token!==revision)return;
      const rc=contrast(r.data,w,h),tc=contrast(t.data,w,h),weights=new Float32Array(w*h);
      for(let i=0;i<weights.length;i++)weights[i]=!t.data[i*4+3]?0:!r.data[i*4+3]?1:.12+.76*(tc[i]+.025)/(rc[i]+tc[i]+.05);
      canvas.width=w;canvas.height=h;pair={rgb:r,thermal:t,weights};mode='adaptive';render();el('uploadResult').hidden=false;
      el('uploadStatus').textContent=`${w} × ${h} preview · thermal resampled to the RGB grid · no georeferencing`;
    }catch(error){if(token===revision)el('uploadStatus').textContent=error.message;}
    finally{rgb?.close();thermal?.close();el('fusePair').disabled=false;}
  };
  el('saveFusion').onclick=()=>canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='aerosurvey-'+mode+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
})();
