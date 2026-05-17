/* ============ NEWS FEED PANEL ============ */
const News = (() => {
  async function openPanel() {
    const items = await Api.getNews(30);
    const body = document.createElement('div');
    body.style.maxHeight = '65vh';
    body.style.overflowY = 'auto';
    body.innerHTML = items.length ? items.map(n => {
      const t = new Date(n.timestamp);
      const sentClass = n.sentiment > 0.2 ? 'up' : n.sentiment < -0.2 ? 'down' : 'muted';
      return `
        <div style="padding:14px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:11px;">
            <span class="badge">${n.category}</span>
            <span class="muted">${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style="font-weight:600;margin-bottom:5px;">${n.headline}</div>
          <div class="muted" style="font-size:12px;line-height:1.5;">${n.body}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
            ${n.sectors.map(s => `<span class="badge">${s}</span>`).join('')}
            <span class="badge ${sentClass}">${n.sentiment > 0 ? '+' : ''}${(n.sentiment*100).toFixed(0)}% sentiment</span>
          </div>
        </div>`;
    }).join('') : `<div class="empty"><span class="material-symbols-outlined">campaign</span><div class="empty-body">No news yet</div></div>`;

    Modal.open({ title: 'Market News', body, width: 560 });
  }

  return { openPanel };
})();