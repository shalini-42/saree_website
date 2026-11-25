
from django.db import models
from django.contrib.auth.models import User
from products.models import Product


class Order(models.Model):

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Confirmed", "Confirmed"),
        ("Processing", "Processing"),
        ("Shipped", "Shipped"),
        ("Delivered", "Delivered"),
        ("Cancelled", "Cancelled"),
    ]

    PAYMENT_CHOICES = [
        ("Pending", "Pending"),
        ("Paid", "Paid"),
        ("Failed", "Failed"),
        ("COD", "Cash on Delivery"),
        ("Refunded", "Refunded"),
    ]

    customer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="orders"
    )

    order_number = models.CharField(
        max_length=30,
        unique=True
    )

    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)

    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    shipping_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    # Delivery information
    estimated_delivery_date = models.DateField(
        null=True,
        blank=True
    )

    delivered_at = models.DateTimeField(
        null=True,
        blank=True
    )

    payment_method = models.CharField(
        max_length=20,
        choices=[
            ("COD", "Cash on Delivery"),
            ("Online", "Online Payment"),
        ],
        default="COD"
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="Pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items"
    )

    product_name = models.CharField(max_length=200)

    quantity = models.PositiveIntegerField(default=1)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class ReturnExchangeRequest(models.Model):

    REQUEST_TYPE_CHOICES = [
        ("Return", "Return"),
        ("Exchange", "Exchange"),
    ]

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
        ("Completed", "Completed"),
    ]

    REASON_CHOICES = [
        ("Damaged Product", "Damaged Product"),
        ("Wrong Product", "Wrong Product"),
        ("Different from Description", "Different from Description"),
        ("Size or Design Issue", "Size or Design Issue"),
        ("Quality Issue", "Quality Issue"),
        ("Other", "Other"),
    ]

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="return_exchange_requests"
    )

    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="return_exchange_requests"
    )

    customer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="return_exchange_requests"
    )

    request_type = models.CharField(
        max_length=20,
        choices=REQUEST_TYPE_CHOICES
    )

    reason = models.CharField(
        max_length=100,
        choices=REASON_CHOICES
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    admin_note = models.TextField(
        blank=True,
        null=True
    )

    requested_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.request_type} - {self.order.order_number}"
