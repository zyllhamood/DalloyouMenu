import { useState } from 'react';
import {
  Box,
  Button,
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
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import ConfirmModal from '../ConfirmModal';
import { DragHandle, Pill } from './IpadBits';
import { saveErrorMessage } from '../../../lib/apiErrors';
import {
  IPAD_QUERY_KEY,
  ipadCategoriesReorder,
  ipadCategoryCreate,
  ipadCategoryDelete,
  ipadCategoryUpdate,
  moveById,
  type IpadAdminData,
  type IpadCategory,
  type IpadCategoryInput,
} from '../../../lib/ipad';

const FOCUS = { borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' };

export default function IpadCategoriesPanel({ data }: { data: IpadAdminData }) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  // null: closed · 'new': adding · a category: editing it
  const [editing, setEditing] = useState<IpadCategory | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IpadCategory | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: IPAD_QUERY_KEY });
  const failed = (error: unknown) => {
    toast({ title: saveErrorMessage(error, t), status: 'error', duration: 5000, position: 'top', isClosable: true });
    void refresh();
  };

  const save = useMutation({
    mutationFn: ({ id, payload }: { id: number | null; payload: IpadCategoryInput }) =>
      id ? ipadCategoryUpdate(id, payload) : ipadCategoryCreate(payload),
    onSuccess: () => {
      toast({ title: t('saved'), status: 'success', duration: 2500, position: 'top' });
      setEditing(null);
      void refresh();
    },
    onError: failed,
  });

  const removal = useMutation({
    mutationFn: (category: IpadCategory) => ipadCategoryDelete(category.id),
    onSuccess: () => {
      toast({ title: t('deleteSuccess'), status: 'success', duration: 2500, position: 'top' });
      setDeleteTarget(null);
      void refresh();
    },
    onError: failed,
  });

  const reorder = useMutation({
    mutationFn: (ids: number[]) => ipadCategoriesReorder(ids),
    onSuccess: () => toast({ title: t('ipad.orderSaved'), status: 'info', duration: 1500, position: 'bottom' }),
    onError: failed,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const categories = moveById(data.categories, Number(active.id), Number(over.id));
    queryClient.setQueryData<IpadAdminData>(IPAD_QUERY_KEY, (old) => (old ? { ...old, categories } : old));
    reorder.mutate(categories.map((c) => c.id));
  };

  return (
    <Stack spacing={4}>
      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
        <Text fontSize="12px" color="text.muted">
          {data.categories.length > 1 ? t('ipad.categories.reorderHint') : ''}
        </Text>
        <Button variant="blackGold" size="sm" leftIcon={<Plus size={14} />} onClick={() => setEditing('new')}>
          {t('ipad.categories.add')}
        </Button>
      </Flex>

      {data.categories.length === 0 ? (
        <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" py={12} textAlign="center">
          <Text fontSize="14px" color="text.muted">{t('ipad.categories.empty')}</Text>
        </Box>
      ) : (
        <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {data.categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  onEdit={() => setEditing(category)}
                  onDelete={() => setDeleteTarget(category)}
                  onToggle={(visible) => save.mutate({ id: category.id, payload: { is_visible: visible } })}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Box>
      )}

      {editing && (
        <CategoryModal
          category={editing === 'new' ? null : editing}
          isSaving={save.isPending}
          onClose={() => setEditing(null)}
          onSave={(payload) => save.mutate({ id: editing === 'new' ? null : editing.id, payload })}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removal.mutate(deleteTarget)}
        isLoading={removal.isPending}
        body={t('ipad.categories.deleteBody', {
          name: deleteTarget?.name_ar ?? '',
          count: deleteTarget?.items.length ?? 0,
        })}
      />
    </Stack>
  );
}

function CategoryRow({
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: IpadCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (visible: boolean) => void;
}) {
  const { t } = useTranslation('admin');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

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
      px={3}
      py={3}
      borderBottom="1px solid"
      borderColor="border.subtle"
      bg={isDragging ? 'bg.surface' : undefined}
      _last={{ borderBottom: 'none' }}
    >
      <DragHandle label={t('catForm.reorderHint')} {...attributes} {...listeners} />
      <Box flex={1} minW={0} opacity={category.is_visible ? 1 : 0.55}>
        <HStack spacing={2}>
          <Text fontSize="14px" fontWeight={600} fontFamily="'El Messiri', serif" noOfLines={1}>{category.name_ar}</Text>
          {!category.is_visible && <Pill tone="danger">{t('ipad.items.badges.hidden')}</Pill>}
        </HStack>
        <HStack spacing={2} mt={0.5}>
          {category.name_en && <Text fontSize="11px" color="text.muted"><bdi lang="en">{category.name_en}</bdi></Text>}
          <Text fontSize="11px" color="text.muted">{t('ipad.categories.count', { count: category.items.length })}</Text>
        </HStack>
      </Box>
      <Switch
        size="sm"
        colorScheme="green"
        isChecked={category.is_visible}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={t('ipad.categories.visibleToggle')}
      />
      <HStack spacing={0.5}>
        <IconButton aria-label={t('edit')} icon={<Pencil size={14} />} size="sm" w="34px" h="34px" minW="34px" variant="ghostGold" onClick={onEdit} />
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
    </Flex>
  );
}

function CategoryModal({
  category,
  isSaving,
  onClose,
  onSave,
}: {
  category: IpadCategory | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: IpadCategoryInput) => void;
}) {
  const { t } = useTranslation('admin');
  const [nameAr, setNameAr] = useState(category?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(category?.name_en ?? '');
  const [touched, setTouched] = useState(false);
  const invalid = touched && !nameAr.trim();

  const submit = () => {
    setTouched(true);
    if (!nameAr.trim()) return;
    onSave({ name_ar: nameAr.trim(), name_en: nameEn.trim() });
  };

  return (
    <Modal isOpen onClose={onClose} size="md" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <ModalContent mx={4} bg="bg.surface" borderRadius="xl">
        <ModalHeader fontFamily="heading" fontWeight={500} fontSize="20px" pb={3} borderBottom="1px solid" borderColor="border.subtle">
          {category ? t('ipad.categories.editTitle') : t('ipad.categories.addTitle')}
        </ModalHeader>
        <ModalCloseButton top={4} color="text.muted" />
        <ModalBody py={6}>
          <form
            id="ipad-category-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Stack spacing={4}>
              <FormControl isRequired isInvalid={invalid}>
                <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.categories.nameAr')}</FormLabel>
                <Input size="sm" borderRadius="sm" _focus={FOCUS} value={nameAr} onChange={(e) => setNameAr(e.target.value)} autoFocus />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.categories.nameEn')}</FormLabel>
                <Input size="sm" borderRadius="sm" dir="ltr" lang="en" _focus={FOCUS} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
              </FormControl>
            </Stack>
          </form>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghostGold" size="sm" onClick={onClose} isDisabled={isSaving}>{t('cancel')}</Button>
          <Button
            type="submit"
            form="ipad-category-form"
            size="sm"
            bg="warm.black"
            color="accent.gold"
            border="1px solid"
            borderColor="accent.gold"
            _hover={{ bg: 'accent.gold', color: 'warm.black' }}
            isLoading={isSaving}
          >
            {t('ipad.form.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
