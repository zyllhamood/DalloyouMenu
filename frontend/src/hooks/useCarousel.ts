import { useCallback, useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 4000;

export interface UseCarouselReturn {
  currentIndex: number;
  goNext: () => void;
  goPrev: () => void;
  goTo: (index: number) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
}

interface UseCarouselOptions {
  length: number;
  /** Auto-advance interval in ms (default 4000) */
  interval?: number;
}

export function useCarousel({
  length,
  interval = DEFAULT_INTERVAL_MS,
}: UseCarouselOptions): UseCarouselReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Clamp index if the slide list shrinks
  useEffect(() => {
    if (length === 0) return;
    setCurrentIndex((i) => (i >= length ? 0 : i));
  }, [length]);

  // Auto-rotate — timeout resets naturally on every currentIndex change
  useEffect(() => {
    if (length <= 1) return;
    if (isPaused) return;
    const id = window.setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % length);
    }, interval);
    return () => window.clearTimeout(id);
  }, [currentIndex, isPaused, length, interval]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % length);
  }, [length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + length) % length);
  }, [length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  return { currentIndex, goNext, goPrev, goTo, isPaused, setIsPaused };
}
