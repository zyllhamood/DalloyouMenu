import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  Stack,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2 } from 'lucide-react';

import ImageDropZone from '../ImageDropZone';
import { Price } from '../../product/Price';
import { Thumb } from './IpadBits';
import { saveErrorMessage } from '../../../lib/apiErrors';
import { formatBytes, prepareImageForUpload } from '../../../lib/imageUpload';
import { thumbnailUrl } from '../../../lib/images';
import {
  IPAD_QUERY_KEY,
  ipadItemSave,
  productPrice,
  suggestCategory,
  type IpadAdminData,
  type IpadItem,
  type IpadProductChoice,
} from '../../../lib/ipad';

const FOCUS = { borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' };

interface PhotoState {
  /** A newly picked file, waiting to be uploaded. */
  file: File | null;
  /** The saved photo should be removed. */
  clear: boolean;
  note?: string;
}

interface IpadItemModalProps {
  data: IpadAdminData;
  /** The item being edited, or null to add a new one. */
  item: IpadItem | null;
  presetCategoryId?: number | null;
  presetProductId?: number | null;
  onClose: () => void;
}

/**
 * Add or edit one iPad item. Mounted fresh for every open (the page gives it
 * a new `key`), so its state starts from the item each time.
 */
export default function IpadItemModal({
  data,
  item,
  presetCategoryId,
  presetProductId,
  onClose,
}: IpadItemModalProps) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState<number | null>(item ? item.product_id : presetProductId ?? null);
  const [categoryId, setCategoryId] = useState<number>(
    () => item?.category_id ?? presetCategoryId ?? suggestCategory(data, presetProductId) ?? data.categories[0]?.id ?? 0,
  );
  const [nameAr, setNameAr] = useState(item?.name_ar ?? '');
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : '');
  const [nameEn, setNameEn] = useState(item?.name_en ?? '');
  const [sizeLabel, setSizeLabel] = useState(item?.size_label ?? '');
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true);
  const [photo, setPhoto] = useState<PhotoState>({ file: null, clear: false });
  const [detail, setDetail] = useState<PhotoState>({ file: null, clear: false });
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);

  const product = data.products.find((p) => p.id === productId) ?? null;
  const currency = data.settings.currency || 'ر.س';

  // Website products grouped under their website category, as in the shop admin.
  const groups = useMemo(() => {
    const onIpad = new Set<number>();
    data.categories.forEach((c) =>
      c.items.forEach((i) => i.product_id && i.id !== item?.id && onIpad.add(i.product_id)),
    );
    const byCategory = new Map<string, Array<{ product: IpadProductChoice; onIpad: boolean }>>();
    data.products.forEach((p) => {
      const key = p.category.name_ar || p.category.name_en;
      const list = byCategory.get(key) ?? [];
      list.push({ product: p, onIpad: onIpad.has(p.id) });
      byCategory.set(key, list);
    });
    return [...byCategory.entries()];
  }, [data, item?.id]);

  const savedPhotoPath = photo.clear ? null : item?.image_path ?? null;
  const savedDetailPath = detail.clear ? null : item?.detail_image_path ?? null;
  const usesWebsitePhoto = !photo.file && !savedPhotoPath && !!product?.display_image_path;

  const pickPhoto = (setter: typeof setPhoto) => async (file: File) => {
    const { file: prepared, saved } = await prepareImageForUpload(file);
    setter({
      file: prepared,
      clear: false,
      note: saved > 0
        ? t('form.imageOptimised', { size: formatBytes(prepared.size), saved: formatBytes(saved) })
        : undefined,
    });
  };

  const submit = async () => {
    const nextErrors: typeof errors = {};
    if (!productId && !nameAr.trim()) nextErrors.name = t('ipad.form.nameRequired');
    const priceText = price.trim().replace(',', '.');
    if (!productId && priceText && !Number.isFinite(Number(priceText))) {
      nextErrors.price = t('ipad.form.priceInvalid');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const fd = new FormData();
    fd.append('category_id', String(categoryId));
    fd.append('product_id', productId ? String(productId) : '');
    if (!productId) {
      fd.append('name_ar', nameAr.trim());
      fd.append('price', priceText ? String(Number(priceText)) : '');
    }
    fd.append('name_en', nameEn.trim());
    fd.append('size_label', sizeLabel.trim());
    fd.append('is_visible', isVisible ? 'true' : 'false');
    // Empty value = remove the saved photo; a field left out = keep it.
    if (photo.file) fd.append('image', photo.file);
    else if (photo.clear) fd.append('image', '');
    if (detail.file) fd.append('detail_image', detail.file);
    else if (detail.clear) fd.append('detail_image', '');

    setSaving(true);
    setProgress(0);
    try {
      await ipadItemSave(item?.id ?? null, fd, setProgress);
    } catch (error) {
      setSaving(false);
      toast({ title: saveErrorMessage(error, t), status: 'error', duration: 6000, position: 'top', isClosable: true });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: IPAD_QUERY_KEY });
    toast({ title: t('saved'), status: 'success', duration: 2500, position: 'top' });
    onClose();
  };

  const { price: livePrice, was: liveWas } = product ? productPrice(product) : { price: null, was: null };

  return (
    <Modal isOpen onClose={saving ? () => {} : onClose} size="2xl" scrollBehavior="inside" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <ModalContent mx={4} bg="bg.surface" borderRadius="xl">
        <ModalHeader
          fontFamily="heading"
          fontWeight={500}
          fontSize="20px"
          pb={3}
          borderBottom="1px solid"
          borderColor="border.subtle"
        >
          {item ? t('ipad.form.editTitle') : t('ipad.form.addTitle')}
        </ModalHeader>
        <ModalCloseButton top={4} color="text.muted" isDisabled={saving} />

        <ModalBody py={6}>
          <Stack spacing={6}>
            {/* ── Which product ── */}
            <Stack spacing={3}>
              <FormControl>
                <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.form.product')}</FormLabel>
                <Select
                  size="sm"
                  borderRadius="sm"
                  _focus={FOCUS}
                  value={productId ?? ''}
                  onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t('ipad.form.productNone')}</option>
                  {groups.map(([group, list]) => (
                    <optgroup key={group} label={group}>
                      {list.map(({ product: p, onIpad }) => {
                        const { price: pPrice } = productPrice(p);
                        const extras = [
                          pPrice !== null ? `${pPrice} ${currency}` : null,
                          p.is_available ? null : t('ipad.form.productUnavailable'),
                          onIpad ? t('ipad.form.alreadyOnIpad') : null,
                        ].filter(Boolean);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name_ar}{extras.length ? ` — ${extras.join(' · ')}` : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </Select>
              </FormControl>

              {product ? (
                <Box border="1px solid" borderColor="border.gold" bg="rgba(194, 134, 62, 0.05)" borderRadius="lg" p={3}>
                  <Flex gap={3} align="center">
                    <Thumb path={product.display_image_path} size={52} />
                    <Box flex={1} minW={0}>
                      <Text fontSize="14px" fontWeight={600} noOfLines={1}>{product.name_ar}</Text>
                      <HStack spacing={3} mt={1} wrap="wrap">
                        {livePrice !== null && <Price value={livePrice} original={liveWas} size="sm" />}
                        {product.size_label && <Text fontSize="12px" color="text.muted">{product.size_label}</Text>}
                      </HStack>
                    </Box>
                  </Flex>
                  <Text fontSize="11px" color="text.muted" mt={2}>{t('ipad.form.productHelper')}</Text>
                  {!product.is_available && (
                    <HStack spacing={2} mt={2} color="orange.600" align="flex-start">
                      <Box mt="2px"><AlertTriangle size={14} /></Box>
                      <Text fontSize="12px">{t('ipad.form.linkedUnavailable')}</Text>
                    </HStack>
                  )}
                </Box>
              ) : (
                <Grid templateColumns={{ base: '1fr', md: '2fr 1fr' }} gap={4}>
                  <FormControl isRequired isInvalid={!!errors.name}>
                    <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.form.nameAr')}</FormLabel>
                    <Input size="sm" borderRadius="sm" _focus={FOCUS} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
                    <FormHelperText fontSize="11px" color={errors.name ? 'red.500' : undefined}>
                      {errors.name ?? t('ipad.form.nameArHelper')}
                    </FormHelperText>
                  </FormControl>
                  <FormControl isInvalid={!!errors.price}>
                    <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.form.price')} ({currency})</FormLabel>
                    <Input
                      size="sm"
                      borderRadius="sm"
                      inputMode="decimal"
                      dir="ltr"
                      _focus={FOCUS}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <FormHelperText fontSize="11px" color={errors.price ? 'red.500' : undefined}>
                      {errors.price ?? t('ipad.form.priceHelper')}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              )}
            </Stack>

            {/* ── Where and how it shows ── */}
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <FormControl isRequired>
                <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.form.category')}</FormLabel>
                <Select size="sm" borderRadius="sm" _focus={FOCUS} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.form.nameEn')}</FormLabel>
                <Input
                  size="sm"
                  borderRadius="sm"
                  dir="ltr"
                  lang="en"
                  _focus={FOCUS}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                />
                <FormHelperText fontSize="11px">{t('ipad.form.nameEnHelper')}</FormHelperText>
              </FormControl>
              <FormControl gridColumn={{ md: '1 / -1' }}>
                <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.form.sizeLabel')}</FormLabel>
                <Input
                  size="sm"
                  borderRadius="sm"
                  _focus={FOCUS}
                  value={sizeLabel}
                  placeholder={product?.size_label || undefined}
                  onChange={(e) => setSizeLabel(e.target.value)}
                />
                <FormHelperText fontSize="11px">
                  {t('ipad.form.sizeLabelHelper')}
                  {product?.size_label ? ` ${t('ipad.form.sizeLabelDefault', { size: product.size_label })}` : ''}
                </FormHelperText>
              </FormControl>
            </Grid>

            {/* ── Photos ── */}
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
              <PhotoField
                label={t('ipad.form.image')}
                hint={productId ? t('ipad.form.imageHint') : t('ipad.form.imageHintTabletOnly')}
                state={photo}
                savedPath={savedPhotoPath}
                onPick={pickPhoto(setPhoto)}
                onRemove={() => setPhoto({ file: null, clear: true })}
                removeLabel={t('ipad.form.removeImage')}
                footer={usesWebsitePhoto ? (
                  <HStack spacing={2} mt={2}>
                    <Thumb path={product?.display_image_path} size={36} />
                    <Text fontSize="11px" color="text.muted">{t('ipad.items.badges.websitePhoto')}</Text>
                  </HStack>
                ) : null}
              />
              <PhotoField
                label={t('ipad.form.detailImage')}
                hint={t('ipad.form.detailImageHint')}
                state={detail}
                savedPath={savedDetailPath}
                onPick={pickPhoto(setDetail)}
                onRemove={() => setDetail({ file: null, clear: true })}
                removeLabel={t('ipad.form.removeImage')}
              />
            </Grid>

            <HStack spacing={3} align="flex-start">
              <Switch id="ipad-visible" colorScheme="green" isChecked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} mt="3px" />
              <Box>
                <FormLabel htmlFor="ipad-visible" mb={0.5} fontSize="13px" fontWeight={500} cursor="pointer">
                  {t('ipad.form.visible')}
                </FormLabel>
                <Text fontSize="11px" color="text.muted">{t('ipad.form.visibleHelper')}</Text>
              </Box>
            </HStack>
          </Stack>
        </ModalBody>

        <ModalFooter borderTop="1px solid" borderColor="border.subtle" flexDirection="column" alignItems="stretch" gap={3}>
          {saving && progress > 0 && progress < 100 && (
            <Progress value={progress} size="xs" colorScheme="yellow" borderRadius="full" />
          )}
          <HStack spacing={3} justify="flex-end">
            <Button variant="ghostGold" size="sm" onClick={onClose} isDisabled={saving}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              bg="warm.black"
              color="accent.gold"
              border="1px solid"
              borderColor="accent.gold"
              _hover={{ bg: 'accent.gold', color: 'warm.black' }}
              isLoading={saving}
              loadingText={progress > 0 && progress < 100 ? `${t('form.uploading')} ${progress}%` : t('form.saving')}
              onClick={() => void submit()}
            >
              {t('ipad.form.save')}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function PhotoField({
  label,
  hint,
  state,
  savedPath,
  onPick,
  onRemove,
  removeLabel,
  footer,
}: {
  label: string;
  hint: string;
  state: PhotoState;
  savedPath: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
  removeLabel: string;
  footer?: ReactNode;
}) {
  const value = state.file ?? thumbnailUrl(savedPath, 640);
  return (
    <Box>
      <ImageDropZone label={label} hint={hint} value={value} onChange={onPick} />
      {state.note && <Text fontSize="11px" color="green.600" mt={1.5}>{state.note}</Text>}
      {value && (
        <Button
          size="xs"
          variant="ghostGold"
          color="red.500"
          leftIcon={<Trash2 size={12} />}
          mt={1.5}
          onClick={onRemove}
        >
          {removeLabel}
        </Button>
      )}
      {footer}
    </Box>
  );
}
