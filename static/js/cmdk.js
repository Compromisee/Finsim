/* ============ COMMAND PALETTE (Cmd+K / Ctrl+K) ============ */
const Cmdk = (() => {
  let overlay = null;
  let activeIndex = 0;
  let items = [];

  function open() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'cmdk-overlay';
    overlay.innerHTML = `
      <div class="cmdk-box">
        <input class="cmdk-input" placeholder="Type a command, search a stock, navigate…" autofocus/>
        <div class="cmdk-results" id="cmdk-results"></div>
      </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('.cmdk-input');
    input.focus();
    input.oninput = () => populate(input.value);
    input.onkeydown = e => handleKey(e, input);
    overlay.onclick = e => { if (e.target === overlay) close(); };
    populate('');
  }

  function close() {
    if (overlay) { overlay.remove(); overlay = null; }
  }

  async function populate(q) {
    const stocks = await Api.getStocks();
    const navItems = [
      { type: 'nav', label: 'Dashboard', icon: 'dashboard', cmd: () => Router.go('dashboard') },
      { type: 'nav', label: 'Markets', icon: 'monitoring', cmd: () => Router.go('markets') },
      { type: 'nav', label: 'Portfolio', icon: 'work', cmd: () => Router.go('portfolio') },
      { type: 'nav', label: 'Banking', icon: 'account_balance', cmd: () => Router.go('banking') },
      { type: 'nav', label: 'Options', icon: 'layers', cmd: () => Router.go('options') },
      { type: 'nav', label: 'Crypto', icon: 'currency_bitcoin', cmd: () => Router.go('crypto') },
      { type: 'nav', label: 'Real Estate', icon: 'apartment', cmd: () => Router.go('realestate') },
      { type: 'nav', label: 'Bonds', icon: 'receipt_long', cmd: () => Router.go('bonds') },
      { type: 'nav', label: 'Forex', icon: 'currency_exchange', cmd: () => Router.go('forex') },
      { type: 'nav', label: 'ETFs', icon: 'donut_large', cmd: () => Router.go('etfs') },
      { type: 'nav', label: 'Career', icon: 'badge', cmd: () => Router.go('career') },
      { type: 'nav', label: 'Tax Center', icon: 'percent', cmd: () => Router.go('tax') },
      { type: 'nav', label: 'Heatmap', icon: 'grid_view', cmd: () => Router.go('heatmap') },
      { type: 'nav', label: 'Compare', icon: 'compare', cmd: () => Router.go('compare') },
      { type: 'nav', label: 'Leaderboard', icon: 'leaderboard', cmd: () => Router.go('leaderboard') },
      { type: 'nav', label: 'Settings', icon: 'settings', cmd: () => Router.go('settings') },
    ];
    const actions = [
      { type: 'action', label: 'Generate Random Stock', icon: 'add', cmd: () => Api.generateStock({count:1}).then(()=>Toast.show({title:'Stock generated',type:'success'})) },
      { type: 'action', label: 'Trigger Random Event', icon: 'bolt', cmd: () => Events.triggerRandom() },
      { type: 'action', label: 'Generate News', icon: 'campaign', cmd: () => Api.generateNews().then(()=>Toast.show({title:'News generated',type:'success'})) },
      { type: 'action', label: 'Export Save', icon: 'download', cmd: () => FinState.exportSave() },
      { type: 'action', label: 'Black Swan Event', icon: 'warning', cmd: () => Events.triggerBlackSwan() },
    ];
    const ql = q.toLowerCase().trim();
    const buyMatch = ql.match(/^buy\s+(\d+)\s+([a-z]+)/);
    const sellMatch = ql.match(/^sell\s+(\d+)\s+([a-z]+)/);
    items = [];

    if (buyMatch) {
      const [_, qty, tk] = buyMatch;
      items.push({ type: 'quick', label: `Buy ${qty} ${tk.toUpperCase()}`, icon: 'shopping_cart', cmd: () => quickTrade('buy', tk.toUpperCase(), parseInt(qty)) });
    } else if (sellMatch) {
      const [_, qty, tk] = sellMatch;
      items.push({ type: 'quick', label: `Sell ${qty} ${tk.toUpperCase()}`, icon: 'sell', cmd: () => quickTrade('sell', tk.toUpperCase(), parseInt(qty)) });
    }

    const filteredNav = navItems.filter(n => !ql || n.label.toLowerCase().includes(ql));
    const filteredAct = actions.filter(a => !ql || a.label.toLowerCase().includes(ql));
    const filteredStk = stocks.filter(s => ql && (s.ticker.toLowerCase().includes(ql) || s.name.toLowerCase().includes(ql))).slice(0, 5);

    if (filteredStk.length) {
      items.push({ type: 'section', label: 'STOCKS' });
      filteredStk.forEach(s => items.push({
        type: 'stock', label: `${s.ticker} · ${s.name}`, icon: 'show_chart',
        meta: `$${Market.fmtPrice(s.price)}`, cmd: () => Market.openDetail(s.ticker)
      }));
    }
    if (filteredNav.length) {
      items.push({ type: 'section', label: 'PAGES' });
      filteredNav.forEach(n => items.push(n));
    }
    if (filteredAct.length) {
      items.push({ type: 'section', label: 'ACTIONS' });
      filteredAct.forEach(a => items.push(a));
    }

    activeIndex = items.findIndex(i => i.type !== 'section');
    renderItems();
  }

  function renderItems() {
    const host = document.getElementById('cmdk-results');
    if (!host) return;
    host.innerHTML = items.map((it, i) => {
      if (it.type === 'section') return `<div class="cmdk-section">${it.label}</div>`;
      return `<div class="cmdk-item ${i===activeIndex?'active':''}" data-i="${i}">
        <span class="material-symbols-outlined">${it.icon}</span>
        <span>${it.label}</span>
        ${it.meta ? `<span class="cmdk-meta">${it.meta}</span>` : ''}
      </div>`;
    }).join('');
    host.querySelectorAll('[data-i]').forEach(el => {
      el.onclick = () => execute(parseInt(el.dataset.i));
      el.onmouseenter = () => { activeIndex = parseInt(el.dataset.i); renderItems(); };
    });
  }

  function handleKey(e, input) {
    if (e.key === 'Escape') return close();
    if (e.key === 'ArrowDown') { e.preventDefault(); next(1); }
    if (e.key === 'ArrowUp') { e.preventDefault(); next(-1); }
    if (e.key === 'Enter') { e.preventDefault(); execute(activeIndex); }
  }

  function next(dir) {
    do {
      activeIndex = (activeIndex + dir + items.length) % items.length;
    } while (items[activeIndex] && items[activeIndex].type === 'section');
    renderItems();
  }

  function execute(i) {
    const it = items[i];
    if (!it || it.type === 'section') return;
    close();
    if (it.cmd) it.cmd();
  }

  async function quickTrade(action, ticker, qty) {
    const r = await Api.trade({ ticker, quantity: qty, action, order_type: 'market' });
    if (r && r.success) {
      const res = FinState.executeTrade(r);
      if (res.ok) { Sound.tradeSuccess(); Toast.show({ title: `${action.toUpperCase()} ${qty} ${ticker}`, type: 'success' }); }
      else Toast.show({ title: res.error, type: 'error' });
    }
  }

  // Global keyboard shortcut
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      open();
    }
  });

  return { open, close };
})();