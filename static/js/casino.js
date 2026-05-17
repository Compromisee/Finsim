/* ============ CASINO (Roulette / Poker / Blackjack / Slots / Plinko / Lottery) ============ */
const Casino = (() => {
  let activeGame = 'roulette';

  function render(host) {
    host.innerHTML = `
      <div class="markets-header">
        <div><div class="markets-title">Casino</div><div class="muted" style="font-size:13px;">Try your luck — only in Casual Mode</div></div>
        <div class="muted" style="font-size:13px;">Wallet: <strong class="tabular">$${Market.fmtPrice(FinState.get().cash)}</strong></div>
      </div>

      <div class="casino-tabs">
        ${[
          ['roulette','Roulette','circles','Spin the wheel'],
          ['poker','Poker','style','5-Card Draw'],
          ['blackjack','Blackjack','playing_cards','Beat the dealer'],
          ['slots','Slots','casino','Hit the jackpot'],
          ['plinko','Plinko','grain','Drop the ball'],
          ['lottery','Lottery','confirmation_number','Daily ticket'],
        ].map(([g,n,i,d]) => `
          <div class="casino-tab ${activeGame===g?'active':''}" data-g="${g}">
            <span class="material-symbols-outlined">${i}</span>
            <div><div style="font-weight:700;">${n}</div><div class="muted" style="font-size:11px;">${d}</div></div>
          </div>`).join('')}
      </div>

      <div id="game-host"></div>
    `;
    host.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { activeGame = b.dataset.g; render(host); });
    const fn = { roulette: renderRoulette, poker: renderPoker, blackjack: renderBlackjack, slots: renderSlots, plinko: renderPlinko, lottery: renderLottery }[activeGame];
    fn && fn();
  }

  // ============ ROULETTE (unchanged from earlier) ============
  let rouletteBet = { number: null, color: null, parity: null, amount: 10 };
  function renderRoulette() {
    const host = document.getElementById('game-host');
    host.innerHTML = `
      <div class="roulette-table">
        <div class="roulette-wheel-host">
          <canvas id="roulette-wheel" width="280" height="280" style="width:280px;height:280px;"></canvas>
          <div id="r-result" style="text-align:center;margin-top:12px;font-weight:700;font-size:16px;height:24px;"></div>
        </div>
        <div style="flex:1;min-width:300px;">
          <div class="input-group" style="margin-bottom:14px;"><label class="input-label">Bet Amount</label>
            <input type="number" class="input" id="r-amt" value="10" min="1"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
            <button class="bet-cell red" data-bet="color:red">RED</button>
            <button class="bet-cell black" data-bet="color:black">BLACK</button>
            <button class="bet-cell green" data-bet="color:green">GREEN (0)</button>
            <button class="bet-cell" style="background:var(--surface-3);" data-bet="parity:odd">ODD</button>
            <button class="bet-cell" style="background:var(--surface-3);" data-bet="parity:even">EVEN</button>
            <button class="bet-cell" style="background:var(--surface-3);" data-bet="parity:any">ANY</button>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0;font-size:12px;color:var(--text-muted);">
            <span>Current: <strong id="r-current">none</strong></span>
            <button class="btn btn-sm" id="r-clear">Clear</button>
          </div>
          <button class="btn btn-primary btn-lg btn-block" id="r-spin">SPIN</button>
        </div>
      </div>`;
    drawWheel(0);
    host.querySelectorAll('[data-bet]').forEach(b => b.onclick = () => {
      const [key, val] = b.dataset.bet.split(':');
      rouletteBet = { number: null, color: null, parity: null, amount: parseFloat(document.getElementById('r-amt').value) };
      rouletteBet[key] = val;
      document.getElementById('r-current').textContent = `${key}:${val} for $${rouletteBet.amount}`;
      Sound.chipDrop();
    });
    document.getElementById('r-clear').onclick = () => { rouletteBet = { number: null, color: null, parity: null, amount: 10 }; document.getElementById('r-current').textContent = 'none'; };
    document.getElementById('r-spin').onclick = spinWheel;
  }

  const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  function drawWheel(angle) {
    const c = document.getElementById('roulette-wheel'); if (!c) return;
    const ctx = c.getContext('2d'); const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.translate(w/2, h/2); ctx.rotate(angle);
    for (let i = 0; i < 37; i++) {
      const a1 = (i / 37) * Math.PI * 2; const a2 = ((i + 1) / 37) * Math.PI * 2;
      ctx.fillStyle = i === 0 ? '#16a34a' : (RED.has(i) ? '#dc2626' : '#1f2937');
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 130, a1, a2); ctx.fill();
      ctx.save(); ctx.rotate((a1+a2)/2);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
      ctx.fillText(i, 0, -130 + 14); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fillStyle = '#0d1117'; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath(); ctx.moveTo(w/2-8, 4); ctx.lineTo(w/2+8, 4); ctx.lineTo(w/2, 22); ctx.closePath(); ctx.fill();
  }
  function spinWheel() {
    const state = FinState.get();
    if (rouletteBet.amount > state.cash) return Toast.show({ title: 'Insufficient funds', type: 'error' });
    if (!rouletteBet.color && !rouletteBet.parity && rouletteBet.number == null) return Toast.show({ title: 'Place a bet first', type: 'error' });
    FinState.adjustCash(-rouletteBet.amount, 'CASINO', 'Roulette bet');
    Sound.rouletteSpin();
    const winNum = Math.floor(Math.random() * 37);
    const total = Math.PI * 2 * 8 + ((37 - winNum) / 37) * Math.PI * 2;
    const start = performance.now(); const dur = 3200;
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      drawWheel(eased * total);
      if (t < 1) requestAnimationFrame(frame);
      else resolve(winNum);
    }
    requestAnimationFrame(frame);
    function resolve(num) {
      const isRed = RED.has(num); const isGreen = num === 0;
      const color = isGreen ? 'green' : isRed ? 'red' : 'black';
      const parity = num === 0 ? 'any' : (num % 2 === 0 ? 'even' : 'odd');
      let win = 0;
      if (rouletteBet.color === color) win = rouletteBet.amount * (color === 'green' ? 14 : 2);
      if (rouletteBet.parity === parity) win = Math.max(win, rouletteBet.amount * 2);
      if (rouletteBet.number === num) win = Math.max(win, rouletteBet.amount * 35);
      const r = document.getElementById('r-result');
      if (win > 0) {
        FinState.adjustCash(win, 'CASINO', `Roulette win on ${num}`);
        r.innerHTML = `<span style="color:var(--green);">${num} ${color.toUpperCase()} · +$${win}</span>`;
        Sound.jackpot(); Toast.show({ title: 'You won!', body: `+$${win}`, type: 'success' });
      } else {
        r.innerHTML = `<span style="color:var(--red);">${num} ${color.toUpperCase()} · You lost</span>`;
        Sound.tradeError();
      }
    }
  }

  // ============ POKER (unchanged) ============
  let pokerHand = [], pokerHeld = [], pokerStage = 'bet', pokerBet = 20;
  function renderPoker() {
    const host = document.getElementById('game-host');
    host.innerHTML = `
      <div class="poker-table">
        <div style="color:#fff;font-weight:700;font-size:16px;">Bet: $<span id="p-bet">${pokerBet}</span> · Stage: <span id="p-stage">${pokerStage}</span></div>
        <div class="poker-cards" id="p-cards"></div>
        <div id="p-action" style="display:flex;gap:10px;"></div>
      </div>`;
    renderPokerState();
  }
  function renderPokerState() {
    const cards = document.getElementById('p-cards'); const act = document.getElementById('p-action');
    document.getElementById('p-stage').textContent = pokerStage;
    document.getElementById('p-bet').textContent = pokerBet;
    if (pokerStage === 'bet') {
      cards.innerHTML = [0,1,2,3,4].map(() => `<div class="poker-card back"></div>`).join('');
      act.innerHTML = `<input type="number" class="input" id="pb-amt" value="${pokerBet}" style="width:100px;background:#fff;color:#000;"/>
        <button class="btn btn-primary" id="pb-deal">Deal</button>`;
      document.getElementById('pb-deal').onclick = () => {
        pokerBet = parseInt(document.getElementById('pb-amt').value);
        const s = FinState.get();
        if (pokerBet > s.cash) return Toast.show({ title: 'Insufficient', type: 'error' });
        FinState.adjustCash(-pokerBet, 'CASINO', 'Poker bet');
        pokerHand = dealCards(5); pokerHeld = []; pokerStage = 'draw';
        Sound.cardFlip(); setTimeout(()=>Sound.cardFlip(), 80);
        renderPokerState();
      };
      return;
    }
    cards.innerHTML = pokerHand.map((c, i) => `
      <div class="poker-card ${(c.suit==='♥'||c.suit==='♦')?'red':''} ${pokerHeld.includes(i)?'held':''}" data-i="${i}">
        <div class="rank">${c.rank}</div><div class="suit">${c.suit}</div>
      </div>`).join('');
    cards.querySelectorAll('[data-i]').forEach(el => el.onclick = () => {
      if (pokerStage !== 'draw') return;
      const i = parseInt(el.dataset.i);
      if (pokerHeld.includes(i)) pokerHeld = pokerHeld.filter(x => x !== i);
      else pokerHeld.push(i);
      Sound.cardFlip(); renderPokerState();
    });
    if (pokerStage === 'draw') {
      act.innerHTML = `<button class="btn btn-primary" id="p-draw">Draw</button>`;
      document.getElementById('p-draw').onclick = () => {
        pokerHand = pokerHand.map((c, i) => pokerHeld.includes(i) ? c : dealCards(1)[0]);
        pokerStage = 'showdown';
        const { name, mult } = evaluateHand(pokerHand);
        const win = pokerBet * mult;
        if (win > 0) { FinState.adjustCash(win, 'CASINO', `Poker ${name}`); Sound.jackpot(); }
        Toast.show({ title: name, body: win > 0 ? `+$${win}` : 'No win', type: win > 0 ? 'success' : 'info' });
        renderPokerState();
      };
    } else if (pokerStage === 'showdown') {
      const { name, mult } = evaluateHand(pokerHand);
      act.innerHTML = `<div style="color:#fff;font-weight:700;">${name} · ${mult}x</div>
        <button class="btn btn-primary" id="p-new">New Hand</button>`;
      document.getElementById('p-new').onclick = () => { pokerStage = 'bet'; pokerHand = []; pokerHeld = []; renderPokerState(); };
    }
  }
  const SUITS = ['♠','♥','♦','♣']; const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  function dealCards(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push({ rank: RANKS[Math.floor(Math.random()*13)], suit: SUITS[Math.floor(Math.random()*4)] });
    return out;
  }
  function evaluateHand(hand) {
    const counts = {}; hand.forEach(c => counts[c.rank] = (counts[c.rank]||0)+1);
    const pairs = Object.values(counts).sort((a,b)=>b-a);
    const flush = hand.every(c => c.suit === hand[0].suit);
    if (pairs[0] === 4) return { name: 'Four of a Kind', mult: 25 };
    if (pairs[0] === 3 && pairs[1] === 2) return { name: 'Full House', mult: 9 };
    if (flush) return { name: 'Flush', mult: 6 };
    if (pairs[0] === 3) return { name: 'Three of a Kind', mult: 3 };
    if (pairs[0] === 2 && pairs[1] === 2) return { name: 'Two Pair', mult: 2 };
    if (pairs[0] === 2) return { name: 'Pair', mult: 1 };
    return { name: 'High Card', mult: 0 };
  }

  // ============ BLACKJACK ============
  let bjPlayer = [], bjDealer = [], bjStage = 'bet', bjBet = 25;
  function renderBlackjack() {
    const host = document.getElementById('game-host');
    host.innerHTML = `
      <div class="blackjack-table">
        <div>
          <div class="bj-label">DEALER ${bjStage!=='bet' && bjStage!=='player' ? `(${handValue(bjDealer)})` : ''}</div>
          <div class="bj-hand" id="bj-dealer"></div>
        </div>
        <div>
          <div class="bj-label">YOU ${bjStage!=='bet' ? `(${handValue(bjPlayer)})` : ''} · Bet: $${bjBet}</div>
          <div class="bj-hand" id="bj-player"></div>
        </div>
        <div id="bj-action" style="display:flex;gap:10px;"></div>
      </div>`;
    renderBJState();
  }
  function renderBJState() {
    const pHost = document.getElementById('bj-player');
    const dHost = document.getElementById('bj-dealer');
    const act = document.getElementById('bj-action');
    if (bjStage === 'bet') {
      pHost.innerHTML = ''; dHost.innerHTML = '';
      act.innerHTML = `<input type="number" class="input" id="bj-amt" value="${bjBet}" style="width:100px;background:#fff;color:#000;"/>
        <button class="btn btn-primary" id="bj-deal">Deal</button>`;
      document.getElementById('bj-deal').onclick = () => {
        bjBet = parseInt(document.getElementById('bj-amt').value);
        const s = FinState.get();
        if (bjBet > s.cash) return Toast.show({ title: 'Insufficient', type: 'error' });
        FinState.adjustCash(-bjBet, 'CASINO', 'Blackjack bet');
        bjPlayer = dealCards(2); bjDealer = dealCards(2);
        bjStage = 'player';
        Sound.cardFlip(); setTimeout(()=>Sound.cardFlip(), 100);
        renderBlackjack();
      };
      return;
    }
    pHost.innerHTML = bjPlayer.map(c => cardHtml(c)).join('');
    if (bjStage === 'player') {
      dHost.innerHTML = cardHtml(bjDealer[0]) + `<div class="poker-card back"></div>`;
      const pv = handValue(bjPlayer);
      if (pv > 21) { bjStage = 'bust'; setTimeout(() => endHand('bust'), 600); return; }
      if (pv === 21) { bjStage = 'dealer'; setTimeout(playDealer, 600); return; }
      act.innerHTML = `<button class="btn btn-green" id="bj-hit">Hit</button>
        <button class="btn btn-red" id="bj-stand">Stand</button>
        <button class="btn" id="bj-double" ${FinState.get().cash < bjBet ? 'disabled' : ''}>Double Down</button>`;
      document.getElementById('bj-hit').onclick = () => { bjPlayer.push(dealCards(1)[0]); Sound.cardFlip(); renderBJState(); };
      document.getElementById('bj-stand').onclick = () => { bjStage = 'dealer'; playDealer(); };
      document.getElementById('bj-double').onclick = () => {
        FinState.adjustCash(-bjBet, 'CASINO', 'Blackjack double');
        bjBet *= 2; bjPlayer.push(dealCards(1)[0]); Sound.cardFlip();
        bjStage = 'dealer'; renderBJState(); setTimeout(playDealer, 600);
      };
    } else {
      dHost.innerHTML = bjDealer.map(c => cardHtml(c)).join('');
    }
  }
  function playDealer() {
    renderBJState();
    function step() {
      if (handValue(bjDealer) < 17) {
        bjDealer.push(dealCards(1)[0]); Sound.cardFlip(); renderBJState();
        setTimeout(step, 600);
      } else {
        endHand();
      }
    }
    setTimeout(step, 600);
  }
  function endHand(forced) {
    const pv = handValue(bjPlayer); const dv = handValue(bjDealer);
    let result = '', payout = 0;
    if (forced === 'bust' || pv > 21) { result = 'BUST! You lose'; }
    else if (dv > 21) { result = 'Dealer busts! You win'; payout = bjBet * 2; }
    else if (pv > dv) { result = 'You win!'; payout = bjBet * 2; }
    else if (pv === dv) { result = 'Push'; payout = bjBet; }
    else { result = 'Dealer wins'; }
    if (payout > 0) { FinState.adjustCash(payout, 'CASINO', `Blackjack ${result}`); Sound.jackpot(); }
    Toast.show({ title: result, body: payout > 0 ? `+$${payout}` : 'No payout', type: payout > 0 ? 'success' : 'error' });
    bjStage = 'bet';
    setTimeout(() => renderBlackjack(), 1500);
  }
  function cardHtml(c) {
    const red = c.suit === '♥' || c.suit === '♦';
    return `<div class="poker-card ${red?'red':''}"><div class="rank">${c.rank}</div><div class="suit">${c.suit}</div></div>`;
  }
  function handValue(h) {
    let v = 0, aces = 0;
    h.forEach(c => {
      if (c.rank === 'A') { v += 11; aces++; }
      else if (['J','Q','K'].includes(c.rank)) v += 10;
      else v += parseInt(c.rank);
    });
    while (v > 21 && aces) { v -= 10; aces--; }
    return v;
  }

  // ============ SLOTS ============
  const SLOT_SYMBOLS = ['🍒','🍋','🔔','⭐','💎','7️⃣'];
  const SLOT_PAYOUTS = { '🍒':2, '🍋':3, '🔔':5, '⭐':10, '💎':25, '7️⃣':100 };
  let slotsBet = 5;
  function renderSlots() {
    const host = document.getElementById('game-host');
    host.innerHTML = `
      <div class="slot-machine">
        <h2 style="color:var(--amber);margin:0 0 12px;">JACKPOT SLOTS</h2>
        <div class="slot-reels">
          <div class="slot-reel" id="reel-0">?</div>
          <div class="slot-reel" id="reel-1">?</div>
          <div class="slot-reel" id="reel-2">?</div>
        </div>
        <div id="slot-result" style="color:#fff;height:24px;margin:14px 0;font-weight:700;"></div>
        <div style="display:flex;gap:10px;justify-content:center;align-items:center;">
          <span style="color:#fff;">Bet:</span>
          <input type="number" class="input" id="slot-bet" value="${slotsBet}" min="1" style="width:90px;background:#fff;color:#000;"/>
          <button class="btn btn-primary btn-lg" id="slot-spin">SPIN</button>
        </div>
        <div style="color:#888;font-size:11px;margin-top:14px;">3 matching pays: 🍒2x 🍋3x 🔔5x ⭐10x 💎25x 7️⃣100x</div>
      </div>`;
    document.getElementById('slot-spin').onclick = spinSlots;
  }
  function spinSlots() {
    slotsBet = parseInt(document.getElementById('slot-bet').value);
    const s = FinState.get();
    if (slotsBet > s.cash) return Toast.show({ title: 'Insufficient', type: 'error' });
    FinState.adjustCash(-slotsBet, 'CASINO', 'Slots spin');
    Sound.rouletteSpin();
    [0,1,2].forEach(i => document.getElementById(`reel-${i}`).classList.add('spinning'));
    setTimeout(() => stopReel(0), 800);
    setTimeout(() => stopReel(1), 1300);
    setTimeout(() => { stopReel(2); resolveSpin(); }, 1800);
  }
  let reelResults = [];
  function stopReel(i) {
    const sym = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    reelResults[i] = sym;
    const el = document.getElementById(`reel-${i}`);
    el.classList.remove('spinning');
    el.textContent = sym;
    Sound.chipDrop();
  }
  function resolveSpin() {
    const [a, b, c] = reelResults;
    let win = 0;
    if (a === b && b === c) win = slotsBet * SLOT_PAYOUTS[a];
    else if (a === b || b === c || a === c) win = slotsBet * 0.5;
    const r = document.getElementById('slot-result');
    if (win > 0) {
      FinState.adjustCash(win, 'CASINO', `Slots win ${a}${b}${c}`);
      r.innerHTML = `<span style="color:#facc15;">+$${win} WIN!</span>`;
      Sound.jackpot();
    } else {
      r.innerHTML = `<span style="color:#888;">No match</span>`;
    }
  }

  // ============ PLINKO ============
  let plinkoBet = 10;
  function renderPlinko() {
    const host = document.getElementById('game-host');
    host.innerHTML = `
      <div class="plinko-board">
        <h2 style="margin:0 0 12px;">PLINKO</h2>
        <canvas class="plinko-canvas" id="plinko-canvas" width="400" height="380"></canvas>
        <div style="display:flex;gap:10px;justify-content:center;align-items:center;margin-top:14px;">
          <span>Bet:</span>
          <input type="number" class="input" id="plinko-bet" value="${plinkoBet}" style="width:90px;"/>
          <button class="btn btn-primary btn-lg" id="plinko-drop">DROP BALL</button>
        </div>
        <div id="plinko-result" style="margin-top:12px;font-weight:700;height:22px;"></div>
      </div>`;
    drawPlinko();
    document.getElementById('plinko-drop').onclick = dropBall;
  }
  function drawPlinko(ballX, ballY) {
    const c = document.getElementById('plinko-canvas');
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    // pegs
    ctx.fillStyle = '#888';
    for (let row = 0; row < 9; row++) {
      const count = row + 3;
      for (let col = 0; col < count; col++) {
        const x = (c.width / 2) - (count - 1) * 18 + col * 36;
        const y = 40 + row * 32;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    // slots
    const payouts = [10, 4, 2, 1, 0.5, 1, 2, 4, 10];
    const slotW = c.width / payouts.length;
    payouts.forEach((p, i) => {
      ctx.fillStyle = p >= 4 ? '#dc2626' : p >= 2 ? '#f59e0b' : '#26a69a';
      ctx.fillRect(i * slotW + 2, 340, slotW - 4, 38);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(p + 'x', i * slotW + slotW/2, 365);
    });
    // ball
    if (ballX != null) {
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath(); ctx.arc(ballX, ballY, 7, 0, Math.PI * 2); ctx.fill();
    }
  }
  function dropBall() {
    plinkoBet = parseFloat(document.getElementById('plinko-bet').value);
    const s = FinState.get();
    if (plinkoBet > s.cash) return Toast.show({ title: 'Insufficient', type: 'error' });
    FinState.adjustCash(-plinkoBet, 'CASINO', 'Plinko');
    const c = document.getElementById('plinko-canvas');
    let x = c.width / 2 + (Math.random() - 0.5) * 10;
    let y = 10;
    let vx = 0; let vy = 2;
    let bounces = 0;
    function step() {
      vy += 0.3;
      x += vx; y += vy;
      // bounce on rows
      if (bounces < 9 && y > 40 + bounces * 32) {
        vx = (Math.random() - 0.5) * 4;
        vy *= 0.7;
        bounces++;
        Sound.chipDrop();
      }
      drawPlinko(x, y);
      if (y < 340) requestAnimationFrame(step);
      else resolve(x);
    }
    step();
    function resolve(finalX) {
      const payouts = [10, 4, 2, 1, 0.5, 1, 2, 4, 10];
      const slotW = c.width / payouts.length;
      const slot = Math.min(payouts.length-1, Math.max(0, Math.floor(finalX / slotW)));
      const mult = payouts[slot];
      const win = plinkoBet * mult;
      if (win > 0) { FinState.adjustCash(win, 'CASINO', `Plinko ${mult}x`); Sound.jackpot(); }
      document.getElementById('plinko-result').innerHTML = `<span style="color:${mult>=2?'var(--green)':'var(--text-muted)'};">${mult}x · ${win >= plinkoBet ? '+' : ''}$${(win-plinkoBet).toFixed(2)}</span>`;
    }
  }

  // ============ LOTTERY (unchanged) ============
  function renderLottery() {
    const host = document.getElementById('game-host');
    host.innerHTML = `
      <div class="card" style="max-width:560px;margin:0 auto;text-align:center;padding:36px;">
        <span class="material-symbols-outlined" style="font-size:56px;color:var(--accent);">confirmation_number</span>
        <h2 style="margin:14px 0 6px;">Daily Lottery</h2>
        <p class="muted">Pick 6 numbers 1-49. Match all six to win $1,000,000!</p>
        <div id="lotto-pick" style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin:18px 0;"></div>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button class="btn" id="lotto-rand">Quick Pick</button>
          <button class="btn btn-primary" id="lotto-buy">Buy Ticket ($5)</button>
        </div>
        <div id="lotto-result" style="margin-top:16px;font-weight:700;"></div>
      </div>`;
    let picks = new Set();
    function renderGrid() {
      document.getElementById('lotto-pick').innerHTML = Array.from({length:49},(_,i)=>{
        const n = i+1;
        return `<button class="filter-pill ${picks.has(n)?'active':''}" data-n="${n}">${n}</button>`;
      }).join('');
      document.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
        const n = parseInt(b.dataset.n);
        if (picks.has(n)) picks.delete(n);
        else if (picks.size < 6) picks.add(n);
        renderGrid();
      });
    }
    renderGrid();
    document.getElementById('lotto-rand').onclick = () => {
      picks = new Set();
      while (picks.size < 6) picks.add(Math.floor(Math.random()*49)+1);
      renderGrid();
    };
    document.getElementById('lotto-buy').onclick = () => {
      if (picks.size !== 6) return Toast.show({ title: 'Pick 6 numbers', type: 'error' });
      const s = FinState.get();
      if (s.cash < 5) return Toast.show({ title: 'Insufficient', type: 'error' });
      FinState.adjustCash(-5, 'CASINO', 'Lottery ticket');
      const winning = new Set();
      while (winning.size < 6) winning.add(Math.floor(Math.random()*49)+1);
      const matches = [...picks].filter(n => winning.has(n)).length;
      const payouts = [0, 0, 5, 50, 500, 5000, 1000000];
      const win = payouts[matches];
      const res = document.getElementById('lotto-result');
      if (win > 0) {
        FinState.adjustCash(win, 'CASINO', `Lottery ${matches} match`);
        Sound.jackpot();
        res.innerHTML = `<span style="color:var(--green);">${matches} matches — WON $${win.toLocaleString()}!</span>`;
      } else {
        res.innerHTML = `<span style="color:var(--text-muted);">${matches} matches — Winning: ${[...winning].sort((a,b)=>a-b).join(', ')}</span>`;
      }
    };
  }

  return { render };
})();