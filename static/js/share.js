/* ============ PORTFOLIO SHARE CARD ============ */
const Share = (() => {
  async function showCard() {
    const state = FinState.get();
    const stocks = await Api.getStocks();
    let netWorth = state.cash;
    Object.entries(state.holdings).forEach(([t, h]) => {
      netWorth += (stocks.find(x => x.ticker === t)?.price || h.avgCost) * h.shares;
    });
    const gain = netWorth - 100000;
    const gainPct = (gain / 100000) * 100;

    const body = document.createElement('div');
    body.innerHTML = `
      <div id="share-card-canvas-host" style="display:flex;justify-content:center;margin-bottom:14px;">
        <div class="share-card">
          <div style="position:relative;z-index:2;">
            <div style="font-size:14px;color:var(--text-muted);">FINSIM PORTFOLIO</div>
            <div style="font-size:36px;font-weight:800;margin:8px 0;">${state.playerName || state.leaderboardName || 'Trader'}</div>
            <div style="font-size:54px;font-weight:800;color:${gainPct>=0?'var(--green)':'var(--red)'};margin:10px 0;" class="tabular">
              ${gainPct>=0?'+':''}${gainPct.toFixed(2)}%
            </div>
            <div style="font-size:18px;color:var(--text-2);" class="tabular">$${Market.fmtPrice(netWorth)} net worth</div>
            <div style="margin-top:24px;display:flex;justify-content:space-between;font-size:13px;">
              <div><div class="muted">Trades</div><div style="font-weight:700;">${state.career.tradesCount}</div></div>
              <div><div class="muted">Streak</div><div style="font-weight:700;">${state.loginStreak} days</div></div>
              <div><div class="muted">Achievements</div><div style="font-weight:700;">${Object.keys(state.achievements||{}).length}</div></div>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn" id="copy-share">Copy to Clipboard</button>
        <a class="btn btn-primary" target="_blank" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just hit ${gainPct.toFixed(2)}% on FinSim! 📈`)}">Share on X</a>
      </div>
    `;
    Modal.open({ title: 'Share Your Portfolio', body, width: 680 });
    document.getElementById('copy-share').onclick = () => {
      navigator.clipboard.writeText(`I just hit ${gainPct.toFixed(2)}% on FinSim with $${Market.fmtPrice(netWorth)} portfolio!`);
      Toast.show({ title: 'Copied!', type: 'success' });
    };
  }

  return { showCard };
})();