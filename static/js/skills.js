/* ============ SKILL TREE (SVG branching) ============ */
const Skills = (() => {
  const SKILLS = [
    { id: 'insider', name: 'Insider Trading', desc: 'See price 5 seconds before update.', cost: 3, x: 50, y: 85, deps: [] },
    { id: 'lucky', name: 'Lucky Charm', desc: 'Random events biased toward positive.', cost: 2, x: 30, y: 70, deps: ['insider'] },
    { id: 'rewind', name: 'Time Rewind', desc: 'Undo last trade once per day.', cost: 4, x: 70, y: 70, deps: ['insider'] },
    { id: 'news', name: 'News Predictor', desc: 'See next news headline 30s early.', cost: 3, x: 20, y: 55, deps: ['lucky'] },
    { id: 'manipulator', name: 'Market Manipulator', desc: 'Nudge one stock price daily.', cost: 5, x: 40, y: 55, deps: ['lucky'] },
    { id: 'bailout', name: 'Federal Bailout', desc: 'One-time loss recovery up to $10K.', cost: 6, x: 60, y: 55, deps: ['rewind'] },
    { id: 'evasion', name: 'Tax Evasion', desc: 'Reduce capital gains by 50%.', cost: 4, x: 80, y: 55, deps: ['rewind'] },
    { id: 'flash', name: 'Flash Trader', desc: 'Execute before price updates.', cost: 5, x: 15, y: 40, deps: ['news'] },
    { id: 'dividend', name: 'Dividend Multiplier', desc: '2x dividend income.', cost: 3, x: 35, y: 40, deps: ['manipulator'] },
    { id: 'bot', name: 'Bot Trader', desc: 'Automated DCA bot.', cost: 5, x: 55, y: 40, deps: ['bailout'] },
    { id: 'sage', name: 'Sector Sage', desc: 'Full sector correlation map.', cost: 4, x: 75, y: 40, deps: ['evasion'] },
    { id: 'margin', name: 'Margin Master', desc: '3x leverage available.', cost: 6, x: 25, y: 25, deps: ['flash', 'dividend'] },
    { id: 'oracle', name: 'Market Oracle', desc: '24h price forecast.', cost: 8, x: 50, y: 25, deps: ['bot'] },
    { id: 'wizard', name: 'Wall St Wizard', desc: 'All buffs +20%.', cost: 10, x: 75, y: 25, deps: ['sage'] },
    { id: 'god', name: 'Market God', desc: 'Set any stock price.', cost: 15, x: 50, y: 10, deps: ['margin', 'oracle', 'wizard'] },
  ];

  function render(host) {
    const state = FinState.get();
    host.innerHTML = `
      <div class="skills-header">
        <div><div class="markets-title">Skill Tree</div><div class="muted" style="font-size:13px;">Unlock perks to gain an edge</div></div>
        <div class="skills-points">
          <span class="material-symbols-outlined">stars</span>
          <span class="tabular">${state.skillPoints}</span>
          <span style="color:var(--text-muted);font-weight:400;font-size:12px;">points</span>
        </div>
      </div>

      <div class="skill-host" id="skill-host">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;">
          ${renderLines(state)}
        </svg>
        ${SKILLS.map(s => renderNode(s, state)).join('')}
      </div>
    `;
    host.querySelectorAll('[data-skill]').forEach(el => {
      el.onclick = () => attemptUnlock(el.dataset.skill);
      el.onmouseenter = e => showTip(e, el.dataset.skill);
      el.onmouseleave = hideTip;
    });
  }

  function renderLines(state) {
    return SKILLS.flatMap(s => s.deps.map(d => {
      const p = SKILLS.find(x => x.id === d);
      const unlocked = state.skills[d] && state.skills[s.id];
      const half = state.skills[d];
      return `<line x1="${p.x}" y1="${p.y}" x2="${s.x}" y2="${s.y}"
        stroke="${unlocked ? 'var(--accent)' : half ? 'var(--text-muted)' : 'var(--border)'}"
        stroke-width="0.3" stroke-dasharray="${half && !unlocked ? '0.8,0.8' : ''}"/>`;
    })).join('');
  }

  function renderNode(s, state) {
    const unlocked = state.skills[s.id];
    const canUnlock = s.deps.every(d => state.skills[d]) && state.skillPoints >= s.cost;
    const cls = unlocked ? 'unlocked' : canUnlock ? 'available' : 'locked';
    return `
      <div data-skill="${s.id}" style="position:absolute;left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%);cursor:pointer;text-align:center;z-index:2;">
        <div style="width:48px;height:48px;border-radius:50%;border:2px solid ${unlocked?'var(--accent)':canUnlock?'var(--green)':'var(--border)'};background:${unlocked?'color-mix(in srgb,var(--accent) 25%,var(--surface))':'var(--surface)'};display:flex;align-items:center;justify-content:center;transition:all 200ms ease;">
          <span class="material-symbols-outlined" style="color:${unlocked?'var(--accent)':canUnlock?'var(--green)':'var(--text-muted)'};font-size:22px;">${iconFor(s.id)}</span>
        </div>
        <div style="font-size:10px;margin-top:4px;font-weight:600;color:${unlocked?'var(--text)':'var(--text-muted)'};white-space:nowrap;">${s.name}</div>
      </div>`;
  }

  function iconFor(id) {
    const map = {
      insider:'visibility', lucky:'auto_awesome', rewind:'history', news:'newspaper',
      manipulator:'tune', bailout:'shield', evasion:'percent', flash:'bolt',
      dividend:'paid', bot:'smart_toy', sage:'hub', margin:'trending_up',
      oracle:'all_inclusive', wizard:'auto_fix_high', god:'workspace_premium',
    };
    return map[id] || 'circle';
  }

  function attemptUnlock(id) {
    const state = FinState.get();
    const s = SKILLS.find(x => x.id === id);
    if (state.skills[id]) { Toast.show({ title: 'Already unlocked', type: 'info' }); return; }
    if (!s.deps.every(d => state.skills[d])) { Toast.show({ title: 'Prerequisites locked', type: 'error' }); return; }
    if (state.skillPoints < s.cost) { Toast.show({ title: 'Not enough points', body: `Need ${s.cost - state.skillPoints} more`, type: 'error' }); return; }
    state.skills[id] = true;
    state.skillPoints -= s.cost;
    FinState.set({ skills: state.skills, skillPoints: state.skillPoints });
    Toast.show({ title: 'Skill unlocked!', body: s.name, type: 'success' });
    render(document.getElementById('page-container'));
  }

  let tipEl = null;
  function showTip(e, id) {
    const s = SKILLS.find(x => x.id === id);
    if (!s) return;
    hideTip();
    tipEl = document.createElement('div');
    tipEl.className = 'skill-tooltip';
    tipEl.innerHTML = `<div class="skill-tt-name">${s.name}</div><div class="skill-tt-desc">${s.desc}</div><div class="skill-tt-cost">${s.cost} skill points</div>`;
    document.body.appendChild(tipEl);
    const r = e.currentTarget.getBoundingClientRect();
    tipEl.style.left = (r.right + 10) + 'px';
    tipEl.style.top = r.top + 'px';
  }
  function hideTip() { if (tipEl) { tipEl.remove(); tipEl = null; } }

  return { render };
})();