// Site-wide GSAP motion: scroll-reveal for category sections and a subtle
// lift on resource-row hover. Runs on every page (imported from Base.astro)
// and re-runs after each Astro View Transitions navigation, since those
// swap the DOM without a full reload.
import gsap from 'gsap';

function initReveal() {
  const sections = document.querySelectorAll<HTMLElement>('[data-reveal]');
  sections.forEach((el, i) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, delay: Math.min(i * 0.04, 0.3), ease: 'power2.out' }
    );
  });
}

function initRowHover() {
  const rows = document.querySelectorAll<HTMLElement>('.resource-row, .emergency-row');
  rows.forEach((row) => {
    const onEnter = () => gsap.to(row, { x: 3, duration: 0.16, ease: 'power2.out' });
    const onLeave = () => gsap.to(row, { x: 0, duration: 0.16, ease: 'power2.out' });
    row.addEventListener('mouseenter', onEnter);
    row.addEventListener('mouseleave', onLeave);
  });
}

function run() {
  initReveal();
  initRowHover();
}

run();
document.addEventListener('astro:page-load', run);
