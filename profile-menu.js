(() => {
  const getSession = () => { try { return JSON.parse(localStorage.getItem('owner_dashboard_session_v1') || 'null'); } catch { return null; } };
  const getProfile = () => { try { return JSON.parse(localStorage.getItem('owner_dashboard_profile_v1') || '{}'); } catch { return {}; } };
  function init() {
    if (document.getElementById('accountCenter')) return;
    const header = document.querySelector('.topbar-inner');
    const menu = document.querySelector('.menu-wrap');
    if (!header) return;
    const oldSettings = document.querySelector('#sideMenu [data-page="settings"]');
    if (oldSettings) oldSettings.remove();
    const wrap = document.createElement('div');
    wrap.id = 'accountCenter';
    wrap.innerHTML = '<button id="accountButton" class="account-button" type="button">▣</button><div id="accountPanel" class="account-panel" hidden><div class="account-head"><div id="accountAvatarLarge">▣</div><div><b id="accountName">Akun</b><small id="accountRole">Owner</small></div></div><hr><button type="button" data-account="profile">✏️ Edit Profil Toko</button><button type="button" data-account="settings">⚙️ Pengaturan Akun</button><button type="button" data-account="logout">↪️ Keluar</button></div>';
    header.insertBefore(wrap, menu || null);
    const style = document.createElement('style');
    style.textContent = '.account-center{position:relative;z-index:120}.account-button{width:42px;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:20px;cursor:pointer}.account-panel{position:absolute;right:0;top:50px;width:245px;padding:12px;border-radius:16px;background:#071426;border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 45px rgba(0,0,0,.35)}.account-panel[hidden]{display:none}.account-head{display:flex;gap:10px;align-items:center}.account-head small{display:block;opacity:.6;margin-top:2px}.account-head>div:first-child{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.08);overflow:hidden}.account-head img{width:100%;height:100%;object-fit:cover}.account-panel hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:10px 0}.account-panel button{display:block;width:100%;text-align:left;padding:11px 10px;border:0;border-radius:10px;background:transparent;color:#fff;cursor:pointer}.account-panel button:hover{background:rgba(255,255,255,.07)}';
    document.head.appendChild(style);
    const panel = document.getElementById('accountPanel');
    document.getElementById('accountButton').onclick = e => { e.stopPropagation(); panel.hidden = !panel.hidden; render(); };
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) panel.hidden = true; });
    wrap.querySelector('[data-account="settings"]').onclick = () => { panel.hidden = true; window.showPage?.('settings'); };
    wrap.querySelector('[data-account="logout"]').onclick = () => { localStorage.removeItem('owner_dashboard_session_v1'); location.reload(); };
    wrap.querySelector('[data-account="profile"]').onclick = () => { panel.hidden = true; alert('Edit Profil Toko siap ditambahkan.'); };
    render();
  }
  function render() { const s = getSession() || {}; const p = getProfile(); const name = p.name || s.name || s.username || 'Akun'; const role = (s.role || 'owner').replace(/^./, x => x.toUpperCase()); document.getElementById('accountName').textContent = name; document.getElementById('accountRole').textContent = role; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();