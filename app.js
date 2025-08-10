// --- ultra debug on top ---
(function(){
  const el = document.getElementById('dbg');
  if (el) el.textContent = 'app.js loaded';
})();

// ====== CONFIG ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev'; // <-- твой Worker
// ====================

const tg = window.Telegram?.WebApp;
const $  = (id) => document.getElementById(id);

/* ========== I18N ========== */
const I18N = {
  ru:{brand:'NewSaaS', sub:'Premium Business', footer:'© Premium Business',
      status:'Статус', status_check:'Проверка окружения…', ready:'Готово',
      nav_dashboard:'Обзор', nav_crm:'CRM', nav_tasks:'Задачи', nav_crypto:'Крипта', nav_settings:'Настройки',
      dash_title:'Обзор', dash_hint:'Быстрый обзор по модулям', clients:'Сделок', tasks:'Задач', total:'Итого',
      crm_title:'CRM — Клиенты', add_deal:'Добавить сделку', clr_deals:'Очистить сделки', company:'Компания', owner:'Менеджер', amount:'Сумма, $', stage:'Этап', list_empty_deals:'Пока пусто — добавьте сделку.',
      tasks_title:'Tasks — Задачи', add_task:'Добавить задачу', clr_tasks:'Очистить задачи', task_title:'Название задачи', tag:'Тег', due:'Дата', status_lbl:'Статус', list_empty_tasks:'Пока пусто — добавьте задачу.',
      crypto_title:'Crypto — Рынок', refresh:'Обновить', crypto_empty:'Нет данных.', source:'Источник: Binance → OKX → Bybit (кэш 10с).',
      pf_title:'Портфель', qty:'Кол-во', add_to_pf:'Добавить в портфель', total_fmt:(v)=>`Итого: ${v}`,
      edit:'Ред.', del:'Удалить', all_deals_deleted:'Все сделки удалены', all_tasks_deleted:'Все задачи удалены',
      need_company:'Введите название компании', need_task:'Введите название задачи', deal_added:'Сделка добавлена', task_added:'Задача добавлена',
      settings_title:'Настройки', settings_hint:'Здесь появятся дополнительные настройки'},
  en:{brand:'NewSaaS', sub:'Premium Business', footer:'© Premium Business',
      status:'Status', status_check:'Checking environment…', ready:'Ready',
      nav_dashboard:'Dashboard', nav_crm:'CRM', nav_tasks:'Tasks', nav_crypto:'Crypto', nav_settings:'Settings',
      dash_title:'Overview', dash_hint:'Quick glance across modules', clients:'Deals', tasks:'Tasks', total:'Total',
      crm_title:'CRM — Clients', add_deal:'Add deal', clr_deals:'Clear deals', company:'Company', owner:'Owner', amount:'Amount, $', stage:'Stage', list_empty_deals:'Empty — add a deal.',
      tasks_title:'Tasks', add_task:'Add task', clr_tasks:'Clear tasks', task_title:'Task title', tag:'Tag', due:'Due', status_lbl:'Status', list_empty_tasks:'Empty — add a task.',
      crypto_title:'Crypto — Market', refresh:'Refresh', crypto_empty:'No data.', source:'Source: Binance → OKX → Bybit (cache 10s).',
      pf_title:'Portfolio', qty:'Qty', add_to_pf:'Add to portfolio', total_fmt:(v)=>`Total: ${v}`,
      edit:'Edit', del:'Delete', all_deals_deleted:'All deals removed', all_tasks_deleted:'All tasks removed',
      need_company:'Enter company name', need_task:'Enter task title', deal_added:'Deal added', task_added:'Task added',
      settings_title:'Settings', settings_hint:'More settings coming soon'}
};
let LANG = (localStorage.getItem('pb_lang') || ((tg?.initDataUnsafe?.user?.language_code||'').toLowerCase().startsWith('ru') ? 'ru' : 'en'));
const t  = (k)=> (I18N[LANG]||I18N.en)[k] ?? I18N.en[k];
const tf = (k, ...args)=> { const v=(I18N[LANG]||I18N.en)[k]; return typeof v==='function'? v(...args) : (I18N.en[k]||''); };

function applyTexts(){
  $('hdr-title').textContent = t('brand');
  $('hdr-subtitle').textContent = t('sub');
  $('footer-left').textContent = t('footer');

  $('card-status-title').textContent = t('status');
  $('status').textContent = t('status_check');

  $('nav-dashboard').textContent = t('nav_dashboard');
  $('nav-crm').textContent = t('nav_crm');
  $('nav-tasks').textContent = t('nav_tasks');
  $('nav-crypto').textContent = t('nav_crypto');
  $('nav-settings').textContent = t('nav_settings');

  $('dash-title').textContent = t('dash_title');
  $('dash-hint').textContent  = t('dash_hint');

  $('card-crm-title').textContent = t('crm_title');
  $('c-company').placeholder = t('company');
  $('c-owner').placeholder   = t('owner');
  $('c-amount').placeholder  = t('amount');
  $('c-add').textContent     = t('add_deal');
  $('c-clear').textContent   = t('clr_deals');

  $('card-tasks-title').textContent = t('tasks_title');
  $('t-title').placeholder = t('task_title');
  $('t-tag').placeholder   = t('tag');
  $('t-due').placeholder   = t('due');
  $('t-add').textContent   = t('add_task');
  $('t-clear').textContent = t('clr_tasks');

  $('card-crypto-title').textContent = t('crypto_title');
  $('refresh-crypto').textContent    = t('refresh');
  $('crypto-source').textContent     = t('source');

  $('card-pf-title').textContent = t('pf_title');
  $('pf-add').textContent        = t('add_to_pf');

  $('settings-title').textContent = t('settings_title');
  $('settings-hint').textContent  = t('settings_hint');

  $('lang-toggle').textContent   = LANG==='ru'?'EN':'RU';
  $('lang-toggle-2').textContent = LANG==='ru'?'EN':'RU';
}

/* ========== helpers ========== */
let TOKEN = localStorage.getItem('pb_token') || '';
const headers = ()=> TOKEN ? {'Authorization':`Bearer ${TOKEN}`} : {};
const dbg = (m)=>{ const b=$('dbg'); if(b) b.textContent=String(m); console.log('[DBG]',m); };
const escapeHtml=(s='')=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const fmtMoney=(v)=>{ try{ return Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(v||0)); }catch{ return `$${v}`; } };
function setStatus(txt, type=''){ const el=$('status'); el.classList.remove('ok','err'); if(type) el.classList.add(type); el.textContent = txt; }
function setHelp(txt){ $('status-help').textContent = txt || ''; }
function busy(btn,on){ if(!btn) return; btn.disabled=!!on; }

async function api(path, opts={}, retry=true){
  const init={method:'GET',headers:{'Content-Type':'application/json',...headers(),...(opts.headers||{})},...opts};
  const res=await fetch(`${API_URL}${path}`, init);
  let data={}; try{ data=await res.json(); }catch{}
  if(!res.ok){
    const need=data && (data.error==='no_token' || data.error==='bad_token');
    if(retry && need){
      localStorage.removeItem('pb_token'); TOKEN='';
      const ok=await auth(); if(ok) return api(path,opts,false);
    }
    throw data;
  }
  return data;
}

// Telegram Mini App auth
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
  const el= $('dbg'); if (el) el.textContent = 'auth start';
  if(!tg){
    setStatus('Открой в Telegram через кнопку у бота','err');
    setHelp('Веб-вид не авторизуется без Telegram');
    if (el) el.textContent = 'auth: no tg';
    return false;
  }
  let initData=tg.initData;
  if(!initData || initData.length===0){
    const fb=buildInitDataFromUnsafe(tg.initDataUnsafe);
    if(fb) initData=fb;
  }
  if(!initData || initData.length===0){
    setStatus('initData пустая','err');
    setHelp('Обнови Telegram и открой через кнопку у бота.');
    if (el) el.textContent = 'auth: empty initData';
    return false;
  }
  setStatus('Авторизация…');
  try{
    const r=await api('/api/auth/telegram',{method:'POST',body:JSON.stringify({initData})},false);
    if(r.ok && r.token){
      TOKEN=r.token; localStorage.setItem('pb_token',TOKEN);
      $('user-id').textContent = r.user?.id ? `ID: ${r.user.id}` : '';
      setStatus(t('ready'),'ok'); setHelp('');
      if (el) el.textContent = 'auth ok';
      return true;
    }
    setStatus('Auth error','err'); setHelp(r.reason||r.error||'');
    if (el) el.textContent = 'auth fail';
    return false;
  }catch(e){
    setStatus('Auth error','err');
    if (el) el.textContent = 'auth exception';
    return false;
  }
}

/* ===== DATA: CRM ===== */
function renderClients(list=[]){
  $('clients-list').innerHTML = list.length
    ? list.map(c=>`
      <div class="item" data-id="${c.id}">
        <div class="item__title">${escapeHtml(c.company || t('company'))}</div>
        <div class="item__row">
          <span>${t('stage')}: <b>${escapeHtml(c.stage||'Negotiation')}</b></span>
          <span>${t('owner')}: <b>${escapeHtml(c.owner||'—')}</b></span>
          <span>${t('amount')}: <b>${fmtMoney(c.amount||0)}</b></span>
        </div>
        <div class="actions">
          <button class="btn-sm" data-edit="${c.id}">${t('edit')}</button>
          <button class="btn-del" data-del="${c.id}">${t('del')}</button>
        </div>
      </div>`).join('')
    : `<div class="muted">${t('list_empty_deals')}</div>`;
}
async function loadClients(){ const list=await api('/api/crm/clients'); renderClients(list); updateDash({clients:list.length}); return list; }
async function addClient(){
  const company=$('c-company').value.trim();
  if(!company){ setStatus(t('need_company'),'err'); $('c-company').focus(); return; }
  const body={ company, stage:$('c-stage').value.trim()||'Lead', owner:$('c-owner').value.trim(), amount:Number($('c-amount').value||0) };
  busy($('c-add'),true);
  try{ await api('/api/crm/clients',{method:'POST',body:JSON.stringify(body)}); $('c-company').value=''; $('c-owner').value=''; $('c-amount').value=''; setStatus(t('deal_added'),'ok'); await loadClients(); }
  catch{ setStatus('Error','err'); } finally{ busy($('c-add'),false); }
}
async function editClient(id,current){
  const company=prompt(t('company')+':', current.company||'') ?? current.company;
  const stage=prompt('Stage (Lead/Qualification/Negotiation/Won/Lost):', current.stage||'Negotiation') ?? current.stage;
  const owner=prompt(t('owner')+':', current.owner||'') ?? current.owner;
  const amount=Number(prompt(t('amount')+':', current.amount||0) ?? current.amount);
  await api(`/api/crm/clients/${id}`,{method:'PUT',body:JSON.stringify({company,stage,owner,amount})});
  await loadClients();
}
async function deleteClient(id){ if(!confirm('Delete?')) return; await api(`/api/crm/clients/${id}`,{method:'DELETE'}); await loadClients(); }
async function clearClients(){
  if(!confirm('Delete all?')) return;
  const list=await api('/api/crm/clients'); await Promise.all(list.map(x=>api(`/api/crm/clients/${x.id}`,{method:'DELETE'}).catch(()=>null)));
  await loadClients(); setStatus(t('all_deals_deleted'),'ok');
}

/* ===== DATA: TASKS ===== */
function renderTasks(list=[]){
  $('tasks-list').innerHTML = list.length
    ? list.map(tk=>`
      <div class="item" data-id="${tk.id}">
        <div class="item__title">${escapeHtml(tk.title || t('task_title'))}</div>
        <div class="item__row">
          <span>${t('tag')}: <b>${escapeHtml(tk.tag||'general')}</b></span>
          <span>${t('due')}: <b>${escapeHtml(tk.due||'—')}</b></span>
          <span>${t('status_lbl')}: <b>${escapeHtml(tk.status||'todo')}</b></span>
        </div>
        <div class="actions">
          <button class="btn-sm" data-edit="${tk.id}" data-type="task">${t('edit')}</button>
          <button class="btn-del" data-del="${tk.id}" data-type="task">${t('del')}</button>
        </div>
      </div>`).join('')
    : `<div class="muted">${t('list_empty_tasks')}</div>`;
}
async function loadTasks(){ const list=await api('/api/tasks'); renderTasks(list); updateDash({tasks:list.length}); return list; }
function todayStr(){ const d=new Date(),mm=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; }
async function addTask(){
  const title=$('t-title').value.trim();
  if(!title){ setStatus(t('need_task'),'err'); $('t-title').focus(); return; }
  const body={ title, tag:$('t-tag').value.trim()||'general', due:$('t-due').value||todayStr(), status:$('t-status').value||'todo' };
  busy($('t-add'),true);
  try{ await api('/api/tasks',{method:'POST',body:JSON.stringify(body)}); $('t-title').value=''; $('t-tag').value=''; $('t-due').value=''; setStatus(t('task_added'),'ok'); await loadTasks(); }
  catch{ setStatus('Error','err'); } finally{ busy($('t-add'),false); }
}
async function editTask(id,current){
  const title=prompt(t('task_title')+':', current.title||'') ?? current.title;
  const tag=prompt('Tag:', current.tag||'general') ?? current.tag;
  const due=prompt('Due:', current.due||todayStr()) ?? current.due;
  const status=prompt('Status (todo/inprogress/done):', current.status||'todo') ?? current.status;
  await api(`/api/tasks/${id}`,{method:'PUT',body:JSON.stringify({title,tag,due,status})});
  await loadTasks();
}
async function deleteTask(id){ if(!confirm('Delete?')) return; await api(`/api/tasks/${id}`,{method:'DELETE'}); await loadTasks(); }
async function clearTasks(){
  if(!confirm('Delete all?')) return;
  const list=await api('/api/tasks'); await Promise.all(list.map(x=>api(`/api/tasks/${x.id}`,{method:'DELETE'}).catch(()=>null)));
  await loadTasks(); setStatus(t('all_tasks_deleted'),'ok');
}

/* ===== DATA: CRYPTO ===== */
let lastMarkets=[]; let lastPortfolio=[];
function renderCrypto(list=[]){
  lastMarkets=Array.isArray(list)?list:[];
  $('crypto-list').innerHTML = list.length
    ? list.map(c=>{
        const sym=(c.symbol||'').toUpperCase();
        const pct=Number(c.price_change_percentage_24h||0);
        const cls=pct>=0?'chg-up':'chg-down';
        const pctStr=(pct>=0?'+':'')+pct.toFixed(2)+'%';
        const icon = c.image ? `<img src="${c.image}" alt="${escapeHtml(sym)}"/>` : `<span class="avatar" data-sym="${escapeHtml(sym)}">${escapeHtml(sym[0]||'?')}</span>`;
        const mc = Number(c.market_cap||0);
        return `<div class="item">
          <div class="coin">${icon}<div class="item__title">${escapeHtml(c.name||sym)} <span class="muted">(${escapeHtml(sym)})</span></div></div>
          <div class="item__row"><span class="pill">${fmtMoney(c.current_price)}</span><span class="pill ${cls}">${pctStr}</span>${mc>0?`<span class="muted">MC Cap: ${Intl.NumberFormat('en-US',{notation:'compact'}).format(mc)}</span>`:''}</div>
        </div>`;
      }).join('')
    : `<div class="muted">${t('crypto_empty')}</div>`;
  updatePortfolioTotal();
}
async function loadCrypto(ids=['bitcoin','ethereum','toncoin'], vs='usd'){
  const q=`/api/crypto/markets?ids=${encodeURIComponent(ids.join(','))}&vs=${encodeURIComponent(vs)}`;
  const data=await api(q);
  if(Array.isArray(data)) renderCrypto(data);
}

function priceById(id){ const m=lastMarkets.find(x=>x.id===id); return m?Number(m.current_price||0):0; }
function symName(id){ if(id==='bitcoin')return{sym:'BTC',name:'Bitcoin'}; if(id==='ethereum')return{sym:'ETH',name:'Ethereum'}; if(id==='toncoin')return{sym:'TON',name:'Toncoin'}; return{sym:id.slice(0,3).toUpperCase(),name:id}; }
function renderPortfolio(list){
  lastPortfolio=list; updatePortfolioTotal();
  $('pf-list').innerHTML = list.length
    ? list.map(r=>{
        const {sym,name}=symName(r.coin);
        const p=priceById(r.coin);
        const value=Number(r.amount||0)*p;
        return `<div class="item">
          <div class="item__title">${name} <span class="muted">(${sym})</span></div>
          <div class="item__row">
            <span>${t('qty')}: <b>${r.amount}</b></span>
            <span class="pill">${fmtMoney(p)} / ${sym}</span>
            <span class="pill">${fmtMoney(value)}</span>
            <button class="btn-del right" data-pf-del="${r.id}">${t('del')}</button>
          </div>
        </div>`;
      }).join('')
    : `<div class="muted">—</div>`;

  $('pf-list').querySelectorAll('[data-pf-del]').forEach(b=>{
    b.addEventListener('click', async e=>{
      const id = Number(e.currentTarget.getAttribute('data-pf-del'));
      await api(`/api/crypto/portfolio/${id}`, { method:'DELETE' });
      await loadPortfolio(true);
    });
  });
}
function updatePortfolioTotal(){
  let total=0;
  for(const r of lastPortfolio||[]){ total += Number(r.amount||0) * priceById(r.coin); }
  $('pf-total').textContent = tf('total_fmt', fmtMoney(total));
}
async function loadPortfolio(silent=false){
  const list=await api('/api/crypto/portfolio');
  renderPortfolio(Array.isArray(list)?list:[]);
  if(!silent) setStatus(tf('total_fmt', $('pf-total').textContent), 'ok');
}
async function addPortfolioItem(){
  const coin=$('pf-coin').value; const amount=parseFloat($('pf-amount').value);
  if(!coin || !amount || isNaN(amount) || amount<=0){ setStatus('Enter valid amount','err'); $('pf-amount').focus(); return; }
  await api('/api/crypto/portfolio',{ method:'POST', body: JSON.stringify({ coin, amount }) });
  $('pf-amount').value=''; await loadPortfolio(true);
}

/* ===== DASH ===== */
function updateDash({clients, tasks}={}){
  if(typeof clients==='number') $('dash-clients').textContent = `${t('clients')}: ${clients}`;
  if(typeof tasks==='number')   $('dash-tasks').textContent   = `${t('tasks')}: ${tasks}`;
  $('dash-total').textContent = `${t('total')}: ${$('pf-total').textContent.replace(/^.*?:\s*/,'') || '$0'}`;
}

/* ===== NAV / VIEWS ===== */
let cryptoTimer=null;
function startAutoCrypto(ms=10000){ stopAutoCrypto(); cryptoTimer=setInterval(()=>loadCrypto().catch(()=>{}),ms); }
function stopAutoCrypto(){ if(cryptoTimer){ clearInterval(cryptoTimer); cryptoTimer=null; } }
function setView(view){
  document.querySelectorAll('.nav__item').forEach(b=>b.classList.toggle('is-active', b.dataset.view===view));
  document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));
  const el = $('view-'+view); if (el) el.classList.remove('hidden');
  localStorage.setItem('pb_view', view);
  if(view==='crypto'){ startAutoCrypto(10000); loadCrypto().catch(()=>{}); loadPortfolio(true).catch(()=>{}); }
  else { stopAutoCrypto(); }
  if(view==='dashboard'){ loadClients().catch(()=>{}); loadTasks().catch(()=>{}); updatePortfolioTotal(); }
}

/* ===== wire & boot ===== */
function wire(){
  // nav
  document.querySelectorAll('.nav__item').forEach(btn=>{
    btn.addEventListener('click', ()=> setView(btn.dataset.view));
  });

  // language
  const flipLang=()=>{ LANG = (LANG==='ru'?'en':'ru'); localStorage.setItem('pb_lang',LANG); applyTexts(); renderCrypto(lastMarkets||[]); renderPortfolio(lastPortfolio||[]); };
  $('lang-toggle').addEventListener('click', flipLang);
  $('lang-toggle-2').addEventListener('click', flipLang);

  // CRM
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

  // Tasks
  $('t-add').addEventListener('click', e=>{ e.preventDefault(); addTask(); });
  $('t-clear').addEventListener('click', e=>{ e.preventDefault(); clearTasks(); });
  $('tasks-list').addEventListener('click', e=>{
    const delId=e.target.getAttribute('data-del'); const editId=e.target.getAttribute('data-edit');
    const isTask=e.target.getAttribute('data-type')==='task';
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

  // Crypto
  $('refresh-crypto').addEventListener('click', async e=>{
    e.preventDefault(); const b=$('refresh-crypto'); b.disabled=true; await loadCrypto().catch(()=>{}); setTimeout(()=>{ b.disabled=false; }, 1500);
  });
  $('pf-add').addEventListener('click', e=>{ e.preventDefault(); addPortfolioItem(); });
}

async function boot(){
  try {
    const el = $('dbg'); if (el) el.textContent = 'boot start';

    if (tg) {
      tg.ready(); tg.setBackgroundColor?.('#0f1115'); tg.setHeaderColor?.('#171a21');
      tg.expand?.(); tg.disableVerticalSwipes?.();
      if (el) el.textContent = 'tg ready';
    }

    applyTexts(); if (el) el.textContent = 'texts applied';
    wire();       if (el) el.textContent = 'wired';

    const ok = await auth(); if (el) el.textContent = 'auth ' + (ok ? 'ok' : 'fail');
    if (!ok) return;

    setStatus('Загрузка…');
    await Promise.allSettled([ loadClients(), loadTasks() ]);
    await loadCrypto(); await loadPortfolio(true);

    const lastView = localStorage.getItem('pb_view') || 'dashboard';
    setView(lastView);

    setStatus(t('ready'), 'ok');
    if (el) el.textContent = 'done';
  } catch (e) {
    const el = $('dbg'); if (el) el.textContent = 'boot error: ' + String(e);
    console.error(e);
  }
}

boot();
