/* ============ ACHIEVEMENTS ============ */
const Achievements = (() => {
  const LIST = [
    { id: 'first_trade', name: 'First Trade', desc: 'Execute your first trade.', icon: 'flag', tier: 'bronze', cat: 'Trading', check: s => s.transactions.some(t => t.type === 'BUY') },
    { id: 'ten_trades', name: 'Active Trader', desc: 'Complete 10 trades.', icon: 'sync_alt', tier: 'bronze', cat: 'Trading', check: s => s.transactions.filter(t => ['BUY','SELL'].includes(t.type)).length >= 10 },
    { id: 'hundred_trades', name: 'High Frequency', desc: 'Complete 100 trades.', icon: 'sync_alt', tier: 'silver', cat: 'Trading' },
    { id: 'thousand_trades', name: 'Quant', desc: 'Complete 1,000 trades.', icon: 'sync_alt', tier: 'gold', cat: 'Trading' },
    { id: 'first_profit', name: 'In the Green', desc: 'Realize your first profit.', icon: 'trending_up', tier: 'bronze', cat: 'Wealth', check: s => s.realized > 0 },
    { id: '10k_profit', name: 'Five-Figure', desc: 'Reach $10K realized.', icon: 'savings', tier: 'silver', cat: 'Wealth', check: s => s.realized >= 10000 },
    { id: '100k_profit', name: 'Six-Figure', desc: 'Reach $100K realized.', icon: 'attach_money', tier: 'gold', cat: 'Wealth', check: s => s.realized >= 100000 },
    { id: 'millionaire', name: 'Millionaire', desc: 'Net worth crosses $1M.', icon: 'diamond', tier: 'gold', cat: 'Wealth' },
    { id: 'first_loss', name: 'Tuition Paid', desc: 'Take your first realized loss.', icon: 'trending_down', tier: 'bronze', cat: 'Risk', check: s => s.realized < 0 },
    { id: 'diversified', name: 'Diversified', desc: 'Hold 5+ different stocks.', icon: 'donut_large', tier: 'bronze', cat: 'Risk', check: s => Object.keys(s.holdings).length >= 5 },
    { id: 'all_sectors', name: 'Sector Master', desc: 'Hold a stock in every sector.', icon: 'category', tier: 'gold', cat: 'Risk' },
    { id: 'short_seller', name: 'Short Seller', desc: 'Open your first short position.', icon: 'south', tier: 'silver', cat: 'Risk', check: s => Object.keys(s.shorts || {}).length > 0 },
    { id: 'roulette_win', name: 'Lady Luck', desc: 'Win at roulette.', icon: 'casino', tier: 'bronze', cat: 'Casino' },
    { id: 'big_win', name: 'Jackpot', desc: 'Win $10K+ in casino.', icon: 'celebration', tier: 'gold', cat: 'Casino' },
    { id: 'poker_pro', name: 'Poker Pro', desc: 'Hit a Four of a Kind.', icon: 'style', tier: 'silver', cat: 'Casino' },
    { id: 'event_survivor', name: 'Crash Survivor', desc: 'Survive a market crash event.', icon: 'shield', tier: 'silver', cat: 'Events' },
    { id: 'tip_taker', name: 'Tip Taker', desc: 'Receive an anonymous tip.', icon: 'tips_and_updates', tier: 'bronze', cat: 'Events' },
    { id: 'first_loan', name: 'Borrower', desc: 'Take your first loan.', icon: 'request_quote', tier: 'bronze', cat: 'Wealth', check: s => s.loans.length > 0 },
    { id: 'first_card', name: 'Cardholder', desc: 'Get approved for a card.', icon: 'credit_card', tier: 'bronze', cat: 'Wealth', check: s => s.cards.length > 0 },
    { id: 'black_card', name: 'Black Card Status', desc: 'Approved for Black card.', icon: 'workspace_premium', tier: 'gold', cat: 'Wealth', check: s => s.cards.some(c => c.type === 'black') },
    { id: 'skill_5', name: 'Skilled', desc: 'Unlock 5 skills.', icon: 'account_tree', tier: 'silver', cat: 'Social', check: s => Object.keys(s.skills).length >= 5 },
    { id: 'skill_all', name: 'Maxed Out', desc: 'Unlock every skill.', icon: 'workspace_premium', tier: 'gold', cat: 'Social', check: s => Object.keys(s.skills).length >= 15 },
    { id: 'watchlist_10', name: 'Curator', desc: 'Track 10+ stocks.', icon: 'bookmark', tier: 'bronze', cat: 'Social', check: s => s.watchlist.length >= 10 },
    { id: 'alerts_5', name: 'Alert!', desc: 'Set 5+ price alerts.', icon: 'notifications_active', tier: 'bronze', cat: 'Social', check: s => s.alerts.length >= 5 },
  ];

  function evaluate() {
    const state = FinState.get();
    let changed = false;
    LIST.forEach(a => {
      if (a.check && a.check(state) && !state.achievements[a.id]?.unlocked) {
        state.achievements[a.id] = { unlocked: true, date: new Date().toISOString() };
        changed = true;
        celebrate(a);
      }
    });
    if (changed) FinState.set({ achievements: state.achievements });
  }

  function celebrate(a) {
    Toast.show({ title: 'Achievement Unlocked!', body: a.name, type: 'success', icon: 'emoji_events' });
  }

  function render(host) {
    evaluate();
    const state = FinState.get();
    const categories = [...new Set(LIST.map(a => a.cat))];
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Achievements</div><div class="muted" style="font-size:13px;">${Object.keys(state.achievements).length} / ${LIST.length} unlocked</div></div>
      </div>
      ${categories.map(cat => `
        <h3 style="margin:18px 0 10px;font-size:14px;">${cat}</h3>
        <div class="ach-grid">
          ${LIST.filter(a => a.cat === cat).map(a => {
            const u = state.achievements[a.id]?.unlocked;
            return `<div class="ach-card ${u?'unlocked':'locked'}">
              <div class="ach-icon ${a.tier}"><span class="material-symbols-outlined">${a.icon}</span></div>
              <div class="ach-name">${a.name}</div>
              <div class="ach-desc">${a.desc}</div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">
                ${u ? '✓ Unlocked' : a.tier}
              </div>
            </div>`;
          }).join('')}
        </div>
      `).join('')}
    `;
  }

  return { render, evaluate };
})();