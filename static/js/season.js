/* ============ SEASON PASS ============ */
const Season = (() => {
  function render(host) {
    const state = FinState.get();
    const lvl = state.seasonLevel || 1;
    const xp = state.seasonXP || 0;
    const need = lvl * 200;
    const pct = (xp / need) * 100;

    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Season Pass</div><div class="muted" style="font-size:13px;">Earn XP from trades, complete the season</div></div>
        <div class="streak-badge"><span class="material-symbols-outlined">local_fire_department</span>${state.loginStreak || 0} day streak</div>
      </div>

      <div class="season-track">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;color:var(--text-muted);">SEASON 1 · Winter 2025</div>
            <div style="font-size:22px;font-weight:800;">Level ${lvl}</div>
          </div>
          <div style="text-align:right;">
            <div class="muted" style="font-size:12px;">XP to next level</div>
            <div class="tabular" style="font-size:18px;font-weight:700;">${xp} / ${need}</div>
          </div>
        </div>
        <div class="season-progress"><div class="season-progress-fill" style="width:${pct}%;"></div></div>

        <div class="season-rewards">
          ${Array.from({length: 30}).map((_, i) => {
            const level = i + 1;
            const unlocked = lvl > level;
            const ico = level % 5 === 0 ? 'diamond' : level % 3 === 0 ? 'paid' : 'star';
            return `<div class="season-reward ${unlocked?'unlocked':''}">
              <span class="level">${level}</span>
              <span class="material-symbols-outlined">${ico}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">How to Earn XP</div></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
          ${[
            ['Complete a trade', '+5 XP', 'sync_alt'],
            ['Daily login bonus', '+25 XP', 'today'],
            ['Profitable sell', '+10 XP', 'trending_up'],
            ['Achievement unlocked', '+50 XP', 'emoji_events'],
            ['Casino win', '+15 XP', 'casino'],
            ['Bot deployment', '+20 XP', 'smart_toy'],
          ].map(([n,v,i]) => `
            <div style="display:flex;gap:10px;align-items:center;padding:10px;background:var(--surface-2);border-radius:8px;">
              <span class="material-symbols-outlined" style="color:var(--accent);">${i}</span>
              <div><div style="font-weight:600;font-size:13px;">${n}</div><div class="up" style="font-size:12px;">${v}</div></div>
            </div>`).join('')}
        </div>
      </div>
    `;
  }

  function addXP(amount) {
    const s = FinState.get();
    s.seasonXP = (s.seasonXP || 0) + amount;
    const need = (s.seasonLevel || 1) * 200;
    if (s.seasonXP >= need) {
      s.seasonLevel = (s.seasonLevel || 1) + 1;
      s.seasonXP -= need;
      Sound.achievement();
      Toast.show({ title: `Season Level Up!`, body: `Now level ${s.seasonLevel}`, type: 'success' });
    }
    FinState.set({ seasonXP: s.seasonXP, seasonLevel: s.seasonLevel });
  }

  return { render, addXP };
})();