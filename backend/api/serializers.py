from rest_framework import serializers
from .models import Category, Product


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
            'styled_image', 'size', 'base_price', 'starting_price',
            'is_new', 'is_featured', 'is_available',
        )

    def get_starting_price(self, obj):
        return obj.base_price


class ProductDetailSerializer(ProductListSerializer):
    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            'description_en', 'description_ar', 'order', 'created_at', 'updated_at',
        )


class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Product
        fields = (
            'id', 'name_en', 'name_ar', 'description_en', 'description_ar',
            'category_id', 'display_image', 'styled_image', 'size', 'base_price',
            'is_new', 'is_featured', 'is_available', 'order',
        )

    def validate(self, attrs):
        if self.instance is None:
            if not attrs.get('display_image'):
                raise serializers.ValidationError({'display_image': 'Display image is required.'})
            if not attrs.get('styled_image'):
                raise serializers.ValidationError({'styled_image': 'Featured image is required.'})
        return attrs
