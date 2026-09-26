/* Operational layer for Owner Dashboard V2. Local prototype; production auth/data should use backend. */
(() => {
  const K = {
    users: 'owner_dashboard_users_v1',
    session: 'owner_dashboard_session_v1',
    stock: 'owner_dashboard_stock_v2',
    recipes: 'owner_dashboard_recipes_v1',
    ops: 'owner_dashboard_ops_v1',
    queue: 'owner_dashboard_staff_queue_v2'
  };
  const $ = id => document.getElementById(id);
  const read = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const money = v => 'Rp' + Math.round(Number(v) || 0).toLocaleString('id-ID');
  const num = v => Math.max(0, Number(v) || 0);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const roles = { owner:'Owner', manager:'Manager', kitchen:'Kitchen', waiter:'Waiter' };
  const units = ['kg','gram','L','ml','pcs','pack','dus'];
  const session = () => read(K.session, null);
  const users = () => read(K.users, []);
  const stock = () => read(K.stock, []);
  const recipes = () => read(K.recipes, {});
  const ops = () => read(K.ops, []);
  const queue = () => read(K.queue, []);
  const products = () => {
    try { return JSON.parse(localStorage.getItem('owner_dashboard_products_v2')) || []; } catch { return []; }
  };
  const addQueue = (type, payload) => {
    const s = session();
    const q = queue();
    q.unshift({ id: uid(), type, payload, by: s?.name || s?.username || 'Staff', role: s?.role || '', createdAt: new Date().toISOString(), status:'pending' });
    write(K.queue, q);
  };

  function injectStyles() {
    if ($('opsStyles')) return;
    const s = document.createElement('style');
    s.id = 'opsStyles';
    s.textContent = `
      .ops-wrap{display:grid;gap:16px}.ops-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.ops-card{padding:18px;border-radius:20px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}
      .ops-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.ops-head h2{margin:3px 0}.ops-muted{opacity:.62;font-size:13px}.ops-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ops-form label{display:grid;gap:5px;font-size:12px;opacity:.85}.ops-form input,.ops-form select{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:#071426;color:#fff;outline:none}.ops-form input:focus,.ops-form select:focus{border-color:#58a6ff}.ops-full{grid-column:1/-1}.ops-btn{padding:10px 13px;border:0;border-radius:11px;background:#fff;color:#071426;font-weight:800;cursor:pointer}.ops-btn.secondary{background:rgba(255,255,255,.06);color:inherit;border:1px solid rgba(255,255,255,.12)}.ops-btn.danger{background:#5b1720;color:#fff}.ops-btn:active{transform:scale(.98)}
      .ops-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.ops-stat{padding:13px;border-radius:15px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.ops-stat b{display:block;font-size:19px;margin-top:5px}.ops-low{border-color:rgba(255,150,90,.45)}
      .ops-list{display:grid;gap:8px}.ops-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}.ops-row-main{min-width:0}.ops-row-main b{display:block}.ops-row-main small{display:block;opacity:.62;margin-top:3px}.ops-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ops-actions button{padding:7px 9px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:transparent;color:inherit;cursor:pointer}.ops-badge{font-size:11px;padding:5px 8px;border-radius:99px;background:rgba(255,255,255,.07)}.ops-empty{padding:14px;text-align:center;opacity:.55;border:1px dashed rgba(255,255,255,.1);border-radius:13px}.ops-note{padding:11px 13px;border-radius:12px;background:rgba(88,166,255,.08);border:1px solid rgba(88,166,255,.15);font-size:13px}.ops-recipe-row{display:grid;grid-template-columns:1fr 100px 70px auto;gap:7px;align-items:center;margin-top:7px}.ops-recipe-row input,.ops-recipe-row select{padding:9px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:#071426;color:#fff}.ops-hpp{font-size:22px;font-weight:800}.ops-tabs{display:flex;gap:7px;overflow:auto;margin-bottom:12px}.ops-tab{white-space:nowrap;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.1);background:transparent;color:inherit}.ops-tab.active{background:rgba(88,166,255,.14);border-color:rgba(88,166,255,.4)}
      @media(max-width:700px){.ops-grid{grid-template-columns:1fr}.ops-form{grid-template-columns:1fr}.ops-full{grid-column:auto}.ops-stat-grid{grid-template-columns:1fr 1fr}.ops-recipe-row{grid-template-columns:1fr 80px 60px auto}.ops-row{align-items:flex-start;flex-direction:column}.ops-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(s);
  }

  function addPages() {
    if (document.querySelector('[data-page-view="team"]')) return;
    const main = document.querySelector('main');
    if (!main) return;
    const sec = document.createElement('section');
    sec.className = 'page page-team';
    sec.dataset.pageView = 'team';
    sec.innerHTML = `
      <div class="page-heading"><span class="eyebrow">BUSINESS OPS</span><h1>Operasional</h1><p>Kelola stok, HPP, pengeluaran, dan aktivitas Kitchen & Waiter.</p></div>
      <div id="opsRoot" class="ops-wrap"></div>
    `;
    const footer = main.querySelector('footer');
    main.insertBefore(sec, footer);
    const menu = $('sideMenu');
    if (menu && !menu.querySelector('[data-page="team"]')) {
      const b = document.createElement('button');
      b.className = 'menu-item'; b.dataset.page = 'team'; b.type = 'button';
      b.innerHTML = '<span>🧑‍🍳</span><div><b>Operasional</b><small>Stok, HPP & aktivitas team</small></div>';
      const logout = menu.querySelector('[data-menu-action="logout"]');
      if (logout) menu.insertBefore(b, logout); else menu.appendChild(b);
      b.addEventListener('click', () => { window.showPage?.('team'); });
    }
  }

  function stockValue() { return stock().reduce((a,x) => a + num(x.qty) * num(x.cost), 0); }
  function renderSummary() {
    const s = stock();
    const low = s.filter(x => num(x.qty) <= num(x.min));
    const el = $('opsSummary'); if (!el) return;
    el.innerHTML = `<div class="ops-stat"><small>BAHAN</small><b>${s.length}</b><span class="ops-muted">jenis bahan</span></div><div class="ops-stat ${low.length?'ops-low':''}"><small>STOK MENIPIS</small><b>${low.length}</b><span class="ops-muted">perlu diperiksa</span></div><div class="ops-stat"><small>NILAI STOK</small><b>${money(stockValue())}</b><span class="ops-muted">estimasi nilai bahan</span></div>`;
  }

  function renderStock() {
    const el = $('opsStockList'); if (!el) return;
    const s = stock();
    el.innerHTML = s.length ? s.map((x,i) => {
      const low = num(x.qty) <= num(x.min);
      return `<div class="ops-row ${low?'ops-low':''}"><div class="ops-row-main"><b>${esc(x.name)} ${low?'⚠️':''}</b><small>Sisa ${num(x.qty)} ${esc(x.unit)} · ${money(x.cost)}/${esc(x.unit)} · minimum ${num(x.min)} ${esc(x.unit)}</small></div><div class="ops-actions"><button data-in="${i}">+ Masuk</button><button data-out="${i}">− Keluar</button><button data-count="${i}">⚖ Sisa</button><button data-del="${i}">Hapus</button></div></div>`;
    }).join('') : '<div class="ops-empty">Belum ada bahan. Tambahkan stok pertama di form di bawah.</div>';
    el.querySelectorAll('[data-in]').forEach(b=>b.onclick=()=>adjustStock(+b.dataset.in,1));
    el.querySelectorAll('[data-out]').forEach(b=>b.onclick=()=>adjustStock(+b.dataset.out,-1));
    el.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>physicalCount(+b.dataset.count));
    el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>deleteStock(+b.dataset.del));
  }

  function adjustStock(i, sign) {
    const s=stock(), x=s[i]; if(!x)return;
    const amount=num(prompt(`${sign>0?'Stok masuk':'Stok keluar'} ${x.name} (${x.unit})`, '1')); if(!amount)return;
    x.qty=Math.max(0,num(x.qty)+sign*amount); x.updatedAt=new Date().toISOString(); write(K.stock,s);
    addQueue(sign>0?'stock_in':'stock_out',{name:x.name,qty:amount,unit:x.unit,newQty:x.qty}); renderAll();
  }
  function physicalCount(i) {
    const s=stock(), x=s[i]; if(!x)return;
    const actual=Number(prompt(`Sisa fisik ${x.name} (${x.unit})`, String(x.qty))); if(!Number.isFinite(actual)||actual<0)return;
    const diff=actual-num(x.qty); x.qty=actual; x.updatedAt=new Date().toISOString(); write(K.stock,s);
    addQueue('physical_count',{name:x.name,actual,difference:diff,unit:x.unit}); renderAll();
  }
  function deleteStock(i) { const s=stock(); if(!s[i])return; if(confirm(`Hapus ${s[i].name}?`)){s.splice(i,1);write(K.stock,s);renderAll();} }
  function addStockFromForm() {
    const name=$('stockName')?.value.trim(), qty=num($('stockQty')?.value), unit=$('stockUnit')?.value||'kg', cost=num($('stockCost')?.value), min=num($('stockMin')?.value);
    if(!name)return alert('Nama bahan wajib diisi.');
    const s=stock(); const existing=s.find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.unit===unit);
    if(existing){existing.qty+=qty;existing.cost=cost||existing.cost;existing.min=min;}
    else s.push({id:uid(),name,qty,unit,cost,min,createdAt:new Date().toISOString()});
    write(K.stock,s); addQueue('stock_created',{name,qty,unit,cost,min});
    ['stockName','stockQty','stockCost','stockMin'].forEach(id=>{if($(id))$(id).value=''}); renderAll();
  }

  function recipeFor(product) { const r=recipes(); return Array.isArray(r[product]) ? r[product] : []; }
  function recipeCost(product) { return recipeFor(product).reduce((sum,item)=>{const b=stock().find(x=>x.id===item.stockId);return sum+(b?num(item.qty)*num(b.cost):0)},0); }
  function renderRecipe() {
    const p=$('recipeProduct')?.value; const list=$('recipeList'); const hpp=$('recipeHpp'); if(!list||!hpp)return;
    const r=recipeFor(p); hpp.textContent=money(recipeCost(p))+' / produk';
    list.innerHTML=r.length?r.map((x,i)=>{const b=stock().find(s=>s.id===x.stockId);return `<div class="ops-recipe-row"><select data-rstock="${i}">${stock().map(s=>`<option value="${s.id}" ${s.id===x.stockId?'selected':''}>${esc(s.name)}</option>`).join('')}</select><input data-rqty="${i}" type="number" min="0" step="0.001" value="${num(x.qty)}"><span class="ops-muted">${esc(b?.unit||'unit')}</span><button class="ops-btn secondary" data-rdel="${i}">×</button></div>`}).join(''):'<div class="ops-empty">Belum ada resep. Tambahkan bahan yang dipakai untuk 1 produk.</div>';
    list.querySelectorAll('[data-rstock]').forEach(e=>e.onchange=()=>{const a=recipes();a[p][+e.dataset.rstock].stockId=e.value;write(K.recipes,a);renderRecipe()});
    list.querySelectorAll('[data-rqty]').forEach(e=>e.oninput=()=>{const a=recipes();a[p][+e.dataset.rqty].qty=num(e.value);write(K.recipes,a);renderRecipe()});
    list.querySelectorAll('[data-rdel]').forEach(e=>e.onclick=()=>{const a=recipes();a[p].splice(+e.dataset.rdel,1);write(K.recipes,a);renderRecipe()});
  }
  function renderRecipeProducts() {
    const sel=$('recipeProduct'); if(!sel)return; const p=products(); const old=sel.value; sel.innerHTML=p.map(x=>`<option value="${esc(x[0])}">${esc(x[0])}</option>`).join(''); if(old&&p.some(x=>x[0]===old))sel.value=old; renderRecipe();
  }
  function addRecipeItem(){const p=$('recipeProduct')?.value; if(!p)return; const b=stock()[0]; if(!b)return alert('Tambahkan bahan stok terlebih dahulu.'); const a=recipes();a[p]=recipeFor(p);a[p].push({stockId:b.id,qty:0});write(K.recipes,a);renderRecipe()}

  function addExpense() {
    const name=$('opsExpenseName')?.value.trim(), qty=num($('opsExpenseQty')?.value), unit=$('opsExpenseUnit')?.value||'pcs', unitCost=num($('opsExpenseCost')?.value), total=qty*unitCost;
    if(!name||!qty||!unitCost)return alert('Nama, jumlah, dan harga satuan wajib diisi.');
    const item={id:uid(),date:new Date().toISOString().slice(0,10),name,qty,unit,unitCost,total,by:session()?.name||'Staff',createdAt:new Date().toISOString()};
    const a=ops();a.unshift(item);write(K.ops,a);addQueue('expense',{name,qty,unit,unitCost,total});
    ['opsExpenseName','opsExpenseQty','opsExpenseCost'].forEach(id=>{if($(id))$(id).value=''});renderExpenses();renderQueue();
  }
  function renderExpenses(){const el=$('opsExpenseList');if(!el)return;const a=ops();el.innerHTML=a.length?a.slice(0,20).map(x=>`<div class="ops-row"><div class="ops-row-main"><b>${esc(x.name)}</b><small>${num(x.qty)} ${esc(x.unit)} × ${money(x.unitCost)} · ${esc(x.date)} · ${esc(x.by)}</small></div><strong>${money(x.total)}</strong></div>`).join(''):'<div class="ops-empty">Belum ada pengeluaran operasional.</div>'}

  function renderQueue(){const el=$('opsQueue');if(!el)return;const a=queue();el.innerHTML=a.length?a.slice(0,30).map(x=>`<div class="ops-row"><div class="ops-row-main"><b>${esc(x.type.replaceAll('_',' '))}</b><small>${esc(x.by)} · ${new Date(x.createdAt).toLocaleString('id-ID')} · ${esc(JSON.stringify(x.payload))}</small></div><div class="ops-actions"><span class="ops-badge">${esc(x.status)}</span>${session()?.role==='owner'&&x.status==='pending'?`<button data-qok="${x.id}">Terima</button><button data-qdel="${x.id}">Hapus</button>`:''}</div></div>`).join(''):'<div class="ops-empty">Belum ada aktivitas.</div>';
    el.querySelectorAll('[data-qok]').forEach(b=>b.onclick=()=>setQueue(b.dataset.qok,'approved'));el.querySelectorAll('[data-qdel]').forEach(b=>b.onclick=()=>setQueue(b.dataset.qdel,'deleted'));
  }
  function setQueue(id,status){let a=queue();a=status==='deleted'?a.filter(x=>x.id!==id):a.map(x=>x.id===id?{...x,status}:x);write(K.queue,a);renderQueue()}

  function renderStaff(){const el=$('opsStaff');if(!el)return;el.innerHTML=users().map(x=>`<div class="ops-row"><div class="ops-row-main"><b>${esc(x.name)}</b><small>${esc(x.username)} · ${roles[x.role]||x.role}</small></div>${x.role!=='owner'?`<button data-staffdel="${x.id}" class="ops-btn danger">Hapus</button>`:''}</div>`).join('');el.querySelectorAll('[data-staffdel]').forEach(b=>b.onclick=()=>{if(confirm('Hapus akun ini?')){write(K.users,users().filter(x=>x.id!==b.dataset.staffdel));renderStaff()}})}
  function addStaff(){const name=prompt('Nama karyawan:'),role=prompt('Role: manager / kitchen / waiter','waiter'),username=prompt('Username:'),password=prompt('Password:');if(!name||!['manager','kitchen','waiter'].includes(role)||!username||!password)return;const u=users();if(u.some(x=>x.username===username))return alert('Username sudah dipakai.');u.push({id:uid(),name:name.trim(),username:username.trim().toLowerCase(),password,role});write(K.users,u);renderStaff()}

  function renderRoot(){
    const s=session(), role=s?.role||'owner', owner=role==='owner', manager=role==='manager', kitchen=role==='kitchen';
    const root=$('opsRoot'); if(!root)return;
    root.innerHTML=`
      <div class="ops-note">${role==='kitchen'?'🍳 Kitchen: catat stok masuk, stok keluar, sisa fisik, dan waste.':role==='waiter'?'🧑‍🍳 Waiter: gunakan Penjualan untuk mencatat transaksi. Aktivitas operasional dapat dipantau Owner.':'👑 '+roles[role]+': pantau stok, HPP, pengeluaran, dan aktivitas tim.'}</div>
      <div id="opsSummary" class="ops-stat-grid"></div>
      <div class="ops-grid">
        <section class="ops-card"><div class="ops-head"><div><span class="eyebrow">INVENTORY</span><h2>Stok Bahan</h2><div class="ops-muted">Satuan bisa kg, gram, L, ml, pcs, pack, atau dus.</div></div></div><div id="opsStockList" class="ops-list"></div></section>
        <section class="ops-card"><div class="ops-head"><div><span class="eyebrow">CATAT</span><h2>Tambah / Terima Stok</h2></div></div><div class="ops-form"><label>Nama bahan<input id="stockName" placeholder="Ayam"></label><label>Jumlah<input id="stockQty" type="number" min="0" step="0.001" placeholder="10"></label><label>Satuan<select id="stockUnit">${units.map(u=>`<option>${u}</option>`).join('')}</select></label><label>Harga per satuan<input id="stockCost" type="number" min="0" step="1" placeholder="35000"></label><label>Minimum stok<input id="stockMin" type="number" min="0" step="0.001" placeholder="2"></label><div class="ops-full"><button id="stockAdd" class="ops-btn">+ Simpan Stok</button></div></div></section>
        <section class="ops-card"><div class="ops-head"><div><span class="eyebrow">HPP</span><h2>Resep & HPP / Produk</h2><div class="ops-muted">Pemakaian bahan dihitung untuk 1 produk.</div></div><b id="recipeHpp" class="ops-hpp">Rp0 / produk</b></div><div class="ops-form"><label class="ops-full">Produk<select id="recipeProduct"></select></label></div><div id="recipeList"></div><button id="recipeAdd" class="ops-btn secondary" style="margin-top:9px">+ Bahan ke Resep</button></section>
        <section class="ops-card"><div class="ops-head"><div><span class="eyebrow">EXPENSE</span><h2>Pengeluaran per Satuan</h2><div class="ops-muted">Contoh: ayam 10 kg × Rp35.000 = Rp350.000.</div></div></div><div class="ops-form"><label>Nama<input id="opsExpenseName" placeholder="Ayam mentah"></label><label>Jumlah<input id="opsExpenseQty" type="number" min="0" step="0.001" placeholder="10"></label><label>Satuan<select id="opsExpenseUnit">${units.map(u=>`<option>${u}</option>`).join('')}</select></label><label>Harga / satuan<input id="opsExpenseCost" type="number" min="0" step="1" placeholder="35000"></label><div class="ops-full"><button id="opsExpenseAdd" class="ops-btn">+ Catat Pengeluaran</button></div></div><div id="opsExpenseList" class="ops-list" style="margin-top:12px"></div></section>
        <section class="ops-card"><div class="ops-head"><div><span class="eyebrow">OWNER INBOX</span><h2>Aktivitas Tim</h2><div class="ops-muted">Kitchen/Waiter mengirim catatan ke sini.</div></div></div><div id="opsQueue" class="ops-list"></div></section>
        ${owner||manager?`<section class="ops-card"><div class="ops-head"><div><span class="eyebrow">TEAM ACCESS</span><h2>Akun Karyawan</h2></div><button id="staffAdd" class="ops-btn">+ Akun</button></div><div id="opsStaff" class="ops-list"></div></section>`:''}
      </div>`;
    $('stockAdd').onclick=addStockFromForm;$('recipeAdd').onclick=addRecipeItem;$('recipeProduct').onchange=renderRecipe;$('opsExpenseAdd').onclick=addExpense;
    renderAll(); renderRecipeProducts(); if(owner||manager)renderStaff();
  }

  function renderAll(){renderSummary();renderStock();renderExpenses();renderQueue();}
  function boot(){if(window.__opsBooted)return; if(!session())return;window.__opsBooted=true;injectStyles();addPages();renderRoot();}
  window.Operational={refresh:()=>{window.__opsBooted=false;boot()},stock,recipes,ops,queue};
  window.addEventListener('business-auth-ready',boot);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();