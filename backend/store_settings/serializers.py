
from rest_framework import serializers
from .models import StoreSettings


class StoreSettingsSerializer(serializers.ModelSerializer):

    store_logo = serializers.ImageField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = StoreSettings
        fields = [
            "id",

            # Store Profile
            "store_name",
            "store_email",
            "store_phone",
            "store_logo",

            # Business Details
            "business_name",
            "business_email",
            "business_phone",
            "business_address",
            "gst_number",

            # Shipping
            "shipping_charge",
            "free_shipping_minimum",
            "estimated_delivery_days",

            # Payments
            "cod_enabled",
            "online_payment_enabled",

            # Orders
            "return_days",
            "order_auto_cancel_enabled",

            # General
            "updated_at",

            "tagline",
"store_address",
"website",
"order_email_notification",
"order_auto_confirm",
        ]

        read_only_fields = ["id", "updated_at"]
