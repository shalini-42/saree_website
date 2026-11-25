
from django.urls import path

from .views import (
    AdminRegisterView,
    AdminLoginView,
    CustomerLoginView,
    CustomerRegisterView,
    AdminProfileView,
    AdminDashboardView,
    AdminUsersListView,
    AdminCustomersListView,
    AdminCustomerDetailView,
    AdminAnalyticsView,
    CustomerProfileView,
    CustomerChangePasswordView,
    CustomerForgotPasswordView,
    CustomerVerifyResetOTPView,
    CustomerResetPasswordView,
    AdminCustomerStatusView,
    AdminChangePasswordView,
    
)

urlpatterns = [
    path("register/", AdminRegisterView.as_view(), name="admin-register"),
    path("login/", AdminLoginView.as_view(), name="admin-login"),

    path(
        "customer/login/",
        CustomerLoginView.as_view(),
        name="customer-login"
    ),

    path(
        "customer/register/",
        CustomerRegisterView.as_view(),
        name="customer-register"
    ),

    path("profile/", AdminProfileView.as_view(), name="admin-profile"),
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("users/", AdminUsersListView.as_view(), name="admin-users"),
    path("analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),

    path(
        "customer/profile/",
        CustomerProfileView.as_view(),
        name="customer-profile"
    ),

    path(
        "customer/change-password/",
        CustomerChangePasswordView.as_view(),
        name="customer-change-password"
    ),

    path(
    "customer/forgot-password/",
    CustomerForgotPasswordView.as_view(),
    name="customer-forgot-password"
),

path(
    "customer/verify-reset-otp/",
    CustomerVerifyResetOTPView.as_view(),
    name="customer-verify-reset-otp"
),

path(
    "customer/reset-password/",
    CustomerResetPasswordView.as_view(),
    name="customer-reset-password"
),
path(
    "customers/",
    AdminCustomersListView.as_view(),
    name="admin-customers"
),

path(
    "customers/<int:customer_id>/status/",
    AdminCustomerStatusView.as_view(),
    name="admin-customer-status"
),
path(
    "customers/<int:customer_id>/",
    AdminCustomerDetailView.as_view(),
    name="admin-customer-detail"
),
path(
    "change-password/",
    AdminChangePasswordView.as_view(),
    name="admin-change-password"
),
]
