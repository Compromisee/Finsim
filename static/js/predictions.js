/* ============ PREDICTION MARKET ============ */
const Predictions = (() => {
  let markets = [];

  async function render(host) {
    const stocks = await Api.getStocks();
    if (!markets.length) markets = generateMarkets(stocks);

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Prediction Markets</div><div class="muted" style="font-size:13px;">Bet on real outcomes · YES/NO</div></div>
        <button class="btn btn-sm" id="pred-refresh"><span class="material-symbols-outlined" style="font-size:16px;">refresh</span>New Markets</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px;">
        ${markets.map((m, i) => `
          <div class="prediction-card">
            <div style="font-weight:600;font-size:14px;line-height:1.4;margin-bottom:8px;">${m.question}</div>
            <div class="muted" style="font-size:11px;margin-bottom:8px;">Resolves: ${m.resolves}</div>
            <div class="pred-bar">
              <span class="pred-yes" style="flex:${m.yesPct};">YES ${(m.yesPct*100).toFixed(0)}%</span>
              <span class="pred-no" style="flex:${1-m.yesPct};">NO ${((1-m.yesPct)*100).toFixed(0)}%</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button class="btn btn-green btn-sm" data-bet="yes" data-i="${i}">Bet YES · $${m.yesCost.toFixed(2)}</button>
              <button class="btn btn-red btn-sm" data-bet="no" data-i="${i}">Bet NO · $${m.noCost.toFixed(2)}</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    host.querySelector('#pred-refresh').onclick = () => { markets = generateMarkets(stocks); render(host); };
    host.querySelectorAll('[data-bet]').forEach(b => b.onclick = () => placeBet(b.dataset.bet, parseInt(b.dataset.i)));
  }

  function generateMarkets(stocks) {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const s = stocks[Math.floor(Math.random() * stocks.length)];
      const target = (s.price * (1 + (Math.random() - 0.5) * 0.15)).toFixed(2);
      const above = Math.random() < 0.5;
      const yesPct = 0.2 + Math.random() * 0.6;
      out.push({
        question: `Will ${s.ticker} close ${above?'above':'below'} $${target} today?`,
        resolves: 'End of day',
        ticker: s.ticker, target: parseFloat(target), above,
        yesPct, yesCost: yesPct * 100, noCost: (1-yesPct) * 100,
      });
    }
    return out;
  }

  function placeBet(side, i) {
    const m = markets[i];
    const cost = side === 'yes' ? m.yesCost : m.noCost;
    const state = FinState.get();
    if (state.cash < cost) return Toast.show({ title: 'Insufficient funds', type: 'error' });
    FinState.adjustCash(-cost, 'PREDICTION', `${side.toUpperCase()} on ${m.question}`);
    Sound.tradeClick();
    Toast.show({ title: `Bet placed: ${side.toUpperCase()}`, body: `$${cost.toFixed(2)} on ${m.ticker}`, type: 'info' });
  }

  return { render };
})();