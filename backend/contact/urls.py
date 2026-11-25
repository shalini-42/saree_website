from django.urls import path

from .views import (
    ContactMessageAPIView,
    AdminContactMessageListAPIView,
    AdminContactMessageDetailAPIView,
)

urlpatterns = [
    # Customer contact form
    path("contact/", ContactMessageAPIView.as_view(), name="contact-message"),

    # Admin contact messages
    path(
        "admin/contact/messages/",
        AdminContactMessageListAPIView.as_view(),
        name="admin-contact-messages",
    ),
    path(
        "admin/contact/messages/<int:pk>/",
        AdminContactMessageDetailAPIView.as_view(),
        name="admin-contact-message-detail",
    ),
]