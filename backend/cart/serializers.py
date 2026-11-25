
from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    product_price = serializers.SerializerMethodField()

    product_image = serializers.SerializerMethodField()

    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "product_image",
            "quantity",
            "subtotal",
        ]

    def get_product_price(self, obj):
        product = obj.product

        if (
            product.discount_price
            and product.discount_price < product.price
        ):
            return product.discount_price

        return product.price

    def get_product_image(self, obj):
        request = self.context.get("request")

        images = obj.product.images.all()

        primary_image = images.filter(
            is_primary=True
        ).first()

        if not primary_image:
            primary_image = images.first()

        if not primary_image or not primary_image.image:
            return None

        image_url = primary_image.image.url

        if request:
            return request.build_absolute_uri(image_url)

        return image_url


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total_items",
            "subtotal",
            "created_at",
            "updated_at",
        ]
