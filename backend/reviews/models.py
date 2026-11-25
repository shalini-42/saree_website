
from django.conf import settings
from django.db import models


class Review(models.Model):

    RATING_CHOICES = [
        (1, "1 Star"),
        (2, "2 Stars"),
        (3, "3 Stars"),
        (4, "4 Stars"),
        (5, "5 Stars"),
    ]

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_reviews"
    )

    verified_order_item = models.ForeignKey(
        "orders.OrderItem",
        on_delete=models.PROTECT,
        related_name="verified_reviews",
        null=True,
        blank=True
    )

    # Review rating
    rating = models.PositiveSmallIntegerField(
        choices=RATING_CHOICES
    )

    # Short review heading
    title = models.CharField(
        max_length=150,
        blank=True
    )

    # Detailed customer experience
    comment = models.TextField(
        blank=True,
        max_length=2000
    )

    # Admin moderation
    is_approved = models.BooleanField(
        default=False
    )

    # Review timestamps
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["product", "customer"],
                name="unique_customer_product_review"
            ),

            models.CheckConstraint(
                condition=models.Q(
                    rating__gte=1,
                    rating__lte=5
                ),
                name="review_rating_between_1_and_5"
            ),
        ]

    @property
    def is_verified_purchase(self):
        return (
            self.verified_order_item is not None
            and self.verified_order_item.order.customer_id
            == self.customer_id
            and self.verified_order_item.product_id
            == self.product_id
            and self.verified_order_item.order.status == "Delivered"
        )

    @property
    def helpful_count(self):
        return self.helpful_votes.count()

    def __str__(self):
        return f"{self.customer} - {self.product} ({self.rating}/5)"


class ReviewImage(models.Model):

    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name="images"
    )

    image = models.ImageField(
        upload_to="reviews/customer_photos/"
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Review image - {self.review_id}"


class ReviewHelpfulVote(models.Model):

    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name="helpful_votes"
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="review_helpful_votes"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=["review", "customer"],
                name="unique_customer_review_helpful_vote"
            )
        ]

    def __str__(self):
        return f"{self.customer} found review {self.review_id} helpful"
