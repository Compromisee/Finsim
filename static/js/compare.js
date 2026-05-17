/* ============ COMPARE MODE ============ */
const Compare = (() => {
  let selected = [];
  let chart = null;

  async function render(host) {
    const stocks = await Api.getStocks();
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Compare Stocks</div><div class="muted" style="font-size:13px;">Overlay up to 4 stock charts</div></div>
      </div>

      <div class="compare-bar" id="compare-bar">
        ${selected.map(t => `<div class="compare-chip">${t}<span class="x" data-rm="${t}"><span class="material-symbols-outlined">close</span></span></div>`).join('')}
        <input class="input" id="cmp-input" placeholder="Add ticker (e.g. AAPL)" style="max-width:180px;" list="cmp-list"/>
        <datalist id="cmp-list">${stocks.map(s=>`<option value="${s.ticker}">${s.name}</option>`).join('')}</datalist>
      </div>

      <div class="card" style="margin-top:14px;">
        <div id="cmp-chart" style="height:400px;"></div>
      </div>

      <div class="card" style="margin-top:14px;">
        <div class="card-head"><div class="card-title">Comparison Table</div></div>
        <div id="cmp-table"></div>
      </div>
    `;

    host.querySelector('#cmp-input').onkeydown = e => {
      if (e.key === 'Enter') {
        const t = e.target.value.toUpperCase().trim();
        if (t && !selected.includes(t) && selected.length < 4) selected.push(t);
        e.target.value = '';
        render(host);
      }
    };
    host.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      selected = selected.filter(x => x !== b.dataset.rm);
      render(host);
    });

    if (selected.length) drawChart(stocks);
  }

  function drawChart(stocks) {
    const host = document.getElementById('cmp-chart');
    const colors = ['#ff6b6b', '#26a69a', '#60a5fa', '#a78bfa'];
    host.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    host.appendChild(canvas);

    const series = selected.map((t, i) => {
      const s = stocks.find(x => x.ticker === t);
      if (!s) return null;
      const hist = s.history.slice(-60);
      const base = hist[0];
      const norm = hist.map(p => ((p - base) / base) * 100);
      return { ticker: t, color: colors[i], data: norm };
    }).filter(Boolean);

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = 400;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const all = series.flatMap(s => s.data);
    const min = Math.min(...all), max = Math.max(...all);
    const range = (max - min) || 1;
    const padL = 8, padR = 60, padT = 20;
    const chartH = H - padT - 30;
    const xStep = (W - padL - padR) / (series[0].data.length - 1);

    // grid
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border');
    for (let g = 0; g <= 4; g++) {
      const y = padT + (chartH / 4) * g;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      const v = max - (range / 4) * g;
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted');
      ctx.font = '10px Inter';
      ctx.fillText(v.toFixed(1) + '%', W - padR + 5, y + 3);
    }

    series.forEach(s => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = padL + i * xStep;
        const y = padT + (1 - (v - min) / range) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // legend
    series.forEach((s, i) => {
      ctx.fillStyle = s.color;
      ctx.fillRect(padL + i * 90, 4, 12, 3);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text');
      ctx.font = 'bold 11px Inter';
      ctx.fillText(s.ticker, padL + i * 90 + 16, 10);
    });

    // table
    document.getElementById('cmp-table').innerHTML = `
      <table class="table">
        <thead><tr><th>Ticker</th><th>Price</th><th>Change %</th><th>P/E</th><th>Mkt Cap</th><th>Beta</th></tr></thead>
        <tbody>
          ${selected.map(t => {
            const s = stocks.find(x => x.ticker === t);
            if (!s) return '';
            return `<tr>
              <td class="ticker-cell">${s.ticker}</td>
              <td class="tabular">$${Market.fmtPrice(s.price)}</td>
              <td class="tabular ${s.change_pct>=0?'delta-up':'delta-down'}">${Market.fmtPct(s.change_pct)}</td>
              <td>${s.pe||'—'}</td>
              <td class="tabular">$${Market.fmtCap(s.market_cap)}</td>
              <td>${s.beta||'—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  return { render };
})();