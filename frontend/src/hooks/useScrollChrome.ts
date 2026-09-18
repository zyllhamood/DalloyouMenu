import { useEffect } from 'react';

import { useUiStore } from '../stores/uiStore';

/**
 * Hides the fixed navbar while the visitor reads downwards and brings it
 * back as soon as they scroll up — the header never costs reading space,
 * but is one flick away.
 */
export function useScrollChrome() {
  const setNavHidden = useUiStore((s) => s.setNavHidden);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      if (y < 140) {
        setNavHidden(false);
        lastY = y;
        return;
      }
      if (Math.abs(delta) < 8) return;
      setNavHidden(delta > 0);
      lastY = y;
    };

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [setNavHidden]);
}
