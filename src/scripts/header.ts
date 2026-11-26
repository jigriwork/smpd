/** Header: scrolled state, hide-on-scroll-down, active section, accessible mobile menu. */
export function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const label = document.querySelector<HTMLElement>('[data-menu-label]');
  if (!header || !toggle || !menu) return;

  const root = document.documentElement;
  let lastY = window.scrollY;
  let ticking = false;
  let open = false;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    if (!open) header.classList.toggle('is-hidden', y > lastY && y > 480 && !header.contains(document.activeElement));
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  onScroll();

  // Mobile menu
  const focusables = () =>
    Array.from(header.querySelectorAll<HTMLElement>('.brand, [data-menu-toggle], [data-menu] a'));

  const setOpen = (next: boolean, returnFocus = true) => {
    open = next;
    toggle.setAttribute('aria-expanded', String(next));
    if (label) label.textContent = next ? 'Close menu' : 'Open menu';
    root.classList.toggle('menu-open', next);
    // Pause smooth scrolling while the menu covers the page.
    const lenis = (window as any).__lenis;
    if (lenis) next ? lenis.stop() : lenis.start();
    if (next) {
      header.classList.remove('is-hidden');
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      menu.hidden = true;
      if (returnFocus) toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  menu.querySelectorAll('[data-menu-link]').forEach((a) =>
    a.addEventListener('click', () => setOpen(false, false)),
  );
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => {
    if (e.matches && open) setOpen(false, false);
  });

  // Active section highlighting in desktop nav
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-link'));
  const map = new Map<Element, HTMLAnchorElement>();
  links.forEach((l) => {
    const target = document.querySelector(l.getAttribute('href') || '');
    if (target) map.set(target, l);
  });
  if ('IntersectionObserver' in window && map.size) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const link = map.get(en.target);
        if (link && en.isIntersecting) {
          links.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, el) => io.observe(el));
  }
}
