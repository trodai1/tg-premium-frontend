// ====== НАСТРОЙКА ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev'; // твой Worker
// =======================

const tg = window.Telegram?.WebApp;

// helpers
const $ = (id) => document.getElementById(id);
const els = {
  status: $('status'),
  statusHelp: $('status-help'),
  userId: $('user-id'),

  // CRM
  cCompany: $('c-company'), cStage: $('c-stage'), cOwner: $('c-owner'), cAmount: $('c-amount'), cAdd: $('c-add'),
  clients: $('clients-list'),

  // Tasks
  tTitle: $('t-title'), tTag: $('t-tag'), tDue: $('t-due'), tStatus: $('t-status'), tAdd: $('t-add'),
  tasks: $('tasks-list'),

  // Crypto
  cryptoList: $('crypto-list'),
  cryptoRefresh: $('refresh-crypto'),

  // Portfolio
  pfList: $('pf-list'), pfCoin: $('pf-coin'), pfAmount: $('pf-amount'), pfAdd: $('pf-add'), pfTotal: $('pf-total'),
};
const dbgBox = $('dbg');
const dbg = (m) => { if (dbgBox) dbgBox.textContent = String(m); console.log('[DBG]', m); };

let TOKEN = localStorage.getItem('pb_token') || '';
const headers = () => TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

function setStatus(t, type=''){ els.status.classList.remove('ok','err'); if(type) els.status.classList.add(type); els.status.textContent=t; }
function setHelp(t){ els.statusHelp.textContent = t || ''; }

const escapeHtml = (s='') => String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;')
  .replaceAll("'",'&#039;');

const fmtMoney = (v) => {
  try { return Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0)); }
  catch { return `$${v}`; }
};

function busy(btn, on){ if(!btn) return; btn.disabled = !!on; btn.dataset.busy = on ? '1' : ''; }

// API с авто-реавторизацией и единым повтором
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

// Desktop fallback
function buildInitDataFromUnsafe(unsafe){
  if(!unsafe) return '';
  const p = new URLSearchParams();
  if(unsafe.query_id) p.set('query_id', unsafe.query_id);
  if(unsafe.user) p.set('user', JSON.stringify(unsafe.user));
  if(unsafe.auth_date) p.set('auth_date', String(unsafe.auth_date));
  if(unsafe.hash) p.set('hash', unsafe.hash);
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

/* ===== CRM ===== */
function renderClients(list=[]){
  els.clients.innerHTML = list.length
    ? list.map(c => `
      <div class="item" data-id="${c.id}">
        <div class="item__title">${escapeHtml(c.company || 'Компания')}</div>
        <div class="item__row">
          <span>Этап: <b>${escapeHtml(c.stage || 'Negotiation')}</b></span>
          <span>Менеджер: <b>${escapeHtml(c.owner || '—')}</b></span>
          <span>Сумма: <b>${fmtMoney(c.amount || 0)}</b></span>
        </div>
        <div class="actions">
          <button class="btn-sm" data-edit="${c.id}">Ред.</button>
          <button class="btn-del" data-del="${c.id}">Удалить</button>
        </div>
      </div>`).join('')
    : `<div class="muted">Пока пусто — добавьте сделку через форму выше.</div>`;
}
async function loadClients(){
  const list = await api('/api/crm/clients');
  renderClients(list);
}
async function addClient(){
  // валидация
  const company = els.cCompany.value.trim();
  if (!company){
    setStatus('Введите название компании', 'err');
    els.cCompany.focus(); return;
  }
  const body = {
    company,
    stage: els.cStage.value.trim() || 'Lead',
    owner: els.cOwner.value.trim(),
    amount: Number(els.cAmount.value || 0),
  };
  await ensureAuth();
  busy(els.cAdd, true);
  try{
    await api('/api/crm/clients', { method:'POST', body: JSON.stringify(body) });
    els.cCompany.value = ''; els.cOwner.value=''; els.cAmount.value='';
    setStatus('Сделка добавлена', 'ok');
    await loadClients();
  }catch(e){
    console.error(e);
    setStatus('Ошибка добавления сделки', 'err');
  }finally{
    busy(els.cAdd, false);
  }
}
async function editClient(id, current){
  const company = prompt('Компания:', current.company || '') ?? current.company;
  const stage = prompt('Этап (Lead/Qualification/Negotiation/Won/Lost):', current.stage || 'Negotiation') ?? current.stage;
  const owner = prompt('Менеджер:', current.owner || '') ?? current.owner;
  const amount = Number(prompt('Сумма, $:', current.amount || 0) ?? current.amount);
  await api(`/api/crm/clients/${id}`, { method:'PUT', body: JSON.stringify({ company, stage, owner, amount }) });
  await loadClients();
}
async function deleteClient(id){
  if (!confirm('Удалить сделку?')) return;
  await api(`/api/crm/clients/${id}`, { method:'DELETE' });
  await loadClients();
}

/* ===== Tasks ===== */
function renderTasks(list=[]){
  els.tasks.innerHTML = list.length
    ? list.map(t => `
      <div class="item" data-id="${t.id}">
        <div class="item__title">${escapeHtml(t.title || 'Задача')}</div>
        <div class="item__row">
          <span>Тег: <b>${escapeHtml(t.tag || 'general')}</b></span>
          <span>Срок: <b>${escapeHtml(t.due || '—')}</b></span>
          <span>Статус: <b>${escapeHtml(t.status || 'todo')}</b></span>
        </div>
        <div class="actions">
          <button class="btn-sm" data-edit="${t.id}" data-type="task">Ред.</button>
          <button class="btn-del" data-del="${t.id}" data-type="task">Удалить</button>
        </div>
      </div>`).join('')
    : `<div class="muted">Пока пусто — добавьте задачу через форму выше.</div>`;
}
async function loadTasks(){
  const list = await api('/api/tasks');
  renderTasks(list);
}
function todayStr(){
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
async function addTask(){
  const title = els.tTitle.value.trim();
  if (!title){
    setStatus('Введите название задачи', 'err');
    els.tTitle.focus(); return;
  }
  const body = {
    title,
    tag: els.tTag.value.trim() || 'general',
    due: els.tDue.value || todayStr(),
    status: els.tStatus.value || 'todo',
  };
  await ensureAuth();
  busy(els.tAdd, true);
  try{
    await api('/api/tasks', { method:'POST', body: JSON.stringify(body) });
    els.tTitle.value=''; els.tTag.value=''; els.tDue.value='';
    setStatus('Задача добавлена', 'ok');
    await loadTasks();
  }catch(e){
    console.error(e);
    setStatus('Ошибка добавления задачи', 'err');
  }finally{
    busy(els.tAdd, false);
  }
}
async function editTask(id, current){
  const title = prompt('Название задачи:', current.title || '') ?? current.title;
  const tag = prompt('Тег:', current.tag || 'general') ?? current.tag;
  const due = prompt('Срок (YYYY-MM-DD или текст):', current.due || todayStr()) ?? current.due;
  const status = prompt('Статус (todo/inprogress/done):', current.status || 'todo') ?? current.status;
  await api(`/api/tasks/${id}`, { method:'PUT', body: JSON.stringify({ title, tag, due, status }) });
  await loadTasks();
}
async function deleteTask(id){
  if (!confirm('Удалить задачу?')) return;
  await api(`/api/tasks/${id}`, { method:'DELETE' });
  await loadTasks();
}

/* ===== Crypto: Market ===== */
let lastMarkets = [];
function renderCrypto(list = []) {
  lastMarkets = Array.isArray(list) ? list : [];
  els.cryptoList.innerHTML = list.length
    ? list.map(c => {
        const sym = (c.symbol || '').toUpperCase();
        const pct = Number(c.price_change_percentage_24h || 0);
        const cls = pct >= 0 ? 'chg-up' : 'chg-down';
        const pctStr = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
        const icon = c.image ? `<img src="${c.image}" alt="${escapeHtml(sym)}"/>`
                             : `<span class="avatar" data-sym="${escapeHtml(sym)}">${escapeHtml(sym[0]||'?')}</span>`;
        const mc = Number(c.market_cap || 0);
        return `
          <div class="item">
            <div class="coin">
              ${icon}
              <div class="item__title">${escapeHtml(c.name || sym)} <span class="muted">(${escapeHtml(sym)})</span></div>
            </div>
            <div class="item__row">
              <span class="pill">${fmtMoney(c.current_price)}</span>
              <span class="pill ${cls}">${pctStr}</span>
              ${mc > 0 ? `<span class="muted">MC Cap: ${Intl.NumberFormat('en-US',{notation:'compact'}).format(mc)}</span>` : ``}
            </div>
          </div>`;
      }).join('')
    : `<div class="muted">Нет данных. Нажмите «Обновить».</div>`;
  loadPortfolio(true); // пересчитать портфель
}
async function loadCrypto(ids=['bitcoin','ethereum','toncoin'], vs='usd'){
  const q = `/api/crypto/markets?ids=${encodeURIComponent(ids.join(','))}&vs=${encodeURIComponent(vs)}`;
  const data = await api(q);
  if (Array.isArray(data)) renderCrypto(data);
}

/* ===== Portfolio ===== */
function priceById(id){ const m = lastMarkets.find(x => x.id === id); return m ? Number(m.current_price || 0) : 0; }
function symName(id){ if(id==='bitcoin')return{sym:'BTC',name:'Bitcoin'}; if(id==='ethereum')return{sym:'ETH',name:'Ethereum'}; if(id==='toncoin')return{sym:'TON',name:'Toncoin'}; return{sym:id.slice(0,3).toUpperCase(),name:id}; }
function renderPortfolio(list){
  let total = 0;
  els.pfList.innerHTML = list.length
    ? list.map(r => {
        const {sym,name} = symName(r.coin);
        const p = priceById(r.coin); const value = Number(r.amount||0) * p; total += value;
        return `
          <div class="item">
            <div class="item__title">${name} <span class="muted">(${sym})</span></div>
            <div class="item__row">
              <span>Кол-во: <b>${r.amount}</b></span>
              <span class="pill">${fmtMoney(p)} / ${sym}</span>
              <span class="pill">${fmtMoney(value)}</span>
              <button class="btn-del right" data-pf-del="${r.id}">Удалить</button>
            </div>
          </div>`;
      }).join('')
    : `<div class="muted">Пока пусто — добавьте монету выше.</div>`;
  els.pfTotal.textContent = `Итого: ${fmtMoney(total)}`;
  // кнопки удаления
  els.pfList.querySelectorAll('[data-pf-del]').forEach(b=>{
    b.addEventListener('click', async e=>{
      const id = Number(e.currentTarget.getAttribute('data-pf-del'));
      await api(`/api/crypto/portfolio/${id}`, { method:'DELETE' });
      await loadPortfolio(true);
    });
  });
}
async function loadPortfolio(silent=false){
  const list = await api('/api/crypto/portfolio');
  renderPortfolio(Array.isArray(list) ? list : []);
  if (!silent) setStatus('Портфель обновлён', 'ok');
}
async function addPortfolioItem(){
  const coin = els.pfCoin.value;
  const amount = parseFloat(els.pfAmount.value);
  if (!coin || !amount || isNaN(amount) || amount <= 0) { setStatus('Введите корректное количество', 'err'); els.pfAmount.focus(); return; }
  await api('/api/crypto/portfolio', { method:'POST', body: JSON.stringify({ coin, amount }) });
  els.pfAmount.value = '';
  await loadPortfolio(true);
}

/* ===== Автообновление цен (10с) ===== */
let cryptoTimer = null;
function startAutoCrypto(periodMs = 10000){ stopAutoCrypto(); cryptoTimer = setInterval(()=>loadCrypto(), periodMs); }
function stopAutoCrypto(){ if (cryptoTimer){ clearInterval(cryptoTimer); cryptoTimer=null; } }
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) stopAutoCrypto(); else startAutoCrypto(10000); });

/* ===== wire & boot ===== */
function wire(){
  // CRM
  els.cAdd.addEventListener('click', (e)=>{ e.preventDefault(); addClient(); });
  els.clients.addEventListener('click', async (e)=>{
    const delId = e.target.getAttribute('data-del');
    const editId = e.target.getAttribute('data-edit');
    if (delId) return deleteClient(Number(delId));
    if (editId) {
      const node = e.target.closest('.item');
      const current = {
        company: node.querySelector('.item__title')?.textContent.trim(),
        stage: node.querySelector('.item__row span:nth-child(1) b')?.textContent.trim(),
        owner: node.querySelector('.item__row span:nth-child(2) b')?.textContent.trim(),
        amount: (node.querySelector('.item__row span:nth-child(3) b')?.textContent.replace(/[^\d.]/g,'') || 0)
      };
      return editClient(Number(editId), current);
    }
  });

  // Tasks
  els.tAdd.addEventListener('click', (e)=>{ e.preventDefault(); addTask(); });
  els.tasks.addEventListener('click', async (e)=>{
    const delId = e.target.getAttribute('data-del');
    const editId = e.target.getAttribute('data-edit');
    const isTask = e.target.getAttribute('data-type') === 'task';
    if (delId && isTask) return deleteTask(Number(delId));
    if (editId && isTask) {
      const node = e.target.closest('.item');
      const current = {
        title: node.querySelector('.item__title')?.textContent.trim(),
        tag: node.querySelector('.item__row span:nth-child(1) b')?.textContent.trim(),
        due: node.querySelector('.item__row span:nth-child(2) b')?.textContent.trim(),
        status: node.querySelector('.item__row span:nth-child(3) b')?.textContent.trim(),
      };
      return editTask(Number(editId), current);
    }
  });

  // Crypto
  els.cryptoRefresh.addEventListener('click', async (e)=>{
    e.preventDefault();
    els.cryptoRefresh.disabled = true; await loadCrypto(); setTimeout(()=>{ els.cryptoRefresh.disabled=false; }, 3000);
  });

  // Portfolio
  els.pfAdd.addEventListener('click', (e)=>{ e.preventDefault(); addPortfolioItem(); });
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
  await Promise.all([ loadClients(), loadTasks() ]);
  await loadCrypto();
  await loadPortfolio(true);
  startAutoCrypto(10000);
  setStatus('Готово', 'ok');
}

boot();
