/* ============ DASHBOARD — replicates screenshot layout ============ */
const Dashboard = (() => {
  let mainChart = null;
  let activeTf = '1D';
  let activeMode = 'line';
  let activeIndex = 'SP500';
  let mostActiveTab = 'active';

  async function render(host) {
    host.innerHTML = `
      <div class="dash-grid">

        <!-- LEFT TOP: Most Active / Movers -->
        <div class="card dash-active">
          <div class="card-head">
            <div class="card-title">
              <span class="active-tab ${mostActiveTab==='active'?'on':''}" data-mat="active" style="cursor:pointer;">Most active</span>
              <span class="active-tab ${mostActiveTab==='movers'?'on':''}" data-mat="movers" style="cursor:pointer;color:var(--text-muted);font-weight:400;">Movers</span>
            </div>
            <button class="card-action"><span class="material-symbols-outlined">arrow_forward</span></button>
          </div>
          <div id="active-table"></div>
        </div>

        <!-- CENTER: Big chart -->
        <div class="card dash-chart">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
            <div>
              <div style="font-size:18px;font-weight:800;">SPX <span style="color:var(--text-muted);font-weight:500;font-size:12px;margin-left:6px;">S&P 500 INDEX</span></div>
            </div>
            <div style="text-align:right;">
              <div id="idx-price" class="tabular" style="font-size:22px;font-weight:700;">—</div>
              <div id="idx-meta" class="muted" style="font-size:11px;">At close</div>
            </div>
          </div>

          <div class="tf-row" id="tf-row">
            ${['1D','1W','3M','6M','YTD','1Y','2Y','ALL'].map(t =>
              `<span class="tf-btn ${t===activeTf?'active':''}" data-tf="${t}">${t}</span>`).join('')}
          </div>

          <div id="main-chart"></div>

          <div class="chart-stats-row" id="idx-stats">
            <div class="stat-cell"><div class="stat-label">Open</div><div class="stat-value" id="s-open">—</div></div>
            <div class="stat-cell"><div class="stat-label">High</div><div class="stat-value" id="s-high">—</div></div>
            <div class="stat-cell"><div class="stat-label">Low</div><div class="stat-value" id="s-low">—</div></div>
            <div class="stat-cell"><div class="stat-label">Vol</div><div class="stat-value">6,860.19</div></div>
            <div class="stat-cell"><div class="stat-label">P/E</div><div class="stat-value">NA</div></div>
            <div class="stat-cell"><div class="stat-label">52W</div><div class="stat-value">6,920.39</div></div>
            <div class="stat-cell"><div class="stat-label">Mkt Cap</div><div class="stat-value">NA</div></div>
            <div class="stat-cell"><div class="stat-label">Avg Vol</div><div class="stat-value">5,456 B</div></div>
          </div>
        </div>

        <!-- RIGHT: Events -->
        <div class="card dash-events">
          <div class="card-head">
            <div class="card-title">Events</div>
            <button class="card-action"><span class="material-symbols-outlined">arrow_forward</span></button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);">
              <span class="material-symbols-outlined" style="font-size:16px;">calendar_month</span>
              <span id="ev-month">${monthYear()}</span>
            </div>
            <div class="pills"><button class="pill active">Upcoming</button></div>
          </div>
          <div id="events-list" class="events-list"></div>
        </div>

        <!-- BOTTOM LEFT: Global Index -->
        <div class="card dash-global">
          <div class="card-head">
            <div class="card-title">Global Index</div>
            <button class="card-action"><span class="material-symbols-outlined">arrow_forward</span></button>
          </div>
          <div id="global-table"></div>
        </div>

        <!-- BOTTOM CENTER: Sectors -->
        <div class="card" style="grid-column:2;grid-row:2;">
          <div class="card-head">
            <div class="card-title">
              <span class="sec-tab on" data-st="sectors">Sectors</span>
              <span class="sec-tab" data-st="commodities" style="color:var(--text-muted);font-weight:400;cursor:pointer;">Commodities</span>
              <span class="sec-tab" data-st="currencies" style="color:var(--text-muted);font-weight:400;cursor:pointer;">Currencies</span>
            </div>
            <button class="card-action"><span class="material-symbols-outlined">arrow_forward</span></button>
          </div>
          <div id="sectors-list"></div>
        </div>

      </div>`;

    // bind events
    host.querySelectorAll('[data-mat]').forEach(b => b.onclick = () => {
      mostActiveTab = b.dataset.mat;
      renderActive();
    });
    host.querySelectorAll('[data-tf]').forEach(b => b.onclick = () => {
      host.querySelectorAll('[data-tf]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      activeTf = b.dataset.tf;
      refreshChart();
    });

    await Promise.all([
      renderActive(),
      renderChart(),
      renderEvents(),
      renderGlobal(),
      renderSectors(),
    ]);
  }

  async function refresh() {
    // light refresh - update tickers without rebuilding
    if (!document.querySelector('.dash-grid')) return;
    renderActive();
    renderGlobal();
    renderSectors();
    refreshChart();
  }

  function monthYear() {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  async function renderActive() {
    const stocks = await Api.getStocks();
    let list;
    if (mostActiveTab === 'active') {
      list = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 10);
    } else {
      list = [...stocks].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 10);
    }
    const host = document.getElementById('active-table');
    if (!host) return;
    host.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Symbol</th><th>Name</th>
          <th class="ta-right">Price</th>
          <th class="ta-right">Change</th>
          <th class="ta-right">Change %</th>
        </tr></thead>
        <tbody>
          ${list.map(s => {
            const up = s.change_pct >= 0;
            const nm = s.name.length > 14 ? s.name.slice(0,13)+'…' : s.name;
            return `<tr data-detail="${s.ticker}">
              <td class="ticker-cell">${s.ticker}</td>
              <td class="name-cell">${nm}</td>
              <td class="ta-right tabular">${Market.fmtPrice(s.price)}</td>
              <td class="ta-right ${up?'delta-up':'delta-down'}">${up?'+ ':'- '}${Math.abs(s.change).toFixed(2)}</td>
              <td class="ta-right ${up?'delta-up':'delta-down'}">${up?'+ ':'- '}${Math.abs(s.change_pct).toFixed(2)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    host.querySelectorAll('[data-detail]').forEach(el => el.onclick = () => Market.openDetail(el.dataset.detail));
  }

  async function renderChart() {
    const indices = await Api.getIndices();
    const idx = indices.find(i => i.ticker === activeIndex) || indices[0];
    if (!idx) return;
    document.getElementById('idx-price').textContent = Market.fmtPrice(idx.price);
    const meta = document.getElementById('idx-meta');
    const up = idx.change_pct >= 0;
    meta.innerHTML = `<span class="${up?'up':'down'}">${up?'▲':'▼'} ${Math.abs(idx.change).toFixed(2)} (${Math.abs(idx.change_pct).toFixed(2)}%)</span> · At close`;

    document.getElementById('s-open').textContent = Market.fmtPrice(idx.open);
    document.getElementById('s-high').textContent = Market.fmtPrice(idx.high);
    document.getElementById('s-low').textContent = Market.fmtPrice(idx.low);

    const host = document.getElementById('main-chart');
    if (!mainChart) {
      mainChart = new FinChart(host, { height: 340, showVolume: true });
    }
    mainChart.setData(idx.history.slice(-60));
  }

  async function refreshChart() {
    const indices = await Api.getIndices();
    const idx = indices.find(i => i.ticker === activeIndex);
    if (!idx || !mainChart) return;
    const slices = { '1D': 24, '1W': 50, '3M': 90, '6M': 130, 'YTD': 160, '1Y': 180, '2Y': 200, 'ALL': 200 };
    const n = slices[activeTf] || 60;
    mainChart.setData(idx.history.slice(-n));
    document.getElementById('idx-price').textContent = Market.fmtPrice(idx.price);
  }

  async function renderEvents() {
    const host = document.getElementById('events-list');
    if (!host) return;
    const tickers = ['GIS', 'MU', 'NKE', 'BB', 'RIVN', 'AAPL', 'TSLA', 'AMGN'];
    const today = new Date();
    const items = tickers.map((t, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i + 2);
      const stock = Api.findStock(t);
      return {
        date: d, ticker: t,
        name: stock ? stock.name : t,
        type: i % 3 === 0 ? 'earnings' : (i % 3 === 1 ? 'dividend' : 'split'),
      };
    });
    host.innerHTML = items.map(e => `
      <div class="event-row">
        <div class="event-date">
          ${e.date.toLocaleString('en-US',{month:'short'}).toUpperCase()}
          <strong>${e.date.getDate()}</strong>
        </div>
        <div class="event-meta">
          <div class="event-ticker">${e.ticker}</div>
          <div class="event-name">${e.name}</div>
        </div>
        <div class="event-icon" title="${e.type}">
          <span class="material-symbols-outlined">
            ${e.type === 'earnings' ? 'event_available' : e.type === 'dividend' ? 'paid' : 'call_split'}
          </span>
        </div>
      </div>`).join('');
  }

  const INDEX_DOTS = {
    SP500: { cls: 'sp', text: 'S&P' },
    DOW30: { cls: 'dow', text: 'DJ' },
    HANGSENG: { cls: 'hs', text: 'HS' },
    NIKKEI225: { cls: 'nk', text: 'NK' },
    SHANGHAI: { cls: 'sh', text: 'SH' },
    RUT: { cls: 'rut', text: 'R' },
    FTSE: { cls: 'ftse', text: 'F' },
  };

  async function renderGlobal() {
    const indices = await Api.getIndices();
    const host = document.getElementById('global-table');
    if (!host) return;
    host.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Sectors</th>
          <th class="ta-right">Price</th>
          <th class="ta-right">Change</th>
          <th class="ta-right">Change %</th>
        </tr></thead>
        <tbody>
          ${indices.map(i => {
            const d = INDEX_DOTS[i.ticker] || { cls: '', text: i.ticker[0] };
            const up = i.change_pct >= 0;
            return `<tr data-idx="${i.ticker}">
              <td>
                <span style="display:inline-flex;align-items:center;gap:10px;">
                  <span class="sector-dot ${d.cls}" style="font-size:9px;font-weight:700;color:#fff;">${d.text}</span>
                  <span style="font-weight:600;">${i.ticker}</span>
                </span>
              </td>
              <td class="ta-right tabular">${Market.fmtPrice(i.price)}</td>
              <td class="ta-right ${up?'delta-up':'delta-down'}">${up?'+ ':'- '}${Math.abs(i.change).toFixed(2)}</td>
              <td class="ta-right ${up?'delta-up':'delta-down'}">${up?'+ ':'- '}${Math.abs(i.change_pct).toFixed(2)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    host.querySelectorAll('[data-idx]').forEach(el => el.onclick = () => {
      activeIndex = el.dataset.idx;
      refreshChart();
    });
  }

  async function renderSectors() {
    const sectors = await Api.getSectors();
    const host = document.getElementById('sectors-list');
    if (!host) return;
    host.innerHTML = `
      <div style="display:grid;grid-template-columns:28px 1fr 110px 90px 70px;gap:12px;padding:0 4px 8px;border-bottom:1px solid var(--border);font-size:11px;color:var(--text-muted);">
        <div></div><div>Sectors</div><div>Market weight</div><div>Market Cap</div><div style="text-align:right;">YTD%</div>
      </div>
      ${sectors.map(s => {
        const up = s.ytd_change >= 0;
        return `<div class="sector-row">
          <div class="sector-icon"><span class="material-symbols-outlined" style="color:${s.color};">${s.icon}</span></div>
          <div class="sector-name">${s.name}</div>
          <div class="sector-weight-cell">
            <div class="weight-bar"><div class="weight-bar-fill" style="width:${Math.min(100, s.weight * 3)}%;background:${s.color};"></div></div>
            <div class="sector-weight-pct">${s.weight.toFixed(2)}%</div>
          </div>
          <div class="sector-cap">${s.market_cap_t.toFixed(3)} T</div>
          <div class="sector-ytd ${up?'up':'down'}">${up?'+ ':'- '}${Math.abs(s.ytd_change).toFixed(2)}</div>
        </div>`;
      }).join('')}`;
  }

  return { render, refresh };
})();