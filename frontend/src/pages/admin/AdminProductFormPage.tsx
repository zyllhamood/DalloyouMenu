import { useEffect, useRef, useState } from 'react';
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
});

const schema = z.object({
  categoryId: z.number().int().positive(),
  nameEn: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  nameAr: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  descriptionEn: z.string().max(2000).optional().default(''),
  descriptionAr: z.string().max(2000).optional().default(''),
  basePrice: z.number().nonnegative('Must be ≥ 0'),
  hasVariants: z.boolean().default(false),
  small: variantSchema,
  medium: variantSchema,
  large: variantSchema,
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  order: z.number().int().nonnegative().default(0),
}).superRefine((data, ctx) => {
  if (data.hasVariants) {
    SIZES.forEach((size) => {
      const v = data[size];
      if (v.enabled && (v.price === undefined || v.price < 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price required for enabled size',
          path: [size, 'price'],
        });
      }
    });
  }
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VARIANT = { enabled: false, price: undefined, isAvailable: true };

const defaultValues: FormValues = {
  categoryId: 0,
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  basePrice: 0,
  hasVariants: false,
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

  const [displayImage, setDisplayImage] = useState<File | string | null>(null);
  const [styledImage, setStyledImage] = useState<File | string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<{ display?: string; styled?: string }>({});

  const [variantImages, setVariantImages] = useState<Record<SizeKey, File | string | null>>({
    small: null,
    medium: null,
    large: null,
  });

  const handleVariantImageChange = (size: SizeKey, img: File | null) => {
    setVariantImages((prev) => ({ ...prev, [size]: img }));
  };

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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema) as Resolver<FormValues>,
    defaultValues,
  });

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
      hasVariants: sizes.length > 0,
      small: sm ? { enabled: true, price: sm.price, isAvailable: sm.is_available ?? true } : { ...DEFAULT_VARIANT },
      medium: md ? { enabled: true, price: md.price, isAvailable: true } : { ...DEFAULT_VARIANT },
      large: lg ? { enabled: true, price: lg.price, isAvailable: true } : { ...DEFAULT_VARIANT },
      isFeatured: p.is_featured,
      isNew: p.is_new ?? false,
      isAvailable: p.is_available,
      order: 0,
    });
    setDisplayImage(p.display_image);
    setStyledImage(p.styled_image);
    const imgs: Record<SizeKey, File | string | null> = { small: null, medium: null, large: null };
    (p.sizes ?? []).forEach((s) => { if (s.image) imgs[s.size] = s.image; });
    setVariantImages(imgs);
  }, [existing.data, reset]);

  const hasVariants = watch('hasVariants');

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
    if (displayImage instanceof File) fd.append('display_image', displayImage);
    if (styledImage instanceof File) fd.append('styled_image', styledImage);
    const variantList = values.hasVariants
      ? SIZES.filter((s) => values[s].enabled).map((s) => ({
          size: s.toUpperCase(),
          price: values[s].price ?? 0,
          is_available: values[s].isAvailable,
        }))
      : [];
    fd.append('variants', JSON.stringify(variantList));
    SIZES.forEach((s) => {
      const img = variantImages[s];
      if (img instanceof File) fd.append(`variant_${s.toUpperCase()}_image`, img);
    });
    return fd;
  };

  const onSubmit = async (values: FormValues) => {
    const errs: typeof imageError = {};
    if (!displayImage) errs.display = t('form.required');
    if (!styledImage) errs.styled = t('form.required');
    if (!isEdit && !(displayImage instanceof File)) errs.display = t('form.required');
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
      <Stack spacing={12} maxW="900px" pb="100px">
        {/* Page heading */}
        <Box>
          <Text fontFamily="heading" fontWeight={500} fontSize={{ base: '24px', md: '28px' }} color="text.primary">
            {isEdit ? `${t('edit')}: ${existing.data?.name_en ?? ''}` : t('addProduct')}
          </Text>
        </Box>

        <form id="product-form" onSubmit={handleSubmit(onSubmit, onError)} noValidate>
          <Stack spacing={12}>

            {/* ── Section A: Basic Information ─────────────────────────── */}
            <SectionCard
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
                    <FormErrorMessage fontSize="11px">{errors.categoryId?.message}</FormErrorMessage>
                  </FormControl>
                </GridItem>
                <TextField label={t('form.nameEn')} isRequired error={errors.nameEn?.message} {...register('nameEn')} />
                <TextField label={t('form.nameAr')} isRequired error={errors.nameAr?.message} {...register('nameAr')} dir="rtl" />
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Stack spacing={1}>
                    <TextareaField label={t('form.descEn')} error={errors.descriptionEn?.message} {...register('descriptionEn')} />
                    <Text fontSize="11px" color="text.muted">{t('form.descEnHelper')}</Text>
                  </Stack>
                </GridItem>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <Stack spacing={1}>
                    <TextareaField label={t('form.descAr')} error={errors.descriptionAr?.message} {...register('descriptionAr')} dir="rtl" />
                    <Text fontSize="11px" color="text.muted">{t('form.descArHelper')}</Text>
                  </Stack>
                </GridItem>
              </Grid>
            </SectionCard>

            {/* ── Section B: Images ─────────────────────────────────────── */}
            <SectionCard
              title={t('form.sectionImages')}
              description={t('form.sectionImagesDesc')}
            >
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <ImageDropZone
                  label={t('form.displayImage')}
                  hint={t('form.displayImageHint')}
                  value={displayImage}
                  onChange={(f) => { setDisplayImage(f); setImageError((e) => ({ ...e, display: undefined })); }}
                  error={imageError.display}
                />
                <ImageDropZone
                  label={t('form.styledImage')}
                  hint={t('form.styledImageHint')}
                  value={styledImage}
                  onChange={(f) => { setStyledImage(f); setImageError((e) => ({ ...e, styled: undefined })); }}
                  error={imageError.styled}
                />
              </SimpleGrid>
            </SectionCard>

            {/* ── Section C: Pricing & Sizes ───────────────────────────── */}
            <SectionCard
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

                {/* Variants toggle */}
                <Controller
                  name="hasVariants"
                  control={control}
                  render={({ field }) => (
                    <HStack spacing={3}>
                      <Switch
                        id="hasVariants"
                        colorScheme="yellow"
                        isChecked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <FormLabel htmlFor="hasVariants" mb={0} fontSize="13px" fontWeight={500} cursor="pointer">
                        {t('form.hasVariants')}
                      </FormLabel>
                    </HStack>
                  )}
                />

                {/* Variant rows */}
                {hasVariants && (
                  <Box
                    bg="bg.canvas"
                    border="1px solid"
                    borderColor="border.subtle"
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
                )}
              </Stack>
            </SectionCard>

            {/* ── Section D: Visibility & Order ────────────────────────── */}
            <SectionCard
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
        px={{ base: 5, md: 8 }}
        py={4}
      >
        <Flex
          justify="space-between"
          align="center"
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
          <HStack spacing={3}>
            <Button
              variant="ghostGold"
              size="sm"
              onClick={() => navigate('/admin/products')}
              isDisabled={isSubmitting}
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
}

function VariantImagePicker({ image, onChange, label }: VariantImagePickerProps) {
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
        borderColor={preview ? 'accent.gold' : 'border.subtle'}
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
  onVariantImageChange: (size: SizeKey, img: File | null) => void;
}) {
  const enabled = watch(`${size}.enabled` as const);
  const sizeErrors = errors[size] as Record<string, { message?: string }> | undefined;

  return (
    <Box
      p={3}
      bg={enabled ? 'rgba(201,169,97,0.05)' : 'transparent'}
      borderRadius="sm"
      border="1px solid"
      borderColor={enabled ? 'border.gold' : 'border.subtle'}
      transition="all 300ms"
    >
      <Flex align="center" gap={4} wrap="wrap">
        <Controller
          name={`${size}.enabled` as const}
          control={control}
          render={({ field }) => (
            <Checkbox
              isChecked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              colorScheme="yellow"
              minW="80px"
            >
              <Text fontSize="13px" fontWeight={500} textTransform="capitalize">{size}</Text>
            </Checkbox>
          )}
        />
        {enabled && (
          <>
            <Box flex={1} minW="120px">
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
            <Controller
              name={`${size}.isAvailable` as const}
              control={control}
              render={({ field }) => (
                <HStack spacing={2}>
                  <Switch
                    size="sm"
                    colorScheme="green"
                    isChecked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <Text fontSize="12px" color="text.muted">{t('form.variantAvailable')}</Text>
                </HStack>
              )}
            />
            <Box>
              <VariantImagePicker
                image={variantImage}
                onChange={(img) => onVariantImageChange(size, img)}
                label={t('form.variantImage')}
              />
              <Text fontSize="10px" color="text.muted" mt={1} maxW="80px" lineHeight={1.3} textAlign="center">
                {t('form.variantImageHelper')}
              </Text>
            </Box>
          </>
        )}
      </Flex>
    </Box>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
      <Box px={6} py={5} borderBottom="1px solid" borderColor="border.subtle">
        <Text fontFamily="heading" fontWeight={500} fontSize="20px" color="text.primary" lineHeight={1.2}>
          {title}
        </Text>
        {description && (
          <Text fontSize="12px" color="text.muted" mt={1.5} lineHeight={1.5}>
            {description}
          </Text>
        )}
      </Box>
      <Box p={6}>{children}</Box>
    </Box>
  );
}
