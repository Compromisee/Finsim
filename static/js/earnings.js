/* ============ EARNINGS CALENDAR ============ */
const EarningsCal = (() => {
  async function render(host) {
    const cal = await Api.getEarningsCalendar();
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Earnings Calendar</div><div class="muted" style="font-size:13px;">Upcoming reports — trade before the print</div></div>
      </div>
      <div class="card" style="padding:0;">
        <table class="table">
          <thead><tr>
            <th>Date</th><th>Time</th><th>Ticker</th><th>Company</th>
            <th class="ta-right">EPS Est</th><th class="ta-right">Prev EPS</th>
            <th class="ta-right">Rev Est</th><th></th>
          </tr></thead>
          <tbody>
            ${cal.map(c => `<tr>
              <td>${c.date}</td>
              <td><span class="badge">${c.time === 'BMO' ? 'Before Open' : 'After Close'}</span></td>
              <td class="ticker-cell">${c.ticker}</td>
              <td class="name-cell">${c.name}</td>
              <td class="ta-right tabular">$${c.eps_estimate}</td>
              <td class="ta-right tabular muted">$${c.eps_prev}</td>
              <td class="ta-right tabular">$${c.rev_estimate_b}B</td>
              <td class="ta-right"><button class="btn btn-sm btn-primary" data-rel="${c.ticker}">Release Now</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    host.querySelectorAll('[data-rel]').forEach(b => b.onclick = () => release(b.dataset.rel));
  }

  async function release(ticker) {
    const res = await Api.releaseEarnings(ticker);
    if (!res || res.error) return Toast.show({ title: 'Release failed', type: 'error' });

    Modal.open({
      title: '', width: 480,
      body: `
        <div class="earnings-reveal">
          <div style="font-size:14px;color:var(--text-muted);">${ticker} EARNINGS RESULTS</div>
          <div class="earnings-numbers ${res.beat?'earnings-beat':'earnings-miss'}">${res.beat?'BEAT':'MISS'}</div>
          <div style="margin:14px 0;">
            <div style="font-size:14px;">Actual EPS: <strong class="tabular">$${res.actual_eps}</strong></div>
            <div style="font-size:14px;color:var(--text-muted);">Estimate: <strong class="tabular">$${res.estimate}</strong></div>
          </div>
          <div style="font-size:18px;font-weight:700;" class="${res.surprise_pct>=0?'up':'down'}">
            ${res.surprise_pct>=0?'+':''}${res.surprise_pct}% surprise
          </div>
          <div style="margin-top:12px;color:var(--text-muted);font-size:13px;">
            Price impact: <strong class="${res.price_impact_pct>=0?'up':'down'}">${res.price_impact_pct>=0?'+':''}${res.price_impact_pct}%</strong>
          </div>
        </div>`,
      footer: `<button class="btn btn-primary" data-close>Close</button>`,
    });
    Sound.notification();
  }

  return { render };
})();