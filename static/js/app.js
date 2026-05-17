/* ============ APP BOOTSTRAP — FINAL ============ */
(() => {
  const intro = document.getElementById('intro-screen');
  const app = document.getElementById('app');

  function init() {
    const state = FinState.get();
    if (state.mode) {
      hideIntro();
    } else {
      setTimeout(() => document.getElementById('mode-select').classList.remove('hidden'), 1200);
      document.querySelectorAll('.mode-card').forEach(c => c.onclick = () => {
        const mode = c.dataset.mode;
        FinState.set({ mode, startDate: new Date().toISOString() });
        hideIntro();
      });
    }
  }

  function hideIntro() {
    intro.classList.add('fading-out');
    setTimeout(() => {
      intro.classList.add('hidden');
      app.classList.remove('hidden');
      app.classList.add('show');
      mount();
    }, 650);
  }

  function mount() {
    applyMode();
    bindNav();
    bindTopbar();
    bindSearch();
    addExtraNavItems();
    Router.go('dashboard');
    startTicker();
    startClock();
    startBackgroundLoops();
    setTimeout(() => Streak.check(), 1500);
    setTimeout(() => Onboarding.start(), 2500);
  }

  function applyMode() {
    const mode = FinState.get().mode;
    document.querySelectorAll('.casual-only').forEach(el => {
      el.style.display = mode === 'casual' ? '' : 'none';
    });
  }

  function addExtraNavItems() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;
    if (nav.querySelector('[data-page="options"]')) return;

    const items = [
      { p: 'options', i: 'layers', l: 'Options', casual: false },
      { p: 'crypto', i: 'currency_bitcoin', l: 'Crypto', casual: false },
      { p: 'realestate', i: 'apartment', l: 'Real Estate', casual: false },
      { p: 'bonds', i: 'receipt_long', l: 'Bonds', casual: false },
      { p: 'forex', i: 'currency_exchange', l: 'Forex', casual: false },
      { p: 'etfs', i: 'donut_large', l: 'ETFs', casual: false },
      { p: 'earnings', i: 'event_available', l: 'Earnings', casual: false },
      { p: 'sec', i: 'description', l: 'SEC Filings', casual: false },
      { p: 'career', i: 'badge', l: 'Career', casual: false },
      { p: 'tax', i: 'percent', l: 'Tax Center', casual: false },
      { p: 'heatmap', i: 'grid_view', l: 'Heatmap', casual: false },
      { p: 'compare', i: 'compare', l: 'Compare', casual: false },
      { p: 'leaderboard', i: 'leaderboard', l: 'Leaderboard', casual: false },
      { p: 'bot', i: 'smart_toy', l: 'Trading Bot', casual: false },
      { p: 'predictions', i: 'help_outline', l: 'Predictions', casual: true },
      { p: 'pet', i: 'pets', l: 'Pet', casual: true },
      { p: 'mining', i: 'memory', l: 'Mining', casual: true },
      { p: 'season', i: 'workspace_premium', l: 'Season Pass', casual: true },
    ];

    const divider = nav.querySelector('.nav-divider');
    items.forEach(it => {
      const a = document.createElement('a');
      a.className = 'nav-item' + (it.casual ? ' casual-only' : '');
      a.dataset.page = it.p;
      a.innerHTML = `<span class="material-symbols-outlined">${it.i}</span><span class="nav-label">${it.l}</span>`;
      nav.insertBefore(a, divider);
      a.onclick = () => Router.go(it.p);
    });
    applyMode();
  }

  function bindNav() {
    document.querySelectorAll('.nav-item').forEach(n => { n.onclick = () => Router.go(n.dataset.page); });
  }

  function bindTopbar() {
    document.getElementById('btn-notifications').onclick = () => {
      Modal.open({
        title: 'Notifications', width: 420,
        body: `<div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-block" id="enable-bn">Enable Browser Notifications</button>
          <button class="btn btn-block" onclick="Router.go('alerts');document.querySelectorAll('.modal-overlay').forEach(o=>o.remove());">Manage Alerts</button>
          <button class="btn btn-block" onclick="Share.showCard();document.querySelectorAll('.modal-overlay').forEach(o=>o.remove());">Share Portfolio</button>
        </div>`,
      });
      document.getElementById('enable-bn').onclick = async () => {
        const granted = await BrowserNotify.request();
        if (granted) {
          FinState.setSettings({ browserNotifications: true });
          Toast.show({ title: 'Notifications enabled', type: 'success' });
        }
      };
    };
    document.getElementById('btn-news').onclick = () => News.openPanel();
    document.getElementById('btn-quickadd').onclick = () => openQuickActions();
    document.getElementById('user-chip').onclick = () => openUserMenu();
  }

  function openQuickActions() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <button class="btn" data-qa="generate"><span class="material-symbols-outlined" style="font-size:16px;">add</span>New Stock</button>
        <button class="btn" data-qa="event"><span class="material-symbols-outlined" style="font-size:16px;">bolt</span>Random Event</button>
        <button class="btn" data-qa="blackswan"><span class="material-symbols-outlined" style="font-size:16px;">warning</span>Black Swan</button>
        <button class="btn" data-qa="news"><span class="material-symbols-outlined" style="font-size:16px;">campaign</span>News</button>
        <button class="btn" data-qa="cmdk"><span class="material-symbols-outlined" style="font-size:16px;">terminal</span>Command Palette</button>
        <button class="btn" data-qa="tip"><span class="material-symbols-outlined" style="font-size:16px;">tips_and_updates</span>Tipster</button>
        <button class="btn" data-qa="share"><span class="material-symbols-outlined" style="font-size:16px;">share</span>Share Card</button>
        <button class="btn" data-qa="export"><span class="material-symbols-outlined" style="font-size:16px;">download</span>Export Save</button>
      </div>`;
    const o = Modal.open({ title: 'Quick Actions', body, width: 420 });
    o.querySelectorAll('[data-qa]').forEach(b => b.onclick = async () => {
      const a = b.dataset.qa;
      Modal.close(o);
      if (a === 'generate') { await Api.generateStock({ count: 1 }); Toast.show({ title: 'Stock generated', type: 'success' }); }
      if (a === 'event') Events.triggerRandom();
      if (a === 'blackswan') Events.triggerBlackSwan();
      if (a === 'news') { await Api.generateNews(); Toast.show({ title: 'News generated', type: 'success' }); }
      if (a === 'cmdk') Cmdk.open();
      if (a === 'tip') Tipster.showTip();
      if (a === 'share') Share.showCard();
      if (a === 'export') FinState.exportSave();
    });
  }

  function openUserMenu() {
    const state = FinState.get();
    const body = document.createElement('div');
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:14px;">
        <div class="avatar" style="width:48px;height:48px;"><span class="material-symbols-outlined" style="font-size:26px;">person</span></div>
        <div>
          <div style="font-weight:700;">${state.playerName || 'Trader'}</div>
          <div class="muted" style="font-size:12px;">Mode: ${state.mode} · Streak: ${state.loginStreak}d</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <button class="btn" onclick="Router.go('portfolio');document.querySelectorAll('.modal-overlay').forEach(o=>o.remove());">Portfolio</button>
        <button class="btn" onclick="Router.go('leaderboard');document.querySelectorAll('.modal-overlay').forEach(o=>o.remove());">Leaderboard</button>
        <button class="btn" onclick="Router.go('settings');document.querySelectorAll('.modal-overlay').forEach(o=>o.remove());">Settings</button>
        <button class="btn btn-ghost" id="logout-btn">Reset Progress</button>
      </div>`;
    const o = Modal.open({ title: 'Account', body, width: 360 });
    o.querySelector('#logout-btn').onclick = async () => {
      const ok = await Modal.confirm({ title: 'Reset?', message: 'This erases all data.', confirmText: 'Reset' });
      if (ok) { FinState.reset(); location.reload(); }
    };
  }

  function bindSearch() {
    const input = document.getElementById('global-search');
    const dd = document.getElementById('search-dropdown');
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = input.value.trim().toLowerCase();
        if (!q) { dd.classList.add('hidden'); return; }
        const stocks = await Api.getStocks();
        const matches = stocks.filter(s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 8);
        if (!matches.length) { dd.classList.add('hidden'); return; }
        dd.innerHTML = matches.map(s => `
          <div class="search-result" data-t="${s.ticker}">
            <div class="search-result-ticker">${s.ticker}</div>
            <div class="search-result-name">${s.name}</div>
            <div class="search-result-price ${s.change_pct>=0?'up':'down'}">$${Market.fmtPrice(s.price)}</div>
          </div>`).join('');
        dd.classList.remove('hidden');
        dd.querySelectorAll('[data-t]').forEach(el => el.onclick = () => {
          Market.openDetail(el.dataset.t);
          input.value = ''; dd.classList.add('hidden');
        });
      }, 150);
    });
    document.addEventListener('click', e => { if (!e.target.closest('.search-box')) dd.classList.add('hidden'); });
  }

  async function startTicker() {
    const track = document.getElementById('ticker-track');
    async function refresh() {
      const indices = await Api.getIndices();
      const stocks = await Api.getStocks();
      const items = [...indices, ...stocks.filter(s => ['AAPL','MSFT','NVDA','TSLA','DIS','AMGN','GOOGL','META'].includes(s.ticker))];
      track.innerHTML = items.map(it => {
        const up = it.change_pct >= 0;
        return `<div class="ticker-item">
          <span class="ticker-name">${it.ticker || it.name}</span>
          <span class="ticker-price tabular">${Market.fmtPrice(it.price)}</span>
          <span class="ticker-change ${up?'up':'down'}">
            <span class="material-symbols-outlined" style="font-size:14px;">${up?'arrow_drop_up':'arrow_drop_down'}</span>
            ${it.change_pct.toFixed(2)}%
          </span>
        </div>`;
      }).join('') + track.innerHTML;
    }
    refresh();
    setInterval(refresh, 5000);
  }

  function startClock() {
    const el = document.getElementById('ticker-clock');
    function tick() {
      const d = new Date();
      el.textContent = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    tick(); setInterval(tick, 30000);
  }

  function startBackgroundLoops() {
    // refresh data
    setInterval(async () => {
      await Api.getStocks(true);
      await Api.getCrypto(true);
      await Api.getForex(true);
      if (Router.current() === 'dashboard' && typeof Dashboard !== 'undefined') Dashboard.refresh();
      checkAlerts();
    }, 5000);

    // random events
    setInterval(() => {
      if (FinState.get().mode === 'casual' && Math.random() < 0.18) Events.triggerRandom();
    }, 60000);

    // news + breaking
    setInterval(async () => {
      if (Math.random() < 0.3) {
        const item = await Api.generateNews();
        if (item && Math.random() < 0.25) Events.showBreaking(item.headline);
      }
    }, 45000);

    // tipster (if skill unlocked)
    setInterval(() => {
      if (Math.random() < 0.1 && FinState.get().skills?.insider) Tipster.showTip();
    }, 90000);

    // pay salary + rent + bond interest + mining
    setInterval(async () => {
      const state = FinState.get();
      // Salary (weekly equivalent)
      const jobs = await Api.getCareer();
      const job = jobs.find(j => j.id === state.career?.jobId);
      if (job) {
        const weekly = job.salary_annual / 52;
        FinState.adjustCash(weekly, 'SALARY', `${job.title} weekly`);
        state.career.totalSalary = (state.career.totalSalary || 0) + weekly;
        FinState.set({ career: state.career });
      }
      // Rent
      const rent = (state.properties || []).reduce((a, p) => a + p.rent, 0);
      if (rent > 0) {
        FinState.adjustCash(rent / 30, 'RENT', 'Daily rent income');
        FinState.set({ rentIncomeTotal: (state.rentIncomeTotal || 0) + rent / 30 });
      }
      // Bond interest
      const interest = (state.bonds || []).reduce((a, b) => a + (b.quantity * b.face_value * b.yield / 100), 0);
      if (interest > 0) {
        FinState.adjustCash(interest / 365, 'BOND_INT', 'Daily bond interest');
        FinState.set({ bondInterestTotal: (state.bondInterestTotal || 0) + interest / 365 });
      }
      // Mining
      if (state.miningRigs > 0) {
        const earn = state.miningRigs * 18 / 1440; // per minute
        FinState.adjustCash(earn, 'MINING', 'Mining earnings');
        FinState.set({ miningEarnings: (state.miningEarnings || 0) + earn });
      }
    }, 60000);

    // Achievement check
    setInterval(() => { if (typeof Achievements !== 'undefined') Achievements.evaluate(); }, 10000);
  }

  function checkAlerts() {
    const s = FinState.get();
    const stocks = Api.cache().stocks;
    s.alerts.forEach(a => {
      if (a.triggered) return;
      const stock = stocks.find(x => x.ticker === a.ticker);
      if (!stock) return;
      const hit = (a.condition === 'above' && stock.price >= a.target) || (a.condition === 'below' && stock.price <= a.target);
      if (hit) {
        a.triggered = true;
        Sound.notification();
        Toast.show({ title: 'Price Alert!', body: `${a.ticker} ${a.condition} $${a.target}`, type: 'info' });
        BrowserNotify.send(`Price Alert: ${a.ticker}`, `${a.condition} $${a.target}`);
      }
    });
    FinState.set({ alerts: s.alerts });
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (e.key === '/') { e.preventDefault(); document.getElementById('global-search').focus(); }
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(o => o.remove());
  });

  document.addEventListener('DOMContentLoaded', init);
})();