from datetime import datetime, timedelta, timezone as dt_timezone
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Task


class AdminTaskTests(TestCase):
    def setUp(self):
        self.staff = get_user_model().objects.create_user('task-admin', is_staff=True)
        self.client = APIClient()
        self.client.force_authenticate(self.staff)
        self.now = datetime(2026, 10, 17, 20, 59, tzinfo=dt_timezone.utc)  # 23:59 in Riyadh
        clock = patch('django.utils.timezone.now', return_value=self.now)
        self.clock = clock.start()
        self.addCleanup(clock.stop)

    def board(self):
        response = self.client.get(reverse('admin-task-list'))
        self.assertEqual(response.status_code, 200)
        return response.json()

    def complete(self, task, completed=True, date='2026-10-17'):
        return self.client.post(reverse('admin-task-completion', args=[task.pk]), {
            'completed': completed, 'date': date,
        }, format='json')

    def move(self, task, direction):
        return self.client.post(reverse('admin-task-move', args=[task.pk]), {'direction': direction}, format='json')

    def history(self, page=1):
        response = self.client.get(reverse('admin-task-history'), {'page': page})
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_all_endpoints_require_staff(self):
        task = Task.objects.create(title='Private')
        endpoints = [
            ('get', reverse('admin-task-list'), None),
            ('get', reverse('admin-task-history'), None),
            ('post', reverse('admin-task-list'), {'title': 'No access'}),
            ('post', reverse('admin-task-completion', args=[task.pk]), {'completed': True}),
            ('post', reverse('admin-task-move', args=[task.pk]), {'direction': 'up'}),
            ('delete', reverse('admin-task-detail', args=[task.pk]), None),
        ]
        for user in (None, get_user_model().objects.create_user('customer')):
            self.client.force_authenticate(user)
            for method, url, data in endpoints:
                response = getattr(self.client, method)(url, data, format='json')
                self.assertIn(response.status_code, (401, 403))
        self.assertEqual(Task.objects.count(), 1)

    def test_add_trims_title_and_allows_duplicate_names(self):
        for _ in range(2):
            response = self.client.post(reverse('admin-task-list'), {'title': '  شراء تغليف  ', 'kind': 'ONCE'})
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.json()['title'], 'شراء تغليف')
        tasks = list(Task.objects.all())
        self.assertNotEqual(tasks[0].pk, tasks[1].pk)
        self.assertEqual([task.order for task in tasks], [0, 1])
        self.complete(tasks[0])
        self.complete(tasks[1])
        self.assertEqual(self.history()['count'], 2)

    def test_invalid_task_input(self):
        for payload in ({'title': '  '}, {'title': 'x' * 501}, {'title': 'x', 'kind': 'WEEKLY'}, {}):
            self.assertEqual(self.client.post(reverse('admin-task-list'), payload).status_code, 400)
        self.assertFalse(Task.objects.exists())

    def test_completion_and_order_cannot_be_injected_on_creation(self):
        response = self.client.post(reverse('admin-task-list'), {
            'title': 'New', 'completed_at': self.now.isoformat(), 'is_completed': True, 'order': 999,
        })
        self.assertEqual(response.status_code, 201)
        self.assertIsNone(response.json()['completed_at'])
        self.assertEqual(response.json()['order'], 0)

    def test_one_time_completion_moves_to_persistent_history_and_can_be_restored(self):
        task = Task.objects.create(title='One time')
        self.assertEqual(self.complete(task).status_code, 200)
        self.assertEqual(self.board()['once'], [])
        self.assertEqual(self.history()['results'][0]['id'], task.id)
        self.clock.return_value = self.now + timedelta(days=10)
        self.assertEqual(self.board()['once'], [])
        self.assertEqual(self.history()['count'], 1)
        self.assertEqual(self.complete(task, False).status_code, 200)
        self.assertEqual(self.history()['count'], 0)
        self.assertEqual(self.board()['once'][0]['id'], task.id)

    def test_daily_completion_resets_at_saudi_midnight_without_creating_rows(self):
        task = Task.objects.create(title='Daily', kind=Task.Kind.DAILY)
        self.assertEqual(self.complete(task).status_code, 200)
        board = self.board()
        self.assertTrue(board['daily'][0]['is_completed'])
        self.assertEqual(board['timezone'], 'Asia/Riyadh')
        self.assertEqual(board['today'], '2026-10-17')
        self.assertEqual(datetime.fromisoformat(board['next_reset_at']), self.now + timedelta(minutes=1))
        self.clock.return_value = self.now + timedelta(minutes=1)
        self.assertEqual(self.board()['today'], '2026-10-18')
        self.assertFalse(self.board()['daily'][0]['is_completed'])
        self.assertEqual(self.complete(task, date='2026-10-18').status_code, 200)
        self.assertTrue(self.board()['daily'][0]['is_completed'])
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(self.history()['count'], 0)

    def test_missed_days_do_not_duplicate_tasks_or_affect_order(self):
        first = Task.objects.create(title='Daily', kind=Task.Kind.DAILY, order=0)
        second = Task.objects.create(title='Other daily', kind=Task.Kind.DAILY, order=1)
        self.complete(first)
        self.clock.return_value = self.now + timedelta(days=30)
        tasks = self.board()['daily']
        self.assertEqual([task['id'] for task in tasks], [first.id, second.id])
        self.assertFalse(any(task['is_completed'] for task in tasks))
        self.assertEqual(Task.objects.count(), 2)

    def test_daily_completion_can_be_unchecked(self):
        task = Task.objects.create(title='Daily', kind=Task.Kind.DAILY)
        self.complete(task)
        self.assertEqual(self.complete(task, False).status_code, 200)
        self.assertFalse(self.board()['daily'][0]['is_completed'])
        self.assertEqual(self.history()['count'], 0)

    def test_old_tab_cannot_check_or_uncheck_the_wrong_day(self):
        task = Task.objects.create(title='Daily', kind=Task.Kind.DAILY)
        self.clock.return_value = self.now + timedelta(minutes=1)
        for checked in (True, False):
            self.assertEqual(self.complete(task, checked).status_code, 409)
        task.refresh_from_db()
        self.assertIsNone(task.completed_at)
        self.assertEqual(self.complete(task, date='2026-10-18').status_code, 200)
        self.assertEqual(self.complete(task, False).status_code, 409)
        self.assertTrue(self.board()['daily'][0]['is_completed'])

    def test_completion_is_idempotent(self):
        for kind in (Task.Kind.ONCE, Task.Kind.DAILY):
            task = Task.objects.create(title='Task', kind=kind)
            self.complete(task)
            task.refresh_from_db()
            original_time = task.completed_at
            self.clock.return_value = self.now + timedelta(seconds=20)
            self.complete(task)
            task.refresh_from_db()
            self.assertEqual(task.completed_at, original_time)

    def test_reordering_is_saved_within_each_kind_including_checked_daily_tasks(self):
        first = Task.objects.create(title='A', kind=Task.Kind.DAILY)
        second = Task.objects.create(title='B', kind=Task.Kind.DAILY)
        once = Task.objects.create(title='Once', order=19)
        self.complete(second)
        self.assertEqual(self.move(second, 'up').status_code, 204)
        self.assertEqual([task['id'] for task in self.board()['daily']], [second.id, first.id])
        self.assertEqual(self.move(second, 'up').status_code, 204)
        self.assertEqual(self.move(second, 'down').status_code, 204)
        self.assertEqual([task['id'] for task in self.board()['daily']], [first.id, second.id])
        once.refresh_from_db()
        self.assertEqual(once.order, 19)

    def test_one_time_reordering_skips_history(self):
        first = Task.objects.create(title='A')
        archived = Task.objects.create(title='Done', order=1)
        last = Task.objects.create(title='B', order=2)
        self.complete(archived)
        self.assertEqual(self.move(last, 'up').status_code, 204)
        self.assertEqual([task['id'] for task in self.board()['once']], [last.id, first.id])
        self.assertEqual(self.move(archived, 'up').status_code, 400)
        self.assertEqual(self.history()['count'], 1)

    def test_invalid_actions_do_not_change_tasks(self):
        task = Task.objects.create(title='Task')
        self.assertEqual(self.move(task, 'sideways').status_code, 400)
        url = reverse('admin-task-completion', args=[task.id])
        for payload in ({}, {'completed': None}, {'completed': 'invalid'}):
            self.assertEqual(self.client.post(url, payload, format='json').status_code, 400)
        self.assertEqual(self.client.post(reverse('admin-task-move', args=[999]), {'direction': 'up'}).status_code, 404)
        self.assertEqual(self.client.post(reverse('admin-task-completion', args=[999]), {'completed': True}).status_code, 404)

    def test_history_is_paginated_newest_first_without_daily_tasks(self):
        Task.objects.create(title='Daily', kind=Task.Kind.DAILY, completed_at=self.now)
        Task.objects.create(title='Pending')
        tasks = [Task.objects.create(title='Same name', completed_at=self.now + timedelta(seconds=i)) for i in range(30)]
        page1 = self.history()
        page2 = self.history(2)
        self.assertEqual(page1['count'], 30)
        self.assertEqual(len(page1['results']), 25)
        self.assertEqual(len(page2['results']), 5)
        self.assertEqual([task['id'] for task in page1['results'] + page2['results']], [task.id for task in reversed(tasks)])

    def test_delete_removes_task(self):
        task = Task.objects.create(title='No longer needed', kind=Task.Kind.DAILY)
        response = self.client.delete(reverse('admin-task-detail', args=[task.id]))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.board()['daily'], [])
