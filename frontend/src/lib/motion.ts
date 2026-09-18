/** Shared easing curves (cubic-bezier control points) for framer-motion. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

/** Height of the fixed navbar (mirrors --dy-nav-h in global.css). */
export function navHeight(): number {
  if (typeof window === 'undefined') return 64;
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dy-nav-h'));
  return Number.isFinite(value) ? value : 64;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scrolls the window so `element` sits `offset` px below the top edge. */
export function scrollToElement(element: Element, offset: number, smooth = true) {
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' });
}
