from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name_en = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return self.name_en

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name_en)
        super().save(*args, **kwargs)

class Product(models.Model):
    SIZE_MODE_CHOICES = (
        ('SIZE', 'Size'),
        ('WEIGHT', 'Weight'),
    )
    SIZE_CHOICES = (
        ('SMALL', 'Small'),
        ('MEDIUM', 'Medium'),
        ('LARGE', 'Large'),
    )

    name_en = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200)
    description_en = models.TextField(blank=True)
    description_ar = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    styled_image = models.ImageField(upload_to='products/styled/')
    display_image = models.ImageField(upload_to='products/display/', blank=True)
    size_mode = models.CharField(max_length=20, choices=SIZE_MODE_CHOICES, default='SIZE')
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='LARGE', blank=True, null=True)
    weight_label = models.CharField(max_length=80, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_new = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        measurement = self.weight_label if self.size_mode == 'WEIGHT' else self.size
        return f"{self.name_en} - {measurement}"
