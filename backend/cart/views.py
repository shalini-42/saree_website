
from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from products.models import Product
from .models import Cart, CartItem
from .serializers import CartSerializer


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)

        serializer = CartSerializer(
            cart,
            context={"request": request}
        )

        return Response(serializer.data)


class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id") or request.data.get("product")
        quantity = request.data.get("quantity", 1)

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"error": "Quantity must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )

        product = get_object_or_404(
            Product,
            id=product_id,
            is_active=True
        )

        if quantity > product.stock:
            return Response(
                {"error": f"Only {product.stock} items are available."},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart, created = Cart.objects.get_or_create(user=request.user)

        with transaction.atomic():
            item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": quantity}
            )

            if not created:
                new_quantity = item.quantity + quantity

                if new_quantity > product.stock:
                    return Response(
                        {"error": f"Only {product.stock} items are available."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                item.quantity = new_quantity
                item.save()

        return Response(
            {
                "message": "Saree added to cart successfully!",
                "cart": CartSerializer(
                    cart,
                    context={"request": request}
                ).data
            },
            status=status.HTTP_200_OK
        )


class UpdateCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        cart = get_object_or_404(Cart, user=request.user)

        item = get_object_or_404(
            CartItem,
            id=pk,
            cart=cart
        )

        try:
            quantity = int(request.data.get("quantity"))
        except (TypeError, ValueError):
            return Response(
                {"error": "Enter a valid quantity."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity > item.product.stock:
            return Response(
                {"error": f"Only {item.product.stock} items are available."},
                status=status.HTTP_400_BAD_REQUEST
            )

        item.quantity = quantity
        item.save()

        return Response({
            "message": "Cart quantity updated successfully!",
            "cart": CartSerializer(
                cart,
                context={"request": request}
            ).data
        })


class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        cart = get_object_or_404(Cart, user=request.user)

        item = get_object_or_404(
            CartItem,
            id=pk,
            cart=cart
        )

        item.delete()

        return Response({
            "message": "Item removed from cart successfully!"
        })


class ClearCartView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        cart = get_object_or_404(Cart, user=request.user)
        cart.items.all().delete()

        return Response({
            "message": "Cart cleared successfully!"
        })
