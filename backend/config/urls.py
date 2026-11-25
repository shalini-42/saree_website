from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from accounts.views import CustomerProfileView

from store_settings.views import PublicStoreSettingsAPIView

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Product and category APIs
    path("api/", include("products.urls")),
    path("api/", include("categories.urls")),

    # Accounts APIs
    path("api/admin/", include("accounts.urls")),

    # Customer profile
    path(
        "api/customer/profile/",
        CustomerProfileView.as_view(),
        name="customer-profile"
    ),

    # Orders APIs
    path("api/orders/", include("orders.urls")),

    # Cart APIs
    path("api/cart/", include("cart.urls")),

    # Wishlist APIs
    path("api/customer/wishlist/", include("wishlist.urls")),

    path("api/reviews/", include("reviews.urls")),

    path("api/admin/", include("store_settings.urls")),

    path(
    "api/store/settings/",
    PublicStoreSettingsAPIView.as_view(),
    name="public-store-settings"
),
path("api/", include("contact.urls")),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )