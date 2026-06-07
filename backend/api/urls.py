from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    FeaturedProductsView,
    AdminCategoryViewSet,
    AdminProductViewSet,
    VisitCreateView,
    AdminVisitStatsView,
    MeView
)

router = DefaultRouter()
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'admin/products', AdminProductViewSet, basename='admin-product')

urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),

    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/featured/', FeaturedProductsView.as_view(), name='product-featured'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('visits/', VisitCreateView.as_view(), name='visit-create'),
    path('admin/visits/', AdminVisitStatsView.as_view(), name='admin-visit-stats'),

    path('', include(router.urls)),
]
