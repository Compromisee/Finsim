/* ============ OPTIONS TRADING ============ */
const OptionsPage = (() => {
  let currentTicker = 'AAPL';
  let activeExpiry = 30;

  async function render(host) {
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Options Trading</div><div class="muted" style="font-size:13px;">Calls, puts, Greeks & strategies</div></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="input" id="opt-ticker" placeholder="Ticker" value="${currentTicker}" style="max-width:120px;text-transform:uppercase;"/>
          <button class="btn btn-primary btn-sm" id="opt-load">Load Chain</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div id="opt-summary"></div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">Options Chain</div>
          <div class="pills" id="opt-expiries"></div>
        </div>
        <div id="opt-chain" class="options-chain"></div>
      </div>

      <div class="card" style="margin-top:14px;">
        <div class="card-head"><div class="card-title">Your Open Positions</div></div>
        <div id="opt-positions"></div>
      </div>
    `;

    host.querySelector('#opt-load').onclick = () => {
      currentTicker = host.querySelector('#opt-ticker').value.toUpperCase();
      loadChain();
    };
    host.querySelector('#opt-ticker').onkeydown = e => {
      if (e.key === 'Enter') { currentTicker = e.target.value.toUpperCase(); loadChain(); }
    };
    loadChain();
    renderPositions();
  }

  async function loadChain() {
    const data = await Api.getOptions(currentTicker);
    if (!data || data.error) {
      document.getElementById('opt-chain').innerHTML = `<div class="empty"><span class="material-symbols-outlined">error</span><div class="empty-title">Stock not found</div></div>`;
      return;
    }

    document.getElementById('opt-summary').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:20px;font-weight:700;">${data.ticker}</div>
          <div class="muted" style="font-size:12px;">Current price: <strong class="tabular">$${data.price.toFixed(2)}</strong></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);max-width:380px;text-align:right;line-height:1.5;">
          Strikes are <strong style="color:var(--green);">In-the-money</strong> (below price for puts, above for calls)
          and <strong style="color:var(--text-faint);">Out-of-the-money</strong> otherwise.
        </div>
      </div>`;

    const expiriesHost = document.getElementById('opt-expiries');
    expiriesHost.innerHTML = data.expiries.map(d =>
      `<button class="pill ${d===activeExpiry?'active':''}" data-exp="${d}">${d}D</button>`
    ).join('');
    expiriesHost.querySelectorAll('[data-exp]').forEach(b => b.onclick = () => {
      activeExpiry = parseInt(b.dataset.exp);
      loadChain();
    });

    const filtered = data.chain.filter(c => c.expiry_days === activeExpiry);
    const host = document.getElementById('opt-chain');
    host.innerHTML = `
      <table>
        <thead>
          <tr>
            <th colspan="4" style="color:var(--green);">CALLS</th>
            <th>STRIKE</th>
            <th colspan="4" style="color:var(--red);">PUTS</th>
          </tr>
          <tr>
            <th>Bid</th><th>Ask</th><th>Δ</th><th>OI</th>
            <th></th>
            <th>Bid</th><th>Ask</th><th>Δ</th><th>OI</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(row => {
            const callItm = row.strike < data.price;
            const putItm = row.strike > data.price;
            const cspread = row.call_premium * 0.04;
            const pspread = row.put_premium * 0.04;
            return `<tr>
              <td class="${callItm?'itm':'otm'}" data-strike="${row.strike}" data-kind="call">${(row.call_premium-cspread).toFixed(2)}</td>
              <td class="${callItm?'itm':'otm'}" data-strike="${row.strike}" data-kind="call">${(row.call_premium+cspread).toFixed(2)}</td>
              <td class="${callItm?'itm':'otm'}">${row.call_delta}</td>
              <td class="${callItm?'itm':'otm'}">${(row.call_oi/1000).toFixed(1)}K</td>
              <td class="strike" data-strike="${row.strike}">${row.strike.toFixed(2)}</td>
              <td class="${putItm?'itm':'otm'}" data-strike="${row.strike}" data-kind="put">${(row.put_premium-pspread).toFixed(2)}</td>
              <td class="${putItm?'itm':'otm'}" data-strike="${row.strike}" data-kind="put">${(row.put_premium+pspread).toFixed(2)}</td>
              <td class="${putItm?'itm':'otm'}">${row.put_delta}</td>
              <td class="${putItm?'itm':'otm'}">${(row.put_oi/1000).toFixed(1)}K</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    host.querySelectorAll('[data-kind]').forEach(td => td.onclick = () => {
      openOrderModal(td.dataset.kind, parseFloat(td.dataset.strike), data);
    });
  }

  function openOrderModal(kind, strike, chainData) {
    let qty = 1;
    let action = 'buy';
    const body = document.createElement('div');

    function render() {
      const row = chainData.chain.find(c => c.strike === strike && c.expiry_days === activeExpiry);
      const premium = kind === 'call' ? row.call_premium : row.put_premium;
      const total = premium * qty * 100;
      const fees = Math.max(0.65 * qty, 1.0);
      const net = action === 'buy' ? total + fees : total - fees;
      const state = FinState.get();

      body.innerHTML = `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted);">
            <span>${chainData.ticker} ${kind.toUpperCase()}</span>
            <span>${activeExpiry}D expiry</span>
          </div>
          <div style="font-size:24px;font-weight:800;margin-top:4px;">$${strike.toFixed(2)} strike</div>
        </div>
        <div class="trade-segment" style="margin-bottom:14px;">
          <button class="${action==='buy'?'active buy':''}" data-a="buy">Buy to Open</button>
          <button class="${action==='sell'?'active sell':''}" data-a="sell">Sell to Open (Write)</button>
        </div>
        <div class="input-group" style="margin-bottom:14px;">
          <label class="input-label">Contracts (100 shares each)</label>
          <input type="number" class="input" id="opt-qty" min="1" value="${qty}"/>
        </div>
        <div class="trade-summary">
          <div class="trade-summary-row"><span>Premium / share</span><span class="val">$${premium.toFixed(2)}</span></div>
          <div class="trade-summary-row"><span>Shares (qty × 100)</span><span class="val">${qty*100}</span></div>
          <div class="trade-summary-row"><span>Subtotal</span><span class="val">$${total.toFixed(2)}</span></div>
          <div class="trade-summary-row"><span>Fees</span><span class="val">$${fees.toFixed(2)}</span></div>
          <div class="trade-summary-row total"><span>${action==='buy'?'Total Cost':'Credit Received'}</span><span class="val">$${net.toFixed(2)}</span></div>
          <div class="trade-summary-row" style="margin-top:6px;"><span>Wallet</span><span class="val">$${Market.fmtPrice(state.cash)}</span></div>
        </div>
      `;
      body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { action = b.dataset.a; render(); });
      body.querySelector('#opt-qty').oninput = e => { qty = Math.max(1, parseInt(e.target.value)||1); render(); };
    }
    render();

    const modal = Modal.open({
      title: 'Place Options Order', body, width: 480,
      footer: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="opt-confirm">Confirm Order</button>`
    });

    modal.querySelector('#opt-confirm').onclick = async () => {
      const res = await Api.tradeOption({
        ticker: chainData.ticker, kind, strike,
        expiry_days: activeExpiry, quantity: qty, action,
      });
      if (res && res.success) {
        FinState.addOption(res);
        Sound.tradeSuccess();
        Toast.show({ title: 'Order Filled', body: `${action.toUpperCase()} ${qty}x ${chainData.ticker} ${strike} ${kind}`, type: 'success' });
        Modal.close(modal);
        renderPositions();
      } else {
        Sound.tradeError();
        Toast.show({ title: 'Order failed', type: 'error' });
      }
    };
  }

  function renderPositions() {
    const host = document.getElementById('opt-positions');
    if (!host) return;
    const opts = FinState.get().options;
    if (!opts.length) {
      host.innerHTML = `<div class="empty"><span class="material-symbols-outlined">layers</span><div class="empty-title">No open options</div><div class="empty-body">Open positions appear here.</div></div>`;
      return;
    }
    host.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Ticker</th><th>Type</th><th>Strike</th><th>Expiry</th>
          <th>Qty</th><th class="ta-right">Entry Premium</th><th class="ta-right">Cost</th>
        </tr></thead>
        <tbody>
          ${opts.map(o => {
            const exp = new Date(o.expiry).toLocaleDateString();
            const sideClass = o.action === 'buy' ? 'delta-up' : 'delta-down';
            return `<tr>
              <td class="ticker-cell">${o.ticker}</td>
              <td><span class="badge ${o.kind==='call'?'up':'down'}">${o.action.toUpperCase()} ${o.kind.toUpperCase()}</span></td>
              <td class="tabular">$${o.strike.toFixed(2)}</td>
              <td>${exp}</td>
              <td>${o.quantity}</td>
              <td class="ta-right tabular">$${o.premium.toFixed(2)}</td>
              <td class="ta-right tabular ${sideClass}">${o.action==='buy'?'-':'+'}$${Math.abs(o.total).toFixed(2)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  return { render };
})();