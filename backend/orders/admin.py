
from django.contrib import admin
from .models import Order, OrderItem, ReturnExchangeRequest


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name", "quantity", "price", "subtotal")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer",
        "total_amount",
        "status",
        "payment_status",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_status",
        "created_at",
    )

    search_fields = (
        "order_number",
        "full_name",
        "email",
        "phone",
    )

    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "product_name",
        "order",
        "quantity",
        "price",
        "subtotal",
    )


@admin.register(ReturnExchangeRequest)
class ReturnExchangeRequestAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "customer",
        "request_type",
        "reason",
        "status",
        "requested_at",
    )

    list_filter = (
        "request_type",
        "status",
        "reason",
        "requested_at",
    )

    search_fields = (
        "order__order_number",
        "customer__username",
        "customer__email",
    )

    readonly_fields = (
        "requested_at",
        "updated_at",
    )
