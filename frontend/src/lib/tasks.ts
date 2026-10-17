import { api, type Paginated } from './api';

export type TaskKind = 'ONCE' | 'DAILY';

export interface AdminTask {
  id: number;
  title: string;
  kind: TaskKind;
  order: number;
  completed_at: string | null;
  created_at: string;
  is_completed: boolean;
}

export interface TaskBoard {
  today: string;
  timezone: string;
  server_time: string;
  next_reset_at: string;
  daily: AdminTask[];
  once: AdminTask[];
}

export async function getTaskBoard(): Promise<TaskBoard> {
  const { data } = await api.get<TaskBoard>('/admin/tasks/');
  return data;
}

export async function getTaskHistory(page: number): Promise<Paginated<AdminTask>> {
  const { data } = await api.get<Paginated<AdminTask>>('/admin/tasks/history/', { params: { page } });
  return data;
}

export async function createTask(title: string, kind: TaskKind) {
  await api.post('/admin/tasks/', { title, kind });
}

export async function setTaskCompletion(id: number, completed: boolean, date: string) {
  await api.post(`/admin/tasks/${id}/completion/`, { completed, date });
}

export async function moveTask(id: number, direction: 'up' | 'down') {
  await api.post(`/admin/tasks/${id}/move/`, { direction });
}

export async function deleteTask(id: number) {
  await api.delete(`/admin/tasks/${id}/`);
}
