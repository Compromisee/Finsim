/* ============ TRADING PET / MASCOT ============ */
const Pet = (() => {
  const SPRITES = ['🦜','🐻','🐂','🦊','🐲','🦅','🐺','🦁'];
  const NAMES_DEFAULT = ['Bullsworth', 'Bearington', 'Pippy', 'Ticker', 'Cash', 'Buffett Jr'];

  function render(host) {
    const state = FinState.get();
    if (!state.petName) {
      host.innerHTML = `
        <div class="markets-header"><div><div class="markets-title">Adopt a Trading Pet</div></div></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;max-width:800px;">
          ${SPRITES.map((s,i) => `
            <div class="card interactive" style="cursor:pointer;text-align:center;" data-sprite="${s}" data-name="${NAMES_DEFAULT[i % NAMES_DEFAULT.length]}">
              <div style="font-size:60px;margin-bottom:8px;">${s}</div>
              <div style="font-weight:700;">${NAMES_DEFAULT[i % NAMES_DEFAULT.length]}</div>
              <button class="btn btn-primary btn-sm btn-block" style="margin-top:8px;">Adopt</button>
            </div>`).join('')}
        </div>`;
      host.querySelectorAll('[data-sprite]').forEach(el => el.onclick = () => {
        FinState.set({ petName: el.dataset.name, petSprite: el.dataset.sprite, petLevel: 1, petExp: 0 });
        Sound.achievement();
        Toast.show({ title: `${el.dataset.name} adopted!`, type: 'success' });
        render(host);
      });
      return;
    }

    const exp = state.petExp;
    const lvl = state.petLevel;
    const expNeeded = lvl * 100;
    const pct = (exp / expNeeded) * 100;

    host.innerHTML = `
      <div class="markets-header"><div><div class="markets-title">Your Trading Pet</div></div></div>
      <div class="pet-card" style="max-width:480px;margin:0 auto;">
        <div class="pet-avatar" style="font-size:56px;">${state.petSprite || '🦜'}</div>
        <h2 style="margin:0;">${state.petName}</h2>
        <div class="muted" style="margin:4px 0 18px;">Level ${lvl} Trader Companion</div>

        <div style="text-align:left;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;">
            <span>Experience</span><span class="tabular">${exp} / ${expNeeded}</span>
          </div>
          <div class="progress"><div class="progress-bar" style="width:${pct}%;"></div></div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left;margin-bottom:14px;">
          <div style="padding:10px;background:var(--surface-2);border-radius:8px;">
            <div class="muted" style="font-size:11px;">Daily Bonus</div>
            <div style="font-weight:700;">+$${lvl * 50}</div>
          </div>
          <div style="padding:10px;background:var(--surface-2);border-radius:8px;">
            <div class="muted" style="font-size:11px;">Trade Bonus</div>
            <div style="font-weight:700;">${lvl}% off fees</div>
          </div>
        </div>

        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn btn-primary" id="pet-feed">Feed (+10 EXP)</button>
          <button class="btn" id="pet-claim">Claim Daily Bonus</button>
        </div>
      </div>
    `;

    host.querySelector('#pet-feed').onclick = () => {
      const s = FinState.get();
      if (s.cash < 25) return Toast.show({ title: 'Need $25 to feed', type: 'error' });
      FinState.adjustCash(-25, 'PET', 'Pet food');
      s.petExp += 10;
      const need = s.petLevel * 100;
      if (s.petExp >= need) {
        s.petLevel += 1;
        s.petExp -= need;
        Sound.achievement();
        Toast.show({ title: `${s.petName} leveled up!`, body: `Now level ${s.petLevel}`, type: 'success' });
      } else {
        Sound.tradeClick();
      }
      FinState.set({ petExp: s.petExp, petLevel: s.petLevel });
      render(host);
    };

    host.querySelector('#pet-claim').onclick = () => {
      const bonus = state.petLevel * 50;
      FinState.adjustCash(bonus, 'PET', 'Daily pet bonus');
      Sound.notification();
      Toast.show({ title: `+$${bonus} daily bonus`, type: 'success' });
    };
  }

  return { render };
})();