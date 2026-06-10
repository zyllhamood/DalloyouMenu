import { useEffect, useState, type ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  Link as ChakraLink,
  IconButton,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Logo from './Logo';
import WhatsAppIcon from './WhatsAppIcon';
import { useAuthStore } from '../stores/authStore';

const PUBLIC_NAV_LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/menu', key: 'nav.menu' },
] as const;

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      position="relative"
      fontSize="16px"
      letterSpacing="0"
      textTransform="none"
      color={active ? 'accent.goldDeep' : 'text.primary'}
      fontWeight={active ? 500 : 400}
      _hover={{ color: 'accent.goldDeep', textDecoration: 'none' }}
      transition="color 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
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

function InstagramGlyph() {
  return (
    <Box
      as="svg"
      width="18px"
      height="18px"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </Box>
  );
}

function TikTokGlyph() {
  return (
    <Box
      as="svg"
      width="18px"
      height="18px"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.55a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.08z" />
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
      <SocialIconLink href="https://www.instagram.com/dalloyauksa" label="Instagram">
        <InstagramGlyph />
      </SocialIconLink>
      <SocialIconLink href="https://www.tiktok.com/@dalloyauksa" label="TikTok">
        <TikTokGlyph />
      </SocialIconLink>
    </HStack>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = hydrated && token
    ? [...PUBLIC_NAV_LINKS, { to: '/admin', key: 'nav.dashboard' }]
    : PUBLIC_NAV_LINKS;

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
        <Flex h={{ base: '72px', md: '88px' }} align="center" justify="space-between" gap={6}>
          <Logo />

          <HStack spacing={10} display={{ base: 'none', md: 'flex' }}>
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} label={t(l.key)} active={isActive(l.to)} />
            ))}
          </HStack>

          <HStack spacing={4} align="center">
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
                  onClick={() => setMobileMenuOpen(false)}
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
