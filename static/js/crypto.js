/* ============ CRYPTO EXCHANGE ============ */
const Crypto = (() => {
  async function render(host) {
    const coins = await Api.getCrypto(true);
    const state = FinState.get();

    let holdingsVal = 0;
    Object.entries(state.crypto).forEach(([sym, h]) => {
      const c = coins.find(x => x.symbol === sym);
      if (c) holdingsVal += c.price * h.amount;
    });

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Crypto Exchange</div><div class="muted" style="font-size:13px;">24/7 trading · No market hours</div></div>
        <div style="display:flex;gap:14px;align-items:center;">
          <div style="text-align:right;">
            <div class="muted" style="font-size:11px;">Coin Wallet</div>
            <div class="tabular" style="font-weight:700;">$${Market.fmtPrice(holdingsVal)}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div class="card-head"><div class="card-title">Your Holdings</div></div>
        ${renderHoldings(state, coins)}
      </div>

      <div class="crypto-grid">
        ${coins.map(renderCoinCard).join('')}
      </div>
    `;
    Sparkline.drawAll(host);
    host.querySelectorAll('[data-crypto]').forEach(el => el.onclick = () => openTradeModal(el.dataset.crypto, coins));
  }

  function renderHoldings(state, coins) {
    const entries = Object.entries(state.crypto);
    if (!entries.length) return `<div class="muted" style="text-align:center;padding:20px;font-size:13px;">No crypto holdings yet</div>`;
    return `
      <table class="table">
        <thead><tr><th>Asset</th><th>Amount</th><th class="ta-right">Avg Cost</th><th class="ta-right">Price</th><th class="ta-right">Value</th><th class="ta-right">P/L</th></tr></thead>
        <tbody>
          ${entries.map(([sym, h]) => {
            const c = coins.find(x => x.symbol === sym);
            if (!c) return '';
            const val = h.amount * c.price;
            const pl = val - h.amount * h.avgCost;
            return `<tr data-crypto="${sym}">
              <td><strong>${sym}</strong> <span class="muted">${c.name}</span></td>
              <td>${h.amount.toFixed(c.base<1?4:6)}</td>
              <td class="ta-right tabular">$${Market.fmtPrice(h.avgCost)}</td>
              <td class="ta-right tabular">$${Market.fmtPrice(c.price)}</td>
              <td class="ta-right tabular">$${Market.fmtPrice(val)}</td>
              <td class="ta-right tabular ${pl>=0?'delta-up':'delta-down'}">${pl>=0?'+':''}$${Market.fmtPrice(pl)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  function renderCoinCard(c) {
    const up = c.change_24h >= 0;
    return `
      <div class="crypto-card" data-crypto="${c.symbol}">
        <div class="crypto-head">
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="crypto-sym">${c.symbol.slice(0,3)}</div>
            <div>
              <div style="font-weight:700;font-size:14px;">${c.symbol}</div>
              <div class="crypto-name">${c.name}</div>
            </div>
          </div>
          ${c.stake_apy > 0 ? `<span class="badge up">${c.stake_apy}% APY</span>` : ''}
        </div>
        <div class="crypto-price">$${Market.fmtPrice(c.price)}</div>
        <canvas data-spark='${JSON.stringify(c.history.slice(-40))}' class="crypto-spark" style="width:100%;height:36px;"></canvas>
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span class="${up?'up':'down'}">${up?'+':''}${c.change_24h.toFixed(2)}% 24h</span>
          <span class="muted">Vol $${Market.fmtCap(c.volume_24h)}</span>
        </div>
      </div>`;
  }

  function openTradeModal(symbol, coins) {
    const c = coins.find(x => x.symbol === symbol);
    if (!c) return;
    let action = 'buy';
    let amount = 0.1;

    const body = document.createElement('div');
    function render() {
      const state = FinState.get();
      const owned = state.crypto[symbol]?.amount || 0;
      const cost = amount * c.price;
      body.innerHTML = `
        <div style="text-align:center;margin-bottom:18px;">
          <div class="crypto-sym" style="margin:0 auto 10px;width:54px;height:54px;font-size:14px;">${symbol.slice(0,3)}</div>
          <div style="font-size:18px;font-weight:700;">${c.name} (${symbol})</div>
          <div class="muted" style="font-size:13px;">$${Market.fmtPrice(c.price)} per coin</div>
        </div>
        <div class="trade-segment" style="margin-bottom:14px;">
          <button class="${action==='buy'?'active buy':''}" data-a="buy">Buy</button>
          <button class="${action==='sell'?'active sell':''}" data-a="sell">Sell</button>
          ${c.stake_apy > 0 ? `<button class="${action==='stake'?'active':''}" data-a="stake">Stake</button>` : ''}
        </div>
        <div class="input-group" style="margin-bottom:14px;">
          <label class="input-label">Amount${owned > 0 ? ` · Owned: ${owned.toFixed(c.base<1?4:6)}` : ''}</label>
          <input type="number" class="input" id="cr-amt" value="${amount}" step="${c.base<1?0.001:0.01}"/>
        </div>
        <div class="trade-summary">
          <div class="trade-summary-row"><span>Price</span><span class="val">$${Market.fmtPrice(c.price)}</span></div>
          <div class="trade-summary-row"><span>Total</span><span class="val">$${Market.fmtPrice(cost)}</span></div>
          <div class="trade-summary-row"><span>Wallet</span><span class="val">$${Market.fmtPrice(state.cash)}</span></div>
        </div>
      `;
      body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { action = b.dataset.a; render(); });
      body.querySelector('#cr-amt').oninput = e => { amount = parseFloat(e.target.value)||0; render(); };
    }
    render();

    const m = Modal.open({
      title: `${action === 'stake' ? 'Stake' : action === 'buy' ? 'Buy' : 'Sell'} ${symbol}`,
      body, width: 460,
      footer: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="cr-go">Confirm</button>`
    });

    m.querySelector('#cr-go').onclick = async () => {
      if (action === 'buy') {
        const res = FinState.buyCrypto(symbol, amount, c.price);
        if (res.error) Toast.show({ title: res.error, type: 'error' });
        else { Toast.show({ title: `Bought ${amount} ${symbol}`, type: 'success' }); Sound.tradeSuccess(); Modal.close(m); Crypto.render(document.getElementById('page-container')); }
      } else if (action === 'sell') {
        const res = FinState.sellCrypto(symbol, amount, c.price);
        if (res.error) Toast.show({ title: res.error, type: 'error' });
        else { Toast.show({ title: `Sold ${amount} ${symbol}`, type: 'success' }); Sound.tradeSuccess(); Modal.close(m); Crypto.render(document.getElementById('page-container')); }
      } else if (action === 'stake') {
        const res = await Api.stakeCrypto({ symbol, amount });
        if (res.error) Toast.show({ title: res.error, type: 'error' });
        else { Toast.show({ title: `Staking ${amount} ${symbol} at ${res.apy}% APY`, type: 'success' }); Modal.close(m); }
      }
    };
  }

  return { render };
})();