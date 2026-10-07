from rest_framework import serializers

from .ipad import next_order, product_size_label, resolve_item
from .models import (
    Category,
    IpadCategory,
    IpadGalleryImage,
    IpadItem,
    IpadSettings,
    Product,
    Visit,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    starting_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name_en', 'name_ar', 'category', 'display_image',
            'styled_image', 'size_mode', 'size', 'weight_label', 'base_price', 'discount_price',
            'starting_price', 'is_new', 'is_featured', 'is_available',
        )

    def get_starting_price(self, obj):
        return obj.base_price


class ProductDetailSerializer(ProductListSerializer):
    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            'description_en', 'description_ar', 'order', 'created_at', 'updated_at',
        )


class MenuCategorySerializer(serializers.ModelSerializer):
    """Public category row for the storefront menu, with its live item count."""
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'slug', 'name_en', 'name_ar', 'order', 'product_count')


class MenuProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'slug', 'name_en', 'name_ar')


class MenuProductSerializer(ProductDetailSerializer):
    """Everything a menu card, quick view and product page need in one row.

    The ``*_path`` fields are the storage names of the images; the storefront
    uses them to request sized thumbnails from ``/api/img/<path>``.
    """
    category = MenuProductCategorySerializer(read_only=True)
    display_image_path = serializers.SerializerMethodField()
    styled_image_path = serializers.SerializerMethodField()

    class Meta(ProductDetailSerializer.Meta):
        fields = ProductDetailSerializer.Meta.fields + ('display_image_path', 'styled_image_path')

    def get_display_image_path(self, obj):
        return obj.display_image.name or None

    def get_styled_image_path(self, obj):
        return obj.styled_image.name or None


class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    # The product photo is the only required image; the second one is optional
    # (the model still marks it required, so it is relaxed here).
    styled_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name_en', 'name_ar', 'description_en', 'description_ar',
            'category_id', 'display_image', 'styled_image', 'size_mode', 'size', 'weight_label',
            'base_price', 'discount_price', 'is_new', 'is_featured', 'is_available', 'order',
        )

    # Multipart forms send empty number inputs as "" — read those as "not set"
    # so clearing the sale price in the admin clears it here too.
    EMPTY_AS_NULL = ('base_price', 'discount_price')

    def to_internal_value(self, data):
        if hasattr(data, 'get'):
            blanks = [f for f in self.EMPTY_AS_NULL if data.get(f, None) in ('', 'null', 'undefined')]
            if blanks:
                data = data.copy()
                for field in blanks:
                    data[field] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        size_mode = attrs.get('size_mode', getattr(self.instance, 'size_mode', 'SIZE'))
        size = attrs.get('size', getattr(self.instance, 'size', None))
        weight_label = attrs.get('weight_label', getattr(self.instance, 'weight_label', ''))

        if size_mode == 'WEIGHT':
            attrs['size'] = None
            attrs['weight_label'] = str(weight_label).strip()
        else:
            attrs['size_mode'] = 'SIZE'
            attrs['size'] = size or None
            attrs['weight_label'] = ''

        if self.instance is None and not attrs.get('display_image'):
            raise serializers.ValidationError({'display_image': 'صورة المنتج مطلوبة.'})

        # A blank or non-positive sale price simply means "no discount".
        if 'discount_price' in attrs:
            discount = attrs['discount_price']
            if discount is not None and discount <= 0:
                attrs['discount_price'] = discount = None
            base = attrs.get('base_price', getattr(self.instance, 'base_price', None))
            if discount is not None and base is not None and discount >= base:
                raise serializers.ValidationError(
                    {'discount_price': 'السعر بعد الخصم يجب أن يكون أقل من السعر الأساسي.'}
                )
        return attrs


class VisitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ('visitor_id', 'path', 'referrer', 'device_type')

    def validate_device_type(self, value):
        valid = {choice[0] for choice in Visit.DEVICE_CHOICES}
        return value if value in valid else 'other'


class VisitListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ('id', 'visitor_id', 'path', 'device_type', 'created_at')


# ─── iPad menu (admin) ──────────────────────────────────────────────────────


def storage_name(field):
    return field.name or None


class IpadCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IpadCategory
        fields = ('id', 'name_ar', 'name_en', 'order', 'is_visible')
        extra_kwargs = {'order': {'required': False}}

    def validate_name_ar(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('اكتب اسم الفئة.')
        return value

    def create(self, validated_data):
        validated_data.setdefault('order', next_order(IpadCategory.objects.all()))
        return super().create(validated_data)


class IpadItemSerializer(serializers.ModelSerializer):
    """An iPad item as the admin edits it, plus ``resolved``: what the tablets show."""

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=IpadCategory.objects.all(), source='category'
    )
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', allow_null=True, required=False
    )
    # Sending an empty value clears the photo (the tablet then falls back to
    # the website photo, or shows a single photo on the detail screen).
    image = serializers.ImageField(required=False, allow_null=True)
    detail_image = serializers.ImageField(required=False, allow_null=True)
    image_path = serializers.SerializerMethodField()
    detail_image_path = serializers.SerializerMethodField()
    resolved = serializers.SerializerMethodField()

    class Meta:
        model = IpadItem
        fields = (
            'id', 'category_id', 'product_id', 'name_ar', 'price', 'name_en', 'size_label',
            'image', 'image_path', 'detail_image', 'detail_image_path', 'order', 'is_visible',
            'resolved',
        )
        extra_kwargs = {'order': {'required': False}}

    def get_image_path(self, obj):
        return storage_name(obj.image)

    def get_detail_image_path(self, obj):
        return storage_name(obj.detail_image)

    def get_resolved(self, obj):
        return resolve_item(obj)

    def validate(self, attrs):
        product = attrs['product'] if 'product' in attrs else getattr(self.instance, 'product', None)
        if product is None:
            name = attrs.get('name_ar', getattr(self.instance, 'name_ar', '') or '').strip()
            if not name:
                raise serializers.ValidationError(
                    {'name_ar': 'اختر منتج من الموقع، أو اكتب اسم المنتج الخاص بالايباد.'}
                )
            attrs['name_ar'] = name
            price = attrs.get('price')
            if price is not None and price < 0:
                raise serializers.ValidationError({'price': 'السعر ما يصير بالسالب.'})
        else:
            # Linked items always show the website's name and price.
            attrs['name_ar'] = ''
            attrs['price'] = None
        for field in ('name_en', 'size_label'):
            if field in attrs:
                attrs[field] = attrs[field].strip()
        return attrs

    def create(self, validated_data):
        validated_data.setdefault('order', next_order(validated_data['category'].items.all()))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category = validated_data.get('category')
        if category is not None and category.pk != instance.category_id and 'order' not in validated_data:
            # Moved to another category: it joins the end of that list.
            validated_data['order'] = next_order(category.items.all())
        return super().update(instance, validated_data)


class IpadGalleryImageSerializer(serializers.ModelSerializer):
    image_path = serializers.SerializerMethodField()

    class Meta:
        model = IpadGalleryImage
        fields = ('id', 'image', 'image_path', 'order')
        extra_kwargs = {'order': {'required': False}}

    def get_image_path(self, obj):
        return storage_name(obj.image)

    def create(self, validated_data):
        validated_data.setdefault('order', next_order(IpadGalleryImage.objects.all()))
        return super().create(validated_data)


class IpadSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = IpadSettings
        fields = (
            'idle_seconds', 'location', 'currency',
            'gallery_title_ar', 'gallery_title_en', 'gallery_visible',
        )
        extra_kwargs = {'idle_seconds': {'min_value': 10, 'max_value': 3600}}

    def validate_gallery_title_ar(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('اكتب اسم الصفحة.')
        return value


class IpadProductChoiceSerializer(serializers.ModelSerializer):
    """A website product as the iPad admin's product picker lists it."""

    category = MenuProductCategorySerializer(read_only=True)
    size_label = serializers.SerializerMethodField()
    display_image_path = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name_ar', 'category', 'base_price', 'discount_price', 'is_available',
            'size_label', 'display_image_path',
        )

    def get_size_label(self, obj):
        return product_size_label(obj)

    def get_display_image_path(self, obj):
        return storage_name(obj.display_image) or storage_name(obj.styled_image)
