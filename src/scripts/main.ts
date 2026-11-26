import { initHeader } from './header';
import { initForm } from './form';

initHeader();
initForm();

const showStaticHero = () => {
  const img = document.querySelector<HTMLImageElement>('[data-hero-fallback]');
  if (img && img.dataset.src) {
    if (!img.getAttribute('src')) img.src = window.innerWidth <= 1020 && img.dataset.srcMobile ? img.dataset.srcMobile : img.dataset.src;
    img.classList.add('is-on');
  }
};

if (document.documentElement.classList.contains('motion')) {
  // Motion (GSAP + the WebGL study model) loads after first paint so the initial render stays light.
  import('./motion').then((m) => m.initMotion()).catch(() => {
    document.documentElement.classList.remove('motion');
    showStaticHero();
  });
} else {
  showStaticHero();
}
