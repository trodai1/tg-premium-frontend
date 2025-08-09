// ====== НАСТРОЙКА ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev'; // <-- ПОМЕНЯЙ на свой воркер!
// =======================

const tg = window.Telegram?.WebApp;
const $  = (sel) => document.querySelector(sel);
const dbg = (t) => { const el = document.getElementById('dbg'); if (el) el.textContent = t; };

// Инициализируем Telegram WebApp и показываем мини-диагностику
try {
  if (tg) {
    tg.ready();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
    dbg(`tg OK • v:${tg.version || '?'} • ${tg.platform || 'platform?'} • initData:${tg.initData?.length || 0}`);
  } else {
    dbg('tg = undefined (SDK не подхватился)');
  }
} catch (e) {
  dbg('tg error: ' + String(e));
}

const els = {
  status:      $('#status'),
  statusHelp:  $('#status-help'),
  userId:      $('#user-id'),
  clients:     $('#clients-list'),
  tasks:       $('#tasks-list'),
  addClient:   $('#add-demo-client'),
  addTask:     $('#add-demo-task'),
};

let TOKEN = localStorage.getItem('pb_token') || '';
const headers = () => TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

function setStatus(text, type='') {
  els.status.classList.remove('ok','err');
  if (type) els.status.classList.add(type);
  els.status.textContent = text;
}
function setHelp(text) { els.statusHelp.textContent = text || ''; }

function escapeHtml(s='') {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
function formatMoney(v) {
  try {
    return Intl.NumberFormat('en', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(v);
  } catch { return `$${v}`; }
}

function renderClients(list) {
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

function renderTasks(list) {
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

async function api(path, opts={}) {
  const init = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers(), ...(opts.headers||{}) },
    ...opts
  };
  const res = await fetch(`${API_URL}${path}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

// Fallback: собрать initData из initDataUnsafe (Desktop иногда не кладёт строку в initData)
function buildInitDataFromUnsafe(unsafe) {
  if (!unsafe) return '';
  const p = new URLSearchParams();
  if (unsafe.query_id)    p.set('query_id', unsafe.query_id);
  if (unsafe.user)        p.set('user', JSON.stringify(unsafe.user));
  if (unsafe.auth_date)   p.set('auth_date', String(unsafe.auth_date));
  if (unsafe.hash)        p.set('hash', unsafe.hash);
  if (unsafe.start_param) p.set('start_param', unsafe.start_param);
  return p.toString();
}

async function auth() {
  if (!tg) {
    setStatus('Открыто вне Telegram. Авторизация не выполнена.', 'err');
    setHelp('Открой через кнопку у бота, чтобы авторизоваться.');
    return false;
  }

  // основная строка из Telegram
  let initData = tg.initData;

  // если пусто — собираем из initDataUnsafe (fallback для Desktop)
  if (!initData || initData.length === 0) {
    const fallback = buildInitDataFromUnsafe(tg.initDataUnsafe);
    if (fallback) initData = fallback;
  }

  if (!initData || initData.length === 0) {
    setStatus('Открыто внутри Telegram, но initData пустая.', 'err');
    setHelp('Обнови Telegram до последней версии и открой через кнопку у бота.');
    return false;
  }

  setStatus('Авторизация…');
  try {
    const res = await api('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });

    if (res.ok && res.token) {
      TOKEN = res.token;
      localStorage.setItem('pb_token', TOKEN);
      setStatus('Готово: авторизация успешна', 'ok');
      els.userId.textContent = res.user?.id ? `User ID: ${res.user.id}` : '';
      setHelp('');
      return true;
    } else {
      setStatus('Ошибка авторизации', 'err');
      setHelp(res.reason || res.error || '');
      return false;
    }
  } catch (e) {
    setStatus('Ошибка авторизации', 'err');
    setHelp((e && (e.reason || e.error)) ? JSON.stringify(e) : 'unknown');
    return false;
  }
}

async function loadAll() {
  try {
    const [clients, tasks] = await Promise.all([
      api('/api/crm/clients'),
      api('/api/tasks')
    ]);
    renderClients(clients);
    renderTasks(tasks);
  } catch (e) {
    if (e && (e.error === 'no_token' || e.error === 'bad_token')) {
      localStorage.removeItem('pb_token');
      TOKEN = '';
      setStatus('Сессия истекла — открой через кнопку у бота.', 'err');
      return;
    }
    console.error(e);
  }
}

async function addDemoClient() {
  const body = { company: 'Acme Corp', stage: 'Negotiation', owner: 'Мария', amount: 24000 };
  await api('/api/crm/clients', { method:'POST', body: JSON.stringify(body) });
  await loadAll();
}

async function addDemoTask() {
  const body = { title: 'Позвонить Acme', tag: 'sales', due: 'Сегодня', status: 'inprogress' };
  await api('/api/tasks', { method:'POST', body: JSON.stringify(body) });
  await loadAll();
}

function wire() {
  els.addClient.addEventListener('click', addDemoClient);
  els.addTask.addEventListener('click', addDemoTask);
}

async function boot() {
  try {
    if (tg) {
      tg.ready();
      tg.expand?.();
      tg.disableVerticalSwipes?.();
    }
  } catch {}
  wire();

  // если уже есть токен — попробуем сразу
  if (TOKEN) {
    setStatus('Проверка сессии…');
    try {
      await loadAll();
      setStatus('Готово: авторизация по токену', 'ok');
      return;
    } catch {
      localStorage.removeItem('pb_token');
      TOKEN = '';
    }
  }

  // полная авторизация
  const ok = await auth();
  if (ok) await loadAll();
}

boot();
