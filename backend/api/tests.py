import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image

from .images import snap_width
from .models import Category, Product

TEMP_MEDIA = tempfile.mkdtemp(prefix='dalloyou-test-media-')
TEMP_CACHE = tempfile.mkdtemp(prefix='dalloyou-test-cache-')


def image_upload(name, size=(1200, 900), mode='RGBA'):
    colour = (200, 140, 60, 0) if mode == 'RGBA' else (200, 140, 60)
    buffer = io.BytesIO()
    Image.new(mode, size, colour).save(buffer, format='PNG')
    return SimpleUploadedFile(name, buffer.getvalue(), content_type='image/png')


@override_settings(
    STORAGES={
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    },
    MEDIA_ROOT=TEMP_MEDIA,
    MEDIA_URL='/media/',
    IMAGE_CACHE_DIR=TEMP_CACHE,
)
class StorefrontEndpointsTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)
        shutil.rmtree(TEMP_CACHE, ignore_errors=True)

    def make_product(self, category, name, **extra):
        return Product.objects.create(
            name_en=name,
            name_ar=name,
            category=category,
            base_price=100,
            display_image=image_upload(f'{name}-display.png'),
            styled_image=image_upload(f'{name}-styled.png', mode='RGB'),
            **extra,
        )

    def setUp(self):
        self.cakes = Category.objects.create(name_en='Cakes', name_ar='كيك', order=1)
        self.hidden = Category.objects.create(name_en='Hidden', name_ar='مخفي', order=2, is_active=False)
        self.visible = self.make_product(self.cakes, 'visible', is_featured=True)
        self.sold_out = self.make_product(self.cakes, 'sold-out', is_available=False)
        self.in_hidden_category = self.make_product(self.hidden, 'hidden-category')

    def test_menu_returns_active_categories_and_available_products(self):
        response = self.client.get(reverse('menu'))
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual([c['slug'] for c in data['categories']], ['cakes'])
        self.assertEqual(data['categories'][0]['product_count'], 1)
        self.assertEqual([p['id'] for p in data['products']], [self.visible.id])

        product = data['products'][0]
        self.assertEqual(product['category']['slug'], 'cakes')
        self.assertEqual(product['display_image_path'], self.visible.display_image.name)
        self.assertEqual(product['styled_image_path'], self.visible.styled_image.name)
        self.assertTrue(product['is_featured'])

    def test_image_endpoint_serves_resized_webp_and_keeps_alpha(self):
        name = self.visible.display_image.name
        response = self.client.get(reverse('product-image', args=[name]), {'w': '600'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'image/webp')
        self.assertIn('immutable', response['Cache-Control'])

        image = Image.open(io.BytesIO(b''.join(response.streaming_content)))
        self.assertEqual(image.format, 'WEBP')
        self.assertEqual(image.width, 640)  # 600 snaps up to the next allowed width
        self.assertEqual(image.mode, 'RGBA')

    def test_image_endpoint_rejects_unknown_paths(self):
        response = self.client.get(reverse('product-image', args=['products/../../secret.png']))
        self.assertEqual(response.status_code, 404)

    def test_snap_width(self):
        self.assertEqual(snap_width('1'), 160)
        self.assertEqual(snap_width('640'), 640)
        self.assertEqual(snap_width('641'), 960)
        self.assertEqual(snap_width('99999'), 1600)
        self.assertEqual(snap_width('abc'), 640)
