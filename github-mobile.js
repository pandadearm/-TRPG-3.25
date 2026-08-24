(() => {
  const menuButton = document.createElement('button');
  const scrim = document.createElement('button');
  const app = document.querySelector('.library-shell');
  const topbar = document.querySelector('.topbar');
  const reader = document.querySelector('.reader');
  const cartLayer = document.querySelector('#cart-layer');
  if (!app || !topbar || !reader || !cartLayer) return;

  menuButton.className = 'mobile-menu-trigger';
  menuButton.type = 'button';
  menuButton.setAttribute('aria-label', '開啟全文搜尋與項目目錄');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = '☰';
  topbar.prepend(menuButton);

  scrim.className = 'mobile-menu-scrim';
  scrim.type = 'button';
  scrim.setAttribute('aria-label', '關閉全文搜尋與項目目錄');
  app.append(scrim);

  const closeMenu = () => {
    app.classList.remove('mobile-menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
  };
  const openMenu = () => {
    cartLayer.classList.remove('open');
    app.classList.add('mobile-menu-open');
    menuButton.setAttribute('aria-expanded', 'true');
  };
  const openCart = () => {
    closeMenu();
    cartLayer.classList.add('open');
  };

  menuButton.addEventListener('click', () => app.classList.contains('mobile-menu-open') ? closeMenu() : openMenu());
  scrim.addEventListener('click', closeMenu);
  document.querySelector('#cart-trigger')?.addEventListener('click', closeMenu);
  document.querySelector('#cart-items')?.addEventListener('click', (event) => {
    if (event.target.closest('.cart-item-link')) cartLayer.classList.remove('open');
  });
  document.querySelector('#clear-cart')?.addEventListener('click', () => cartLayer.classList.remove('open'));

  let touchStart;
  reader.addEventListener('touchstart', (event) => {
    const point = event.changedTouches[0];
    touchStart = { x: point.clientX, y: point.clientY };
  }, { passive: true });
  reader.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touchStart.x;
    const dy = point.clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) < 72 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    if (dx > 0) openMenu(); else openCart();
  }, { passive: true });

  const style = document.createElement('style');
  style.textContent = `
    .mobile-menu-trigger,.mobile-menu-scrim { display:none; }
    @media (max-width:760px) {
      .library-shell { height:100dvh; }
      .topbar { height:59px; padding:10px 12px; gap:10px; }
      .topbar h1 { flex:1; min-width:0; font-size:23px; white-space:nowrap; }
      .mobile-menu-trigger { display:grid; width:36px; height:36px; flex:0 0 36px; place-items:center; border:1px solid #b8c8d4; border-radius:7px; background:#fff; color:#284c68; font-size:22px; line-height:1; cursor:pointer; }
      .cart-trigger { flex:0 0 auto; padding:8px 10px; }
      .workspace { display:block; min-height:0; height:calc(100dvh - 59px); }
      .reader { height:100%; }
      .sidebar { display:none; }
      .mobile-menu-open .sidebar { position:fixed; z-index:31; top:0; bottom:0; left:0; display:flex; width:min(360px,88vw); padding:16px 12px 0; border:0; box-shadow:8px 0 28px #17202b40; }
      .mobile-menu-scrim { position:fixed; z-index:30; inset:0; border:0; background:#15253663; }
      .mobile-menu-open .mobile-menu-scrim { display:block; }
      .breadcrumb { height:43px; padding:0 16px; font-size:12px; }
      .article-panel { height:calc(100% - 43px); padding:12px 8px 54px; }
      .article-panel article { padding:18px 15px 32px; border:0; border-radius:0; box-shadow:none; }
      .article-title-row h2 { margin-bottom:14px; font-size:25px; overflow-wrap:anywhere; }
      .article-panel h3 { font-size:17px; overflow-wrap:anywhere; }
      .article-panel p { font-size:15px; line-height:1.62; overflow-wrap:anywhere; }
      .table-wrap td { min-width:138px; padding:4px 6px; }
      .cart-layer { z-index:40; }
      .cart-drawer { width:min(390px,92vw); }
    }
  `;
  document.head.append(style);
})();
