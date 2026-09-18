import { useSyncExternalStore, type MouseEvent } from 'react';
import { Box, Button, HStack } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, House, MapPin, type LucideIcon } from 'lucide-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BRANCHES_TO, useBranchesLink } from '../../lib/useBranchesLink';
import { useUiStore } from '../../stores/uiStore';

const MotionLink = motion.create(RouterLink);

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

/** Past roughly half the first screen — i.e. beyond the homepage hero's own buttons. */
const isPastFold = () => window.scrollY > window.innerHeight * 0.55;

interface DockEntry {
  key: string;
  to: string;
  icon: LucideIcon;
  active: boolean;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Phone navigation, within thumb's reach: a floating glass pill with the
 * three destinations and the order button. The active item unfolds its
 * label. It waits out the homepage hero (which has its own calls to action)
 * and product pages (which carry their own order bar).
 */
export function MobileDock() {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  const openOrder = useUiStore((s) => s.openOrder);
  const introActive = useUiStore((s) => s.introActive);
  const onBranches = useBranchesLink();
  const pastFold = useSyncExternalStore(subscribeToScroll, isPastFold, () => false);
  const pastHero = pathname !== '/' || pastFold;

  const onBranchesHash = pathname === '/' && hash === BRANCHES_TO.slice(1);
  const entries: DockEntry[] = [
    { key: 'nav.home', to: '/', icon: House, active: pathname === '/' && !onBranchesHash },
    { key: 'nav.menu', to: '/menu', icon: BookOpen, active: pathname.startsWith('/menu') },
    { key: 'nav.branches', to: BRANCHES_TO, icon: MapPin, active: onBranchesHash, onClick: onBranches },
  ];

  const visible = pastHero && !introActive && !pathname.startsWith('/product');

  return (
    <Box
      position="fixed"
      left="50%"
      bottom="calc(14px + env(safe-area-inset-bottom))"
      zIndex={1150}
      display={{ base: 'block', md: 'none' }}
      transform={`translateX(-50%) translateY(${visible ? '0' : '170%'})`}
      transition="transform 650ms var(--dy-ease)"
      pointerEvents={visible ? 'auto' : 'none'}
      aria-hidden={!visible}
    >
      <HStack
        as="nav"
        aria-label={t('nav.quick')}
        spacing={1}
        p="6px"
        borderRadius="full"
        bg="rgba(14, 11, 8, 0.86)"
        backdropFilter="blur(20px) saturate(160%)"
        border="1px solid rgba(227, 183, 117, 0.16)"
        boxShadow="0 22px 44px -18px rgba(14, 11, 8, 0.75)"
      >
        {entries.map(({ key, to, icon: Icon, active, onClick }) => (
          <MotionLink
            key={key}
            to={to}
            onClick={onClick}
            layout
            aria-label={t(key)}
            aria-current={active ? 'page' : undefined}
            tabIndex={visible ? 0 : -1}
            transition={{ type: 'spring', stiffness: 520, damping: 40 }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 44,
              paddingInline: active ? 16 : 13,
              borderRadius: 999,
              color: active ? 'var(--dy-gold-pale)' : 'rgba(244, 238, 227, 0.72)',
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {active && (
              <motion.span
                layoutId="dock-active"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 999,
                  background: 'rgba(227, 183, 117, 0.14)',
                  border: '1px solid rgba(227, 183, 117, 0.22)',
                }}
              />
            )}
            <Icon size={19} strokeWidth={1.7} style={{ position: 'relative' }} />
            <AnimatePresence initial={false}>
              {active && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  {t(key)}
                </motion.span>
              )}
            </AnimatePresence>
          </MotionLink>
        ))}
        <Button variant="gold" h="44px" px={5} fontSize="14.5px" onClick={openOrder} tabIndex={visible ? 0 : -1}>
          {t('nav.orderShort')}
        </Button>
      </HStack>
    </Box>
  );
}

export default MobileDock;
