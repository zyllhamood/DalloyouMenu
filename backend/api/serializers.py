from rest_framework import serializers
from .models import Category, Product, Visit


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
