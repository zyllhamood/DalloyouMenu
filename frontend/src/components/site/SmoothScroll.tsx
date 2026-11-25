import { useEffect, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

const DIALOG = '.chakra-modal__content-container, [role="dialog"]';

/**
 * Lenis pauses while any Chakra dialog (the product sheet, the order sheet)
 * is open, so the wheel scrolls the dialog and never the page beneath it.
 */
function DialogGuard() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (document.querySelector(DIALOG)) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(() => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    sync();
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [lenis]);

  return null;
}

/**
 * Inertial wheel scrolling for the home page only (Lenis wraps native
 * scroll, so position: sticky, scroll-linked motion and touch scrolling stay
 * native). Skipped entirely for visitors who prefer reduced motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.11,
        smoothWheel: true,
        anchors: true,
        // Anything inside a dialog scrolls natively.
        prevent: (node) => Boolean(node.closest?.(DIALOG)),
      }}
    >
      <DialogGuard />
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
