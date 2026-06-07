from django.contrib import admin
from .models import Category, Product, Visit

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_ar', 'slug', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name_en', 'name_ar', 'slug')
    prepopulated_fields = {'slug': ('name_en',)}
    ordering = ('order', 'id')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'category', 'size_mode', 'size', 'weight_label', 'base_price', 'is_new', 'is_featured', 'is_available', 'order')
    list_filter = ('size_mode', 'size', 'is_new', 'is_featured', 'is_available', 'category')
    search_fields = ('name_en', 'name_ar', 'description_en', 'description_ar')
    ordering = ('order', '-created_at')


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'device_type', 'path', 'visitor_id', 'ip_address')
    list_filter = ('device_type', 'created_at')
    search_fields = ('path', 'visitor_id', 'user_agent')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
