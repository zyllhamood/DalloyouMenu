import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import type { Control, UseFormWatch, FieldErrors, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ImageDropZone from '../../components/admin/ImageDropZone';
import { TextField, TextareaField, NumberField } from '../../components/admin/AdminFormField';
import { categoriesList, productDetail, productCreate, productUpdate } from '../../lib/api';
import type { SizeKey } from '../../lib/api';
import { slugify } from '../../lib/format';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
const SIZES: SizeKey[] = ['small', 'medium', 'large'];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const variantSchema = z.object({
  enabled: z.boolean(),
  price: z.number().nonnegative().optional(),
  isAvailable: z.boolean(),
  image: z.union([z.instanceof(File), z.string().min(1)]).nullable().optional(),
});

const schema = z.object({
  categoryId: z.number().int().positive(),
  nameEn: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  nameAr: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  descriptionEn: z.string().max(2000).optional().default(''),
  descriptionAr: z.string().max(2000).optional().default(''),
  basePrice: z.number().nonnegative('Must be ≥ 0'),
  hasVariants: z.boolean().default(true),
  small: variantSchema,
  medium: variantSchema,
  large: variantSchema,
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  order: z.number().int().nonnegative().default(0),
}).superRefine((data, ctx) => {
  const enabledSizes = SIZES.filter((size) => data[size].enabled);
  if (!enabledSizes.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Add at least one size to continue.',
      path: ['hasVariants'],
    });
  }
  enabledSizes.forEach((size) => {
    const v = data[size];
    if (v.price === undefined || v.price < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Price required for enabled size',
        path: [size, 'price'],
      });
    }
    if (!(v.image instanceof File) && !(typeof v.image === 'string' && v.image.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Image is required for this size',
        path: [size, 'image'],
      });
    }
  });
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VARIANT = { enabled: false, price: undefined, isAvailable: true, image: null };

const defaultValues: FormValues = {
  categoryId: 0,
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  basePrice: 0,
  hasVariants: true,
  small: { ...DEFAULT_VARIANT },
  medium: { ...DEFAULT_VARIANT },
  large: { ...DEFAULT_VARIANT },
  isFeatured: false,
  isNew: false,
  isAvailable: true,
  order: 0,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProductFormPage() {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [styledImage, setStyledImage] = useState<File | string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<{ styled?: string }>({});

  const [variantImages, setVariantImages] = useState<Record<SizeKey, File | string | null>>({
    small: null,
    medium: null,
    large: null,
  });

  const cats = useQuery({ queryKey: ['categoriesList'], queryFn: categoriesList, ...QUERY_OPTS });

  const existing = useQuery({
    queryKey: ['productDetail', id],
    queryFn: () => productDetail(id!),
    enabled: isEdit,
    ...QUERY_OPTS,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema) as Resolver<FormValues>,
    defaultValues,
  });

  const handleVariantImageChange = (size: SizeKey, img: File | string | null) => {
    setVariantImages((prev) => ({ ...prev, [size]: img }));
    setValue(`${size}.image` as const, img, { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    if (!existing.data) return;
    const p = existing.data;
    const sizes = p.sizes ?? [];
    const sm = sizes.find((s) => s.size === 'small');
    const md = sizes.find((s) => s.size === 'medium');
    const lg = sizes.find((s) => s.size === 'large');
    reset({
      categoryId: p.category.id as number,
      nameEn: p.name_en,
      nameAr: p.name_ar,
      descriptionEn: p.description_en ?? '',
      descriptionAr: p.description_ar ?? '',
      basePrice: Number(p.base_price),
      hasVariants: true,
      small: sm ? { enabled: true, price: sm.price, isAvailable: sm.is_available ?? true, image: sm.image } : { ...DEFAULT_VARIANT },
      medium: md ? { enabled: true, price: md.price, isAvailable: md.is_available ?? true, image: md.image } : { ...DEFAULT_VARIANT },
      large: lg ? { enabled: true, price: lg.price, isAvailable: lg.is_available ?? true, image: lg.image } : { ...DEFAULT_VARIANT },
      isFeatured: p.is_featured,
      isNew: p.is_new ?? false,
      isAvailable: p.is_available,
      order: 0,
    });
    setStyledImage(p.styled_image);
    const imgs: Record<SizeKey, File | string | null> = { small: null, medium: null, large: null };
    (p.sizes ?? []).forEach((s) => { if (s.image) imgs[s.size] = s.image; });
    setVariantImages(imgs);
  }, [existing.data, reset]);

  const buildFormData = (values: FormValues): FormData => {
    const fd = new FormData();
    fd.append('category_id', String(values.categoryId));
    fd.append('name_en', values.nameEn);
    fd.append('name_ar', values.nameAr);
    fd.append('description_en', values.descriptionEn ?? '');
    fd.append('description_ar', values.descriptionAr ?? '');
    fd.append('base_price', String(values.basePrice));
    fd.append('is_featured', values.isFeatured ? 'true' : 'false');
    fd.append('is_new', values.isNew ? 'true' : 'false');
    fd.append('is_available', values.isAvailable ? 'true' : 'false');
    fd.append('order', String(values.order));
    fd.append('slug', slugify(values.nameEn));
    if (styledImage instanceof File) fd.append('styled_image', styledImage);
    const variantList = SIZES.filter((s) => values[s].enabled).map((s) => ({
          size: s.toUpperCase(),
          price: values[s].price ?? 0,
          is_available: values[s].isAvailable,
        }));
    fd.append('variants', JSON.stringify(variantList));
    SIZES.forEach((s) => {
      const img = variantImages[s];
      if (img instanceof File) fd.append(`variant_${s.toUpperCase()}_image`, img);
    });
    return fd;
  };

  const onSubmit = async (values: FormValues) => {
    const errs: typeof imageError = {};
    if (!styledImage) errs.styled = t('form.required');
    if (!isEdit && !(styledImage instanceof File)) errs.styled = t('form.required');
    if (Object.keys(errs).length) {
      setImageError(errs);
      return;
    }
    setImageError({});
    setUploadProgress(0);
    try {
      const fd = buildFormData(values);
      if (isEdit && id) {
        await productUpdate(id, fd, setUploadProgress);
      } else {
        await productCreate(fd, setUploadProgress);
      }
      await queryClient.invalidateQueries({ queryKey: ['admin.productsList'] });
      await queryClient.invalidateQueries({ queryKey: ['admin.products'] });
      await queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
      toast({ title: t('saved'), status: 'success', duration: 3000, position: 'top' });
      navigate('/admin/products');
    } catch {
      toast({ title: t('saveError'), status: 'error', duration: 4000, position: 'top' });
      setUploadProgress(0);
    }
  };

  const onError = () => {
    requestAnimationFrame(() => {
      const firstInvalid = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  if (isEdit && existing.isLoading) {
    return (
      <Box py={16} textAlign="center">
        <Text color="text.muted">{t('form.saving')}…</Text>
      </Box>
    );
  }

  return (
    <>
      {/* Content area — bottom padding so sticky bar never overlaps */}
      <Stack spacing={{ base: 8, md: 10 }} maxW="960px" w="100%" pb={{ base: '160px', md: '100px' }}>
        {/* Page heading */}
        <Box
          bg="bg.surface"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={{ base: 5, md: 6 }}
          py={{ base: 5, md: 6 }}
        >
          <Text fontSize="11px" color="accent.goldDeep" letterSpacing="0.22em" textTransform="uppercase" fontWeight={600} mb={2}>
            {isEdit ? t('form.editEyebrow') : t('form.createEyebrow')}
          </Text>
          <Text fontFamily="heading" fontWeight={500} fontSize={{ base: '24px', md: '28px' }} color="text.primary">
            {isEdit ? `${t('edit')}: ${existing.data?.name_en ?? ''}` : t('addProduct')}
          </Text>
          <Text fontSize="13px" color="text.muted" mt={2} maxW="680px" lineHeight={1.6}>
            {t('form.productFormIntro')}
          </Text>
        </Box>

        <form id="product-form" onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          <Stack spacing={{ base: 8, md: 10 }}>

            {/* ── Section A: Basic Information ─────────────────────────── */}
            <SectionCard
              step="1"
              title={t('form.sectionBasicInfo')}
              description={t('form.sectionBasicDesc')}
            >
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5}>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormControl isInvalid={!!errors.categoryId} isRequired>
                    <FormLabel fontSize="13px" fontWeight={500}>{t('form.category')}</FormLabel>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          size="sm"
                          borderRadius="sm"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          _focus={{ borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' }}
                        >
                          <option value="">{t('form.selectCategory')}</option>
                          {(cats.data ?? []).map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name_en} / {c.name_ar}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    {!errors.categoryId && (
                      <Text fontSize="11px" color="text.muted" mt={1.5}>
                        {t('form.categoryHelper')}
                      </Text>
                    )}
                    <FormErrorMessage fontSize="11px">{errors.categoryId?.message}</FormErrorMessage>
                  </FormControl>
                </GridItem>
                <TextField label={t('form.nameEn')} helper={t('form.nameEnHelper')} isRequired error={errors.nameEn?.message} {...register('nameEn')} />
                <TextField label={t('form.nameAr')} helper={t('form.nameArHelper')} isRequired error={errors.nameAr?.message} {...register('nameAr')} dir="rtl" />
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <TextareaField label={t('form.descEn')} helper={t('form.descEnHelper')} error={errors.descriptionEn?.message} {...register('descriptionEn')} />
                </GridItem>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <TextareaField label={t('form.descAr')} helper={t('form.descArHelper')} error={errors.descriptionAr?.message} {...register('descriptionAr')} dir="rtl" />
                </GridItem>
              </Grid>
            </SectionCard>

            {/* ── Section B: Images ─────────────────────────────────────── */}
            <SectionCard
              step="2"
              title={t('form.sectionImages')}
              description={t('form.sectionImagesDesc')}
            >
              <Box maxW="520px">
                <ImageDropZone
                  label={t('form.styledImage')}
                  hint={t('form.styledImageHint')}
                  value={styledImage}
                  onChange={(f) => { setStyledImage(f); setImageError((e) => ({ ...e, styled: undefined })); }}
                  error={imageError.styled}
                />
              </Box>
            </SectionCard>

            {/* ── Section C: Pricing & Sizes ───────────────────────────── */}
            <SectionCard
              step="3"
              title={t('form.sectionPricing')}
              description={t('form.sectionPricingDesc')}
            >
              <Stack spacing={6}>
                {/* Base price */}
                <Stack spacing={1}>
                  <Controller
                    name="basePrice"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        label={t('form.basePrice')}
                        isRequired
                        error={errors.basePrice?.message}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <Text fontSize="11px" color="text.muted">{t('form.basePriceHelper')}</Text>
                </Stack>

                {/* Variant rows */}
                <Box
                  bg="bg.canvas"
                  border="1px solid"
                  borderColor={errors.hasVariants ? 'red.300' : 'border.subtle'}
                  borderRadius="md"
                  p={5}
                >
                  {/* Sub-header */}
                  <Text fontSize="12px" fontWeight={600} letterSpacing="0.14em" textTransform="uppercase" color="text.muted" mb={1}>
                    {t('form.variantSectionTitle')}
                  </Text>
                  <Text fontSize="11px" color="text.muted" lineHeight={1.5} mb={4}>
                    {t('form.variantSectionHelper')}
                  </Text>
                  {errors.hasVariants?.message && (
                    <Text fontSize="12px" color="red.500" mb={4}>
                      {errors.hasVariants.message}
                    </Text>
                  )}
                  <Stack spacing={3}>
                    {SIZES.map((size) => (
                      <VariantRow
                        key={size}
                        size={size}
                        control={control}
                        watch={watch}
                        errors={errors}
                        t={t}
                        variantImage={variantImages[size]}
                        onVariantImageChange={handleVariantImageChange}
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </SectionCard>

            {/* ── Section D: Visibility & Order ────────────────────────── */}
            <SectionCard
              step="4"
              title={t('form.sectionVisibility')}
              description={t('form.sectionVisibilityDesc')}
            >
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
                {/* isAvailable */}
                <Controller
                  name="isAvailable"
                  control={control}
                  render={({ field }) => (
                    <SwitchField
                      id="isAvailable"
                      colorScheme="green"
                      label={t('form.isAvailable')}
                      helper={t('form.isAvailableHelper')}
                      isChecked={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
                {/* isFeatured */}
                <Controller
                  name="isFeatured"
                  control={control}
                  render={({ field }) => (
                    <SwitchField
                      id="isFeatured"
                      colorScheme="yellow"
                      label={t('form.isFeatured')}
                      helper={t('form.isFeaturedHelper')}
                      isChecked={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
                {/* isNew */}
                <Controller
                  name="isNew"
                  control={control}
                  render={({ field }) => (
                    <SwitchField
                      id="isNew"
                      colorScheme="yellow"
                      label={t('form.isNew')}
                      helper={t('form.isNewHelper')}
                      isChecked={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
                {/* Display order */}
                <Box>
                  <Controller
                    name="order"
                    control={control}
                    render={({ field }) => (
                      <NumberField
                        label={t('form.orderField')}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.order?.message}
                      />
                    )}
                  />
                  <Text fontSize="11px" color="text.muted" mt={1.5} lineHeight={1.4}>
                    {t('form.orderHelper')}
                  </Text>
                </Box>
              </SimpleGrid>
            </SectionCard>

            {/* Upload progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Box>
                <Text fontSize="12px" color="text.muted" mb={2}>
                  {t('form.uploading')} {uploadProgress}%
                </Text>
                <Progress value={uploadProgress} size="xs" colorScheme="yellow" borderRadius="full" />
              </Box>
            )}

          </Stack>
        </form>
      </Stack>

      {/* ── Sticky action bar ─────────────────────────────────────────────── */}
      <Box
        position="fixed"
        bottom={0}
        insetInlineStart={{ base: 0, md: '220px' }}
        insetInlineEnd={0}
        zIndex={20}
        bg="bg.surface"
        borderTop="1px solid"
        borderColor="border.subtle"
        boxShadow="0 -4px 20px rgba(0,0,0,0.06)"
        px={{ base: 4, md: 8 }}
        py={{ base: 3, md: 4 }}
      >
        <Flex
          justify="space-between"
          align={{ base: 'stretch', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 4 }}
          maxW="900px"
        >
          {/* Left: unsaved indicator */}
          {isDirty ? (
            <HStack spacing={2}>
              <Box w="6px" h="6px" borderRadius="full" bg="accent.gold" flexShrink={0} />
              <Text fontSize="12px" color="text.muted" letterSpacing="0.02em">
                {t('unsavedChanges')}
              </Text>
            </HStack>
          ) : (
            <Box />
          )}

          {/* Right: action buttons */}
          <HStack spacing={3} justify="flex-end">
            <Button
              variant="ghostGold"
              size="sm"
              onClick={() => navigate('/admin/products')}
              isDisabled={isSubmitting}
              flex={{ base: 1, sm: '0 0 auto' }}
            >
              {t('cancel')}
            </Button>
            <Button
              form="product-form"
              type="submit"
              bg="warm.black"
              color="accent.gold"
              border="1px solid"
              borderColor="accent.gold"
              size="md"
              isLoading={isSubmitting}
              loadingText={uploadProgress > 0 ? `${t('form.uploading')} ${uploadProgress}%` : t('form.saving')}
              _hover={{ bg: 'accent.gold', color: 'warm.black' }}
              transition="all 300ms"
              flex={{ base: 1, sm: '0 0 auto' }}
            >
              {t('form.saveProduct')}
            </Button>
          </HStack>
        </Flex>
      </Box>
    </>
  );
}

// ─── SwitchField ──────────────────────────────────────────────────────────────

function SwitchField({
  id,
  colorScheme,
  label,
  helper,
  isChecked,
  onChange,
}: {
  id: string;
  colorScheme: string;
  label: string;
  helper?: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <HStack spacing={3} align="flex-start">
      <Switch
        id={id}
        colorScheme={colorScheme}
        isChecked={isChecked}
        onChange={(e) => onChange(e.target.checked)}
        mt="3px"
        flexShrink={0}
      />
      <Box>
        <FormLabel htmlFor={id} mb={0.5} fontSize="13px" fontWeight={500} cursor="pointer" lineHeight={1.3}>
          {label}
        </FormLabel>
        {helper && (
          <Text fontSize="11px" color="text.muted" lineHeight={1.4}>
            {helper}
          </Text>
        )}
      </Box>
    </HStack>
  );
}

// ─── Variant Image Picker ─────────────────────────────────────────────────────

interface VariantImagePickerProps {
  image: File | string | null;
  onChange: (img: File | null) => void;
  label: string;
  error?: string;
  helper: string;
}

function VariantImagePicker({ image, onChange, label, error, helper }: VariantImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(image ?? null);
      return undefined;
    }
  }, [image]);

  return (
    <Box flexShrink={0}>
      <Text fontSize="11px" color="text.muted" mb={1.5} letterSpacing="0.06em">
        {label}
      </Text>
      <Box
        w="80px"
        h="80px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        border="1px dashed"
        borderColor={error ? 'red.400' : preview ? 'accent.gold' : 'border.subtle'}
        bg="bg.canvas"
        overflow="hidden"
        cursor="pointer"
        position="relative"
        transition="border-color 200ms"
        onClick={() => inputRef.current?.click()}
        _hover={{ borderColor: 'accent.goldDeep' }}
        role="button"
        aria-label={label}
      >
        {preview ? (
          <Box
            as="img"
            src={preview}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Text color="text.muted" fontSize="22px" lineHeight={1}>+</Text>
        )}
      </Box>
      <Box
        ref={inputRef}
        as="input"
        type="file"
        accept="image/*"
        display="none"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0] ?? null;
          onChange(file);
          e.currentTarget.value = '';
        }}
      />
      {error && (
        <Text fontSize="11px" color="red.500" mt={1} maxW="180px">
          {error}
        </Text>
      )}
      <Text fontSize="10px" color="text.muted" mt={1} maxW="180px" lineHeight={1.4}>
        {helper}
      </Text>
    </Box>
  );
}

// ─── Variant Row ──────────────────────────────────────────────────────────────

function VariantRow({
  size,
  control,
  watch,
  errors,
  t,
  variantImage,
  onVariantImageChange,
}: {
  size: SizeKey;
  control: Control<FormValues>;
  watch: UseFormWatch<FormValues>;
  errors: FieldErrors<FormValues>;
  t: (key: string) => string;
  variantImage: File | string | null;
  onVariantImageChange: (size: SizeKey, img: File | string | null) => void;
}) {
  const enabled = watch(`${size}.enabled` as const);
  const sizeErrors = errors[size] as Record<string, { message?: string }> | undefined;
  const sizeLabel = t(`form.size${size[0].toUpperCase()}${size.slice(1)}`);

  return (
    <Box
      p={{ base: 4, md: 5 }}
      bg={enabled ? 'rgba(201,169,97,0.05)' : 'transparent'}
      borderRadius="md"
      border="1px solid"
      borderColor={sizeErrors?.price || sizeErrors?.image ? 'red.300' : enabled ? 'border.gold' : 'border.subtle'}
      transition="all 300ms"
    >
      <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={4}>
        <Controller
          name={`${size}.enabled` as const}
          control={control}
          render={({ field }) => (
            <Checkbox
              isChecked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              colorScheme="yellow"
              alignItems="flex-start"
            >
              <Box>
                <Text fontSize="14px" fontWeight={600}>{sizeLabel}</Text>
                <Text fontSize="11px" color="text.muted" mt={0.5} lineHeight={1.4}>
                  {enabled ? t('form.sizeEnabledHelper') : t('form.sizeDisabledHelper')}
                </Text>
              </Box>
            </Checkbox>
          )}
        />
        <Text
          display={{ base: 'none', md: 'block' }}
          fontSize="11px"
          color={enabled ? 'accent.goldDeep' : 'text.muted'}
          letterSpacing="0.16em"
          textTransform="uppercase"
          flexShrink={0}
        >
          {enabled ? t('form.enabled') : t('form.disabled')}
        </Text>
      </Flex>

      {enabled && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={5} alignItems="start">
          <Box>
              <Controller
                name={`${size}.price` as const}
                control={control}
                render={({ field }) => (
                  <NumberField
                    label={t('form.variantPrice') + ' (SAR)'}
                    value={field.value ?? 0}
                    onChange={field.onChange}
                    error={sizeErrors?.price?.message}
                  />
                )}
              />
            </Box>
          <Box
            bg="bg.surface"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="md"
            p={4}
            minH="82px"
          >
            <Controller
              name={`${size}.isAvailable` as const}
              control={control}
              render={({ field }) => (
                <HStack spacing={3} align="flex-start">
                  <Switch
                    size="sm"
                    colorScheme="green"
                    isChecked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <Box>
                    <Text fontSize="12px" fontWeight={500}>{t('form.variantAvailable')}</Text>
                    <Text fontSize="11px" color="text.muted" mt={1} lineHeight={1.4}>
                      {t('form.variantAvailableHelper')}
                    </Text>
                  </Box>
                </HStack>
              )}
            />
          </Box>
            <Box minW={0}>
              <VariantImagePicker
                image={variantImage}
                onChange={(img) => onVariantImageChange(size, img)}
                label={t('form.variantImage')}
                error={sizeErrors?.image?.message}
                helper={t('form.variantImageHelper')}
              />
            </Box>
        </SimpleGrid>
      )}
    </Box>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
      <Flex px={{ base: 5, md: 6 }} py={5} borderBottom="1px solid" borderColor="border.subtle" gap={4} align="flex-start">
        <Box
          w="32px"
          h="32px"
          borderRadius="full"
          bg="warm.black"
          color="accent.gold"
          display="grid"
          placeItems="center"
          fontSize="13px"
          fontWeight={600}
          flexShrink={0}
        >
          {step}
        </Box>
        <Box>
          <Text fontFamily="heading" fontWeight={500} fontSize="20px" color="text.primary" lineHeight={1.2}>
            {title}
          </Text>
          {description && (
            <Text fontSize="12px" color="text.muted" mt={1.5} lineHeight={1.6}>
              {description}
            </Text>
          )}
        </Box>
      </Flex>
      <Box p={{ base: 5, md: 6 }}>{children}</Box>
    </Box>
  );
}
