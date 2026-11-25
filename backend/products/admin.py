from django.contrib import admin
from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "sku",
        "category",
        "price",
        "stock",
        "is_active",
    )

    search_fields = ("name", "sku")
    list_filter = ("category", "is_active", "is_featured")
    inlines = [ProductImageInline]


admin.site.register(ProductImage)