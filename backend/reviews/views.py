
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q, Avg, Count

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status

from products.models import Product
from orders.models import OrderItem

from .models import Review, ReviewImage, ReviewHelpfulVote
from .serializers import ReviewSerializer


MAX_IMAGE_SIZE = 5 * 1024 * 1024
MAX_REVIEW_IMAGES = 5
MAX_COMMENT_LENGTH = 2000
MAX_TITLE_LENGTH = 150


def get_review_queryset():
    return Review.objects.select_related(
        "customer",
        "product",
        "verified_order_item",
        "verified_order_item__order",
    ).prefetch_related("images")


def validate_review_images(images, existing_count=0):
    if existing_count + len(images) > MAX_REVIEW_IMAGES:
        return "You can upload a maximum of 5 review images."

    for image in images:
        if image.size > MAX_IMAGE_SIZE:
            return f"{image.name} exceeds the maximum image size of 5 MB."

        if not image.content_type.startswith("image/"):
            return f"{image.name} is not a valid image."

    return None


def parse_rating(value):
    try:
        rating = int(value)
    except (TypeError, ValueError):
        return None

    if rating < 1 or rating > 5:
        return None

    return rating


def parse_boolean(value):
    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        value = value.strip().lower()

        if value in ("true", "1", "yes"):
            return True

        if value in ("false", "0", "no"):
            return False

    return None


def validate_title(value):
    if not isinstance(value, str):
        return None, "Review title must be text."

    value = value.strip()

    if len(value) > MAX_TITLE_LENGTH:
        return None, "Review title cannot exceed 150 characters."

    return value, None


def validate_comment(value):
    if not isinstance(value, str):
        return None, "Review comment must be text."

    value = value.strip()

    if len(value) > MAX_COMMENT_LENGTH:
        return None, "Review comment cannot exceed 2000 characters."

    return value, None


# ============================================================
# CUSTOMER: PRODUCT REVIEW LIST AND CREATE
# ============================================================

class ProductReviewListCreateView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, product_id):

        product = get_object_or_404(Product, id=product_id)

        reviews = get_review_queryset().filter(
            product=product,
            is_approved=True
        )

        # Rating filter: 1, 2, 3, 4 or 5.
        rating = request.query_params.get("rating")

        if rating:
            rating_value = parse_rating(rating)

            if rating_value is None:
                return Response(
                    {"error": "Invalid rating filter."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reviews = reviews.filter(rating=rating_value)

        # Verified purchase filter.
        verified = request.query_params.get("verified")

        if verified is not None:
            verified_value = parse_boolean(verified)

            if verified_value is None:
                return Response(
                    {"error": "Invalid verified filter."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if verified_value:
                reviews = reviews.filter(
                    verified_order_item__isnull=False,
                    verified_order_item__order__customer=product_reviews_customer(request),
                    verified_order_item__order__status="Delivered",
                ) if request.user.is_authenticated else reviews.filter(
                    verified_order_item__isnull=False,
                    verified_order_item__order__status="Delivered",
                )

        # Photo-only filter.
        photos_only = request.query_params.get("photos_only")

        if photos_only is not None:
            photos_value = parse_boolean(photos_only)

            if photos_value is None:
                return Response(
                    {"error": "Invalid photos_only filter."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if photos_value:
                reviews = reviews.filter(images__isnull=False).distinct()

        # Sorting.
        sort = request.query_params.get("sort", "newest")

        if sort == "newest":
            reviews = reviews.order_by("-created_at")

        elif sort == "highest":
            reviews = reviews.order_by("-rating", "-created_at")

        elif sort == "lowest":
            reviews = reviews.order_by("rating", "-created_at")

        elif sort == "helpful":
            reviews = reviews.annotate(
                helpful_total=Count("helpful_votes")
            ).order_by("-helpful_total", "-created_at")

        else:
            return Response(
                {"error": "Invalid sort option."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Summary uses all approved reviews, not filtered reviews.
        all_approved = Review.objects.filter(
            product=product,
            is_approved=True
        )

        summary = all_approved.aggregate(
            average_rating=Avg("rating"),
            total_reviews=Count("id")
        )

        rating_breakdown = {}

        for star in range(5, 0, -1):
            rating_breakdown[str(star)] = all_approved.filter(
                rating=star
            ).count()

        reviews_serializer = ReviewSerializer(
            reviews,
            many=True,
            context={"request": request}
        )

        my_review = None

        if request.user.is_authenticated:
            customer_review = get_review_queryset().filter(
                product=product,
                customer=request.user
            ).first()

            if customer_review:
                my_review = ReviewSerializer(
                    customer_review,
                    context={"request": request}
                ).data

        return Response({
            "summary": {
                "average_rating": round(
                    summary["average_rating"] or 0, 1
                ),
                "total_reviews": summary["total_reviews"],
                "rating_breakdown": rating_breakdown,
            },
            "reviews": reviews_serializer.data,
            "my_review": my_review,
        }, status=status.HTTP_200_OK)

    def post(self, request, product_id):

        if not request.user.is_authenticated:
            return Response(
                {"error": "Please login to submit a review."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        product = get_object_or_404(Product, id=product_id)
        customer = request.user

        existing_review = Review.objects.filter(
            product=product,
            customer=customer
        ).first()

        if existing_review:
            return Response({
                "error": (
                    "You have already reviewed this product. "
                    "Please edit your existing review."
                ),
                "review_id": existing_review.id,
                "is_approved": existing_review.is_approved,
            }, status=status.HTTP_400_BAD_REQUEST)

        # IMPORTANT: Order uses the field "customer", not "user".
        delivered_order_item = OrderItem.objects.filter(
            order__customer=customer,
            order__status="Delivered",
            product=product
        ).select_related(
            "order",
            "product"
        ).first()

        if not delivered_order_item:
            return Response({
                "error": (
                    "You can review this product only after "
                    "purchasing and receiving it."
                )
            }, status=status.HTTP_400_BAD_REQUEST)

        rating = parse_rating(request.data.get("rating"))

        if rating is None:
            return Response({
                "error": "Please provide a valid rating between 1 and 5."
            }, status=status.HTTP_400_BAD_REQUEST)

        title, title_error = validate_title(
            request.data.get("title", "")
        )

        if title_error:
            return Response(
                {"error": title_error},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment, comment_error = validate_comment(
            request.data.get("comment", "")
        )

        if comment_error:
            return Response(
                {"error": comment_error},
                status=status.HTTP_400_BAD_REQUEST
            )

        images = request.FILES.getlist("images")

        image_error = validate_review_images(images)

        if image_error:
            return Response(
                {"error": image_error},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            review = Review.objects.create(
                product=product,
                customer=customer,
                verified_order_item=delivered_order_item,
                rating=rating,
                title=title,
                comment=comment,
                is_approved=False,
            )

            for image in images:
                ReviewImage.objects.create(
                    review=review,
                    image=image
                )

        review = get_review_queryset().get(id=review.id)

        serializer = ReviewSerializer(
            review,
            context={"request": request}
        )

        return Response({
            "message": (
                "Your review has been submitted successfully "
                "and is waiting for admin approval."
            ),
            "review": serializer.data,
        }, status=status.HTTP_201_CREATED)


# ============================================================
# CUSTOMER: VIEW, EDIT AND DELETE OWN REVIEW
# ============================================================

class CustomerReviewDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_customer_review(self, request, review_id):
        return get_object_or_404(
            get_review_queryset(),
            id=review_id,
            customer=request.user
        )

    def get(self, request, review_id):

        review = self.get_customer_review(request, review_id)

        serializer = ReviewSerializer(
            review,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, review_id):

        review = self.get_customer_review(request, review_id)

        if "rating" in request.data:
            rating = parse_rating(request.data.get("rating"))

            if rating is None:
                return Response(
                    {"error": "Rating must be between 1 and 5."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            review.rating = rating

        if "title" in request.data:
            title, title_error = validate_title(
                request.data.get("title")
            )

            if title_error:
                return Response(
                    {"error": title_error},
                    status=status.HTTP_400_BAD_REQUEST
                )

            review.title = title

        if "comment" in request.data:
            comment, comment_error = validate_comment(
                request.data.get("comment")
            )

            if comment_error:
                return Response(
                    {"error": comment_error},
                    status=status.HTTP_400_BAD_REQUEST
                )

            review.comment = comment

        images = request.FILES.getlist("images")

        image_error = validate_review_images(
            images,
            existing_count=review.images.count()
        )

        if image_error:
            return Response(
                {"error": image_error},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Any edited review must be approved again.
        review.is_approved = False
        review.save()

        for image in images:
            ReviewImage.objects.create(
                review=review,
                image=image
            )

        review = get_review_queryset().get(id=review.id)

        serializer = ReviewSerializer(
            review,
            context={"request": request}
        )

        return Response({
            "message": (
                "Your review has been updated successfully "
                "and is waiting for admin approval."
            ),
            "review": serializer.data,
        }, status=status.HTTP_200_OK)

    def delete(self, request, review_id):

        review = self.get_customer_review(request, review_id)
        review.delete()

        return Response({
            "message": "Your review has been deleted successfully."
        }, status=status.HTTP_200_OK)


# ============================================================
# CUSTOMER: DELETE OWN REVIEW IMAGE
# ============================================================

class CustomerReviewImageDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, image_id):

        image = get_object_or_404(
            ReviewImage.objects.select_related("review"),
            id=image_id,
            review__customer=request.user
        )

        image.delete()

        return Response({
            "message": "Review photo deleted successfully."
        }, status=status.HTTP_200_OK)


# ============================================================
# CUSTOMER: MARK REVIEW AS HELPFUL
# ============================================================

class ReviewHelpfulVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):

        review = get_object_or_404(
            Review,
            id=review_id,
            is_approved=True
        )

        if review.customer_id == request.user.id:
            return Response(
                {"error": "You cannot vote on your own review."},
                status=status.HTTP_400_BAD_REQUEST
            )

        vote, created = ReviewHelpfulVote.objects.get_or_create(
            review=review,
            customer=request.user
        )

        if not created:
            return Response({
                "message": "You have already marked this review helpful.",
                "helpful": True,
                "helpful_count": review.helpful_votes.count(),
            }, status=status.HTTP_200_OK)

        return Response({
            "message": "Thank you for your feedback.",
            "helpful": True,
            "helpful_count": review.helpful_votes.count(),
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, review_id):

        review = get_object_or_404(
            Review,
            id=review_id,
            is_approved=True
        )

        ReviewHelpfulVote.objects.filter(
            review=review,
            customer=request.user
        ).delete()

        return Response({
            "message": "Helpful vote removed.",
            "helpful": False,
            "helpful_count": review.helpful_votes.count(),
        }, status=status.HTTP_200_OK)


# ============================================================
# ADMIN: LIST AND FILTER REVIEWS
# ============================================================

class AdminReviewListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        reviews = get_review_queryset().all()

        search = request.query_params.get("search", "").strip()

        if search:
            reviews = reviews.filter(
                Q(product__name__icontains=search) |
                Q(customer__username__icontains=search) |
                Q(customer__email__icontains=search) |
                Q(title__icontains=search) |
                Q(comment__icontains=search)
            )

        rating = request.query_params.get("rating")

        if rating:
            rating_value = parse_rating(rating)

            if rating_value is None:
                return Response(
                    {"error": "Invalid rating filter."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reviews = reviews.filter(rating=rating_value)

        approval_filter = request.query_params.get(
            "is_approved",
            request.query_params.get("status")
        )

        if approval_filter is not None:
            approval_filter = approval_filter.lower()

            if approval_filter in ("approved", "true", "1"):
                reviews = reviews.filter(is_approved=True)

            elif approval_filter in ("pending", "rejected", "false", "0"):
                reviews = reviews.filter(is_approved=False)

            else:
                return Response(
                    {"error": "Invalid review approval filter."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        total_count = reviews.count()
        reviews = reviews.order_by("-created_at")

        serializer = ReviewSerializer(
            reviews,
            many=True,
            context={"request": request}
        )

        return Response({
            "count": total_count,
            "reviews": serializer.data,
        }, status=status.HTTP_200_OK)


# ============================================================
# ADMIN: VIEW, APPROVE, REJECT AND DELETE REVIEW
# ============================================================

class AdminReviewDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_admin_review(self, review_id):
        return get_object_or_404(
            get_review_queryset(),
            id=review_id
        )

    def get(self, request, review_id):

        review = self.get_admin_review(review_id)

        serializer = ReviewSerializer(
            review,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, review_id):

        review = self.get_admin_review(review_id)

        approval_value = request.data.get("is_approved")

        if approval_value is None:
            approval_value = request.data.get("status")

        if approval_value is None:
            return Response(
                {"error": "Please provide an approval status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if isinstance(approval_value, str):
            normalized_value = approval_value.strip().lower()

            if normalized_value == "approved":
                approval_value = True

            elif normalized_value in ("rejected", "pending"):
                approval_value = False

        approval_value = parse_boolean(approval_value)

        if approval_value is None:
            return Response(
                {"error": "Invalid approval status."},
                status=status.HTTP_400_BAD_REQUEST
            )

        review.is_approved = approval_value
        review.save(update_fields=["is_approved", "updated_at"])

        serializer = ReviewSerializer(
            review,
            context={"request": request}
        )

        message = (
            "Review approved successfully."
            if approval_value
            else "Review rejected successfully."
        )

        return Response({
            "message": message,
            "review": serializer.data,
        }, status=status.HTTP_200_OK)

    def delete(self, request, review_id):

        review = self.get_admin_review(review_id)
        review.delete()

        return Response({
            "message": "Review deleted successfully."
        }, status=status.HTTP_200_OK)



