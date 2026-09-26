/* Staff account manager for Business Manager V2 - local prototype. */
(() => {
  const USERS = 'owner_dashboard_users_v1';
  const SESSION = 'owner_dashboard_session_v1';
  const $ = id => document.getElementById(id);
  const read = () => { try { return JSON.parse(localStorage.getItem(USERS)) || []; } catch { return []; } };
  const save = v => localStorage.setItem(USERS, JSON.stringify(v));
  const session = () => { try { return JSON.parse(localStorage.getItem(SESSION)); } catch { return null; } };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roleName = { manager:'Manager', kitchen:'Kitchen', waiter:'Waiter / Penjual' };
  const slug = v => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'').slice(0,24) || 'staff';
  const code = () => Math.random().toString(36).slice(2,6).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();

  function styles(){
    if($('staffStyles')) return;
    const s=document.createElement('style'); s.id='staffStyles'; s.textContent=`
      .staff-wrap{display:grid;gap:16px}.staff-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}.staff-card{padding:18px;border-radius:20px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)}
      .staff-form{display:grid;gap:11px}.staff-form label{display:grid;gap:6px;font-size:12px;opacity:.88}.staff-form input,.staff-form select{box-sizing:border-box;width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#071426;color:#fff;outline:none}.staff-form input:focus,.staff-form select:focus{border-color:#58a6ff}.staff-btn{padding:11px 14px;border:0;border-radius:12px;background:#fff;color:#071426;font-weight:800;cursor:pointer}.staff-list{display:grid;gap:9px}.staff-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07)}.staff-main{min-width:0}.staff-main b{display:block}.staff-main small{display:block;opacity:.62;margin-top:3px}.staff-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.staff-actions button{padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:transparent;color:inherit;cursor:pointer}.staff-info-btn{width:34px;height:34px;flex:0 0 34px;padding:0!important;border-radius:50%!important;border:1px solid rgba(88,166,255,.35)!important;background:rgba(20,45,75,.75)!important;color:#8ec5ff!important;font-size:18px;font-weight:900;line-height:1;cursor:pointer}.staff-info-btn:active{transform:scale(.94)}.staff-credential{margin-top:12px;padding:13px;border-radius:13px;background:rgba(88,166,255,.08);border:1px solid rgba(88,166,255,.18);font-size:13px}.staff-credential code{font-size:14px}.staff-note{font-size:12px;opacity:.62;line-height:1.5}.staff-empty{padding:16px;text-align:center;opacity:.55;border:1px dashed rgba(255,255,255,.12);border-radius:13px}
      .staff-info-modal{position:fixed;inset:0;z-index:99999;background:rgba(2,8,18,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px}.staff-info-dialog{width:min(430px,100%);background:#0b1a2b;border:1px solid rgba(100,170,255,.25);border-radius:22px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.5);position:relative;color:#eef6ff}.staff-info-close{position:absolute;right:14px;top:12px;border:0;background:transparent;color:#a9bfd8;font-size:28px;cursor:pointer}.staff-info-title{font-size:22px;font-weight:800;margin-bottom:20px}.staff-info-dialog label{display:block;color:#8fa9c4;font-size:13px;margin:12px 0}.staff-info-dialog input{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:12px 14px;border-radius:12px;border:1px solid rgba(130,180,230,.16);background:#071424;color:#edf6ff}.staff-info-note{font-size:12px;color:#718aa5;margin-top:16px;line-height:1.5}
      @media(max-width:700px){.staff-grid{grid-template-columns:1fr}.staff-row{align-items:flex-start;flex-direction:column}.staff-actions{width:100%}}
    `;document.head.appendChild(s);
  }

  function addPage(){
    if(document.querySelector('[data-page-view="staff"]')) return;
    const main=document.querySelector('main'); if(!main)return;
    const sec=document.createElement('section'); sec.className='page page-staff'; sec.dataset.pageView='staff';
    sec.innerHTML=`<div class="page-heading"><span class="eyebrow">TEAM ACCESS</span><h1>Tim & Akun</h1><p>Buat akun khusus Manager, Kitchen, dan Waiter / Penjual.</p></div><div id="staffRoot" class="staff-wrap"></div>`;
    main.insertBefore(sec,main.querySelector('footer'));
    const menu=$('sideMenu');
    if(menu&&!menu.querySelector('[data-page="staff"]')){const b=document.createElement('button');b.className='menu-item';b.dataset.page='staff';b.type='button';b.innerHTML='<span>👥</span><div><b>Tim & Akun</b><small>Buat dan kelola akun staff</small></div>';const logout=menu.querySelector('[data-menu-action="logout"]');if(logout)menu.insertBefore(b,logout);else menu.appendChild(b);b.onclick=()=>window.showPage?.('staff');}
  }

  function openInfo(username){
    const u=read().find(x=>x.username===username); if(!u)return;
    const modal=document.createElement('div'); modal.className='staff-info-modal';
    modal.innerHTML=`<div class="staff-info-dialog"><button class="staff-info-close" aria-label="Tutup">×</button><div class="staff-info-title">Informasi Akun</div><label>Nama Karyawan<input value="${esc(u.name||'')}" disabled></label><label>Bagian<input value="${esc(roleName[u.role]||u.role||'')}" disabled></label><label>WhatsApp<input value="${esc(u.phone||'-')}" disabled></label><label>Kode Toko<input value="${esc(u.storeCode||'-')}" disabled></label><label>Username<input value="${esc(u.username||'')}" disabled></label><div class="staff-info-note">Ini membantu Owner mengecek identitas akun saat lupa bagian, nomor WhatsApp, kode toko, atau username.</div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.staff-info-close').onclick=()=>modal.remove();
    modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
  }

  function render(){
    const root=$('staffRoot'); if(!root)return;
    const s=session(); const isOwner=s?.role==='owner';
    if(!isOwner){root.innerHTML='<div class="staff-card"><b>Akses terbatas</b><p class="staff-note">Hanya Owner yang dapat membuat dan mengelola akun staff.</p></div>';return;}
    const staff=read().filter(u=>u.role!=='owner');
    root.innerHTML=`<div class="staff-grid"><section class="staff-card"><div class="section-head"><div><span class="eyebrow">BUAT AKUN</span><h2>Karyawan Baru</h2></div></div><form id="staffForm" class="staff-form"><label>Nama karyawan<input id="staffName" required placeholder="Contoh: Budi"></label><label>Bagian<select id="staffRole"><option value="manager">Manager</option><option value="kitchen">Kitchen</option><option value="waiter">Waiter / Penjual</option></select></label><label>Nomor WhatsApp<input id="staffPhone" type="tel" required placeholder="08xxxxxxxxxx"></label><label>Kode toko / warung<input id="staffStore" required placeholder="Contoh: AYAMKFC01"></label><button class="staff-btn" type="submit">+ Buat Akun Karyawan</button></form><p class="staff-note">Akun dibuat oleh Owner dan langsung tersimpan di perangkat ini. Untuk produksi dan login antar-HP, data harus dipindahkan ke backend.</p><div id="staffCredential"></div></section><section class="staff-card"><div class="section-head"><div><span class="eyebrow">AKUN STAFF</span><h2>${staff.length} akun</h2></div></div><div id="staffList" class="staff-list">${staff.length?staff.map(u=>`<div class="staff-row"><div class="staff-main"><b>${esc(u.name||u.username)}</b><small>${esc(roleName[u.role]||u.role)} · ${esc(u.phone||'-')} · Toko ${esc(u.storeCode||'-')}</small></div><div class="staff-actions"><button class="staff-info-btn" data-info="${esc(u.username)}" title="Lihat informasi akun" aria-label="Lihat informasi akun">!</button><button data-reset="${esc(u.username)}">Reset Password</button><button data-remove="${esc(u.username)}">Nonaktifkan</button></div></div>`).join(''):'<div class="staff-empty">Belum ada akun karyawan.</div>'}</div></section></div>`;
    $('staffForm').onsubmit=create;
    root.querySelectorAll('[data-info]').forEach(b=>b.onclick=()=>openInfo(b.dataset.info));
    root.querySelectorAll('[data-reset]').forEach(b=>b.onclick=()=>resetPassword(b.dataset.reset));
    root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeStaff(b.dataset.remove));
  }

  function create(e){
    e.preventDefault(); const name=$('staffName').value.trim(), role=$('staffRole').value, phone=$('staffPhone').value.trim(), store=$('staffStore').value.trim().toUpperCase();
    if(!name||!phone||!store)return;
    const users=read(); let base=slug(name), username=base, n=2; while(users.some(u=>u.username===username))username=base+n++;
    const password=code(); const u={id:'staff-'+Date.now().toString(36),username,password,role,name,phone,storeCode:store,createdBy:session()?.username||'',createdAt:new Date().toISOString(),active:true}; users.push(u);save(users);
    $('staffCredential').innerHTML=`<div class="staff-credential"><b>AKUN BERHASIL DIBUAT</b><br>Username: <code>${esc(username)}</code><br>Password: <code>${esc(password)}</code><br>Bagian: <b>${esc(roleName[role])}</b><br>Kode toko: <code>${esc(store)}</code><br><span class="staff-note">Simpan credential ini dan berikan ke karyawan.</span></div>`;
    $('staffForm').reset(); render();
  }
  function resetPassword(username){const users=read(),u=users.find(x=>x.username===username);if(!u)return;const p=code();u.password=p;save(users);alert(`Password baru untuk ${u.name}:\n\n${p}`);}
  function removeStaff(username){const users=read(),u=users.find(x=>x.username===username);if(!u)return;if(confirm(`Nonaktifkan akun ${u.name}?`)){u.active=false;save(users);render();}}
  function init(){styles();addPage();render();}
  window.addEventListener('business-auth-ready',init); if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.renderStaffAccounts=render;
})();
