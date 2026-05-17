/* ============ FOREX TRADING ============ */
const Forex = (() => {
  async function render(host) {
    const pairs = await Api.getForex(true);
    const state = FinState.get();
    const positions = state.forex || [];

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Forex Markets</div><div class="muted" style="font-size:13px;">Currency trading with up to 50:1 leverage</div></div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="card-head"><div class="card-title">Open Positions <span class="ghost">${positions.length}</span></div></div>
        ${positions.length ? `
          <table class="table">
            <thead><tr><th>Pair</th><th>Side</th><th>Lots</th><th>Leverage</th><th>Entry</th><th>Current</th><th>P/L</th><th></th></tr></thead>
            <tbody>
              ${positions.map((p, i) => {
                const cur = pairs.find(x => x.pair === p.pair)?.price || p.entry;
                const diff = (cur - p.entry) * (p.side === 'buy' ? 1 : -1);
                const pnl = diff * p.lots * 100000;
                return `<tr>
                  <td><strong>${p.pair}</strong></td>
                  <td><span class="badge ${p.side==='buy'?'up':'down'}">${p.side.toUpperCase()}</span></td>
                  <td>${p.lots}</td>
                  <td>${p.leverage}:1</td>
                  <td class="tabular">${p.entry.toFixed(4)}</td>
                  <td class="tabular">${cur.toFixed(4)}</td>
                  <td class="tabular ${pnl>=0?'delta-up':'delta-down'}">${pnl>=0?'+':''}$${Market.fmtPrice(pnl)}</td>
                  <td><button class="btn btn-sm" data-close-fx="${i}">Close</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>` :
          `<div class="muted" style="text-align:center;padding:20px;font-size:13px;">No open forex positions</div>`}
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Major Pairs</div></div>
        <table class="table">
          <thead><tr><th>Pair</th><th class="ta-right">Price</th><th class="ta-right">Spread</th><th class="ta-right">24h Change</th><th></th></tr></thead>
          <tbody>
            ${pairs.map(p => `<tr>
              <td><strong>${p.pair}</strong></td>
              <td class="ta-right tabular">${p.price.toFixed(4)}</td>
              <td class="ta-right muted">${p.spread.toFixed(5)}</td>
              <td class="ta-right ${p.change_24h>=0?'delta-up':'delta-down'}">${p.change_24h>=0?'+':''}${p.change_24h.toFixed(2)}%</td>
              <td class="ta-right">
                <button class="btn btn-sm" data-trade-fx="${p.pair}">Trade</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    host.querySelectorAll('[data-trade-fx]').forEach(b => b.onclick = () => openTrade(b.dataset.tradeFx, pairs));
    host.querySelectorAll('[data-close-fx]').forEach(b => b.onclick = () => closePos(parseInt(b.dataset.closeFx), pairs));
  }

  function openTrade(pair, pairs) {
    const p = pairs.find(x => x.pair === pair);
    let lots = 0.1; let side = 'buy'; let leverage = 10;
    const body = document.createElement('div');
    function r() {
      const notional = lots * 100000;
      const margin = notional / leverage;
      body.innerHTML = `
        <div style="text-align:center;margin-bottom:14px;">
          <div style="font-size:22px;font-weight:800;">${pair}</div>
          <div class="tabular" style="font-size:18px;">${p.price.toFixed(4)}</div>
        </div>
        <div class="trade-segment" style="margin-bottom:14px;">
          <button class="${side==='buy'?'active buy':''}" data-s="buy">Buy (Long)</button>
          <button class="${side==='sell'?'active sell':''}" data-s="sell">Sell (Short)</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
          <div class="input-group"><label class="input-label">Lots (1 = 100k)</label><input type="number" class="input" id="fx-lots" value="${lots}" step="0.01"/></div>
          <div class="input-group"><label class="input-label">Leverage</label>
            <select class="select" id="fx-lev">${[1,5,10,20,30,50].map(l=>`<option value="${l}" ${leverage===l?'selected':''}>${l}:1</option>`).join('')}</select>
          </div>
        </div>
        <div class="trade-summary">
          <div class="trade-summary-row"><span>Notional</span><span class="val">$${notional.toLocaleString()}</span></div>
          <div class="trade-summary-row total"><span>Margin Required</span><span class="val">$${margin.toFixed(2)}</span></div>
        </div>`;
      body.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { side = b.dataset.s; r(); });
      body.querySelector('#fx-lots').oninput = e => { lots = parseFloat(e.target.value)||0; r(); };
      body.querySelector('#fx-lev').onchange = e => { leverage = parseInt(e.target.value); r(); };
    }
    r();
    const m = Modal.open({ title: 'Open Forex Position', body, width: 480,
      footer: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="fx-go">Open</button>` });
    m.querySelector('#fx-go').onclick = async () => {
      const res = await Api.tradeForex({ pair, lots, side, leverage });
      if (res && res.success) {
        const r = FinState.openForexPosition(res);
        if (r.error) Toast.show({ title: r.error, type: 'error' });
        else { Sound.tradeSuccess(); Toast.show({ title: 'Position opened', type: 'success' }); Modal.close(m); render(document.getElementById('page-container')); }
      }
    };
  }

  function closePos(idx, pairs) {
    const p = FinState.get().forex[idx];
    const cur = pairs.find(x => x.pair === p.pair)?.price || p.entry;
    const res = FinState.closeForexPosition(idx, cur);
    if (res.error) Toast.show({ title: res.error, type: 'error' });
    else {
      Sound.tradeSuccess();
      Toast.show({ title: `Closed: ${res.pnl>=0?'+':''}$${Market.fmtPrice(res.pnl)}`, type: res.pnl>=0?'success':'error' });
      render(document.getElementById('page-container'));
    }
  }

  return { render };
})();