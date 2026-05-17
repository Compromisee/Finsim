/* ============ PAGE ROUTER ============ */
const Router = (() => {
  let current = 'dashboard';

  const routes = {
    dashboard: () => typeof Dashboard !== 'undefined' ? Dashboard.render(host()) : null,
    markets: () => Market.renderPage(host()),
    portfolio: () => Portfolio.renderPage(host()),
    banking: () => Banking.render(host()),
    transactions: () => Transactions.render(host()),
    casino: () => Casino.render(host()),
    skills: () => Skills.render(host()),
    achievements: () => Achievements.render(host()),
    settings: () => SettingsPage.render(host()),
    watchlist: () => renderWatchlist(),
    alerts: () => renderAlerts(),
    screener: () => renderScreener(),
    support: () => renderSupport(),
    // ============ NEW ROUTES ============
    options: () => OptionsPage.render(host()),
    crypto: () => Crypto.render(host()),
    realestate: () => RealEstate.render(host()),
    bonds: () => Bonds.render(host()),
    forex: () => Forex.render(host()),
    etfs: () => ETFs.render(host()),
    career: () => Career.render(host()),
    tax: () => TaxCenter.render(host()),
    earnings: () => EarningsCal.render(host()),
    sec: () => SECFilings.render(host()),
    leaderboard: () => Leaderboard.render(host()),
    heatmap: () => Heatmap.render(host()),
    compare: () => Compare.render(host()),
    bot: () => BotBuilder.render(host()),
    predictions: () => Predictions.render(host()),
    pet: () => Pet.render(host()),
    mining: () => Mining.render(host()),
    season: () => Season.render(host()),
  };

  function host() { return document.getElementById('page-container'); }

  function go(page) {
    current = page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    const fn = routes[page];
    const h = host();
    h.scrollTop = 0;
    h.style.transition = 'opacity 150ms ease';
    h.style.opacity = '0';
    setTimeout(async () => {
      try {
        if (fn) await fn();
        else h.innerHTML = `<div class="empty"><span class="material-symbols-outlined">construction</span><div class="empty-title">${page}</div><div class="empty-body">Coming soon.</div></div>`;
      } catch (err) {
        console.error('Page render error:', err);
        h.innerHTML = `<div class="empty"><span class="material-symbols-outlined">error</span><div class="empty-title">Render error</div><div class="empty-body">${err.message}</div></div>`;
      } finally {
        h.style.opacity = '1';
      }
    }, 120);
  }

  async function renderWatchlist() {
    const state = FinState.get();
    const stocks = await Api.getStocks();
    const groups = state.watchlistGroups || { 'Default': state.watchlist };
    const groupNames = Object.keys(groups);
    const active = state._activeGroup || 'Default';

    host().innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Watchlist</div><div class="muted" style="font-size:13px;">${Object.values(groups).flat().length} tracked symbols</div></div>
        <button class="btn btn-primary btn-sm" id="add-group"><span class="material-symbols-outlined" style="font-size:16px;">add</span>New Group</button>
      </div>

      <div class="group-tabs">
        ${groupNames.map(g => `<div class="group-tab ${g===active?'active':''}" data-grp="${g}">${g} (${groups[g].length})</div>`).join('')}
      </div>

      <div id="wl-content"></div>
    `;

    host().querySelectorAll('[data-grp]').forEach(t => t.onclick = () => {
      FinState.set({ _activeGroup: t.dataset.grp });
      renderWatchlist();
    });

    host().querySelector('#add-group').onclick = () => {
      const name = prompt('Group name?');
      if (!name) return;
      state.watchlistGroups[name] = [];
      FinState.set({ watchlistGroups: state.watchlistGroups });
      renderWatchlist();
    };

    const list = stocks.filter(s => groups[active].includes(s.ticker));
    document.getElementById('wl-content').innerHTML = list.length ?
      `<div class="market-grid">${list.map(cardHtml).join('')}</div>` :
      `<div class="empty"><span class="material-symbols-outlined">bookmark</span><div class="empty-title">Empty group</div><div class="empty-body">Add stocks from Markets.</div></div>`;
    Sparkline.drawAll(host());
    host().querySelectorAll('[data-detail]').forEach(el => el.onclick = () => Market.openDetail(el.dataset.detail));
  }

  function cardHtml(s) {
    const up = s.change_pct >= 0;
    const spark = JSON.stringify(s.history.slice(-30));
    return `
      <div class="stock-card" data-detail="${s.ticker}">
        <div class="stock-card-head">
          <div class="stock-card-logo" style="background:${Market.colorFor(s.ticker)};">${s.ticker[0]}</div>
          <div><div class="stock-card-ticker">${s.ticker}</div><div class="stock-card-name">${s.name}</div></div>
        </div>
        <canvas data-spark='${spark}' class="stock-card-spark" style="width:100%;height:36px;"></canvas>
        <div class="stock-card-foot">
          <div class="stock-card-price tabular">$${Market.fmtPrice(s.price)}</div>
          <div class="stock-card-change ${up?'up':'down'}">${Market.fmtPct(s.change_pct)}</div>
        </div>
      </div>`;
  }

  async function renderAlerts() {
    const state = FinState.get();
    host().innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Alerts</div><div class="muted" style="font-size:13px;">Price triggers</div></div>
        <button class="btn btn-primary btn-sm" id="add-alert"><span class="material-symbols-outlined" style="font-size:16px;">add</span>New Alert</button>
      </div>
      <div class="card">
        ${state.alerts.length ? `
          <table class="table">
            <thead><tr><th>Symbol</th><th>Condition</th><th>Target</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${state.alerts.map((a, i) => `<tr>
                <td class="ticker-cell">${a.ticker}</td>
                <td>${a.condition}</td>
                <td class="tabular">$${a.target.toFixed(2)}</td>
                <td><span class="badge ${a.triggered?'up':''}">${a.triggered?'Triggered':'Active'}</span></td>
                <td class="ta-right"><button class="icon-btn" data-rm="${i}"><span class="material-symbols-outlined">delete</span></button></td>
              </tr>`).join('')}
            </tbody>
          </table>` :
          `<div class="empty"><span class="material-symbols-outlined">notifications_off</span><div class="empty-title">No alerts</div></div>`}
      </div>`;
    host().querySelector('#add-alert').onclick = () => openAlertModal();
    host().querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      const s = FinState.get();
      s.alerts.splice(parseInt(b.dataset.rm), 1);
      FinState.set({ alerts: s.alerts });
      renderAlerts();
    });
  }

  function openAlertModal() {
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="input-group"><label class="input-label">Ticker</label><input class="input" id="al-t" placeholder="AAPL"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div class="input-group"><label class="input-label">Condition</label>
          <select class="select" id="al-c"><option>above</option><option>below</option></select>
        </div>
        <div class="input-group"><label class="input-label">Target Price</label>
          <input type="number" class="input" id="al-p" value="100"/>
        </div>
      </div>`;
    const o = Modal.open({ title: 'New Price Alert', body, width: 460,
      footer: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="al-save">Create</button>` });
    o.querySelector('#al-save').onclick = () => {
      const s = FinState.get();
      s.alerts.push({ ticker: o.querySelector('#al-t').value.toUpperCase(), condition: o.querySelector('#al-c').value, target: parseFloat(o.querySelector('#al-p').value), triggered: false });
      FinState.set({ alerts: s.alerts });
      Modal.close(o);
      Toast.show({ title: 'Alert created', type: 'success' });
      renderAlerts();
    };
  }

  async function renderScreener() {
    const stocks = await Api.getStocks();
    host().innerHTML = `
      <div class="markets-header"><div><div class="markets-title">Screener</div></div></div>
      <div class="card" style="margin-bottom:14px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
          <div class="input-group"><label class="input-label">Min Price</label><input type="number" class="input" id="sc-pmin" value="0"/></div>
          <div class="input-group"><label class="input-label">Max Price</label><input type="number" class="input" id="sc-pmax" value="10000"/></div>
          <div class="input-group"><label class="input-label">Min Change %</label><input type="number" class="input" id="sc-chmin" value="-100"/></div>
          <div class="input-group"><label class="input-label">Max P/E</label><input type="number" class="input" id="sc-pe" value="100"/></div>
          <div class="input-group"><label class="input-label">Sector</label>
            <select class="select" id="sc-sec"><option>All</option>${[...new Set(stocks.map(s=>s.sector))].map(s=>`<option>${s}</option>`).join('')}</select>
          </div>
        </div>
        <div style="margin-top:14px;display:flex;justify-content:flex-end;"><button class="btn btn-primary" id="sc-run">Run Screen</button></div>
      </div>
      <div id="sc-results"></div>`;
    host().querySelector('#sc-run').onclick = run;
    run();
    function run() {
      const pmin = parseFloat(host().querySelector('#sc-pmin').value);
      const pmax = parseFloat(host().querySelector('#sc-pmax').value);
      const cmin = parseFloat(host().querySelector('#sc-chmin').value);
      const pe = parseFloat(host().querySelector('#sc-pe').value);
      const sec = host().querySelector('#sc-sec').value;
      const r = stocks.filter(s => s.price >= pmin && s.price <= pmax && s.change_pct >= cmin && (s.pe || 0) <= pe && (sec === 'All' || s.sector === sec));
      host().querySelector('#sc-results').innerHTML = `<div class="card" style="padding:0;"><table class="table">
        <thead><tr><th>Ticker</th><th>Name</th><th>Sector</th><th class="ta-right">Price</th><th class="ta-right">Change</th><th class="ta-right">P/E</th></tr></thead>
        <tbody>${r.map(s => `<tr data-detail="${s.ticker}"><td class="ticker-cell">${s.ticker}</td><td class="name-cell">${s.name}</td><td><span class="badge">${s.sector}</span></td><td class="ta-right">$${Market.fmtPrice(s.price)}</td><td class="ta-right ${s.change_pct>=0?'delta-up':'delta-down'}">${Market.fmtPct(s.change_pct)}</td><td class="ta-right">${s.pe || '—'}</td></tr>`).join('')}</tbody>
      </table></div><div class="muted" style="font-size:12px;margin-top:8px;">${r.length} matches</div>`;
      host().querySelectorAll('[data-detail]').forEach(el => el.onclick = () => Market.openDetail(el.dataset.detail));
    }
  }

  function renderSupport() {
    host().innerHTML = `
      <div class="markets-header"><div><div class="markets-title">Support</div></div></div>
      <div class="card">
        <h3 style="margin-top:0;">FAQ</h3>
        <details style="margin:10px 0;"><summary style="cursor:pointer;font-weight:600;">How do trades work?</summary><p class="muted">Orders execute at current market price plus small fees.</p></details>
        <details style="margin:10px 0;"><summary style="cursor:pointer;font-weight:600;">Cheat code?</summary><p class="muted">Type FINSIM on your keyboard in Casual Mode.</p></details>
        <details style="margin:10px 0;"><summary style="cursor:pointer;font-weight:600;">Command palette?</summary><p class="muted">Press Ctrl+K (or Cmd+K on Mac) anywhere.</p></details>
      </div>`;
  }

  return { go, current: () => current };
})();