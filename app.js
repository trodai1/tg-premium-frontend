// URL твоего воркера (БЕЗ слеша в конце)
const BACKEND_URL = "https://tg-premium-worker.m-kir258.workers.dev";

let AUTH_TOKEN = null;

function applyTelegramTheme() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready?.();
  const p = tg.themeParams || {};
  const root = document.documentElement;
  const map = {
    "--bg": p.bg_color || "#0e1621",
    "--fg": p.text_color || "#e6e6e6",
    "--muted": p.hint_color || "#a1acb8",
    "--accent": p.link_color || "#50a8eb",
    "--card": p.secondary_bg_color || "#131c26",
  };
  Object.entries(map).forEach(([k,v])=>root.style.setProperty(k,v));
}

function getInitDataFromUrl() {
  const h = new URLSearchParams(location.hash.slice(1));
  const q = new URLSearchParams(location.search);
  return h.get("tgWebAppData") || q.get("tgWebAppData") || "";
}

async function waitForInitData(tg, tries = 8) {
  // иногда на Desktop initData появляется с задержкой
  for (let i = 0; i < tries; i++) {
    const id = tg?.initData;
    if (id && id.length > 0) return id;
    await new Promise(r => setTimeout(r, 250));
  }
  return "";
}

async function authIfTelegram() {
  const status = document.getElementById("status");
  const tg = window.Telegram?.WebApp;

  if (!tg) {
    status.textContent = "Открыто вне Telegram. Авторизация WebApp не выполнена.";
    return false;
  }

  tg.ready?.();

  // 1) пытаемся взять initData из API (нормальный путь)
  let initData = tg.initData || "";
  if (!initData) initData = await waitForInitData(tg);

  // 2) если всё ещё пусто — пытаемся из URL (иногда Телеграм его добавляет)
  if (!initData) initData = getInitDataFromUrl();

  if (!initData) {
    status.textContent = "Не получил initData от Telegram. Попробуй открыть через команду /app ещё раз (или с телефона).";
    return false;
  }

  status.textContent = "Нашёл Telegram WebApp, авторизуюсь…";
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/telegram`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ initData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "auth_failed");
    AUTH_TOKEN = data.token;
    status.textContent = "Готово: авторизация успешна.";
    return true;
  } catch (e) {
    status.textContent = "Ошибка авторизации: " + e.message;
    return false;
  }
}

async function apiGet(path) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method:"POST",
    headers: {
      "Content-Type":"application/json",
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

async function loadClients() {
  const wrap = document.getElementById("clients");
  wrap.innerHTML = "Загрузка…";
  try {
    const list = await apiGet("/api/crm/clients");
    wrap.innerHTML = "";
    if (!list.length) wrap.innerHTML = '<div class="item">Пока пусто. Нажми «Добавить демо-сделку».</div>';
    list.forEach(c=>{
      const div = document.createElement("div");
      div.className="item";
      div.innerHTML = `<b>${c.name}</b><br/><small>Этап: ${c.stage} • Менеджер: ${c.owner} • Сумма: ${c.value}</small>`;
      wrap.appendChild(div);
    });
  } catch { wrap.innerHTML = "Не удалось загрузить клиентов."; }
}
async function loadTasks() {
  const wrap = document.getElementById("tasks");
  wrap.innerHTML = "Загрузка…";
  try {
    const list = await apiGet("/api/tasks");
    wrap.innerHTML = "";
    if (!list.length) wrap.innerHTML = '<div class="item">Задач нет. Нажми «Добавить демо-задачу».</div>';
    list.forEach(t=>{
      const div = document.createElement("div");
      div.className="item";
      div.innerHTML = `<b>${t.title}</b><br/><small>Тег: ${t.tag} • Срок: ${t.due} • Статус: ${t.status}</small>`;
      wrap.appendChild(div);
    });
  } catch { wrap.innerHTML = "Не удалось загрузить задачи."; }
}

async function addDemoClient() {
  await apiPost("/api/crm/clients", { name:"Acme Corp", stage:"Negotiation", owner:"Мария", value:"$24,000" });
  await loadClients();
}
async function addDemoTask() {
  await apiPost("/api/tasks", { title:"Позвонить Acme", tag:"sales", due:"Сегодня", status:"inprogress" });
  await loadTasks();
}

window.addEventListener("DOMContentLoaded", async ()=>{
  applyTelegramTheme();
  document.getElementById("addClientBtn").onclick = addDemoClient;
  document.getElementById("addTaskBtn").onclick = addDemoTask;

  const ok = await authIfTelegram();
  if (ok) await Promise.all([loadClients(), loadTasks()]);
});
