import { useQuery } from '@tanstack/react-query';

import { createWhatsAppUrl } from '../config/links';
import { api } from './api';
import { thumbnailUrl } from './images';

/*
 * Custom designs — cakes made to order. They are the in-store tablets'
 * «تصميمات خاصة» gallery: managed from the iPad admin (its title, its photos,
 * their order, and whether it is shown at all), so the website and the
 * tablets always show the same work. Orders come in on WhatsApp.
 */

export interface Design {
  /** The photo's file name without extension — stable, and readable in links. */
  id: string;
  /** Storage path, served resized by the API's image endpoint. */
  path: string;
}

export interface DesignsData {
  /** The gallery's own title from the admin ('' when not set). */
  title: string;
  designs: Design[];
}

export const DESIGNS_QUERY_KEY = ['designs'] as const;

const designId = (path: string) => (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '');

export async function fetchDesigns(): Promise<DesignsData> {
  const { data } = await api.get<{ gallery?: { name?: string; images?: string[] } }>('/ipad/menu/');
  const images = data.gallery?.images ?? [];
  return {
    title: data.gallery?.name?.trim() ?? '',
    designs: images.map((path) => ({ id: designId(path), path })),
  };
}

export function useDesigns() {
  return useQuery<DesignsData>({
    queryKey: DESIGNS_QUERY_KEY,
    queryFn: fetchDesigns,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}

/** Widths the API's image endpoint serves (it snaps to these). */
const WIDTHS = [320, 480, 640, 960, 1280, 1600];

export const designImage = (design: Design, width: number) => thumbnailUrl(design.path, width) ?? '';
export const designSrcSet = (design: Design) => WIDTHS.map((w) => `${designImage(design, w)} ${w}w`).join(', ');

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** WhatsApp with the message written: a custom design to order. */
export function designIdeaUrl(t: Translate): string {
  return createWhatsAppUrl(t('designs.ideaMessage'));
}
