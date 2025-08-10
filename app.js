// ====== SETUP ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev';
// ===================

const tg = window.Telegram?.WebApp;
const $  = (id) => document.getElementById(id);

/* ================= I18N ================= */
const I18N = {
  ru: {
    app_title:'NewSaaS', app_subtitle:'Premium Business', app_tagline:'Лаконично, быстро, по-телеграмному', lang_btn:'EN',
    status_title:'Статус', status_check:'Проверка окружения…', status_auth_ok:'Готово: авторизация',
    status_auth_fail_ext:'Открыто вне Telegram. Авторизация не выполнена.', status_auth_hint_ext:'Открой через кнопку у бота.',
    status_auth_init_empty:'Открыто в Telegram, но initData пустая.', status_auth_hint_update:'Обнови Telegram и открой через кнопку у бота.',
    status_loading:'Загрузка…', status_ready:'Готово', status_deal_added:'Сделка добавлена', status_task_added:'Задача добавлена',
    status_deal_add_err:'Ошибка добавления сделки', status_task_add_err:'Ошибка добавления задачи', status_pf_updated:'Портфель обновлён',
    status_input_company:'Введите название компании', status_input_task:'Введите название задачи',
    confirm_del_deal:'Удалить сделку?', confirm_del_task:'Удалить задачу?', confirm_clear_deals:'Удалить все сделки?', confirm_clear_tasks:'Удалить все задачи?',
    crm_title:'CRM — Клиенты', crm_add:'Добавить сделку', crm_clear:'Очистить сделки', crm_company_ph:'Компания', crm_owner_ph:'Менеджер', crm_amount_ph:'Сумма, $',
    crm_list_empty:'Пока пусто — добавьте сделку через форму выше.', crm_stage_lbl:'Этап', crm_owner_lbl:'Менеджер', crm_amount_lbl:'Сумма',
    edit:'Ред.', del:'Удалить', all_deals_deleted:'Все сделки удалены',
    tasks_title:'Tasks — Задачи', tasks_add:'Добавить задачу', tasks_clear:'Очистить задачи',
    task_title_ph:'Название задачи', task_tag_ph:'Тег (sales/ops…)', task_due_ph:'Дата', tasks_list_empty:'Пока пусто — добавьте задачу через форму выше.',
    all_tasks_deleted:'Все задачи удалены',
    crypto_title:'Crypto — Рынок', refresh:'Обновить', crypto_empty:'Нет данных. Нажмите «Обновить».', crypto_source:'Источник: Binance → OKX → Bybit (кэш 10с).',
    pf_title:'Портфель', pf_total:'Итого: {v}', pf_amount_ph:'Количество', pf_add:'Добавить в портфель',
    footer_left:'© Premium Business',
  },
  en: {
    app_title:'NewSaaS', app_subtitle:'Premium Business', app_tagline:'Minimal, fast, Telegram-native', lang_btn:'RU',
    status_title:'Status', status_check:'Checking environment…', status_auth_ok:'Done: authorized',
    status_auth_fail_ext:'Opened outside Telegram. Auth not performed.', status_auth_hint_ext:'Open via the bot button.',
    status_auth_init_empty:'Opened in Telegram, but initData is empty.', status_auth_hint_update:'Update Telegram and open via the bot button.',
    status_loading:'Loading…', status_ready:'Ready', status_deal_added:'Deal added', status_task_added:'Task added',
    status_deal_add_err:'Failed to add deal', status_task_add_err:'Failed to add task', status_pf_updated:'Portfolio updated',
    status_input_company:'Enter company name', status_input_task:'Enter task title',
    confirm_del_deal:'Delete deal?', confirm_del_task:'Delete task?', confirm_clear_deals:'Delete all deals?', confirm_clear_tasks:'Delete all tasks?',
    crm_title:'CRM — Clients', crm_add:'Add deal', crm_clear:'Clear deals', crm_company_ph:'Company', crm_owner_ph:'Owner', crm_amount_ph:'Amount, $',
    crm_list_empty:'Empty — add a deal above.', crm_stage_lbl:'Stage', crm_owner_lbl:'Owner', crm_amount_lbl:'Amount',
    edit:'Edit', del:'Delete', all_deals_deleted:'All deals removed',
    tasks_title:'Tasks', tasks_add:'Add task', tasks_clear:'Clear tasks',
    task_title_ph:'Task title', task_tag_ph:'Tag (sales/ops…)', task_due_ph:'Due date', tasks_list_empty:'Empty — add a task above.',
    all_tasks_deleted:'All tasks removed',
    crypto_title:'Crypto — Market', refresh:'Refresh', crypto_empty:'No data. Tap “Refresh”.', crypto_source:'Source: Binance → OKX → Bybit (cache 10s).',
    pf_title:'Portfolio', pf_total:'Total: {v}', pf_amount_ph:'Amount', pf_add:'Add to portfolio',
    footer_left:'© Premium Business',
  }
};

let LANG = (localStorage.getItem('pb_lang')
  || ((tg?.initDataUnsafe?.user?.language_code || '').toLowerCase().startsWith('ru') ? 'ru' : 'en'));

function t(key, vars){ const dict = I18N[LANG] || I18N.en; let s = dict[key] ?? I18N.en[key] ?? key; if (vars) for (const [k,v] of Object.entries(vars)) s = s.replace(`{${k}}`, v); return s; }
function setLang(lang){ LANG = (lang==='ru'||lang==='en')?lang:'en'; localStorage.setItem('pb_lang', LANG); applyTexts(); refreshAllTextViews(); }

function applyTexts(){
  $('hdr-title').textContent    = t('app_title');
  $('hdr-subtitle').textContent = t('app_subtitle');
  $('hdr-muted').textContent    = t('app_tagline');
  $('lang-toggle').textContent  = t('lang_btn');

  $('card-status-title').textContent = t('status_title');
  $('card-crm-title').textContent    = t('crm_title');
  $('card-tasks-title').textContent  = t('tasks_title');
  $('card-crypto-title').textContent = t('crypto_title');
  $('card-pf-title').textContent     = t('pf_title');

  $('refresh-crypto').textContent = t('refresh');
  $('crypto-source').textContent  = t('crypto_source');
  $('footer-left').textContent    = t('footer_left');

  $('c-company').placeholder = t('crm_company_ph');
  $('c-owner').placeholder   = t('crm_owner_ph');
  $('c-amount').placeholder  = t('crm_amount_ph');
  $('c-add').textContent     = t('crm_add');
  $('c-clear').textContent   = t('crm_clear');

  $('t-title').placeholder   = t('task_title_ph');
  $('t-tag').placeholder     = t('task_tag_ph');
  $('t-due').placeholder     = t('task_due_ph');
  $('t-add').textContent     = t('tasks_add');
  $('t-clear').textContent   = t('tasks_clear');

  $('pf-amount').placeholder = t('pf_amount_ph');
  $('pf-add').textContent    = t('pf_add');

  setStatus(t('status_check'));
}
function refreshAllTextViews(){ loadClients().catch(()=>{}); loadTasks().catch(()=>{}); renderCrypto(lastMarkets||[]); renderPortfolio(lastPortfolio||[]); }

/* =============== helpers =============== */
const dbgBox = $('dbg');
const dbg    = (m) => { if (dbgBox) dbgBox.textContent = String(m); console.log('[DBG]', m); };
let TOKEN    = localStorage.getItem('pb_token') || '';
const headers = () => TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};
function setStatus(t, type=''){ $('status').classList.remove('ok','err'); if(type) $('status').classList.add(type); $('status').textContent = t; }
function setHelp(t){ $('status-help').textContent = t || ''; }
function busy(btn, on){ if(!btn) return; btn.disabled = !!on; }
const escapeHtml = (s='') => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const fmtMoney   = (v)=>{ try{ return Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0)); }catch{ return `$${v}`; } };

// API
async function api(path, opts={}, retry=true){
  const init = { method:'GET', headers:{ 'Content-Type':'application/json', ...headers(), ...(opts.headers||{}) }, ...opts };
  const res = await fetch(`${API_URL}${path}`, init);
  let data={}; try{ data = await res.json(); }catch{}
  if(!res.ok){
    const need = data && (data.error==='no_token' || data.error==='bad_token');
    if(retry && need){ localStorage.removeItem('pb_token'); TOKEN=''; const ok = await auth(); if(ok) return api(path, opts, false); }
    throw data;
  }
  return data;
}
function buildInitDataFromUnsafe(unsafe){
  if(!unsafe) return ''; const p = new URLSearchParams();
  if(unsafe.query_id) p.set('query_id', unsafe.query_id);
  if(unsafe.user) p.set('user', JSON.stringify(unsafe.user));
  if(unsafe.auth_date) p.set('auth_date', String(unsafe.auth_date));
  if(unsafe.hash) p.set('hash', unsafe.hash);
  if(unsafe.start_param) p.set('start_param', unsafe.start_param);
  return p.toString();
}

// Auth
async function auth(){
  if(!tg){ setStatus(t('status_auth_fail_ext'),'err'); setHelp(t('status_auth_hint_ext')); return false; }
  let initData = tg.initData;
  if(!initData || initData.length===0){ const fb = buildInitDataFromUnsafe(tg.initDataUnsafe); if(fb) initData = fb; }
  if(!initData || initData.length===0){ setStatus(t('status_auth_init_empty'),'err'); setHelp(t('status_auth_hint_update')); return false; }
  setStatus(t('status_loading'));
  try{
    const res = await api('/api/auth/telegram', { method:'POST', body: JSON.stringify({ initData }) }, false);
    if(res.ok && res.token){ TOKEN=res.token; localStorage.setItem('pb_token', TOKEN); setStatus(t('status_auth_ok'),'ok'); $('user-id').textContent = res.user?.id ? `User ID: ${res.user.id}` : ''; setHelp(''); return true; }
    setStatus('Auth error','err'); setHelp(res.reason || res.error || ''); return false;
  }catch{ setStatus('Auth error','err'); return false; }
}
async function ensureAuth(){ if(TOKEN) return true; return await auth(); }

/* =============== CRM =============== */
function renderClients(list=[]){
  $('clients-list').innerHTML = list.length
    ? list.map(c=>`
      <div class="item" data-id="${c.id}">
        <div class="item__title">${escapeHtml(c.company || t('crm_company_ph'))}</div>
        <div class="item__row">
          <span>${t('crm_stage_lbl')}: <b>${escapeHtml(c.stage || 'Negotiation')}</b></span>
          <span>${t('crm_owner_lbl')}: <b>${escapeHtml(c.owner || '—')}</b></span>
          <span>${t('crm_amount_lbl')}: <b>${fmtMoney(c.amount || 0)}</b></span>
        </div>
        <div class="actions">
          <button class="btn-sm" data-edit="${c.id}">${t('edit')}</button>
          <button class="btn-del" data-del="${c.id}">${t('del')}</button>
        </div>
      </div>`).join('')
    : `<div class="muted">${t('crm_list_empty')}</div>`;
}
async function loadClients(){ const list = await api('/api/crm/clients'); renderClients(list); return list; }
async function addClient(){
  const company = $('c-company').value.trim();
  if(!company){ setStatus(t('status_input_company'),'err'); $('c-company').focus(); return; }
  const body = { company, stage:$('c-stage').value.trim()||'Lead', owner:$('c-owner').value.trim(), amount:Number($('c-amount').value||0) };
  await ensureAuth(); busy($('c-add'),true);
  try{ await api('/api/crm/clients',{ method:'POST', body:JSON.stringify(body) }); $('c-company').value=''; $('c-owner').value=''; $('c-amount').value=''; setStatus(t('status_deal_added'),'ok'); await loadClients(); }
  catch{ setStatus(t('status_deal_add_err'),'err'); }
  finally{ busy($('c-add'),false); }
}
async function editClient(id,current){
  const company = prompt(t('crm_company_ph')+':', current.company||'') ?? current.company;
  const stage   = prompt('Stage (Lead/Qualification/Negotiation/Won/Lost):', current.stage||'Negotiation') ?? current.stage;
  const owner   = prompt(t('crm_owner_ph')+':', current.owner||'') ?? current.owner;
  const amount  = Number(prompt(t('crm_amount_ph')+':', current.amount||0) ?? current.amount);
  await api(`/api/crm/clients/${id}`,{ method:'PUT', body:JSON.stringify({company,stage,owner,amount}) });
  await loadClients();
}
async function deleteClient(id){ if(!confirm(t('confirm_del_deal'))) return; await api(`/api/crm/clients/${id}`,{ method:'DELETE' }); await loadClients(); }
async function clearClients(){
  if(!confirm(t('confirm_clear_deals'))) return;
  const list = await api('/api/crm/clients'); await Promise.all(list.map(x=>api(`/api/crm/clients/${x.id}`,{ method:'DELETE' }).catch(()=>null)));
  await loadClients(); setStatus(t('all_deals_deleted'),'ok');
}

/* =============== TASKS =============== */
function renderTasks(list=[]){
  $('tasks-list').innerHTML = list.length
    ? list.map(tk=>`
      <div class="item" data-id="${tk.id}">
        <div class="item__title">${escapeHtml(tk.title || t('task_title_ph'))}</div>
        <div class="item__row">
          <span>Tag: <b>${escapeHtml(tk.tag || 'general')}</b></span>
          <span>Due: <b>${escapeHtml(tk.due || '—')}</b></span>
          <span>Status: <b>${escapeHtml(tk.status || 'todo')}</b></span>
        </div>
        <div class="actions">
          <button class="btn-sm" data-edit="${tk.id}" data-type="task">${t('edit')}</button>
          <button class="btn-del" data-del="${tk.id}" data-type="task">${t('del')}</button>
        </div>
      </div>`).join('')
    : `<div class="muted">${t('tasks_list_empty')}</div>`;
}
async function loadTasks(){ const list = await api('/api/tasks'); renderTasks(list); return list; }
function todayStr(){ const d=new Date(),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }
async function addTask(){
  const title = $('t-title').value.trim();
  if(!title){ setStatus(t('status_input_task'),'err'); $('t-title').focus(); return; }
  const body = { title, tag:$('t-tag').value.trim()||'general', due:$('t-due').value||todayStr(), status:$('t-status').value||'todo' };
  await ensureAuth(); busy($('t-add'),true);
  try{ await api('/api/tasks',{ method:'POST', body:JSON.stringify(body) }); $('t-title').value=''; $('t-tag').value=''; $('t-due').value=''; setStatus(t('status_task_added'),'ok'); await loadTasks(); }
  catch{ setStatus(t('status_task_add_err'),'err'); }
  finally{ busy($('t-add'),false); }
}
async function editTask(id,current){
  const title  = prompt(t('task_title_ph')+':', current.title||'') ?? current.title;
  const tag    = prompt('Tag:', current.tag||'general') ?? current.tag;
  const due    = prompt('Due:', current.due||todayStr()) ?? current.due;
  const status = prompt('Status (todo/inprogress/done):', current.status||'todo') ?? current.status;
  await api(`/api/tasks/${id}`,{ method:'PUT', body:JSON.stringify({title,tag,due,status}) });
  await loadTasks();
}
async function deleteTask(id){ if(!confirm(t('confirm_del_task'))) return; await api(`/api/tasks/${id}`,{ method:'DELETE' }); await loadTasks(); }
async function clearTasks(){
  if(!confirm(t('confirm_clear_tasks'))) return;
  const list = await api('/api/tasks'); await Promise.all(list.map(x=>api(`/api/tasks/${x.id}`,{ method:'DELETE' }).catch(()=>null)));
  await loadTasks(); setStatus(t('all_tasks_deleted'),'ok');
}

/* =============== CRYPTO & PF =============== */
let lastMarkets = []; let lastPortfolio = [];
function renderCrypto(list=[]){
  lastMarkets = Array.isArray(list)?list:[];
  $('crypto-list').innerHTML = list.length
    ? list.map(c=>{
        const sym=(c.symbol||'').toUpperCase(); const pct=Number(c.price_change_percentage_24h||0);
        const cls=pct>=0?'chg-up':'chg-down'; const pctStr=(pct>=0?'+':'')+pct.toFixed(2)+'%';
        const icon = c.image ? `<img src="${c.image}" alt="${escapeHtml(sym)}"/>` : `<span class="avatar" data-sym="${escapeHtml(sym)}">${escapeHtml(sym[0]||'?')}</span>`;
        const mc = Number(c.market_cap||0);
        return `<div class="item"><div class="coin">${icon}<div class="item__title">${escapeHtml(c.name||sym)} <span class="muted">(${escapeHtml(sym)})</span></div></div>
          <div class="item__row"><span class="pill">${fmtMoney(c.current_price)}</span><span class="pill ${cls}">${pctStr}</span>${mc>0?`<span class="muted">MC Cap: ${Intl.NumberFormat('en-US',{notation:'compact'}).format(mc)}</span>`:''}</div></div>`;
      }).join('')
    : `<div class="muted">${t('crypto_empty')}</div>`;
  loadPortfolio(true);
}
async function loadCrypto(ids=['bitcoin','ethereum','toncoin'], vs='usd'){
  const q = `/api/crypto/markets?ids=${encodeURIComponent(ids.join(','))}&vs=${encodeURIComponent(vs)}`;
  const data = await api(q); if(Array.isArray(data)) renderCrypto(data);
}

function priceById(id){ const m=lastMarkets.find(x=>x.id===id); return m?Number(m.current_price||0):0; }
function symName(id){ if(id==='bitcoin')return{sym:'BTC',name:'Bitcoin'}; if(id==='ethereum')return{sym:'ETH',name:'Ethereum'}; if(id==='toncoin')return{sym:'TON',name:'Toncoin'}; return{sym:id.slice(0,3).toUpperCase(),name:id}; }
function renderPortfolio(list){
  lastPortfolio=list; let total=0;
  $('pf-list').innerHTML = list.length
    ? list.map(r=>{
        const {sym,name}=symName(r.coin); const p=priceById(r.coin); const value=Number(r.amount||0)*p; total+=value;
        return `<div class="item"><div class="item__title">${name} <span class="muted">(${sym})</span></div>
          <div class="item__row"><span>Qty: <b>${r.amount}</b></span><span class="pill">${fmtMoney(p)} / ${sym}</span><span class="pill">${fmtMoney(value)}</span>
          <button class="btn-del right" data-pf-del="${r.id}">${t('del')}</button></div></div>`;
      }).join('')
    : `<div class="muted">—</div>`;
  $('pf-total').textContent = t('pf_total', { v: fmtMoney(total) });
  $('pf-list').querySelectorAll('[data-pf-del]').forEach(b=>{
    b.addEventListener('click', async e=>{ const id=Number(e.currentTarget.getAttribute('data-pf-del')); await api(`/api/crypto/portfolio/${id}`,{method:'DELETE'}); await loadPortfolio(true); });
  });
}
async function loadPortfolio(silent=false){
  const list = await api('/api/crypto/portfolio'); renderPortfolio(Array.isArray(list)?list:[]);
  if(!silent) setStatus(t('status_pf_updated'),'ok');
}
async function addPortfolioItem(){
  const coin=$('pf-coin').value; const amount=parseFloat($('pf-amount').value);
  if(!coin || !amount || isNaN(amount) || amount<=0){ setStatus('Enter valid amount','err'); $('pf-amount').focus(); return; }
  await api('/api/crypto/portfolio',{ method:'POST', body:JSON.stringify({ coin, amount }) }); $('pf-amount').value=''; await loadPortfolio(true);
}

/* =============== Auto-refresh =============== */
let cryptoTimer=null; function startAutoCrypto(ms=10000){ stopAutoCrypto(); cryptoTimer=setInterval(()=>loadCrypto(),ms); }
function stopAutoCrypto(){ if(cryptoTimer){ clearInterval(cryptoTimer); cryptoTimer=null; } }
document.addEventListener('visibilitychange',()=>{ if(document.hidden) stopAutoCrypto(); else startAutoCrypto(10000); });

/* =============== Wire & Boot =============== */
function wire(){
  $('lang-toggle').addEventListener('click', ()=> setLang(LANG==='ru'?'en':'ru'));

  $('c-add').addEventListener('click', e=>{ e.preventDefault(); addClient(); });
  $('c-clear').addEventListener('click', e=>{ e.preventDefault(); clearClients(); });
  $('clients-list').addEventListener('click', e=>{
    const delId=e.target.getAttribute('data-del'); const editId=e.target.getAttribute('data-edit');
    if(delId) return deleteClient(Number(delId));
    if(editId){
      const node=e.target.closest('.item');
      const current={ company:node.querySelector('.item__title')?.textContent.trim(),
        stage:node.querySelector('.item__row span:nth-child(1) b')?.textContent.trim(),
        owner:node.querySelector('.item__row span:nth-child(2) b')?.textContent.trim(),
        amount:(node.querySelector('.item__row span:nth-child(3) b')?.textContent.replace(/[^\d.]/g,'')||0) };
      return editClient(Number(editId), current);
    }
  });

  $('t-add').addEventListener('click', e=>{ e.preventDefault(); addTask(); });
  $('t-clear').addEventListener('click', e=>{ e.preventDefault(); clearTasks(); });
  $('tasks-list').addEventListener('click', e=>{
    const delId=e.target.getAttribute('data-del'); const editId=e.target.getAttribute('data-edit'); const isTask=e.target.getAttribute('data-type')==='task';
    if(delId && isTask) return deleteTask(Number(delId));
    if(editId && isTask){
      const node=e.target.closest('.item');
      const current={ title:node.querySelector('.item__title')?.textContent.trim(),
        tag:node.querySelector('.item__row span:nth-child(1) b')?.textContent.trim(),
        due:node.querySelector('.item__row span:nth-child(2) b')?.textContent.trim(),
        status:node.querySelector('.item__row span:nth-child(3) b')?.textContent.trim() };
      return editTask(Number(editId), current);
    }
  });

  $('refresh-crypto').addEventListener('click', async e=>{ e.preventDefault(); $('refresh-crypto').disabled=true; await loadCrypto(); setTimeout(()=>{ $('refresh-crypto').disabled=false; },3000); });
  $('pf-add').addEventListener('click', e=>{ e.preventDefault(); addPortfolioItem(); });
}

async function boot(){
  try{ if(tg){ tg.ready(); tg.setBackgroundColor?.('#0f1115'); tg.setHeaderColor?.('#171a21'); tg.expand?.(); tg.disableVerticalSwipes?.(); dbg(`tg OK • v:${tg.version||'?'} • ${tg.platform||'platform?'} • initData:${tg.initData?.length||0}`); } }catch(e){ dbg('tg error: '+String(e)); }
  applyTexts(); wire();
  const ok = await ensureAuth(); if(!ok){ setStatus('Auth error','err'); return; }
  setStatus(t('status_loading'));
  await Promise.all([loadClients(), loadTasks()]); await loadCrypto(); await loadPortfolio(true);
  startAutoCrypto(10000); setStatus(t('status_ready'),'ok');
}
boot();

