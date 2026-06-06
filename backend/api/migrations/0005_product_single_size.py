from django.db import migrations, models


SIZE_RANK = {'LARGE': 3, 'MEDIUM': 2, 'SMALL': 1}


def split_variant_products(apps, schema_editor):
    Product = apps.get_model('api', 'Product')
    ProductVariant = apps.get_model('api', 'ProductVariant')

    for product in Product.objects.all().order_by('id'):
        variants = list(ProductVariant.objects.filter(product=product))
        variants.sort(key=lambda v: SIZE_RANK.get(v.size, 0), reverse=True)

        if not variants:
            product.size = product.size or 'LARGE'
            if not product.display_image:
                product.display_image = product.styled_image.name if product.styled_image else ''
            if product.base_price is None:
                product.base_price = 0
            product.save(update_fields=['size', 'display_image', 'base_price'])
            continue

        for index, variant in enumerate(variants):
            display_image = variant.image.name if variant.image else ''
            if not display_image and product.styled_image:
                display_image = product.styled_image.name

            if index == 0:
                product.size = variant.size
                product.base_price = variant.price
                product.display_image = display_image
                product.is_available = bool(product.is_available and variant.is_available)
                product.save(update_fields=['size', 'base_price', 'display_image', 'is_available'])
                continue

            Product.objects.create(
                name_en=product.name_en,
                name_ar=product.name_ar,
                description_en=product.description_en,
                description_ar=product.description_ar,
                category=product.category,
                styled_image=product.styled_image.name if product.styled_image else '',
                display_image=display_image,
                size=variant.size,
                base_price=variant.price,
                is_new=product.is_new,
                is_featured=product.is_featured,
                is_available=bool(product.is_available and variant.is_available),
                order=(product.order * 10) + index,
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_remove_product_display_image_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='display_image',
            field=models.ImageField(blank=True, upload_to='products/display/'),
        ),
        migrations.AddField(
            model_name='product',
            name='size',
            field=models.CharField(
                choices=[('SMALL', 'Small'), ('MEDIUM', 'Medium'), ('LARGE', 'Large')],
                default='LARGE',
                max_length=20,
            ),
        ),
        migrations.RunPython(split_variant_products, noop_reverse),
        migrations.DeleteModel(
            name='ProductVariant',
        ),
    ]
