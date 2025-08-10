// ====== НАСТРОЙКА ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev'; // твой Worker
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

  pfList: byId('pf-list'),
  pfCoin: byId('pf-coin'),
  pfAmount: byId('pf-amount'),
  pfAdd: byId('pf-add'),
  pfTotal: byId('pf-total'),
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

const formatMoney = (v) => {
  try { return Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0)); }
  catch { return `$${v}`; }
};

// API с авто-реавторизацией
async function api(path, opts = {}, retry = true) {
  const init = { method:'GET', headers:{ 'Content-Type':'application/json', ...headers(), ...(opts.headers||{}) }, ...opts };
  const res = await fetch(`${API_URL}${path}`, init);
  let data = {}; try { data = await res.json(); } catch {}
  if (!res.ok) {
    const needReauth = data && (data.error === 'no_token' || data.error === 'bad_token');
    if (retry && needReauth) {
      localStorage.removeItem('pb_token'); TOKEN = '';
      const ok = await auth();
      if (ok) return api(path, opts, false);
    }
    throw data;
  }
  return data;
}

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
    setHelp('Открой через кнопку у бота.'); return false;
  }
  let initData = tg.initData;
  if(!initData || initData.length===0){
    const fb = buildInitDataFromUnsafe(tg.initDataUnsafe);
    if(fb) initData = fb;
  }
  if(!initData || initData.length===0){
    setStatus('Открыто в Telegram, но initData пустая.', 'err');
    setHelp('Обнови Telegram и открой через кнопку у бота.'); return false;
  }
  setStatus('Авторизация…');
  try{
    const res = await api('/api/auth/telegram', { method:'POST', body: JSON.stringify({ initData }) }, false);
    if(res.ok && res.token){
      TOKEN = res.token; localStorage.setItem('pb_token', TOKEN);
      setStatus('Готово: авторизация', 'ok');
      els.userId.textContent = res.user?.id ? `User ID: ${res.user.id}` : '';
      setHelp(''); return true;
    } else { setStatus('Ошибка авторизации', 'err'); setHelp(res.reason || res.error || ''); return false; }
  }catch(e){
    setStatus('Ошибка авторизации', 'err');
    setHelp((e && (e.reason || e.error)) ? JSON.stringify(e) : 'unknown'); return false;
  }
}
async function ensureAuth(){ if (TOKEN) return true; return await auth(); }

/* ===== CRM & Tasks ===== */
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
async function loadAll(){
  const [clients, tasks] = await Promise.all([ api('/api/crm/clients'), api('/api/tasks') ]);
  renderClients(clients); renderTasks(tasks);
}

/* ===== Crypto: Market ===== */
let lastMarkets = []; // кэш цен для портфеля

function renderCrypto(list = []) {
  lastMarkets = Array.isArray(list) ? list : [];
  els.cryptoList.innerHTML = list.length
    ? list.map(c => {
        const sym = (c.symbol || '').toUpperCase();
        const pct = Number(c.price_change_percentage_24h || 0);
        const cls = pct >= 0 ? 'chg-up' : 'chg-down';
        const pctStr = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
        const icon = c.image
          ? `<img src="${c.image}" alt="${escapeHtml(sym)}"/>`
          : `<span class="avatar" data-sym="${escapeHtml(sym)}">${escapeHtml(sym[0] || '?')}</span>`;
        const mc = Number(c.market_cap || 0);
        return `
          <div class="item">
            <div class="coin">
              ${icon}
              <div class="item__title">${escapeHtml(c.name || sym)} <span class="muted">(${escapeHtml(sym)})</span></div>
            </div>
            <div class="item__row">
              <span class="pill">${formatMoney(c.current_price)}</span>
              <span class="pill ${cls}">${pctStr}</span>
              ${mc > 0 ? `<span class="muted">MC Cap: ${Intl.NumberFormat('en-US',{notation:'compact'}).format(mc)}</span>` : ``}
            </div>
          </div>`;
      }).join('')
    : `<div class="muted">Нет данных. Нажмите «Обновить».</div>`;

  // пересчитать портфель после обновления рынка
  loadPortfolio(true);
}
async function loadCrypto(ids=['bitcoin','ethereum','toncoin'], vs='usd'){
  const q = `/api/crypto/markets?ids=${encodeURIComponent(ids.join(','))}&vs=${encodeURIComponent(vs)}`;
  const data = await api(q);
  if (Array.isArray(data)) renderCrypto(data);
}

/* ===== Crypto: Portfolio ===== */
function priceById(id){ const m = lastMarkets.find(x => x.id === id); return m ? Number(m.current_price || 0) : 0; }
function symName(id){
  if (id === 'bitcoin') return {sym:'BTC', name:'Bitcoin'};
  if (id === 'ethereum') return {sym:'ETH', name:'Ethereum'};
  if (id === 'toncoin') return {sym:'TON', name:'Toncoin'};
  return {sym:id.slice(0,3).toUpperCase(), name:id};
}
function renderPortfolioList(list){
  let total = 0;
  els.pfList.innerHTML = list.length
    ? list.map(r => {
        const {sym, name} = symName(r.coin);
        const price = priceById(r.coin);
        const value = Number(r.amount || 0) * price;
        total += value;
        return `
          <div class="item">
            <div class="item__title">${name} <span class="muted">(${sym})</span></div>
            <div class="item__row">
              <span>Кол-во: <b>${r.amount}</b></span>
              <span class="pill">${formatMoney(price)} / ${sym}</span>
              <span class="pill">${formatMoney(value)}</span>
              <button class="btn-del right" data-del="${r.id}">Удалить</button>
            </div>
          </div>`;
      }).join('')
    : `<div class="muted">Пока пусто — добавьте монету выше.</div>`;
  els.pfTotal.textContent = `Итого: ${formatMoney(total)}`;

  els.pfList.querySelectorAll('[data-del]').forEach(btn=>{
    btn.addEventListener('click', async e=>{
      const id = Number(e.currentTarget.getAttribute('data-del'));
      await api(`/api/crypto/portfolio/${id}`, { method:'DELETE' });
      await loadPortfolio(true);
    });
  });
}
async function loadPortfolio(silent=false){
  const list = await api('/api/crypto/portfolio');
  renderPortfolioList(Array.isArray(list) ? list : []);
  if (!silent) setStatus('Портфель обновлён', 'ok');
}
async function addPortfolioItem(){
  const coin = els.pfCoin.value;
  const amount = parseFloat(els.pfAmount.value);
  if (!coin || !amount || isNaN(amount) || amount <= 0) return;
  await api('/api/crypto/portfolio', { method:'POST', body: JSON.stringify({ coin, amount }) });
  els.pfAmount.value = '';
  await loadPortfolio(true);
}

/* ===== Авто-обновление цен (10с) ===== */
let cryptoTimer = null;
function startAutoCrypto(periodMs = 10000){
  stopAutoCrypto();
  cryptoTimer = setInterval(() => { loadCrypto(); }, periodMs);
}
function stopAutoCrypto(){ if (cryptoTimer){ clearInterval(cryptoTimer); cryptoTimer = null; } }
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAutoCrypto(); else startAutoCrypto(10000);
});

/* ===== Wire & Boot ===== */
function wire(){
  els.addClient?.addEventListener('click', addDemoClient);
  els.addTask?.addEventListener('click', addDemoTask);
  els.cryptoRefresh?.addEventListener('click', async () => {
    els.cryptoRefresh.disabled = true;
    await loadCrypto();
    setTimeout(() => { els.cryptoRefresh.disabled = false; }, 3000);
  });
  els.pfAdd?.addEventListener('click', addPortfolioItem);
}

async function boot(){
  try{
    if(tg){
      tg.ready(); tg.setBackgroundColor?.('#0f1115'); tg.setHeaderColor?.('#171a21');
      tg.expand?.(); tg.disableVerticalSwipes?.();
      dbg(`tg OK • v:${tg.version||'?'} • ${tg.platform||'platform?'} • initData:${tg.initData?.length||0}`);
    }
  }catch(e){ dbg('tg error: ' + String(e)); }

  wire();

  const ok = await ensureAuth();
  if (!ok) { setStatus('Авторизация не выполнена', 'err'); return; }

  setStatus('Загрузка…');
  await loadAll();
  await loadCrypto();       // первая загрузка цен
  await loadPortfolio(true);
  startAutoCrypto(10000);   // авто-обновление каждые 10 сек
  setStatus('Готово', 'ok');
}

boot();
