/* ============ AI TRADING BOT BUILDER ============ */
const BotBuilder = (() => {
  let rules = [{ if: 'rsi', op: '<', value: 30, then: 'buy', qty: 10 }];
  let ticker = 'AAPL';

  async function render(host) {
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">AI Trading Bot Builder</div><div class="muted" style="font-size:13px;">Design rules, backtest, deploy</div></div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Strategy</div></div>
        <div style="display:flex;gap:10px;margin-bottom:14px;">
          <input class="input" id="bb-ticker" value="${ticker}" placeholder="Ticker" style="max-width:120px;text-transform:uppercase;"/>
          <select class="select" id="bb-days" style="max-width:140px;">
            <option value="30">Last 30 days</option>
            <option value="60" selected>Last 60 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 180 days</option>
          </select>
        </div>

        <h4 style="font-size:13px;margin:14px 0 8px;">Rules</h4>
        <div id="rules-host"></div>
        <button class="btn btn-sm" id="add-rule" style="margin-top:8px;"><span class="material-symbols-outlined" style="font-size:16px;">add</span>Add Rule</button>

        <div style="margin-top:18px;display:flex;gap:10px;">
          <button class="btn btn-primary" id="bb-run">Run Backtest</button>
          <button class="btn" id="bb-deploy">Deploy as Live Bot</button>
        </div>
      </div>

      <div class="card" style="margin-top:14px;">
        <div class="card-head"><div class="card-title">Backtest Results</div></div>
        <div id="bb-results"><div class="muted" style="text-align:center;padding:20px;font-size:13px;">Run a backtest to see results</div></div>
      </div>
    `;

    renderRules();
    host.querySelector('#bb-ticker').oninput = e => { ticker = e.target.value.toUpperCase(); };
    host.querySelector('#add-rule').onclick = () => {
      rules.push({ if: 'price', op: '>', value: 100, then: 'buy', qty: 10 });
      renderRules();
    };
    host.querySelector('#bb-run').onclick = runBacktest;
    host.querySelector('#bb-deploy').onclick = deployBot;
  }

  function renderRules() {
    const host = document.getElementById('rules-host');
    host.innerHTML = rules.map((r, i) => `
      <div class="bot-rule">
        <span style="font-weight:700;font-size:12px;">IF</span>
        <select class="select" data-key="if" data-i="${i}">
          <option value="price" ${r.if==='price'?'selected':''}>Price</option>
          <option value="sma20" ${r.if==='sma20'?'selected':''}>SMA20</option>
          <option value="sma50" ${r.if==='sma50'?'selected':''}>SMA50</option>
          <option value="rsi" ${r.if==='rsi'?'selected':''}>RSI</option>
          <option value="change_pct" ${r.if==='change_pct'?'selected':''}>Change %</option>
        </select>
        <select class="select" data-key="op" data-i="${i}">
          <option value="<" ${r.op==='<'?'selected':''}>&lt;</option>
          <option value=">" ${r.op==='>'?'selected':''}>&gt;</option>
          <option value="==" ${r.op==='=='?'selected':''}>=</option>
        </select>
        <input type="number" class="input" data-key="value" data-i="${i}" value="${r.value}" step="0.01"/>
        <span style="font-weight:700;font-size:12px;">THEN</span>
        <select class="select" data-key="then" data-i="${i}">
          <option value="buy" ${r.then==='buy'?'selected':''}>BUY</option>
          <option value="sell" ${r.then==='sell'?'selected':''}>SELL</option>
        </select>
        <input type="number" class="input" data-key="qty" data-i="${i}" value="${r.qty}" placeholder="Qty"/>
        <button class="icon-btn" data-rm="${i}"><span class="material-symbols-outlined">delete</span></button>
      </div>
    `).join('');
    host.querySelectorAll('[data-key]').forEach(el => {
      el.onchange = e => {
        const i = parseInt(el.dataset.i);
        const k = el.dataset.key;
        const v = (k === 'value' || k === 'qty') ? parseFloat(e.target.value) : e.target.value;
        rules[i][k] = v;
      };
    });
    host.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      rules.splice(parseInt(b.dataset.rm), 1); renderRules();
    });
  }

  async function runBacktest() {
    const days = parseInt(document.getElementById('bb-days').value);
    const res = await Api.backtestBot({ ticker, rules, days });
    if (res.error) return Toast.show({ title: res.error, type: 'error' });
    document.getElementById('bb-results').innerHTML = `
      <div class="portfolio-stats" style="margin-bottom:12px;">
        <div class="pstat-card"><div class="pstat-label">Starting Cash</div><div class="pstat-value">$${res.starting_cash.toLocaleString()}</div></div>
        <div class="pstat-card"><div class="pstat-label">Final Value</div><div class="pstat-value">$${Market.fmtPrice(res.final_value)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Return</div><div class="pstat-value ${res.return_pct>=0?'up':'down'}">${res.return_pct>=0?'+':''}${res.return_pct}%</div></div>
        <div class="pstat-card"><div class="pstat-label">Total Trades</div><div class="pstat-value">${res.total_trades}</div></div>
      </div>
      <table class="table">
        <thead><tr><th>Day</th><th>Action</th><th>Price</th><th>Qty</th></tr></thead>
        <tbody>${res.trades.slice(0, 30).map(t => `<tr>
          <td>${t.day}</td>
          <td><span class="badge ${t.action==='BUY'?'up':'down'}">${t.action}</span></td>
          <td class="tabular">$${t.price}</td><td>${t.qty}</td>
        </tr>`).join('')}</tbody>
      </table>`;
  }

  function deployBot() {
    const state = FinState.get();
    state.tradingBots.push({
      name: `Bot ${state.tradingBots.length + 1}`, ticker, rules: [...rules],
      capital: 10000, active: true, deployed_at: Date.now(),
    });
    FinState.set({ tradingBots: state.tradingBots });
    Toast.show({ title: 'Bot deployed!', body: `Watching ${ticker}`, type: 'success' });
  }

  return { render };
})();