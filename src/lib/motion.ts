// Site-wide GSAP motion: scroll-reveal for category sections and a subtle
// lift on resource-row hover. Ported from the Astro site's
// src/scripts/motion.ts. There, it re-ran on every astro:page-load (View
// Transitions swap). Here there's no full-document swap — React Router just
// re-renders — so callers re-run it from a useEffect keyed on
// location.pathname AND on data finishing loading (skeletons have no
// data-reveal/resource-row classes, so running too early is a no-op; the
// route calls this again once real content is in the DOM).
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

export function runMotion() {
  initReveal();
  initRowHover();
}
