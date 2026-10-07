import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Switch,
  Text,
  Wrap,
  WrapItem,
  useToast,
} from '@chakra-ui/react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import ConfirmModal from '../ConfirmModal';
import { Price } from '../../product/Price';
import { DragHandle, Pill, Thumb } from './IpadBits';
import { normalizeArabic } from '../../../lib/menu';
import {
  IPAD_QUERY_KEY,
  ipadItemDelete,
  ipadItemPatch,
  ipadItemsReorder,
  moveById,
  productsNotOnIpad,
  type IpadAdminData,
  type IpadCategory,
  type IpadItem,
} from '../../../lib/ipad';

interface IpadItemsPanelProps {
  data: IpadAdminData;
  onAdd: (preset: { categoryId?: number; productId?: number }) => void;
  onEdit: (item: IpadItem) => void;
}

export default function IpadItemsPanel({ data, onAdd, onEdit }: IpadItemsPanelProps) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<IpadItem | null>(null);

  const query = normalizeArabic(search);
  const searching = query.length > 0;
  const missing = useMemo(() => productsNotOnIpad(data), [data]);
  const unavailable = useMemo(
    () => new Set(data.products.filter((p) => !p.is_available).map((p) => p.id)),
    [data.products],
  );

  const allItems = data.categories.flatMap((c) => c.items.map((item) => ({ item, category: c })));
  const notShown = allItems.filter(({ item, category }) => item.resolved.hidden_reason || !category.is_visible).length;

  const updateCache = (update: (categories: IpadCategory[]) => IpadCategory[]) =>
    queryClient.setQueryData<IpadAdminData>(IPAD_QUERY_KEY, (old) =>
      old ? { ...old, categories: update(old.categories) } : old,
    );
  const refresh = () => queryClient.invalidateQueries({ queryKey: IPAD_QUERY_KEY });
  const failed = () => {
    toast({ title: t('saveError'), status: 'error', duration: 4000, position: 'top' });
    void refresh();
  };

  const visibility = useMutation({
    mutationFn: ({ item, visible }: { item: IpadItem; visible: boolean }) =>
      ipadItemPatch(item.id, { is_visible: visible }),
    onMutate: ({ item, visible }) =>
      updateCache((cats) =>
        cats.map((c) => ({
          ...c,
          items: c.items.map((i) => {
            if (i.id !== item.id) return i;
            const reason = !visible
              ? 'hidden'
              : i.product_id && unavailable.has(i.product_id)
                ? 'unavailable'
                : i.resolved.name
                  ? null
                  : 'no_name';
            return { ...i, is_visible: visible, resolved: { ...i.resolved, hidden_reason: reason } };
          }),
        })),
      ),
    onError: failed,
    onSettled: refresh,
  });

  const removal = useMutation({
    mutationFn: (item: IpadItem) => ipadItemDelete(item.id),
    onSuccess: () => {
      toast({ title: t('deleteSuccess'), status: 'success', duration: 2500, position: 'top' });
      setDeleteTarget(null);
      void refresh();
    },
    onError: failed,
  });

  const reorder = useMutation({
    mutationFn: (ids: number[]) => ipadItemsReorder(ids),
    onSuccess: () => toast({ title: t('ipad.orderSaved'), status: 'info', duration: 1500, position: 'bottom' }),
    onError: failed,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (category: IpadCategory) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = moveById(category.items, Number(active.id), Number(over.id));
    updateCache((cats) => cats.map((c) => (c.id === category.id ? { ...c, items } : c)));
    reorder.mutate(items.map((i) => i.id));
  };

  if (!data.categories.length) {
    return (
      <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" py={12} px={6} textAlign="center">
        <Text fontSize="14px" color="text.muted">{t('ipad.items.noCategories')}</Text>
      </Box>
    );
  }

  const matches = (item: IpadItem) =>
    !searching || normalizeArabic(`${item.resolved.name} ${item.resolved.en}`).includes(query);
  const visibleCategories = data.categories
    .map((category) => ({ category, items: category.items.filter(matches) }))
    .filter(({ items }) => !searching || items.length > 0);

  return (
    <Stack spacing={5}>
      {missing.length > 0 && (
        <Box border="1px dashed" borderColor="border.gold" bg="rgba(194, 134, 62, 0.05)" borderRadius="lg" p={4}>
          <Text fontSize="13px" fontWeight={600}>{t('ipad.items.notOnIpadTitle')}</Text>
          <Text fontSize="11px" color="text.muted" mb={3}>{t('ipad.items.notOnIpadHint')}</Text>
          <Wrap spacing={2}>
            {missing.map((product) => (
              <WrapItem key={product.id}>
                <Button
                  size="xs"
                  variant="goldOutline"
                  borderRadius="full"
                  leftIcon={<Plus size={12} />}
                  onClick={() => onAdd({ productId: product.id })}
                >
                  {product.name_ar}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}

      <Flex gap={3} align="center" wrap="wrap">
        <InputGroup size="sm" maxW="340px">
          <InputLeftElement pointerEvents="none" color="text.muted"><Search size={14} /></InputLeftElement>
          <Input
            borderRadius="sm"
            bg="bg.surface"
            placeholder={t('ipad.items.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Text fontSize="12px" color="text.muted">
          {t('ipad.items.count', { total: allItems.length, hidden: notShown })}
        </Text>
      </Flex>

      {!searching && <Text fontSize="12px" color="text.muted" mt={-2}>{t('ipad.items.reorderHint')}</Text>}

      {visibleCategories.length === 0 && (
        <Text fontSize="13px" color="text.muted" textAlign="center" py={8}>{t('ipad.items.noResults')}</Text>
      )}

      {visibleCategories.map(({ category, items }) => (
        <Box key={category.id} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
          <Flex
            align="center"
            justify="space-between"
            gap={3}
            px={4}
            py={3}
            bg="bg.canvas"
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            <HStack spacing={2} minW={0} wrap="wrap">
              <Text fontSize="15px" fontWeight={600} fontFamily="'El Messiri', serif">{category.name_ar}</Text>
              {category.name_en && (
                <Text fontSize="11px" color="text.muted"><bdi lang="en">{category.name_en}</bdi></Text>
              )}
              <Text fontSize="11px" color="text.muted">· {t('ipad.categories.count', { count: category.items.length })}</Text>
              {!category.is_visible && <Pill tone="danger">{t('ipad.items.badges.categoryHidden')}</Pill>}
            </HStack>
            <Button size="xs" variant="goldOutline" leftIcon={<Plus size={12} />} onClick={() => onAdd({ categoryId: category.id })} flexShrink={0}>
              {t('ipad.addItem')}
            </Button>
          </Flex>

          {items.length === 0 ? (
            <Text fontSize="12px" color="text.muted" px={4} py={5}>{t('ipad.items.empty')}</Text>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(category)}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    dragDisabled={searching}
                    onEdit={() => onEdit(item)}
                    onDelete={() => setDeleteTarget(item)}
                    onToggle={(visible) => visibility.mutate({ item, visible })}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </Box>
      ))}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removal.mutate(deleteTarget)}
        isLoading={removal.isPending}
        body={t('ipad.items.deleteBody', { name: deleteTarget?.resolved.name ?? '' })}
      />
    </Stack>
  );
}

function ItemRow({
  item,
  dragDisabled,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: IpadItem;
  dragDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (visible: boolean) => void;
}) {
  const { t } = useTranslation('admin');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: dragDisabled,
  });
  const { resolved } = item;
  const shown = !resolved.hidden_reason;

  return (
    <Flex
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
      align="center"
      gap={3}
      px={{ base: 2, md: 3 }}
      py={2.5}
      borderBottom="1px solid"
      borderColor="border.subtle"
      bg={isDragging ? 'bg.surface' : shown ? undefined : 'rgba(239, 232, 216, 0.45)'}
      boxShadow={isDragging ? '0 12px 32px rgba(168,138,77,0.2)' : undefined}
      _last={{ borderBottom: 'none' }}
      wrap={{ base: 'wrap', md: 'nowrap' }}
    >
      <DragHandle label={t('catForm.reorderHint')} disabled={dragDisabled} {...attributes} {...listeners} />
      <Thumb path={resolved.image} dimmed={!shown} />

      <Box flex={1} minW={0} opacity={shown ? 1 : 0.6}>
        <Text fontSize="14px" fontWeight={600} noOfLines={1}>
          {resolved.name || <Text as="span" color="text.muted">—</Text>}
        </Text>
        {resolved.en && (
          <Text fontSize="11px" color="text.muted" noOfLines={1}>
            <bdi lang="en">{resolved.en}</bdi>
          </Text>
        )}
        <Wrap spacing={1} mt={1}>
          {resolved.hidden_reason === 'hidden' && <WrapItem><Pill tone="danger">{t('ipad.items.badges.hidden')}</Pill></WrapItem>}
          {resolved.hidden_reason === 'unavailable' && <WrapItem><Pill tone="danger">{t('ipad.items.badges.unavailable')}</Pill></WrapItem>}
          {resolved.hidden_reason === 'no_name' && <WrapItem><Pill tone="danger">{t('ipad.items.badges.noName')}</Pill></WrapItem>}
          {!item.product_id && <WrapItem><Pill tone="gold">{t('ipad.items.badges.tabletOnly')}</Pill></WrapItem>}
          {resolved.detail_image && <WrapItem><Pill>{t('ipad.items.badges.twoPhotos')}</Pill></WrapItem>}
          {item.product_id && !item.image_path && resolved.image && (
            <WrapItem><Pill>{t('ipad.items.badges.websitePhoto')}</Pill></WrapItem>
          )}
          {resolved.size && <WrapItem><Pill>{resolved.size}</Pill></WrapItem>}
        </Wrap>
      </Box>

      <HStack spacing={{ base: 2, md: 4 }} flexShrink={0} ms={{ base: 'auto', md: 0 }}>
        <Box minW="78px" textAlign="end">
          {resolved.price !== null ? (
            <Price value={resolved.price} original={resolved.was} size="sm" />
          ) : (
            <Text fontSize="12px" color="text.muted">{t('ipad.items.noPrice')}</Text>
          )}
        </Box>
        <Switch
          size="sm"
          colorScheme="green"
          isChecked={item.is_visible}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={t('ipad.items.visibleToggle')}
        />
        <HStack spacing={0.5}>
          <IconButton
            aria-label={t('edit')}
            icon={<Pencil size={14} />}
            size="sm"
            w="34px"
            h="34px"
            minW="34px"
            variant="ghostGold"
            onClick={onEdit}
          />
          <IconButton
            aria-label={t('delete')}
            icon={<Trash2 size={14} />}
            size="sm"
            w="34px"
            h="34px"
            minW="34px"
            variant="ghostGold"
            color="red.500"
            _hover={{ bg: 'red.50', color: 'red.600' }}
            onClick={onDelete}
          />
        </HStack>
      </HStack>
    </Flex>
  );
}
