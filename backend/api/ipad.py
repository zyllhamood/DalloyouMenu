"""
What the in-store tablets (dalloyou.com/ipad) show.

An iPad item linked to a website product takes its name, price, discount and
availability from that product, so a change in the admin reaches the website
and the tablets together. ``resolve_item`` is the one place that decides what
an item displays; the public menu and the admin preview both use it, so the
admin always shows exactly what the tablets will.
"""

import hashlib
import json
from decimal import Decimal

from django.db.models import Max, Prefetch

from .models import IpadCategory, IpadGalleryImage, IpadItem, IpadSettings

SIZE_LABELS = {'SMALL': 'صغير', 'MEDIUM': 'وسط', 'LARGE': 'كبير'}

# Why an item is not on the tablets (None when it is shown).
HIDDEN = 'hidden'              # switched off in the iPad admin
UNAVAILABLE = 'unavailable'    # the website product is marked unavailable
NO_NAME = 'no_name'            # a tablet-only item without a name


def number(value):
    """Decimal → int when whole (96), float otherwise (96.5); None stays None."""
    if value is None:
        return None
    value = Decimal(value)
    return int(value) if value == value.to_integral_value() else float(value)


def product_size_label(product) -> str:
    """"وسط" / "300 جرام" / "" — the product's own size or weight."""
    if product.size_mode == 'WEIGHT':
        return (product.weight_label or '').strip()
    return SIZE_LABELS.get(product.size or '', '')


def resolve_item(item: IpadItem) -> dict:
    product = item.product
    if product is not None:
        name = (product.name_ar or product.name_en or '').strip()
        base, sale = product.base_price, product.discount_price
        on_sale = sale is not None and base is not None and 0 < sale < base
        price = sale if on_sale else base
        was = base if on_sale else None
        size = item.size_label or product_size_label(product)
        image = item.image.name or product.display_image.name or product.styled_image.name
        available = product.is_available
    else:
        name = item.name_ar.strip()
        price, was = item.price, None
        size = item.size_label
        image = item.image.name
        available = True

    if not item.is_visible:
        hidden_reason = HIDDEN
    elif not available:
        hidden_reason = UNAVAILABLE
    elif not name:
        hidden_reason = NO_NAME
    else:
        hidden_reason = None

    return {
        'name': name,
        'en': item.name_en.strip(),
        'size': size.strip(),
        'price': number(price),
        'was': number(was),
        'image': image or None,
        'detail_image': item.detail_image.name or None,
        'hidden_reason': hidden_reason,
    }


def next_order(queryset) -> int:
    """One past the highest ``order`` in ``queryset`` (0 when it is empty)."""
    highest = queryset.aggregate(m=Max('order'))['m']
    return 0 if highest is None else highest + 1


def items_prefetch():
    return Prefetch('items', queryset=IpadItem.objects.select_related('product').order_by('order', 'id'))


def public_menu() -> dict:
    """The tablets' whole menu in one payload, with a ``version`` they poll."""
    settings = IpadSettings.load()

    categories = []
    for category in IpadCategory.objects.filter(is_visible=True).prefetch_related(items_prefetch()):
        items = []
        for item in category.items.all():
            shown = resolve_item(item)
            if shown.pop('hidden_reason'):
                continue
            items.append({'id': item.id, **shown})
        # A tab with nothing in it is no use to a customer.
        if items:
            categories.append({
                'id': category.id,
                'name': category.name_ar,
                'en': category.name_en,
                'items': items,
            })

    gallery_images = []
    if settings.gallery_visible:
        gallery_images = [g.image.name for g in IpadGalleryImage.objects.all() if g.image.name]

    payload = {
        'settings': {
            'idle_seconds': settings.idle_seconds,
            'location': settings.location,
            'currency': settings.currency,
        },
        'categories': categories,
        'gallery': {
            'name': settings.gallery_title_ar,
            'en': settings.gallery_title_en,
            'images': gallery_images,
        },
    }
    # Changes whenever anything a customer can see changes, and only then.
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    payload['version'] = hashlib.sha1(canonical.encode('utf-8')).hexdigest()[:16]
    return payload
