import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Button,
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
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ImageDropZone from '../../components/admin/ImageDropZone';
import { TextField, TextareaField, NumberField } from '../../components/admin/AdminFormField';
import { categoriesList, productDetail, productCreate, productUpdate } from '../../lib/api';
import type { VariantSize } from '../../lib/api';

const QUERY_OPTS = { staleTime: 60_000, gcTime: 300_000 } as const;
const SIZE_OPTIONS: VariantSize[] = ['SMALL', 'MEDIUM', 'LARGE'];

const schema = z.object({
  categoryId: z.number().int().positive(),
  nameEn: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  nameAr: z.string().min(1, 'Required').max(200, 'Max 200 characters'),
  descriptionEn: z.string().max(2000).optional().default(''),
  descriptionAr: z.string().max(2000).optional().default(''),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  basePrice: z.number().nonnegative('Must be >= 0'),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  order: z.number().int().nonnegative().default(0),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  categoryId: 0,
  nameEn: '',
  nameAr: '',
  descriptionEn: '',
  descriptionAr: '',
  size: 'LARGE',
  basePrice: 0,
  isFeatured: false,
  isNew: false,
  isAvailable: true,
  order: 0,
};

const sizeToKey = (size: VariantSize) => size.toLowerCase() as 'small' | 'medium' | 'large';

export default function AdminProductFormPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [displayImage, setDisplayImage] = useState<File | string | null>(null);
  const [styledImage, setStyledImage] = useState<File | string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<{ display?: string; styled?: string }>({});

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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema) as Resolver<FormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (!existing.data) return;
    const p = existing.data;
    reset({
      categoryId: p.category.id,
      nameEn: p.name_en,
      nameAr: p.name_ar,
      descriptionEn: p.description_en ?? '',
      descriptionAr: p.description_ar ?? '',
      size: p.size ?? 'LARGE',
      basePrice: Number(p.base_price),
      isFeatured: p.is_featured,
      isNew: p.is_new ?? false,
      isAvailable: p.is_available,
      order: p.order ?? 0,
    });
    setDisplayImage(p.display_image);
    setStyledImage(p.styled_image);
  }, [existing.data, reset]);

  const buildFormData = (values: FormValues): FormData => {
    const fd = new FormData();
    fd.append('category_id', String(values.categoryId));
    fd.append('name_en', values.nameEn);
    fd.append('name_ar', values.nameAr);
    fd.append('description_en', values.descriptionEn ?? '');
    fd.append('description_ar', values.descriptionAr ?? '');
    fd.append('size', values.size);
    fd.append('base_price', String(values.basePrice));
    fd.append('is_featured', values.isFeatured ? 'true' : 'false');
    fd.append('is_new', values.isNew ? 'true' : 'false');
    fd.append('is_available', values.isAvailable ? 'true' : 'false');
    fd.append('order', String(values.order));
    if (displayImage instanceof File) fd.append('display_image', displayImage);
    if (styledImage instanceof File) fd.append('styled_image', styledImage);
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
      if (isEdit && id) await productUpdate(id, fd, setUploadProgress);
      else await productCreate(fd, setUploadProgress);
      await queryClient.invalidateQueries({ queryKey: ['admin.productsList'] });
      await queryClient.invalidateQueries({ queryKey: ['admin.products'] });
      await queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
      await queryClient.invalidateQueries({ queryKey: ['productsList'] });
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
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  if (isEdit && existing.isLoading) {
    return (
      <Box py={16} textAlign="center">
        <Text color="text.muted">{t('form.saving')}</Text>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={{ base: 8, md: 10 }} maxW="960px" w="100%" pb={{ base: '160px', md: '100px' }}>
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
            <SectionCard step="1" title={t('form.sectionBasicInfo')} description={t('form.sectionBasicDesc')}>
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
                            <option key={c.id} value={c.id}>{c.name_en} / {c.name_ar}</option>
                          ))}
                        </Select>
                      )}
                    />
                    {!errors.categoryId && <Text fontSize="11px" color="text.muted" mt={1.5}>{t('form.categoryHelper')}</Text>}
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

            <SectionCard step="2" title={t('form.sectionImages')} description={t('form.sectionImagesDesc')}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
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

            <SectionCard step="3" title={t('form.sectionPricing')} description={t('form.sectionPricingDesc')}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <Controller
                  name="size"
                  control={control}
                  render={({ field }) => (
                    <FormControl isInvalid={!!errors.size} isRequired>
                      <FormLabel fontSize="13px" fontWeight={500}>{t('form.productSize')}</FormLabel>
                      <Select
                        size="sm"
                        borderRadius="sm"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        _focus={{ borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' }}
                      >
                        {SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {tc(`sizes.${sizeToKey(size)}`)} - {tc(`sizes.servings.${sizeToKey(size)}`)}
                          </option>
                        ))}
                      </Select>
                      {!errors.size && <Text fontSize="11px" color="text.muted" mt={1.5}>{t('form.productSizeHelper')}</Text>}
                      <FormErrorMessage fontSize="11px">{errors.size?.message}</FormErrorMessage>
                    </FormControl>
                  )}
                />
                <Controller
                  name="basePrice"
                  control={control}
                  render={({ field }) => (
                    <NumberField
                      label={t('form.basePrice')}
                      helper={t('form.basePriceHelper')}
                      isRequired
                      error={errors.basePrice?.message}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </SimpleGrid>
            </SectionCard>

            <SectionCard step="4" title={t('form.sectionVisibility')} description={t('form.sectionVisibilityDesc')}>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6}>
                <Controller
                  name="isAvailable"
                  control={control}
                  render={({ field }) => (
                    <SwitchField id="isAvailable" colorScheme="green" label={t('form.isAvailable')} helper={t('form.isAvailableHelper')} isChecked={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  name="isFeatured"
                  control={control}
                  render={({ field }) => (
                    <SwitchField id="isFeatured" colorScheme="yellow" label={t('form.isFeatured')} helper={t('form.isFeaturedHelper')} isChecked={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  name="isNew"
                  control={control}
                  render={({ field }) => (
                    <SwitchField id="isNew" colorScheme="yellow" label={t('form.isNew')} helper={t('form.isNewHelper')} isChecked={field.value} onChange={field.onChange} />
                  )}
                />
                <Controller
                  name="order"
                  control={control}
                  render={({ field }) => (
                    <NumberField label={t('form.orderField')} helper={t('form.orderHelper')} value={field.value} onChange={field.onChange} error={errors.order?.message} />
                  )}
                />
              </SimpleGrid>
            </SectionCard>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <Box>
                <Text fontSize="12px" color="text.muted" mb={2}>{t('form.uploading')} {uploadProgress}%</Text>
                <Progress value={uploadProgress} size="xs" colorScheme="yellow" borderRadius="full" />
              </Box>
            )}
          </Stack>
        </form>
      </Stack>

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
        <Flex justify="space-between" align={{ base: 'stretch', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={{ base: 3, sm: 4 }} maxW="900px">
          {isDirty ? (
            <HStack spacing={2}>
              <Box w="6px" h="6px" borderRadius="full" bg="accent.gold" flexShrink={0} />
              <Text fontSize="12px" color="text.muted" letterSpacing="0.02em">{t('unsavedChanges')}</Text>
            </HStack>
          ) : <Box />}
          <HStack spacing={3} justify="flex-end">
            <Button variant="ghostGold" size="sm" onClick={() => navigate('/admin/products')} isDisabled={isSubmitting} flex={{ base: 1, sm: '0 0 auto' }}>
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
      <Switch id={id} colorScheme={colorScheme} isChecked={isChecked} onChange={(e) => onChange(e.target.checked)} mt="3px" flexShrink={0} />
      <Box>
        <FormLabel htmlFor={id} mb={0.5} fontSize="13px" fontWeight={500} cursor="pointer" lineHeight={1.3}>
          {label}
        </FormLabel>
        {helper && <Text fontSize="11px" color="text.muted" lineHeight={1.4}>{helper}</Text>}
      </Box>
    </HStack>
  );
}

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
          {description && <Text fontSize="12px" color="text.muted" mt={1.5} lineHeight={1.6}>{description}</Text>}
        </Box>
      </Flex>
      <Box p={{ base: 5, md: 6 }}>{children}</Box>
    </Box>
  );
}
