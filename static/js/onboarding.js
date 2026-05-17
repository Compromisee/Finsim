/* ============ ONBOARDING TOUR ============ */
const Onboarding = (() => {
  const STEPS = [
    { selector: '.sidebar', title: 'Navigation', body: 'Use the sidebar to access Markets, Portfolio, Banking, and more. Hover to expand.' },
    { selector: '#global-search', title: 'Search', body: 'Find any stock instantly. Try typing AAPL.' },
    { selector: '.ticker-bar', title: 'Live Ticker', body: 'Real-time prices stream here. Click any item to view details.' },
    { selector: '[data-page="markets"]', title: 'Markets', body: 'Discover stocks, filter by sector, generate new tickers with AI.' },
    { selector: '[data-page="portfolio"]', title: 'Portfolio', body: 'Track holdings, see P/L, and analyze sector allocation.' },
    { selector: '#btn-quickadd', title: 'Quick Actions', body: 'Trigger events, generate news, and quick actions live here.' },
  ];

  let overlay = null;
  let step = 0;

  function start() {
    if (localStorage.getItem('finsim_tour_done')) return;
    showStep(0);
  }

  function showStep(i) {
    cleanup();
    if (i >= STEPS.length) {
      localStorage.setItem('finsim_tour_done', '1');
      Toast.show({ title: 'Tour complete!', body: 'Press Ctrl+K to open command palette', type: 'success' });
      return;
    }
    step = i;
    const s = STEPS[i];
    const target = document.querySelector(s.selector);
    if (!target) return showStep(i + 1);

    const rect = target.getBoundingClientRect();
    overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    document.body.appendChild(overlay);

    const spot = document.createElement('div');
    spot.className = 'tour-spotlight';
    spot.style.left = (rect.left - 6) + 'px';
    spot.style.top = (rect.top - 6) + 'px';
    spot.style.width = (rect.width + 12) + 'px';
    spot.style.height = (rect.height + 12) + 'px';
    document.body.appendChild(spot);

    const tip = document.createElement('div');
    tip.className = 'tour-tooltip';
    tip.innerHTML = `
      <div class="tour-tooltip-title">${s.title}</div>
      <div class="tour-tooltip-body">${s.body}</div>
      <div class="tour-step">Step ${i + 1} of ${STEPS.length}</div>
      <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
        <button class="btn btn-sm" id="tour-skip">Skip Tour</button>
        <button class="btn btn-primary btn-sm" id="tour-next">${i === STEPS.length - 1 ? 'Finish' : 'Next'}</button>
      </div>`;
    document.body.appendChild(tip);

    // Position tooltip
    const tx = rect.left + rect.width + 16;
    const ty = rect.top;
    tip.style.left = Math.min(window.innerWidth - 320, tx) + 'px';
    tip.style.top = Math.min(window.innerHeight - 200, ty) + 'px';

    document.getElementById('tour-next').onclick = () => showStep(i + 1);
    document.getElementById('tour-skip').onclick = () => { localStorage.setItem('finsim_tour_done', '1'); cleanup(); };
  }

  function cleanup() {
    document.querySelectorAll('.tour-overlay, .tour-spotlight, .tour-tooltip').forEach(el => el.remove());
  }

  return { start };
})();