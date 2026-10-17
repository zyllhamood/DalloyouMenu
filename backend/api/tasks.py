"""Shared staff checklist, with daily completion evaluated in the shop's timezone."""
from datetime import datetime, time, timedelta

from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ('id', 'title', 'kind', 'order', 'completed_at', 'created_at', 'is_completed')
        read_only_fields = ('order', 'completed_at', 'created_at')

    def get_is_completed(self, obj):
        if obj.completed_at is None:
            return False
        return obj.kind == Task.Kind.ONCE or timezone.localdate(obj.completed_at) == self.context['today']

    def create(self, validated_data):
        last_order = Task.objects.filter(kind=validated_data.get('kind', Task.Kind.ONCE)).aggregate(
            value=Max('order')
        )['value']
        return Task.objects.create(order=0 if last_order is None else last_order + 1, **validated_data)


class CompletionSerializer(serializers.Serializer):
    completed = serializers.BooleanField()
    date = serializers.DateField(required=False)


class MoveSerializer(serializers.Serializer):
    direction = serializers.ChoiceField(choices=('up', 'down'))


class TaskHistoryPagination(PageNumberPagination):
    page_size = 25


class AdminTaskViewSet(mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminUser]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'today': timezone.localdate()}

    def list(self, request):
        now = timezone.now()
        today = timezone.localdate(now)
        context = {**self.get_serializer_context(), 'today': today}
        next_reset = timezone.make_aware(datetime.combine(today + timedelta(days=1), time.min))
        return Response({
            'today': today,
            'timezone': timezone.get_current_timezone_name(),
            'server_time': now,
            'next_reset_at': next_reset,
            'daily': TaskSerializer(Task.objects.filter(kind=Task.Kind.DAILY), many=True, context=context).data,
            'once': TaskSerializer(
                Task.objects.filter(kind=Task.Kind.ONCE, completed_at__isnull=True), many=True, context=context,
            ).data,
        })

    @action(detail=False, methods=['get'])
    def history(self, request):
        tasks = Task.objects.filter(kind=Task.Kind.ONCE, completed_at__isnull=False).order_by('-completed_at', '-id')
        paginator = TaskHistoryPagination()
        page = paginator.paginate_queryset(tasks, request)
        return paginator.get_paginated_response(self.get_serializer(page, many=True).data)

    @action(detail=True, methods=['post'])
    def completion(self, request, pk=None):
        payload = CompletionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        with transaction.atomic():
            task = get_object_or_404(self.get_queryset().select_for_update(), pk=pk)
            now = timezone.now()
            today = timezone.localdate(now)
            if task.kind == Task.Kind.DAILY and payload.validated_data.get('date') != today:
                return Response(
                    {'detail': 'تغيّر اليوم. حدّث القائمة ثم أعد تحديد المهمة.'},
                    status=status.HTTP_409_CONFLICT,
                )
            checked = payload.validated_data['completed']
            already_done = task.completed_at is not None and (
                task.kind == Task.Kind.ONCE or timezone.localdate(task.completed_at) == today
            )
            # Repeated requests do not change the original completion time.
            if checked and not already_done:
                task.completed_at = now
            elif not checked:
                task.completed_at = None
            task.save(update_fields=['completed_at'])
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        payload = MoveSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        with transaction.atomic():
            task = self.get_object()
            tasks = self.get_queryset().filter(kind=task.kind)
            if task.kind == Task.Kind.ONCE:
                tasks = tasks.filter(completed_at__isnull=True)
            tasks = list(tasks.select_for_update())
            index = next((i for i, item in enumerate(tasks) if item.pk == task.pk), None)
            if index is None:
                return Response({'detail': 'المهمة موجودة في سجل المكتمل.'}, status=status.HTTP_400_BAD_REQUEST)
            target = index + (-1 if payload.validated_data['direction'] == 'up' else 1)
            if 0 <= target < len(tasks):
                tasks[index], tasks[target] = tasks[target], tasks[index]
                for order, item in enumerate(tasks):
                    item.order = order
                Task.objects.bulk_update(tasks, ['order'])
        return Response(status=status.HTTP_204_NO_CONTENT)
