
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, AllowAny

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):

    serializer_class = CategorySerializer

    # =====================================
    # ADMIN AND CUSTOMER PERMISSIONS
    # =====================================

    def get_permissions(self):

        # Everyone can view categories.
        if self.request.method in ["GET", "HEAD", "OPTIONS"]:
            return [AllowAny()]

        # Only admin can create, edit and delete.
        return [IsAdminUser()]

    # =====================================
    # CATEGORY QUERYSET
    # =====================================

    def get_queryset(self):

        queryset = Category.objects.all().order_by("name")

        # Admin can view all categories.
        if (
            self.request.user.is_authenticated
            and self.request.user.is_staff
        ):
            return queryset

        # Customers can view active categories only.
        return queryset.filter(is_active=True)
