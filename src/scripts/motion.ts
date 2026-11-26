/**
 * SMPD motion layer. One GSAP context, a small set of coordinated ideas:
 *  1. Hero: a live study model. Contour lines trace, land lifts into terraces,
 *     the plot is drawn, the outline rises and resolves into built form. Then slow sunlight.
 *  2. Headline and heading reveals line by line.
 *  3. Image masks open on the rendered model stills.
 *  4. A threshold: the dark "future" section opens out of the heritage story.
 * Everything is reverted if reduced motion is switched on, or the page is discarded.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;

/** Intro curtain: a counter runs to 100, then the curtain lifts. Resolves as the lift begins. */
function runLoader(): Promise<void> {
  const el = document.querySelector<HTMLElement>('[data-loader]');
  const count = el?.querySelector<HTMLElement>('[data-loader-count]');
  if (!el || !count || !root.classList.contains('intro')) { root.classList.remove('intro'); return Promise.resolve(); }
  return new Promise((resolve) => {
    const o = { v: 0 };
    gsap.timeline({ onComplete: () => { root.classList.remove('intro'); gsap.set(el, { clearProps: 'all' }); } })
      .to(o, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(o.v)).padStart(3, '0'); } })
      .to(el, { yPercent: -100, duration: 1, ease: 'power4.inOut' }, '+=0.12')
      .add(() => resolve(), '<+0.25');
  });
}

const escapeHTML = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Split a heading into its rendered lines. Returns a restore function. */
function splitLines(el: HTMLElement) {
  const original = el.innerHTML;
  const words = (el.textContent || '').trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="w">${escapeHTML(w)}</span>`).join(' ');
  const lines: string[][] = [];
  let lastTop = -Infinity;
  el.querySelectorAll<HTMLElement>('.w').forEach((w) => {
    if (Math.abs(w.offsetTop - lastTop) > 4) { lines.push([]); lastTop = w.offsetTop; }
    lines[lines.length - 1].push(w.textContent || '');
  });
  el.innerHTML = lines.map((l) => `<span class="split-line"><span class="split-inner">${escapeHTML(l.join(' '))}</span></span>`).join('');
  el.setAttribute('aria-label', words.join(' '));
  return () => { el.innerHTML = original; el.removeAttribute('aria-label'); };
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function showHeroFallback() {
  const img = document.querySelector<HTMLImageElement>('[data-hero-fallback]');
  if (!img) return;
  if (!img.getAttribute('src') && img.dataset.src) img.src = window.innerWidth <= 1020 && img.dataset.srcMobile ? img.dataset.srcMobile : img.dataset.src;
  img.classList.add('is-on');
}

async function initHeroModel(cleanups: (() => void)[], ready: Promise<void>) {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  if (!canvas || !webglAvailable()) { showHeroFallback(); return; }
  let model: ReturnType<typeof import('../three/model')['createModel']>;
  try {
    const { createModel } = await import('../three/model');
    const wide = window.matchMedia('(min-width: 1021px)');
    model = createModel({ canvas, shot: wide.matches ? 'hero' : 'heroMobile' });
    const frame = () => (wide.matches ? model.setView(0.02, -0.2) : model.setView(0, 0.02));
    frame();
    wide.addEventListener('change', frame);
    cleanups.push(() => wide.removeEventListener('change', frame));
  } catch {
    showHeroFallback();
    return;
  }

  await ready;
  const intro = model.intro();
  intro.eventCallback('onComplete', () => model.light.play());

  // Light only runs while the hero is on screen.
  const st = ScrollTrigger.create({
    trigger: '.hero', start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { if (!intro.isActive()) { if (self.isActive) model.light.play(); else model.light.pause(); } },
  });

  // Subtle depth: the model responds gently to the pointer (fine pointers only).
  const fine = window.matchMedia('(pointer: fine)').matches;
  const look = { x: 0, y: 0 };
  const toX = gsap.quickTo(look, 'x', { duration: 1.6, ease: 'power3.out', onUpdate: () => model.setLook(look.x, look.y) });
  const toY = gsap.quickTo(look, 'y', { duration: 1.6, ease: 'power3.out' });
  const onMove = (e: PointerEvent) => {
    toX((e.clientX / window.innerWidth - 0.5) * 2);
    toY((e.clientY / window.innerHeight - 0.5) * -1);
  };
  if (fine) window.addEventListener('pointermove', onMove, { passive: true });

  cleanups.push(() => {
    window.removeEventListener('pointermove', onMove);
    st.kill();
    intro.kill();
    model.dispose();
    showHeroFallback();
  });
}

export function initMotion() {
  clearTimeout((window as any).__motionFallback);
  root.classList.add('motion');

  const cleanups: (() => void)[] = [];
  const restores: (() => void)[] = [];

  // ---- Smooth scrolling, driven by the GSAP ticker so ScrollTrigger stays in step ----
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  (window as any).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (t: number) => lenis.raf(t * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  cleanups.push(() => { gsap.ticker.remove(raf); lenis.destroy(); (window as any).__lenis = undefined; });

  let ready!: Promise<void>;

  const ctx = gsap.context(() => {
    ready = runLoader();
    if (root.classList.contains('intro')) lenis.stop();
    ready.then(() => lenis.start());

    // ---- Hero copy reads first (after the curtain, on a first visit) ----
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
      .to('[data-hero-line]', { y: 0, duration: 1.3, stagger: 0.12 }, 0.1)
      .to('[data-hero-fade]', { opacity: 1, duration: 1, stagger: 0.08, ease: 'power2.out' }, 0.55);
    ready.then(() => heroTl.play());

    // ---- Intro statement: words light up as you read down ----
    const words = gsap.utils.toArray<HTMLElement>('[data-words] .word');
    if (words.length) {
      gsap.to(words, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: '[data-words]', start: 'top 82%', end: 'bottom 50%', scrub: true },
      });
    }

    // ---- Marquee: drifts on its own, speeds up and follows scroll direction ----
    const track = document.querySelector<HTMLElement>('[data-marquee-track]');
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, duration: 42, ease: 'none', repeat: -1 });
      loop.totalTime(loop.duration() * 100); // room to run backwards
      let dir = 1;
      ScrollTrigger.create({
        trigger: '[data-marquee]', start: 'top bottom', end: 'bottom top',
        onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
        onUpdate: (self) => {
          dir = self.direction;
          const boost = Math.min(Math.abs(self.getVelocity()) / 250, 6);
          gsap.timeline({ overwrite: true })
            .to(loop, { timeScale: dir * (1 + boost), duration: 0.2 })
            .to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out' });
        },
      });
    }

    // ---- Footer: the big wordmark rises into place as the page ends ----
    gsap.fromTo('[data-footer-mark] .wm-logo', { yPercent: 55 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });

    gsap.to('.hero-content', {
      yPercent: -12, opacity: 0.2, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-stage', {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // ---- Headings, line by line ----
    document.querySelectorAll<HTMLElement>('.h2[data-split]').forEach((h) => {
      const restore = splitLines(h);
      restores.push(restore);
      gsap.set(h, { opacity: 1 });
      gsap.from(h.querySelectorAll('.split-inner'), {
        yPercent: 108, duration: 1.2, stagger: 0.09, ease: 'power4.out',
        scrollTrigger: { trigger: h, start: 'top 86%', once: true },
        onComplete: restore,
      });
    });

    // ---- Gentle fade-ups ----
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, stagger: 0.07, ease: 'power3.out', overwrite: true }),
    });

    // ---- Heritage: the figure rises out of a mask, then a brushed sheen travels ----
    gsap.fromTo('[data-figure]', { opacity: 1, clipPath: 'inset(100% 0% 0% 0%)', yPercent: 12 }, {
      clipPath: 'inset(0% 0% 0% 0%)', yPercent: 0, duration: 1.6, ease: 'power4.out',
      scrollTrigger: { trigger: '.heritage', start: 'top 72%', once: true },
    });
    gsap.fromTo('[data-figure]', { backgroundPosition: '100% 0' }, {
      backgroundPosition: '0% 0', ease: 'none',
      scrollTrigger: { trigger: '.heritage', start: 'top bottom', end: 'bottom top', scrub: true },
    });

    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 861px)', narrow: '(max-width: 860px)' }, (c) => {
      const wide = !!c.conditions?.wide;
      // ---- Story timeline: the line grows from the first store to today ----
      gsap.fromTo('[data-chapters-fill]', { [wide ? 'scaleX' : 'scaleY']: 0 }, {
        [wide ? 'scaleX' : 'scaleY']: 1, ease: 'none',
        scrollTrigger: { trigger: '[data-chapters]', start: 'top 85%', end: 'bottom 60%', scrub: 0.6 },
      });
      // ---- Threshold: the future opens out of the heritage story ----
      const inset = wide ? 'inset(0% 6% 0% 6% round 28px)' : 'inset(0% 3% 0% 3% round 18px)';
      gsap.fromTo('[data-threshold]', { clipPath: inset }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power1.inOut',
        scrollTrigger: { trigger: '[data-threshold]', start: 'top 95%', end: 'top 20%', scrub: 0.5 },
      });
    });

    // ---- Approach: pin the section and run the principles sideways (wide, tall-enough screens) ----
    mm.add('(min-width: 1021px) and (min-height: 640px)', () => {
      const sec = document.querySelector<HTMLElement>('[data-hscroll]');
      const rail = sec?.querySelector<HTMLElement>('[data-htrack]');
      if (!sec || !rail) return;
      const cards = rail.querySelectorAll<HTMLElement>('.principle');
      const count = sec.querySelector<HTMLElement>('[data-hcount]');
      const bar = sec.querySelector<HTMLElement>('[data-hprogress]');
      sec.classList.add('is-pinned');
      const dist = () => {
        const last = cards[cards.length - 1];
        const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
        return Math.max(0, last.offsetLeft + last.offsetWidth + pad - rail.clientWidth);
      };
      gsap.to(rail, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: sec, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (count) count.textContent = String(Math.min(cards.length, Math.round(self.progress * (cards.length - 1)) + 1)).padStart(2, '0');
            if (bar) bar.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
      return () => sec.classList.remove('is-pinned');
    });

    // ---- Model stills: masks open, image settles, gentle parallax ----
    gsap.utils.toArray<HTMLElement>('[data-visual]').forEach((v) => {
      const frame = v.querySelector('.visual-frame');
      const img = v.querySelector('[data-visual-img]');
      gsap.fromTo(frame, { clipPath: 'inset(14% 10% 14% 10% round 6px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 6px)', duration: 1.6, ease: 'power4.inOut',
        scrollTrigger: { trigger: v, start: 'top 85%', once: true },
      });
      gsap.fromTo(img, { scale: 1.22 }, {
        scale: 1.06, duration: 1.8, ease: 'power3.out',
        scrollTrigger: { trigger: v, start: 'top 85%', once: true },
      });
      gsap.fromTo(img, { yPercent: -3 }, {
        yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: v, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // ---- Architectural drawings draw themselves, faint lines first ----
    document.querySelectorAll<SVGSVGElement>('svg[data-draw]').forEach((svg) => {
      const strokes = Array.from(svg.querySelectorAll<SVGGeometryElement>('path, rect, circle, line, polygon'))
        .filter((el) => !el.closest('.no-draw'));
      const extras = svg.querySelectorAll('.no-draw');
      strokes.forEach((el) => { el.setAttribute('pathLength', '1'); el.style.strokeDasharray = '1'; el.style.strokeDashoffset = '1'; });
      const fills = strokes.map((el) => el.style.fillOpacity);
      gsap.set(extras, { opacity: 0 });
      gsap.set(strokes, { fillOpacity: 0 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: svg, start: 'top 82%', once: true },
        onComplete: () => strokes.forEach((el, i) => {
          el.removeAttribute('pathLength'); el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; el.style.fillOpacity = fills[i];
        }),
      });
      tl.to(strokes, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: { amount: 1.4 } }, 0)
        .to(strokes, { fillOpacity: 1, duration: 0.8 }, 1.6)
        .to(extras, { opacity: 1, duration: 0.8, stagger: 0.08 }, 1.8);
      cleanups.push(() => strokes.forEach((el) => {
        el.removeAttribute('pathLength'); el.style.strokeDasharray = ''; el.style.strokeDashoffset = '';
      }));
    });
  });

  initHeroModel(cleanups, ready);

  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const teardown = () => {
    restores.forEach((r) => r());
    cleanups.forEach((c) => c());
    ctx.revert();
    root.classList.remove('motion', 'intro');
    rm.removeEventListener('change', onRM);
    window.removeEventListener('pagehide', onHide);
  };
  const onRM = (e: MediaQueryListEvent) => { if (e.matches) teardown(); };
  const onHide = (e: PageTransitionEvent) => { if (!e.persisted) teardown(); };
  rm.addEventListener('change', onRM);
  window.addEventListener('pagehide', onHide);

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
