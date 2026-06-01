import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Stack,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
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
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Pencil, Tag, Trash2 } from 'lucide-react';

import ConfirmModal from '../../components/admin/ConfirmModal';
import { categoriesList, categoryCreate, categoryUpdate, categoryDelete } from '../../lib/api';
import type { Category } from '../../lib/api';
import { slugify } from '../../lib/format';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
const FOCUS = { borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' };

type TFn = (key: string) => string;

// ─── Drag glyph ───────────────────────────────────────────────────────────────

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

// Small active / inactive status pill (shared by table row + mobile card)
function StatusPill({ active, t }: { active: boolean; t: TFn }) {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="10px"
      fontWeight={600}
      letterSpacing="0.08em"
      textTransform="uppercase"
      bg={active ? 'rgba(201,169,97,0.12)' : 'bg.canvas'}
      color={active ? 'accent.goldDeep' : 'text.muted'}
      border="1px solid"
      borderColor={active ? 'border.gold' : 'border.subtle'}
    >
      <Box w="6px" h="6px" borderRadius="full" bg={active ? 'accent.gold' : 'text.muted'} />
      {active ? t('table.active') : t('statusInactive')}
    </Box>
  );
}

// ─── Category form schema ─────────────────────────────────────────────────────

const catSchema = z.object({
  nameEn: z.string().min(1, 'Required').max(200),
  nameAr: z.string().min(1, 'Required').max(200),
  slug: z.string().min(1).max(200),
  isActive: z.boolean(),
});
type CatForm = z.infer<typeof catSchema>;

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableRow({
  cat,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  cat: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggleActive: (c: Category, val: boolean) => void;
}) {
  const { t } = useTranslation('admin');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <Tr ref={setNodeRef} style={style} _hover={{ bg: 'bg.canvas' }}>
      <Td w="48px" px={2}>
        <Box
          {...attributes}
          {...listeners}
          aria-label={t('catForm.reorderHint')}
          display="grid"
          placeItems="center"
          w="32px"
          h="32px"
          borderRadius="8px"
          color="text.muted"
          cursor="grab"
          sx={{ touchAction: 'none', '&:active': { cursor: 'grabbing' } }}
          _hover={{ bg: 'bg.surface', color: 'accent.goldDeep' }}
          transition="all 200ms"
        >
          <DragGlyph />
        </Box>
      </Td>
      <Td>
        <Text fontSize="13px" fontWeight={500}>{cat.name_en}</Text>
      </Td>
      <Td>
        <Text fontSize="13px" fontFamily="'El Messiri', serif">{cat.name_ar}</Text>
      </Td>
      <Td>
        <Text fontSize="11px" color="text.muted" fontFamily="monospace">{cat.slug}</Text>
      </Td>
      <Td>
        <HStack spacing={2.5}>
          <Switch
            size="sm"
            colorScheme="green"
            isChecked={cat.is_active !== false}
            onChange={(e) => onToggleActive(cat, e.target.checked)}
            aria-label={t('table.active')}
          />
          <StatusPill active={cat.is_active !== false} t={t} />
        </HStack>
      </Td>
      <Td>
        <HStack spacing={1}>
          <IconButton
            aria-label={t('edit')}
            icon={<Pencil size={14} />}
            size="sm"
            w="34px"
            h="34px"
            minW="34px"
            variant="ghostGold"
            onClick={() => onEdit(cat)}
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
            onClick={() => onDelete(cat)}
          />
        </HStack>
      </Td>
    </Tr>
  );
}

// ─── Sortable card (mobile) ─────────────────────────────────────────────────

function SortableCard({
  cat,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  cat: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  onToggleActive: (c: Category, val: boolean) => void;
}) {
  const { t } = useTranslation('admin');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id });
  const active = cat.is_active !== false;

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
      p={3}
    >
      <Flex align="center" gap={2}>
        <Box
          {...attributes}
          {...listeners}
          aria-label={t('catForm.reorderHint')}
          display="grid"
          placeItems="center"
          w="40px"
          h="40px"
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

        <Box flex={1} minW={0}>
          <Text fontSize="14px" fontWeight={600} noOfLines={1}>{cat.name_en}</Text>
          <Text fontSize="12px" color="text.muted" fontFamily="'El Messiri', serif" noOfLines={1}>
            {cat.name_ar}
          </Text>
          <Text fontSize="10px" color="text.muted" fontFamily="monospace" mt={0.5} noOfLines={1}>
            {cat.slug}
          </Text>
        </Box>

        <HStack spacing={1} flexShrink={0}>
          <IconButton
            aria-label={t('edit')}
            icon={<Pencil size={15} />}
            size="sm"
            w="40px"
            h="40px"
            minW="40px"
            variant="ghostGold"
            onClick={() => onEdit(cat)}
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
            onClick={() => onDelete(cat)}
          />
        </HStack>
      </Flex>

      <Divider my={3} borderColor="border.subtle" />

      <Flex align="center" justify="space-between">
        <StatusPill active={active} t={t} />
        <Switch
          size="sm"
          colorScheme="green"
          isChecked={active}
          onChange={(e) => onToggleActive(cat, e.target.checked)}
          aria-label={t('table.active')}
        />
      </Flex>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<Category[]>([]);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { isOpen: addOpen, onOpen: openAdd, onClose: closeAdd } = useDisclosure();
  const { isOpen: editOpen, onOpen: openEdit, onClose: closeEditModal } = useDisclosure();
  const { isOpen: confirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();

  const cats = useQuery({ queryKey: ['categoriesList'], queryFn: categoriesList, ...QUERY_OPTS });

  useEffect(() => {
    if (cats.data) setItems(cats.data);
  }, [cats.data]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenEdit = (cat: Category) => {
    setEditTarget(cat);
    openEdit();
  };

  const handleCloseEdit = () => {
    closeEditModal();
    setEditTarget(null);
  };

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (payload: CatForm) =>
      categoryCreate({ name_en: payload.nameEn, name_ar: payload.nameAr, slug: payload.slug }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      toast({ title: t('saved'), status: 'success', duration: 3000, position: 'top' });
      closeAdd();
    },
    onError: () => toast({ title: t('saveError'), status: 'error', duration: 4000, position: 'top' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Category> }) =>
      categoryUpdate(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      toast({ title: t('saved'), status: 'success', duration: 3000, position: 'top' });
      handleCloseEdit();
    },
    onError: () => toast({ title: t('saveError'), status: 'error', duration: 4000, position: 'top' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryDelete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categoriesList'] });
      toast({ title: t('deleteSuccess'), status: 'success', duration: 3000, position: 'top' });
      closeConfirm();
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        t('deleteError');
      toast({ title: msg, status: 'error', duration: 5000, position: 'top', isClosable: true });
      closeConfirm();
    },
  });

  // ─── Drag reorder ───────────────────────────────────────────────────────────

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const orderQueue = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx);
    setItems(reordered);

    reordered.forEach((cat, idx) => {
      const prev = items.indexOf(cat);
      if (prev === idx) return;
      const existing = orderQueue.current.get(cat.id as number);
      if (existing) clearTimeout(existing);
      orderQueue.current.set(
        cat.id as number,
        setTimeout(() => {
          void categoryUpdate(cat.id, { order: idx });
        }, 600),
      );
    });

    toast({ title: t('catForm.saveOrder'), status: 'info', duration: 2000, position: 'bottom' });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;

  return (
    <Stack spacing={6}>
      {/* Header */}
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Text
            fontFamily="heading"
            fontWeight={500}
            fontSize={{ base: '24px', md: '28px' }}
            color="text.primary"
            lineHeight={1.1}
          >
            {t('categories')}
          </Text>
          {cats.data !== undefined && (
            <Text fontSize="13px" color="text.muted" mt={1}>
              {cats.data.length} {t('categories').toLowerCase()}
            </Text>
          )}
        </Box>
        <Button
          variant="blackGold"
          size="sm"
          h="38px"
          px={5}
          fontSize="13px"
          letterSpacing="0.08em"
          onClick={openAdd}
        >
          + {t('addCategory')}
        </Button>
      </Flex>

      {/* Drag hint — only meaningful when there's more than one row */}
      {!cats.isLoading && items.length > 1 && (
        <Text fontSize="12px" color="text.muted">
          {t('catForm.reorderHint')}
        </Text>
      )}

      {cats.isLoading ? (
        // Loading skeletons
        <Stack spacing={3}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
              <Flex align="center" gap={3}>
                <Skeleton w="32px" h="32px" borderRadius="8px" startColor="warm.cream" endColor="border.subtle" />
                <Box flex={1}>
                  <Skeleton h="13px" w="50%" mb={2} startColor="warm.cream" endColor="border.subtle" />
                  <Skeleton h="11px" w="30%" startColor="warm.cream" endColor="border.subtle" />
                </Box>
                <Skeleton h="22px" w="64px" borderRadius="full" startColor="warm.cream" endColor="border.subtle" />
              </Flex>
            </Box>
          ))}
        </Stack>
      ) : items.length === 0 ? (
        // Empty state
        <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" py={14} px={6}>
          <Stack spacing={3} align="center">
            <Box color="text.muted" opacity={0.35}><Tag size={38} /></Box>
            <Text fontSize="14px" color="text.muted">{t('noCategories')}</Text>
            <Button variant="goldOutline" size="sm" onClick={openAdd}>
              {t('addFirstCategory')}
            </Button>
          </Stack>
        </Box>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {isMobile ? (
              // ── Mobile: sortable cards ──
              <Stack spacing={3}>
                {items.map((cat) => (
                  <SortableCard
                    key={cat.id}
                    cat={cat}
                    onEdit={handleOpenEdit}
                    onDelete={(c) => { setDeleteTarget(c); openConfirm(); }}
                    onToggleActive={(c, val) =>
                      updateMutation.mutate({ id: c.id as number, payload: { order: c.order, is_active: val } })
                    }
                  />
                ))}
              </Stack>
            ) : (
              // ── Desktop: sortable table ──
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
                        <Th w="48px" />
                        <Th fontSize="10px" letterSpacing="0.18em" color="text.muted">{t('table.name')}</Th>
                        <Th fontSize="10px" letterSpacing="0.18em" color="text.muted">{t('table.nameAr')}</Th>
                        <Th fontSize="10px" letterSpacing="0.18em" color="text.muted">{t('table.slug')}</Th>
                        <Th fontSize="10px" letterSpacing="0.18em" color="text.muted">{t('table.active')}</Th>
                        <Th fontSize="10px" letterSpacing="0.18em" color="text.muted">{t('table.actions')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((cat) => (
                        <SortableRow
                          key={cat.id}
                          cat={cat}
                          onEdit={handleOpenEdit}
                          onDelete={(c) => { setDeleteTarget(c); openConfirm(); }}
                          onToggleActive={(c, val) =>
                            updateMutation.mutate({ id: c.id as number, payload: { order: c.order, is_active: val } })
                          }
                        />
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
            )}
          </SortableContext>
        </DndContext>
      )}

      {/* ── Add Category Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={closeAdd} size="lg" motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <ModalContent mx={4} bg="bg.surface" borderRadius="xl">
          <ModalHeader
            fontFamily="heading"
            fontWeight={500}
            fontSize="20px"
            pb={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            {t('catForm.modalAddTitle')}
          </ModalHeader>
          <ModalCloseButton top={4} color="text.muted" />
          <ModalBody py={6}>
            <CategoryForm
              onSubmit={(v) => createMutation.mutate(v)}
              onCancel={closeAdd}
              isLoading={createMutation.isPending}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Edit Category Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={handleCloseEdit} size="lg" motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
        <ModalContent mx={4} bg="bg.surface" borderRadius="xl">
          <ModalHeader
            fontFamily="heading"
            fontWeight={500}
            fontSize="20px"
            pb={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            {t('catForm.modalEditTitle')}
            {editTarget && (
              <Text as="span" fontSize="14px" fontFamily="body" fontWeight={400} color="text.muted" ms={2}>
                — {editTarget.name_en}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton top={4} color="text.muted" />
          <ModalBody py={6}>
            {editTarget && (
              <CategoryForm
                initial={editTarget}
                onSubmit={(v) =>
                  updateMutation.mutate({
                    id: editTarget.id as number,
                    payload: { name_en: v.nameEn, name_ar: v.nameAr, slug: v.slug },
                  })
                }
                onCancel={handleCloseEdit}
                isLoading={updateMutation.isPending}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ── Confirm delete ───────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { closeConfirm(); setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id as number)}
        isLoading={deleteMutation.isPending}
        body={`"${deleteTarget?.name_en ?? ''}" — ${t('deleteConfirmBody')}`}
      />
    </Stack>
  );
}

// ─── Category form ────────────────────────────────────────────────────────────

function CategoryForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initial?: Category;
  onSubmit: (v: CatForm) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const { t } = useTranslation('admin');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CatForm>({
    resolver: standardSchemaResolver(catSchema) as Resolver<CatForm>,
    defaultValues: initial
      ? { nameEn: initial.name_en, nameAr: initial.name_ar, slug: initial.slug, isActive: true }
      : { nameEn: '', nameAr: '', slug: '', isActive: true },
  });

  const nameEn = watch('nameEn');
  useEffect(() => {
    if (!initial) setValue('slug', slugify(nameEn));
  }, [nameEn, initial, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={4}>
        <Flex gap={4} wrap="wrap" align="flex-start">
          <FormControl isInvalid={!!errors.nameEn} isRequired flex={1} minW="160px">
            <FormLabel fontSize="12px" fontWeight={500}>{t('catForm.nameEn')}</FormLabel>
            <Input size="sm" borderRadius="sm" _focus={FOCUS} {...register('nameEn')} />
            {errors.nameEn && (
              <Text fontSize="11px" color="red.500" mt={1}>{errors.nameEn.message}</Text>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.nameAr} isRequired flex={1} minW="160px">
            <FormLabel fontSize="12px" fontWeight={500}>{t('catForm.nameAr')}</FormLabel>
            <Input size="sm" borderRadius="sm" dir="rtl" _focus={FOCUS} {...register('nameAr')} />
            {errors.nameAr && (
              <Text fontSize="11px" color="red.500" mt={1}>{errors.nameAr.message}</Text>
            )}
          </FormControl>
          <FormControl isInvalid={!!errors.slug} flex={1} minW="140px">
            <FormLabel fontSize="12px" fontWeight={500}>{t('catForm.slug')}</FormLabel>
            <Input size="sm" borderRadius="sm" fontFamily="monospace" _focus={FOCUS} {...register('slug')} />
          </FormControl>
        </Flex>

        <HStack spacing={3} justify="flex-end" pt={2}>
          <Button
            size="sm"
            variant="ghostGold"
            onClick={onCancel}
            isDisabled={isLoading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            size="sm"
            bg="warm.black"
            color="accent.gold"
            border="1px solid"
            borderColor="accent.gold"
            isLoading={isLoading}
            _hover={{ bg: 'accent.gold', color: 'warm.black' }}
            transition="all 300ms"
          >
            {t('catForm.save')}
          </Button>
        </HStack>
      </Stack>
    </form>
  );
}
