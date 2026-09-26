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

  /* Home catalog cards are real navigation controls, not decorative arrows. */
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
  `;
  document.head.appendChild(style);
})();
