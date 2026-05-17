/* ============ BONDS ============ */
const Bonds = (() => {
  async function render(host) {
    const bonds = await Api.getBonds();
    const state = FinState.get();
    const owned = state.bonds || [];
    const totalInterest = owned.reduce((a, b) => a + (b.quantity * b.face_value * b.yield / 100), 0);

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Bond Market</div><div class="muted" style="font-size:13px;">Fixed income securities · Treasury · Corporate · Municipal</div></div>
      </div>

      <div class="portfolio-stats" style="margin-bottom:18px;">
        <div class="pstat-card"><div class="pstat-label">Bonds Held</div><div class="pstat-value">${owned.length}</div></div>
        <div class="pstat-card"><div class="pstat-label">Annual Interest</div><div class="pstat-value up">$${Market.fmtPrice(totalInterest)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Total Interest Earned</div><div class="pstat-value">$${Market.fmtPrice(state.bondInterestTotal||0)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Avg Yield</div><div class="pstat-value">${owned.length?((owned.reduce((a,b)=>a+b.yield,0)/owned.length).toFixed(2)):'—'}%</div></div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">Available Bonds</div></div>
        <table class="table">
          <thead><tr>
            <th>Bond</th><th>Type</th><th>Rating</th>
            <th class="ta-right">Yield</th><th class="ta-right">Maturity</th>
            <th class="ta-right">Face Value</th><th></th>
          </tr></thead>
          <tbody>
            ${bonds.map(b => `<tr>
              <td><strong>${b.name}</strong></td>
              <td><span class="badge">${b.type}</span></td>
              <td><span class="bond-rating ${b.rating.toLowerCase().replace(/[+-]/g,'').slice(0,3)}">${b.rating}</span></td>
              <td class="ta-right tabular up">${b.yield}%</td>
              <td class="ta-right">${b.maturity_years}Y</td>
              <td class="ta-right tabular">$${b.face_value.toLocaleString()}</td>
              <td class="ta-right"><button class="btn btn-sm btn-primary" data-buy="${b.id}">Buy</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;

    host.querySelectorAll('[data-buy]').forEach(btn => btn.onclick = () => buy(btn.dataset.buy, bonds));
  }

  function buy(id, bonds) {
    const bond = bonds.find(b => b.id === id);
    let qty = 1;
    const body = document.createElement('div');
    function r() {
      const cost = bond.face_value * qty;
      const annual = cost * bond.yield / 100;
      const maturity = cost + annual * bond.maturity_years;
      body.innerHTML = `
        <div style="margin-bottom:14px;">
          <h3 style="margin:0 0 4px;">${bond.name}</h3>
          <div class="muted" style="font-size:12px;">${bond.type} · ${bond.rating} · ${bond.maturity_years} year maturity</div>
        </div>
        <div class="input-group" style="margin-bottom:14px;">
          <label class="input-label">Quantity</label>
          <input type="number" class="input" id="bn-q" min="1" value="${qty}"/>
        </div>
        <div class="trade-summary">
          <div class="trade-summary-row"><span>Face value × qty</span><span class="val">$${cost.toLocaleString()}</span></div>
          <div class="trade-summary-row"><span>Annual interest</span><span class="val up">$${annual.toFixed(2)}</span></div>
          <div class="trade-summary-row total"><span>Maturity payout</span><span class="val">$${maturity.toFixed(2)}</span></div>
        </div>`;
      body.querySelector('#bn-q').oninput = e => { qty = Math.max(1, parseInt(e.target.value)||1); r(); };
    }
    r();
    const m = Modal.open({
      title: 'Purchase Bond', body, width: 460,
      footer: `<button class="btn" data-close>Cancel</button><button class="btn btn-primary" id="bn-go">Buy</button>`
    });
    m.querySelector('#bn-go').onclick = () => {
      const cost = bond.face_value * qty;
      const res = FinState.buyBond(bond, qty, cost);
      if (res.error) Toast.show({ title: res.error, type: 'error' });
      else { Sound.tradeSuccess(); Toast.show({ title: 'Bond purchased', type: 'success' }); Modal.close(m); render(document.getElementById('page-container')); }
    };
  }

  return { render };
})();