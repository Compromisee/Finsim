/* ============ MARKETS / STOCKS DISCOVERY + DETAIL ============ */
const Market = (() => {
  const SECTOR_COLORS = {
    Tech: '#60a5fa', Finance: '#26a69a', Healthcare: '#ff6b6b',
    Biotech: '#a78bfa', Military: '#94a3b8', Energy: '#f59e0b',
    Pharma: '#f472b6', Retail: '#fb923c', Crypto: '#fbbf24',
    'Real Estate': '#34d399',
  };
  const SECTOR_ICONS = {
    Tech: 'memory', Finance: 'account_balance', Healthcare: 'health_and_safety',
    Biotech: 'biotech', Military: 'security', Energy: 'bolt',
    Pharma: 'medication', Retail: 'shopping_bag', Crypto: 'currency_bitcoin',
    'Real Estate': 'apartment',
  };

  let filters = { sector: 'All', risk: 'All', view: 'grid', sort: 'change_pct', page: 1, perPage: 50 };

  function colorFor(ticker) {
    let h = 0;
    for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
    const hue = h % 360;
    return `hsl(${hue}, 45%, 45%)`;
  }

  function fmtPrice(p) { return Number(p).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtPct(p) { const s = p >= 0 ? '+' : ''; return `${s}${p.toFixed(2)}%`; }
  function fmtCap(c) {
    if (c >= 1e12) return (c/1e12).toFixed(2) + 'T';
    if (c >= 1e9) return (c/1e9).toFixed(2) + 'B';
    if (c >= 1e6) return (c/1e6).toFixed(2) + 'M';
    return c.toLocaleString();
  }

  async function renderPage(container) {
    container.innerHTML = `
      <div class="markets-header">
        <div>
          <div class="markets-title">Markets</div>
          <div class="muted" style="font-size:13px;margin-top:3px;">Discover, screen and trade across all sectors</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <div class="pills">
            <button class="pill ${filters.view === 'grid' ? 'active' : ''}" data-view="grid">
              <span class="material-symbols-outlined" style="font-size:14px;">grid_view</span>
            </button>
            <button class="pill ${filters.view === 'list' ? 'active' : ''}" data-view="list">
              <span class="material-symbols-outlined" style="font-size:14px;">list</span>
            </button>
          </div>
          <select class="select" id="sort-select" style="width:auto;">
            <option value="change_pct">Sort: Change %</option>
            <option value="price">Sort: Price</option>
            <option value="market_cap">Sort: Market Cap</option>
            <option value="volume">Sort: Volume</option>
            <option value="name">Sort: Name</option>
          </select>
          <button class="btn btn-primary btn-sm" id="generate-stock-btn">
            <span class="material-symbols-outlined" style="font-size:16px;">add</span>
            Generate Stock
          </button>
        </div>
      </div>

      <div class="markets-filters" id="sector-filters">
        ${['All','Tech','Finance','Healthcare','Biotech','Military','Energy','Pharma','Retail','Crypto','Real Estate']
          .map(s => `<button class="filter-pill ${filters.sector===s?'active':''}" data-sector="${s}">${s}</button>`).join('')}
      </div>

      <div class="markets-filters">
        ${['All','High','Medium','Low'].map(r => `<button class="filter-pill ${filters.risk===r?'active':''}" data-risk="${r}">${r} Risk</button>`).join('')}
      </div>

      <div id="market-results"></div>
    `;

    container.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
      filters.view = b.dataset.view; renderPage(container);
    });
    container.querySelectorAll('[data-sector]').forEach(b => b.onclick = () => {
      filters.sector = b.dataset.sector; renderPage(container);
    });
    container.querySelectorAll('[data-risk]').forEach(b => b.onclick = () => {
      filters.risk = b.dataset.risk; renderPage(container);
    });
    container.querySelector('#sort-select').value = filters.sort;
    container.querySelector('#sort-select').onchange = e => {
      filters.sort = e.target.value; renderResults(container);
    };
    container.querySelector('#generate-stock-btn').onclick = async () => {
      Toast.show({ title: 'Generating stock…', type: 'info', duration: 1500 });
      const settings = FinState.getSettings();
      const res = await Api.generateStock({ use_ai: settings.useAI, count: 1 });
      if (res && res.length) {
        Toast.show({ title: 'New stock added', body: res[0].ticker, type: 'success' });
        await Api.getStocks(true);
        renderResults(container);
      } else {
        Toast.show({ title: 'Generation failed', type: 'error' });
      }
    };

    await renderResults(container);
  }

  async function renderResults(container) {
    const host = container.querySelector('#market-results');
    host.innerHTML = '<div class="empty"><span class="material-symbols-outlined">candlestick_chart</span><div class="empty-title">Loading…</div></div>';
    const all = await Api.getStocks();
    let list = all.slice();
    if (filters.sector !== 'All') list = list.filter(s => s.sector === filters.sector);
    if (filters.risk !== 'All') list = list.filter(s => s.risk === filters.risk);

    list.sort((a, b) => {
      const k = filters.sort;
      if (k === 'name') return a.name.localeCompare(b.name);
      return (b[k] || 0) - (a[k] || 0);
    });

    if (filters.view === 'grid') {
      host.innerHTML = `<div class="market-grid">${list.map(cardHtml).join('')}</div>`;
    } else {
      host.innerHTML = listHtml(list);
    }
    Sparkline.drawAll(host);
    host.querySelectorAll('[data-detail]').forEach(el => el.onclick = () => openDetail(el.dataset.detail));
  }

  function cardHtml(s) {
    const up = s.change_pct >= 0;
    const spark = JSON.stringify(s.history.slice(-30));
    const riskClass = s.risk === 'High' ? 'risk-high' : s.risk === 'Medium' ? 'risk-med' : 'risk-low';
    return `
      <div class="stock-card" data-detail="${s.ticker}">
        <div class="stock-card-badges">
          <span class="badge ${riskClass}">${s.risk}</span>
        </div>
        <div class="stock-card-head">
          <div class="stock-card-logo" style="background:${colorFor(s.ticker)};">${s.ticker[0]}</div>
          <div>
            <div class="stock-card-ticker">${s.ticker}</div>
            <div class="stock-card-name">${s.name}</div>
          </div>
        </div>
        <canvas data-spark='${spark}' class="stock-card-spark" style="width:100%;height:36px;"></canvas>
        <div class="stock-card-foot">
          <div class="stock-card-price tabular">$${fmtPrice(s.price)}</div>
          <div class="stock-card-change ${up?'up':'down'}">${fmtPct(s.change_pct)}</div>
        </div>
      </div>`;
  }

  function listHtml(list) {
    return `
      <div class="card" style="padding:0;">
        <table class="table">
          <thead>
            <tr>
              <th>Symbol</th><th>Name</th><th>Sector</th>
              <th class="ta-right">Price</th>
              <th class="ta-right">Change</th>
              <th class="ta-right">Change %</th>
              <th class="ta-center">Trend</th>
              <th class="ta-right">Mkt Cap</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(s => {
              const up = s.change_pct >= 0;
              const spark = JSON.stringify(s.history.slice(-30));
              return `
              <tr data-detail="${s.ticker}">
                <td class="ticker-cell">${s.ticker}</td>
                <td class="name-cell">${s.name}</td>
                <td><span class="badge">${s.sector}</span></td>
                <td class="ta-right">$${fmtPrice(s.price)}</td>
                <td class="ta-right ${up?'delta-up':'delta-down'}">${up?'+':''}${s.change.toFixed(2)}</td>
                <td class="ta-right ${up?'delta-up':'delta-down'}">${fmtPct(s.change_pct)}</td>
                <td class="ta-center"><canvas data-spark='${spark}' style="width:80px;height:24px;display:inline-block;vertical-align:middle;"></canvas></td>
                <td class="ta-right">${fmtCap(s.market_cap)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // ============ STOCK DETAIL ============
  let detailChart = null;
  let activeTimeframe = '1D';
  let activeMode = 'line';

  async function openDetail(ticker) {
    const stock = Api.findStock(ticker) || await Api.getStock(ticker);
    if (!stock) return;

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="detail-header">
        <div class="detail-logo" style="background:${colorFor(stock.ticker)};">${stock.ticker[0]}</div>
        <div style="flex:1;">
          <div class="detail-name">${stock.name}</div>
          <div class="detail-sub">
            <span style="font-weight:600;color:var(--text-2);">${stock.ticker}</span>
            <span>·</span><span>${stock.sector}</span>
            <span>·</span><span class="badge ${stock.risk==='High'?'risk-high':stock.risk==='Medium'?'risk-med':'risk-low'}">${stock.risk} Risk</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:26px;font-weight:800;" class="tabular">$${fmtPrice(stock.price)}</div>
          <div class="${stock.change_pct>=0?'up':'down'}" style="font-weight:600;">${fmtPct(stock.change_pct)} (${stock.change>=0?'+':''}${stock.change.toFixed(2)})</div>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="tf-row" id="tf-row" style="margin:0;">
                ${['1D','1W','3M','6M','YTD','1Y','2Y','ALL'].map(t =>
                  `<button class="tf-btn ${t==='1D'?'active':''}" data-tf="${t}">${t}</button>`).join('')}
              </div>
              <div class="chart-type-toggle">
                <button class="active" data-chart-mode="line"><span class="material-symbols-outlined">show_chart</span></button>
                <button data-chart-mode="candle"><span class="material-symbols-outlined">candlestick_chart</span></button>
              </div>
            </div>
            <div id="detail-chart" style="margin-top:14px;"></div>

            <div class="chart-stats-row">
              <div class="stat-cell"><div class="stat-label">Open</div><div class="stat-value">$${fmtPrice(stock.open)}</div></div>
              <div class="stat-cell"><div class="stat-label">High</div><div class="stat-value">$${fmtPrice(stock.high)}</div></div>
              <div class="stat-cell"><div class="stat-label">Low</div><div class="stat-value">$${fmtPrice(stock.low)}</div></div>
              <div class="stat-cell"><div class="stat-label">Vol</div><div class="stat-value">${fmtCap(stock.volume)}</div></div>
              <div class="stat-cell"><div class="stat-label">P/E</div><div class="stat-value">${stock.pe || '—'}</div></div>
              <div class="stat-cell"><div class="stat-label">52W H</div><div class="stat-value">$${fmtPrice(stock.high_52)}</div></div>
              <div class="stat-cell"><div class="stat-label">Mkt Cap</div><div class="stat-value">${fmtCap(stock.market_cap)}</div></div>
              <div class="stat-cell"><div class="stat-label">Avg Vol</div><div class="stat-value">${fmtCap(stock.avg_volume || stock.volume)}</div></div>
            </div>
          </div>

          <div class="card" style="margin-top:14px;">
            <div class="card-head"><div class="card-title">Analyst Ratings</div></div>
            ${renderAnalystBar()}
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-head"><div class="card-title">Trade</div></div>
            <div class="trade-panel" id="trade-panel"></div>
          </div>

          <div class="card" style="margin-top:14px;">
            <div class="card-head"><div class="card-title">About</div></div>
            <p style="color:var(--text-muted);font-size:13px;line-height:1.55;margin:0;">
              ${stock.description || `${stock.name} (${stock.ticker}) operates in the ${stock.sector} sector with a beta of ${stock.beta}.`}
            </p>
          </div>
        </div>
      </div>
    `;

    const overlay = Modal.open({ title: '', body, width: 1080 });
    overlay.querySelector('.modal-head').style.display = 'none';

    setTimeout(() => {
      const chartHost = document.getElementById('detail-chart');
      detailChart = new FinChart(chartHost, { height: 320, showVolume: true });
      detailChart.setData(stock.history.slice(-40));

      document.querySelectorAll('#tf-row .tf-btn').forEach(b => b.onclick = async () => {
        document.querySelectorAll('#tf-row .tf-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        activeTimeframe = b.dataset.tf;
        const h = await Api.getHistory(stock.ticker, activeTimeframe);
        detailChart.setData(h);
      });
      document.querySelectorAll('[data-chart-mode]').forEach(b => b.onclick = () => {
        document.querySelectorAll('[data-chart-mode]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        activeMode = b.dataset.chartMode;
        detailChart.setMode(activeMode);
      });

      renderTradePanel(document.getElementById('trade-panel'), stock);
    }, 30);
  }

  function renderAnalystBar() {
    const dist = [
      { label: 'Strong Buy', pct: 35, color: '#16a34a' },
      { label: 'Buy', pct: 28, color: '#26a69a' },
      { label: 'Hold', pct: 22, color: '#94a3b8' },
      { label: 'Sell', pct: 10, color: '#f59e0b' },
      { label: 'Strong Sell', pct: 5, color: '#ef5350' },
    ];
    return `
      <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;background:var(--surface-2);">
        ${dist.map(d => `<div style="width:${d.pct}%;background:${d.color};"></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;flex-wrap:wrap;gap:8px;">
        ${dist.map(d => `<div style="font-size:11px;color:var(--text-muted);"><span style="display:inline-block;width:8px;height:8px;background:${d.color};border-radius:2px;margin-right:5px;"></span>${d.label} ${d.pct}%</div>`).join('')}
      </div>`;
  }

  function renderTradePanel(host, stock) {
    let action = 'buy';
    let qty = 1;
    let orderType = 'market';

    function render() {
      const state = FinState.get();
      const subtotal = qty * stock.price;
      const fees = Math.max(1, subtotal * 0.0005);
      const total = action === 'buy' ? subtotal + fees : subtotal - fees;
      const balanceAfter = action === 'buy' ? state.cash - total : state.cash + total;
      const owned = (state.holdings[stock.ticker] || {}).shares || 0;

      host.innerHTML = `
        <div class="trade-segment">
          <button class="${action==='buy'?'active buy':''}" data-act="buy">Buy</button>
          <button class="${action==='sell'?'active sell':''}" data-act="sell">Sell</button>
          <button class="${action==='short'?'active short':''}" data-act="short">Short</button>
        </div>

        <div class="input-group">
          <label class="input-label">Order Type</label>
          <select class="select" id="order-type">
            <option value="market" ${orderType==='market'?'selected':''}>Market</option>
            <option value="limit" ${orderType==='limit'?'selected':''}>Limit</option>
            <option value="stop" ${orderType==='stop'?'selected':''}>Stop</option>
          </select>
        </div>

        <div class="input-group">
          <label class="input-label">Quantity ${owned ? `· Owned: ${owned}` : ''}</label>
          <input type="number" class="input" id="qty" min="1" value="${qty}" />
        </div>

        <div class="trade-summary">
          <div class="trade-summary-row"><span>Price</span><span class="val">$${fmtPrice(stock.price)}</span></div>
          <div class="trade-summary-row"><span>Subtotal</span><span class="val">$${fmtPrice(subtotal)}</span></div>
          <div class="trade-summary-row"><span>Est. Fees</span><span class="val">$${fmtPrice(fees)}</span></div>
          <div class="trade-summary-row total"><span>Total</span><span class="val">$${fmtPrice(total)}</span></div>
          <div class="trade-summary-row" style="margin-top:8px;"><span>Wallet</span><span class="val">$${fmtPrice(state.cash)}</span></div>
          <div class="trade-summary-row"><span>After Trade</span><span class="val ${balanceAfter<0?'down':'up'}">$${fmtPrice(balanceAfter)}</span></div>
        </div>

        <button class="btn ${action==='buy'?'btn-green':action==='sell'?'btn-red':'btn-primary'} btn-block btn-lg" id="confirm-trade">
          ${action.toUpperCase()} ${qty} ${stock.ticker}
        </button>
      `;

      host.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { action = b.dataset.act; render(); });
      host.querySelector('#qty').oninput = e => { qty = Math.max(1, parseInt(e.target.value) || 1); render(); };
      host.querySelector('#order-type').onchange = e => { orderType = e.target.value; };

      host.querySelector('#confirm-trade').onclick = async () => {
        if (action === 'buy' && total > state.cash) {
          Toast.show({ title: 'Insufficient funds', type: 'error' });
          return;
        }
        if (action === 'sell' && owned < qty) {
          Toast.show({ title: 'Insufficient shares', type: 'error' });
          return;
        }
        const receipt = await Api.trade({ ticker: stock.ticker, quantity: qty, action, order_type: orderType });
        if (receipt && receipt.success) {
          const r = FinState.executeTrade(receipt);
          if (r.ok) {
            showReceipt(receipt);
            render();
          } else Toast.show({ title: r.error, type: 'error' });
        }
      };
    }
    render();
  }

  function showReceipt(r) {
    Modal.open({
      title: 'Trade Receipt',
      width: 460,
      body: `
        <div style="text-align:center;margin-bottom:18px;">
          <div style="width:56px;height:56px;border-radius:50%;background:color-mix(in srgb,var(--green) 18%,transparent);display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px;">
            <span class="material-symbols-outlined" style="font-size:32px;color:var(--green);">check_circle</span>
          </div>
          <div style="font-size:18px;font-weight:700;">Order Executed</div>
          <div class="muted" style="font-size:12px;margin-top:3px;">${new Date(r.timestamp).toLocaleString()}</div>
        </div>
        <div class="trade-summary">
          <div class="trade-summary-row"><span>Action</span><span class="val">${r.action.toUpperCase()}</span></div>
          <div class="trade-summary-row"><span>Symbol</span><span class="val">${r.ticker}</span></div>
          <div class="trade-summary-row"><span>Quantity</span><span class="val">${r.quantity}</span></div>
          <div class="trade-summary-row"><span>Price/Share</span><span class="val">$${fmtPrice(r.price)}</span></div>
          ${r.slippage>0?`<div class="trade-summary-row"><span>Slippage</span><span class="val">$${r.slippage.toFixed(4)}</span></div>`:''}
          <div class="trade-summary-row"><span>Subtotal</span><span class="val">$${fmtPrice(r.subtotal)}</span></div>
          <div class="trade-summary-row"><span>Fees</span><span class="val">$${fmtPrice(r.fees)}</span></div>
          <div class="trade-summary-row total"><span>Net Total</span><span class="val">$${fmtPrice(r.total)}</span></div>
          <div class="trade-summary-row" style="margin-top:8px;"><span>New Balance</span><span class="val">$${fmtPrice(FinState.get().cash)}</span></div>
        </div>`,
      footer: `<button class="btn" onclick="window.print()">Print</button><button class="btn btn-primary" data-close>Done</button>`,
    });
    Toast.show({ title: 'Trade complete', body: `${r.action.toUpperCase()} ${r.quantity} ${r.ticker}`, type: 'success' });
  }

  return { renderPage, openDetail, colorFor, fmtPrice, fmtPct, fmtCap, SECTOR_COLORS, SECTOR_ICONS };
})();