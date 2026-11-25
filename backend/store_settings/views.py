
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import StoreSettings
from .serializers import StoreSettingsSerializer

from rest_framework.permissions import AllowAny



class StoreSettingsAPIView(APIView):

    permission_classes = [IsAdminUser]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_settings(self):
        settings, created = StoreSettings.objects.get_or_create(
            pk=1
        )
        return settings

    # GET: Retrieve store settings
    def get(self, request):
        settings = self.get_settings()

        serializer = StoreSettingsSerializer(
            settings,
            context={"request": request}
        )

        return Response(serializer.data)

    # PUT/PATCH: Update store settings
    def put(self, request):
        settings = self.get_settings()

        serializer = StoreSettingsSerializer(
            settings,
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Store settings updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "message": "Please correct the following errors.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        settings = self.get_settings()

        serializer = StoreSettingsSerializer(
            settings,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Store settings updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "message": "Please correct the following errors.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
class PublicStoreSettingsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings, created = StoreSettings.objects.get_or_create(pk=1)

        logo_url = None

        if settings.store_logo:
            logo_url = request.build_absolute_uri(
                settings.store_logo.url
            )

        return Response({
            "store_name": settings.store_name,
            "tagline": settings.tagline,
            "store_email": settings.store_email,
            "store_phone": settings.store_phone,
            "store_address": settings.store_address,
            "website": settings.website,
            "store_logo": logo_url,

            "shipping_charge": settings.shipping_charge,
            "free_shipping_minimum": settings.free_shipping_minimum,
            "estimated_delivery_days": settings.estimated_delivery_days,

            "cod_enabled": settings.cod_enabled,
            "online_payment_enabled": settings.online_payment_enabled,

            "return_days": settings.return_days,
        })