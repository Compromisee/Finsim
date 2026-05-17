/* ============ PORTFOLIO PAGE ============ */
const Portfolio = (() => {
  let perfChart = null;
  let allocChart = null;

  async function renderPage(container) {
    const state = FinState.get();
    const stocks = await Api.getStocks();
    const stockMap = Object.fromEntries(stocks.map(s => [s.ticker, s]));

    let stockValue = 0;
    let totalCost = 0;
    Object.entries(state.holdings).forEach(([t, h]) => {
      const px = stockMap[t]?.price || h.avgCost;
      stockValue += px * h.shares;
      totalCost += h.avgCost * h.shares;
    });
    const netWorth = state.cash + stockValue + state.coinWallet;
    const unrealized = stockValue - totalCost;
    const dayChange = Object.entries(state.holdings).reduce((acc, [t, h]) => {
      const s = stockMap[t];
      return acc + (s ? s.change * h.shares : 0);
    }, 0);

    container.innerHTML = `
      <div class="markets-header">
        <div>
          <div class="markets-title">Portfolio</div>
          <div class="muted" style="font-size:13px;margin-top:3px;">Holdings, performance and allocation</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="exp-csv"><span class="material-symbols-outlined" style="font-size:16px;">download</span>CSV</button>
          <button class="btn btn-sm" id="exp-json"><span class="material-symbols-outlined" style="font-size:16px;">code</span>JSON</button>
        </div>
      </div>

      <div class="portfolio-stats">
        <div class="pstat-card">
          <div class="pstat-label">Net Worth</div>
          <div class="pstat-value">$${Market.fmtPrice(netWorth)}</div>
          <div class="pstat-delta ${dayChange>=0?'up':'down'}">${dayChange>=0?'+':''}$${Market.fmtPrice(dayChange)} today</div>
        </div>
        <div class="pstat-card">
          <div class="pstat-label">Cash</div>
          <div class="pstat-value">$${Market.fmtPrice(state.cash)}</div>
          <div class="pstat-delta muted">${(state.cash/netWorth*100).toFixed(1)}% of portfolio</div>
        </div>
        <div class="pstat-card">
          <div class="pstat-label">Equity Value</div>
          <div class="pstat-value">$${Market.fmtPrice(stockValue)}</div>
          <div class="pstat-delta ${unrealized>=0?'up':'down'}">Unrealized ${unrealized>=0?'+':''}$${Market.fmtPrice(unrealized)}</div>
        </div>
        <div class="pstat-card">
          <div class="pstat-label">Realized P/L</div>
          <div class="pstat-value ${state.realized>=0?'up':'down'}">${state.realized>=0?'+':''}$${Market.fmtPrice(state.realized)}</div>
          <div class="pstat-delta muted">Total dividends: $${Market.fmtPrice(state.dividendsTotal)}</div>
        </div>
      </div>

      <div class="portfolio-grid">
        <div>
          <div class="card">
            <div class="card-head">
              <div class="card-title">Performance</div>
              <div class="pills">
                <button class="pill active">Portfolio</button>
                <button class="pill">vs S&P 500</button>
              </div>
            </div>
            <div id="perf-chart"></div>
          </div>

          <div class="card" style="margin-top:14px;">
            <div class="card-head"><div class="card-title">Holdings <span class="ghost">${Object.keys(state.holdings).length}</span></div></div>
            ${renderHoldingsTable(state, stockMap)}
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-head"><div class="card-title">Asset Allocation</div></div>
            <div id="alloc-chart" style="display:flex;align-items:center;justify-content:center;padding:18px 0;"></div>
            <div id="alloc-legend"></div>
          </div>

          <div class="card" style="margin-top:14px;">
            <div class="card-head"><div class="card-title">Sector Breakdown</div></div>
            ${renderSectorBreakdown(state, stockMap)}
          </div>
        </div>
      </div>
    `;

    // perf chart
    setTimeout(() => {
      const ph = document.getElementById('perf-chart');
      perfChart = new FinChart(ph, { height: 240, showVolume: false });
      // synthesize history from netWorthHistory or fake
      let data = state.netWorthHistory.length > 5 ? state.netWorthHistory : null;
      if (!data) {
        data = [];
        let v = netWorth * 0.92;
        for (let i = 0; i < 60; i++) { v *= 1 + (Math.random() - 0.48) * 0.012; data.push(v); }
        data.push(netWorth);
      }
      perfChart.setData(data);

      renderAllocChart(netWorth, stockValue, state);
    }, 30);

    Sparkline.drawAll(container);
    container.querySelectorAll('[data-holding]').forEach(el => el.onclick = () => Market.openDetail(el.dataset.holding));

    document.getElementById('exp-csv').onclick = () => exportCsv(state, stockMap);
    document.getElementById('exp-json').onclick = () => FinState.exportSave();
  }

  function renderHoldingsTable(state, map) {
    const rows = Object.entries(state.holdings);
    if (!rows.length) {
      return `<div class="empty"><span class="material-symbols-outlined">work</span><div class="empty-title">No positions yet</div><div class="empty-body">Buy your first stock from the Markets page.</div></div>`;
    }
    return `
      <table class="table">
        <thead><tr>
          <th>Symbol</th><th>Shares</th>
          <th class="ta-right">Avg Cost</th>
          <th class="ta-right">Last</th>
          <th class="ta-right">Value</th>
          <th class="ta-right">P/L</th>
          <th class="ta-right">P/L %</th>
          <th class="ta-center">Trend</th>
        </tr></thead>
        <tbody>
          ${rows.map(([t, h]) => {
            const s = map[t];
            if (!s) return '';
            const val = h.shares * s.price;
            const pl = val - h.shares * h.avgCost;
            const plp = (pl / (h.shares * h.avgCost)) * 100;
            return `<tr data-holding="${t}">
              <td class="ticker-cell">${t}</td>
              <td>${h.shares}</td>
              <td class="ta-right">$${Market.fmtPrice(h.avgCost)}</td>
              <td class="ta-right">$${Market.fmtPrice(s.price)}</td>
              <td class="ta-right">$${Market.fmtPrice(val)}</td>
              <td class="ta-right ${pl>=0?'delta-up':'delta-down'}">${pl>=0?'+':''}$${Market.fmtPrice(pl)}</td>
              <td class="ta-right ${pl>=0?'delta-up':'delta-down'}">${plp>=0?'+':''}${plp.toFixed(2)}%</td>
              <td class="ta-center"><canvas data-spark='${JSON.stringify(s.history.slice(-30))}' style="width:70px;height:24px;"></canvas></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  function renderSectorBreakdown(state, map) {
    const sectors = {};
    Object.entries(state.holdings).forEach(([t, h]) => {
      const s = map[t]; if (!s) return;
      const v = s.price * h.shares;
      sectors[s.sector] = (sectors[s.sector] || 0) + v;
    });
    const total = Object.values(sectors).reduce((a,b)=>a+b,0) || 1;
    if (!Object.keys(sectors).length) return `<div class="muted" style="font-size:13px;text-align:center;padding:20px;">No holdings to analyze</div>`;
    return Object.entries(sectors).sort((a,b)=>b[1]-a[1]).map(([sec, val]) => {
      const pct = (val / total) * 100;
      const color = Market.SECTOR_COLORS[sec] || '#94a3b8';
      return `
        <div style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;">
            <span><span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:2px;margin-right:6px;"></span>${sec}</span>
            <span class="muted tabular">$${Market.fmtPrice(val)} · ${pct.toFixed(1)}%</span>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${color};"></div></div>
        </div>`;
    }).join('');
  }

  function renderAllocChart(netWorth, stockValue, state) {
    const host = document.getElementById('alloc-chart');
    const legend = document.getElementById('alloc-legend');
    const segments = [
      { label: 'Cash', val: state.cash, color: '#26a69a' },
      { label: 'Stocks', val: stockValue, color: '#ff6b6b' },
      { label: 'Crypto', val: state.coinWallet, color: '#fbbf24' },
    ].filter(s => s.val > 0);

    const size = 180, r = 70, sw = 24;
    let acc = 0;
    const cx = size/2, cy = size/2;
    const total = segments.reduce((a,b)=>a+b.val, 0) || 1;

    const svg = ['<svg width="180" height="180" viewBox="0 0 180 180">'];
    svg.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${sw}"/>`);
    segments.forEach(s => {
      const frac = s.val / total;
      const len = frac * Math.PI * 2 * r;
      const rest = Math.PI * 2 * r - len;
      svg.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}"
        stroke-dasharray="${len} ${rest}"
        stroke-dashoffset="${-acc}"
        transform="rotate(-90 ${cx} ${cy})"
        stroke-linecap="butt"/>`);
      acc += len;
    });
    svg.push(`<text x="${cx}" y="${cy-4}" text-anchor="middle" fill="var(--text-muted)" font-size="11">Net Worth</text>`);
    svg.push(`<text x="${cx}" y="${cy+14}" text-anchor="middle" fill="var(--text)" font-size="16" font-weight="700">$${Market.fmtCap(netWorth)}</text>`);
    svg.push('</svg>');
    host.innerHTML = svg.join('');

    legend.innerHTML = segments.map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:12px;">
        <span><span style="display:inline-block;width:10px;height:10px;background:${s.color};border-radius:2px;margin-right:8px;"></span>${s.label}</span>
        <span class="muted tabular">$${Market.fmtPrice(s.val)} (${(s.val/total*100).toFixed(1)}%)</span>
      </div>
    `).join('');
  }

  function exportCsv(state, map) {
    const rows = [['Ticker','Shares','AvgCost','Price','Value','PL','PL%']];
    Object.entries(state.holdings).forEach(([t, h]) => {
      const s = map[t]; if (!s) return;
      const val = h.shares * s.price;
      const pl = val - h.shares * h.avgCost;
      const plp = (pl / (h.shares * h.avgCost)) * 100;
      rows.push([t, h.shares, h.avgCost.toFixed(2), s.price.toFixed(2), val.toFixed(2), pl.toFixed(2), plp.toFixed(2)]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return { renderPage };
})();