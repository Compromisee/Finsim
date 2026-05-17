/* ============ RANDOM EVENTS + BLACK SWANS ============ */
const Events = (() => {
  async function triggerRandom() {
    const e = await Api.randomEvent();
    if (!e) return;
    showEventCard(e);
    applyEffect(e);
    Sound.eventChime();
  }

  async function triggerBlackSwan() {
    const res = await Api.blackSwan();
    if (!res) return;
    Sound.crashAlarm();

    Modal.open({
      title: '', width: 520,
      body: `
        <div class="black-swan-modal">
          <div class="black-swan-icon">
            <span class="material-symbols-outlined" style="font-size:48px;color:#fff;">warning</span>
          </div>
          <div style="font-size:14px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;">Black Swan Event</div>
          <h2 style="margin:8px 0 14px;">${res.event.name}</h2>
          <p class="muted" style="font-size:14px;line-height:1.6;">${res.affected_count} stocks affected. Most impacted:</p>
          <div style="margin-top:14px;">
            ${res.most_impacted.map(s => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;">
              <strong>${s.ticker}</strong>
              <span class="${s.impact_pct>=0?'up':'down'} tabular">${s.impact_pct>=0?'+':''}${s.impact_pct}%</span>
            </div>`).join('')}
          </div>
        </div>`,
      footer: `<button class="btn btn-red" data-close>Survive</button>`,
    });
    BrowserNotify.send('⚠ BLACK SWAN', res.event.name);
  }

  function showEventCard(e) {
    const colorMap = { positive: 'var(--green)', negative: 'var(--red)', neutral: 'var(--amber)' };
    const iconMap = { positive: 'trending_up', negative: 'trending_down', neutral: 'sync_alt' };
    const c = colorMap[e.type] || 'var(--accent)';
    const ico = iconMap[e.type] || 'campaign';
    Modal.open({
      title: '', width: 480,
      body: `
        <div style="text-align:center;padding:14px 8px;">
          <div style="width:62px;height:62px;border-radius:50%;background:color-mix(in srgb,${c} 20%,transparent);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
            <span class="material-symbols-outlined" style="font-size:34px;color:${c};">${ico}</span>
          </div>
          <h2 style="margin:0 0 6px;">${e.title}</h2>
          <p class="muted" style="font-size:14px;line-height:1.5;max-width:380px;margin:0 auto;">${e.body}</p>
        </div>`,
      footer: `<button class="btn btn-primary" data-close>Acknowledge</button>`,
    });
    BrowserNotify.send(e.title, e.body);
  }

  function applyEffect(e) {
    if (!e.effect) return;
    if (typeof e.effect.cash === 'number') FinState.adjustCash(e.effect.cash, 'EVENT', e.title);
    if (e.effect.sector_bonus) Toast.show({ title: 'Sector boost', body: `${e.effect.sector_bonus} +8%`, type: 'success' });
  }

  function showBreaking(headline) {
    const div = document.createElement('div');
    div.className = 'breaking-overlay';
    div.innerHTML = `
      <div class="pulse-dot"></div>
      <div>
        <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;opacity:0.85;">BREAKING</div>
        <div>${headline}</div>
      </div>`;
    document.body.appendChild(div);
    Sound.notification();
    setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 400); }, 5000);
  }

  return { triggerRandom, triggerBlackSwan, showBreaking };
})();