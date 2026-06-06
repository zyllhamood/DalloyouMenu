import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, Plus, Star, Tag } from 'lucide-react';

import StatCard from '../../components/admin/StatCard';
import { adminProductsList, categoriesList, productsList } from '../../lib/api';
import { formatPrice, localized } from '../../lib/format';
import { getPrimaryProductImage } from '../../lib/productImages';
import { useAuthStore } from '../../stores/authStore';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;

// Small pill badge helper
function StatusBadge({ label, scheme }: { label: string; scheme: 'gold' | 'new' | 'red' }) {
  const styles = {
    gold: { bg: 'accent.gold', color: 'warm.black' },
    new: { bg: 'transparent', color: 'accent.goldDeep', border: '1px solid', borderColor: 'border.gold' },
    red: { bg: 'red.50', color: 'red.600' },
  }[scheme];
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      px={1.5}
      py={0.5}
      borderRadius="full"
      fontSize="9px"
      fontWeight={600}
      letterSpacing="0.12em"
      textTransform="uppercase"
      lineHeight={1}
      {...styles}
    >
      {label}
    </Box>
  );
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation('admin');
  const lang = i18n.language;
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? '';

  const recent = useQuery({
    queryKey: ['admin.recentProducts'],
    queryFn: () => adminProductsList({ pageSize: 8, ordering: '-created_at' }),
    ...QUERY_OPTS,
  });

  const allProducts = useQuery({
    queryKey: ['admin.allCount'],
    queryFn: () => productsList({ pageSize: 1 }),
    ...QUERY_OPTS,
  });

  const featured = useQuery({
    queryKey: ['admin.featuredCount'],
    queryFn: () => productsList({ featured: true, pageSize: 1 }),
    ...QUERY_OPTS,
  });

  const newArrivals = useQuery({
    queryKey: ['admin.newCount'],
    queryFn: () => productsList({ isNew: true, pageSize: 1 }),
    ...QUERY_OPTS,
  });

  const cats = useQuery({
    queryKey: ['categoriesList'],
    queryFn: categoriesList,
    ...QUERY_OPTS,
  });

  const activeCats = cats.data?.filter((c) => c.is_active !== false).length;

  return (
    <Stack spacing={8}>
      {/* Welcome banner */}
      <Box>
        <Text fontFamily="heading" fontSize={{ base: '24px', md: '28px' }} fontWeight={500} color="text.primary">
          {t('welcomeBack')}{displayName ? `, ${displayName}` : ''} 👋
        </Text>
        <Text fontSize="13px" color="text.muted" mt={1} letterSpacing="0.02em">
          {t('welcomeSubtitle')}
        </Text>
      </Box>

      {/* Stat cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard
          label={t('stats.totalProducts')}
          value={allProducts.data?.count}
          isLoading={allProducts.isLoading}
          accent="accent.gold"
          icon={<Package size={22} />}
        />
        <StatCard
          label={t('stats.featured')}
          value={featured.data?.count}
          sub={allProducts.data ? t('stats.featuredOf', { total: allProducts.data.count }) : undefined}
          isLoading={featured.isLoading}
          accent="accent.goldDeep"
          icon={<Star size={22} />}
        />
        <StatCard
          label={t('stats.newArrivals')}
          value={newArrivals.data?.count}
          isLoading={newArrivals.isLoading}
          accent="#A88A4D"
          icon={<Plus size={22} />}
        />
        <StatCard
          label={t('stats.categories')}
          value={cats.data?.length}
          sub={activeCats !== undefined ? t('stats.categoriesActive', { n: activeCats }) : undefined}
          isLoading={cats.isLoading}
          accent="#8C7A5E"
          icon={<Tag size={22} />}
        />
      </SimpleGrid>

      {/* Quick actions */}
      <Box
        bg="bg.surface"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        px={6}
        py={5}
      >
        <Text
          fontSize="11px"
          letterSpacing="0.24em"
          textTransform="uppercase"
          color="text.muted"
          mb={4}
        >
          {t('quickActions')}
        </Text>
        <HStack spacing={3} wrap="wrap">
          <Button
            as={RouterLink}
            to="/admin/products/new"
            h="52px"
            px={7}
            bg="warm.black"
            color="accent.gold"
            border="1px solid"
            borderColor="accent.gold"
            fontSize="13px"
            letterSpacing="0.14em"
            leftIcon={<Plus size={16} />}
            _hover={{ bg: 'accent.gold', color: 'warm.black' }}
            transition="all 300ms"
          >
            {t('addProduct')}
          </Button>
          <Button
            as={RouterLink}
            to="/admin/categories"
            h="52px"
            px={7}
            variant="outline"
            borderColor="border.gold"
            color="accent.goldDeep"
            fontSize="13px"
            letterSpacing="0.14em"
            leftIcon={<Tag size={16} />}
            _hover={{ bg: 'accent.gold', borderColor: 'accent.gold', color: 'warm.black' }}
            transition="all 300ms"
          >
            {t('addCategory')}
          </Button>
        </HStack>
      </Box>

      {/* Recent products */}
      <Box
        bg="bg.surface"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        overflow="hidden"
      >
        <Flex
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor="border.subtle"
          align="center"
          justify="space-between"
        >
          <Text fontWeight={500} fontSize="14px">{t('recentProducts')}</Text>
          <Button as={RouterLink} to="/admin/products" variant="ghostGold" size="sm">
            {t('products')} →
          </Button>
        </Flex>

        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead bg="bg.canvas">
              <Tr>
                <Th w="56px" fontSize="10px" letterSpacing="0.16em" color="text.muted" />
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.name')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted" display={{ base: 'none', md: 'table-cell' }}>{t('table.category')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted" isNumeric>{t('table.price')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.status')}</Th>
                <Th w="60px" />
              </Tr>
            </Thead>
            <Tbody>
              {recent.isLoading
                ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <Tr key={i}>
                      {[0, 1, 2, 3, 4, 5].map((j) => (
                        <Td key={j}>
                          <Skeleton h="12px" startColor="warm.cream" endColor="border.subtle" />
                        </Td>
                      ))}
                    </Tr>
                  ))
                : (recent.data?.results ?? []).length === 0
                ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={12}>
                        <Stack spacing={3} align="center">
                          <Box color="text.muted" opacity={0.4}><Package size={40} /></Box>
                          <Text fontSize="14px" color="text.muted">{t('noProducts')}</Text>
                          <Button
                            as={RouterLink}
                            to="/admin/products/new"
                            size="sm"
                            variant="goldOutline"
                          >
                            {t('addFirstProduct')}
                          </Button>
                        </Stack>
                      </Td>
                    </Tr>
                  )
                : (recent.data?.results ?? []).map((p) => {
                    const thumbnail = getPrimaryProductImage(p);
                    return (
                    <Tr key={p.id} _hover={{ bg: 'bg.canvas' }}>
                      <Td px={4}>
                        <Box w="48px" h="48px" borderRadius="8px" overflow="hidden" bg="warm.cream" border="1px solid" borderColor="border.subtle" flexShrink={0}>
                          {thumbnail ? (
                            <Image src={thumbnail} alt="" w="100%" h="100%" objectFit="cover" loading="lazy" />
                          ) : (
                            <Box w="100%" h="100%" bg="border.subtle" />
                          )}
                        </Box>
                      </Td>
                      <Td>
                        <Text
                          fontSize="13px"
                          fontWeight={500}
                          as={RouterLink}
                          to={`/admin/products/${p.id}`}
                          _hover={{ color: 'accent.goldDeep' }}
                          noOfLines={1}
                        >
                          {localized(p.name_en, p.name_ar, lang)}
                        </Text>
                      </Td>
                      <Td display={{ base: 'none', md: 'table-cell' }}>
                        <Text fontSize="12px" color="text.muted">
                          {localized(p.category.name_en, p.category.name_ar, lang)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="12px" whiteSpace="nowrap">{formatPrice(p.base_price, lang)}</Text>
                      </Td>
                      <Td>
                        <HStack spacing={1} flexWrap="wrap">
                          {p.is_featured && <StatusBadge label={t('table.featured')} scheme="gold" />}
                          {p.is_new && <StatusBadge label={t('filterNew')} scheme="new" />}
                          {!p.is_available && <StatusBadge label={t('filterUnavailable')} scheme="red" />}
                        </HStack>
                      </Td>
                      <Td>
                        <Button
                          as={RouterLink}
                          to={`/admin/products/${p.id}`}
                          size="xs"
                          variant="ghostGold"
                          fontSize="11px"
                        >
                          {t('edit')}
                        </Button>
                      </Td>
                    </Tr>
                    );
                  })}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Stack>
  );
}
