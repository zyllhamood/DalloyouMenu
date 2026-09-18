import { useEffect, useState } from 'react';

/**
 * Returns the id of the last section whose top has scrolled past `offset`
 * (the height of the sticky chrome). While `paused` — e.g. during the smooth
 * scroll that follows a tab click — the reported id is left alone so the
 * tabs don't flicker through every section in between.
 */
export function useScrollSpy(ids: string[], offset: number, paused = false): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('|');

  useEffect(() => {
    if (paused) return;
    const list = key ? key.split('|') : [];
    let frame = 0;

    const check = () => {
      frame = 0;
      let current = list[0] ?? null;
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 2) current = id;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom && list.length) current = list[list.length - 1];
      setActive(current);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };

    check();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key, offset, paused]);

  return active;
}
