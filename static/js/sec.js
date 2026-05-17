/* ============ SEC FILINGS ============ */
const SECFilings = (() => {
  let currentTicker = 'AAPL';

  async function render(host) {
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">SEC Filings</div><div class="muted" style="font-size:13px;">Quarterly reports, insider trading, material events</div></div>
        <div style="display:flex;gap:8px;">
          <input class="input" id="sec-tk" value="${currentTicker}" style="max-width:120px;text-transform:uppercase;"/>
          <button class="btn btn-primary btn-sm" id="sec-load">Load</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:18px;">
        <div class="card">
          <div class="card-head"><div class="card-title">Filings</div></div>
          <div id="sec-filings"></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Insider Transactions (Form 4)</div></div>
          <div id="sec-insiders"></div>
        </div>
      </div>
    `;
    host.querySelector('#sec-load').onclick = () => {
      currentTicker = host.querySelector('#sec-tk').value.toUpperCase();
      load();
    };
    load();
  }

  async function load() {
    const [filings, insiders] = await Promise.all([
      Api.getFilings(currentTicker), Api.getInsiderTrades(currentTicker)
    ]);
    document.getElementById('sec-filings').innerHTML = filings.length ? filings.map(f => `
      <div class="filing-item">
        <div class="filing-type-badge">${f.type}</div>
        <div style="flex:1;">
          <div style="font-weight:600;">${f.description}</div>
          <div class="muted" style="font-size:12px;margin-top:3px;">${f.date} · ${f.pages} pages</div>
        </div>
        <span class="material-symbols-outlined muted">arrow_forward</span>
      </div>`).join('') : `<div class="empty"><span class="material-symbols-outlined">description</span><div class="empty-title">No filings</div></div>`;

    document.getElementById('sec-insiders').innerHTML = insiders.length ? `
      <table class="table">
        <thead><tr><th>Date</th><th>Insider</th><th>Action</th><th class="ta-right">Shares</th></tr></thead>
        <tbody>
          ${insiders.map(i => `<tr>
            <td>${i.date}</td>
            <td><strong>${i.insider}</strong><div class="muted" style="font-size:11px;">${i.role}</div></td>
            <td><span class="badge ${i.action==='Buy'?'up':'down'}">${i.action}</span></td>
            <td class="ta-right tabular">${i.shares.toLocaleString()}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : `<div class="muted" style="padding:14px;text-align:center;">No insider data</div>`;
  }

  return { render };
})();