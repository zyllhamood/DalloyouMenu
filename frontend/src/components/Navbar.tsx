import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  Link as ChakraLink,
  IconButton,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import BrandLogo from './BrandLogo';
import WhatsAppIcon from './WhatsAppIcon';
import { InstagramGlyph, SnapchatGlyph, TikTokGlyph } from './icons/SocialIcons';
import { INSTAGRAM_URL, SNAPCHAT_URL, TIKTOK_URL } from '../config/links';
import { useAuthStore } from '../stores/authStore';

// NAVBAR_LOGO_HEIGHT — adjust these two values to resize the brand logo
// across the whole site. Height only; width scales automatically.
const NAVBAR_LOGO_HEIGHT_DESKTOP = '40px';
const NAVBAR_LOGO_HEIGHT_MOBILE = '34px';

/** Homepage anchor target for the branches section. */
const BRANCHES_HASH = '#branches';
const BRANCHES_TO = `/${BRANCHES_HASH}`;

const PUBLIC_NAV_LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/menu', key: 'nav.menu' },
  { to: BRANCHES_TO, key: 'nav.branches', anchor: true },
] as const;

function NavLink({
  to,
  label,
  active,
  onClick,
}: {
  to: string;
  label: string;
  active: boolean;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      /* The row is pinned LTR; dir="auto" lets each label resolve its own
         direction from its first strong character, so Arabic still shapes RTL. */
      dir="auto"
      position="relative"
      fontSize="16px"
      letterSpacing="0"
      textTransform="none"
      whiteSpace="nowrap"
      color={active ? 'accent.goldDeep' : 'text.primary'}
      fontWeight={active ? 500 : 400}
      _hover={{ color: 'accent.goldDeep', textDecoration: 'none' }}
      transition="color 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      onClick={onClick}
      sx={{
        '&::after': {
          content: '""',
          position: 'absolute',
          insetInlineStart: 0,
          bottom: '-6px',
          height: '1px',
          width: active ? '100%' : '0%',
          bg: 'accent.gold',
          transition: 'width 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        },
        '&:hover::after': { width: '100%' },
      }}
    >
      {label}
    </ChakraLink>
  );
}

function MenuGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" aria-hidden>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Box>
  );
}

function CloseGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Box>
  );
}

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <ChakraLink
      href={href}
      isExternal
      aria-label={label}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="36px"
      h="36px"
      borderRadius="full"
      border="1px solid"
      borderColor="border.gold"
      color="accent.goldDeep"
      transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      _hover={{
        bg: 'accent.gold',
        color: 'warm.black',
        textDecoration: 'none',
        transform: 'translateY(-2px)',
      }}
    >
      {children}
    </ChakraLink>
  );
}

function SocialLinks() {
  return (
    <HStack spacing={2}>
      <WhatsAppIcon />
      <SocialIconLink href={INSTAGRAM_URL} label="Instagram">
        <InstagramGlyph size={18} />
      </SocialIconLink>
      <SocialIconLink href={TIKTOK_URL} label="TikTok">
        <TikTokGlyph size={18} />
      </SocialIconLink>
      <SocialIconLink href={SNAPCHAT_URL} label="Snapchat">
        <SnapchatGlyph size={18} />
      </SocialIconLink>
    </HStack>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, hash } = location;
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = hydrated && token
    ? [...PUBLIC_NAV_LINKS, { to: '/admin', key: 'nav.dashboard' }]
    : PUBLIC_NAV_LINKS;

  const isActive = (to: string) => {
    if (to === BRANCHES_TO) return pathname === '/' && hash === BRANCHES_HASH;
    return to === '/' ? pathname === '/' && hash !== BRANCHES_HASH : pathname.startsWith(to);
  };

  const scrollToBranches = useCallback(() => {
    document.getElementById('branches')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** Smooth-scrolls when already on the homepage; navigates + scrolls otherwise. */
  const handleBranchesClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMobileMenuOpen(false);

    if (pathname === '/') {
      if (hash !== BRANCHES_HASH) navigate(BRANCHES_TO);
      window.requestAnimationFrame(scrollToBranches);
      return;
    }

    navigate(BRANCHES_TO);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    if (pathname !== '/' || hash !== BRANCHES_HASH) return;
    const frame = window.requestAnimationFrame(scrollToBranches);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash, scrollToBranches]);

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      bg={scrolled || mobileMenuOpen ? 'rgba(250, 248, 243, 0.94)' : 'transparent'}
      backdropFilter={scrolled || mobileMenuOpen ? 'saturate(180%) blur(12px)' : 'none'}
      borderBottom="1px solid"
      borderColor={scrolled || mobileMenuOpen ? 'border.gold' : 'transparent'}
      boxShadow={scrolled || mobileMenuOpen ? 'soft' : 'none'}
      transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    >
      <Container maxW="1280px" px={{ base: 6, md: 10 }}>
        {/*
          * The top bar is direction-pinned to LTR so the brand lockup always
          * sits at the visual left and the links/socials at the visual right,
          * in Arabic as well as English. Only this row is pinned — the mobile
          * dropdown below keeps the document direction so Arabic menu items
          * still align to the right. Each label carries dir="auto" so its own
          * text still shapes right-to-left.
          */}
        <Flex
          dir="ltr"
          h={{ base: '72px', md: '88px' }}
          align="center"
          justify="space-between"
          gap={6}
        >
          <BrandLogo
            height={{ base: NAVBAR_LOGO_HEIGHT_MOBILE, md: NAVBAR_LOGO_HEIGHT_DESKTOP }}
          />

          <HStack spacing={{ md: 8, lg: 10 }} align="center">
            <HStack spacing={{ md: 8, lg: 10 }} display={{ base: 'none', md: 'flex' }}>
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  label={t(l.key)}
                  active={isActive(l.to)}
                  onClick={'anchor' in l && l.anchor ? handleBranchesClick : undefined}
                />
              ))}
            </HStack>

            <Box display={{ base: 'none', sm: 'block' }}>
              <SocialLinks />
            </Box>

            <IconButton
              display={{ base: 'inline-flex', md: 'none' }}
              aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              variant="ghostGold"
              icon={mobileMenuOpen ? <CloseGlyph /> : <MenuGlyph />}
              onClick={() => setMobileMenuOpen((open) => !open)}
            />
          </HStack>
        </Flex>
      </Container>

      <Box
        display={{ base: 'block', md: 'none' }}
        position="absolute"
        top="100%"
        insetInline={0}
        bg="rgba(250, 248, 243, 0.98)"
        backdropFilter="saturate(180%) blur(14px)"
        borderBottom="1px solid"
        borderColor="border.gold"
        boxShadow="soft"
        aria-hidden={!mobileMenuOpen}
        opacity={mobileMenuOpen ? 1 : 0}
        visibility={mobileMenuOpen ? 'visible' : 'hidden'}
        transform={mobileMenuOpen ? 'translateY(0)' : 'translateY(-10px)'}
        pointerEvents={mobileMenuOpen ? 'auto' : 'none'}
        transformOrigin="top"
        transition="opacity 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), visibility 300ms"
      >
        <Container maxW="1280px" px={{ base: 6, md: 10 }} py={6}>
          <VStack as="nav" spacing={0} align="stretch">
            {navLinks.map((l) => {
              const active = isActive(l.to);
              const isAnchor = 'anchor' in l && l.anchor;
              return (
                <ChakraLink
                  key={l.to}
                  as={RouterLink}
                  to={l.to}
                  py={4}
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                  fontSize="18px"
                  fontWeight={active ? 600 : 500}
                  color={active ? 'accent.goldDeep' : 'text.primary'}
                  _hover={{ color: 'accent.goldDeep', textDecoration: 'none' }}
                  onClick={isAnchor ? handleBranchesClick : () => setMobileMenuOpen(false)}
                >
                  {t(l.key)}
                </ChakraLink>
              );
            })}
          </VStack>
          <HStack justify="space-between" pt={5}>
            <SocialLinks />
          </HStack>
        </Container>
      </Box>
    </Box>
  );
}

export default Navbar;
