(function(){
  const style=document.createElement('style');
  style.textContent=`
    .chart-stage{position:relative;width:100%;height:390px;overflow:hidden;contain:layout paint;touch-action:none;overscroll-behavior:contain}
    .chart-stage svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:hidden}
    .chart-y-axis-left,.chart-y-axis-right{position:absolute;top:0;bottom:0;width:54px;pointer-events:none;z-index:5;font:700 10px Inter,system-ui,sans-serif}
    .chart-y-axis-left{left:0;text-align:right}.chart-y-axis-right{right:0;text-align:left}
    .chart-y-axis-left span,.chart-y-axis-right span{position:absolute;transform:translateY(-50%);white-space:nowrap}
    .chart-y-axis-left span{right:5px;color:#7189a2}.chart-y-axis-right span{left:5px}.chart-y-axis-right .up{color:#55dfab}.chart-y-axis-right .down{color:#ff9c88}
    .chart-candle-body{stroke-width:2;vector-effect:non-scaling-stroke}.chart-candle-wick,.chart-candle-cap,.chart-line{display:none}
    .chart-candle-group.up .chart-candle-body{fill:rgba(85,223,171,.82);stroke:#55dfab}.chart-candle-group.down .chart-candle-body{fill:rgba(255,156,136,.82);stroke:#ff9c88}
    .chart-label{font-size:11px;fill:#7f97ad;font-weight:700}.chart-axis-line{stroke:rgba(122,159,194,.28);stroke-width:1;vector-effect:non-scaling-stroke}
    .chart-grid-line{stroke:rgba(132,171,207,.14);stroke-width:1;stroke-dasharray:6 7;vector-effect:non-scaling-stroke}.chart-grid-layer:not(.visible),.chart-dots-layer:not(.visible){display:none}
    .chart-data-dot{stroke:#06101d;stroke-width:2}.chart-income-dot{fill:#59afff}.chart-profit-dot{fill:#55dfab}
    .chart-bottom{position:relative;z-index:8}.chart-tools{display:flex;gap:8px;margin-top:14px}.chart-toggle{flex:1}
    @media(max-width:650px){.chart-stage{height:400px}.chart-y-axis-left,.chart-y-axis-right{width:48px}.chart-y-axis-left span{right:4px}.chart-y-axis-right span{left:4px}.chart-label{font-size:10px}}
  `;
  document.head.appendChild(style);
  const chartState={grid:true,crosshair:false,dots:true,zoom:1};
  const money=v=>'Rp'+Math.round(Number(v)||0).toLocaleString('id-ID');
  const dateLabel=d=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short'}).format(new Date(`${d}T00:00:00`)).replace('.','');
  const pct=(now,prev)=>prev===0?(now===0?0:null):((now-prev)/Math.abs(prev))*100;
  const pctText=v=>v===null?'—':`${v>=0?'+':''}${v.toFixed(1)}%`;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  window.renderTrendChart=function(){
    const el=document.getElementById('trendChart');if(!el)return;
    const reports=Object.values(getReports()).filter(r=>r&&r.date).sort((a,b)=>a.date.localeCompare(b.date));
    const hasData=reports.length>0;
    const data=hasData?reports:Array.from({length:5},(_,i)=>({date:`2000-01-${String(i+1).padStart(2,'0')}`,income:0,profit:0}));
    const W=1000,H=390,axisL=84,axisR=916,top=28,bottom=58,zeroY=H-bottom,plotH=zeroY-top,plotW=axisR-axisL;
    const baseIncome=hasData?(Number(data[0].income)||0):0;
    const performance=r=>baseIncome?((Number(r.income)||0)/baseIncome)*100:0;
    const perf=data.map(performance),maxPerf=hasData?Math.max(100,...perf):100,maxY=Math.max(100,Math.ceil((maxPerf+10)/10)*10);
    const y=v=>top+(maxY-clamp(v,0,maxY))*plotH/maxY;
    const baseStep=data.length>1?Math.max(72,plotW/Math.min(data.length,8)):88;
    const x=i=>axisL+42+i*baseStep*chartState.zoom;
    const candleW=42;
    const grid=Array.from({length:5},(_,i)=>{const v=maxY-(maxY/4)*i;return `<line x1="${axisL}" y1="${y(v)}" x2="${axisR}" y2="${y(v)}" class="chart-grid-line"/>`}).join('');
    const leftTicks=Array.from({length:5},(_,i)=>{const v=maxY-(maxY/4)*i;return `<span style="top:${(y(v)/H)*100}%">${Math.round(v)}%</span>`}).join('');
    const rightChanges=hasData?data.map((r,i)=>{if(i===0)return '';const ch=pct(Number(r.income)||0,Number(data[i-1].income)||0);return `<span data-change-label="${i}" class="${ch>=0?'up':'down'}" style="top:${(y(performance(r))/H)*100}%">${pctText(ch)}</span>`}).join(''):'';
    const labels=hasData?data.map((r,i)=>`<text data-date-label="${i}" x="${x(i)}" y="${H-18}" text-anchor="middle" class="chart-label">${dateLabel(r.date)}</text>`).join(''):'';
    const candles=hasData?data.map((r,i)=>{const cur=Number(r.income)||0,prev=i?Number(data[i-1].income)||0:cur,ch=i?pct(cur,prev)||0:0,value=clamp(performance(r),0,maxY),topY=y(value),height=Math.max(8,zeroY-topY);return `<g data-candle="${i}" class="chart-candle-group ${ch>=0?'up':'down'}"><rect x="${x(i)-candleW/2}" y="${topY}" width="${candleW}" height="${height}" rx="5" class="chart-candle-body"/></g>`}).join(''):'';
    const profitPerf=r=>baseIncome?((Number(r.profit)||0)/baseIncome)*100:0;
    const dots=(cls,fn)=>hasData?data.map((r,i)=>`<circle data-dot="${i}" cx="${x(i)}" cy="${y(fn(r))}" r="5" class="chart-data-dot ${cls}"/>`).join(''):'';
    const last=hasData?data[data.length-1]:null,prev=hasData&&data.length>1?data[data.length-2]:null,lastChange=prev?pct(Number(last.income)||0,Number(prev.income)||0):0;
    el.innerHTML=`<div class="chart-stage" data-chart-stage>
      <div class="chart-y-axis-left">${leftTicks}</div><div class="chart-y-axis-right">${rightChanges}</div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Grafik performa harian">
        <defs><clipPath id="chartClip"><rect x="${axisL}" y="${top}" width="${plotW}" height="${plotH}"/></clipPath></defs>
        <g class="chart-fixed-grid"><g class="chart-grid-layer ${chartState.grid?'visible':''}">${grid}</g></g>
        <line x1="${axisL}" y1="${top}" x2="${axisL}" y2="${zeroY}" class="chart-axis-line"/><line x1="${axisR}" y1="${top}" x2="${axisR}" y2="${zeroY}" class="chart-axis-line"/>
        <g data-plot-group clip-path="url(#chartClip)"><g class="chart-candles">${candles}</g><g class="chart-dots-layer ${chartState.dots?'visible':''}">${dots('chart-income-dot',performance)}${dots('chart-profit-dot',profitPerf)}</g></g>
        <g data-date-group>${labels}</g><line x1="${axisL}" y1="${zeroY}" x2="${axisR}" y2="${zeroY}" class="chart-axis-line"/>
        <g class="chart-crosshair-layer ${chartState.crosshair?'visible':''}"><line data-crosshair-x x1="${axisL}" y1="${top}" x2="${axisL}" y2="${zeroY}"/><line data-crosshair-y x1="${axisL}" y1="${zeroY}" x2="${axisR}" y2="${zeroY}"/><circle data-crosshair-dot cx="${axisL}" cy="${zeroY}" r="7"/></g>
      </svg>
    </div><div class="chart-bottom"><div class="chart-legend"><span><i class="legend-income"></i> Omzet</span><span><i class="legend-profit"></i> Keuntungan</span>${hasData&&prev?`<span class="chart-change ${lastChange>=0?'up':'down'}">${pctText(lastChange)}</span>`:'<span class="chart-last-readout">Tambahkan laporan harian untuk melihat perubahan</span>'}</div><div class="chart-tools"><button type="button" class="chart-toggle ${chartState.grid?'on':''}" data-chart-toggle="grid">▦ Grid</button><button type="button" class="chart-toggle ${chartState.crosshair?'on':''}" data-chart-toggle="crosshair">＋ Garis</button><button type="button" class="chart-toggle ${chartState.dots?'on':''}" data-chart-toggle="dots">● Titik</button></div></div>`;
    el.querySelectorAll('[data-chart-toggle]').forEach(btn=>btn.onclick=()=>{chartState[btn.dataset.chartToggle]=!chartState[btn.dataset.chartToggle];renderTrendChart();});
    bindInteractions(el,data,W,H,axisL,axisR,top,zeroY,x,y,performance,baseStep,candleW);
  };

  function applyZoom(el,data,axisL,axisR,x,zoom,candleW){
    el.querySelectorAll('[data-candle]').forEach((g,i)=>{const rect=g.querySelector('rect');if(rect)rect.setAttribute('x',x(i)-candleW/2);});
    el.querySelectorAll('[data-dot]').forEach((dot,i)=>dot.setAttribute('cx',x(i)));
    el.querySelectorAll('[data-date-label]').forEach((label,i)=>label.setAttribute('x',x(i)));
  }

  function bindInteractions(el,data,W,H,axisL,axisR,top,zeroY,x,y,performance,baseStep,candleW){
    const stage=el.querySelector('[data-chart-stage]'),svg=stage.querySelector('svg');
    let pinchStart=0,lastZoom=chartState.zoom,targetZoom=chartState.zoom,raf=0;
    const frame=()=>{raf=0;const d=targetZoom-chartState.zoom;if(Math.abs(d)<.001){chartState.zoom=targetZoom;applyZoom(el,data,axisL,axisR,x,targetZoom,candleW);return;}chartState.zoom+=d*.3;applyZoom(el,data,axisL,axisR,x,chartState.zoom,candleW);raf=requestAnimationFrame(frame);};
    const schedule=z=>{targetZoom=clamp(z,.65,2.4);if(!raf)raf=requestAnimationFrame(frame);};
    stage.addEventListener('touchstart',e=>{if(e.touches.length===2){pinchStart=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);lastZoom=targetZoom;}},{passive:true});
    stage.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinchStart){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);schedule(lastZoom*d/pinchStart);e.preventDefault();}},{passive:false});
    stage.addEventListener('touchend',()=>{pinchStart=0;lastZoom=targetZoom;},{passive:true});
    if(chartState.crosshair){stage.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect(),px=(e.clientX-rect.left)/rect.width*W,step=baseStep*chartState.zoom,i=clamp(Math.round((px-(axisL+42))/step),0,data.length-1),sx=x(i),cy=y(performance(data[i])),cx=stage.querySelector('[data-crosshair-x]'),hy=stage.querySelector('[data-crosshair-y]'),dot=stage.querySelector('[data-crosshair-dot]');if(cx){cx.setAttribute('x1',sx);cx.setAttribute('x2',sx);hy.setAttribute('y1',cy);hy.setAttribute('y2',cy);dot.setAttribute('cx',sx);dot.setAttribute('cy',cy);}});}
  }
  renderTrendChart();
})();
