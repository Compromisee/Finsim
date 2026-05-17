/* ============ LEADERBOARD ============ */
const Leaderboard = (() => {
  async function render(host) {
    const state = FinState.get();
    const stocks = await Api.getStocks();
    let netWorth = state.cash;
    Object.entries(state.holdings).forEach(([t, h]) => {
      netWorth += (stocks.find(x => x.ticker === t)?.price || h.avgCost) * h.shares;
    });

    // Submit current player
    if (state.leaderboardName) {
      await Api.submitScore({
        name: state.leaderboardName, net_worth: Math.round(netWorth),
        gain_pct: ((netWorth - 100000)/1000), win_streak: state.loginStreak,
        trades: state.career.tradesCount,
      });
    }

    const top = await Api.getLeaderboard();
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Global Leaderboard</div><div class="muted" style="font-size:13px;">Top traders worldwide</div></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <input class="input" id="lb-name" placeholder="Your name" value="${state.leaderboardName||''}" style="max-width:180px;"/>
          <button class="btn btn-primary btn-sm" id="lb-submit">Submit Score</button>
        </div>
      </div>

      <div class="portfolio-stats" style="margin-bottom:18px;">
        <div class="pstat-card"><div class="pstat-label">Your Net Worth</div><div class="pstat-value">$${Market.fmtPrice(netWorth)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Your Gain</div><div class="pstat-value ${netWorth>=100000?'up':'down'}">${((netWorth-100000)/1000).toFixed(2)}%</div></div>
        <div class="pstat-card"><div class="pstat-label">Trades</div><div class="pstat-value">${state.career.tradesCount}</div></div>
        <div class="pstat-card"><div class="pstat-label">Login Streak</div><div class="pstat-value">${state.loginStreak} days</div></div>
      </div>

      <div class="card" style="padding:0;">
        <div style="display:grid;grid-template-columns:44px 1fr 120px 100px 80px;padding:12px 14px;border-bottom:1px solid var(--border);font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">
          <div>#</div><div>Trader</div><div style="text-align:right;">Net Worth</div><div style="text-align:right;">Gain</div><div style="text-align:right;">Trades</div>
        </div>
        ${top.map((e, i) => `
          <div class="leader-row">
            <div class="leader-rank ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</div>
            <div>
              <div class="leader-name">${e.name}</div>
              <div class="leader-trades">${e.win_streak} day streak</div>
            </div>
            <div style="text-align:right;font-weight:700;" class="tabular">$${Market.fmtCap(e.net_worth)}</div>
            <div style="text-align:right;" class="tabular ${e.gain_pct>=0?'up':'down'}">${e.gain_pct>=0?'+':''}${e.gain_pct.toFixed(1)}%</div>
            <div style="text-align:right;" class="muted tabular">${e.trades}</div>
          </div>`).join('')}
      </div>
    `;

    host.querySelector('#lb-submit').onclick = () => {
      const name = host.querySelector('#lb-name').value.trim();
      if (!name) return Toast.show({ title: 'Enter a name', type: 'error' });
      FinState.set({ leaderboardName: name });
      Toast.show({ title: 'Score submitted!', type: 'success' });
      render(host);
    };
  }

  return { render };
})();