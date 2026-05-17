/* ============ SOUND ENGINE (Web Audio synthesized) ============ */
const Sound = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    }
    return ctx;
  }

  function enabled(kind) {
    const s = FinState.getSettings();
    if (!s.soundMaster) return false;
    if (kind === 'trade' && !s.soundTrades) return false;
    if (kind === 'event' && !s.soundEvents) return false;
    if (kind === 'casino' && !s.soundCasino) return false;
    if (kind === 'notif' && !s.soundNotif) return false;
    return true;
  }

  function beep(freq, dur = 0.08, type = 'sine', volume = 0.08) {
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  function sweep(from, to, dur = 0.2, type = 'sine', volume = 0.08) {
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, c.currentTime + dur);
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  // ============ PUBLIC SOUNDS ============
  function tradeClick() { if (enabled('trade')) beep(440, 0.05, 'square', 0.04); }
  function tradeSuccess() {
    if (!enabled('trade')) return;
    sweep(440, 880, 0.18, 'sine', 0.06);
    setTimeout(() => beep(1320, 0.1, 'sine', 0.05), 80);
  }
  function tradeError() {
    if (!enabled('trade')) return;
    beep(220, 0.15, 'sawtooth', 0.08);
  }
  function buyExecute() {
    if (!enabled('trade')) return;
    beep(660, 0.06, 'sine', 0.05);
    setTimeout(() => beep(880, 0.06, 'sine', 0.05), 60);
  }
  function sellExecute() {
    if (!enabled('trade')) return;
    beep(880, 0.06, 'sine', 0.05);
    setTimeout(() => beep(660, 0.06, 'sine', 0.05), 60);
  }
  function notification() {
    if (!enabled('notif')) return;
    beep(880, 0.08, 'sine', 0.05);
    setTimeout(() => beep(1100, 0.12, 'sine', 0.04), 90);
  }
  function achievement() {
    if (!enabled('notif')) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => setTimeout(() => beep(n, 0.12, 'sine', 0.06), i * 80));
  }
  function cardFlip() {
    if (!enabled('casino')) return;
    beep(400, 0.04, 'triangle', 0.05);
  }
  function chipDrop() {
    if (!enabled('casino')) return;
    beep(800, 0.03, 'triangle', 0.06);
    setTimeout(() => beep(600, 0.04, 'triangle', 0.04), 30);
  }
  function rouletteSpin() {
    if (!enabled('casino')) return;
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, c.currentTime + 3);
    gain.gain.setValueAtTime(0.03, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 3);
    osc.connect(gain).connect(c.destination);
    osc.start(); osc.stop(c.currentTime + 3);
  }
  function jackpot() {
    if (!enabled('casino')) return;
    const notes = [523, 659, 784, 1046, 1318];
    for (let r = 0; r < 3; r++) {
      notes.forEach((n, i) => setTimeout(() => beep(n, 0.1, 'square', 0.05), r * 500 + i * 70));
    }
  }
  function eventChime() {
    if (!enabled('event')) return;
    beep(523, 0.15, 'sine', 0.06);
    setTimeout(() => beep(784, 0.2, 'sine', 0.06), 120);
  }
  function crashAlarm() {
    if (!enabled('event')) return;
    for (let i = 0; i < 3; i++) setTimeout(() => sweep(600, 200, 0.25, 'sawtooth', 0.07), i * 300);
  }

  return {
    tradeClick, tradeSuccess, tradeError, buyExecute, sellExecute,
    notification, achievement, cardFlip, chipDrop, rouletteSpin,
    jackpot, eventChime, crashAlarm,
  };
})();