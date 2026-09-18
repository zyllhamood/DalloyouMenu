import { useEffect, useState } from 'react';

import { navHeight } from '../lib/motion';

export type SectionTheme = 'dark' | 'light';

/**
 * Which surface is currently under the navbar. Sections declare themselves
 * with `data-nav-theme="dark" | "light"`; the innermost one straddling the
 * navbar's midline wins. The navbar uses this to swap between the ivory and
 * gold-on-noir treatments as the page scrolls.
 */
export function useSectionTheme(routeKey: string): SectionTheme {
  const [theme, setTheme] = useState<SectionTheme>('light');

  useEffect(() => {
    let frame = 0;

    const check = () => {
      frame = 0;
      const probe = navHeight() / 2;
      let next: SectionTheme = 'light';
      document.querySelectorAll<HTMLElement>('[data-nav-theme]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) {
          next = el.dataset.navTheme === 'dark' ? 'dark' : 'light';
        }
      });
      setTheme(next);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };

    check();
    // Page content mounts after route transitions and data loads; re-check.
    const timers = [80, 400, 900].map((ms) => window.setTimeout(check, ms));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [routeKey]);

  return theme;
}
