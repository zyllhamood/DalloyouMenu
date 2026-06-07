from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta

from .models import Category, Product, Visit
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductWriteSerializer,
    VisitCreateSerializer,
    VisitListSerializer,
)

# Public Views
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(is_available=True)
        category_slug = self.request.query_params.get('category')
        is_featured = self.request.query_params.get('featured')
        is_new = self.request.query_params.get('is_new')
        search = self.request.query_params.get('search')
        size_param = self.request.query_params.get('size')
        weight_param = self.request.query_params.get('weight')

        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        if is_featured and is_featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        if is_new and is_new.lower() == 'true':
            queryset = queryset.filter(is_new=True)
        if search:
            queryset = queryset.filter(
                Q(name_en__icontains=search) | Q(name_ar__icontains=search)
            )
        measurement_filter = Q()
        if size_param:
            VALID = {'SMALL', 'MEDIUM', 'LARGE'}
            requested = {s.strip().upper() for s in size_param.split(',')}
            requested &= VALID
            if requested:
                measurement_filter |= Q(size_mode='SIZE', size__in=requested)
        if weight_param:
            requested_weights = [w.strip() for w in weight_param.split(',') if w.strip()]
            if requested_weights:
                measurement_filter |= Q(size_mode='WEIGHT', weight_label__in=requested_weights)
        if measurement_filter:
            queryset = queryset.filter(measurement_filter)
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_available=True)
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

class FeaturedProductsView(generics.ListAPIView):
    queryset = Product.objects.filter(is_available=True, is_featured=True)
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]


class VisitCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VisitCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visit = serializer.save(
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:1000],
            ip_address=self._client_ip(request),
        )
        return Response({'id': visit.id}, status=201)

    def _client_ip(self, request):
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class AdminVisitStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        days = self._parse_days(request.query_params.get('days'))
        device = request.query_params.get('device') or 'all'
        unique_only = (request.query_params.get('unique') or '').lower() == 'true'
        recent_page = self._parse_positive_int(request.query_params.get('recent_page'), 1, 1, 100000)
        recent_page_size = self._parse_positive_int(request.query_params.get('recent_page_size'), 10, 1, 50)

        since = timezone.now() - timedelta(days=days)
        queryset = Visit.objects.filter(created_at__gte=since)
        if device in {'desktop', 'mobile', 'tablet', 'other'}:
            queryset = queryset.filter(device_type=device)

        count_field = 'visitor_id' if unique_only else 'id'
        count_kwargs = {'distinct': unique_only} if unique_only else {}

        totals = {
            'total': queryset.count(),
            'unique': queryset.values('visitor_id').distinct().count(),
            'desktop': self._device_count(queryset, 'desktop', unique_only),
            'mobile': self._device_count(queryset, 'mobile', unique_only),
            'tablet': self._device_count(queryset, 'tablet', unique_only),
            'other': self._device_count(queryset, 'other', unique_only),
        }

        grouped = (
            queryset
            .annotate(day=TruncDate('created_at'))
            .values('day')
            .annotate(
                count=Count(count_field, **count_kwargs),
                desktop=Count(count_field, filter=Q(device_type='desktop'), **count_kwargs),
                mobile=Count(count_field, filter=Q(device_type='mobile'), **count_kwargs),
                tablet=Count(count_field, filter=Q(device_type='tablet'), **count_kwargs),
                other=Count(count_field, filter=Q(device_type='other'), **count_kwargs),
            )
            .order_by('-day')
        )

        recent_queryset = queryset.order_by('-created_at')
        recent_count = recent_queryset.count()
        recent_total_pages = max(1, (recent_count + recent_page_size - 1) // recent_page_size)
        recent_page = min(recent_page, recent_total_pages)
        recent_start = (recent_page - 1) * recent_page_size
        recent_end = recent_start + recent_page_size
        recent = recent_queryset[recent_start:recent_end]
        return Response({
            'days': days,
            'device': device,
            'unique': unique_only,
            'totals': totals,
            'daily': [
                {
                    'date': row['day'].isoformat(),
                    'count': row['count'],
                    'desktop': row['desktop'],
                    'mobile': row['mobile'],
                    'tablet': row['tablet'],
                    'other': row['other'],
                }
                for row in grouped
            ],
            'recent': VisitListSerializer(recent, many=True).data,
            'recent_pagination': {
                'count': recent_count,
                'page': recent_page,
                'page_size': recent_page_size,
                'total_pages': recent_total_pages,
                'has_previous': recent_page > 1,
                'has_next': recent_page < recent_total_pages,
            },
        })

    def _parse_days(self, value):
        try:
            parsed = int(value or 30)
        except (TypeError, ValueError):
            return 30
        return min(max(parsed, 1), 365)

    def _parse_positive_int(self, value, default, minimum, maximum):
        try:
            parsed = int(value or default)
        except (TypeError, ValueError):
            return default
        return min(max(parsed, minimum), maximum)

    def _device_count(self, queryset, device, unique_only):
        filtered = queryset.filter(device_type=device)
        if unique_only:
            return filtered.values('visitor_id').distinct().count()
        return filtered.count()

# Admin Views
class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]

class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        return ProductDetailSerializer

# Auth Views
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff
        })
