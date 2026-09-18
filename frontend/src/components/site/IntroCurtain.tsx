import { useEffect, useState } from 'react';
import { Box, Stack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Monogram from '../brand/Monogram';
import { EASE_IN, EASE_IN_OUT, EASE_OUT } from '../../lib/motion';
import { INTRO_STORAGE_KEY, useUiStore } from '../../stores/uiStore';

const HOLD_MS = 1650;

/**
 * First visit only: the gold monogram surfaces on noir, a hairline fills,
 * and the curtain lifts onto the hero — whose own entrance starts as the
 * curtain begins to rise. Any tap or key skips it.
 */
export function IntroCurtain() {
  const { t } = useTranslation();
  const introActive = useUiStore((s) => s.introActive);
  const setIntroActive = useUiStore((s) => s.setIntroActive);
  const [phase, setPhase] = useState<'hold' | 'lift' | 'done'>(introActive ? 'hold' : 'done');

  useEffect(() => {
    if (phase !== 'hold') return;
    const root = document.documentElement;
    root.style.overflow = 'hidden';

    const lift = () => {
      setPhase('lift');
      setIntroActive(false);
      root.style.overflow = '';
      try {
        window.sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
      } catch {
        // private mode — it will simply play again next time
      }
    };

    const timer = window.setTimeout(lift, HOLD_MS);
    window.addEventListener('pointerdown', lift, { once: true });
    window.addEventListener('keydown', lift, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', lift);
      window.removeEventListener('keydown', lift);
      root.style.overflow = '';
    };
  }, [phase, setIntroActive]);

  if (phase === 'done') return null;

  return (
    <motion.div
      role="presentation"
      aria-label={t('a11y.skipIntro')}
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={{ clipPath: phase === 'lift' ? 'inset(0% 0% 100% 0%)' : 'inset(0% 0% 0% 0%)' }}
      transition={{ duration: 1.1, ease: EASE_IN_OUT }}
      onAnimationComplete={() => {
        if (phase === 'lift') setPhase('done');
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--dy-noir)',
        cursor: 'pointer',
      }}
    >
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        sx={{ background: 'radial-gradient(40% 35% at 50% 50%, rgba(194,134,62,0.18), rgba(194,134,62,0) 70%)' }}
      />
      <motion.div
        animate={phase === 'lift' ? { y: -48, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: EASE_IN }}
      >
        <Stack align="center" spacing={8}>
          <motion.div
            initial={{ opacity: 0, scale: 0.86, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: EASE_OUT }}
          >
            <Monogram large sheen w={{ base: '78px', md: '96px' }} h={{ base: '78px', md: '96px' }} />
          </motion.div>
          <Box w="132px" h="1px" bg="rgba(227, 183, 117, 0.16)" overflow="hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: HOLD_MS / 1000, ease: EASE_IN_OUT }}
              style={{ height: '100%', background: 'var(--dy-gold)', transformOrigin: 'right' }}
            />
          </Box>
        </Stack>
      </motion.div>
    </motion.div>
  );
}

export default IntroCurtain;
