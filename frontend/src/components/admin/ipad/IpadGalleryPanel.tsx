import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X } from 'lucide-react';

import ConfirmModal from '../ConfirmModal';
import { saveErrorMessage } from '../../../lib/apiErrors';
import { prepareImageForUpload } from '../../../lib/imageUpload';
import { thumbnailUrl } from '../../../lib/images';
import {
  IPAD_QUERY_KEY,
  ipadGalleryDelete,
  ipadGalleryUpload,
  ipadSettingsUpdate,
  type IpadAdminData,
  type IpadGalleryImage,
  type IpadSettings,
} from '../../../lib/ipad';

const FOCUS = { borderColor: 'accent.gold', boxShadow: '0 0 0 1px rgba(201,169,97,0.4)' };

export default function IpadGalleryPanel({ data }: { data: IpadAdminData }) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IpadGalleryImage | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: IPAD_QUERY_KEY });

  const removal = useMutation({
    mutationFn: (image: IpadGalleryImage) => ipadGalleryDelete(image.id),
    onSuccess: () => {
      toast({ title: t('deleteSuccess'), status: 'success', duration: 2500, position: 'top' });
      setDeleteTarget(null);
      void refresh();
    },
    onError: (error) => toast({ title: saveErrorMessage(error, t), status: 'error', duration: 5000, position: 'top' }),
  });

  // One request per photo, one after another: a slow connection still makes
  // steady progress and a failure only loses that one photo.
  const upload = async (files: File[]) => {
    if (!files.length) return;
    let done = 0;
    setUploading({ done, total: files.length });
    try {
      for (const file of files) {
        const { file: prepared } = await prepareImageForUpload(file);
        await ipadGalleryUpload(prepared);
        done += 1;
        setUploading({ done, total: files.length });
      }
      toast({ title: t('ipad.gallery.uploaded', { count: done }), status: 'success', duration: 3000, position: 'top' });
    } catch (error) {
      toast({ title: saveErrorMessage(error, t), status: 'error', duration: 6000, position: 'top', isClosable: true });
    } finally {
      setUploading(null);
      void refresh();
    }
  };

  return (
    <Stack spacing={5}>
      <GalleryTitles key={JSON.stringify(data.settings)} settings={data.settings} />

      <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={{ base: 4, md: 5 }}>
        <Flex justify="space-between" align="center" gap={3} wrap="wrap" mb={4}>
          <Box>
            <Text fontSize="14px" fontWeight={600}>{t('ipad.gallery.count', { count: data.gallery.length })}</Text>
            <Text fontSize="11px" color="text.muted">{t('ipad.gallery.hint')}</Text>
          </Box>
          <Button
            variant="blackGold"
            size="sm"
            leftIcon={<ImagePlus size={14} />}
            isLoading={!!uploading}
            loadingText={uploading ? t('ipad.gallery.uploading', uploading) : undefined}
            onClick={() => fileInput.current?.click()}
          >
            {t('ipad.gallery.add')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = '';
              void upload(files);
            }}
          />
        </Flex>

        {data.gallery.length === 0 ? (
          <Text fontSize="13px" color="text.muted" textAlign="center" py={8}>{t('ipad.gallery.empty')}</Text>
        ) : (
          <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} spacing={3}>
            {data.gallery.map((image) => (
              <Box
                key={image.id}
                position="relative"
                borderRadius="md"
                overflow="hidden"
                border="1px solid"
                borderColor="border.subtle"
                bg="bg.canvas"
                sx={{ aspectRatio: '1 / 1' }}
              >
                <Box as="img" src={thumbnailUrl(image.image_path, 320) ?? image.image} alt="" loading="lazy" w="100%" h="100%" objectFit="cover" />
                <IconButton
                  aria-label={t('delete')}
                  icon={<X size={13} />}
                  size="xs"
                  position="absolute"
                  top={1.5}
                  insetInlineEnd={1.5}
                  borderRadius="full"
                  bg="rgba(255,253,248,0.92)"
                  color="red.500"
                  _hover={{ bg: 'red.50', color: 'red.600' }}
                  onClick={() => setDeleteTarget(image)}
                />
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removal.mutate(deleteTarget)}
        isLoading={removal.isPending}
        body={t('ipad.gallery.deleteBody')}
      />
    </Stack>
  );
}

/** The page's title and on/off switch (stored with the iPad settings). */
function GalleryTitles({ settings }: { settings: IpadSettings }) {
  const { t } = useTranslation('admin');
  const toast = useToast();
  const queryClient = useQueryClient();
  const [titleAr, setTitleAr] = useState(settings.gallery_title_ar);
  const [titleEn, setTitleEn] = useState(settings.gallery_title_en);

  const save = useMutation({
    mutationFn: (payload: Partial<IpadSettings>) => ipadSettingsUpdate(payload),
    onSuccess: () => {
      toast({ title: t('saved'), status: 'success', duration: 2500, position: 'top' });
      void queryClient.invalidateQueries({ queryKey: IPAD_QUERY_KEY });
    },
    onError: (error) => toast({ title: saveErrorMessage(error, t), status: 'error', duration: 5000, position: 'top' }),
  });
  const dirty = titleAr.trim() !== settings.gallery_title_ar || titleEn.trim() !== settings.gallery_title_en;

  return (
    <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={{ base: 4, md: 5 }}>
      <HStack spacing={3} mb={4}>
        <Switch
          id="ipad-gallery-visible"
          colorScheme="green"
          isChecked={settings.gallery_visible}
          onChange={(e) => save.mutate({ gallery_visible: e.target.checked })}
        />
        <FormLabel htmlFor="ipad-gallery-visible" m={0} fontSize="13px" fontWeight={500} cursor="pointer">
          {t('ipad.gallery.visible')}
        </FormLabel>
      </HStack>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr auto' }} gap={4} alignItems="end">
        <FormControl isRequired>
          <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.gallery.titleAr')}</FormLabel>
          <Input size="sm" borderRadius="sm" _focus={FOCUS} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="13px" fontWeight={500} mb={1}>{t('ipad.gallery.titleEn')}</FormLabel>
          <Input size="sm" borderRadius="sm" dir="ltr" lang="en" _focus={FOCUS} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        </FormControl>
        <Button
          size="sm"
          variant="goldOutline"
          isDisabled={!dirty || !titleAr.trim()}
          isLoading={save.isPending}
          onClick={() => save.mutate({ gallery_title_ar: titleAr.trim(), gallery_title_en: titleEn.trim() })}
        >
          {t('ipad.form.save')}
        </Button>
      </Grid>
    </Box>
  );
}
