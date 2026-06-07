import { useState } from 'react';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight,
  ExternalLink,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Tag,
  User,
  X,
} from 'lucide-react';

import Logo from '../components/Logo';
import { useAuthStore } from '../stores/authStore';
import { useDirection } from '../hooks/useDirection';

// ─── Nav config ───────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ReactNode;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', labelKey: 'dashboard', icon: <LayoutDashboard size={16} />, end: true },
  { to: '/admin/products', labelKey: 'products', icon: <Package size={16} /> },
  { to: '/admin/categories', labelKey: 'categories', icon: <Tag size={16} /> },
  { to: '/admin/visits', labelKey: 'visits.title', icon: <Eye size={16} /> },
];

// ─── Breadcrumb ───────────────────────────────────────────────────────────

type Crumb = { label: string; to?: string };
type TFn = (key: string) => string;

/** Shared crumb resolver — used by the breadcrumb (desktop) and the
 *  page title (mobile topbar) so both stay in sync. */
function getCrumbs(path: string, t: TFn): Crumb[] {
  if (path === '/admin' || path === '/admin/') {
    return [{ label: t('dashboard') }];
  }
  if (path === '/admin/products/new') {
    return [{ label: t('products'), to: '/admin/products' }, { label: t('addProduct') }];
  }
  if (/^\/admin\/products\/\d+/.test(path)) {
    return [{ label: t('products'), to: '/admin/products' }, { label: t('edit') }];
  }
  if (path.startsWith('/admin/products')) {
    return [{ label: t('products') }];
  }
  if (path.startsWith('/admin/categories')) {
    return [{ label: t('categories') }];
  }
  if (path.startsWith('/admin/visits')) {
    return [{ label: t('visits.title') }];
  }
  return [];
}

function AdminBreadcrumb() {
  const location = useLocation();
  const { t } = useTranslation('admin');
  const crumbs = getCrumbs(location.pathname, t);

  if (!crumbs.length) return null;

  return (
    <Breadcrumb
      spacing={1.5}
      separator={<ChevronRight size={12} color="var(--chakra-colors-text-muted)" />}
      fontSize="13px"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <BreadcrumbItem key={i} isCurrentPage={isLast}>
            {crumb.to && !isLast ? (
              <BreadcrumbLink
                as={NavLink}
                to={crumb.to}
                color="text.muted"
                _hover={{ color: 'text.primary', textDecoration: 'none' }}
              >
                {crumb.label}
              </BreadcrumbLink>
            ) : (
              <Text as="span" color={isLast ? 'text.primary' : 'text.muted'} fontWeight={isLast ? 500 : 400}>
                {crumb.label}
              </Text>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation('admin');
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '—';

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <Flex direction="column" h="100%" bg="warm.black" color="white" p={5}>
      {/* Logo + admin label */}
      <Box mb={8}>
        <Logo size="sm" />
        <Text mt={1} fontSize="10px" letterSpacing="0.28em" textTransform="uppercase" color="accent.gold">
          {t('pageTitle')}
        </Text>
      </Box>

      {/* Nav items */}
      <VStack as="nav" align="stretch" spacing={1} flex={1}>
        {NAV_ITEMS.map((item) => (
          <Box
            key={item.to}
            as={NavLink}
            to={item.to}
            end={item.end}
            onClick={onClose}
            display="flex"
            alignItems="center"
            gap={3}
            px={3}
            py={3}
            minH="44px"
            borderRadius="8px"
            fontSize="13px"
            letterSpacing="0.1em"
            color="rgba(255,255,255,0.65)"
            transition="all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
            _hover={{
              bg: 'rgba(201,169,97,0.1)',
              color: 'rgba(255,255,255,0.9)',
              textDecoration: 'none',
            }}
            sx={{
              '&.active': {
                bg: 'accent.gold',
                color: 'warm.black',
                fontWeight: 600,
                '& svg': { opacity: 1 },
              },
            }}
          >
            <Box opacity={0.75} sx={{ '.active &': { opacity: 1 } }}>
              {item.icon}
            </Box>
            {t(item.labelKey)}
          </Box>
        ))}
      </VStack>

      {/* View public site */}
      <Box
        as="a"
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        display="flex"
        alignItems="center"
        gap={3}
        px={3}
        py={3}
        minH="44px"
        mb={1}
        borderRadius="8px"
        fontSize="13px"
        letterSpacing="0.1em"
        color="rgba(255,255,255,0.6)"
        transition="all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        _hover={{ bg: 'rgba(201,169,97,0.1)', color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}
      >
        <ExternalLink size={15} />
        {t('viewSite')}
      </Box>

      {/* User + logout */}
      <Stack spacing={1} pt={3} borderTop="1px solid rgba(201,169,97,0.2)">
        {/* Username */}
        <HStack spacing={2} px={3} py={2} opacity={0.55}>
          <User size={13} />
          <Text fontSize="11px" letterSpacing="0.06em" noOfLines={1}>
            {displayName}
          </Text>
        </HStack>
        {/* Logout */}
        <Box
          as="button"
          display="flex"
          alignItems="center"
          gap={3}
          px={3}
          py={3}
          minH="44px"
          borderRadius="8px"
          fontSize="13px"
          letterSpacing="0.1em"
          color="rgba(255,255,255,0.6)"
          _hover={{ bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' }}
          transition="all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          onClick={handleLogout}
          w="100%"
        >
          <LogOut size={15} />
          {t('logout')}
        </Box>
      </Stack>
    </Flex>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────

export function AdminLayout() {
  useDirection();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation('admin');
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '—';
  const crumbs = getCrumbs(location.pathname, t);
  const pageTitle = crumbs.length ? crumbs[crumbs.length - 1].label : t('pageTitle');

  return (
    <Flex minH="100vh" bg="bg.canvas">
      {/* Desktop sidebar */}
      <Box
        display={{ base: 'none', md: 'flex' }}
        flexDirection="column"
        w="220px"
        flexShrink={0}
        position="sticky"
        top={0}
        h="100vh"
      >
        <SidebarContent />
      </Box>

      {/* Mobile drawer */}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} placement="start" size="xs">
        <DrawerOverlay />
        <DrawerContent maxW="220px">
          <DrawerBody p={0}>
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main content */}
      <Flex direction="column" flex={1} minW={0}>
        {/* Top bar */}
        <HStack
          h="60px"
          px={{ base: 4, md: 6 }}
          borderBottom="1px solid"
          borderColor="border.subtle"
          bg="bg.surface"
          justify="space-between"
          flexShrink={0}
          position="sticky"
          top={0}
          zIndex={30}
        >
          {/* Left: hamburger (mobile) + breadcrumb */}
          <HStack spacing={3} minW={0}>
            <IconButton
              display={{ base: 'inline-flex', md: 'none' }}
              aria-label={drawerOpen ? t('closeMenu') : t('openMenu')}
              variant="ghostGold"
              size="sm"
              w="40px"
              h="40px"
              icon={drawerOpen ? <X size={18} /> : <Menu size={18} />}
              onClick={() => setDrawerOpen((v) => !v)}
              flexShrink={0}
            />
            <Box display={{ base: 'none', sm: 'block' }}>
              <AdminBreadcrumb />
            </Box>
            {/* Mobile: current page title (mirrors the breadcrumb's last crumb) */}
            <Text
              display={{ base: 'block', sm: 'none' }}
              fontSize="15px"
              fontWeight={600}
              color="text.primary"
              noOfLines={1}
            >
              {pageTitle}
            </Text>
          </HStack>

          {/* Right: username */}
          <HStack spacing={3} flexShrink={0}>
            <HStack
              spacing={1.5}
              display={{ base: 'none', md: 'flex' }}
              color="text.muted"
              fontSize="12px"
              letterSpacing="0.04em"
            >
              <User size={13} />
              <Text noOfLines={1} maxW="120px">{displayName}</Text>
            </HStack>
          </HStack>
        </HStack>

        <Box as="main" flex={1} p={{ base: 5, md: 8 }} overflowX="hidden">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}

export default AdminLayout;
