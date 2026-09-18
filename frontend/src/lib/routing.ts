import { useLocation, type Location } from 'react-router-dom';

/**
 * Product links open as a sheet over the current page. The page underneath
 * travels in `location.state.backgroundLocation`, so the URL is still a real,
 * shareable /product/:id — and loading it directly renders the full page.
 */
export interface ModalState {
  backgroundLocation?: Location;
}

export function useModalLinkState(): ModalState {
  const location = useLocation();
  const state = location.state as ModalState | null;
  return { backgroundLocation: state?.backgroundLocation ?? location };
}
