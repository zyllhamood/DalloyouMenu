import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Checkbox, Flex, FormControl, FormLabel,
  HStack, IconButton, Input, Radio, RadioGroup, SimpleGrid, Skeleton, Stack,
  Tab, TabList, TabPanel, TabPanels, Tabs, Text, useToast,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, CheckCheck, ListChecks, Plus, Repeat2, Trash2, Undo2 } from 'lucide-react';

import ConfirmModal from '../../components/admin/ConfirmModal';
import { saveErrorMessage } from '../../lib/apiErrors';
import {
  createTask, deleteTask, getTaskBoard, getTaskHistory, moveTask, setTaskCompletion,
  type AdminTask, type TaskKind,
} from '../../lib/tasks';

type TaskAction =
  | { type: 'add'; title: string; kind: TaskKind }
  | { type: 'complete'; task: AdminTask; completed: boolean; date: string }
  | { type: 'move'; id: number; direction: 'up' | 'down' }
  | { type: 'delete'; id: number };

const TASK_KEY = ['admin.tasks'] as const;
const PANEL = { bg: 'bg.surface', border: '1px solid', borderColor: 'border.subtle', borderRadius: 'lg' };

export default function AdminTasksPage() {
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const client = useQueryClient();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>('ONCE');
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<AdminTask | null>(null);

  const board = useQuery({
    queryKey: [...TASK_KEY, 'board'],
    queryFn: getTaskBoard,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  const history = useQuery({
    queryKey: [...TASK_KEY, 'history', page],
    queryFn: () => getTaskHistory(page),
    enabled: tab === 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Use server time so the shop's midnight is respected on devices in any timezone.
  useEffect(() => {
    if (!board.data) return;
    const delay = Date.parse(board.data.next_reset_at) - Date.parse(board.data.server_time)
      - (Date.now() - board.dataUpdatedAt);
    const timer = window.setTimeout(() => {
      void client.invalidateQueries({ queryKey: [...TASK_KEY, 'board'] });
    }, Math.max(0, delay) + 100);
    return () => window.clearTimeout(timer);
  }, [board.data, board.dataUpdatedAt, client]);

  const mutation = useMutation({
    mutationFn: async (action: TaskAction) => {
      switch (action.type) {
        case 'add': await createTask(action.title, action.kind); break;
        case 'complete': await setTaskCompletion(action.task.id, action.completed, action.date); break;
        case 'move': await moveTask(action.id, action.direction); break;
        case 'delete': await deleteTask(action.id); break;
      }
    },
    onSuccess: async (_, action) => {
      if (action.type === 'add') {
        setTitle('');
        setTab(0);
        toast({ title: t('tasks.added'), status: 'success', duration: 2000 });
      }
      if (action.type === 'delete') setDeleting(null);
      if (action.type === 'complete' && !action.completed && action.task.kind === 'ONCE'
        && history.data?.results.length === 1 && page > 1) setPage(page - 1);
      await client.invalidateQueries({ queryKey: TASK_KEY });
    },
    onError: (error) => {
      toast({ title: t('saveError'), description: saveErrorMessage(error, t), status: 'error', duration: 6000 });
      void client.invalidateQueries({ queryKey: TASK_KEY });
    },
  });

  const busy = mutation.isPending;
  const formatCompletedAt = (value: string) => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium', timeStyle: 'short', timeZone: board.data?.timezone ?? 'Asia/Riyadh',
  }).format(new Date(value));

  function taskList(tasks: AdminTask[], daily: boolean) {
    return (
      <Box {...PANEL} overflow="hidden">
        <Box px={{ base: 4, md: 5 }} py={5} borderBottom="1px solid" borderColor="border.subtle">
          <HStack spacing={2} mb={2}>
            <Box color="accent.goldDeep">{daily ? <Repeat2 size={19} /> : <ListChecks size={19} />}</Box>
            <Text as="h2" fontWeight={600} fontSize="16px">{t(daily ? 'tasks.daily' : 'tasks.once')}</Text>
            <Badge borderRadius="full" px={2} bg="warm.cream" color="accent.goldDeep">{tasks.length}</Badge>
          </HStack>
          <Text color="text.muted" fontSize="12px">{t(daily ? 'tasks.dailyHint' : 'tasks.onceHint')}</Text>
          {daily && tasks.length > 0 && (
            <Text mt={2} color="accent.goldDeep" fontSize="12px" aria-live="polite">
              {t('tasks.progress', { done: tasks.filter((task) => task.is_completed).length, total: tasks.length })}
            </Text>
          )}
        </Box>
        {tasks.length === 0 ? (
          <Text px={5} py={10} color="text.muted" fontSize="13px" textAlign="center">
            {t(daily ? 'tasks.emptyDaily' : 'tasks.emptyOnce')}
          </Text>
        ) : (
          <Stack as="ul" spacing={0} listStyleType="none" m={0}>
            {tasks.map((task, index) => (
              <Flex as="li" key={task.id} gap={2} px={{ base: 3, md: 5 }} py={3} align="center"
                borderTop={index ? '1px solid' : undefined} borderColor="border.subtle">
                <Checkbox
                  colorScheme="yellow" size="lg" flex={1} minW={0} alignItems="flex-start"
                  isChecked={task.is_completed} isDisabled={busy}
                  onChange={(event) => mutation.mutate({
                    type: 'complete', task, completed: event.target.checked, date: board.data!.today,
                  })}
                  sx={{ '.chakra-checkbox__control': { mt: '3px' }, '.chakra-checkbox__label': { minWidth: 0 } }}
                >
                  <Text fontSize="14px" overflowWrap="anywhere" whiteSpace="pre-wrap"
                    color={task.is_completed ? 'text.muted' : 'text.primary'}
                    textDecoration={task.is_completed ? 'line-through' : 'none'}>
                    {task.title}
                  </Text>
                  {daily && task.is_completed && <Text fontSize="11px" color="text.muted" mt={1}>{t('tasks.doneToday')}</Text>}
                </Checkbox>
                <HStack spacing={0} flexShrink={0}>
                  <IconButton aria-label={t('tasks.moveUp', { name: task.title })} title={t('tasks.up')}
                    icon={<ArrowUp size={16} />} variant="ghostGold" size="sm" minW="36px" minH="40px"
                    isDisabled={busy || index === 0}
                    onClick={() => mutation.mutate({ type: 'move', id: task.id, direction: 'up' })} />
                  <IconButton aria-label={t('tasks.moveDown', { name: task.title })} title={t('tasks.down')}
                    icon={<ArrowDown size={16} />} variant="ghostGold" size="sm" minW="36px" minH="40px"
                    isDisabled={busy || index === tasks.length - 1}
                    onClick={() => mutation.mutate({ type: 'move', id: task.id, direction: 'down' })} />
                  <IconButton aria-label={t('tasks.deleteName', { name: task.title })} title={t('delete')}
                    icon={<Trash2 size={15} />} variant="ghost" color="text.muted" size="sm" minW="36px" minH="40px"
                    isDisabled={busy} onClick={() => setDeleting(task)} />
                </HStack>
              </Flex>
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Text as="h1" fontFamily="heading" fontSize={{ base: '24px', md: '28px' }} fontWeight={500}>
          {t('tasks.title')}
        </Text>
        <Text color="text.muted" fontSize="13px" mt={1}>{t('tasks.subtitle')}</Text>
      </Box>

      <Box as="form" {...PANEL} p={{ base: 4, md: 5 }} onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (title.trim() && !busy) mutation.mutate({ type: 'add', title: title.trim(), kind });
      }}>
        <Flex gap={4} align="end" direction={{ base: 'column', md: 'row' }}>
          <FormControl flex={1} isRequired>
            <FormLabel fontSize="13px" htmlFor="task-title">{t('tasks.newTask')}</FormLabel>
            <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)}
              placeholder={t('tasks.placeholder')} maxLength={500} isDisabled={busy}
              autoComplete="off" bg="bg.canvas" h="44px" fontSize="14px" />
          </FormControl>
          <FormControl w={{ base: 'full', md: 'auto' }}>
            <FormLabel id="task-kind-label" fontSize="13px">{t('tasks.kind')}</FormLabel>
            <RadioGroup aria-labelledby="task-kind-label" value={kind} onChange={(value) => setKind(value as TaskKind)}>
              <HStack spacing={5} minH="44px">
                <Radio value="ONCE" colorScheme="yellow" isDisabled={busy}>{t('tasks.kindOnce')}</Radio>
                <Radio value="DAILY" colorScheme="yellow" isDisabled={busy}>{t('tasks.kindDaily')}</Radio>
              </HStack>
            </RadioGroup>
          </FormControl>
          <Button type="submit" leftIcon={<Plus size={17} />} variant="solid" bg="warm.black" color="accent.gold"
            _hover={{ bg: 'accent.gold', color: 'warm.black' }} h="44px" px={7} w={{ base: 'full', md: 'auto' }}
            isDisabled={busy || !title.trim()} isLoading={busy && mutation.variables?.type === 'add'} flexShrink={0}>
            {t('tasks.add')}
          </Button>
        </Flex>
      </Box>

      <Tabs index={tab} onChange={setTab} colorScheme="yellow" isLazy>
        <TabList borderColor="border.subtle" mb={5}>
          <Tab fontSize="14px" gap={2}><ListChecks size={17} />{t('tasks.active')}</Tab>
          <Tab fontSize="14px" gap={2}><CheckCheck size={17} />{t('tasks.history')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            {board.isError && (
              <Alert status="error" mb={4} borderRadius="md" flexWrap="wrap" gap={2}>
                <AlertIcon /><Text flex={1} fontSize="13px">{t('tasks.loadError')}</Text>
                <Button size="sm" onClick={() => void board.refetch()}>{t('tasks.retry')}</Button>
              </Alert>
            )}
            {board.isPending ? <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}><Skeleton h="220px" /><Skeleton h="220px" /></SimpleGrid>
              : board.data && (
                <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
                  {taskList(board.data.daily, true)}
                  {taskList(board.data.once, false)}
                </SimpleGrid>
              )}
          </TabPanel>
          <TabPanel p={0}>
            <Box {...PANEL} p={{ base: 4, md: 5 }}>
              <Text as="h2" fontWeight={600} mb={1}>{t('tasks.history')}</Text>
              <Text color="text.muted" fontSize="12px" mb={5}>{t('tasks.historyHint')}</Text>
              {history.isPending ? <Skeleton h="120px" /> : history.isError ? (
                <Alert status="error" borderRadius="md" flexWrap="wrap" gap={2}>
                  <AlertIcon /><Text flex={1}>{t('tasks.loadError')}</Text>
                  <Button size="sm" onClick={() => void history.refetch()}>{t('tasks.retry')}</Button>
                </Alert>
              ) : history.data?.results.length === 0 ? (
                <Text color="text.muted" textAlign="center" py={8} fontSize="13px">{t('tasks.emptyHistory')}</Text>
              ) : (
                <Stack as="ul" listStyleType="none" spacing={0} m={0}>
                  {history.data?.results.map((task) => (
                    <Flex as="li" key={task.id} gap={3} align="center" py={4} borderBottom="1px solid" borderColor="border.subtle">
                      <Box color="accent.goldDeep" flexShrink={0}><CheckCheck size={18} /></Box>
                      <Box flex={1} minW={0}>
                        <Text fontSize="14px" overflowWrap="anywhere" whiteSpace="pre-wrap">{task.title}</Text>
                        <Text fontSize="11px" color="text.muted" mt={1}>
                          {t('tasks.completedAt', { date: formatCompletedAt(task.completed_at!) })}
                        </Text>
                      </Box>
                      <IconButton aria-label={t('tasks.restoreName', { name: task.title })} title={t('tasks.restore')}
                        icon={<Undo2 size={17} />} variant="ghostGold" isDisabled={busy}
                        onClick={() => mutation.mutate({ type: 'complete', task, completed: false, date: board.data?.today ?? '' })} />
                    </Flex>
                  ))}
                </Stack>
              )}
              {history.data && history.data.count > 25 && (
                <Flex mt={5} justify="space-between" align="center" gap={2}>
                  <Button size="sm" variant="ghostGold" isDisabled={page === 1 || busy} onClick={() => setPage(page - 1)}>{t('prev')}</Button>
                  <Text fontSize="12px">{t('page', { page, total: Math.ceil(history.data.count / 25) })}</Text>
                  <Button size="sm" variant="ghostGold" isDisabled={!history.data.next || busy} onClick={() => setPage(page + 1)}>{t('next')}</Button>
                </Flex>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ConfirmModal isOpen={!!deleting} onClose={() => { if (!busy) setDeleting(null); }}
        title={t('tasks.deleteTitle')} body={t('tasks.deleteBody', { name: deleting?.title })}
        isLoading={busy} onConfirm={() => { if (deleting && !busy) mutation.mutate({ type: 'delete', id: deleting.id }); }} />
    </Stack>
  );
}
