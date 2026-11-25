
from rest_framework import serializers

from .models import Review, ReviewImage


class ReviewImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ReviewImage

        fields = [
            "id",
            "image",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "uploaded_at",
        ]


class ReviewSerializer(serializers.ModelSerializer):

    customer_name = serializers.SerializerMethodField()

    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    images = ReviewImageSerializer(
        many=True,
        read_only=True
    )

    is_verified_purchase = serializers.BooleanField(
        read_only=True
    )

    helpful_count = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Review

        fields = [
            "id",
            "product",
            "product_name",
            "customer",
            "customer_name",
            "verified_order_item",
            "is_verified_purchase",
            "rating",
            "title",
            "comment",
            "images",
            "helpful_count",
            "is_approved",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "product",
            "product_name",
            "customer",
            "customer_name",
            "verified_order_item",
            "is_verified_purchase",
            "images",
            "helpful_count",
            "is_approved",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):

        full_name = (
            f"{obj.customer.first_name} "
            f"{obj.customer.last_name}"
        ).strip()

        return full_name or obj.customer.username
