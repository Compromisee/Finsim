/* ============ FULL CHART (LINE + CANDLE + INDICATORS + DRAWING) ============ */
class FinChart {
  constructor(host, options = {}) {
    this.host = host;
    this.options = { mode: 'line', showVolume: true, indicators: [], ...options };
    this.data = [];
    this.hoverIndex = null;
    this.drawings = []; // array of {type: 'line'|'fib'|'rect', points: [...]}
    this.drawingMode = null;
    this.tempPoints = [];
    this._build();
  }

  _build() {
    this.host.innerHTML = '';
    this.host.classList.add('chart-host');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'chart-canvas';
    this.canvas.style.height = (this.options.height || 380) + 'px';
    this.host.appendChild(this.canvas);
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'chart-tooltip';
    this.host.appendChild(this.tooltip);
    this.canvas.addEventListener('mousemove', e => this._onMove(e));
    this.canvas.addEventListener('mouseleave', () => { this.hoverIndex = null; this.tooltip.classList.remove('show'); this._render(); });
    this.canvas.addEventListener('click', e => this._onClick(e));
    window.addEventListener('resize', () => this._render());
  }

  setData(data, options = {}) {
    this.data = data;
    if (options.mode) this.options.mode = options.mode;
    this._render();
  }
  setMode(mode) { this.options.mode = mode; this._render(); }
  setIndicators(list) { this.options.indicators = list; this._render(); }
  enableDrawing(type) { this.drawingMode = type; this.tempPoints = []; }
  clearDrawings() { this.drawings = []; this._render(); }

  _onClick(e) {
    if (!this.drawingMode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.tempPoints.push({ x, y });
    if (this.tempPoints.length === 2) {
      this.drawings.push({ type: this.drawingMode, points: [...this.tempPoints] });
      this.tempPoints = [];
      this.drawingMode = null;
      this._render();
    }
  }

  _onMove(e) {
    if (!this.data.length) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = rect.width - 50;
    const i = Math.round((x / w) * (this.data.length - 1));
    this.hoverIndex = Math.max(0, Math.min(this.data.length - 1, i));
    this._render();
    this._showTooltip();
  }
  _showTooltip() {
    if (this.hoverIndex == null) return;
    const d = this.data[this.hoverIndex];
    const v = typeof d === 'number' ? d : d.close;
    const time = this._formatTime(this.hoverIndex);
    if (typeof d === 'number') {
      this.tooltip.innerHTML = `<div class="tooltip-row"><span>Price</span><span>$${v.toFixed(2)}</span></div><div class="tooltip-row"><span>Time</span><span>${time}</span></div>`;
    } else {
      this.tooltip.innerHTML = `
        <div class="tooltip-row"><span>O</span><span>$${d.open.toFixed(2)}</span></div>
        <div class="tooltip-row"><span>H</span><span>$${d.high.toFixed(2)}</span></div>
        <div class="tooltip-row"><span>L</span><span>$${d.low.toFixed(2)}</span></div>
        <div class="tooltip-row"><span>C</span><span>$${d.close.toFixed(2)}</span></div>`;
    }
    this.tooltip.classList.add('show');
  }

  _formatTime(i) {
    const n = this.data.length;
    const hours = ((i / n) * 24).toFixed(0);
    return `${String(hours).padStart(2, '0')}:00`;
  }

  _render() {
    if (!this.data.length) return;
    const dpr = window.devicePixelRatio || 1;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    this.canvas.width = W * dpr;
    this.canvas.height = H * dpr;
    const ctx = this.canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const css = getComputedStyle(document.documentElement);
    const accent = css.getPropertyValue('--accent').trim();
    const green = css.getPropertyValue('--green').trim();
    const red = css.getPropertyValue('--red').trim();
    const border = css.getPropertyValue('--border').trim();
    const textMuted = css.getPropertyValue('--text-muted').trim();
    const blue = css.getPropertyValue('--blue').trim();
    const purple = css.getPropertyValue('--purple').trim();
    const amber = css.getPropertyValue('--amber').trim();

    const padL = 8, padR = 50, padT = 10;
    const volH = this.options.showVolume ? H * 0.18 : 0;
    const chartH = H - padT - volH - 20;
    const values = this.data.map(d => typeof d === 'number' ? d : d.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    const xStep = (W - padL - padR) / (this.data.length - 1);

    // Grid
    ctx.strokeStyle = border;
    ctx.lineWidth = 0.5;
    for (let g = 0; g <= 4; g++) {
      const y = padT + (chartH / 4) * g;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      const v = max - (range / 4) * g;
      ctx.fillStyle = textMuted; ctx.font = '10px Inter'; ctx.textAlign = 'left';
      ctx.fillText(v.toFixed(2), W - padR + 5, y + 3);
    }

    if (this.options.mode === 'candle') this._drawCandles(ctx, padL, padT, xStep, chartH, min, range, green, red);
    else this._drawLine(ctx, padL, padT, xStep, chartH, min, range, accent);

    // ============ INDICATORS ============
    const inds = this.options.indicators || [];
    if (inds.includes('SMA20')) this._drawSMA(ctx, padL, padT, xStep, chartH, min, range, values, 20, blue);
    if (inds.includes('SMA50')) this._drawSMA(ctx, padL, padT, xStep, chartH, min, range, values, 50, purple);
    if (inds.includes('EMA20')) this._drawEMA(ctx, padL, padT, xStep, chartH, min, range, values, 20, amber);
    if (inds.includes('BBANDS')) this._drawBBands(ctx, padL, padT, xStep, chartH, min, range, values, 20);

    // Volume
    if (this.options.showVolume) {
      const volTop = padT + chartH + 10;
      const vols = this.data.map(d => typeof d === 'number' ? Math.random() * 1000 : (d.volume || 0));
      const vmax = Math.max(...vols) || 1;
      ctx.fillStyle = textMuted + '55';
      vols.forEach((v, i) => {
        const x = padL + i * xStep;
        const bh = (v / vmax) * (volH - 4);
        ctx.fillRect(x - xStep * 0.3, volTop + (volH - bh), xStep * 0.6, bh);
      });
    }

    // X axis
    ctx.fillStyle = textMuted; ctx.font = '10px Inter'; ctx.textAlign = 'center';
    for (let i = 0; i <= 6; i++) {
      const idx = Math.floor((this.data.length - 1) * (i / 6));
      const x = padL + idx * xStep;
      ctx.fillText(this._formatTime(idx).split(':')[0], x, H - 4);
    }

    // ============ DRAWINGS ============
    this.drawings.forEach(dr => this._drawDrawing(ctx, dr, accent));

    // Crosshair
    if (this.hoverIndex != null) {
      const x = padL + this.hoverIndex * xStep;
      const d = this.data[this.hoverIndex];
      const v = typeof d === 'number' ? d : d.close;
      const y = padT + (1 - (v - min) / range) * chartH;
      ctx.strokeStyle = textMuted + '88'; ctx.lineWidth = 0.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + chartH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = accent;
      ctx.fillRect(W - padR + 2, y - 9, padR - 4, 18);
      ctx.fillStyle = '#fff'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
      ctx.fillText(v.toFixed(2), W - padR / 2, y + 3);
    }
  }

  _drawLine(ctx, padL, padT, xStep, chartH, min, range, color) {
    const pts = this.data.map((d, i) => {
      const v = typeof d === 'number' ? d : d.close;
      return { x: padL + i * xStep, y: padT + (1 - (v - min) / range) * chartH };
    });
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, color + '40'); grad.addColorStop(1, color + '00');
    ctx.beginPath(); ctx.moveTo(pts[0].x, padT + chartH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, padT + chartH); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], prev = pts[i-1], cx = (prev.x + p.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + p.y) / 2);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.stroke();
  }

  _drawCandles(ctx, padL, padT, xStep, chartH, min, range, green, red) {
    const cw = Math.max(2, xStep * 0.6);
    this.data.forEach((d, i) => {
      let o, h, l, c;
      if (typeof d === 'number') {
        const prev = i ? (typeof this.data[i-1] === 'number' ? this.data[i-1] : this.data[i-1].close) : d;
        o = prev; c = d;
        h = Math.max(o, c) * (1 + Math.random() * 0.005);
        l = Math.min(o, c) * (1 - Math.random() * 0.005);
      } else { o = d.open; h = d.high; l = d.low; c = d.close; }
      const x = padL + i * xStep;
      const yo = padT + (1 - (o - min) / range) * chartH;
      const yc = padT + (1 - (c - min) / range) * chartH;
      const yh = padT + (1 - (h - min) / range) * chartH;
      const yl = padT + (1 - (l - min) / range) * chartH;
      const up = c >= o;
      ctx.strokeStyle = up ? green : red; ctx.fillStyle = up ? green : red;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yh); ctx.lineTo(x, yl); ctx.stroke();
      const top = Math.min(yo, yc), bh = Math.max(1, Math.abs(yo - yc));
      if (up) { ctx.fillStyle = 'transparent'; ctx.strokeRect(x - cw/2, top, cw, bh); }
      else { ctx.fillRect(x - cw/2, top, cw, bh); }
    });
  }

  _drawSMA(ctx, padL, padT, xStep, chartH, min, range, values, period, color) {
    const pts = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      const ma = sum / period;
      pts.push({ x: padL + i * xStep, y: padT + (1 - (ma - min) / range) * chartH });
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
  }

  _drawEMA(ctx, padL, padT, xStep, chartH, min, range, values, period, color) {
    const k = 2 / (period + 1);
    let ema = values[0];
    const pts = [];
    values.forEach((v, i) => {
      ema = v * k + ema * (1 - k);
      if (i >= period - 1) pts.push({ x: padL + i * xStep, y: padT + (1 - (ema - min) / range) * chartH });
    });
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.setLineDash([4, 2]); ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);
  }

  _drawBBands(ctx, padL, padT, xStep, chartH, min, range, values, period) {
    const upper = [], lower = [], mid = [];
    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      const std = Math.sqrt(slice.reduce((a, b) => a + (b - avg) ** 2, 0) / period);
      upper.push({ x: padL + i * xStep, y: padT + (1 - (avg + 2*std - min) / range) * chartH });
      lower.push({ x: padL + i * xStep, y: padT + (1 - (avg - 2*std - min) / range) * chartH });
      mid.push({ x: padL + i * xStep, y: padT + (1 - (avg - min) / range) * chartH });
    }
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 0.8;
    [upper, lower, mid].forEach(arr => {
      ctx.beginPath();
      arr.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }

  _drawDrawing(ctx, dr, accent) {
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    if (dr.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(dr.points[0].x, dr.points[0].y);
      ctx.lineTo(dr.points[1].x, dr.points[1].y);
      ctx.stroke();
    } else if (dr.type === 'rect') {
      const [a, b] = dr.points;
      ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    } else if (dr.type === 'fib') {
      const [a, b] = dr.points;
      const ratios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      ratios.forEach(r => {
        const y = a.y + (b.y - a.y) * r;
        ctx.strokeStyle = accent + '88'; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(a.x, y); ctx.lineTo(b.x, y); ctx.stroke();
        ctx.fillStyle = accent; ctx.font = '10px Inter';
        ctx.fillText((r * 100).toFixed(1) + '%', b.x + 4, y + 3);
        ctx.setLineDash([]);
      });
    }
  }
}
window.FinChart = FinChart;