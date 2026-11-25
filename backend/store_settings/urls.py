
from django.urls import path
from .views import StoreSettingsAPIView

urlpatterns = [
    path(
        "settings/",
        StoreSettingsAPIView.as_view(),
        name="store-settings"
    ),
]
