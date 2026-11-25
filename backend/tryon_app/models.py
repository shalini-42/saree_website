from django.db import models
from django.contrib.auth.models import User
from products.models import Product


class VirtualTryOnJob(models.Model):

    STATUS_CHOICES = [
        ("starting", "Starting"),
        ("processing", "Processing"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    PHOTO_TYPE_CHOICES = [
        ("full", "Full Length"),
        ("half", "Half Length"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="virtual_tryon_jobs"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="virtual_tryon_jobs"
    )

    photo_type = models.CharField(
        max_length=10,
        choices=PHOTO_TYPE_CHOICES
    )

    prediction_id = models.CharField(
        max_length=150,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="starting"
    )

    result_url = models.URLField(
        blank=True,
        max_length=500
    )

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.product.name} - {self.status}"