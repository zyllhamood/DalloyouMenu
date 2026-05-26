import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Skeleton,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import ConfirmModal from '../../components/admin/ConfirmModal';
import { adminProductsList, categoriesList, productDelete, productPatch } from '../../lib/api';
import type { Product } from '../../lib/api';
import { localized } from '../../lib/format';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
const PAGE_SIZE = 20;

type StatusFilter = '' | 'available' | 'unavailable' | 'featured' | 'new';

// ── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ label, scheme }: { label: string; scheme: 'gold' | 'new' | 'red' }) {
  const styles = {
    gold: { bg: 'accent.gold', color: 'warm.black' },
    new: { bg: 'transparent', color: 'accent.goldDeep', border: '1px solid', borderColor: 'border.gold' },
    red: { bg: 'red.50', color: 'red.600', border: '1px solid', borderColor: 'red.200' },
  }[scheme];
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="10px"
      fontWeight={600}
      letterSpacing="0.1em"
      textTransform="uppercase"
      flexShrink={0}
      {...styles}
    >
      {label}
    </Box>
  );
}

export default function AdminProductsPage() {
  const { t, i18n } = useTranslation('admin');
  const lang = i18n.language;
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { isOpen: confirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();

  const hasFilters = Boolean(search || category || status);

  const cats = useQuery({ queryKey: ['categoriesList'], queryFn: categoriesList, ...QUERY_OPTS });

  // Translate status filter to API params
  const statusParams = {
    available: { isAvailable: true },
    unavailable: { isAvailable: false },
    featured: { featured: true },
    new: { isNew: true },
    '': {},
  }[status];

  const products = useQuery({
    queryKey: ['admin.productsList', { search, category, status, page }],
    queryFn: () =>
      adminProductsList({
        search: search || undefined,
        category: category || undefined,
        ...statusParams,
        page,
        pageSize: PAGE_SIZE,
      }),
    ...QUERY_OPTS,
  });

  // ─── Toggle mutations (optimistic) ─────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number | string; patch: { is_featured?: boolean; is_available?: boolean } }) =>
      productPatch(id, patch),
    onMutate: async ({ id, patch }) => {
      const key = ['admin.productsList', { search, category, status, page }];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData<typeof products.data>(key, (old) =>
        old ? { ...old, results: old.results.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : old,
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['admin.productsList', { search, category, status, page }], ctx.prev);
      toast({ title: t('saveError'), status: 'error', duration: 3000, position: 'top' });
    },
  });

  // ─── Delete mutation ────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => productDelete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin.productsList'] });
      void queryClient.invalidateQueries({ queryKey: ['admin.recentProducts'] });
      void queryClient.invalidateQueries({ queryKey: ['admin.allCount'] });
      toast({ title: t('deleteSuccess'), status: 'success', duration: 3000, position: 'top' });
      closeConfirm();
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: t('deleteError'), status: 'error', duration: 4000, position: 'top' });
      closeConfirm();
    },
  });

  const totalPages = products.data ? Math.ceil(products.data.count / PAGE_SIZE) : 1;

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('');
    setPage(1);
  };

  return (
    <Stack spacing={6}>
      {/* Header */}
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Heading as="h1" fontFamily="heading" fontWeight={500} fontSize={{ base: '26px', md: '32px' }}>
            {t('products')}
          </Heading>
          {products.data && (
            <Text fontSize="13px" color="text.muted" mt={0.5}>
              {products.data.count} {t('products').toLowerCase()}
            </Text>
          )}
        </Box>
        <Button
          as={RouterLink}
          to="/admin/products/new"
          h="44px"
          px={5}
          bg="warm.black"
          color="accent.gold"
          border="1px solid"
          borderColor="accent.gold"
          fontSize="13px"
          leftIcon={<Plus size={15} />}
          _hover={{ bg: 'accent.gold', color: 'warm.black' }}
          transition="all 300ms"
        >
          {t('addProduct')}
        </Button>
      </Flex>

      {/* Filters */}
      <Flex gap={3} wrap="wrap" align="center">
        <InputGroup maxW="240px" size="sm" flex={{ base: '1 1 160px', md: 'none' }}>
          <InputLeftElement pointerEvents="none" color="text.muted">
            <Search size={14} />
          </InputLeftElement>
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('search')}
            borderRadius="sm"
            _focus={{ borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.3)' }}
          />
        </InputGroup>

        <Select
          size="sm"
          maxW="180px"
          borderRadius="sm"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          _focus={{ borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.3)' }}
          flex={{ base: '1 1 120px', md: 'none' }}
        >
          <option value="">{t('filterCategory')}</option>
          {(cats.data ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {localized(c.name_en, c.name_ar, lang)}
            </option>
          ))}
        </Select>

        <Select
          size="sm"
          maxW="160px"
          borderRadius="sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}
          _focus={{ borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.3)' }}
          flex={{ base: '1 1 120px', md: 'none' }}
        >
          <option value="">{t('filterAll')}</option>
          <option value="available">{t('filterAvailable')}</option>
          <option value="unavailable">{t('filterUnavailable')}</option>
          <option value="featured">{t('filterFeatured')}</option>
          <option value="new">{t('filterNew')}</option>
        </Select>

        {hasFilters && (
          <Tooltip label={t('clearFilters')} hasArrow>
            <IconButton
              aria-label={t('clearFilters')}
              icon={<X size={14} />}
              size="sm"
              variant="ghostGold"
              onClick={clearFilters}
            />
          </Tooltip>
        )}
      </Flex>

      {/* Table */}
      <Box
        bg="bg.surface"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        overflow="hidden"
      >
        <Box overflowX="auto">
          <Table size="sm" variant="simple">
            <Thead bg="bg.canvas">
              <Tr>
                <Th w="64px" fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.thumbnail')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.name')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted" display={{ base: 'none', lg: 'table-cell' }}>{t('table.category')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted" isNumeric>{t('table.price')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.status')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.featured')}</Th>
                <Th fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.available')}</Th>
                <Th w="72px" fontSize="10px" letterSpacing="0.16em" color="text.muted">{t('table.actions')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {products.isLoading
                ? [0, 1, 2, 3, 4, 5].map((i) => (
                    <Tr key={i} h="72px">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <Td key={j}>
                          <Skeleton h="12px" startColor="warm.cream" endColor="border.subtle" />
                        </Td>
                      ))}
                    </Tr>
                  ))
                : (products.data?.results ?? []).length === 0
                ? (
                    <Tr>
                      <Td colSpan={8} textAlign="center" py={12}>
                        <Stack spacing={3} align="center">
                          <Box color="text.muted" opacity={0.35}><Package size={40} /></Box>
                          <Text fontSize="14px" color="text.muted">{t('noProducts')}</Text>
                          {hasFilters ? (
                            <Button size="sm" variant="ghostGold" onClick={clearFilters}>
                              {t('clearFilters')}
                            </Button>
                          ) : (
                            <Button as={RouterLink} to="/admin/products/new" size="sm" variant="goldOutline">
                              {t('addFirstProduct')}
                            </Button>
                          )}
                        </Stack>
                      </Td>
                    </Tr>
                  )
                : (products.data?.results ?? []).map((p) => (
                    <Tr key={p.id} h="72px" _hover={{ bg: 'bg.canvas' }}>
                      {/* Thumbnail */}
                      <Td px={3}>
                        <Box
                          w="56px"
                          h="56px"
                          borderRadius="8px"
                          overflow="hidden"
                          bg="warm.cream"
                          border="1px solid"
                          borderColor="border.subtle"
                          flexShrink={0}
                        >
                          {p.display_image ? (
                            <Image src={p.display_image} alt="" w="100%" h="100%" objectFit="cover" loading="lazy" />
                          ) : (
                            <Box w="100%" h="100%" bg="border.subtle" />
                          )}
                        </Box>
                      </Td>
                      {/* Name */}
                      <Td maxW="200px">
                        <Text fontSize="13px" fontWeight={500} noOfLines={1}>{p.name_en}</Text>
                        <Text fontSize="11px" color="text.muted" fontFamily="'El Messiri', serif" noOfLines={1}>{p.name_ar}</Text>
                      </Td>
                      {/* Category */}
                      <Td display={{ base: 'none', lg: 'table-cell' }}>
                        <Text fontSize="12px" color="text.muted">
                          {localized(p.category.name_en, p.category.name_ar, lang)}
                        </Text>
                      </Td>
                      {/* Price */}
                      <Td isNumeric>
                        <Text fontSize="12px">SAR {p.base_price}</Text>
                      </Td>
                      {/* Status badges */}
                      <Td>
                        <Stack spacing={1} align="flex-start">
                          {p.is_featured && <StatusBadge label={t('filterFeatured')} scheme="gold" />}
                          {p.is_new && <StatusBadge label={t('filterNew')} scheme="new" />}
                          {!p.is_available && <StatusBadge label={t('filterUnavailable')} scheme="red" />}
                        </Stack>
                      </Td>
                      {/* Featured toggle */}
                      <Td>
                        <Tooltip label={t('table.featured')} hasArrow openDelay={500}>
                          <Switch
                            size="sm"
                            isChecked={p.is_featured}
                            colorScheme="yellow"
                            onChange={(e) =>
                              toggleMutation.mutate({ id: p.id, patch: { is_featured: e.target.checked } })
                            }
                          />
                        </Tooltip>
                      </Td>
                      {/* Available toggle */}
                      <Td>
                        <Tooltip label={t('table.available')} hasArrow openDelay={500}>
                          <Switch
                            size="sm"
                            isChecked={p.is_available}
                            colorScheme="green"
                            onChange={(e) =>
                              toggleMutation.mutate({ id: p.id, patch: { is_available: e.target.checked } })
                            }
                          />
                        </Tooltip>
                      </Td>
                      {/* Actions */}
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label={t('edit')} hasArrow openDelay={400}>
                            <IconButton
                              as={RouterLink}
                              to={`/admin/products/${p.id}`}
                              aria-label={t('edit')}
                              icon={<Pencil size={13} />}
                              size="sm"
                              w="32px"
                              h="32px"
                              minW="32px"
                              variant="ghostGold"
                            />
                          </Tooltip>
                          <Tooltip label={t('delete')} hasArrow openDelay={400}>
                            <IconButton
                              aria-label={t('delete')}
                              icon={<Trash2 size={13} />}
                              size="sm"
                              w="32px"
                              h="32px"
                              minW="32px"
                              variant="ghostGold"
                              color="red.500"
                              _hover={{ bg: 'red.50', color: 'red.600' }}
                              onClick={() => { setDeleteTarget(p); openConfirm(); }}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex
            px={6}
            py={3}
            borderTop="1px solid"
            borderColor="border.subtle"
            align="center"
            justify="space-between"
          >
            <Text fontSize="12px" color="text.muted">
              {t('page', { page, total: totalPages })}
            </Text>
            <HStack spacing={2}>
              <Button size="xs" variant="goldOutline" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t('prev')}
              </Button>
              <Button size="xs" variant="goldOutline" isDisabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t('next')}
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { closeConfirm(); setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title={t('deleteConfirmTitle')}
        body={`"${deleteTarget?.name_en ?? ''}" — ${t('deleteConfirmBody')}`}
      />
    </Stack>
  );
}
