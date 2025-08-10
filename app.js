<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="theme-color" content="#0f1115">
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Premium Business</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    :root{--bg:#0f1115;--card:#171a21;--text:#e8ecf1;--muted:#99a2b1;--accent:#3b82f6;--accent-text:#fff;--border:rgba(255,255,255,.12);--ok:#2ecc71;--err:#ff5c70}
    html{color-scheme:dark light}*{box-sizing:border-box}
    body{margin:0;background:var(--bg)!important;color:var(--text);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Noto Sans",Arial}

    /* layout */
    .layout{max-width:960px;margin:0 auto;padding:12px;display:grid;grid-template-columns:220px 1fr;gap:12px}
    @media (max-width:640px){ .layout{grid-template-columns:72px 1fr} .nav__label{display:none} .brand__sub{display:none} }

    /* sidebar */
    .sidebar{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:12px;position:sticky;top:8px;height:calc(100dvh - 16px)}
    .brand{display:flex;flex-direction:column;gap:2px}
    .brand__title{font-weight:800}
    .brand__sub{color:var(--muted);font-size:12px}
    .nav{display:flex;flex-direction:column;gap:6px;flex:1}
    .nav__item{display:flex;align-items:center;gap:10px;background:#10141c;border:1px solid var(--border);color:var(--text);padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:600}
    .nav__item:hover{filter:brightness(.98)}
    .nav__item.is-active{outline:2px solid rgba(59,130,246,.45)}
    .nav__icon{width:20px;text-align:center}
    .sidebar__bottom{display:flex;gap:8px;align-items:center;justify-content:space-between}

    /* content */
    .content{display:flex;flex-direction:column;gap:12px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px}
    .card__title{margin:0 0 10px;font-size:16px}
    .status{padding:10px;background:#10141c;border:1px solid var(--border);border-radius:10px}
    .ok{color:var(--ok)}.err{color:var(--err)}.muted{color:var(--muted);font-size:13px}
    .inputs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
    .input,.select{background:#0e1117;color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px 12px}
    .input{width:160px}.select{min-width:140px}
    .btn{display:inline-block;background:var(--accent);color:var(--accent-text);border:0;border-radius:10px;padding:10px 14px;cursor:pointer;transition:.15s;font-weight:600}
    .btn:hover{filter:brightness(.95)}
    .btn-sm{background:#1f2a44;color:#e5eefb;border:1px solid var(--border);padding:8px 10px;border-radius:8px;cursor:pointer}
    .btn-del{background:#1f2937;border:1px solid var(--border);color:#e2e8f0;border-radius:8px;padding:8px 10px;cursor:pointer}
    .list{display:grid;gap:10px}
    .item{border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:#10141c}
    .item__title{font-weight:600}
    .item__row{display:flex;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:13px;margin-top:4px}
    .actions{display:flex;gap:8px;margin-top:8px}
    .pill{display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border:1px solid var(--border);border-radius:999px}
    .chg-up{color:#34d399}.chg-down{color:#f87171}
    .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between}
    .hidden{display:none}
    .footer{display:flex;justify-content:space-between;padding:6px 2px 0;color:var(--muted);font-size:12px}

    .coin{display:flex;gap:10px;align-items:center}
    .coin img{width:20px;height:20px;border-radius:50%;object-fit:cover}
    .avatar{width:20px;height:20px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;background:#475569}
    .avatar[data-sym="BTC"]{background:#f7931a}.avatar[data-sym="ETH"]{background:#627eea}.avatar[data-sym="TON"]{background:#0098ea}

    html,body,#tg-viewport,.tg-absolute-bg{background:#0f1115!important}
    #dbg{position:fixed;right:8px;bottom:8px;background:rgba(0,0,0,.5);color:#9aa6b2;font:12px/1.2 system-ui;padding:6px 8px;border:1px solid #232734;border-radius:8px;z-index:9999}
  </style>
</head>
<body>
  <div class="layout">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand__title" id="hdr-title">NewSaaS</div>
        <div class="brand__sub" id="hdr-subtitle">Premium Business</div>
      </div>

      <nav class="nav" id="nav">
        <button class="nav__item is-active" data-view="dashboard"><span class="nav__icon">🏠</span><span class="nav__label" id="nav-dashboard">Dashboard</span></button>
        <button class="nav__item" data-view="crm"><span class="nav__icon">👥</span><span class="nav__label" id="nav-crm">CRM</span></button>
        <button class="nav__item" data-view="tasks"><span class="nav__icon">🗂️</span><span class="nav__label" id="nav-tasks">Tasks</span></button>
        <button class="nav__item" data-view="crypto"><span class="nav__icon">💱</span><span class="nav__label" id="nav-crypto">Crypto</span></button>
        <button class="nav__item" data-view="settings"><span class="nav__icon">⚙️</span><span class="nav__label" id="nav-settings">Settings</span></button>
      </nav>

      <div class="sidebar__bottom">
        <button id="lang-toggle" class="btn-sm">EN</button>
        <span id="user-id" class="muted"></span>
      </div>
      <div class="footer"><span id="footer-left">© Premium Business</span></div>
    </aside>

    <!-- CONTENT -->
    <main class="content">
      <!-- статус глобально -->
      <section class="card">
        <h3 id="card-status-title" class="card__title">Статус</h3>
        <div id="status" class="status">Проверка окружения…</div>
        <div id="status-help" class="muted"></div>
      </section>

      <!-- DASHBOARD -->
      <section id="view-dashboard" class="card view">
        <h3 class="card__title" id="dash-title">Обзор</h3>
        <div class="row">
          <div class="pill" id="dash-clients">Clients: 0</div>
          <div class="pill" id="dash-tasks">Tasks: 0</div>
          <div class="pill" id="dash-total">Total: $0</div>
        </div>
        <div class="muted" style="margin-top:8px" id="dash-hint">Быстрый обзор по модулям</div>
      </section>

      <!-- CRM -->
      <section id="view-crm" class="card view hidden">
        <h3 id="card-crm-title" class="card__title">CRM — Клиенты</h3>
        <div class="inputs">
          <input id="c-company" class="input" placeholder="Компания" />
          <select id="c-stage" class="select">
            <option>Lead</option><option>Qualification</option>
            <option selected>Negotiation</option><option>Won</option><option>Lost</option>
          </select>
          <input id="c-owner" class="input" placeholder="Менеджер" />
          <input id="c-amount" class="input" type="number" step="any" placeholder="Сумма, $" />
          <button id="c-add" class="btn">Добавить сделку</button>
          <button id="c-clear" class="btn-sm">Очистить сделки</button>
        </div>
        <div id="clients-list" class="list" style="margin-top:12px"></div>
      </section>

      <!-- TASKS -->
      <section id="view-tasks" class="card view hidden">
        <h3 id="card-tasks-title" class="card__title">Tasks — Задачи</h3>
        <div class="inputs">
          <input id="t-title" class="input" placeholder="Название задачи" />
          <input id="t-tag" class="input" placeholder="Тег (sales/ops…)" />
          <input id="t-due" class="input" type="date" />
          <select id="t-status" class="select">
            <option>todo</option><option selected>inprogress</option><option>done</option>
          </select>
          <button id="t-add" class="btn">Добавить задачу</button>
          <button id="t-clear" class="btn-sm">Очистить задачи</button>
        </div>
        <div id="tasks-list" class="list" style="margin-top:12px"></div>
      </section>

      <!-- CRYPTO -->
      <section id="view-crypto" class="card view hidden">
        <div class="row">
          <h3 id="card-crypto-title" class="card__title" style="margin:0">Crypto — Рынок</h3>
          <button id="refresh-crypto" class="btn" style="margin:0">Обновить</button>
        </div>
        <div id="crypto-list" class="list"></div>
        <div id="crypto-source" class="muted" style="margin-top:8px">Источник: Binance → OKX → Bybit (кэш 10с).</div>

        <hr style="border:none;border-top:1px solid var(--border);margin:12px 0">
        <div class="row">
          <h3 id="card-pf-title" class="card__title" style="margin:0">Портфель</h3>
          <div class="muted" id="pf-total">Итого: $0</div>
        </div>
        <div id="pf-list" class="list"></div>
        <div class="inputs">
          <select id="pf-coin" class="select">
            <option value="bitcoin">BTC</option>
            <option value="ethereum">ETH</option>
            <option value="toncoin">TON</option>
          </select>
          <input id="pf-amount" class="input" type="number" step="any" placeholder="Количество" />
          <button id="pf-add" class="btn">Добавить в портфель</button>
        </div>
      </section>

      <!-- SETTINGS -->
      <section id="view-settings" class="card view hidden">
        <h3 class="card__title" id="settings-title">Settings</h3>
        <div class="row">
          <div class="pill">Language:</div>
          <button id="lang-toggle-2" class="btn-sm">EN</button>
        </div>
        <div class="muted" style="margin-top:8px" id="settings-hint">Здесь появятся дополнительные настройки</div>
      </section>
    </main>
  </div>

  <div id="dbg">init…</div>
  <script type="module" src="./app.js?v=layout1"></script>
</body>
</html>
