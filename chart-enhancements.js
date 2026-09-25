(function(){
  const chartState={grid:true,crosshair:false,dots:true};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const moneyChart=v=>'Rp'+Math.round(Number(v)||0).toLocaleString('id-ID');
  const dateLabel=d=>new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short'}).format(new Date(`${d}T00:00:00`));

  window.renderTrendChart=function(){
    const el=document.getElementById('trendChart');
    if(!el)return;
    const reports=Object.values(getReports()).filter(r=>r&&r.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
    const hasData=reports.length>0;
    const data=hasData?reports:Array.from({length:7},(_,i)=>({date:'2000-01-'+String(i+1).padStart(2,'0'),income:0,profit:0}));
    const w=900,h=330,pad={l:58,r:20,t:24,b:48},innerW=w-pad.l-pad.r,innerH=h-pad.t-pad.b;
    const max=hasData?Math.max(1,...data.flatMap(r=>[Number(r.income)||0,Number(r.profit)||0])):100;
    const min=hasData?Math.min(0,...data.map(r=>Number(r.profit)||0)):0;
    const range=Math.max(1,max-min);
    const x=i=>pad.l+(data.length===1?innerW/2:i*innerW/(data.length-1));
    const y=v=>pad.t+(max-v)*innerH/range;
    const points=key=>data.map((r,i)=>`${x(i).toFixed(1)},${y(Number(r[key])||0).toFixed(1)}`).join(' ');
    const grid=Array.from({length:5},(_,i)=>{const v=max-range*(i/4);return `<line x1="${pad.l}" y1="${y(v)}" x2="${w-pad.r}" y2="${y(v)}" class="chart-grid-line"/><text x="${pad.l-10}" y="${y(v)+4}" text-anchor="end" class="chart-axis-label">${hasData?moneyChart(v):'0'}</text>`}).join('');
    const labels=data.map((r,i)=>{if(!hasData)return i===0?'0':i===data.length-1?'Hari ini':'';if(data.length>8&&i%2!==0)return '';return `<text x="${x(i)}" y="${h-15}" text-anchor="middle" class="chart-label">${dateLabel(r.date)}</text>`}).join('');
    const dots=(key,cls)=>data.map((r,i)=>`<circle cx="${x(i)}" cy="${y(Number(r[key])||0)}" r="4" class="chart-data-dot ${cls}"/>`).join('');
    const zeroY=y(0);
    el.innerHTML=`<div class="chart-toolbar"><div class="chart-toolbar-title"><span>${hasData?'14 hari terakhir':'Belum ada data'}</span></div><div class="chart-tools"><button type="button" class="chart-toggle ${chartState.grid?'on':''}" data-chart-toggle="grid">▦ Grid</button><button type="button" class="chart-toggle ${chartState.crosshair?'on':''}" data-chart-toggle="crosshair">＋ Garis</button><button type="button" class="chart-toggle ${chartState.dots?'on':''}" data-chart-toggle="dots">● Titik</button></div></div><div class="chart-stage" data-chart-stage><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Grafik omzet dan keuntungan harian"><g class="chart-grid-layer ${chartState.grid?'visible':''}">${grid}</g><line x1="${pad.l}" y1="${zeroY}" x2="${w-pad.r}" y2="${zeroY}" class="chart-zero-line"/><polyline points="${points('income')}" class="chart-line chart-income"/><polyline points="${points('profit')}" class="chart-line chart-profit"/><g class="chart-dots-layer ${chartState.dots?'visible':''}">${dots('income','chart-income-dot')}${dots('profit','chart-profit-dot')}</g><g>${labels}</g><line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${h-pad.b}" class="chart-axis-line"/><line x1="${pad.l}" y1="${h-pad.b}" x2="${w-pad.r}" y2="${h-pad.b}" class="chart-axis-line"/><g class="chart-crosshair-layer ${chartState.crosshair?'visible':''}"><line data-crosshair-x x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${h-pad.b}" class="chart-crosshair-x"/><line data-crosshair-y x1="${pad.l}" y1="${zeroY}" x2="${w-pad.r}" y2="${zeroY}" class="chart-crosshair-y"/><circle data-crosshair-dot cx="${pad.l}" cy="${zeroY}" r="6" class="chart-crosshair-dot"/></g></svg><div class="chart-tooltip" data-chart-tooltip hidden></div></div><div class="chart-legend"><span><i class="legend-income"></i> Omzet</span><span><i class="legend-profit"></i> Keuntungan</span>${hasData?`<span class="chart-last-readout">Terakhir: <b>${dateLabel(data[data.length-1].date)}</b> · ${moneyChart(data[data.length-1].income)}</span>`:'<span class="chart-last-readout">Isi laporan harian untuk melihat tren</span>'}</div>`;
    el.querySelectorAll('[data-chart-toggle]').forEach(btn=>btn.onclick=()=>{chartState[btn.dataset.chartToggle]=!chartState[btn.dataset.chartToggle];renderTrendChart();});
    if(chartState.crosshair&&hasData)bindCrosshair(el,data,w,h,pad,x,y);
  };

  function bindCrosshair(el,data,w,h,pad,x,y){
    const stage=el.querySelector('[data-chart-stage]'),svg=stage.querySelector('svg'),cx=stage.querySelector('[data-crosshair-x]'),cy=stage.querySelector('[data-crosshair-y]'),dot=stage.querySelector('[data-crosshair-dot]'),tip=stage.querySelector('[data-chart-tooltip]');
    const move=e=>{const rect=svg.getBoundingClientRect();let px=(e.clientX-rect.left)/rect.width*w;px=Math.max(pad.l,Math.min(w-pad.r,px));const ratio=(px-pad.l)/(w-pad.l-pad.r);const i=Math.max(0,Math.min(data.length-1,Math.round(ratio*(data.length-1))));const sx=x(i),income=Number(data[i].income)||0,profit=Number(data[i].profit)||0,py=y(Math.max(income,profit));cx.setAttribute('x1',sx);cx.setAttribute('x2',sx);cy.setAttribute('y1',py);dot.setAttribute('cx',sx);dot.setAttribute('cy',py);tip.hidden=false;tip.innerHTML=`<b>${esc(dateLabel(data[i].date))}</b><span>Omzet ${moneyChart(income)}</span><span>Profit ${moneyChart(profit)}</span>`;tip.style.left=`${Math.max(4,Math.min(78,(sx/w)*100))}%`;};
    stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',()=>tip.hidden=true);
  }
})();
