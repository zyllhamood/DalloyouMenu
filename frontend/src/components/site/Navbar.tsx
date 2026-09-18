import { useEffect, useState, type MouseEvent } from 'react';
import { Box, Button, Container, Flex, HStack, Link } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import BrandLockup from '../brand/BrandLockup';
import { SocialGlyph } from '../icons/SocialIcons';
import { SOCIALS } from '../../config/links';
import { useSectionTheme } from '../../hooks/useSectionTheme';
import { BRANCHES_TO, useBranchesLink } from '../../lib/useBranchesLink';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';

interface NavEntry {
  key: string;
  to: string;
  active: boolean;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Fixed, transparent over the hero; frosted glass once the page moves. It
 * reads the surface beneath it (noir or ivory) and swaps the lockup and type
 * colour to match, and it slides away while reading down.
 */
export function Navbar() {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  const theme = useSectionTheme(pathname);
  const hidden = useUiStore((s) => s.navHidden);
  const openOrder = useUiStore((s) => s.openOrder);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const onBranches = useBranchesLink();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dark = theme === 'dark';
  const onBranchesHash = pathname === '/' && hash === BRANCHES_TO.slice(1);

  const entries: NavEntry[] = [
    { key: 'nav.home', to: '/', active: pathname === '/' && !onBranchesHash },
    { key: 'nav.menu', to: '/menu', active: pathname.startsWith('/menu') || pathname.startsWith('/product') },
    { key: 'nav.branches', to: BRANCHES_TO, active: onBranchesHash, onClick: onBranches },
  ];
  if (hydrated && token) entries.push({ key: 'nav.dashboard', to: '/admin', active: false });

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      insetInline={0}
      zIndex={1200}
      transform={hidden ? 'translateY(-105%)' : 'translateY(0)'}
      transition="transform 550ms var(--dy-ease)"
    >
      <Box
        position="absolute"
        inset={0}
        bg={scrolled ? (dark ? 'rgba(14, 11, 8, 0.74)' : 'rgba(247, 243, 233, 0.82)') : 'transparent'}
        backdropFilter={scrolled ? 'saturate(160%) blur(18px)' : 'none'}
        borderBottom="1px solid"
        borderColor={scrolled ? (dark ? 'rgba(227, 183, 117, 0.12)' : 'rgba(22, 18, 14, 0.07)') : 'transparent'}
        transition="background-color 500ms, border-color 500ms"
      />

      <Container maxW="1320px" position="relative">
        <Flex h="var(--dy-nav-h)" align="center" justify="space-between" gap={6}>
          <BrandLockup tone={dark ? 'light' : 'dark'} height={{ base: '32px', md: '40px' }} />

          <HStack
            as="nav"
            aria-label={t('nav.primary')}
            spacing={{ md: 8, lg: 11 }}
            display={{ base: 'none', md: 'flex' }}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
          >
            {entries.map((entry) => (
              <Link
                key={entry.key}
                as={RouterLink}
                to={entry.to}
                onClick={entry.onClick}
                aria-current={entry.active ? 'page' : undefined}
                position="relative"
                py={2}
                fontSize="15.5px"
                fontWeight={entry.active ? 600 : 400}
                color={dark ? 'text.onDark' : 'text.primary'}
                opacity={entry.active ? 1 : 0.78}
                transition="opacity 300ms, color 300ms"
                _hover={{ opacity: 1, color: dark ? 'brand.300' : 'brand.700', textDecoration: 'none' }}
              >
                {t(entry.key)}
                {entry.active && (
                  <motion.span
                    layoutId="nav-active-dot"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: -4,
                      width: 5,
                      height: 5,
                      marginLeft: -2.5,
                      borderRadius: 999,
                      background: 'var(--dy-gold)',
                    }}
                  />
                )}
              </Link>
            ))}
          </HStack>

          <HStack spacing={{ base: 2, md: 4 }}>
            <HStack spacing={1} display={{ base: 'none', lg: 'flex' }}>
              {SOCIALS.map((social) => (
                <Link
                  key={social.key}
                  href={social.url}
                  isExternal
                  aria-label={social.label}
                  display="grid"
                  placeItems="center"
                  w="36px"
                  h="36px"
                  borderRadius="full"
                  color={dark ? 'text.onDark' : 'text.primary'}
                  opacity={0.7}
                  transition="opacity 300ms, color 300ms, background-color 300ms"
                  _hover={{ opacity: 1, color: dark ? 'brand.300' : 'brand.700', bg: dark ? 'rgba(227,183,117,0.08)' : 'rgba(194,134,62,0.08)' }}
                >
                  <SocialGlyph network={social.key} size={17} />
                </Link>
              ))}
            </HStack>
            <Button
              variant="gold"
              h={{ base: '38px', md: '44px' }}
              px={{ base: 4, md: 6 }}
              fontSize={{ base: '14px', md: '15px' }}
              onClick={openOrder}
            >
              {t('nav.order')}
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}

export default Navbar;
