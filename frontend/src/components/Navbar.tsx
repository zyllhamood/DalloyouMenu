import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  HStack,
  Link as ChakraLink,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Logo from './Logo';
import LanguageToggle from './LanguageToggle';
import WhatsAppIcon from './WhatsAppIcon';

const NAV_LINKS = [
  { to: '/', key: 'nav.home' },
  { to: '/menu', key: 'nav.menu' },
] as const;

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <ChakraLink
      as={RouterLink}
      to={to}
      position="relative"
      fontSize="13px"
      letterSpacing="0.18em"
      textTransform="uppercase"
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

export function Navbar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      bg={scrolled ? 'rgba(250, 248, 243, 0.92)' : 'transparent'}
      backdropFilter={scrolled ? 'saturate(180%) blur(12px)' : 'none'}
      borderBottom="1px solid"
      borderColor={scrolled ? 'border.gold' : 'transparent'}
      boxShadow={scrolled ? 'soft' : 'none'}
      transition="all 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    >
      <Container maxW="1280px" px={{ base: 6, md: 10 }}>
        <Flex h={{ base: '72px', md: '88px' }} align="center" justify="space-between" gap={6}>
          <Logo />

          <HStack spacing={10} display={{ base: 'none', md: 'flex' }}>
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                label={t(l.key)}
                active={l.to === '/' ? pathname === '/' : pathname.startsWith(l.to)}
              />
            ))}
          </HStack>

          <HStack spacing={4} align="center">
            <Box display={{ base: 'none', md: 'block' }}>
              <LanguageToggle />
            </Box>
            <Box display={{ base: 'none', sm: 'block' }}>
              <WhatsAppIcon />
            </Box>
            <IconButton
              display={{ base: 'inline-flex', md: 'none' }}
              aria-label="Open menu"
              variant="ghostGold"
              icon={<MenuGlyph />}
              onClick={onOpen}
            />
          </HStack>
        </Flex>
      </Container>

      <Drawer isOpen={isOpen} onClose={onClose} placement="end" size="full">
        <DrawerOverlay />
        <DrawerContent bg="bg.canvas">
          <DrawerBody>
            <Flex h="72px" align="center" justify="space-between">
              <Logo />
              <IconButton
                aria-label="Close menu"
                variant="ghostGold"
                onClick={onClose}
                icon={
                  <Box as="svg" viewBox="0 0 24 24" w="20px" h="20px">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </Box>
                }
              />
            </Flex>
            <VStack spacing={8} align="stretch" mt={16}>
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  label={t(l.key)}
                  active={l.to === '/' ? pathname === '/' : pathname.startsWith(l.to)}
                />
              ))}
              <Box pt={8} borderTop="1px solid" borderColor="border.subtle">
                <HStack justify="space-between">
                  <LanguageToggle />
                  <WhatsAppIcon />
                </HStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}

export default Navbar;
