/* ============ FLOATING MINI CHART WIDGETS ============ */
const Widgets = (() => {
  let widgets = [];
  let zIndex = 200;

  async function popOut(ticker) {
    const stock = Api.findStock(ticker) || await Api.getStock(ticker);
    if (!stock) return;

    const w = document.createElement('div');
    w.className = 'mini-widget';
    w.style.right = (24 + widgets.length * 20) + 'px';
    w.style.bottom = (24 + widgets.length * 20) + 'px';
    w.style.zIndex = ++zIndex;
    w.innerHTML = `
      <div class="mini-widget-head">
        <div style="display:flex;gap:8px;align-items:center;font-size:13px;font-weight:700;">
          ${stock.ticker}
          <span class="${stock.change_pct>=0?'up':'down'}" style="font-size:11px;">${Market.fmtPct(stock.change_pct)}</span>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="icon-btn" data-pin style="width:24px;height:24px;"><span class="material-symbols-outlined" style="font-size:14px;">push_pin</span></button>
          <button class="icon-btn" data-close-w style="width:24px;height:24px;"><span class="material-symbols-outlined" style="font-size:14px;">close</span></button>
        </div>
      </div>
      <div class="mini-widget-body">
        <div style="text-align:center;margin-bottom:6px;">
          <div class="tabular" style="font-size:18px;font-weight:700;">$${Market.fmtPrice(stock.price)}</div>
        </div>
        <canvas style="width:100%;height:140px;"></canvas>
      </div>`;
    document.body.appendChild(w);
    widgets.push(w);

    // Draw spark
    const canvas = w.querySelector('canvas');
    setTimeout(() => Sparkline.draw(canvas, stock.history.slice(-40), { lineWidth: 1.8, fill: true }), 30);

    // Drag
    const head = w.querySelector('.mini-widget-head');
    let dragging = false, startX, startY, sl, st;
    head.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = w.getBoundingClientRect();
      sl = rect.left; st = rect.top;
      w.style.right = 'auto'; w.style.bottom = 'auto';
      w.style.zIndex = ++zIndex;
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      w.style.left = (sl + e.clientX - startX) + 'px';
      w.style.top = (st + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => dragging = false);

    w.querySelector('[data-close-w]').onclick = () => {
      widgets = widgets.filter(x => x !== w);
      w.remove();
    };

    // Live update
    const refresh = setInterval(async () => {
      if (!document.body.contains(w)) { clearInterval(refresh); return; }
      const s = Api.findStock(ticker);
      if (s) {
        w.querySelector('.tabular').textContent = '$' + Market.fmtPrice(s.price);
        Sparkline.draw(canvas, s.history.slice(-40), { lineWidth: 1.8 });
      }
    }, 2000);
  }

  return { popOut };
})();