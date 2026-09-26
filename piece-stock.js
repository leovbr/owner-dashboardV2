/* Piece-based stock mode for Business Manager V2. */
(() => {
  const KEY = 'owner_dashboard_piece_stock_v1';
  const SESSION = 'owner_dashboard_session_v1';
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const session = () => read(SESSION, null);
  const isOwner = () => session()?.role === 'owner';
  const state = () => read(KEY, { opening: null, used: 0, damaged: 0, current: 0, updatedAt: null });

  function style() {
    if (document.getElementById('pieceStockStyles')) return;
    const s = document.createElement('style'); s.id='pieceStockStyles';
    s.textContent = `
      .piece-stock{padding:18px;border-radius:20px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);display:grid;gap:14px}
      .piece-stock-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.piece-stock-head h2{margin:0}.piece-stock-muted{font-size:12px;opacity:.58}
      .piece-stock-table{display:grid;gap:0;border-radius:15px;overflow:hidden;border:1px solid rgba(255,255,255,.08)}
      .piece-stock-line{display:grid;grid-template-columns:1fr auto;gap:12px;padding:13px 14px;background:rgba(255,255,255,.025);border-bottom:1px solid rgba(255,255,255,.055)}.piece-stock-line:last-child{border-bottom:0}
      .piece-stock-line span{opacity:.7}.piece-stock-line b{font-size:15px}.piece-stock-secret{color:#ffd36a}.piece-stock-current{font-size:18px}
      .piece-stock-actions{display:flex;gap:8px;flex-wrap:wrap}.piece-stock-btn{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:inherit;border-radius:11px;padding:10px 12px;font-weight:750;cursor:pointer}.piece-stock-btn.primary{background:#fff;color:#071426}.piece-stock-btn.danger{background:rgba(180,45,55,.18);border-color:rgba(255,100,110,.2)}
      .piece-stock-owner{padding:12px 13px;border-radius:13px;background:rgba(88,166,255,.08);border:1px solid rgba(88,166,255,.15);display:grid;gap:9px}.piece-stock-owner input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:#071426;color:#fff;outline:none}.piece-stock-owner input:focus{border-color:#58a6ff}
      @media(max-width:700px){.piece-stock-line{padding:12px}.piece-stock-actions button{flex:1}}
    `;
    document.head.appendChild(s);
  }

  function mount() {
    const root = document.getElementById('opsRoot'); if (!root || root.querySelector('.piece-stock')) return;
    const wrap = document.createElement('section'); wrap.className='piece-stock'; wrap.innerHTML=`
      <div class="piece-stock-head"><div><span class="eyebrow">INVENTORY</span><h2>Stok Ayam</h2><div class="piece-stock-muted">Mode sederhana · dihitung per potong</div></div><span class="ops-badge">1 potong</span></div>
      <div class="piece-stock-table" id="pieceStockTable"></div>
      <div class="piece-stock-actions">
        <button class="piece-stock-btn primary" id="pieceUse">− Terpakai</button>
        <button class="piece-stock-btn danger" id="pieceDamage">− Rusak</button>
        <button class="piece-stock-btn" id="pieceCount">⚖ Catat Sisa</button>
      </div>
      <div id="pieceOwnerBox"></div>`;
    root.prepend(wrap);
    document.getElementById('pieceUse').onclick=()=>change('used','Terpakai');
    document.getElementById('pieceDamage').onclick=()=>change('damaged','Rusak');
    document.getElementById('pieceCount').onclick=()=>count();
    render();
  }

  function render() {
    const box=document.getElementById('pieceStockTable'), owner=document.getElementById('pieceOwnerBox'); if(!box||!owner)return;
    const x=state();
    box.innerHTML=`
      <div class="piece-stock-line"><span>Stok awal</span><b class="piece-stock-secret">${isOwner() ? (x.opening===null?'Belum dimasukkan':esc(x.opening)+' potong') : 'tunggu owner'}</b></div>
      <div class="piece-stock-line"><span>Terpakai</span><b>−${x.used} potong</b></div>
      <div class="piece-stock-line"><span>Rusak</span><b>−${x.damaged} potong</b></div>
      <div class="piece-stock-line"><span>Sisa</span><b class="piece-stock-current">${x.current} potong</b></div>`;
    owner.innerHTML=isOwner()?`<div class="piece-stock-owner"><b>🔐 Data Owner</b><span class="piece-stock-muted">Stok awal ayam mentah hanya bisa dilihat dan diubah Owner.</span><input id="pieceOpening" type="number" min="0" step="1" placeholder="Masukkan stok awal (potong)" value="${x.opening===null?'':x.opening}"><button class="piece-stock-btn primary" id="pieceSaveOpening">Simpan Stok Awal</button></div>`:'';
    if(document.getElementById('pieceSaveOpening'))document.getElementById('pieceSaveOpening').onclick=saveOpening;
  }

  function saveOpening(){const input=document.getElementById('pieceOpening');const n=Number(input?.value);if(!Number.isInteger(n)||n<0)return alert('Masukkan jumlah potong yang valid.');const x=state();x.opening=n;if(!x.current)x.current=n;x.updatedAt=new Date().toISOString();write(KEY,x);render();}
  function change(key,label){const n=Number(prompt(`${label} ayam (potong)`,'1'));if(!Number.isInteger(n)||n<=0)return;const x=state();if(key==='used')x.used+=n;else x.damaged+=n;x.current=Math.max(0,x.current-n);x.updatedAt=new Date().toISOString();write(KEY,x);render();}
  function count(){const n=Number(prompt('Sisa ayam saat ini (potong)',String(state().current)));if(!Number.isInteger(n)||n<0)return;const x=state();x.current=n;x.updatedAt=new Date().toISOString();write(KEY,x);render();}

  const boot=()=>{style();mount();};
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
  setTimeout(boot,400);
})();
