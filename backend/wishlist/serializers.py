
from rest_framework import serializers
from .models import Wishlist


class WishlistSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    product_price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    discount_price = serializers.DecimalField(
        source="product.discount_price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    product_image = serializers.SerializerMethodField()

    product_stock = serializers.IntegerField(
        source="product.stock",
        read_only=True
    )

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "discount_price",
            "product_image",
            "product_stock",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_product_image(self, obj):
        request = self.context.get("request")

        image = obj.product.images.filter(
            is_primary=True
        ).first()

        if not image:
            image = obj.product.images.first()

        if image and image.image:
            image_url = image.image.url

            if request:
                return request.build_absolute_uri(image_url)

            return image_url

        return None
