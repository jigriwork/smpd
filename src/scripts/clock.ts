/** Live local time in Berhampur (IST), shown in the hero and footer. */
export function initClock() {
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const tick = () => {
    const t = `${fmt.format(new Date())} IST`;
    els.forEach((el) => { el.textContent = t; });
  };
  tick();
  setInterval(tick, 15000);
}
