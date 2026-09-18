import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Footer from '../components/site/Footer';
import IntroCurtain from '../components/site/IntroCurtain';
import MobileDock from '../components/site/MobileDock';
import Navbar from '../components/site/Navbar';
import OrderSheet from '../components/site/OrderSheet';
import { useDirection } from '../hooks/useDirection';
import { useScrollChrome } from '../hooks/useScrollChrome';
import { EASE_IN, EASE_OUT, navHeight, scrollToElement } from '../lib/motion';
import { useUiStore } from '../stores/uiStore';

/** Scroll positions by history entry, so Back returns to where you were. */
const scrollMemory = new Map<string, number>();

function useRememberScroll(key: string) {
  useEffect(() => {
    let frame = 0;
    const save = () => {
      frame = 0;
      scrollMemory.set(key, window.scrollY);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(save);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);
}

interface PageProps {
  children: ReactNode;
  entryKey: string;
  hash: string;
  restore: boolean;
}

/**
 * One page in the transition. It positions the scroll before its first paint
 * — the hash target, the remembered spot on Back, or the top — so the new
 * page never flashes at the old page's scroll offset.
 */
function Page({ children, entryKey, hash, restore }: PageProps) {
  const reduce = useReducedMotion();
  const setNavHidden = useUiStore((s) => s.setNavHidden);

  useLayoutEffect(() => {
    setNavHidden(false);
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        scrollToElement(target, navHeight() + 8, false);
        return;
      }
    }
    window.scrollTo(0, restore ? scrollMemory.get(entryKey) ?? 0 : 0);
    // Runs once per page mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE_IN } }}
    >
      {children}
    </motion.div>
  );
}

export function PublicLayout() {
  const { t } = useTranslation();
  useDirection();
  useScrollChrome();

  const location = useLocation();
  const navigationType = useNavigationType();
  const outlet = useOutlet();
  useRememberScroll(location.key);

  // /menu and /menu/:category are one page; don't cross-fade between them.
  const pageKey = location.pathname.startsWith('/menu') ? '/menu' : location.pathname;

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="bg.canvas">
      <Box
        as="a"
        href="#main"
        position="fixed"
        top={3}
        insetInlineStart={3}
        zIndex={4000}
        px={4}
        py={2}
        borderRadius="full"
        bg="noir.800"
        color="brand.100"
        fontSize="14px"
        transform="translateY(-200%)"
        _focusVisible={{ transform: 'translateY(0)' }}
      >
        {t('a11y.skipToContent')}
      </Box>

      <Navbar />

      <Box as="main" id="main" flex={1} tabIndex={-1} _focus={{ outline: 'none' }}>
        <AnimatePresence mode="wait" initial={false}>
          <Page key={pageKey} entryKey={location.key} hash={location.hash} restore={navigationType === 'POP'}>
            {outlet}
          </Page>
        </AnimatePresence>
      </Box>

      <Footer />
      <MobileDock />
      <OrderSheet />
      <IntroCurtain />
    </Box>
  );
}

export default PublicLayout;
