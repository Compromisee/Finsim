/* ============ TRANSACTIONS LEDGER ============ */
const Transactions = (() => {
  let filters = { type: 'all', q: '' };

  function render(host) {
    const all = FinState.get().transactions;

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Transactions</div><div class="muted" style="font-size:13px;">${all.length} entries in ledger</div></div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="tx-csv"><span class="material-symbols-outlined" style="font-size:16px;">download</span>CSV</button>
          <button class="btn btn-sm" id="tx-json"><span class="material-symbols-outlined" style="font-size:16px;">code</span>JSON</button>
        </div>
      </div>

      <div class="tx-filters">
        <input type="text" class="input" id="tx-q" placeholder="Search ticker, type…" style="max-width:240px;" />
        <select class="select" id="tx-type" style="max-width:180px;">
          <option value="all">All Types</option>
          <option>BUY</option><option>SELL</option><option>SHORT</option>
          <option>DIVIDEND</option><option>LOAN</option><option>EVENT</option>
        </select>
      </div>

      <div class="card" style="padding:0;">
        <div id="tx-table"></div>
      </div>
    `;

    host.querySelector('#tx-q').oninput = e => { filters.q = e.target.value.toLowerCase(); renderTable(); };
    host.querySelector('#tx-type').onchange = e => { filters.type = e.target.value; renderTable(); };
    host.querySelector('#tx-csv').onclick = () => exportCsv(all);
    host.querySelector('#tx-json').onclick = () => FinState.exportSave();
    renderTable();
  }

  function renderTable() {
    const all = FinState.get().transactions;
    let list = all;
    if (filters.type !== 'all') list = list.filter(t => t.type === filters.type);
    if (filters.q) list = list.filter(t => (t.ticker + ' ' + t.type).toLowerCase().includes(filters.q));

    const host = document.getElementById('tx-table');
    if (!list.length) {
      host.innerHTML = `<div class="empty"><span class="material-symbols-outlined">receipt_long</span><div class="empty-title">No transactions</div><div class="empty-body">Your trading activity will appear here.</div></div>`;
      return;
    }
    host.innerHTML = `
      <table class="table">
        <thead><tr>
          <th>Date/Time</th><th>Type</th><th>Asset</th>
          <th class="ta-right">Qty</th>
          <th class="ta-right">Price</th>
          <th class="ta-right">Total</th>
          <th class="ta-right">Fees</th>
          <th class="ta-right">Balance After</th>
        </tr></thead>
        <tbody>
          ${list.map(t => `<tr>
            <td>${new Date(t.timestamp).toLocaleString()}</td>
            <td><span class="badge ${badgeFor(t.type)}">${t.type}</span></td>
            <td class="ticker-cell">${t.ticker}</td>
            <td class="ta-right">${t.quantity}</td>
            <td class="ta-right tabular">$${Market.fmtPrice(t.price)}</td>
            <td class="ta-right tabular ${t.total >= 0 ? 'delta-up' : 'delta-down'}">${t.total >= 0 ? '+' : ''}$${Market.fmtPrice(Math.abs(t.total))}</td>
            <td class="ta-right muted tabular">$${Market.fmtPrice(t.fees || 0)}</td>
            <td class="ta-right tabular">$${Market.fmtPrice(t.balanceAfter || 0)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  }

  function badgeFor(type) {
    if (type === 'BUY') return 'up';
    if (type === 'SELL') return 'down';
    return '';
  }

  function exportCsv(list) {
    const rows = [['Date','Type','Asset','Qty','Price','Total','Fees','Balance']];
    list.forEach(t => rows.push([t.timestamp, t.type, t.ticker, t.quantity, t.price, t.total, t.fees || 0, t.balanceAfter || 0]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return { render };
})();