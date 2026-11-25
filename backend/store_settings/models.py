
from django.db import models


class StoreSettings(models.Model):

    # Store Profile
    store_name = models.CharField(max_length=200, default="SĀRIKA")
    store_email = models.EmailField(blank=True)
    store_phone = models.CharField(max_length=20, blank=True)
    store_logo = models.ImageField(
        upload_to="store/logo/",
        blank=True,
        null=True
    )
    tagline = models.CharField(
        max_length=255,
        default="The Art of Indian Elegance"
        )
    store_address = models.TextField(blank=True)
    website = models.URLField(blank=True)

    # Business Details
    business_name = models.CharField(max_length=200, blank=True)
    business_email = models.EmailField(blank=True)
    business_phone = models.CharField(max_length=20, blank=True)
    business_address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=30, blank=True)

    # Shipping Settings
    shipping_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    free_shipping_minimum = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=999
    )
    estimated_delivery_days = models.PositiveIntegerField(default=5)

    # Payment Settings
    cod_enabled = models.BooleanField(default=True)
    online_payment_enabled = models.BooleanField(default=True)

    # Order Settings
    return_days = models.PositiveIntegerField(default=7)
    order_auto_cancel_enabled = models.BooleanField(default=False)

    order_email_notification = models.BooleanField(default=True)

    order_auto_confirm = models.BooleanField(default=False)

    # General
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Store Settings"
        verbose_name_plural = "Store Settings"

    def __str__(self):
        return self.store_name
