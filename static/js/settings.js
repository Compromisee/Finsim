/* ============ SETTINGS PAGE ============ */
const SettingsPage = (() => {
  let activeSection = 'appearance';

  const SECTIONS = ['appearance','market','game','notifications','sound','data','accessibility','shortcuts','about'];

  function render(host) {
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Settings</div><div class="muted" style="font-size:13px;">Configure FinSim</div></div>
      </div>
      <div class="settings-layout">
        <div class="settings-nav">
          ${SECTIONS.map(s => `<div class="settings-nav-item ${s===activeSection?'active':''}" data-s="${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</div>`).join('')}
        </div>
        <div id="settings-body"></div>
      </div>`;
    host.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { activeSection = b.dataset.s; render(host); });
    renderSection();
  }

  function renderSection() {
    const host = document.getElementById('settings-body');
    const fn = {
      appearance, market, game, notifications, sound, data, accessibility, shortcuts, about,
    }[activeSection];
    host.innerHTML = fn();
    bindHandlers(host);
  }

  function appearance() {
    const s = FinState.getSettings();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Theme</h3>
        <div class="theme-swatches">
          ${['dark','light','terminal','dracula','ocean','blood'].map(t =>
            `<div class="theme-swatch ${t} ${s.theme===t?'active':''}" data-theme="${t}" title="${t}"></div>`).join('')}
        </div>
      </div>`;
  }

  function market() {
    const s = FinState.getSettings();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Market Engine</h3>
        <div class="settings-row">
          <div><div class="settings-row-label">Use AI (Ollama)</div><div class="settings-row-sub">Generate stocks & news via local Ollama</div></div>
          <label class="toggle"><input type="checkbox" data-toggle="useAI" ${s.useAI?'checked':''}/><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Enforce Market Hours</div><div class="settings-row-sub">Restrict trading to 9:30 AM – 4 PM</div></div>
          <label class="toggle"><input type="checkbox" data-toggle="marketHours" ${s.marketHours?'checked':''}/><span class="toggle-slider"></span></label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Inflation Rate</div><div class="settings-row-sub">Annual % erosion of cash value</div></div>
          <input type="number" class="input" data-input="inflation" value="${s.inflation}" style="max-width:100px;" step="0.1"/>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Time Speed</div><div class="settings-row-sub">1x to 1440x (1 day/min)</div></div>
          <select class="select" data-input="speed" style="max-width:120px;">
            ${[1,10,60,1440].map(v => `<option value="${v}" ${s.speed==v?'selected':''}>${v}x</option>`).join('')}
          </select>
        </div>
      </div>`;
  }

  function game() {
    const state = FinState.get();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Game Mode</h3>
        <div class="settings-row">
          <div><div class="settings-row-label">Current Mode</div><div class="settings-row-sub">${state.mode === 'casual' ? 'Casual — all features' : 'Realistic — pure sim'}</div></div>
          <button class="btn" id="switch-mode">Switch Mode</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Starting Capital</div><div class="settings-row-sub">Reset only — does not affect current</div></div>
          <input type="number" class="input" value="100000" style="max-width:140px;"/>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Difficulty</div><div class="settings-row-sub">Affects volatility and event frequency</div></div>
          <select class="select" style="max-width:140px;"><option>Easy</option><option selected>Normal</option><option>Hard</option><option>Insane</option></select>
        </div>
      </div>`;
  }

  function notifications() {
    const s = FinState.getSettings();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Notifications</h3>
        ${[
          ['notifyEvents','Random events','Show overlay cards for events'],
          ['notifyPrice','Price alerts','Trigger toast when alerts fire'],
          ['notifyEarnings','Earnings reminders','Alert 1 day before earnings'],
        ].map(([k,l,d]) => `
          <div class="settings-row">
            <div><div class="settings-row-label">${l}</div><div class="settings-row-sub">${d}</div></div>
            <label class="toggle"><input type="checkbox" data-toggle="${k}" ${s[k]?'checked':''}/><span class="toggle-slider"></span></label>
          </div>`).join('')}
      </div>`;
  }

  function sound() {
    const s = FinState.getSettings();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Sound</h3>
        ${[
          ['soundMaster','Master','Enable all sounds'],
          ['soundTrades','Trade sounds','Click on buy/sell'],
          ['soundEvents','Event sounds','Random event chimes'],
          ['soundCasino','Casino sounds','Spinning, dealing'],
          ['soundNotif','Notifications','Toast & alert sounds'],
        ].map(([k,l,d]) => `
          <div class="settings-row">
            <div><div class="settings-row-label">${l}</div><div class="settings-row-sub">${d}</div></div>
            <label class="toggle"><input type="checkbox" data-toggle="${k}" ${s[k]?'checked':''}/><span class="toggle-slider"></span></label>
          </div>`).join('')}
      </div>`;
  }

  function data() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Save Data</h3>
        <div class="settings-row">
          <div><div class="settings-row-label">Export Save</div><div class="settings-row-sub">Download all state as JSON</div></div>
          <button class="btn" id="exp-save">Export</button>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Import Save</div><div class="settings-row-sub">Load from JSON file</div></div>
          <label class="btn"><input type="file" accept=".json" id="imp-save" style="display:none;"/>Choose File</label>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Reset Progress</div><div class="settings-row-sub" style="color:var(--red);">This cannot be undone</div></div>
          <button class="btn btn-red" id="reset-prog">Reset</button>
        </div>
      </div>`;
  }

  function accessibility() {
    const s = FinState.getSettings();
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Accessibility</h3>
        <div class="settings-row">
          <div><div class="settings-row-label">Font Size</div><div class="settings-row-sub">Base text size in pixels</div></div>
          <input type="number" class="input" data-input="fontSize" value="${s.fontSize}" min="12" max="20" style="max-width:80px;"/>
        </div>
        <div class="settings-row">
          <div><div class="settings-row-label">Reduce Motion</div><div class="settings-row-sub">Disable animations and transitions</div></div>
          <label class="toggle"><input type="checkbox" data-toggle="reduceMotion" ${s.reduceMotion?'checked':''}/><span class="toggle-slider"></span></label>
        </div>
      </div>`;
  }

  function shortcuts() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Keyboard Shortcuts</h3>
        <table class="table">
          ${[
            ['/', 'Focus search'],
            ['G', 'Toggle grid/list view (Markets)'],
            ['B', 'Buy current stock'],
            ['S', 'Sell current stock'],
            ['ESC', 'Close modal'],
            ['FINSIM', 'Open cheat console (Casual)'],
          ].map(([k,d]) => `<tr><td style="font-family:monospace;font-weight:700;">${k}</td><td class="muted">${d}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  function about() {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">About</h3>
        <p><strong>FinSim</strong> v1.0.0</p>
        <p class="muted" style="font-size:13px;">A full-featured financial markets simulation game. Built with Flask, vanilla JS, and Canvas.</p>
        <p class="muted" style="font-size:12px;margin-top:18px;">© 2025 FinSim. All market data is simulated.</p>
      </div>`;
  }

  function bindHandlers(host) {
    host.querySelectorAll('[data-theme]').forEach(s => s.onclick = () => {
      FinState.setSettings({ theme: s.dataset.theme });
      render(document.getElementById('page-container'));
    });
    host.querySelectorAll('[data-toggle]').forEach(t => t.onchange = e => {
      FinState.setSettings({ [t.dataset.toggle]: e.target.checked });
    });
    host.querySelectorAll('[data-input]').forEach(i => i.onchange = e => {
      const v = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
      FinState.setSettings({ [i.dataset.input]: v });
    });
    const sm = host.querySelector('#switch-mode');
    if (sm) sm.onclick = async () => {
      const ok = await Modal.confirm({ title: 'Switch Mode?', message: 'Switching mode will hide/show features but preserve your data.', confirmText: 'Switch' });
      if (ok) {
        const cur = FinState.get().mode;
        FinState.set({ mode: cur === 'casual' ? 'realistic' : 'casual' });
        location.reload();
      }
    };
    const exp = host.querySelector('#exp-save');
    if (exp) exp.onclick = () => FinState.exportSave();
    const imp = host.querySelector('#imp-save');
    if (imp) imp.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const r = new FileReader();
      r.onload = () => {
        if (FinState.importSave(r.result)) {
          Toast.show({ title: 'Save imported', type: 'success' });
          setTimeout(() => location.reload(), 800);
        } else Toast.show({ title: 'Invalid save', type: 'error' });
      };
      r.readAsText(file);
    };
    const reset = host.querySelector('#reset-prog');
    if (reset) reset.onclick = async () => {
      const ok = await Modal.confirm({ title: 'Reset All Progress?', message: 'This will erase everything.', confirmText: 'Reset' });
      if (ok) { FinState.reset(); location.reload(); }
    };
  }

  return { render };
})();