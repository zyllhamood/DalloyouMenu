import urllib.request
import io
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from api.models import Category, Product, ProductVariant

class Command(BaseCommand):
    help = 'Seed catalog with categories and sample products'

    def handle(self, *args, **options):
        # 1. Create categories
        categories_data = [
            {'name_en': 'Cakes', 'name_ar': 'كيك', 'order': 1},
            {'name_en': 'Chocolates', 'name_ar': 'شوكولاتة', 'order': 2},
            {'name_en': 'Pastries', 'name_ar': 'معجنات', 'order': 3},
            {'name_en': 'Cookies', 'name_ar': 'كوكيز', 'order': 4},
        ]
        categories = []
        for cat_data in categories_data:
            cat, created = Category.objects.get_or_create(
                name_en=cat_data['name_en'],
                defaults={'name_ar': cat_data['name_ar'], 'order': cat_data['order']}
            )
            categories.append(cat)
            self.stdout.write(self.style.SUCCESS(f"Category {cat.name_en} ensured."))

        # 2. Download placeholder image
        image_url = 'https://placehold.co/1000x1000/FAF8F3/C9A961/png'
        self.stdout.write("Downloading placeholder image...")
        try:
            req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req)
            image_content = response.read()
            self.stdout.write(self.style.SUCCESS("Downloaded placeholder image."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to download image: {e}"))
            return

        # 3. Create products
        products_data = [
            {'name_en': 'Chocolate Truffle Cake', 'name_ar': 'كيك ترافل شوكولاتة', 'cat': 0, 'featured': True},
            {'name_en': 'Vanilla Bean Cake', 'name_ar': 'كيك الفانيليا', 'cat': 0, 'featured': False},
            {'name_en': 'Assorted Pralines', 'name_ar': 'برالين مشكل', 'cat': 1, 'featured': True},
            {'name_en': 'Dark Chocolate Bars', 'name_ar': 'ألواح شوكولاتة داكنة', 'cat': 1, 'featured': False},
            {'name_en': 'Butter Croissant', 'name_ar': 'كرواسون بالزبدة', 'cat': 2, 'featured': False},
            {'name_en': 'Almond Danish', 'name_ar': 'دانش باللوز', 'cat': 2, 'featured': True},
            {'name_en': 'Chocolate Chip Cookie', 'name_ar': 'كوكيز بقطع الشوكولاتة', 'cat': 3, 'featured': False},
            {'name_en': 'Oatmeal Raisin Cookie', 'name_ar': 'كوكيز الشوفان والزبيب', 'cat': 3, 'featured': False},
        ]

        # Reset or just create if missing? We can just create
        for idx, p_data in enumerate(products_data):
            cat = categories[p_data['cat']]
            product, created = Product.objects.get_or_create(
                name_en=p_data['name_en'],
                defaults={
                    'name_ar': p_data['name_ar'],
                    'category': cat,
                    'base_price': (idx + 1) * 10.00,
                    'is_featured': p_data['featured'],
                    'description_en': f"Delicious {p_data['name_en']}",
                    'description_ar': f"لذيذ {p_data['name_ar']}"
                }
            )

            if created:
                # Save image
                product.display_image.save(f"display_{product.id}.png", ContentFile(image_content), save=False)
                product.styled_image.save(f"styled_{product.id}.png", ContentFile(image_content), save=False)
                product.save()

                # Add variants
                ProductVariant.objects.create(product=product, size='SMALL', price=float(product.base_price) * 1.0)
                ProductVariant.objects.create(product=product, size='MEDIUM', price=float(product.base_price) * 1.5)
                self.stdout.write(self.style.SUCCESS(f"Created product: {product.name_en}"))
            else:
                self.stdout.write(f"Product already exists: {product.name_en}")

        self.stdout.write(self.style.SUCCESS('Catalog seeded successfully.'))
