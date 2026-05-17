/* ============ MINI SPARKLINE RENDERER ============ */
const Sparkline = {
  draw(canvas, data, options = {}) {
    if (!canvas || !data || data.length < 2) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = w / (data.length - 1);

    const up = data[data.length - 1] >= data[0];
    const css = getComputedStyle(document.documentElement);
    const color = options.color || (up ? css.getPropertyValue('--green').trim() : css.getPropertyValue('--red').trim());

    const points = data.map((v, i) => ({
      x: i * step,
      y: h - ((v - min) / range) * (h - 4) - 2,
    }));

    // gradient area
    if (options.fill !== false) {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color + '55');
      grad.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.moveTo(points[0].x, h);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, h);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, (prev.y + p.y) / 2);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineWidth = options.lineWidth || 1.4;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  drawAll(scope = document) {
    scope.querySelectorAll('canvas[data-spark]').forEach(c => {
      try {
        const data = JSON.parse(c.dataset.spark);
        this.draw(c, data);
      } catch {}
    });
  },
};

window.addEventListener('resize', () => Sparkline.drawAll());