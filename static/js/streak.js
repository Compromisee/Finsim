/* ============ DAILY LOGIN STREAK ============ */
const Streak = (() => {
  function check() {
    const res = FinState.checkLoginStreak();
    if (res.alreadyLogged) return;
    if (res.bonus) {
      Sound.notification();
      Modal.open({
        title: '', width: 420,
        body: `
          <div style="text-align:center;padding:18px;">
            <div class="streak-badge" style="margin:0 auto 14px;font-size:14px;">
              <span class="material-symbols-outlined">local_fire_department</span>${res.streak} Day Streak!
            </div>
            <h2 style="margin:0;">Welcome Back!</h2>
            <div style="font-size:38px;font-weight:800;color:var(--green);margin:14px 0;" class="tabular">+$${res.bonus}</div>
            <p class="muted">Daily login bonus. Come back tomorrow for ${(res.streak+1) * 100}!</p>
          </div>`,
        footer: `<button class="btn btn-primary" data-close>Claim</button>`,
      });
    }
  }
  return { check };
})();