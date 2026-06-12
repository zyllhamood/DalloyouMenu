import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
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
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react';

import ConfirmModal from '../../components/admin/ConfirmModal';
import { adminProductsList, categoriesList, productDelete, productPatch } from '../../lib/api';
import type { Product } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { getPrimaryProductImage } from '../../lib/productImages';

type TFn = (key: string) => string;
type TogglePatch = { is_featured?: boolean; is_available?: boolean; order?: number };

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
const PAGE_SIZE = 20;

type StatusFilter = '' | 'available' | 'unavailable' | 'featured' | 'new';

function adminMeasurementLabel(t: TFn, product: Product) {
  if (product.size_mode === 'WEIGHT') return product.weight_label || '—';
  if (!product.size) return '—';
  const size = product.size;
  const key = size === 'SMALL' ? 'Small' : size === 'MEDIUM' ? 'Medium' : 'Large';
  return t(`form.size${key}`);
}

function DragGlyph() {
  return (
    <Box as="svg" viewBox="0 0 24 24" w="16px" h="16px" aria-hidden>
      <path
        d="M9 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm6-16a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        fill="currentColor"
      />
    </Box>
  );
}

function DragHandle({
  listeners,
  attributes,
  label,
}: {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
  label: string;
}) {
  return (
    <Box
      {...attributes}
      {...listeners}
      aria-label={label}
      display="grid"
      placeItems="center"
      w={{ base: '40px', md: '32px' }}
      h={{ base: '40px', md: '32px' }}
      flexShrink={0}
      borderRadius="8px"
      color="text.muted"
      cursor="grab"
      sx={{ touchAction: 'none', '&:active': { cursor: 'grabbing' } }}
      _hover={{ bg: 'bg.canvas', color: 'accent.goldDeep' }}
      transition="all 200ms"
    >
      <DragGlyph />
    </Box>
  );
}

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

// ── Shared empty state (used by both the desktop table and mobile cards) ────

function EmptyContent({
  hasFilters,
  onClear,
  t,
}: {
  hasFilters: boolean;
  onClear: () => void;
  t: TFn;
}) {
  return (
    <Stack spacing={3} align="center" py={8}>
      <Box color="text.muted" opacity={0.35}><Package size={40} /></Box>
      <Text fontSize="14px" color="text.muted">{t('noProducts')}</Text>
      {hasFilters ? (
        <Button size="sm" variant="ghostGold" onClick={onClear}>
          {t('clearFilters')}
        </Button>
      ) : (
        <Button as={RouterLink} to="/admin/products/new" size="sm" variant="goldOutline">
          {t('addFirstProduct')}
        </Button>
      )}
    </Stack>
  );
}

// ── Mobile product card (replaces the cramped table on small screens) ───────

function MobileProductCard({
  product,
  t,
  onToggle,
  onDelete,
}: {
  product: Product;
  t: TFn;
  onToggle: (id: number | string, patch: TogglePatch) => void;
  onDelete: (p: Product) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const thumbnail = getPrimaryProductImage(product);
  const hasBadges = product.is_featured || product.is_new || !product.is_available;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
    boxShadow: isDragging ? '0 12px 32px rgba(168,138,77,0.2)' : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      boxShadow="soft"
      p={4}
    >
      <Flex gap={3} align="flex-start">
        <DragHandle attributes={attributes} listeners={listeners} label={t('productsReorderHint')} />
        <Box
          w="68px"
          h="68px"
          borderRadius="10px"
          overflow="hidden"
          bg="warm.cream"
          border="1px solid"
          borderColor="border.subtle"
          flexShrink={0}
        >
          {thumbnail ? (
            <Image src={thumbnail} alt="" w="100%" h="100%" objectFit="cover" loading="lazy" />
          ) : (
            <Box w="100%" h="100%" bg="border.subtle" />
          )}
        </Box>

        <Box flex={1} minW={0}>
          <Flex justify="space-between" align="flex-start" gap={2}>
            <Box minW={0}>
              <Text
                as={RouterLink}
                to={`/admin/products/${product.id}`}
                fontSize="15px"
                fontWeight={600}
                color="text.primary"
                noOfLines={1}
                display="block"
                _hover={{ color: 'accent.goldDeep' }}
              >
                {product.name_ar || product.name_en}
              </Text>
            </Box>
            <Text fontSize="14px" fontWeight={600} whiteSpace="nowrap" flexShrink={0}>
              {formatPrice(product.base_price, 'ar')}
            </Text>
          </Flex>
          <Text fontSize="11px" color="text.muted" mt={1} noOfLines={1}>
            {product.category.name_ar || product.category.name_en} · {adminMeasurementLabel(t, product)}
          </Text>
          {hasBadges && (
            <HStack spacing={1.5} mt={2} flexWrap="wrap">
              {product.is_featured && <StatusBadge label={t('filterFeatured')} scheme="gold" />}
              {product.is_new && <StatusBadge label={t('filterNew')} scheme="new" />}
              {!product.is_available && <StatusBadge label={t('filterUnavailable')} scheme="red" />}
            </HStack>
          )}
        </Box>
      </Flex>

      <Divider my={3} borderColor="border.subtle" />

      <Flex align="center" justify="space-between" gap={3}>
        <HStack spacing={4}>
          <HStack as="label" spacing={2} cursor="pointer">
            <Switch
              size="sm"
              colorScheme="yellow"
              isChecked={product.is_featured}
              onChange={(e) => onToggle(product.id, { is_featured: e.target.checked })}
            />
            <Text fontSize="11px" color="text.muted">{t('table.featured')}</Text>
          </HStack>
          <HStack as="label" spacing={2} cursor="pointer">
            <Switch
              size="sm"
              colorScheme="green"
              isChecked={product.is_available}
              onChange={(e) => onToggle(product.id, { is_available: e.target.checked })}
            />
            <Text fontSize="11px" color="text.muted">{t('table.available')}</Text>
          </HStack>
        </HStack>
        <HStack spacing={1}>
          <IconButton
            as={RouterLink}
            to={`/admin/products/${product.id}`}
            aria-label={t('edit')}
            icon={<Pencil size={15} />}
            size="sm"
            w="40px"
            h="40px"
            minW="40px"
            variant="ghostGold"
          />
          <IconButton
            aria-label={t('delete')}
            icon={<Trash2 size={15} />}
            size="sm"
            w="40px"
            h="40px"
            minW="40px"
            variant="ghostGold"
            color="red.500"
            _hover={{ bg: 'red.50', color: 'red.600' }}
            onClick={() => onDelete(product)}
          />
        </HStack>
      </Flex>
    </Box>
  );
}

function SortableProductRow({
  product,
  t,
  onToggle,
  onDelete,
}: {
  product: Product;
  t: TFn;
  onToggle: (id: number | string, patch: TogglePatch) => void;
  onDelete: (p: Product) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const thumbnail = getPrimaryProductImage(product);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <Tr ref={setNodeRef} style={style} h="72px" _hover={{ bg: 'bg.canvas' }}>
      <Td w="44px" px={2}>
        <DragHandle attributes={attributes} listeners={listeners} label={t('productsReorderHint')} />
      </Td>
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
          {thumbnail ? (
            <Image src={thumbnail} alt="" w="100%" h="100%" objectFit="cover" loading="lazy" />
          ) : (
            <Box w="100%" h="100%" bg="border.subtle" />
          )}
        </Box>
      </Td>
      <Td maxW="200px">
        <Text fontSize="13px" fontWeight={500} noOfLines={1}>{product.name_ar || product.name_en}</Text>
        <Text fontSize="10px" color="accent.goldDeep" mt={1}>{adminMeasurementLabel(t, product)}</Text>
      </Td>
      <Td display={{ base: 'none', lg: 'table-cell' }}>
        <Text fontSize="12px" color="text.muted">
          {product.category.name_ar || product.category.name_en}
        </Text>
      </Td>
      <Td isNumeric>
        <Text fontSize="12px" whiteSpace="nowrap">{formatPrice(product.base_price, 'ar')}</Text>
      </Td>
      <Td>
        <Stack spacing={1} align="flex-start">
          {product.is_featured && <StatusBadge label={t('filterFeatured')} scheme="gold" />}
          {product.is_new && <StatusBadge label={t('filterNew')} scheme="new" />}
          {!product.is_available && <StatusBadge label={t('filterUnavailable')} scheme="red" />}
        </Stack>
      </Td>
      <Td>
        <Tooltip label={t('table.featured')} hasArrow openDelay={500}>
          <Switch
            size="sm"
            isChecked={product.is_featured}
            colorScheme="yellow"
            onChange={(e) => onToggle(product.id, { is_featured: e.target.checked })}
          />
        </Tooltip>
      </Td>
      <Td>
        <Tooltip label={t('table.available')} hasArrow openDelay={500}>
          <Switch
            size="sm"
            isChecked={product.is_available}
            colorScheme="green"
            onChange={(e) => onToggle(product.id, { is_available: e.target.checked })}
          />
        </Tooltip>
      </Td>
      <Td>
        <HStack spacing={1}>
          <Tooltip label={t('edit')} hasArrow openDelay={400}>
            <IconButton
              as={RouterLink}
              to={`/admin/products/${product.id}`}
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
              onClick={() => onDelete(product)}
            />
          </Tooltip>
        </HStack>
      </Td>
    </Tr>
  );
}

export default function AdminProductsPage() {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const { isOpen: confirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const orderQueue = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

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

  useEffect(() => {
    setItems(products.data?.results ?? []);
  }, [products.data]);

  const handleToggle = (id: number | string, patch: TogglePatch) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    toggleMutation.mutate({ id, patch });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = items.findIndex((p) => p.id === active.id);
    const newIdx = items.findIndex((p) => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);

    const pageOffset = (page - 1) * PAGE_SIZE;
    reordered.forEach((product, idx) => {
      const id = product.id as number;
      const nextOrder = pageOffset + idx;
      const existing = orderQueue.current.get(id);
      if (existing) window.clearTimeout(existing);
      orderQueue.current.set(
        id,
        window.setTimeout(() => {
          void productPatch(id, { order: nextOrder }).then(() => {
            void queryClient.invalidateQueries({ queryKey: ['admin.productsList'] });
            void queryClient.invalidateQueries({ queryKey: ['admin.recentProducts'] });
            void queryClient.invalidateQueries({ queryKey: ['productsList'] });
          });
          orderQueue.current.delete(id);
        }, 250),
      );
    });
  };

  // ─── Toggle mutations (optimistic) ─────────────────────────────────────

  const toggleMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number | string; patch: TogglePatch }) =>
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
        <InputGroup
          size="sm"
          maxW={{ base: '100%', md: '240px' }}
          flex={{ base: '1 1 100%', md: 'none' }}
        >
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
              {c.name_ar || c.name_en}
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {/* Desktop table (md and up) */}
          <Box
            display={{ base: 'none', md: 'block' }}
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
                    <Th w="44px" />
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
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                            <Td key={j}>
                              <Skeleton h="12px" startColor="warm.cream" endColor="border.subtle" />
                            </Td>
                          ))}
                        </Tr>
                      ))
                    : items.length === 0
                    ? (
                        <Tr>
                          <Td colSpan={9} textAlign="center" py={4}>
                            <EmptyContent hasFilters={hasFilters} onClear={clearFilters} t={t} />
                          </Td>
                        </Tr>
                      )
                    : items.map((p) => (
                        <SortableProductRow
                          key={p.id}
                          product={p}
                          t={t}
                          onToggle={handleToggle}
                          onDelete={(prod) => { setDeleteTarget(prod); openConfirm(); }}
                        />
                      ))}
                </Tbody>
              </Table>
            </Box>
          </Box>

          {/* Mobile cards (below md) */}
          <Box display={{ base: 'block', md: 'none' }}>
            {products.isLoading ? (
              <Stack spacing={3}>
                {[0, 1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="lg"
                    p={4}
                  >
                    <Flex gap={3}>
                      <Skeleton w="68px" h="68px" borderRadius="10px" startColor="warm.cream" endColor="border.subtle" />
                      <Box flex={1}>
                        <Skeleton h="14px" w="70%" mb={2} startColor="warm.cream" endColor="border.subtle" />
                        <Skeleton h="11px" w="40%" mb={3} startColor="warm.cream" endColor="border.subtle" />
                        <Skeleton h="11px" w="30%" startColor="warm.cream" endColor="border.subtle" />
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            ) : items.length === 0 ? (
              <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg">
                <EmptyContent hasFilters={hasFilters} onClear={clearFilters} t={t} />
              </Box>
            ) : (
              <Stack spacing={3}>
                {items.map((p) => (
                  <MobileProductCard
                    key={p.id}
                    product={p}
                    t={t}
                    onToggle={handleToggle}
                    onDelete={(prod) => { setDeleteTarget(prod); openConfirm(); }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </SortableContext>
      </DndContext>

      {/* Pagination (shared across both layouts) */}
      {totalPages > 1 && (
        <Flex
          bg="bg.surface"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={{ base: 4, md: 6 }}
          py={3}
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

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { closeConfirm(); setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title={t('deleteConfirmTitle')}
        body={`"${deleteTarget?.name_ar ?? deleteTarget?.name_en ?? ''}" — ${t('deleteConfirmBody')}`}
      />
    </Stack>
  );
}
