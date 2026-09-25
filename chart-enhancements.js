(function(){
  const chartState={grid:true,crosshair:false,dots:true,zoom:1};
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const money=v=>'Rp'+Math.round(Number(v)||0).toLocaleString('id-ID');
  const dateLabel=d=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short'}).format(new Date(`${d}T00:00:00`)).replace('.','');
  const pct=(now,prev)=>prev===0?(now===0?0:null):((now-prev)/Math.abs(prev))*100;
  const pctText=v=>v===null?'—':`${v>=0?'+':''}${v.toFixed(1)}%`;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  window.renderTrendChart=function(){
    const el=document.getElementById('trendChart'); if(!el)return;
    const reports=Object.values(getReports()).filter(r=>r&&r.date).sort((a,b)=>a.date.localeCompare(b.date));
    const hasData=reports.length>0;
    const data=hasData?reports:Array.from({length:4},(_,i)=>({date:`2000-01-${String(i+1).padStart(2,'0')}`,income:0,profit:0}));
    const w=1000,h=390,pad={l:78,r:78,t:28,b:68};
    const innerW=w-pad.l-pad.r,innerH=h-pad.t-pad.b;
    const baseIncome=hasData?(Number(data[0].income)||0):0;
    const baseProfit=hasData?(Number(data[0].profit)||0):0;
    const performance=r=>baseIncome?((Number(r.income)||0)/baseIncome)*100:0;
    const profitPerf=r=>baseProfit?((Number(r.profit)||0)/baseProfit)*100:0;
    const perf=data.map(performance);
    const maxPerf=hasData?Math.max(100,...perf):100;
    const minPerf=hasData?Math.min(0,...perf):0;
    const maxY=Math.ceil((maxPerf+10)/10)*10,minY=Math.floor((minPerf-10)/10)*10,range=Math.max(100,maxY-minY);
    const y=v=>pad.t+(maxY-v)*innerH/range;
    const baseStep=data.length>1?Math.max(62,innerW/Math.min(data.length,9)):72;
    const x=i=>pad.l+20+i*baseStep*chartState.zoom;
    const rightX=w-pad.r;
    const grid=Array.from({length:5},(_,i)=>{const v=maxY-range*(i/4);return `<line x1="${pad.l}" y1="${y(v)}" x2="${rightX}" y2="${y(v)}" class="chart-grid-line"/>`}).join('');
    const leftTicks=Array.from({length:5},(_,i)=>{const v=maxY-range*(i/4);return `<span style="top:${(y(v)/h)*100}%">${Math.round(v)}%</span>`}).join('');
    const changeLabels=hasData?data.map((r,i)=>{const ch=i===0?0:pct(Number(r.income)||0,Number(data[i-1].income)||0);return `<span data-change-label="${i}" class="${ch>=0?'up':'down'}" style="top:${(y(performance(r))/h)*100}%">${i===0?'0%':pctText(ch)}</span>`}).join(''):'';
    const labels=data.map((r,i)=>hasData?`<text data-date-label="${i}" x="${x(i)}" y="${h-20}" text-anchor="middle" class="chart-label">${dateLabel(r.date)}</text>`:'').join('');
    const dots=(cls,fn)=>data.map((r,i)=>`<circle data-dot="${i}" cx="${x(i)}" cy="${y(fn(r))}" r="5" class="chart-data-dot ${cls}"/>`).join('');
    const candles=hasData?data.map((r,i)=>{
      const cur=Number(r.income)||0;
      const open=i===0?cur:Number(data[i-1].income)||0;
      const close=cur;
      const ch=i===0?0:pct(close,open)||0;
      const yo=y(performance({income:open})), yc=y(performance({income:close}));
      const top=Math.min(yo,yc), bodyH=Math.max(18,Math.abs(yc-yo)), bodyW=24;
      const wickTop=Math.max(pad.t,top-11), wickBottom=Math.min(h-pad.b,top+bodyH+11);
      return `<g data-candle="${i}" class="chart-candle-group ${ch>=0?'up':'down'}"><line x1="${x(i)}" y1="${wickTop}" x2="${x(i)}" y2="${wickBottom}" class="chart-candle-wick"/><rect x="${x(i)-bodyW/2}" y="${top}" width="${bodyW}" height="${bodyH}" rx="3" class="chart-candle-body"/><line x1="${x(i)-15}" y1="${yc}" x2="${x(i)+15}" y2="${yc}" class="chart-candle-cap"/></g>`;
    }).join(''):'';
    const incomePoints=data.map((r,i)=>`${x(i)},${y(performance(r))}`).join(' ');
    const profitPoints=data.map((r,i)=>`${x(i)},${y(profitPerf(r))}`).join(' ');
    const last=hasData?data[data.length-1]:null,prev=hasData&&data.length>1?data[data.length-2]:null,lastChange=prev?pct(Number(last.income)||0,Number(prev.income)||0):0;
    el.innerHTML=`<div class="chart-stage" data-chart-stage><div class="chart-y-axis-left">${leftTicks}</div><div class="chart-y-axis-right">${changeLabels}</div><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Grafik performa dan perubahan omzet"><defs><clipPath id="chartClip"><rect x="${pad.l}" y="${pad.t}" width="${innerW}" height="${innerH}"/></clipPath></defs><g class="chart-fixed-grid"><g class="chart-grid-layer ${chartState.grid?'visible':''}">${grid}</g></g><line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${h-pad.b}" class="chart-axis-line"/><line x1="${rightX}" y1="${pad.t}" x2="${rightX}" y2="${h-pad.b}" class="chart-axis-line"/><g data-plot-group clip-path="url(#chartClip)"><g class="chart-candles">${candles}</g><polyline points="${incomePoints}" class="chart-line chart-income"/><polyline points="${profitPoints}" class="chart-line chart-profit"/><g class="chart-dots-layer ${chartState.dots?'visible':''}">${dots('chart-income-dot',performance)}${dots('chart-profit-dot',profitPerf)}</g></g><g class="chart-date-labels">${labels}</g><line x1="${pad.l}" y1="${h-pad.b}" x2="${rightX}" y2="${h-pad.b}" class="chart-axis-line"/><g class="chart-crosshair-layer ${chartState.crosshair?'visible':''}"><line data-crosshair-x x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${h-pad.b}" class="chart-crosshair-x"/><line data-crosshair-y x1="${pad.l}" y1="${y(hasData?performance(last):0)}" x2="${rightX}" y2="${y(hasData?performance(last):0)}" class="chart-crosshair-y"/><circle data-crosshair-dot cx="${pad.l}" cy="${y(hasData?performance(last):0)}" r="7" class="chart-crosshair-dot"/></g></svg><div class="chart-tooltip" data-chart-tooltip hidden></div></div><div class="chart-bottom"><div class="chart-legend"><span><i class="legend-income"></i> Omzet</span><span><i class="legend-profit"></i> Keuntungan</span>${hasData&&prev?`<span class="chart-change ${lastChange>=0?'up':'down'}">${pctText(lastChange)}</span>`:'<span class="chart-last-readout">Tambahkan laporan harian untuk melihat perubahan</span>'}</div><div class="chart-tools"><button type="button" class="chart-toggle ${chartState.grid?'on':''}" data-chart-toggle="grid">▦ Grid</button><button type="button" class="chart-toggle ${chartState.crosshair?'on':''}" data-chart-toggle="crosshair">＋ Garis</button><button type="button" class="chart-toggle ${chartState.dots?'on':''}" data-chart-toggle="dots">● Titik</button></div></div>`;
    el.querySelectorAll('[data-chart-toggle]').forEach(btn=>btn.onclick=()=>{chartState[btn.dataset.chartToggle]=!chartState[btn.dataset.chartToggle];renderTrendChart();});
    bindInteractions(el,data,w,h,pad,x,y,performance);
  };

  function applyPlotZoom(el,pad,zoom,x){
    const group=el.querySelector('[data-plot-group]'); if(group)group.setAttribute('transform',`translate(${pad.l},0) scale(${zoom},1) translate(${-pad.l},0)`);
    el.querySelectorAll('[data-date-label]').forEach((label,i)=>label.setAttribute('x',x(i)));
  }

  function bindInteractions(el,data,w,h,pad,x,y,performance){
    const stage=el.querySelector('[data-chart-stage]'),svg=stage.querySelector('svg'),tip=stage.querySelector('[data-chart-tooltip]');
    let pinchStart=null,lastZoom=chartState.zoom,raf=0;
    const move=e=>{
      if(!chartState.crosshair||!data.length)return;
      const rect=svg.getBoundingClientRect();let px=(e.clientX-rect.left)/rect.width*w;px=clamp(px,pad.l,w-pad.r);
      const step=Math.max(62,(w-pad.l-pad.r)/Math.min(data.length,9));
      const i=Math.max(0,Math.min(data.length-1,Math.round((px-pad.l-20)/(step*chartState.zoom))));
      const sx=x(i),income=Number(data[i].income)||0,profit=Number(data[i].profit)||0,prev=i>0?(Number(data[i-1].income)||0):0,ch=i>0?pct(income,prev):0;
      const cx=stage.querySelector('[data-crosshair-x]'),cy=stage.querySelector('[data-crosshair-y]'),dot=stage.querySelector('[data-crosshair-dot]');
      cx.setAttribute('x1',sx);cx.setAttribute('x2',sx);cy.setAttribute('y1',y(performance(data[i])));cy.setAttribute('y2',y(performance(data[i])));dot.setAttribute('cx',sx);dot.setAttribute('cy',y(performance(data[i])));
      tip.hidden=false;tip.innerHTML=`<b>${esc(dateLabel(data[i].date))}</b><span>Omzet ${money(income)}</span><span>Profit ${money(profit)}</span><strong class="tip-change ${ch>=0?'up':'down'}">${pctText(ch)}</strong>`;tip.style.left=`${clamp((sx/w)*100,5,82)}%`;
    };
    stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',()=>tip.hidden=true);
    stage.addEventListener('touchstart',e=>{if(e.touches.length===2){pinchStart=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);lastZoom=chartState.zoom;}},{passive:true});
    stage.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinchStart){const dist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);const next=clamp(lastZoom*(dist/pinchStart),.65,4);if(Math.abs(next-chartState.zoom)>.001){chartState.zoom=next;cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>applyPlotZoom(el,pad,chartState.zoom,x));}e.preventDefault();}},{passive:false});
    stage.addEventListener('touchend',()=>{pinchStart=null;lastZoom=chartState.zoom;},{passive:true});
  }
  renderTrendChart();
})();
