/* ============ MARKET HEATMAP ============ */
const Heatmap = (() => {
  async function render(host) {
    const stocks = await Api.getStocks();
    const sorted = [...stocks].sort((a, b) => b.market_cap - a.market_cap).slice(0, 60);

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Market Heatmap</div><div class="muted" style="font-size:13px;">Sized by market cap · Colored by % change</div></div>
      </div>
      <div class="heatmap">
        ${sorted.map(s => {
          const p = s.change_pct;
          const intensity = Math.min(1, Math.abs(p) / 5);
          const color = p >= 0
            ? `rgba(38, 166, 154, ${0.3 + intensity * 0.7})`
            : `rgba(239, 83, 80, ${0.3 + intensity * 0.7})`;
          const big = s.market_cap > 500e9 ? 'span 2 / span 2' : '';
          const tiny = s.market_cap < 50e9 ? 'tiny' : '';
          return `<div class="heatmap-cell ${tiny}" style="background:${color};color:#fff;${big?`grid-column:${big};grid-row:${big};`:''}" data-detail="${s.ticker}">
            <div class="hm-tk">${s.ticker}</div>
            <div class="hm-pct">${p>=0?'+':''}${p.toFixed(2)}%</div>
          </div>`;
        }).join('')}
      </div>
    `;
    host.querySelectorAll('[data-detail]').forEach(el => el.onclick = () => Market.openDetail(el.dataset.detail));
  }

  return { render };
})();