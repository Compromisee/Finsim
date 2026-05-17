/* ============ CHEAT CONSOLE (type FINSIM) ============ */
(() => {
  let buf = '';
  const TARGET = 'FINSIM';
  const panel = () => document.getElementById('cheat-panel');
  const body = () => document.getElementById('cheat-body');

  document.addEventListener('keydown', e => {
    if (e.target.matches('input,textarea,select')) return;
    if (FinState.get().mode !== 'casual') return;
    buf += e.key.toUpperCase();
    if (buf.length > TARGET.length) buf = buf.slice(-TARGET.length);
    if (buf === TARGET) {
      buf = '';
      openConsole();
    }
  });

  function openConsole() {
    panel().classList.remove('hidden');
    renderCheats();
    Toast.show({ title: 'CHEAT MODE ACTIVATED', type: 'info', icon: 'terminal' });
  }

  function renderCheats() {
    body().innerHTML = `
      <button class="cheat-btn" data-c="cash">+ Add $1,000,000 cash</button>
      <button class="cheat-btn" data-c="skills">⚡ Unlock all skills</button>
      <button class="cheat-btn" data-c="achievements">★ Unlock all achievements</button>
      <button class="cheat-btn" data-c="credit">↑ Set credit score to 850</button>
      <button class="cheat-btn" data-c="points">+ Add 50 skill points</button>
      <button class="cheat-btn" data-c="event">⚡ Trigger random event</button>
      <button class="cheat-btn" data-c="news">+ Generate news</button>
      <button class="cheat-btn" data-c="price">$ Set stock price…</button>
    `;
    body().querySelectorAll('[data-c]').forEach(b => b.onclick = () => execute(b.dataset.c));
  }

  function execute(cmd) {
    const state = FinState.get();
    state.cheatsUsed = (state.cheatsUsed || 0) + 1;
    switch (cmd) {
      case 'cash':
        FinState.adjustCash(1_000_000, 'CHEAT', 'Cheat: cash');
        Toast.show({ title: '+$1,000,000', type: 'success' });
        break;
      case 'skills':
        ['insider','lucky','rewind','news','manipulator','bailout','evasion','flash','dividend','bot','sage','margin','oracle','wizard','god'].forEach(id => state.skills[id] = true);
        FinState.set({ skills: state.skills });
        Toast.show({ title: 'All skills unlocked', type: 'success' });
        break;
      case 'achievements':
        ['first_trade','ten_trades','hundred_trades','thousand_trades','first_profit','10k_profit','100k_profit','millionaire','diversified','all_sectors','short_seller','roulette_win','big_win','poker_pro','event_survivor','tip_taker','first_loan','first_card','black_card','skill_5','skill_all','watchlist_10','alerts_5'].forEach(id => {
          state.achievements[id] = { unlocked: true, date: new Date().toISOString() };
        });
        FinState.set({ achievements: state.achievements });
        Toast.show({ title: 'All achievements unlocked', type: 'success' });
        break;
      case 'credit':
        FinState.set({ creditScore: 850 });
        Toast.show({ title: 'Credit score: 850', type: 'success' });
        break;
      case 'points':
        FinState.set({ skillPoints: state.skillPoints + 50 });
        Toast.show({ title: '+50 skill points', type: 'success' });
        break;
      case 'event':
        Events.triggerRandom();
        break;
      case 'news':
        Api.generateNews().then(() => Toast.show({ title: 'News generated', type: 'success' }));
        break;
      case 'price':
        const t = prompt('Ticker?'); if (!t) return;
        const p = parseFloat(prompt('New price?'));
        if (!p) return;
        Toast.show({ title: `Set ${t.toUpperCase()} → $${p}`, type: 'success' });
        break;
    }
  }
})();