/* ============ BANKING (Wallet / Cards / Loans) ============ */
const Banking = (() => {
  let activeTab = 'wallet';

  function render(host) {
    const state = FinState.get();
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Banking & Wallet</div><div class="muted" style="font-size:13px;">Cash, cards and credit</div></div>
      </div>

      <div class="banking-tabs">
        <div class="banking-tab ${activeTab==='wallet'?'active':''}" data-bt="wallet">
          <span class="material-symbols-outlined">account_balance_wallet</span>
          <div><div class="label">Wallet</div><div class="sub">Cash & assets</div></div>
        </div>
        <div class="banking-tab ${activeTab==='cards'?'active':''}" data-bt="cards">
          <span class="material-symbols-outlined">credit_card</span>
          <div><div class="label">Cards</div><div class="sub">${state.cards.length} active</div></div>
        </div>
        <div class="banking-tab ${activeTab==='loans'?'active':''}" data-bt="loans">
          <span class="material-symbols-outlined">request_quote</span>
          <div><div class="label">Loans</div><div class="sub">${state.loans.length} active</div></div>
        </div>
      </div>

      <div id="bank-panel"></div>
    `;
    host.querySelectorAll('[data-bt]').forEach(b => b.onclick = () => {
      activeTab = b.dataset.bt; render(host);
    });
    renderPanel();
  }

  function renderPanel() {
    const host = document.getElementById('bank-panel');
    if (activeTab === 'wallet') renderWallet(host);
    else if (activeTab === 'cards') renderCards(host);
    else renderLoans(host);
  }

  function renderWallet(host) {
    const state = FinState.get();
    const recent = state.transactions.slice(0, 8);
    host.innerHTML = `
      <div class="wallet-cards">
        <div class="wallet-card">
          <div class="wlabel"><span class="material-symbols-outlined">payments</span>Cash Balance</div>
          <div class="wamt">$${Market.fmtPrice(state.cash)}</div>
          <div class="wdelta muted">Available to trade</div>
        </div>
        <div class="wallet-card">
          <div class="wlabel"><span class="material-symbols-outlined">currency_bitcoin</span>Coin Wallet</div>
          <div class="wamt">$${Market.fmtPrice(state.coinWallet)}</div>
          <div class="wdelta muted">Crypto holdings</div>
        </div>
        <div class="wallet-card">
          <div class="wlabel"><span class="material-symbols-outlined">trending_up</span>Stock Wallet</div>
          <div class="wamt" id="stock-val">—</div>
          <div class="wdelta muted">Total equity value</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="card">
          <div class="card-head"><div class="card-title">Quick Transfer</div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div class="input-group"><label class="input-label">From</label>
              <select class="select" id="from"><option>Cash</option><option>Coin</option></select>
            </div>
            <div class="input-group"><label class="input-label">To</label>
              <select class="select" id="to"><option>Coin</option><option>Cash</option></select>
            </div>
          </div>
          <div class="input-group" style="margin-bottom:12px;">
            <label class="input-label">Amount</label>
            <input type="number" class="input" id="amt" value="100" />
          </div>
          <button class="btn btn-primary btn-block" id="do-xfer">Transfer</button>
        </div>

        <div class="card">
          <div class="card-head"><div class="card-title">Recent Transactions</div></div>
          ${recent.length ? recent.map(t => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
              <div>
                <div style="font-weight:600;">${t.type} ${t.ticker !== '—' ? t.ticker : ''}</div>
                <div class="muted" style="font-size:11px;">${new Date(t.timestamp).toLocaleString()}</div>
              </div>
              <div class="tabular ${t.total >= 0 ? 'up' : 'down'}">${t.total >= 0 ? '+' : ''}$${Market.fmtPrice(Math.abs(t.total))}</div>
            </div>`).join('') :
            `<div class="empty" style="padding:20px 0;"><span class="material-symbols-outlined">receipt</span><div class="empty-body">No recent activity</div></div>`}
        </div>
      </div>
    `;
    // compute stock value
    Api.getStocks().then(stocks => {
      const map = Object.fromEntries(stocks.map(s => [s.ticker, s]));
      let v = 0;
      Object.entries(FinState.get().holdings).forEach(([t, h]) => {
        v += (map[t]?.price || h.avgCost) * h.shares;
      });
      const el = document.getElementById('stock-val');
      if (el) el.textContent = '$' + Market.fmtPrice(v);
    });

    document.getElementById('do-xfer').onclick = () => {
      const amt = parseFloat(document.getElementById('amt').value);
      const from = document.getElementById('from').value;
      const to = document.getElementById('to').value;
      if (from === to) { Toast.show({ title: 'Same account', type: 'error' }); return; }
      const s = FinState.get();
      if (from === 'Cash' && amt > s.cash) { Toast.show({ title: 'Insufficient cash', type: 'error' }); return; }
      if (from === 'Coin' && amt > s.coinWallet) { Toast.show({ title: 'Insufficient coin', type: 'error' }); return; }
      if (from === 'Cash') FinState.set({ cash: s.cash - amt, coinWallet: s.coinWallet + amt });
      else FinState.set({ cash: s.cash + amt, coinWallet: s.coinWallet - amt });
      Toast.show({ title: 'Transfer complete', type: 'success' });
      renderPanel();
    };
  }

  function renderCards(host) {
    const state = FinState.get();
    host.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 320px;gap:18px;">
        <div>
          <div class="card">
            <div class="card-head"><div class="card-title">Your Cards</div></div>
            ${state.cards.length ? `
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
                ${state.cards.map(c => bankCardArt(c)).join('')}
              </div>` :
              `<div class="empty"><span class="material-symbols-outlined">credit_card_off</span><div class="empty-title">No cards yet</div><div class="empty-body">Apply for a card to get started.</div></div>`}
          </div>

          <div class="card" style="margin-top:14px;">
            <div class="card-head"><div class="card-title">Apply for a Card</div></div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
              ${['standard','gold','platinum','black'].map(t => `
                <button class="card interactive" data-apply="${t}" style="padding:14px;text-align:center;cursor:pointer;">
                  <div style="font-weight:700;text-transform:capitalize;margin-bottom:4px;">${t}</div>
                  <div class="muted" style="font-size:11px;">Apply →</div>
                </button>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-head"><div class="card-title">Credit Score</div></div>
            ${gauge(state.creditScore)}
          </div>
        </div>
      </div>
    `;
    host.querySelectorAll('[data-apply]').forEach(b => b.onclick = () => applyCard(b.dataset.apply));
  }

  function bankCardArt(c) {
    return `
      <div class="bank-card ${c.type}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div class="chip"></div>
          <div class="network">FINSIM</div>
        </div>
        <div>
          <div class="number">${c.number_masked}</div>
          <div class="row" style="margin-top:10px;">
            <div><div class="label">Card Holder</div><div class="val">TRADER</div></div>
            <div><div class="label">Expires</div><div class="val">${c.expiry}</div></div>
            <div><div class="label">Limit</div><div class="val tabular">$${Market.fmtPrice(c.limit)}</div></div>
          </div>
        </div>
      </div>`;
  }

  async function applyCard(type) {
    const state = FinState.get();
    Toast.show({ title: 'Checking credit…', type: 'info', duration: 1200 });
    setTimeout(async () => {
      const res = await Api.applyCard({ credit_score: state.creditScore, type });
      if (res.approved) {
        state.cards.push({ type, ...res });
        FinState.set({ cards: state.cards });
        Modal.open({
          title: 'Application Approved',
          width: 460,
          body: `<div style="text-align:center;">
            <span class="material-symbols-outlined" style="font-size:48px;color:var(--green);">verified</span>
            <h3>Approved!</h3>
            <p class="muted">Your new ${type} card has a $${res.limit.toLocaleString()} limit at ${res.apr}% APR.</p>
          </div>`,
          footer: `<button class="btn btn-primary" data-close>Continue</button>`,
        });
        renderPanel();
      } else {
        Modal.open({
          title: 'Application Denied',
          width: 460,
          body: `<div style="text-align:center;">
            <span class="material-symbols-outlined" style="font-size:48px;color:var(--red);">cancel</span>
            <h3>Denied</h3>
            <p class="muted">${res.denied_reason}</p>
          </div>`,
          footer: `<button class="btn" data-close>OK</button>`,
        });
      }
    }, 1100);
  }

  function renderLoans(host) {
    const state = FinState.get();
    host.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 360px;gap:18px;">
        <div class="card">
          <div class="card-head"><div class="card-title">Active Loans</div></div>
          ${state.loans.length ? state.loans.map((l, i) => `
            <div style="padding:14px;border:1px solid var(--border);border-radius:10px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <div><div style="font-weight:700;">$${Market.fmtPrice(l.amount)}</div><div class="muted" style="font-size:12px;">${l.term} months at ${l.rate}% APR</div></div>
                <div style="text-align:right;"><div class="tabular">$${Market.fmtPrice(l.monthly_payment)}/mo</div><div class="muted" style="font-size:12px;">${l.paid || 0}/${l.term} paid</div></div>
              </div>
              <div class="progress"><div class="progress-bar green" style="width:${((l.paid||0)/l.term)*100}%;"></div></div>
            </div>`).join('') :
            `<div class="empty"><span class="material-symbols-outlined">request_quote</span><div class="empty-title">No active loans</div><div class="empty-body">Apply for a loan to leverage your portfolio.</div></div>`}

          <div style="margin-top:18px;padding-top:18px;border-top:1px solid var(--border);">
            <h3 style="margin:0 0 12px;font-size:14px;">Apply for Loan</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div class="input-group"><label class="input-label">Amount</label><input type="number" class="input" id="l-amt" value="10000" /></div>
              <div class="input-group"><label class="input-label">Term (months)</label>
                <select class="select" id="l-term"><option>12</option><option>24</option><option selected>36</option><option>60</option></select>
              </div>
            </div>
            <button class="btn btn-primary btn-block" id="l-apply">Apply Now</button>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-head"><div class="card-title">Credit Score</div></div>
            ${gauge(state.creditScore)}
            <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);font-size:12px;">
              <div style="display:flex;justify-content:space-between;padding:4px 0;"><span class="muted">Range</span><span>300-850</span></div>
              <div style="display:flex;justify-content:space-between;padding:4px 0;"><span class="muted">Rating</span><span>${rating(state.creditScore)}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('l-apply').onclick = async () => {
      const amount = parseFloat(document.getElementById('l-amt').value);
      const term = parseInt(document.getElementById('l-term').value);
      const res = await Api.applyLoan({ amount, term, credit_score: state.creditScore });
      if (res.approved) {
        state.loans.push({ ...res, paid: 0 });
        FinState.set({ loans: state.loans, cash: state.cash + amount });
        FinState.addTransaction({ type: 'LOAN', ticker: '—', quantity: 1, price: amount, total: amount, fees: 0, balanceAfter: FinState.get().cash });
        Modal.open({
          title: 'Loan Approved',
          width: 480,
          body: `<div style="text-align:center;">
            <span class="material-symbols-outlined" style="font-size:48px;color:var(--green);">paid</span>
            <h3>$${amount.toLocaleString()} Deposited</h3>
            <p class="muted">Monthly payment: $${res.monthly_payment.toFixed(2)} at ${res.rate}% APR</p>
            <p class="muted" style="font-size:12px;">Total cost: $${res.total_payment.toFixed(2)}</p>
          </div>`,
          footer: `<button class="btn btn-primary" data-close>Continue</button>`,
        });
        renderPanel();
      } else {
        Toast.show({ title: 'Loan denied', body: res.denied_reason, type: 'error' });
      }
    };
  }

  function rating(score) {
    if (score >= 800) return 'Excellent';
    if (score >= 740) return 'Very Good';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  }

  function gauge(score) {
    const min = 300, max = 850;
    const pct = (score - min) / (max - min);
    const angle = -90 + pct * 180;
    const color = score >= 740 ? '#26a69a' : score >= 670 ? '#f59e0b' : '#ef5350';
    return `
      <div class="gauge">
        <svg viewBox="0 0 200 110">
          <path d="M20,100 A80,80 0 0,1 180,100" stroke="var(--surface-2)" stroke-width="14" fill="none" stroke-linecap="round"/>
          <path d="M20,100 A80,80 0 0,1 180,100"
            stroke="${color}" stroke-width="14" fill="none" stroke-linecap="round"
            stroke-dasharray="${251 * pct} 999"/>
          <circle cx="${100 + 78 * Math.cos((angle - 180) * Math.PI / 180)}"
                  cy="${100 + 78 * Math.sin((angle - 180) * Math.PI / 180)}"
                  r="6" fill="${color}" stroke="var(--bg)" stroke-width="2"/>
        </svg>
        <div class="gauge-value">
          <div class="num">${score}</div>
          <div class="lab">${rating(score)}</div>
        </div>
      </div>`;
  }

  return { render };
})();