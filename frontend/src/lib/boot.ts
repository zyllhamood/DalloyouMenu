import type { QueryClient } from '@tanstack/react-query';

import { primeLooks } from '../hooks/useLooks';
import type { MenuData } from './api';
import { DESIGNS_QUERY_KEY, type DesignsData } from './designs';
import { MENU_QUERY_KEY } from './menu';
import type { BackdropLook } from './studio';

/**
 * What a prerendered page carries for the app that takes over from it: the
 * menu it was built with (so the first render matches the HTML — no loading
 * skeletons — and is refreshed from the API straight after), and the hero's
 * photo looks read at build time.
 */
export interface BootData {
  menu: MenuData;
  /** When the menu was fetched (ms) — older than the query's staleTime, so it refetches on load. */
  menuAt: number;
  looks: Record<string, BackdropLook>;
  /** The custom designs (the iPad gallery), when the build could fetch them. */
  designs?: DesignsData | null;
}

declare global {
  interface Window {
    __DALLOYOU__?: BootData;
  }
}

export function seedFromBoot(queryClient: QueryClient, boot: BootData | undefined) {
  if (!boot) return;
  queryClient.setQueryData(MENU_QUERY_KEY, boot.menu, { updatedAt: boot.menuAt });
  if (boot.designs) queryClient.setQueryData(DESIGNS_QUERY_KEY, boot.designs, { updatedAt: boot.menuAt });
  primeLooks(boot.looks);
}
