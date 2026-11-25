
from django.urls import path

from .views import (
    CustomerWishlistView,
    RemoveWishlistView,
)

urlpatterns = [
    path(
        "",
        CustomerWishlistView.as_view(),
        name="customer-wishlist"
    ),

    path(
        "remove/<int:product_id>/",
        RemoveWishlistView.as_view(),
        name="remove-wishlist"
    ),
]
