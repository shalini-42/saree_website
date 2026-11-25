
from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Product, ProductImage
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):

    serializer_class = ProductSerializer

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser
    ]

    # =====================================
    # ADMIN AND CUSTOMER PERMISSIONS
    # =====================================

    def get_permissions(self):

        # Admin and customers can view products.
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]

        # Only admin can create, edit and delete.
        return [IsAdminUser()]

    # =====================================
    # ADMIN AND CUSTOMER PRODUCT LIST
    # =====================================

    def get_queryset(self):

        queryset = Product.objects.select_related(
            "category"
        ).prefetch_related(
            "images"
        )

        # Admin can view all products.
        if (
            self.request.user.is_authenticated
            and self.request.user.is_staff
        ):
            return queryset

        # Customers can view active products only.
        return queryset.filter(is_active=True)

    # =====================================
    # CREATE PRODUCT - ADMIN
    # =====================================

    def perform_create(self, serializer):

        product = serializer.save()

        images = self.request.FILES.getlist("images")

        for index, image in enumerate(images):

            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=(index == 0)
            )

    # =====================================
    # UPDATE PRODUCT - ADMIN
    # =====================================

    def perform_update(self, serializer):

        product = serializer.save()

        images = self.request.FILES.getlist("images")

        for image in images:

            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=not product.images.filter(
                    is_primary=True
                ).exists()
            )

    # =====================================
    # DELETE PRODUCT IMAGE - ADMIN
    # =====================================

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"images/(?P<image_id>\d+)"
    )
    def delete_image(self, request, pk=None, image_id=None):

        product = self.get_object()

        try:
            product_image = product.images.get(
                id=image_id
            )

        except ProductImage.DoesNotExist:

            return Response(
                {"error": "Image not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        was_primary = product_image.is_primary

        # Delete selected image file.
        if product_image.image:
            product_image.image.delete(save=False)

        # Delete selected image record.
        product_image.delete()

        # Set another image as primary.
        if was_primary:

            next_image = product.images.first()

            if next_image:

                next_image.is_primary = True

                next_image.save(
                    update_fields=["is_primary"]
                )

        return Response(
            {
                "message": "Product image deleted successfully."
            },
            status=status.HTTP_200_OK
        )
