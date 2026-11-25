import { useEffect, useState } from 'react';

import type { Product } from '../lib/api';
import { productImageSource } from '../lib/images';
import {
  analyseBackdrop,
  BACKDROP_SAMPLE,
  BACKDROP_SOURCE_WIDTH,
  colourDistance,
  type BackdropLook,
  type RGB,
} from '../lib/studio';

/*
 * Each hero photo's "look" (see lib/studio.ts): read in the browser from a
 * small thumbnail, or handed over already read by the prerendered page
 * (primeLooks), in which case the hero renders complete on its first frame.
 */

export type { RGB };

export type Studio = Extract<BackdropLook, { kind: 'studio' }> & { product: Product };
export type Look = Studio | { kind: 'cutout' | 'framed'; product: Product };

const TIMEOUT_MS = 2600;

/** Looks already known — read earlier, or primed by a prerendered page. */
const known = new Map<number, BackdropLook>();
/** Readings in flight, shared between components. */
const pending = new Map<number, Promise<BackdropLook>>();

const withProduct = (product: Product, look: BackdropLook): Look => ({ ...look, product }) as Look;

/** Seeds the looks a prerendered page computed at build time. */
export function primeLooks(looks: Record<string, BackdropLook> | undefined) {
  if (!looks) return;
  Object.entries(looks).forEach(([id, look]) => known.set(Number(id), look));
}

/** The thumbnail a product's backdrop is read from. */
export function backdropSource(product: Product): string | null {
  return productImageSource(product, 'display', { widths: [BACKDROP_SOURCE_WIDTH], width: BACKDROP_SOURCE_WIDTH })?.src ?? null;
}

function read(product: Product): Promise<BackdropLook> {
  const ready = known.get(product.id);
  if (ready) return Promise.resolve(ready);
  const inFlight = pending.get(product.id);
  if (inFlight) return inFlight;

  const framed: BackdropLook = { kind: 'framed' };
  const src = backdropSource(product);
  const promise: Promise<BackdropLook> = !src
    ? Promise.resolve(framed)
    : new Promise((resolve) => {
        const img = new Image();
        const timer = window.setTimeout(() => resolve(framed), TIMEOUT_MS);
        const done = (look: BackdropLook) => {
          window.clearTimeout(timer);
          known.set(product.id, look);
          resolve(look);
        };
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = BACKDROP_SAMPLE;
            canvas.height = BACKDROP_SAMPLE;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return done(framed);
            ctx.drawImage(img, 0, 0, BACKDROP_SAMPLE, BACKDROP_SAMPLE);
            done(analyseBackdrop(ctx.getImageData(0, 0, BACKDROP_SAMPLE, BACKDROP_SAMPLE).data));
          } catch {
            done(framed); // a canvas tainted by an image served without CORS
          }
        };
        img.onerror = () => done(framed);
        img.src = src;
      });
  pending.set(product.id, promise);
  return promise;
}

/**
 * Picks a varied set: the first qualifying photo (by priority), then each
 * next one as far in colour as possible from those already chosen, so the
 * hero doesn't show three pinks in a row.
 */
export function pickVaried(found: Studio[], max: number): Studio[] {
  if (found.length <= 1) return found;
  const picked: Studio[] = [found[0]];
  const rest = found.slice(1);
  while (picked.length < max && rest.length) {
    let best = 0;
    let bestScore = -1;
    rest.forEach((s, i) => {
      const score = Math.min(...picked.map((p) => colourDistance(p.wall, s.wall)));
      if (score > bestScore + 6) {
        best = i;
        bestScore = score;
      }
    });
    picked.push(rest.splice(best, 1)[0]);
  }
  return picked;
}

const knownLooks = (candidates: Product[]) =>
  candidates.map((p) => {
    const look = known.get(p.id);
    return look ? withProduct(p, look) : undefined;
  });

/**
 * Returns every candidate's look in the same order. Looks already known are
 * there on the first render (so a prerendered hero matches the page that was
 * built); the rest arrive one by one as their photos are read (`undefined`
 * until then).
 */
export function useLooks(candidates: Product[]) {
  const key = candidates.map((p) => p.id).join(',');
  const [state, setState] = useState(() => ({ key, looks: knownLooks(candidates) }));

  useEffect(() => {
    if (!candidates.length) return;
    let alive = true;
    candidates.forEach((product, i) => {
      if (known.has(product.id) && state.key === key && state.looks[i]) return;
      void read(product).then((look) => {
        if (!alive) return;
        setState((prev) => {
          const looks = prev.key === key ? [...prev.looks] : knownLooks(candidates);
          looks[i] = withProduct(product, look);
          return { key, looks };
        });
      });
    });
    return () => {
      alive = false;
    };
    // `key` identifies the candidate list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const looks = state.key === key ? state.looks : knownLooks(candidates);
  const settled = candidates.length > 0 && looks.length === candidates.length && looks.every(Boolean);
  return { looks, settled };
}
