/* ============ CAREER PATH ============ */
const Career = (() => {
  async function render(host) {
    const jobs = await Api.getCareer();
    const state = FinState.get();
    const currentJob = jobs.find(j => j.id === state.career.jobId) || jobs[0];

    // Compute net worth for promotion check
    const stocks = await Api.getStocks();
    let netWorth = state.cash;
    Object.entries(state.holdings).forEach(([t, h]) => {
      netWorth += (stocks.find(x => x.ticker === t)?.price || h.avgCost) * h.shares;
    });

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Career Path</div><div class="muted" style="font-size:13px;">Climb the Wall Street ladder</div></div>
      </div>

      <div class="portfolio-stats" style="margin-bottom:18px;">
        <div class="pstat-card"><div class="pstat-label">Current Role</div><div class="pstat-value" style="font-size:18px;">${currentJob.title}</div></div>
        <div class="pstat-card"><div class="pstat-label">Annual Salary</div><div class="pstat-value up">$${currentJob.salary_annual.toLocaleString()}</div></div>
        <div class="pstat-card"><div class="pstat-label">Trades Completed</div><div class="pstat-value">${state.career.tradesCount}</div></div>
        <div class="pstat-card"><div class="pstat-label">Total Earnings</div><div class="pstat-value">$${Market.fmtPrice(state.career.totalSalary||0)}</div></div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">Career Ladder</div>
          <button class="btn btn-primary btn-sm" id="check-promo">Check Promotion</button>
        </div>
        <div class="career-tree">
          ${jobs.map(j => {
            const cur = j.id === state.career.jobId;
            const unlocked = j.level < currentJob.level;
            const cls = cur ? 'current' : unlocked ? 'unlocked' : 'locked';
            const ok = state.career.tradesCount >= j.requires.trades && netWorth >= j.requires.net_worth;
            return `<div class="career-node ${cls}">
              <div class="career-level">${j.level}</div>
              <div style="flex:1;">
                <div style="font-weight:700;">${j.title}</div>
                <div class="muted" style="font-size:12px;">Requires: ${j.requires.trades} trades · $${(j.requires.net_worth/1000).toFixed(0)}K net worth</div>
              </div>
              <div style="text-align:right;">
                <div class="tabular" style="font-weight:700;">$${j.salary_annual.toLocaleString()}/y</div>
                ${cur ? '<div class="muted" style="font-size:11px;">Current</div>' : ok ? '<div class="up" style="font-size:11px;">✓ Ready</div>' : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    host.querySelector('#check-promo').onclick = async () => {
      const res = await Api.checkPromotion({
        trades: state.career.tradesCount, net_worth: netWorth, current: state.career.jobId,
      });
      if (res.promoted) {
        state.career.jobId = res.new_job.id;
        state.cash += res.bonus;
        FinState.set({ career: state.career, cash: state.cash });
        Sound.achievement();
        Modal.open({
          title: 'Promoted!', width: 460,
          body: `<div style="text-align:center;padding:14px;">
            <span class="material-symbols-outlined" style="font-size:60px;color:var(--amber);">workspace_premium</span>
            <h2 style="margin:12px 0 6px;">${res.new_job.title}</h2>
            <p class="muted">New salary: $${res.new_job.salary_annual.toLocaleString()}/yr</p>
            <p class="up" style="font-weight:700;font-size:18px;">+$${res.bonus.toLocaleString()} signing bonus!</p>
          </div>`,
          footer: `<button class="btn btn-primary" data-close>Awesome!</button>`,
        });
        render(host);
      } else {
        Toast.show({ title: 'Not yet promoted', body: res.reason, type: 'info' });
      }
    };
  }

  return { render };
})();