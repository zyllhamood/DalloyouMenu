from rest_framework import serializers
from .models import Category, Product, ProductVariant

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'
        read_only_fields = ('product',)

class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    starting_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name_en', 'name_ar', 'category', 'styled_image',
            'base_price', 'starting_price', 'is_new', 'is_featured', 'is_available'
        )

    def get_starting_price(self, obj):
        variants = obj.variants.filter(is_available=True)
        if variants.exists():
            return min(v.price for v in variants)
        return obj.base_price

class ProductDetailSerializer(ProductListSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ('description_en', 'description_ar', 'variants')

class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    variants = ProductVariantSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = (
            'id', 'name_en', 'name_ar', 'description_en', 'description_ar',
            'category_id', 'styled_image', 'base_price',
            'is_new', 'is_featured', 'is_available', 'order', 'variants'
        )

    def to_internal_value(self, data):
        SIZE_TOKENS = {'SMALL', 'MEDIUM', 'LARGE'}
        files_by_size = {}
        new_data = {}
        
        # We assume data behaves like a dict or QueryDict
        keys = list(data.keys()) if hasattr(data, 'keys') else []
        for key in keys:
            if key.startswith('variant_') and key.endswith('_image'):
                size = key[len('variant_'):-len('_image')]
                if size in SIZE_TOKENS:
                    files_by_size[size] = data.get(key)
                    continue
            new_data[key] = data.get(key)
            
        v = new_data.get('variants')
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v) if v.strip() else []
            except json.JSONDecodeError:
                parsed = []
        elif isinstance(v, list):
            parsed = v
        else:
            parsed = []
            
        for variant in parsed:
            if isinstance(variant, dict):
                size = variant.get('size')
                if size in files_by_size:
                    variant['image'] = files_by_size[size]
                    
        new_data['variants'] = parsed
        return super().to_internal_value(new_data)

    def validate_variants(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one size variant is required."
            )
        return value

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        product = Product.objects.create(**validated_data)
        for variant_data in variants_data:
            ProductVariant.objects.create(product=product, **variant_data)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if variants_data is not None:
            # We will handle nested updates by clearing and recreating, 
            # or updating if matched. A simple approach is deleting old and creating new.
            # But the prompt says "handle nested variants properly".
            # Proper handling might mean deleting missing ones and updating existing, but size is a unique choice.
            existing_variants = {v.size: v for v in instance.variants.all()}
            seen_sizes = set()

            for v_data in variants_data:
                size = v_data.get('size')
                seen_sizes.add(size)
                if size in existing_variants:
                    variant = existing_variants[size]
                    for k, v in v_data.items():
                        setattr(variant, k, v)
                    variant.save()
                else:
                    ProductVariant.objects.create(product=instance, **v_data)
            
            # Delete sizes not in the new payload
            for size, variant in existing_variants.items():
                if size not in seen_sizes:
                    variant.delete()

        return instance
