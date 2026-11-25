
from django.urls import path

from .views import (
    AdminOrderListView,
    AdminOrderDetailView,
    CustomerCheckoutView,
    CustomerOrderListView,
    CustomerOrderDetailView,
    CustomerCancelOrderView,
    CustomerOrderInvoiceView,
    CustomerReturnExchangeCreateView,
    CustomerReturnExchangeListView,
    CustomerReturnExchangeDetailView,
    AdminReturnExchangeListView,
    AdminReturnExchangeDetailView,
)

urlpatterns = [
    # Admin order APIs
    path("", AdminOrderListView.as_view(), name="admin-order-list"),
    path("<int:pk>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),

    # Customer order APIs
    path("checkout/", CustomerCheckoutView.as_view(), name="customer-checkout"),
    path("my-orders/", CustomerOrderListView.as_view(), name="customer-my-orders"),

    path(
        "my-orders/<int:pk>/cancel/",
        CustomerCancelOrderView.as_view(),
        name="customer-cancel-order"
    ),

    path(
        "my-orders/<int:pk>/invoice/",
        CustomerOrderInvoiceView.as_view(),
        name="customer-order-invoice"
    ),

    path(
        "my-orders/<int:pk>/",
        CustomerOrderDetailView.as_view(),
        name="customer-order-detail"
    ),

    # Customer return / exchange APIs
    path(
        "return-exchange/",
        CustomerReturnExchangeCreateView.as_view(),
        name="customer-return-exchange-create"
    ),

    path(
        "my-returns/",
        CustomerReturnExchangeListView.as_view(),
        name="customer-my-returns"
    ),

    path(
        "my-returns/<int:pk>/",
        CustomerReturnExchangeDetailView.as_view(),
        name="customer-return-exchange-detail"
    ),

    # Admin return / exchange APIs
    path(
        "admin/return-exchanges/",
        AdminReturnExchangeListView.as_view(),
        name="admin-return-exchange-list"
    ),

    path(
        "admin/return-exchanges/<int:pk>/",
        AdminReturnExchangeDetailView.as_view(),
        name="admin-return-exchange-detail"
    ),
]
