from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CategoryListView,
    ProductListView,
    ProductDetailView,
    FeaturedProductsView,
    MenuView,
    product_image,
    AdminCategoryViewSet,
    AdminProductViewSet,
    VisitCreateView,
    AdminVisitStatsView,
    MeView,
    IpadMenuView,
    AdminIpadOverviewView,
    AdminIpadSettingsView,
    AdminIpadCategoryViewSet,
    AdminIpadItemViewSet,
    AdminIpadGalleryViewSet,
)

router = DefaultRouter()
router.register(r'admin/categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'admin/products', AdminProductViewSet, basename='admin-product')
router.register(r'admin/ipad/categories', AdminIpadCategoryViewSet, basename='admin-ipad-category')
router.register(r'admin/ipad/items', AdminIpadItemViewSet, basename='admin-ipad-item')
router.register(r'admin/ipad/gallery', AdminIpadGalleryViewSet, basename='admin-ipad-gallery')

urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='auth_me'),

    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/featured/', FeaturedProductsView.as_view(), name='product-featured'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('menu/', MenuView.as_view(), name='menu'),
    path('img/<path:path>', product_image, name='product-image'),
    path('visits/', VisitCreateView.as_view(), name='visit-create'),
    path('admin/visits/', AdminVisitStatsView.as_view(), name='admin-visit-stats'),

    path('ipad/menu/', IpadMenuView.as_view(), name='ipad-menu'),
    path('admin/ipad/', AdminIpadOverviewView.as_view(), name='admin-ipad'),
    path('admin/ipad/settings/', AdminIpadSettingsView.as_view(), name='admin-ipad-settings'),

    path('', include(router.urls)),
]
