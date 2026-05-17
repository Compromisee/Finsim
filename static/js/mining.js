/* ============ CRYPTO MINING ============ */
const Mining = (() => {
  const RIG_COST = 2500;
  const ELECTRICITY_PER_RIG = 1.5; // per minute

  function render(host) {
    const state = FinState.get();
    const rigs = state.miningRigs || 0;

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Crypto Mining</div><div class="muted" style="font-size:13px;">Passive crypto income</div></div>
      </div>

      <div class="portfolio-stats" style="margin-bottom:18px;">
        <div class="pstat-card"><div class="pstat-label">Active Rigs</div><div class="pstat-value">${rigs}</div></div>
        <div class="pstat-card"><div class="pstat-label">Hash Rate</div><div class="pstat-value">${(rigs * 95).toLocaleString()} MH/s</div></div>
        <div class="pstat-card"><div class="pstat-label">Daily Profit (est)</div><div class="pstat-value up">$${(rigs * 18).toFixed(2)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Total Earned</div><div class="pstat-value">$${Market.fmtPrice(state.miningEarnings||0)}</div></div>
      </div>

      <div class="card" style="margin-bottom:14px;">
        <div class="card-head">
          <div class="card-title">Your Mining Farm</div>
          <button class="btn btn-primary btn-sm" id="buy-rig"><span class="material-symbols-outlined" style="font-size:16px;">add</span>Buy Rig ($${RIG_COST})</button>
        </div>
        ${rigs > 0 ? `
          <div class="mining-grid">
            ${Array.from({length: rigs}).map((_, i) => `
              <div class="mining-rig">
                <div class="glow"><span class="material-symbols-outlined" style="color:#fff;font-size:24px;">memory</span></div>
                <div style="font-weight:700;font-size:13px;">Rig #${i+1}</div>
                <div class="muted" style="font-size:11px;">95 MH/s</div>
                <div class="up" style="font-size:12px;margin-top:4px;">+$18/day</div>
              </div>`).join('')}
          </div>
        ` : `<div class="empty"><span class="material-symbols-outlined">memory</span><div class="empty-title">No rigs yet</div><div class="empty-body">Buy your first rig to start mining</div></div>`}
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Costs</div></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
          <span>Electricity per minute</span><span class="tabular">$${(rigs * ELECTRICITY_PER_RIG).toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;">
          <span>Estimated monthly</span><span class="tabular">$${(rigs * ELECTRICITY_PER_RIG * 60 * 24 * 30).toFixed(2)}</span>
        </div>
      </div>
    `;

    host.querySelector('#buy-rig').onclick = () => {
      const s = FinState.get();
      if (s.cash < RIG_COST) return Toast.show({ title: 'Insufficient funds', type: 'error' });
      FinState.adjustCash(-RIG_COST, 'MINING', 'Purchased mining rig');
      FinState.set({ miningRigs: (s.miningRigs || 0) + 1 });
      Sound.tradeSuccess();
      Toast.show({ title: 'Rig deployed!', type: 'success' });
      render(host);
    };
  }

  return { render };
})();