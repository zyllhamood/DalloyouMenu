"""
On-demand, cached WebP thumbnails for product images.

The originals uploaded through the admin are full-size PNG/JPEG files of
1–3 MB each. Serving them as-is to a phone rendering a 180px card is the
single biggest cost of the public menu, so the storefront asks for a sized
variant instead (``/api/img/<storage-name>?w=640``).

Each variant is rendered once from the configured default storage, written
to ``settings.IMAGE_CACHE_DIR`` and served from disk afterwards. Nothing is
written back to the storage bucket and no model changes are involved; the
cache is disposable and can be deleted at any time (or pre-filled with
``manage.py warm_thumbnails``).
"""

import hashlib
import os
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from PIL import Image, ImageOps

# Widths the storefront's srcset asks for. Requests are snapped up to the
# nearest one so the cache stays bounded (a handful of files per image).
ALLOWED_WIDTHS = (160, 320, 480, 640, 960, 1280, 1600)
DEFAULT_WIDTH = 640
WEBP_QUALITY = 82


def cache_dir() -> Path:
    return Path(getattr(settings, 'IMAGE_CACHE_DIR', settings.BASE_DIR / 'cache' / 'img'))


def snap_width(value) -> int:
    try:
        requested = int(value)
    except (TypeError, ValueError):
        return DEFAULT_WIDTH
    for width in ALLOWED_WIDTHS:
        if requested <= width:
            return width
    return ALLOWED_WIDTHS[-1]


def thumbnail_path(name: str, width: int) -> Path:
    digest = hashlib.sha1(name.encode('utf-8')).hexdigest()
    return cache_dir() / digest[:2] / f'{digest}-{width}.webp'


def render_thumbnail(name: str, width: int) -> Path:
    """Return the cached WebP for ``name`` at ``width``, rendering it if needed."""
    target = thumbnail_path(name, width)
    if target.exists():
        return target

    with default_storage.open(name, 'rb') as source:
        image = Image.open(source)
        image.load()

    # Phone photos carry their rotation in EXIF; browsers honour it for the
    # original, so the thumbnail must too.
    image = ImageOps.exif_transpose(image)
    has_alpha = image.mode in ('RGBA', 'LA', 'PA') or (
        image.mode == 'P' and 'transparency' in image.info
    )
    image = image.convert('RGBA' if has_alpha else 'RGB')

    if image.width > width:
        height = max(1, round(image.height * width / image.width))
        image = image.resize((width, height), Image.LANCZOS)

    target.parent.mkdir(parents=True, exist_ok=True)
    # Write to a temp file and rename so a concurrent request never serves a
    # half-written image.
    fd, tmp_name = tempfile.mkstemp(dir=target.parent, suffix='.tmp')
    try:
        with os.fdopen(fd, 'wb') as out:
            image.save(out, 'WEBP', quality=WEBP_QUALITY, method=4)
        os.replace(tmp_name, target)
    except BaseException:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)
        raise
    return target
