"""
One-time import of the old static iPad menu (``dalloyou-ipad/site``) into the
database:

    python manage.py import_ipad_menu /var/www/dalloyou-ipad/site --dry-run
    python manage.py import_ipad_menu /var/www/dalloyou-ipad/site

Every tablet item is linked to its website product (matched photo by photo on
2026-10-07), so from now on its name, price and availability come from the
website. The tablet keeps its own categories, order, English names and photos;
the photos are uploaded to the configured storage. The command refuses to run
over an existing iPad menu unless ``--replace`` is given.
"""

import json
import re
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.ipad import number, resolve_item
from api.models import IpadCategory, IpadGalleryImage, IpadItem, IpadSettings, Product

# menu-data.js item id → website Product id (None: tablet-only item).
PRODUCT_FOR = {
    'p01': 55, 'p02': 56, 'p03': 58, 'p04': 14, 'p05': 57, 'p06': 25, 'p07': 15,
    'p08': 10, 'p09': 33, 'p10': None, 'p11': 17, 'p12': 16, 'p13': 53, 'p14': 20,
    'p15': 45, 'p16': 50, 'p17': 46, 'p18': 35, 'p19': 11, 'p20': 34,
    'p21': 28, 'p22': 27, 'p23': 23, 'p24': 22, 'p25': 30, 'p26': 24, 'p27': 18,
    'p28': 31, 'p29': 54, 'p30': 36, 'p31': 39, 'p32': 38, 'p33': 48, 'p34': 40,
}

# A label that states a size or weight — the website product already says that.
SIZE_OR_WEIGHT = re.compile(r'صغير|وسط|متوسط|كبير|كيلو|جرام|غرام')


def read_menu_data(site: Path) -> dict:
    source = site / 'menu-data.js'
    if not source.is_file():
        raise CommandError(f'{source} not found — pass the folder that holds menu-data.js.')
    text = source.read_text(encoding='utf-8')
    start = text.find('{', text.find('MENU_DATA'))
    end = text.rfind('}')
    try:
        data = json.loads(text[start:end + 1])
    except ValueError as exc:
        raise CommandError(f'{source} is not valid menu data: {exc}') from exc
    if not isinstance(data.get('categories'), list):
        raise CommandError(f'{source} has no categories.')
    return data


def tablet_size_label(label: str, product) -> str:
    """Keep the tablet's unit label ("البوكس", "24 قطعة") only where it adds something."""
    label = (label or '').strip()
    if product is None:
        return label
    if product.size_mode == 'WEIGHT' or product.size or SIZE_OR_WEIGHT.search(label):
        return ''
    return label


class Command(BaseCommand):
    help = 'Import the static iPad menu (menu-data.js + photos) into the database, once.'

    def add_arguments(self, parser):
        parser.add_argument('site', help='Folder of the old iPad site (contains menu-data.js, Menu/, ...).')
        parser.add_argument('--dry-run', action='store_true', help='Show what would be imported, change nothing.')
        parser.add_argument('--replace', action='store_true', help='Delete the current iPad menu first.')

    def handle(self, *args, site, dry_run, replace, **options):
        site = Path(site).expanduser().resolve()
        data = read_menu_data(site)
        products = Product.objects.in_bulk([pk for pk in PRODUCT_FOR.values() if pk])

        if IpadItem.objects.exists() or IpadCategory.objects.exists():
            if not replace and not dry_run:
                raise CommandError('The iPad menu already has data. Use --replace to start over.')

        self.missing_files = []
        self.missing_details = []
        with transaction.atomic():
            if replace and not dry_run:
                IpadItem.objects.all().delete()
                IpadCategory.objects.all().delete()
                IpadGalleryImage.objects.all().delete()
            linked = self.import_categories(site, data, products, dry_run)
            self.import_gallery(site, data, dry_run)
            self.import_settings(data, dry_run)

        self.report_not_on_tablets(linked)
        if self.missing_details:
            # The old page already showed a single photo for these.
            self.stdout.write(f'\n{len(self.missing_details)} detail photos were listed but never added: '
                              + ', '.join(self.missing_details))
        if self.missing_files:
            self.stdout.write(self.style.WARNING(
                'Photo files not found (skipped): ' + ', '.join(self.missing_files)
            ))
        verb = 'Would import' if dry_run else 'Imported'
        self.stdout.write(self.style.SUCCESS(f'{verb} the iPad menu from {site}'))

    # ── parts ──────────────────────────────────────────────────────────────

    def import_categories(self, site, data, products, dry_run):
        linked = set()
        for c_order, raw_cat in enumerate(data['categories']):
            category = IpadCategory(
                name_ar=str(raw_cat.get('name') or 'فئة').strip(),
                name_en=str(raw_cat.get('en') or '').strip(),
                order=c_order,
                is_visible=not raw_cat.get('hidden'),
            )
            if not dry_run:
                category.save()
            self.stdout.write(f'\n■ {category.name_ar}' + ('' if category.is_visible else '  [مخفية]'))

            for i_order, raw in enumerate(raw_cat.get('items') or []):
                key = str(raw.get('id') or '')
                product_id = PRODUCT_FOR.get(key)
                product = products.get(product_id) if product_id else None
                if product_id and product is None:
                    self.stdout.write(self.style.WARNING(
                        f'  ! {key}: product #{product_id} no longer exists — imported as tablet-only'
                    ))
                item = IpadItem(
                    category=category,
                    product=product,
                    name_ar='' if product else str(raw.get('name') or '').strip(),
                    price=None if product else raw.get('price'),
                    name_en=str(raw.get('en') or '').strip(),
                    size_label=tablet_size_label(raw.get('size'), product),
                    order=i_order,
                    is_visible=not raw.get('hidden'),
                )
                if product:
                    linked.add(product.pk)
                self.attach(item.image, site, raw.get('image'), key, dry_run)
                self.attach(item.detail_image, site, raw.get('detailImage'), f'{key}-detail', dry_run,
                            missing=self.missing_details)
                if not dry_run:
                    item.save()
                self.describe(key, raw, item)
        return linked

    def import_gallery(self, site, data, dry_run):
        gallery = data.get('gallery') or {}
        count = 0
        for order, rel in enumerate(gallery.get('images') or []):
            image = IpadGalleryImage(order=order)
            if self.attach(image.image, site, rel, Path(str(rel)).stem, dry_run):
                count += 1
                if not dry_run:
                    image.save()
        self.stdout.write(f'\n■ {gallery.get("name") or "تصميمات خاصة"}: {count} صورة')

    def import_settings(self, data, dry_run):
        raw = data.get('settings') or {}
        gallery = data.get('gallery') or {}
        settings = IpadSettings.load() if not dry_run else IpadSettings()
        try:
            settings.idle_seconds = max(10, int(raw.get('idleSeconds') or 60))
        except (TypeError, ValueError):
            settings.idle_seconds = 60
        settings.location = str(raw.get('location') or '').strip()
        settings.currency = str(raw.get('currency') or 'ر.س').strip()
        settings.gallery_title_ar = str(gallery.get('name') or 'تصميمات خاصة').strip()
        settings.gallery_title_en = str(gallery.get('en') or '').strip()
        settings.gallery_visible = not gallery.get('hidden')
        if not dry_run:
            settings.save()

    # ── helpers ────────────────────────────────────────────────────────────

    def attach(self, field, site, rel, stem, dry_run, missing=None):
        """Upload ``site/rel`` into ``field`` as ``<stem>.<ext>``; False when the file is missing."""
        rel = str(rel or '').strip()
        if not rel:
            return False
        path = (site / rel).resolve()
        if site not in path.parents or not path.is_file():
            (self.missing_files if missing is None else missing).append(Path(rel).name)
            return False
        if not dry_run:
            with path.open('rb') as handle:
                field.save(f'{stem}{path.suffix.lower()}', File(handle), save=False)
        else:
            field.name = rel
        return True

    def describe(self, key, raw, item):
        shown = resolve_item(item)
        price = shown['price']
        line = f'  {key} {raw.get("name", "")}'
        if item.product_id:
            line += f'  →  #{item.product_id} {shown["name"]}'
        else:
            line += '  →  (خاص بالايباد)'
        line += f'  ·  {price} ر.س' if price is not None else '  ·  بدون سعر'
        if shown['was'] is not None:
            line += f' (بدل {shown["was"]})'
        old_price = number(raw.get('price')) if raw.get('price') is not None else None
        if item.product_id and old_price is not None and old_price != price:
            line += f'  [سعر الايباد القديم {old_price}]'
        if shown['hidden_reason'] == 'hidden':
            line += '  [مخفي]'
        elif shown['hidden_reason'] == 'unavailable':
            line += '  [غير متاح في الموقع → ما يظهر]'
        self.stdout.write(line)

    def report_not_on_tablets(self, linked):
        missing = Product.objects.filter(is_available=True).exclude(pk__in=linked).order_by('category__order', 'order')
        if missing:
            self.stdout.write('\nمتاحة في الموقع وما هي في الايباد (تقدر تضيفها من لوحة التحكم):')
            for product in missing:
                self.stdout.write(f'  #{product.pk} {product.name_ar}')
