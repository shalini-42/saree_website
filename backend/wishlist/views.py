
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from products.models import Product
from .models import Wishlist
from .serializers import WishlistSerializer


class CustomerWishlistView(APIView):

    permission_classes = [IsAuthenticated]

    def check_customer(self, request):
        return (
            not request.user.is_staff
            and not request.user.is_superuser
        )

    # GET: Display customer's wishlist
    def get(self, request):

        if not self.check_customer(request):
            return Response(
                {"error": "Customer access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        wishlist_items = Wishlist.objects.filter(
            user=request.user,
            product__is_active=True
        ).select_related("product")

        serializer = WishlistSerializer(
            wishlist_items,
            many=True,
            context={"request": request}
        )

        return Response(
            {
                "count": wishlist_items.count(),
                "wishlist": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # POST: Add product to wishlist
    def post(self, request):

        if not self.check_customer(request):
            return Response(
                {"error": "Customer access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        product_id = request.data.get("product")

        if not product_id:
            return Response(
                {"error": "Product ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True
        )

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )

        serializer = WishlistSerializer(
            wishlist_item,
            context={"request": request}
        )

        if not created:
            return Response(
                {
                    "message": "This product is already in your wishlist.",
                    "wishlist_item": serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message": "Product added to wishlist successfully.",
                "wishlist_item": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class RemoveWishlistView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):

        if request.user.is_staff or request.user.is_superuser:
            return Response(
                {"error": "Customer access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        wishlist_item = get_object_or_404(
            Wishlist,
            user=request.user,
            product_id=product_id
        )

        wishlist_item.delete()

        return Response(
            {"message": "Product removed from wishlist."},
            status=status.HTTP_200_OK
        )
