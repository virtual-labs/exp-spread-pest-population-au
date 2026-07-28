/* ============================================================= *
 *  Lightweight self-contained line/point chart (no libraries)   *
 * ============================================================= */
const Chart = (() => {
  function draw(cv, series, opts={}){
    const dpr = window.devicePixelRatio||1;
    const cssW = cv.clientWidth||cv.width, cssH = cv.clientHeight|| (cssW*0.62);
    cv.width = cssW*dpr; cv.height = cssH*dpr;
    const g = cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
    const W=cssW, H=cssH;
    const m={l:56,r:18,t:16,b:44};
    g.clearRect(0,0,W,H);
    // gather extents
    let xs=[],ys=[]; series.forEach(s=>s.data.forEach(p=>{xs.push(p[0]);ys.push(p[1]);}));
    if(!xs.length){ g.fillStyle='#9aa3b2';g.font='15px Segoe UI';g.textAlign='center';
      g.fillText('Press "Plot Graph" to see results',W/2,H/2); cv._series=null; return; }
    let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(0,...ys),ymax=Math.max(...ys);
    if(opts.xmin!=null)xmin=opts.xmin; if(opts.ymin!=null)ymin=opts.ymin;
    if(xmax===xmin)xmax=xmin+1; if(ymax===ymin)ymax=ymin+1;
    const pad=(ymax-ymin)*0.08; ymax+=pad;
    const X=x=>m.l+(x-xmin)/(xmax-xmin)*(W-m.l-m.r);
    const Y=y=>H-m.b-(y-ymin)/(ymax-ymin)*(H-m.t-m.b);
    // grid + ticks
    g.strokeStyle='#eef1f6';g.fillStyle='#7b8494';g.font='12px Segoe UI';g.lineWidth=1;
    const nT=6;
    for(let i=0;i<=nT;i++){
      const gy=ymin+(ymax-ymin)*i/nT;
      g.beginPath();g.moveTo(m.l,Y(gy));g.lineTo(W-m.r,Y(gy));g.stroke();
      g.textAlign='right';g.textBaseline='middle';g.fillText(fmt(gy),m.l-8,Y(gy));
    }
    for(let i=0;i<=nT;i++){
      const gx=xmin+(xmax-xmin)*i/nT;
      g.beginPath();g.moveTo(X(gx),m.t);g.lineTo(X(gx),H-m.b);g.strokeStyle='#f4f6fa';g.stroke();
      g.textAlign='center';g.textBaseline='top';g.fillStyle='#7b8494';g.fillText(fmt(gx),X(gx),H-m.b+6);
    }
    // axes
    g.strokeStyle='#c7ccd6';g.beginPath();g.moveTo(m.l,m.t);g.lineTo(m.l,H-m.b);g.lineTo(W-m.r,H-m.b);g.stroke();
    // axis labels
    g.fillStyle='#4a5261';g.font='13px Segoe UI';
    if(opts.xlabel){g.textAlign='center';g.fillText(opts.xlabel,(m.l+W-m.r)/2,H-10);}
    if(opts.ylabel){g.save();g.translate(14,(m.t+H-m.b)/2);g.rotate(-Math.PI/2);g.textAlign='center';g.fillText(opts.ylabel,0,0);g.restore();}
    // series
    series.forEach(s=>{
      if(s.data.length<1)return;
      g.strokeStyle=s.color;g.lineWidth=2.4;g.beginPath();
      s.data.forEach((p,i)=>{const px=X(p[0]),py=Y(p[1]); i?g.lineTo(px,py):g.moveTo(px,py);});
      g.stroke();
      if(s.points!==false){g.fillStyle=s.color;s.data.forEach(p=>{g.beginPath();g.arc(X(p[0]),Y(p[1]),2.6,0,7);g.fill();});}
    });
    cv._series=series;cv._map={X,Y,xmin,xmax,ymin,ymax,m,W,H};
  }
  function fmt(v){const a=Math.abs(v);
    if(a>=1000)return (v/1000).toFixed(a>=10000?0:1)+'k';
    if(a>0&&a<1)return v.toFixed(2); if(!Number.isInteger(v))return v.toFixed(1); return ''+v;}
  return {draw};
})();

/* ---------- tab switching ---------- */


/* ---------- model ---------- */
function currentParams(){
  return {
    hab:+hab.value, years:+years.value, estab:+estab.value,
    init:+init.value, disp:+disp.value, rate:+rate.value
  };
}
function simulate(p){
  const N=Math.max(3,Math.round(p.hab)), yrs=Math.round(p.years), d=p.disp;
  let H=new Array(N).fill(0); H[0]=p.init;
  const front=[[0,1]];
  for(let t=1;t<=yrs;t++){
    for(let j=0;j<N;j++) H[j]*=p.rate;
    const New=new Array(N).fill(0);
    New[0]=((1-d)+d/2)*H[0]+(d/2)*H[1];
    for(let i=1;i<N-1;i++) New[i]=(d/2)*H[i-1]+(1-d)*H[i]+(d/2)*H[i+1];
    New[N-1]=((1-d)+d/2)*H[N-1]+(d/2)*H[N-2];
    H=New;
    // spread front = first cell below establishment threshold
    let edge=N;
    for(let r=0;r<N;r++){ if(H[r]<p.estab){edge=r+1;break;} }
    front.push([t,edge]);
  }
  return front;
}
let lastData=null;
function plot(keep){
  const p=currentParams();
  const data = keep&&lastData?lastData:simulate(p);
  lastData=data;
  Chart.draw(document.getElementById('chart'),
    [{name:'Spread front',color:'#b50246',data:data}],
    {xlabel:'Time (years)',ylabel:'Spread front (km)',ymin:0});
  document.getElementById('legend').innerHTML='<span><i style="background:#b50246"></i>Spread front (km)</span>';
  const final=data[data.length-1][1];
  document.getElementById('rfinal').textContent=final;
  document.getElementById('rspeed').textContent=(final/Math.max(1,p.years)).toFixed(2);
}
function sync(){
  v_hab.textContent=hab.value; v_years.textContent=years.value; v_estab.textContent=estab.value;
  v_init.textContent=init.value; v_disp.textContent=(+disp.value).toFixed(1);
  v_rate.textContent=(+rate.value).toFixed(1).replace(/\.0$/,'');
}
function resetSim(){
  hab.value=100;years.value=50;estab.value=10;init.value=50;disp.value=0.2;rate.value=4;
  sync();lastData=null;Chart.draw(document.getElementById('chart'),[],{});
  document.getElementById('legend').innerHTML='';document.getElementById('rfinal').textContent='–';
  document.getElementById('rspeed').textContent='–';toast('Simulator reset');
}

/* ---------- export / save ---------- */
function downloadPNG(){
  const cv=document.getElementById('chart');
  if(!cv._series){toast('Plot a graph first');return;}
  const out=document.createElement('canvas');out.width=cv.width;out.height=cv.height;
  const o=out.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,out.width,out.height);o.drawImage(cv,0,0);
  const a=document.createElement('a');a.download='pest-invasion.png';a.href=out.toDataURL('image/png');a.click();
  toast('PNG downloaded');
}
function downloadCSV(){
  if(!lastData){toast('Plot a graph first');return;}
  let csv='year,spread_front_km\n'+lastData.map(r=>r[0]+','+r[1]).join('\n');
  dl(csv,'pest-invasion.csv','text/csv');toast('CSV downloaded');
}
function saveRun(){
  localStorage.setItem('pest_invasion',JSON.stringify(currentParams()));toast('Run saved in this browser');
}
function loadRun(){
  const s=localStorage.getItem('pest_invasion');
  if(!s){toast('No saved run found');return;}
  const p=JSON.parse(s);
  hab.value=p.hab;years.value=p.years;estab.value=p.estab;init.value=p.init;disp.value=p.disp;rate.value=p.rate;
  sync();plot();toast('Saved run loaded');
}
function dl(text,name,type){
  const b=new Blob([text],{type});const a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=name;a.click();URL.revokeObjectURL(a.href);
}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);}

/* ---------- hover readout ---------- */
(function(){
  const cv=document.getElementById('chart');
  cv.addEventListener('pointermove',e=>{
    if(!cv._map)return;const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
    const {X,Y,xmin,xmax,ymin,ymax,m,W,H}=cv._map;
    if(mx<m.l||mx>W-m.r||my<m.t||my>H-m.b)return;
    const xv=xmin+(mx-m.l)/(W-m.l-m.r)*(xmax-xmin);
    const yv=ymin+(H-m.b-my)/(H-m.b-m.t)*(ymax-ymin);
    document.getElementById('rx').textContent=xv.toFixed(1);
    document.getElementById('ry').textContent=yv.toFixed(1);
  });
})();

/* ---------- quiz ---------- */


/* ---------- init ---------- */
sync();
window.addEventListener('resize',()=>{if(lastData)plot(true);});
Chart.draw(document.getElementById('chart'),[],{});

/* ---- fullscreen (whole simulation box) ---- */
function toggleFS(){var el=document.getElementById('simbox');var fsEl=document.fullscreenElement||document.webkitFullscreenElement;if(!fsEl){var rq=el.requestFullscreen||el.webkitRequestFullscreen;if(rq)rq.call(el);}else{var ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)ex.call(document);}}
function _fsSync(){var b=document.getElementById('fsBtn');var on=document.fullscreenElement||document.webkitFullscreenElement;if(b)b.textContent=on?'✕':'⛶';setTimeout(function(){window.dispatchEvent(new Event('resize'));},70);}
document.addEventListener('fullscreenchange',_fsSync);
document.addEventListener('webkitfullscreenchange',_fsSync);
