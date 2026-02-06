(function () {

  const btnBurger = document.getElementById('btnBurger');
  const btnClose  = document.getElementById('btnClose');
  const drawer    = document.getElementById('drawer');
  const backdrop  = document.getElementById('backdrop');
  const frame     = document.getElementById('contentFrame');
  const welcome   = document.getElementById('welcome');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    if (btnBurger) btnBurger.setAttribute('aria-expanded', 'true');
    if (backdrop) backdrop.hidden = false;
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (btnBurger) btnBurger.setAttribute('aria-expanded', 'false');
    if (backdrop) backdrop.hidden = true;
  }

  if (btnBurger) btnBurger.addEventListener('click', openDrawer);
  if (btnClose)  btnClose.addEventListener('click', closeDrawer);
  if (backdrop)  backdrop.addEventListener('click', closeDrawer);

  if (frame) {
    frame.addEventListener('load', () => {
      frame.style.display = 'block';
      if (welcome) welcome.style.display = 'none';
    });
  }

  function openInFrame(url) {
    if (!frame || !url) return;
    frame.src = url;
    frame.style.display = 'block';
    if (welcome) welcome.style.display = 'none';
    closeDrawer();
  }

  // --- Télévente links (from /commerce/links.json) ---
  const cleanUrl = (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1).trim();
    }
    return s;
  };

  let cachedLinks = null;
  async function getTeleventeLinks() {
    if (cachedLinks) return cachedLinks;

    const r = await fetch('/commerce/links.json', {
      cache: 'no-store',
      credentials: 'omit',
      headers: { 'Accept': 'application/json' },
    });

    if (!r.ok) throw new Error('links.json inaccessible');
    const data = await r.json();

    cachedLinks = {
      bosch: cleanUrl(data.televenteBosch || data.televente_bosch),
      lub:   cleanUrl(data.televenteLub   || data.televente_lub || data.televente_lubrifiant),
    };
    return cachedLinks;
  }

  // One single click handler
  document.addEventListener('click', async (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-src],[data-id]') : null;
    if (!btn) return;

    // 1) Pages internes (Castrol / tarifs / gestion etc.) -> iframe
    const src = btn.getAttribute('data-src');
    if (src) {
      e.preventDefault();
      e.stopPropagation();
      openInFrame(src);
      return;
    }

    // 2) Télévente (BOSCH/LUB) -> iframe via links.json
    const id = btn.getAttribute('data-id');
    if (id !== 'televente-bosch' && id !== 'televente-lub') return;

    e.preventDefault();
    e.stopPropagation();

    try {
      const links = await getTeleventeLinks();
      const url = (id === 'televente-bosch') ? links.bosch : links.lub;
      if (!url) return;
      openInFrame(url);
    } catch (_) {
      // silencieux volontairement (tu peux logger si tu veux)
      // console.error(_);
    }
  });

  // Swipe-to-close (mobile)
  let startX = null;
  if (drawer) {
    drawer.addEventListener('touchstart', (e) => {
      startX = e.touches && e.touches[0] ? e.touches[0].clientX : null;
    }, { passive: true });

    drawer.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const endX = e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : startX;
      if (endX - startX < -60) closeDrawer();
      startX = null;
    }, { passive: true });
  }

})();
