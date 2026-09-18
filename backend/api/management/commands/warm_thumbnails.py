from django.core.management.base import BaseCommand

from api.images import render_thumbnail, thumbnail_path
from api.models import Product

# The sizes the storefront requests most (cards, rails, quick view, product page).
DEFAULT_WIDTHS = (160, 320, 640, 960, 1280)


class Command(BaseCommand):
    help = 'Pre-render the cached WebP thumbnails for every available product image.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--widths',
            default=','.join(str(w) for w in DEFAULT_WIDTHS),
            help='Comma-separated widths to render (default: %(default)s).',
        )

    def handle(self, *args, **options):
        widths = [int(w) for w in options['widths'].split(',') if w.strip()]
        names = set()
        for product in Product.objects.filter(is_available=True):
            for field in (product.display_image, product.styled_image):
                if field and field.name:
                    names.add(field.name)

        rendered = skipped = failed = 0
        for name in sorted(names):
            for width in widths:
                if thumbnail_path(name, width).exists():
                    skipped += 1
                    continue
                try:
                    render_thumbnail(name, width)
                    rendered += 1
                except Exception as exc:  # keep going; report at the end
                    failed += 1
                    self.stderr.write(f'  ✗ {name} @{width}: {exc}')

        self.stdout.write(self.style.SUCCESS(
            f'{len(names)} images · rendered {rendered} · cached {skipped} · failed {failed}'
        ))
