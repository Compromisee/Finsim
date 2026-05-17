/* ============ GLOBAL STATE & PERSISTENCE (EXTENDED) ============ */
const FinState = (() => {
  const SAVE_KEY = 'finsim_save_v2';
  const SETTINGS_KEY = 'finsim_settings_v2';

  const defaultState = {
    mode: null,
    cash: 100000,
    coinWallet: 0,
    holdings: {},
    shorts: {},
    options: [],           // [{ticker,kind,strike,expiry,qty,premium,entry}]
    crypto: {},            // { SYM: { amount, avgCost } }
    cryptoStaked: {},      // { SYM: { amount, apy, startDate } }
    properties: [],        // [{id, name, purchase_price, ...}]
    bonds: [],             // [{id, name, qty, cost, ...}]
    forex: [],             // [{pair, side, lots, leverage, entry}]
    etfs: {},              // { TICKER: {shares, avgCost} }
    transactions: [],
    watchlist: ['NVDA', 'TSLA', 'AAPL'],
    watchlistGroups: { 'Default': ['NVDA','TSLA','AAPL'] },
    alerts: [],
    loans: [],
    cards: [],
    creditScore: 720,
    skills: {},
    skillPoints: 5,
    achievements: {},
    netWorthHistory: [],
    realized: 0,
    dividendsTotal: 0,
    rentIncomeTotal: 0,
    bondInterestTotal: 0,
    startDate: null,
    cheatsUsed: 0,
    // NEW
    career: { jobId: 'intern', tradesCount: 0, totalSalary: 0, lastPaid: null },
    tradingBots: [],       // [{name, ticker, rules, capital, active, history}]
    bots: [],
    petName: '',
    petLevel: 1,
    petExp: 0,
    miningRigs: 0,
    miningEarnings: 0,
    loginStreak: 0,
    lastLogin: null,
    seasonXP: 0,
    seasonLevel: 1,
    seasonStart: null,
    leaderboardName: '',
    playerName: 'Trader',
    margin: { borrowed: 0, leverage: 1 },
    customCharts: [],
    drawings: {},
    notes: {},
  };

  const defaultSettings = {
    theme: 'dark',
    soundMaster: true,
    soundTrades: true,
    soundEvents: true,
    soundCasino: true,
    soundNotif: true,
    useAI: false,
    marketHours: false,
    inflation: 2.5,
    speed: 1,
    fontSize: 14,
    reduceMotion: false,
    notifyEvents: true,
    notifyPrice: true,
    notifyEarnings: true,
    difficulty: 'normal',
    browserNotifications: false,
    animatedCounters: true,
    drip: false,           // dividend reinvestment
    autoTaxes: true,
  };

  let state = load() || JSON.parse(JSON.stringify(defaultState));
  let settings = loadSettings() || JSON.parse(JSON.stringify(defaultSettings));
  const subs = new Set();

  // Merge defaults for new fields (forward compatibility)
  state = { ...defaultState, ...state };
  settings = { ...defaultSettings, ...settings };

  function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
  function loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch { return null; } }
  function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  function saveSettings() { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  function notify() { subs.forEach(fn => fn(state)); }
  function get() { return state; }
  function getSettings() { return settings; }
  function set(patch) { state = { ...state, ...patch }; save(); notify(); }
  function setSettings(patch) {
    settings = { ...settings, ...patch };
    saveSettings();
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.style.fontSize = (settings.fontSize || 14) + 'px';
  }

  function reset() { state = JSON.parse(JSON.stringify(defaultState)); save(); notify(); }

  function addTransaction(tx) {
    state.transactions.unshift({
      id: Date.now() + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      ...tx,
    });
    if (state.transactions.length > 5000) state.transactions.length = 5000;
    save(); notify();
  }

  function executeTrade(receipt) {
    const { ticker, action, quantity, price, total, fees } = receipt;
    const h = state.holdings[ticker] || { shares: 0, avgCost: 0, firstBuy: Date.now() };
    let balanceAfter = state.cash;

    if (action === 'buy') {
      const newShares = h.shares + quantity;
      const newCost = (h.avgCost * h.shares + price * quantity) / newShares;
      state.holdings[ticker] = { shares: newShares, avgCost: newCost, firstBuy: h.firstBuy };
      state.cash -= total;
      balanceAfter = state.cash;
    } else if (action === 'sell') {
      if (h.shares < quantity) return { error: 'Insufficient shares' };
      const gain = (price - h.avgCost) * quantity - fees;
      state.realized += gain;
      h.shares -= quantity;
      if (h.shares <= 0) delete state.holdings[ticker];
      else state.holdings[ticker] = h;
      state.cash += total;
      balanceAfter = state.cash;
    } else if (action === 'short') {
      state.shorts[ticker] = state.shorts[ticker] || { shares: 0, entry: 0 };
      const s = state.shorts[ticker];
      const ns = s.shares + quantity;
      const ne = (s.entry * s.shares + price * quantity) / ns;
      state.shorts[ticker] = { shares: ns, entry: ne };
      state.cash += total;
      balanceAfter = state.cash;
    }
    state.career.tradesCount = (state.career.tradesCount || 0) + 1;
    addTransaction({ type: action.toUpperCase(), ticker, quantity, price, total, fees, balanceAfter });
    save(); notify();
    return { ok: true, balanceAfter };
  }

  function adjustCash(amount, type, note) {
    state.cash += amount;
    addTransaction({ type, ticker: '—', quantity: 1, price: amount, total: amount, fees: 0, balanceAfter: state.cash, note });
  }

  // ============ CRYPTO ============
  function buyCrypto(symbol, amount, price) {
    const cost = amount * price;
    if (state.cash < cost) return { error: 'Insufficient funds' };
    const c = state.crypto[symbol] || { amount: 0, avgCost: 0 };
    const newAmt = c.amount + amount;
    c.avgCost = (c.avgCost * c.amount + price * amount) / newAmt;
    c.amount = newAmt;
    state.crypto[symbol] = c;
    state.cash -= cost;
    addTransaction({ type: 'CRYPTO_BUY', ticker: symbol, quantity: amount, price, total: cost, fees: 0, balanceAfter: state.cash });
    save(); notify();
    return { ok: true };
  }
  function sellCrypto(symbol, amount, price) {
    const c = state.crypto[symbol];
    if (!c || c.amount < amount) return { error: 'Insufficient' };
    const proceeds = amount * price;
    c.amount -= amount;
    if (c.amount <= 0) delete state.crypto[symbol];
    state.cash += proceeds;
    state.realized += (price - c.avgCost) * amount;
    addTransaction({ type: 'CRYPTO_SELL', ticker: symbol, quantity: amount, price, total: proceeds, fees: 0, balanceAfter: state.cash });
    save(); notify();
    return { ok: true };
  }

  // ============ OPTIONS ============
  function addOption(opt) {
    state.options.push({ ...opt, openedAt: Date.now() });
    const cost = opt.action === 'buy' ? opt.total : -opt.total;
    state.cash -= cost;
    addTransaction({ type: `OPT_${opt.action.toUpperCase()}_${opt.kind.toUpperCase()}`, ticker: opt.ticker, quantity: opt.quantity, price: opt.premium, total: cost, fees: opt.fees, balanceAfter: state.cash });
    save(); notify();
  }

  // ============ REAL ESTATE ============
  function buyProperty(prop, closing) {
    const total = prop.current_value + closing;
    if (state.cash < total) return { error: 'Insufficient funds' };
    state.cash -= total;
    state.properties.push({ ...prop, purchase_price: prop.current_value, closing_costs: closing, purchased_at: Date.now() });
    addTransaction({ type: 'PROPERTY_BUY', ticker: prop.name, quantity: 1, price: prop.current_value, total, fees: closing, balanceAfter: state.cash });
    save(); notify();
    return { ok: true };
  }

  // ============ BONDS ============
  function buyBond(bond, qty, cost) {
    if (state.cash < cost) return { error: 'Insufficient funds' };
    state.cash -= cost;
    state.bonds.push({ ...bond, quantity: qty, purchase_cost: cost, purchased_at: Date.now() });
    addTransaction({ type: 'BOND_BUY', ticker: bond.name, quantity: qty, price: bond.face_value, total: cost, fees: 0, balanceAfter: state.cash });
    save(); notify();
    return { ok: true };
  }

  // ============ FOREX ============
  function openForexPosition(pos) {
    if (state.cash < pos.margin_required) return { error: 'Insufficient margin' };
    state.cash -= pos.margin_required;
    state.forex.push({ ...pos, opened_at: Date.now() });
    addTransaction({ type: 'FOREX_OPEN', ticker: pos.pair, quantity: pos.lots, price: pos.entry, total: pos.margin_required, fees: 0, balanceAfter: state.cash });
    save(); notify();
    return { ok: true };
  }
  function closeForexPosition(idx, currentPrice) {
    const p = state.forex[idx]; if (!p) return { error: 'Not found' };
    const diff = (currentPrice - p.entry) * (p.side === 'buy' ? 1 : -1);
    const pnl = diff * p.lots * 100000;
    state.cash += p.margin_required + pnl;
    state.realized += pnl;
    state.forex.splice(idx, 1);
    addTransaction({ type: 'FOREX_CLOSE', ticker: p.pair, quantity: p.lots, price: currentPrice, total: pnl, fees: 0, balanceAfter: state.cash });
    save(); notify();
    return { ok: true, pnl };
  }

  // ============ WATCHLIST ============
  function addToWatchlist(t, group = 'Default') {
    if (!state.watchlistGroups[group]) state.watchlistGroups[group] = [];
    if (!state.watchlistGroups[group].includes(t)) state.watchlistGroups[group].push(t);
    if (!state.watchlist.includes(t)) state.watchlist.push(t);
    save(); notify();
  }
  function removeFromWatchlist(t) {
    state.watchlist = state.watchlist.filter(x => x !== t);
    Object.keys(state.watchlistGroups).forEach(g => {
      state.watchlistGroups[g] = state.watchlistGroups[g].filter(x => x !== t);
    });
    save(); notify();
  }

  // ============ LOGIN STREAK ============
  function checkLoginStreak() {
    const today = new Date().toDateString();
    const last = state.lastLogin ? new Date(state.lastLogin).toDateString() : null;
    if (last === today) return { alreadyLogged: true };
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (last === yesterday.toDateString()) {
      state.loginStreak += 1;
    } else {
      state.loginStreak = 1;
    }
    state.lastLogin = new Date().toISOString();
    const bonus = state.loginStreak * 100;
    state.cash += bonus;
    addTransaction({ type: 'STREAK_BONUS', ticker: '—', quantity: 1, price: bonus, total: bonus, fees: 0, balanceAfter: state.cash, note: `Day ${state.loginStreak}` });
    save(); notify();
    return { streak: state.loginStreak, bonus };
  }

  // ============ EXPORT ============
  function exportSave() {
    const blob = new Blob([JSON.stringify({ state, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `finsim_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importSave(json) {
    try {
      const data = JSON.parse(json);
      if (data.state) state = { ...defaultState, ...data.state };
      if (data.settings) settings = { ...defaultSettings, ...data.settings };
      save(); saveSettings();
      document.documentElement.setAttribute('data-theme', settings.theme);
      notify();
      return true;
    } catch { return false; }
  }

  document.documentElement.setAttribute('data-theme', settings.theme);
  document.documentElement.style.fontSize = (settings.fontSize || 14) + 'px';

  return {
    get, set, getSettings, setSettings, subscribe, notify, save,
    addTransaction, executeTrade, adjustCash,
    buyCrypto, sellCrypto, addOption,
    buyProperty, buyBond,
    openForexPosition, closeForexPosition,
    addToWatchlist, removeFromWatchlist,
    checkLoginStreak,
    reset, exportSave, importSave,
  };
})();