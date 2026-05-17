/* ============ REAL ESTATE ============ */
const RealEstate = (() => {
  async function render(host) {
    const props = await Api.getRealEstate();
    const state = FinState.get();
    const owned = state.properties || [];
    const totalRent = owned.reduce((a, p) => a + p.rent, 0);
    const totalValue = owned.reduce((a, p) => a + (props.find(x => x.id === p.id)?.current_value || p.current_value), 0);

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Real Estate</div><div class="muted" style="font-size:13px;">Buy properties, collect rent, build wealth</div></div>
      </div>

      <div class="portfolio-stats" style="margin-bottom:18px;">
        <div class="pstat-card"><div class="pstat-label">Properties Owned</div><div class="pstat-value">${owned.length}</div></div>
        <div class="pstat-card"><div class="pstat-label">Total Value</div><div class="pstat-value">$${Market.fmtPrice(totalValue)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Monthly Rent</div><div class="pstat-value up">$${Market.fmtPrice(totalRent)}</div></div>
        <div class="pstat-card"><div class="pstat-label">Total Rent Collected</div><div class="pstat-value">$${Market.fmtPrice(state.rentIncomeTotal||0)}</div></div>
      </div>

      ${owned.length ? `
        <div class="card" style="margin-bottom:18px;">
          <div class="card-head"><div class="card-title">Your Portfolio</div></div>
          <div class="property-grid">
            ${owned.map(p => {
              const live = props.find(x => x.id === p.id) || p;
              const gain = live.current_value - p.purchase_price;
              const gainPct = (gain/p.purchase_price*100);
              return `<div class="property-card">
                <div class="property-image">
                  <span class="material-symbols-outlined">${iconFor(p.type)}</span>
                  <span class="property-type-badge">Owned</span>
                </div>
                <div class="property-body">
                  <div class="property-name">${p.name}</div>
                  <div class="property-city">${p.city}</div>
                  <div class="property-price-row">
                    <div><div class="muted" style="font-size:11px;">Current Value</div><div class="tabular" style="font-weight:700;">$${Market.fmtPrice(live.current_value)}</div></div>
                    <div style="text-align:right;"><div class="muted" style="font-size:11px;">Gain</div><div class="tabular ${gain>=0?'up':'down'}">${gain>=0?'+':''}${gainPct.toFixed(1)}%</div></div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-head"><div class="card-title">Available Properties</div></div>
        <div class="property-grid">
          ${props.map(p => `
            <div class="property-card">
              <div class="property-image">
                <span class="material-symbols-outlined">${iconFor(p.type)}</span>
                <span class="property-type-badge">${p.type}</span>
              </div>
              <div class="property-body">
                <div class="property-name">${p.name}</div>
                <div class="property-city">${p.city} · ${p.sqft.toLocaleString()} sqft</div>
                <div class="property-price-row">
                  <div><div class="muted" style="font-size:11px;">Price</div><div class="tabular" style="font-weight:700;">$${Market.fmtPrice(p.current_value)}</div></div>
                  <div style="text-align:right;"><div class="muted" style="font-size:11px;">Rent/mo</div><div class="tabular up">$${Market.fmtPrice(p.rent)}</div></div>
                </div>
                <button class="btn btn-primary btn-block btn-sm" style="margin-top:12px;" data-buy="${p.id}">Buy Property</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    host.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buy(b.dataset.buy, props));
  }

  function iconFor(type) {
    return { Apartment: 'apartment', House: 'house', Penthouse: 'roofing', Condo: 'domain',
             Commercial: 'business', Industrial: 'warehouse', Vacation: 'beach_access', Multifamily: 'holiday_village' }[type] || 'home';
  }

  async function buy(id, props) {
    const res = await Api.buyProperty({ id });
    if (res.error) { Toast.show({ title: res.error, type: 'error' }); return; }
    const p = res.property;
    const closing = res.closing_costs;
    const total = p.current_value + closing;
    const ok = await Modal.confirm({
      title: 'Confirm Purchase',
      message: `Purchase <strong>${p.name}</strong> for $${Market.fmtPrice(p.current_value)} + $${Market.fmtPrice(closing)} closing costs (Total: $${Market.fmtPrice(total)})?`,
      confirmText: 'Buy'
    });
    if (!ok) return;
    const r = FinState.buyProperty(p, closing);
    if (r.error) Toast.show({ title: r.error, type: 'error' });
    else {
      Sound.tradeSuccess();
      Toast.show({ title: 'Property purchased!', body: p.name, type: 'success' });
      render(document.getElementById('page-container'));
    }
  }

  return { render };
})();