/* ============ ANIMATED COUNTER UTILITY ============ */
const Counter = (() => {
  function animate(el, from, to, options = {}) {
    const s = FinState.getSettings();
    if (!s.animatedCounters || s.reduceMotion) {
      el.textContent = format(to, options);
      return;
    }
    const duration = options.duration || 600;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (to - from) * eased;
      el.textContent = format(val, options);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function format(v, opts) {
    if (opts.kind === 'currency') return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (opts.kind === 'pct') return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
    if (opts.kind === 'int') return Math.round(v).toLocaleString();
    return v.toFixed(opts.decimals || 2);
  }

  function set(el, value, options = {}) {
    if (!el) return;
    const current = parseFloat((el.textContent || '0').replace(/[^\d.-]/g, '')) || 0;
    animate(el, current, value, options);
  }

  return { set, animate };
})();