/* ============ ETFs & MUTUAL FUNDS ============ */
const ETFs = (() => {
  let kindFilter = 'All';

  async function render(host) {
    const funds = await Api.getEtfs();
    const filtered = kindFilter === 'All' ? funds : funds.filter(f => f.kind === kindFilter);
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">ETFs &amp; Mutual Funds</div><div class="muted" style="font-size:13px;">Diversified baskets of securities</div></div>
      </div>

      <div class="markets-filters">
        ${['All','ETF','Mutual'].map(k => `<button class="filter-pill ${kindFilter===k?'active':''}" data-k="${k}">${k}</button>`).join('')}
      </div>

      <div class="card" style="padding:0;">
        <table class="table">
          <thead><tr>
            <th>Ticker</th><th>Name</th><th>Kind</th><th>Category</th>
            <th class="ta-right">Price</th><th class="ta-right">Expense</th>
            <th class="ta-right">YTD</th><th class="ta-right">AUM</th>
          </tr></thead>
          <tbody>
            ${filtered.map(f => `<tr data-detail="${f.ticker}">
              <td class="ticker-cell">${f.ticker}</td>
              <td class="name-cell">${f.name}</td>
              <td><span class="badge">${f.kind}</span></td>
              <td><span class="badge">${f.category}</span></td>
              <td class="ta-right tabular">$${Market.fmtPrice(f.price)}</td>
              <td class="ta-right muted">${f.expense}%</td>
              <td class="ta-right ${f.ytd_return>=0?'delta-up':'delta-down'}">${f.ytd_return>=0?'+':''}${f.ytd_return}%</td>
              <td class="ta-right tabular">$${Market.fmtCap(f.aum)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    host.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { kindFilter = b.dataset.k; render(host); });
  }

  return { render };
})();