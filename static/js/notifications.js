/* ============ BROWSER NOTIFICATIONS ============ */
const BrowserNotify = (() => {
  async function request() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  }

  function send(title, body, icon) {
    const s = FinState.getSettings();
    if (!s.browserNotifications) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body, icon: icon || '/favicon.ico', silent: false });
    } catch {}
  }

  return { request, send };
})();