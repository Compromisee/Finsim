/* ============ INSIDER TIPSTER ============ */
const Tipster = (() => {
  const TIPS = [
    { body: "Hey, I heard {T} is about to announce a big partnership tomorrow. You didn't get this from me.", bias: 'up', accuracy: 0.75 },
    { body: "Word on the street: {T} earnings will crush estimates. Triple down.", bias: 'up', accuracy: 0.65 },
    { body: "{T} is rumored to be acquiring a competitor — could see a 20% pop.", bias: 'up', accuracy: 0.55 },
    { body: "Insiders are dumping {T}. Bad news coming. Get out.", bias: 'down', accuracy: 0.70 },
    { body: "Heard from someone at {T}'s law firm — SEC investigation incoming.", bias: 'down', accuracy: 0.40 },
    { body: "Big short coming on {T}. Don't say I didn't warn you.", bias: 'down', accuracy: 0.60 },
  ];

  async function showTip() {
    const state = FinState.get();
    if (!state.skills?.insider) return; // skill gated
    const stocks = await Api.getStocks();
    const t = stocks[Math.floor(Math.random() * stocks.length)];
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    const message = tip.body.replace('{T}', t.ticker);

    const body = document.createElement('div');
    body.innerHTML = `
      <div class="tipster-message">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div class="avatar" style="background:#a855f7;width:36px;height:36px;">
            <span class="material-symbols-outlined" style="font-size:18px;">person</span>
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;">Anonymous Tipster</div>
            <div style="opacity:0.7;font-size:11px;">Encrypted message · ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>
        <div style="font-size:14px;line-height:1.5;">${message}</div>
      </div>
      <div class="muted" style="font-size:11px;text-align:center;">⚠ Tips are not always accurate. Trade at your own risk.</div>
    `;

    Modal.open({
      title: 'You have a message', body, width: 460,
      footer: `<button class="btn" data-close>Ignore</button>
               <button class="btn btn-primary" onclick="Market.openDetail('${t.ticker}');document.querySelectorAll('.modal-overlay').forEach(o=>o.remove());">View ${t.ticker}</button>`
    });
    Sound.notification();
  }

  return { showTip };
})();