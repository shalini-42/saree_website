
from django.contrib import admin
from .models import StoreSettings


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):

    list_display = (
        "store_name",
        "store_email",
        "store_phone",
        "updated_at",
    )

    search_fields = (
        "store_name",
        "store_email",
        "business_name",
    )

    readonly_fields = ("updated_at",)

    fieldsets = (
        ("Store Profile", {
            "fields": (
                "store_name",
                "store_email",
                "store_phone",
                "store_logo",
            )
        }),

        ("Business Details", {
            "fields": (
                "business_name",
                "business_email",
                "business_phone",
                "business_address",
                "gst_number",
            )
        }),

        ("Shipping Settings", {
            "fields": (
                "shipping_charge",
                "free_shipping_minimum",
                "estimated_delivery_days",
            )
        }),

        ("Payment Settings", {
            "fields": (
                "cod_enabled",
                "online_payment_enabled",
            )
        }),

        ("Order Settings", {
            "fields": (
                "return_days",
                "order_auto_cancel_enabled",
            )
        }),
    )
