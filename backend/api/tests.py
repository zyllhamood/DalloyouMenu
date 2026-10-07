import io
import json
import shutil
import tempfile
from decimal import Decimal
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from .images import snap_width
from .models import Category, IpadCategory, IpadGalleryImage, IpadItem, IpadSettings, Product
from .serializers import ProductWriteSerializer

TEMP_MEDIA = tempfile.mkdtemp(prefix='dalloyou-test-media-')
TEMP_CACHE = tempfile.mkdtemp(prefix='dalloyou-test-cache-')


def image_upload(name, size=(1200, 900), mode='RGBA'):
    colour = (200, 140, 60, 0) if mode == 'RGBA' else (200, 140, 60)
    buffer = io.BytesIO()
    Image.new(mode, size, colour).save(buffer, format='PNG')
    return SimpleUploadedFile(name, buffer.getvalue(), content_type='image/png')


LOCAL_STORAGE = override_settings(
    STORAGES={
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
    },
    MEDIA_ROOT=TEMP_MEDIA,
    MEDIA_URL='/media/',
    IMAGE_CACHE_DIR=TEMP_CACHE,
)


@LOCAL_STORAGE
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

    def test_product_needs_only_the_main_photo(self):
        """One photo is enough to create a product; the second is optional."""
        serializer = ProductWriteSerializer(data={
            'name_en': 'one-photo',
            'name_ar': 'صورة واحدة',
            'category_id': self.cakes.id,
            'base_price': '120',
            'display_image': image_upload('one.png'),
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()
        self.assertTrue(product.display_image)
        self.assertFalse(product.styled_image)

    def test_missing_main_photo_is_rejected(self):
        serializer = ProductWriteSerializer(data={
            'name_en': 'no-photo',
            'name_ar': 'بدون صورة',
            'category_id': self.cakes.id,
            'base_price': '120',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('display_image', serializer.errors)

    def test_sale_price_rules(self):
        """Empty or zero clears the discount; a price at or above the base is rejected."""
        for blank in ('', None, '0'):
            serializer = ProductWriteSerializer(
                instance=self.visible, data={'discount_price': blank}, partial=True
            )
            self.assertTrue(serializer.is_valid(), serializer.errors)
            self.assertIsNone(serializer.validated_data['discount_price'])

        serializer = ProductWriteSerializer(
            instance=self.visible, data={'discount_price': '100'}, partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('discount_price', serializer.errors)

        serializer = ProductWriteSerializer(
            instance=self.visible, data={'discount_price': '79.50'}, partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(str(serializer.save().discount_price), '79.50')

    def test_menu_exposes_the_sale_price(self):
        self.visible.discount_price = 75
        self.visible.save(update_fields=['discount_price'])
        data = self.client.get(reverse('menu')).json()
        self.assertEqual(data['products'][0]['discount_price'], '75.00')

    def test_snap_width(self):
        self.assertEqual(snap_width('1'), 160)
        self.assertEqual(snap_width('640'), 640)
        self.assertEqual(snap_width('641'), 960)
        self.assertEqual(snap_width('99999'), 1600)
        self.assertEqual(snap_width('abc'), 640)


@LOCAL_STORAGE
class IpadMenuTests(TestCase):
    """The tablets' menu: website products shown with the iPad's own grouping."""

    def setUp(self):
        cakes = Category.objects.create(name_en='Cakes', name_ar='كيك', order=1)
        self.lemon_cake = Product.objects.create(
            name_en='lemon', name_ar='كيكة الليمون - حجم وسط', category=cakes,
            base_price=150, size='MEDIUM', display_image=image_upload('lemon.png'),
        )
        self.teacher_cake = Product.objects.create(
            name_en='teacher', name_ar='كيكة المعلم', category=cakes, base_price=180,
            discount_price=144, size_mode='WEIGHT', size=None, weight_label='كيلو',
            display_image=image_upload('teacher.png'),
        )
        self.sold_out = Product.objects.create(
            name_en='sold', name_ar='نفدت', category=cakes, base_price=90,
            is_available=False, display_image=image_upload('sold.png'),
        )

        self.tab = IpadCategory.objects.create(name_ar='كيك', name_en='Cakes', order=0)
        empty_tab = IpadCategory.objects.create(name_ar='فاضية', order=1)
        hidden_tab = IpadCategory.objects.create(name_ar='مخفية', order=2, is_visible=False)
        self.other_tab = IpadCategory.objects.create(name_ar='ميني كيك', order=3)

        self.lemon = IpadItem.objects.create(
            category=self.tab, product=self.lemon_cake, name_en='Lemon Cake', order=0
        )
        self.teacher = IpadItem.objects.create(
            category=self.tab, product=self.teacher_cake, order=1,
            image=image_upload('teacher-ipad.png'), detail_image=image_upload('teacher-cut.png'),
        )
        self.unavailable = IpadItem.objects.create(category=self.tab, product=self.sold_out, order=2)
        self.switched_off = IpadItem.objects.create(
            category=self.tab, product=self.lemon_cake, order=3, is_visible=False
        )
        self.special = IpadItem.objects.create(
            category=self.tab, name_ar='تشيز كيك كبير', price=Decimal('99.50'),
            size_label='القطعة', order=4,
        )
        IpadItem.objects.create(category=empty_tab, product=self.sold_out)
        IpadItem.objects.create(category=hidden_tab, product=self.lemon_cake)
        IpadItem.objects.create(category=self.other_tab, product=self.lemon_cake)

        staff = get_user_model().objects.create_user('ipad-admin', password='x', is_staff=True)
        self.admin = APIClient()
        self.admin.force_authenticate(staff)

    def menu(self):
        response = self.client.get(reverse('ipad-menu'))
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_menu_takes_name_price_and_availability_from_the_website(self):
        data = self.menu()
        # Hidden tabs and tabs with nothing to show are left out.
        self.assertEqual([c['name'] for c in data['categories']], ['كيك', 'ميني كيك'])
        items = data['categories'][0]['items']
        self.assertEqual([i['id'] for i in items], [self.lemon.id, self.teacher.id, self.special.id])

        lemon, teacher, special = items
        self.assertEqual(lemon['name'], 'كيكة الليمون - حجم وسط')
        self.assertEqual((lemon['price'], lemon['was'], lemon['size']), (150, None, 'وسط'))
        self.assertEqual(lemon['en'], 'Lemon Cake')
        self.assertEqual(lemon['image'], self.lemon_cake.display_image.name)  # website photo
        self.assertIsNone(lemon['detail_image'])

        self.assertEqual((teacher['price'], teacher['was'], teacher['size']), (144, 180, 'كيلو'))
        self.assertEqual(teacher['image'], self.teacher.image.name)  # the iPad's own photo
        self.assertEqual(teacher['detail_image'], self.teacher.detail_image.name)

        self.assertEqual((special['name'], special['price'], special['size']), ('تشيز كيك كبير', 99.5, 'القطعة'))
        self.assertIsNone(special['image'])

    def test_website_changes_reach_the_tablets_and_change_the_version(self):
        before = self.menu()
        self.assertEqual(before['version'], self.menu()['version'])  # stable while nothing changes

        self.lemon_cake.base_price = 160
        self.lemon_cake.save()
        after = self.menu()
        self.assertEqual(after['categories'][0]['items'][0]['price'], 160)
        self.assertNotEqual(before['version'], after['version'])

        self.lemon_cake.is_available = False
        self.lemon_cake.save()
        ids = [i['id'] for c in self.menu()['categories'] for i in c['items']]
        self.assertNotIn(self.lemon.id, ids)

    def test_gallery_and_settings(self):
        IpadGalleryImage.objects.create(image=image_upload('design.png'))
        settings = IpadSettings.load()
        settings.location = 'الخبر'
        settings.save()
        data = self.menu()
        self.assertEqual(data['settings']['location'], 'الخبر')
        self.assertEqual(len(data['gallery']['images']), 1)

        settings.gallery_visible = False
        settings.save()
        self.assertEqual(self.menu()['gallery']['images'], [])

    def test_admin_endpoints_need_staff(self):
        for name in ('admin-ipad', 'admin-ipad-settings', 'admin-ipad-item-list'):
            self.assertIn(self.client.get(reverse(name)).status_code, (401, 403))

    def test_overview_explains_why_items_are_hidden(self):
        response = self.admin.get(reverse('admin-ipad'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        reasons = {i['id']: i['resolved']['hidden_reason'] for c in data['categories'] for i in c['items']}
        self.assertIsNone(reasons[self.lemon.id])
        self.assertEqual(reasons[self.unavailable.id], 'unavailable')
        self.assertEqual(reasons[self.switched_off.id], 'hidden')
        self.assertEqual(
            {p['id'] for p in data['products']},
            {self.lemon_cake.id, self.teacher_cake.id, self.sold_out.id},
        )

    def test_admin_adds_a_website_product_with_its_own_photo(self):
        response = self.admin.post(reverse('admin-ipad-item-list'), {
            'category_id': self.tab.id,
            'product_id': self.teacher_cake.id,
            'name_ar': 'ignored for linked items',
            'price': '5',
            'name_en': '  Teacher Cake ',
            'image': image_upload('new.png'),
        }, format='multipart')
        self.assertEqual(response.status_code, 201, response.content)
        item = IpadItem.objects.get(pk=response.json()['id'])
        self.assertEqual(item.order, 5)  # joins the end of its category
        self.assertEqual((item.name_ar, item.price, item.name_en), ('', None, 'Teacher Cake'))
        self.assertTrue(item.image.name.startswith('ipad/items/'))
        self.assertEqual(response.json()['resolved']['price'], 144)

    def test_tablet_only_item_needs_a_name(self):
        response = self.admin.post(reverse('admin-ipad-item-list'), {
            'category_id': self.tab.id, 'product_id': '', 'name_ar': '   ',
        }, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('name_ar', response.json())

    def test_clearing_the_ipad_photo_falls_back_to_the_website_photo(self):
        url = reverse('admin-ipad-item-detail', args=[self.teacher.id])
        response = self.admin.patch(url, {'image': ''}, format='multipart')
        self.assertEqual(response.status_code, 200, response.content)
        self.teacher.refresh_from_db()
        self.assertFalse(self.teacher.image)
        self.assertTrue(self.teacher.detail_image)  # untouched
        self.assertEqual(response.json()['resolved']['image'], self.teacher_cake.display_image.name)

    def test_moving_an_item_puts_it_at_the_end_of_the_new_category(self):
        url = reverse('admin-ipad-item-detail', args=[self.lemon.id])
        response = self.admin.patch(url, {'category_id': self.other_tab.id}, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.lemon.refresh_from_db()
        self.assertEqual((self.lemon.category_id, self.lemon.order), (self.other_tab.id, 1))

    def test_reorder(self):
        url = reverse('admin-ipad-item-reorder')
        response = self.admin.post(url, {'ids': [self.special.id, self.lemon.id]}, format='json')
        self.assertEqual(response.status_code, 204)
        self.special.refresh_from_db()
        self.lemon.refresh_from_db()
        self.assertEqual((self.special.order, self.lemon.order), (0, 1))

        for bad in ([], [999999], [self.lemon.id, self.lemon.id], 'x'):
            self.assertEqual(self.admin.post(url, {'ids': bad}, format='json').status_code, 400)

        response = self.admin.post(
            reverse('admin-ipad-category-reorder'), {'ids': [self.other_tab.id, self.tab.id]}, format='json'
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.menu()['categories'][0]['name'], 'ميني كيك')

    def test_settings_validation(self):
        url = reverse('admin-ipad-settings')
        self.assertEqual(self.admin.patch(url, {'idle_seconds': 5}, format='json').status_code, 400)
        response = self.admin.patch(url, {'idle_seconds': 90, 'location': 'الدمام'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(IpadSettings.load().idle_seconds, 90)

    def test_image_endpoint_serves_ipad_photos(self):
        for name in (self.teacher.image.name, self.teacher.detail_image.name):
            response = self.client.get(reverse('product-image', args=[name]), {'w': '320'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['Content-Type'], 'image/webp')


@LOCAL_STORAGE
class ImportIpadMenuTests(TestCase):
    def setUp(self):
        self.site = Path(tempfile.mkdtemp(prefix='dalloyou-ipad-site-'))
        self.addCleanup(shutil.rmtree, self.site, ignore_errors=True)
        (self.site / 'Menu').mkdir()
        (self.site / 'CustomDesign').mkdir()
        for rel in ('Menu/بوكس.webp', 'Menu/خاص.webp', 'CustomDesign/16.webp'):
            Image.new('RGB', (40, 40), (200, 140, 60)).save(self.site / rel, format='WEBP')
        data = {
            'settings': {'pin': '1234', 'idleSeconds': 45, 'location': 'الخبر · الدمام', 'currency': 'ر.س'},
            'categories': [{
                'id': 'choc', 'name': 'شوكولاتة', 'en': 'Chocolate', 'hidden': False,
                'items': [
                    {'id': 'p01', 'name': 'بوكس قديم', 'en': 'Small Box', 'size': 'البوكس',
                     'price': 10, 'image': 'Menu/بوكس.webp', 'detailImage': 'Menu-Details/بوكس.png',
                     'hidden': False},
                    {'id': 'p10', 'name': 'تشيز كيك كبير', 'en': 'Cheesecake', 'size': 'كبير',
                     'price': None, 'image': 'Menu/خاص.webp', 'detailImage': '', 'hidden': True},
                ],
            }],
            'gallery': {'name': 'تصميمات خاصة', 'en': 'Custom Designs', 'hidden': False,
                        'images': ['CustomDesign/16.webp']},
        }
        (self.site / 'menu-data.js').write_text(
            '/* header */\nwindow.MENU_DATA = ' + json.dumps(data, ensure_ascii=False) + ';\n',
            encoding='utf-8',
        )
        category = Category.objects.create(name_en='Chocolates', name_ar='شوكولاتة')
        # p01 is mapped to website product #55.
        self.product = Product.objects.create(
            id=55, name_en='box', name_ar='بوكس بيوقلز صغير', category=category, base_price=57,
            size='SMALL', display_image=image_upload('box.png'),
        )

    def run_import(self, *args):
        out = io.StringIO()
        call_command('import_ipad_menu', str(self.site), *args, stdout=out)
        return out.getvalue()

    def test_dry_run_changes_nothing(self):
        output = self.run_import('--dry-run')
        self.assertIn('#55', output)
        self.assertFalse(IpadItem.objects.exists())
        self.assertFalse(IpadGalleryImage.objects.exists())

    def test_import_links_products_and_uploads_photos(self):
        output = self.run_import()
        linked, special = IpadItem.objects.order_by('order')
        self.assertEqual(linked.product, self.product)
        self.assertEqual((linked.name_ar, linked.price, linked.name_en), ('', None, 'Small Box'))
        self.assertEqual(linked.size_label, '')  # the product's own size ("صغير") wins
        self.assertTrue(linked.image.name.startswith('ipad/items/p01'))
        self.assertFalse(linked.detail_image)  # that file never existed
        self.assertIn('بوكس.png', output)

        self.assertIsNone(special.product)
        self.assertEqual((special.name_ar, special.size_label, special.is_visible), ('تشيز كيك كبير', 'كبير', False))

        self.assertEqual(IpadGalleryImage.objects.count(), 1)
        settings = IpadSettings.load()
        self.assertEqual((settings.idle_seconds, settings.location), (45, 'الخبر · الدمام'))

        with self.assertRaises(CommandError):
            self.run_import()
        self.run_import('--replace')
        self.assertEqual(IpadItem.objects.count(), 2)
