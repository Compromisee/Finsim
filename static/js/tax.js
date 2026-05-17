/* ============ TAX CENTER ============ */
const TaxCenter = (() => {
  async function render(host) {
    const state = FinState.get();
    // estimate short/long
    let st = 0, lt = 0;
    const now = Date.now();
    state.transactions.filter(t => t.type === 'SELL').forEach(t => {
      // Naive: treat half as long-term, half short
      if (t.total > 0) {
        const profit = t.total * 0.3;
        if ((now - new Date(t.timestamp).getTime()) > 365 * 86400 * 1000) lt += profit;
        else st += profit;
      }
    });

    const currentJob = state.career?.jobId || 'intern';
    const jobs = await Api.getCareer();
    const job = jobs.find(j => j.id === currentJob);
    const income = job ? job.salary_annual : 0;

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Tax Center</div><div class="muted" style="font-size:13px;">Federal income tax calculator (2024 brackets)</div></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
        <div class="card">
          <div class="card-head"><div class="card-title">Inputs</div></div>
          <div class="input-group" style="margin-bottom:12px;">
            <label class="input-label">Salary Income</label>
            <input type="number" class="input" id="tx-income" value="${income}"/>
          </div>
          <div class="input-group" style="margin-bottom:12px;">
            <label class="input-label">Short-Term Capital Gains</label>
            <input type="number" class="input" id="tx-st" value="${st.toFixed(2)}"/>
          </div>
          <div class="input-group" style="margin-bottom:12px;">
            <label class="input-label">Long-Term Capital Gains</label>
            <input type="number" class="input" id="tx-lt" value="${lt.toFixed(2)}"/>
          </div>
          <div class="input-group" style="margin-bottom:12px;">
            <label class="input-label">Deductions</label>
            <input type="number" class="input" id="tx-ded" value="13850"/>
          </div>
          <button class="btn btn-primary btn-block" id="tx-calc">Calculate</button>
        </div>

        <div class="tax-summary" id="tx-result">
          <h3 style="margin-top:0;">Tax Summary</h3>
          <div class="muted" style="font-size:13px;">Click "Calculate" to see breakdown</div>
        </div>
      </div>
    `;

    host.querySelector('#tx-calc').onclick = async () => {
      const data = {
        income: parseFloat(host.querySelector('#tx-income').value),
        short_term_gains: parseFloat(host.querySelector('#tx-st').value),
        long_term_gains: parseFloat(host.querySelector('#tx-lt').value),
        deductions: parseFloat(host.querySelector('#tx-ded').value),
      };
      const res = await Api.calcTax(data);
      document.getElementById('tx-result').innerHTML = `
        <h3 style="margin-top:0;">Tax Summary</h3>
        <div class="tax-row"><span>Salary Income</span><span>$${res.income.toLocaleString()}</span></div>
        <div class="tax-row"><span>+ Short-Term Gains</span><span>$${res.short_term_gains.toLocaleString()}</span></div>
        <div class="tax-row"><span>− Deductions</span><span>$${res.deductions.toLocaleString()}</span></div>
        <div class="tax-row"><span>Taxable Ordinary</span><span>$${res.taxable_ordinary.toLocaleString()}</span></div>
        <div class="tax-row"><span>Ordinary Tax</span><span class="down">$${res.ordinary_tax.toLocaleString()}</span></div>
        <div class="tax-row"><span>Long-Term Gains</span><span>$${res.long_term_gains.toLocaleString()}</span></div>
        <div class="tax-row"><span>LT Capital Gains Tax</span><span class="down">$${res.long_term_tax.toLocaleString()}</span></div>
        <div class="tax-row total"><span>Total Federal Tax</span><span class="down">$${res.total_tax.toLocaleString()}</span></div>
        <div class="tax-row"><span>Effective Rate</span><span>${res.effective_rate}%</span></div>
        <button class="btn btn-red btn-block" id="tx-pay" style="margin-top:14px;">Pay Tax Bill ($${res.total_tax.toLocaleString()})</button>
      `;
      document.getElementById('tx-pay').onclick = () => {
        const s = FinState.get();
        if (s.cash < res.total_tax) { Toast.show({ title: 'Insufficient cash', type: 'error' }); return; }
        FinState.adjustCash(-res.total_tax, 'TAX', 'Federal income tax');
        Toast.show({ title: 'Taxes paid', type: 'success' });
      };
    };
  }

  return { render };
})();