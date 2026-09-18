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
            'styled_image', 'size_mode', 'size', 'weight_label', 'base_price', 'starting_price',
            'is_new', 'is_featured', 'is_available',
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

    class Meta:
        model = Product
        fields = (
            'id', 'name_en', 'name_ar', 'description_en', 'description_ar',
            'category_id', 'display_image', 'styled_image', 'size_mode', 'size', 'weight_label', 'base_price',
            'is_new', 'is_featured', 'is_available', 'order',
        )

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

        if self.instance is None:
            if not attrs.get('display_image'):
                raise serializers.ValidationError({'display_image': 'Display image is required.'})
            if not attrs.get('styled_image'):
                raise serializers.ValidationError({'styled_image': 'Featured image is required.'})
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
