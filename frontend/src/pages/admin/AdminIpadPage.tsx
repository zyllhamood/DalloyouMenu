import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Plus } from 'lucide-react';

import IpadCategoriesPanel from '../../components/admin/ipad/IpadCategoriesPanel';
import IpadGalleryPanel from '../../components/admin/ipad/IpadGalleryPanel';
import IpadItemModal from '../../components/admin/ipad/IpadItemModal';
import IpadItemsPanel from '../../components/admin/ipad/IpadItemsPanel';
import IpadSettingsPanel from '../../components/admin/ipad/IpadSettingsPanel';
import { IPAD_QUERY_KEY, IPAD_SITE_URL, fetchIpadAdmin, type IpadItem } from '../../lib/ipad';

interface ModalState {
  /** Bumped on every open so the form starts fresh. */
  key: number;
  item: IpadItem | null;
  categoryId?: number;
  productId?: number;
}

const TAB_STYLE = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'text.muted',
  px: { base: 3, md: 4 },
  _selected: { color: 'text.primary', borderColor: 'accent.gold', fontWeight: 600 },
} as const;

export default function AdminIpadPage() {
  const { t } = useTranslation('admin');
  const query = useQuery({ queryKey: IPAD_QUERY_KEY, queryFn: fetchIpadAdmin, staleTime: 30_000 });
  const [modal, setModal] = useState<ModalState | null>(null);

  const open = (next: Omit<ModalState, 'key'>) => setModal((prev) => ({ ...next, key: (prev?.key ?? 0) + 1 }));
  const data = query.data;
  const itemCount = data?.categories.reduce((n, c) => n + c.items.length, 0) ?? 0;

  return (
    <Stack spacing={6}>
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={4}>
        <Box maxW="640px">
          <Text fontFamily="heading" fontWeight={500} fontSize={{ base: '24px', md: '28px' }} lineHeight={1.1}>
            {t('ipad.title')}
          </Text>
          <Text fontSize="13px" color="text.muted" mt={2} lineHeight={1.7}>{t('ipad.subtitle')}</Text>
        </Box>
        <HStack spacing={3}>
          <Button
            as="a"
            href={IPAD_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="goldOutline"
            size="sm"
            h="38px"
            leftIcon={<ExternalLink size={14} />}
          >
            {t('ipad.openIpad')}
          </Button>
          <Button
            variant="blackGold"
            size="sm"
            h="38px"
            leftIcon={<Plus size={14} />}
            isDisabled={!data?.categories.length}
            onClick={() => open({ item: null })}
          >
            {t('ipad.addItem')}
          </Button>
        </HStack>
      </Flex>

      {query.isLoading ? (
        <Stack spacing={3}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} h="72px" borderRadius="lg" startColor="warm.cream" endColor="border.subtle" />
          ))}
        </Stack>
      ) : !data ? (
        <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" py={12} textAlign="center">
          <Text fontSize="14px" color="text.muted" mb={4}>{t('ipad.loadError')}</Text>
          <Button size="sm" variant="goldOutline" onClick={() => void query.refetch()}>{t('ipad.retry')}</Button>
        </Box>
      ) : (
        <Tabs variant="line" isLazy>
          <TabList borderColor="border.subtle" overflowX="auto" overflowY="hidden">
            <Tab {...TAB_STYLE}>
              {t('ipad.tabs.items')}
              <Badge ms={2} variant="subtle" colorScheme="yellow" borderRadius="full">{itemCount}</Badge>
            </Tab>
            <Tab {...TAB_STYLE}>
              {t('ipad.tabs.categories')}
              <Badge ms={2} variant="subtle" colorScheme="yellow" borderRadius="full">{data.categories.length}</Badge>
            </Tab>
            <Tab {...TAB_STYLE}>
              {t('ipad.tabs.gallery')}
              <Badge ms={2} variant="subtle" colorScheme="yellow" borderRadius="full">{data.gallery.length}</Badge>
            </Tab>
            <Tab {...TAB_STYLE}>{t('ipad.tabs.settings')}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0} pt={6}>
              <IpadItemsPanel
                data={data}
                onAdd={({ categoryId, productId }) => open({ item: null, categoryId, productId })}
                onEdit={(item) => open({ item })}
              />
            </TabPanel>
            <TabPanel px={0} pt={6}>
              <IpadCategoriesPanel data={data} />
            </TabPanel>
            <TabPanel px={0} pt={6}>
              <IpadGalleryPanel data={data} />
            </TabPanel>
            <TabPanel px={0} pt={6}>
              <IpadSettingsPanel key={JSON.stringify(data.settings)} settings={data.settings} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {modal && data && (
        <IpadItemModal
          key={modal.key}
          data={data}
          item={modal.item}
          presetCategoryId={modal.categoryId}
          presetProductId={modal.productId}
          onClose={() => setModal(null)}
        />
      )}
    </Stack>
  );
}
