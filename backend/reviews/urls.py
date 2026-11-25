from django.urls import path

from .views import (
    ProductReviewListCreateView,
    CustomerReviewDetailView,
    CustomerReviewImageDeleteView,
    ReviewHelpfulVoteView,
    AdminReviewListView,
    AdminReviewDetailView,
)

urlpatterns = [
    path(
        "products/<int:product_id>/",
        ProductReviewListCreateView.as_view(),
        name="product-reviews"
    ),

    path(
        "<int:review_id>/",
        CustomerReviewDetailView.as_view(),
        name="customer-review-detail"
    ),

    path(
        "images/<int:image_id>/",
        CustomerReviewImageDeleteView.as_view(),
        name="customer-review-image-delete"
    ),

    path(
        "<int:review_id>/helpful/",
        ReviewHelpfulVoteView.as_view(),
        name="review-helpful"
    ),

    path(
        "admin/",
        AdminReviewListView.as_view(),
        name="admin-review-list"
    ),

    path(
        "admin/<int:review_id>/",
        AdminReviewDetailView.as_view(),
        name="admin-review-detail"
    ),
]