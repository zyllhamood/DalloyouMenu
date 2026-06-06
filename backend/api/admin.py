from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_ar', 'slug', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name_en', 'name_ar', 'slug')
    prepopulated_fields = {'slug': ('name_en',)}
    ordering = ('order', 'id')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'category', 'size', 'base_price', 'is_new', 'is_featured', 'is_available', 'order')
    list_filter = ('size', 'is_new', 'is_featured', 'is_available', 'category')
    search_fields = ('name_en', 'name_ar', 'description_en', 'description_ar')
    ordering = ('order', '-created_at')
