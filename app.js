// ====== НАСТРОЙКА ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev';
// =======================

const tg = window.Telegram?.WebApp;

// helpers
const byId = (id) => document.getElementById(id);
const els = {
  status: byId('status'),
  statusHelp: byId('status-help'),
  userId: byId('user-id'),
  clients: byId('clients-list'),
  tasks: byId('tasks-list'),
  addClient: byId('add-demo-client'),
  addTask: byId('add-demo-task'),
  cryptoList: byId('crypto-list'),
  cryptoRefresh: byId('refresh-crypto'),
};
const dbgBox = byId('dbg');
const dbg = (m) => { if (dbgBox) dbgBox.textContent = String(m); console.log('[DBG]', m); };

let TOKEN = localStorage.getItem('pb_token') || '';
const headers = () => TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

function setStatus(t, type=''){ els.status.classList.remove('ok','err'); if(type) els.status.classList.add(type); els.status.textContent=t; }
function setHelp(t){ els.statusHelp.textContent = t || ''; }

const escapeHtml = (s='') => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;')
  .replaceAll("'",'&#039;');

function formatMoney(v){ try{ return Intl.NumberFormat('en',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);}catch{return `$${v}`;} }

function renderClients(list=[]){
  els.clients.innerHTML = list.length
    ? list.map(c => `
      <div class="item">
        <div class="item__title">${escapeHtml(c.company || c.title || 'Компания')}</div>
        <div class="item__row">
          <span>Этап: ${escapeHtml(c.stage || 'Negotiation')}</span>
          <span>Менеджер: ${escapeHtml(c.owner || '—')}</span>
          <span>Сумма: ${formatMoney(c.amount || 0)}</span>
        </div>
      </div>`).join('')
    : `<div class="muted">Пока пусто — добавьте демо-сделку.</div>`;
}
function renderTasks(list=[]){
  els.tasks.innerHTML = list.length
    ? list.map(t => `
      <div class="item">
        <div class="item__title">${escapeHtml(t.title || 'Задача')}</div>
        <div class="item__row">
          <span>Тег: ${escapeHtml(t.tag || 'sales')}</span>
          <span>Срок: ${escapeHtml(t.due || 'Сегодня')}</span>
          <span>Статус: ${escapeHtml(t.status || 'inprogress')}</span>
        </div>
      </div>`).join('')
    : `<div class="muted">Пока пусто — добавьте демо-задачу.</div>`;
}

async function api(path, opts={}){
  const init = { method:'GET', headers:{ 'Content-Type':'application/json', ...headers(), ...(opts.headers||{}) }, ...opts };
  const res = await fetch(`${API_URL}${path}`, init);
  let data = {}; try{ data = await res.json(); }catch{}
  if(!res.ok) throw data;
  return data;
}

// Desktop fallback: собрать initData из initDataUnsafe
function buildInitDataFromUnsafe(unsafe){
  if(!unsafe) return '';
  const p = new URLSearchParams();
  if(unsafe.query_id)    p.set('query_id', unsafe.query_id);
  if(unsafe.user)        p.set('user', JSON.stringify(unsafe.user));
  if(unsafe.auth_date)   p.set('auth_date', String(unsafe.auth_date));
  if(unsafe.hash)        p.set('hash', unsafe.hash);
  if(unsafe.start_param) p.set('start_param', unsafe.start_param);
  return p.toString();
}

async function auth(){
  if(!tg){
    setStatus('Открыто вне Telegram. Авторизация не выполнена.', 'err');
    setHelp('Открой через кнопку у бота.');
    return false;
  }
  let initData = tg.initData;
  if(!initData || initData.length===0){
    const fb = buildInitDataFromUnsafe(tg.initDataUnsafe);
    if(fb) initData = fb;
  }
  if(!initData || initData.length===0){
    setStatus('Открыто в Telegram, но initData пустая.', 'err');
    setHelp('Обнови Telegram и открой через кнопку у бота.');
    return false;
  }
  setStatus('Авторизация…');
  try{
    const res = await api('/api/auth/telegram', { method:'POST', body: JSON.stringify({ initData }) });
    if(res.ok && res.token){
      TOKEN = res.token; localStorage.setItem('pb_token', TOKEN);
      setStatus('Готово: авторизация по токену', 'ok');
      els.userId.textContent = res.user?.id ? `User ID: ${res.user.id}` : '';
      setHelp('');
      return true;
    }else{
      setStatus('Ошибка авторизации', 'err'); setHelp(res.reason || res.error || ''); return false;
    }
  }catch(e){
    setStatus('Ошибка авторизации', 'err');
    setHelp((e && (e.reason || e.error)) ? JSON.stringify(e) : 'unknown');
    return false;
  }
}

async function loadAll(){
  try{
    const [clients, tasks] = await Promise.all([ api('/api/crm/clients'), api('/api/tasks') ]);
    renderClients(clients); renderTasks(tasks);
  }catch(e){
    if(e && (e.error==='no_token' || e.error==='bad_token')){
      localStorage.removeItem('pb_token'); TOKEN='';
      setStatus('Сессия истекла — открой через кнопку у бота.', 'err'); return;
    }
    console.error(e);
  }
}

/* ── CRYPTO ─────────────────────────────────────────── */
function renderCrypto(list=[]){
  els.cryptoList.innerHTML = list.length
    ? list.map(c => {
        const chg = Number(c.price_change_percentage_24h || 0);
        const cls = chg >= 0 ? 'chg-up' : 'chg-down';
        const pct = (chg>=0?'+':'') + chg.toFixed(2) + '%';
        return `
          <div class="item">
            <div class="coin">
              <img src="${c.image}" alt="${escapeHtml(c.symbol)}"/>
              <div class="item__title">${escapeHtml(c.name)} <span class="muted">(${escapeHtml(c.symbol.toUpperCase())})</span></div>
            </div>
            <div class="item__row">
              <span class="pill">${Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c.current_price)}</span>
              <span class="pill ${cls}">${pct}</span>
              <span class="muted">MC Cap: ${Intl.NumberFormat('en-US',{notation:'compact'}).format(c.market_cap || 0)}</span>
            </div>
          </div>`;
      }).join('')
    : `<div class="muted">Нет данных. Нажмите «Обновить».</div>`;
}
async function loadCrypto(ids=['bitcoin','ethereum','toncoin'], vs='usd'){
  try{
    const q = `/api/crypto/markets?ids=${encodeURIComponent(ids.join(','))}&vs=${encodeURIComponent(vs)}`;
    const data = await api(q);
    if (Array.isArray(data)) {
      renderCrypto(data);
    } else {
      throw data;
    }
  }catch(e){
    console.error(e);
    const reason = e?.details
      ? ` (CG: ${e.details?.coingecko?.status ?? '?'}; CC: ${e.details?.cryptocompare?.status ?? '?'}; CP: ${e.details?.coinpaprika?.status ?? '?'})`
      : (e?.error ? ` (${e.error})` : '');
    els.cryptoList.innerHTML = `<div class="muted">Не удалось загрузить рынок${reason}.</div>`;
  }
}
/* ───────────────────────────────────────────────────── */

async function addDemoClient(){ await api('/api/crm/clients', { method:'POST', body: JSON.stringify({ company:'Acme Corp', stage:'Negotiation', owner:'Мария', amount:24000 }) }); await loadAll(); }
async function addDemoTask(){ await api('/api/tasks', { method:'POST', body: JSON.stringify({ title:'Позвонить Acme', tag:'sales', due:'Сегодня', status:'inprogress' }) }); await loadAll(); }

function wire(){
  els.addClient?.addEventListener('click', addDemoClient);
  els.addTask?.addEventListener('click', addDemoTask);
  els.cryptoRefresh?.addEventListener('click', () => loadCrypto());
}

async function boot(){
  try{
    if(tg){
      tg.ready(); tg.setBackgroundColor?.('#0f1115'); tg.setHeaderColor?.('#171a21');
      tg.expand?.(); tg.disableVerticalSwipes?.();
      if (tg.platform === 'tdesktop') {
        const r = document.documentElement.style;
        r.setProperty('--bg','#0f1115'); r.setProperty('--card','#171a21'); r.setProperty('--text','#e8ecf1');
        r.setProperty('--muted','#99a2b1'); r.setProperty('--accent','#3b82f6'); r.setProperty('--accent-text','#fff'); r.setProperty('--border','rgba(255,255,255,.12)');
      }
      dbg(`tg OK • v:${tg.version || '?'} • ${tg.platform || 'platform?'} • initData:${tg.initData?.length || 0}`);
    }else{ dbg('tg = undefined (SDK не подхватился)'); }
  }catch(e){ dbg('tg error: ' + String(e)); }

  wire();

  if(TOKEN){
    setStatus('Проверка сессии…');
    try{ await loadAll(); await loadCrypto(); setStatus('Готово: авторизация по токену', 'ok'); return; }
    catch{ localStorage.removeItem('pb_token'); TOKEN=''; }
  }

  const ok = await auth();
  if(ok){ await loadAll(); await loadCrypto(); }
}

boot();
