from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductVariant

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'name_ar', 'slug', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name_en', 'name_ar', 'slug')
    prepopulated_fields = {'slug': ('name_en',)}
    ordering = ('order', 'id')

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ('size', 'price', 'is_available', 'image')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name_en', 'category', 'base_price', 'is_new', 'is_featured', 'is_available', 'order')
    list_filter = ('is_new', 'is_featured', 'is_available', 'category')
    search_fields = ('name_en', 'name_ar', 'description_en', 'description_ar')
    inlines = [ProductVariantInline]
    ordering = ('order', '-created_at')

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('product', 'size', 'price', 'is_available')
    list_filter = ('size', 'is_available')
    search_fields = ('product__name_en', 'product__name_ar')
