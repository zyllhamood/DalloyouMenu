import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Select,
  SimpleGrid,
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
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Monitor, Smartphone, Tablet, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StatCard from '../../components/admin/StatCard';
import { adminVisitStats, type VisitDevice } from '../../lib/api';

const QUERY_OPTS = { staleTime: 30_000, gcTime: 120_000 } as const;
const DEVICE_OPTIONS: Array<VisitDevice | 'all'> = ['all', 'desktop', 'mobile', 'tablet', 'other'];
const DAYS_OPTIONS = [7, 30, 90, 365] as const;
const RECENT_PAGE_SIZE = 10;

function deviceIcon(device: VisitDevice | 'all') {
  if (device === 'mobile') return <Smartphone size={18} />;
  if (device === 'tablet') return <Tablet size={18} />;
  if (device === 'desktop') return <Monitor size={18} />;
  return <Activity size={18} />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function AdminVisitsPage() {
  const { t } = useTranslation('admin');
  const [days, setDays] = useState(30);
  const [device, setDevice] = useState<VisitDevice | 'all'>('all');
  const [unique, setUnique] = useState(false);
  const [recentPage, setRecentPage] = useState(1);

  useEffect(() => {
    setRecentPage(1);
  }, [days, device, unique]);

  const visits = useQuery({
    queryKey: ['admin.visits', { days, device, unique, recentPage }],
    queryFn: () => adminVisitStats({
      days,
      device,
      unique,
      recentPage,
      recentPageSize: RECENT_PAGE_SIZE,
    }),
    ...QUERY_OPTS,
  });

  const maxDaily = useMemo(
    () => Math.max(1, ...(visits.data?.daily ?? []).map((row) => row.count)),
    [visits.data?.daily],
  );

  return (
    <Stack spacing={6}>
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={4}>
        <Box>
          <Heading as="h1" fontFamily="heading" fontWeight={500} fontSize={{ base: '26px', md: '32px' }}>
            {t('visits.title')}
          </Heading>
          <Text fontSize="13px" color="text.muted" mt={1}>
            {t('visits.subtitle')}
          </Text>
        </Box>
        <HStack spacing={3} wrap="wrap">
          <Select
            size="sm"
            w="150px"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            borderRadius="sm"
            bg="bg.surface"
          >
            {DAYS_OPTIONS.map((value) => (
              <option key={value} value={value}>{t(`visits.days.${value}`)}</option>
            ))}
          </Select>
          <Select
            size="sm"
            w="150px"
            value={device}
            onChange={(e) => setDevice(e.target.value as VisitDevice | 'all')}
            borderRadius="sm"
            bg="bg.surface"
          >
            {DEVICE_OPTIONS.map((value) => (
              <option key={value} value={value}>{t(`visits.devices.${value}`)}</option>
            ))}
          </Select>
          <HStack
            as="label"
            spacing={2}
            px={3}
            h="32px"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="sm"
            bg="bg.surface"
            cursor="pointer"
          >
            <Switch size="sm" colorScheme="yellow" isChecked={unique} onChange={(e) => setUnique(e.target.checked)} />
            <Text fontSize="12px" color="text.muted">{t('visits.uniqueOnly')}</Text>
          </HStack>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 5 }} spacing={4}>
        <StatCard
          label={t('visits.stats.total')}
          value={visits.data?.totals.total}
          isLoading={visits.isLoading}
          accent="accent.gold"
          icon={<Activity size={22} />}
        />
        <StatCard
          label={t('visits.stats.unique')}
          value={visits.data?.totals.unique}
          isLoading={visits.isLoading}
          accent="accent.goldDeep"
          icon={<Users size={22} />}
        />
        <StatCard label={t('visits.devices.mobile')} value={visits.data?.totals.mobile} isLoading={visits.isLoading} accent="#8C7A5E" icon={<Smartphone size={22} />} />
        <StatCard label={t('visits.devices.desktop')} value={visits.data?.totals.desktop} isLoading={visits.isLoading} accent="#6B6B6B" icon={<Monitor size={22} />} />
        <StatCard label={t('visits.devices.tablet')} value={visits.data?.totals.tablet} isLoading={visits.isLoading} accent="#A88A4D" icon={<Tablet size={22} />} />
      </SimpleGrid>

      <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
        <Flex px={6} py={4} borderBottom="1px solid" borderColor="border.subtle" justify="space-between" align="center">
          <Text fontWeight={500} fontSize="14px">{t('visits.daily')}</Text>
          <Button size="xs" variant="ghostGold" onClick={() => void visits.refetch()}>
            {t('visits.refresh')}
          </Button>
        </Flex>
        <Stack spacing={0}>
          {visits.isLoading
            ? [0, 1, 2, 3, 4].map((i) => (
                <Box key={i} px={6} py={4} borderBottom="1px solid" borderColor="border.subtle">
                  <Skeleton h="12px" w="100%" startColor="warm.cream" endColor="border.subtle" />
                </Box>
              ))
            : (visits.data?.daily ?? []).map((row) => (
                <Flex key={row.date} px={6} py={3.5} gap={4} align="center" borderBottom="1px solid" borderColor="border.subtle">
                  <Text fontSize="12px" color="text.muted" w={{ base: '92px', md: '130px' }} flexShrink={0}>
                    {formatDate(row.date)}
                  </Text>
                  <Box flex={1} h="8px" bg="bg.canvas" borderRadius="full" overflow="hidden">
                    <Box h="100%" w={`${Math.max(4, (row.count / maxDaily) * 100)}%`} bg="accent.gold" borderRadius="full" />
                  </Box>
                  <Text fontSize="13px" fontWeight={600} minW="40px" textAlign="end">
                    {row.count}
                  </Text>
                </Flex>
              ))}
          {!visits.isLoading && (visits.data?.daily ?? []).length === 0 && (
            <Box px={6} py={10} textAlign="center">
              <Text fontSize="13px" color="text.muted">{t('visits.empty')}</Text>
            </Box>
          )}
        </Stack>
      </Box>

      <Box bg="bg.surface" border="1px solid" borderColor="border.subtle" borderRadius="lg" overflow="hidden">
        <Flex px={6} py={4} borderBottom="1px solid" borderColor="border.subtle" align="center" justify="space-between" gap={4}>
          <Text fontWeight={500} fontSize="14px">{t('visits.recent')}</Text>
          {visits.data?.recent_pagination && (
            <Text fontSize="12px" color="text.muted">
              {t('page', {
                page: visits.data.recent_pagination.page,
                total: visits.data.recent_pagination.total_pages,
              })}
            </Text>
          )}
        </Flex>
        <Box overflowX="auto">
          <Table size="sm" variant="simple" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <Thead bg="bg.canvas">
              <Tr>
                <Th py={3.5} borderColor="border.subtle" fontSize="10px" color="text.muted">{t('visits.table.time')}</Th>
                <Th py={3.5} borderColor="border.subtle" fontSize="10px" color="text.muted">{t('visits.table.device')}</Th>
                <Th py={3.5} borderColor="border.subtle" fontSize="10px" color="text.muted">{t('visits.table.path')}</Th>
                <Th py={3.5} borderColor="border.subtle" fontSize="10px" color="text.muted">{t('visits.table.visitor')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {visits.isLoading
                ? [0, 1, 2, 3, 4].map((i) => (
                    <Tr key={i}>
                      {[0, 1, 2, 3].map((j) => (
                        <Td key={j} py={4} borderColor="border.subtle"><Skeleton h="12px" startColor="warm.cream" endColor="border.subtle" /></Td>
                      ))}
                    </Tr>
                  ))
                : (visits.data?.recent ?? []).map((visit) => (
                    <Tr key={visit.id} _hover={{ bg: 'bg.canvas' }}>
                      <Td py={4} borderColor="border.subtle" fontSize="12px" color="text.muted" whiteSpace="nowrap" lineHeight={1.6}>
                        {formatDateTime(visit.created_at)}
                      </Td>
                      <Td py={4} borderColor="border.subtle">
                        <HStack spacing={2} align="center" minW="150px">
                          <Box color="accent.goldDeep" display="flex" alignItems="center" flexShrink={0}>{deviceIcon(visit.device_type)}</Box>
                          <Text fontSize="12px" lineHeight={1.6} whiteSpace="nowrap">{t(`visits.devices.${visit.device_type}`)}</Text>
                        </HStack>
                      </Td>
                      <Td py={4} borderColor="border.subtle" fontSize="12px" maxW="280px" lineHeight={1.6}>
                        <Text noOfLines={1}>{visit.path}</Text>
                      </Td>
                      <Td py={4} borderColor="border.subtle" fontSize="11px" color="text.muted" fontFamily="monospace" lineHeight={1.6}>
                        {visit.visitor_id.slice(0, 12)}
                      </Td>
                    </Tr>
                  ))}
            </Tbody>
          </Table>
        </Box>
        {visits.data?.recent_pagination && visits.data.recent_pagination.total_pages > 1 && (
          <Flex px={6} py={3} borderTop="1px solid" borderColor="border.subtle" align="center" justify="space-between">
            <Text fontSize="12px" color="text.muted">
              {visits.data.recent_pagination.count} {t('visits.recent')}
            </Text>
            <HStack spacing={2}>
              <Button
                size="xs"
                variant="goldOutline"
                isDisabled={!visits.data.recent_pagination.has_previous || visits.isFetching}
                onClick={() => setRecentPage((page) => Math.max(1, page - 1))}
              >
                {t('prev')}
              </Button>
              <Button
                size="xs"
                variant="goldOutline"
                isDisabled={!visits.data.recent_pagination.has_next || visits.isFetching}
                onClick={() => setRecentPage((page) => page + 1)}
              >
                {t('next')}
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>
    </Stack>
  );
}
