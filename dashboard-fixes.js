(function(){
  const money=v=>'Rp'+Math.round(Number(v)||0).toLocaleString('id-ID');
  const getTotals=()=>Object.values(getReports()).reduce((t,r)=>({income:t.income+(Number(r.income)||0),expenses:t.expenses+(Number(r.expenses)||0),profit:t.profit+(Number(r.profit)||0)}),{income:0,expenses:0,profit:0});
  window.renderHomeTotals=function(){
    const t=getTotals();
    const income=document.getElementById('incomeSummary');
    const expenses=document.getElementById('expenseSummary');
    const profit=document.getElementById('profitSummary');
    if(income)income.textContent=money(t.income);
    if(expenses)expenses.textContent=money(t.expenses);
    if(profit)profit.textContent=money(t.profit);
  };
  const originalSave=window.saveReport;
  if(typeof originalSave==='function'){
    const saveButton=document.getElementById('saveReport');
    if(saveButton)saveButton.onclick=function(){originalSave();renderHomeTotals();};
  }
  const originalClear=window.clearHistory;
  if(typeof originalClear==='function'){
    const clearButton=document.getElementById('clearHistory');
    if(clearButton)clearButton.onclick=function(){originalClear();renderHomeTotals();};
  }
  const originalDelete=window.deleteReport;
  if(typeof originalDelete==='function'){
    window.deleteReport=function(date){originalDelete(date);renderHomeTotals();};
    if(typeof window.renderHistory==='function')window.renderHistory();
  }
  document.querySelectorAll('[data-page="home"]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(renderHomeTotals,0)));
  renderHomeTotals();

  document.addEventListener('click',e=>{
    const item=e.target.closest('.home-product');
    if(!item)return;
    e.preventDefault();
    if(typeof window.showPage==='function')window.showPage('products');
  });

  const style=document.createElement('style');
  style.textContent=`
    .chart-y-axis-left,.chart-y-axis-right{width:84px!important}
    .chart-y-axis-left span{right:8px!important}
    .chart-y-axis-right span{left:8px!important;right:auto!important}
    .chart-stage{overflow:hidden!important}
    .chart-stage svg{overflow:hidden!important}
    .chart-candles{clip-path:inset(0 0 0 0)}
    .chart-candle-body{shape-rendering:geometricPrecision}
    .chart-label{paint-order:stroke;stroke:rgba(7,20,38,.8);stroke-width:3px}
    .home-product{cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;transition:transform .18s ease,background .18s ease}
    .home-product:active{transform:scale(.985)}
    .home-product .home-arrow{transition:transform .18s ease}
    .home-product:hover .home-arrow{transform:translateX(4px)}

    /* Operational controls: match the Owner Dashboard glass/navy theme instead of browser-default controls. */
    #opsRoot .ops-card,
    #opsRoot .ops-stat,
    #opsRoot .ops-row,
    #opsRoot .ops-empty{background:linear-gradient(145deg,rgba(15,35,59,.86),rgba(5,18,33,.92));border-color:rgba(88,166,255,.16);box-shadow:0 10px 28px rgba(0,0,0,.14)}
    #opsRoot .ops-form input,
    #opsRoot .ops-form select,
    #opsRoot .ops-recipe-row input,
    #opsRoot .ops-recipe-row select{
      appearance:none;-webkit-appearance:none;color:#eaf4ff;background:linear-gradient(180deg,#0b2139,#071426);border:1px solid rgba(88,166,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 4px 16px rgba(0,0,0,.12);color-scheme:dark;
    }
    #opsRoot .ops-form select,
    #opsRoot .ops-recipe-row select{background-image:linear-gradient(45deg,transparent 50%,#83bfff 50%),linear-gradient(135deg,#83bfff 50%,transparent 50%),linear-gradient(180deg,#0b2139,#071426);background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%,0 0;background-size:5px 5px,5px 5px,100% 100%;background-repeat:no-repeat;padding-right:34px}
    #opsRoot .ops-form option,
    #opsRoot .ops-recipe-row option{background:#071426;color:#eaf4ff}
    #opsRoot .ops-form input:focus,
    #opsRoot .ops-form select:focus,
    #opsRoot .ops-recipe-row input:focus,
    #opsRoot .ops-recipe-row select:focus{border-color:rgba(88,166,255,.7);box-shadow:0 0 0 3px rgba(88,166,255,.1)}
    #opsRoot .ops-btn{background:linear-gradient(135deg,#2c8cff,#1768cf);color:#fff;border:1px solid rgba(137,196,255,.24);box-shadow:0 8px 18px rgba(20,105,210,.18)}
    #opsRoot .ops-btn.secondary{background:rgba(9,30,51,.82);color:#dbeeff;border-color:rgba(88,166,255,.2);box-shadow:none}
    #opsRoot .ops-btn.danger{background:rgba(105,25,38,.72);border-color:rgba(255,105,125,.18)}
    #opsRoot .ops-tabs{scrollbar-width:none}
    #opsRoot .ops-tabs::-webkit-scrollbar{display:none}
  `;
  document.head.appendChild(style);

  if(!window.__teamSystemLoaded){
    window.__teamSystemLoaded=true;
    const s=document.createElement('script');
    s.src='team-system.js?v=20260926b';
    s.defer=true;
    document.body.appendChild(s);
  }
})();
