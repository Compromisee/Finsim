/* ============ API LAYER + EXTENDED ENDPOINTS ============ */
const Api = (() => {
  const BASE = '';
  let stocksCache = [];
  let indicesCache = [];
  let sectorsCache = [];
  let cryptoCache = [];
  let forexCache = [];
  let etfsCache = [];
  let bondsCache = [];
  let realestateCache = [];
  let lastFetch = 0;

  async function _fetch(path, opts = {}) {
    try {
      const r = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...opts });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) { console.warn('API fail', path, e); return null; }
  }

  async function getStocks(force) {
    const now = Date.now();
    if (!force && stocksCache.length && (now - lastFetch) < 1500) return stocksCache;
    const data = await _fetch('/api/stocks');
    if (data) { stocksCache = data; lastFetch = now; }
    return stocksCache;
  }
  async function getStock(ticker) { return await _fetch(`/api/stock/${ticker}`); }
  async function getHistory(ticker, tf) { return await _fetch(`/api/stock/${ticker}/history?tf=${tf}`) || []; }
  async function getIndices() {
    const d = await _fetch('/api/indices'); if (d) indicesCache = d; return indicesCache;
  }
  async function getSectors() {
    const d = await _fetch('/api/sectors'); if (d) sectorsCache = d; return sectorsCache;
  }
  async function getNews(limit = 20) { return await _fetch(`/api/news?limit=${limit}`) || []; }
  async function generateNews() { return await _fetch('/api/news/generate', { method: 'POST' }); }
  async function randomEvent() { return await _fetch('/api/events/random'); }
  async function blackSwan() { return await _fetch('/api/blackswan'); }
  async function generateStock(opts = {}) {
    return await _fetch('/api/generate-stock', { method: 'POST', body: JSON.stringify(opts) });
  }
  async function trade(payload) { return await _fetch('/api/trade', { method: 'POST', body: JSON.stringify(payload) }); }
  async function applyLoan(p) { return await _fetch('/api/loan/apply', { method: 'POST', body: JSON.stringify(p) }); }
  async function applyCard(p) { return await _fetch('/api/card/apply', { method: 'POST', body: JSON.stringify(p) }); }

  // ============ NEW ENDPOINTS ============
  async function getOptions(ticker) { return await _fetch(`/api/options/${ticker}`); }
  async function tradeOption(p) { return await _fetch('/api/options/trade', { method: 'POST', body: JSON.stringify(p) }); }

  async function getCrypto(force) {
    if (!force && cryptoCache.length) {
      const cached = await _fetch('/api/crypto'); if (cached) cryptoCache = cached;
      return cryptoCache;
    }
    cryptoCache = await _fetch('/api/crypto') || [];
    return cryptoCache;
  }
  async function stakeCrypto(p) { return await _fetch('/api/crypto/stake', { method: 'POST', body: JSON.stringify(p) }); }

  async function getRealEstate() {
    realestateCache = await _fetch('/api/realestate') || []; return realestateCache;
  }
  async function buyProperty(p) { return await _fetch('/api/realestate/buy', { method: 'POST', body: JSON.stringify(p) }); }

  async function getBonds() {
    bondsCache = await _fetch('/api/bonds') || []; return bondsCache;
  }
  async function buyBond(p) { return await _fetch('/api/bonds/buy', { method: 'POST', body: JSON.stringify(p) }); }

  async function getForex(force) {
    if (!force && forexCache.length) return forexCache;
    forexCache = await _fetch('/api/forex') || []; return forexCache;
  }
  async function tradeForex(p) { return await _fetch('/api/forex/trade', { method: 'POST', body: JSON.stringify(p) }); }

  async function getEtfs() {
    etfsCache = await _fetch('/api/etfs') || []; return etfsCache;
  }

  async function getCareer() { return await _fetch('/api/career'); }
  async function checkPromotion(p) { return await _fetch('/api/career/promote', { method: 'POST', body: JSON.stringify(p) }); }

  async function calcTax(p) { return await _fetch('/api/tax/calculate', { method: 'POST', body: JSON.stringify(p) }); }

  async function getEarningsCalendar() { return await _fetch('/api/earnings/calendar'); }
  async function releaseEarnings(ticker) { return await _fetch(`/api/earnings/${ticker}/release`, { method: 'POST' }); }

  async function getFilings(ticker) { return await _fetch(`/api/sec/${ticker}`); }
  async function getInsiderTrades(ticker) { return await _fetch(`/api/sec/insiders/${ticker}`); }

  async function getLeaderboard() { return await _fetch('/api/leaderboard'); }
  async function submitScore(p) { return await _fetch('/api/leaderboard', { method: 'POST', body: JSON.stringify(p) }); }

  async function backtestBot(p) { return await _fetch('/api/bot/backtest', { method: 'POST', body: JSON.stringify(p) }); }

  function findStock(ticker) { return stocksCache.find(s => s.ticker === ticker); }
  function findCrypto(symbol) { return cryptoCache.find(c => c.symbol === symbol); }
  function findEtf(ticker) { return etfsCache.find(e => e.ticker === ticker); }

  return {
    getStocks, getStock, getHistory, getIndices, getSectors,
    getNews, generateNews, randomEvent, blackSwan, generateStock,
    trade, applyLoan, applyCard,
    getOptions, tradeOption,
    getCrypto, stakeCrypto,
    getRealEstate, buyProperty,
    getBonds, buyBond,
    getForex, tradeForex,
    getEtfs,
    getCareer, checkPromotion,
    calcTax,
    getEarningsCalendar, releaseEarnings,
    getFilings, getInsiderTrades,
    getLeaderboard, submitScore,
    backtestBot,
    findStock, findCrypto, findEtf,
    cache: () => ({ stocks: stocksCache, indices: indicesCache, sectors: sectorsCache, crypto: cryptoCache, forex: forexCache, etfs: etfsCache, bonds: bondsCache, realestate: realestateCache }),
  };
})();