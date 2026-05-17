/* ============ MODALS & TOASTS ============ */
const Modal = (() => {
  const root = () => document.getElementById('modal-root');

  function open({ title, body, footer, width }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" ${width ? `style="width:${width}px;max-width:calc(100% - 32px);"` : ''}>
        <div class="modal-head">
          <div class="modal-title">${title || ''}</div>
          <button class="icon-btn" data-close><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="modal-body">${typeof body === 'string' ? body : ''}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
      </div>`;
    if (typeof body !== 'string' && body) {
      overlay.querySelector('.modal-body').appendChild(body);
    }
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.closest('[data-close]')) close(overlay);
    });
    root().appendChild(overlay);
    return overlay;
  }

  function close(overlay) {
    if (!overlay) return;
    overlay.style.animation = 'overlayFadeIn 160ms reverse';
    setTimeout(() => overlay.remove(), 150);
  }

  function confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
    return new Promise(resolve => {
      const o = open({
        title,
        body: `<p style="color:var(--text-2);margin:0;line-height:1.5;">${message}</p>`,
        footer: `
          <button class="btn" data-cancel>${cancelText}</button>
          <button class="btn btn-primary" data-confirm>${confirmText}</button>`,
      });
      o.querySelector('[data-cancel]').onclick = () => { close(o); resolve(false); };
      o.querySelector('[data-confirm]').onclick = () => { close(o); resolve(true); };
    });
  }

  return { open, close, confirm };
})();

const Toast = (() => {
  const root = () => document.getElementById('toast-root');

  function show({ title, body, type = 'info', icon, duration = 3800 }) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    const ico = icon || (type === 'success' ? 'check_circle'
                       : type === 'error' ? 'error'
                       : 'info');
    t.innerHTML = `
      <span class="material-symbols-outlined">${ico}</span>
      <div style="flex:1;min-width:0;">
        <div class="toast-title">${title || ''}</div>
        ${body ? `<div class="toast-body">${body}</div>` : ''}
      </div>`;
    root().appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toastIn 200ms reverse';
      setTimeout(() => t.remove(), 200);
    }, duration);
  }

  return { show };
})();