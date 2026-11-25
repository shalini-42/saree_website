
from rest_framework import serializers

from .models import (
    Order,
    OrderItem,
    ReturnExchangeRequest,
)


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price",
            "subtotal",
            "product_image",
        ]

    def get_product_image(self, obj):
        request = self.context.get("request")

        if not obj.product:
            return None

        image = obj.product.images.filter(is_primary=True).first()

        if not image:
            image = obj.product.images.first()

        if image and image.image:
            image_url = image.image.url

            if request:
                return request.build_absolute_uri(image_url)

            return image_url

        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "customer",
            "full_name",
            "email",
            "phone",
            "address",
            "city",
            "state",
            "pincode",
            "subtotal",
            "shipping_charge",
            "total_amount",
            "status",
            "payment_method",
            "payment_status",
            "estimated_delivery_date",
            "delivered_at",
            "items",
            "created_at",
            "updated_at",
        ]

        read_only_fields = fields


class ReturnExchangeRequestSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(
        source="order.order_number",
        read_only=True
    )

    product_name = serializers.CharField(
        source="order_item.product_name",
        read_only=True
    )

    product_image = serializers.SerializerMethodField()

    class Meta:
        model = ReturnExchangeRequest
        fields = [
            "id",
            "order",
            "order_number",
            "order_item",
            "product_name",
            "product_image",
            "customer",
            "request_type",
            "reason",
            "description",
            "status",
            "admin_note",
            "requested_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "order",
            "order_number",
            "product_name",
            "product_image",
            "customer",
            "status",
            "admin_note",
            "requested_at",
            "updated_at",
        ]

    def get_product_image(self, obj):
        request = self.context.get("request")

        if not obj.order_item or not obj.order_item.product:
            return None

        product = obj.order_item.product

        image = product.images.filter(is_primary=True).first()

        if not image:
            image = product.images.first()

        if image and image.image:
            image_url = image.image.url

            if request:
                return request.build_absolute_uri(image_url)

            return image_url

        return None


class CustomerReturnExchangeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnExchangeRequest
        fields = [
            "order_item",
            "request_type",
            "reason",
            "description",
        ]

    def validate_order_item(self, order_item):
        request = self.context["request"]

        if order_item.order.customer_id != request.user.id:
            raise serializers.ValidationError(
                "This item does not belong to your order."
            )

        if order_item.order.status != "Delivered":
            raise serializers.ValidationError(
                "Returns and exchanges are available only for delivered orders."
            )

        existing_request = ReturnExchangeRequest.objects.filter(
            order_item=order_item,
            status__in=["Pending", "Approved", "Completed"]
        ).exists()

        if existing_request:
            raise serializers.ValidationError(
                "A return or exchange request already exists for this item."
            )

        return order_item
