// ====== НАСТРОЙКА ======
const API_URL = 'https://tg-premium-worker.m-kir258.workers.dev'; // <-- ПОМЕНЯЙ на свой воркер!
// =======================

const tg = window.Telegram?.WebApp;
const $ = (sel) => document.querySelector(sel);

const els = {
  status: $('#status'),
  statusHelp: $('#status-help'),
  userId: $('#user-id'),
  clients: $('#clients-list'),
  tasks: $('#tasks-list'),
  addClient: $('#add-demo-client'),
  addTask: $('#add-demo-task'),
};

let TOKEN = localStorage.getItem('pb_token') || '';
const headers = () => TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {};

function setStatus(text, type='') {
  els.status.classList.remove('ok','err');
  if (type) els.status.classList.add(type);
  els.status.textContent = text;
}
function setHelp(text) { els.statusHelp.textContent = text || ''; }

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

async function auth() {
  // если открыто вне Telegram — показываем подсказку
  if (!tg || !tg.initData) {
    setStatus('Открыто вне Telegram. Авторизация не выполнена.', 'err');
    setHelp('Открой через кнопку у бота, чтобы авторизоваться.');
    return false;
  }

  setStatus('Авторизация…');
  try {
    const res = await api('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData: tg.initData })
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
    // если токен протух/нет прав
    if (e && (e.error === 'no_token' || e.error === 'bad_token')) {
      localStorage.removeItem('pb_token');
      TOKEN = '';
      setStatus('Сессия истекла — обнови приложение через кнопку у бота.', 'err');
      return;
    }
    console.error(e);
  }
}

async function addDemoClient() {
  const body = {
    company: 'Acme Corp',
    stage: 'Negotiation',
    owner: 'Мария',
    amount: 24000
  };
  await api('/api/crm/clients', { method:'POST', body: JSON.stringify(body) });
  await loadAll();
}

async function addDemoTask() {
  const body = {
    title: 'Позвонить Acme',
    tag: 'sales',
    due: 'Сегодня',
    status: 'inprogress'
  };
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

  // Если уже есть токен — пробуем сразу грузить
  if (TOKEN) {
    setStatus('Проверка сессии…');
    try {
      await loadAll();
      setStatus('Готово: авторизация по токену', 'ok');
      return;
    } catch {
      // токен невалиден — чистим и авторизуемся заново
      localStorage.removeItem('pb_token');
      TOKEN = '';
    }
  }

  // Полная авторизация
  const ok = await auth();
  if (ok) await loadAll();
}

boot();
