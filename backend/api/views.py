from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q

from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductWriteSerializer
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
        if size_param:
            VALID = {'SMALL', 'MEDIUM', 'LARGE'}
            requested = {s.strip().upper() for s in size_param.split(',')}
            requested &= VALID
            if requested:
                queryset = queryset.filter(
                    variants__size__in=requested,
                    variants__is_available=True,
                ).distinct()
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_available=True)
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]

class FeaturedProductsView(generics.ListAPIView):
    queryset = Product.objects.filter(is_available=True, is_featured=True)
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

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
