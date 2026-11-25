
import secrets

from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Sum, Q
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    AdminRegisterSerializer,
    CustomerRegisterSerializer,
    CustomerProfileSerializer,
)

from .models import CustomerProfile, PasswordResetOTP

from products.models import Product
from categories.models import Category
from orders.models import Order, OrderItem


# =====================================================
# ADMIN REGISTER
# =====================================================

class AdminRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response(
                {"error": "Only an existing admin can create admin accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AdminRegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            user.is_staff = True
            user.save(update_fields=["is_staff"])

            return Response({
                "message": "Admin account created successfully!",
                "username": user.username
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =====================================================
# ADMIN LOGIN
# =====================================================

class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is None or not user.is_staff or not user.is_active:
            return Response(
                {"error": "Invalid admin username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Admin login successful!",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email
        })


# =====================================================
# CUSTOMER LOGIN
# =====================================================

class CustomerLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if (
            user is None
            or not user.is_active
            or user.is_staff
            or user.is_superuser
        ):
            return Response(
                {"error": "Invalid customer username or password."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Customer login successful!",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email,
        }, status=status.HTTP_200_OK)


# =====================================================
# CUSTOMER REGISTER
# =====================================================

class CustomerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerRegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            return Response({
                "message": "Customer account created successfully!",
                "username": user.username,
                "email": user.email,
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =====================================================
# ADMIN PROFILE
# =====================================================

class AdminProfileView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff
        })


# =====================================================
# ADMIN CHANGE PASSWORD
# =====================================================

class AdminChangePasswordView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user

        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([
            current_password,
            new_password,
            confirm_password
        ]):
            return Response(
                {"error": "All password fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "New passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if current_password == new_password:
            return Response(
                {"error": "New password must be different from current password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return Response(
                {"error": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({
            "success": True,
            "message": "Admin password changed successfully."
        }, status=status.HTTP_200_OK)


# =====================================================
# ADMIN DASHBOARD
# =====================================================

class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        total_products = Product.objects.count()
        total_categories = Category.objects.count()

        total_customers = User.objects.filter(
            is_staff=False,
            is_superuser=False
        ).count()

        total_orders = Order.objects.count()

        pending_orders = Order.objects.filter(
            status="Pending"
        ).count()

        revenue = Order.objects.filter(
            payment_status="Paid"
        ).aggregate(
            total=Sum("total_amount")
        )["total"] or 0

        low_stock_products = Product.objects.filter(
            stock__lte=5,
            is_active=True
        ).values(
            "id",
            "name",
            "sku",
            "stock",
            "price"
        ).order_by("stock")[:10]

        recent_orders = Order.objects.select_related(
            "customer"
        ).order_by("-created_at")[:10]

        recent_orders_data = []

        for order in recent_orders:
            recent_orders_data.append({
                "id": order.id,
                "order_number": order.order_number,
                "customer": order.full_name,
                "email": order.email,
                "total_amount": order.total_amount,
                "status": order.status,
                "payment_status": order.payment_status,
                "created_at": order.created_at,
            })

        best_sellers = OrderItem.objects.values(
            "product_id",
            "product_name"
        ).annotate(
            total_sold=Sum("quantity")
        ).order_by("-total_sold")[:5]

        today = timezone.localdate()
        start_date = today - timedelta(days=6)

        sales_rows = (
            Order.objects.filter(
                payment_status="Paid",
                created_at__date__gte=start_date,
                created_at__date__lte=today
            )
            .annotate(sale_date=TruncDate("created_at"))
            .values("sale_date")
            .annotate(revenue=Sum("total_amount"))
            .order_by("sale_date")
        )

        sales_lookup = {
            row["sale_date"].isoformat(): row["revenue"]
            for row in sales_rows
        }

        daily_sales = []

        for day_number in range(7):
            current_day = start_date + timedelta(days=day_number)
            date_key = current_day.isoformat()

            daily_sales.append({
                "date": date_key,
                "revenue": sales_lookup.get(date_key, 0)
            })

        return Response({
            "statistics": {
                "total_products": total_products,
                "total_categories": total_categories,
                "total_customers": total_customers,
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "total_revenue": revenue,
            },
            "low_stock_products": list(low_stock_products),
            "recent_orders": recent_orders_data,
            "best_sellers": list(best_sellers),
            "daily_sales": daily_sales,
        })


# =====================================================
# ADMIN USERS LIST
# =====================================================

class AdminUsersListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by("-date_joined")

        data = []

        for user in users:
            data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "account_type": (
                    "Admin" if user.is_staff or user.is_superuser
                    else "Customer"
                ),
                "registration_date": user.date_joined,
            })

        return Response(data)


# =====================================================
# ADMIN CUSTOMERS LIST
# =====================================================

class AdminCustomersListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        search = request.query_params.get("search", "").strip()

        customers = User.objects.filter(
            is_staff=False,
            is_superuser=False
        ).order_by("-date_joined")

        if search:
            customers = customers.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(customer_profile__phone__icontains=search)
            ).distinct()

        data = []

        for customer in customers:
            profile = getattr(customer, "customer_profile", None)

            customer_orders = Order.objects.filter(
                customer=customer
            )

            order_count = customer_orders.count()

            total_spent = customer_orders.filter(
                payment_status="Paid"
            ).aggregate(
                total=Sum("total_amount")
            )["total"] or 0

            data.append({
                "id": customer.id,
                "username": customer.username,
                "first_name": customer.first_name,
                "last_name": customer.last_name,
                "email": customer.email,
                "phone": profile.phone if profile else "",
                "city": profile.city if profile else "",
                "state": profile.state if profile else "",
                "registration_date": customer.date_joined,
                "is_active": customer.is_active,
                "total_orders": order_count,
                "total_spent": total_spent,
            })

        return Response(data)


# =====================================================
# ADMIN CUSTOMER DETAILS AND ORDER HISTORY
# =====================================================

class AdminCustomerDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, customer_id):

        customer = User.objects.filter(
            id=customer_id,
            is_staff=False,
            is_superuser=False
        ).first()

        if not customer:
            return Response(
                {"error": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        profile = getattr(customer, "customer_profile", None)

        customer_orders = Order.objects.filter(
            customer=customer
        ).order_by("-created_at")

        total_spent = customer_orders.filter(
            payment_status="Paid"
        ).aggregate(
            total=Sum("total_amount")
        )["total"] or 0

        orders_data = []

        for order in customer_orders:
            orders_data.append({
                "id": order.id,
                "order_number": order.order_number,
                "full_name": order.full_name,
                "email": order.email,
                "total_amount": order.total_amount,
                "status": order.status,
                "payment_status": order.payment_status,
                "created_at": order.created_at,
            })

        return Response({
            "customer": {
                "id": customer.id,
                "username": customer.username,
                "first_name": customer.first_name,
                "last_name": customer.last_name,
                "email": customer.email,
                "phone": profile.phone if profile else "",
                "address": profile.address if profile else "",
                "city": profile.city if profile else "",
                "state": profile.state if profile else "",
                "pincode": profile.pincode if profile else "",
                "registration_date": customer.date_joined,
                "is_active": customer.is_active,
            },
            "statistics": {
                "total_orders": customer_orders.count(),
                "total_spent": total_spent,
            },
            "orders": orders_data,
        })

# =====================================================
# ADMIN ANALYTICS
# =====================================================

class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()

        total_orders = Order.objects.count()

        paid_orders = Order.objects.filter(
            payment_status="Paid"
        )

        total_revenue = paid_orders.aggregate(
            total=Sum("total_amount")
        )["total"] or 0

        paid_order_count = paid_orders.count()

        pending_orders = Order.objects.filter(
            status="Pending"
        ).count()

        cancelled_orders = Order.objects.filter(
            status="Cancelled"
        ).count()

        month_dates = []

        for offset in range(5, -1, -1):
            month_index = today.year * 12 + today.month - 1 - offset
            year = month_index // 12
            month = month_index % 12 + 1
            month_dates.append((year, month))

        first_year, first_month = month_dates[0]

        start_date = timezone.datetime(
            first_year, first_month, 1
        ).date()

        monthly_rows = (
            Order.objects.filter(
                payment_status="Paid",
                created_at__date__gte=start_date,
                created_at__date__lte=today
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(revenue=Sum("total_amount"))
            .order_by("month")
        )

        monthly_lookup = {
            row["month"].strftime("%Y-%m"): row["revenue"]
            for row in monthly_rows
        }

        monthly_sales = []

        for year, month in month_dates:
            key = f"{year}-{month:02d}"

            monthly_sales.append({
                "month": key,
                "label": timezone.datetime(
                    year, month, 1
                ).strftime("%b %Y"),
                "revenue": monthly_lookup.get(key, 0)
            })

        order_status_data = []

        for value, label in Order.STATUS_CHOICES:
            order_status_data.append({
                "status": label,
                "count": Order.objects.filter(
                    status=value
                ).count()
            })

        payment_status_data = []

        for value, label in Order.PAYMENT_CHOICES:
            payment_status_data.append({
                "status": label,
                "count": Order.objects.filter(
                    payment_status=value
                ).count()
            })

        best_sellers = (
            OrderItem.objects
            .exclude(order__status="Cancelled")
            .values("product_id", "product_name")
            .annotate(
                total_sold=Sum("quantity"),
                total_sales=Sum("subtotal")
            )
            .order_by("-total_sold")[:5]
        )

        category_sales = (
            OrderItem.objects
            .exclude(order__status="Cancelled")
            .values("product__category__name")
            .annotate(
                total_sold=Sum("quantity"),
                total_sales=Sum("subtotal")
            )
            .order_by("-total_sold")[:5]
        )

        return Response({
            "statistics": {
                "total_orders": total_orders,
                "paid_orders": paid_order_count,
                "pending_orders": pending_orders,
                "cancelled_orders": cancelled_orders,
                "total_revenue": total_revenue,
            },
            "monthly_sales": monthly_sales,
            "order_status": order_status_data,
            "payment_status": payment_status_data,
            "best_sellers": list(best_sellers),
            "category_sales": list(category_sales),
        })


# =====================================================
# CUSTOMER PROFILE
# =====================================================

class CustomerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get_customer_profile(self, request):

        if request.user.is_staff or request.user.is_superuser:
            return None

        profile, created = CustomerProfile.objects.get_or_create(
            user=request.user
        )

        return profile

    def get(self, request):
        profile = self.get_customer_profile(request)

        if profile is None:
            return Response(
                {"error": "Customer access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CustomerProfileSerializer(profile)

        return Response(serializer.data)

    def patch(self, request):
        profile = self.get_customer_profile(request)

        if profile is None:
            return Response(
                {"error": "Customer access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CustomerProfileSerializer(
            profile,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "Profile updated successfully!",
                "profile": serializer.data
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =====================================================
# CUSTOMER CHANGE PASSWORD
# =====================================================

class CustomerChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_staff or user.is_superuser:
            return Response(
                {"error": "Customer access only."},
                status=status.HTTP_403_FORBIDDEN
            )

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not old_password or not new_password or not confirm_password:
            return Response(
                {"error": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(old_password):
            return Response(
                {"error": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "New passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return Response(
                {"error": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        return Response({
            "message": "Password changed successfully."
        }, status=status.HTTP_200_OK)


# =====================================================
# CUSTOMER FORGOT PASSWORD - SEND EMAIL OTP
# =====================================================

class CustomerForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"error": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
            is_staff=False,
            is_superuser=False
        ).first()

        # Show registration message for an unregistered email
        if not user:
            return Response(
                {
                    "error": "This email is not registered. Please sign up first."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        latest_otp = PasswordResetOTP.objects.filter(
            user=user
        ).order_by("-created_at").first()

        if (
            latest_otp
            and timezone.now() - latest_otp.created_at < timedelta(seconds=60)
        ):
            return Response(
                {"error": "Please wait 60 seconds before requesting another OTP."},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        PasswordResetOTP.objects.filter(user=user).delete()

        otp = str(secrets.randbelow(900000) + 100000)

        PasswordResetOTP.objects.create(
            user=user,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        try:
            send_mail(
                subject="SĀRIKA - Password Reset OTP",
                message=(
                    f"Hello {user.first_name or user.username},\n\n"
                    f"Your password reset OTP is: {otp}\n\n"
                    "This OTP is valid for 10 minutes.\n"
                    "Do not share this OTP with anyone.\n\n"
                    "SĀRIKA Support"
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False
            )

        except Exception:
            PasswordResetOTP.objects.filter(user=user).delete()

            return Response(
                {"error": "Unable to send OTP. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "message": "OTP sent successfully. Please check your email."
        }, status=status.HTTP_200_OK)


# =====================================================
# CUSTOMER VERIFY OTP - GENERATE RESET TOKEN
# =====================================================

class CustomerVerifyResetOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp = request.data.get("otp", "").strip()

        if not email or not otp:
            return Response(
                {"error": "Email and OTP are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
            is_staff=False,
            is_superuser=False
        ).first()

        if not user:
            return Response(
                {"error": "Invalid or expired OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            reset_otp = PasswordResetOTP.objects.filter(
                user=user
            ).order_by("-created_at").first()

            if not reset_otp or reset_otp.is_expired():
                return Response(
                    {"error": "OTP has expired. Please request a new OTP."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if reset_otp.is_verified:
                return Response(
                    {"error": "OTP has already been verified. Please request a new OTP."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if reset_otp.attempts >= 5:
                return Response(
                    {"error": "Too many attempts. Please request a new OTP."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

            if not check_password(otp, reset_otp.otp_hash):
                reset_otp.attempts += 1
                reset_otp.save(update_fields=["attempts"])

                return Response(
                    {"error": "Incorrect OTP."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reset_token = secrets.token_urlsafe(32)

            reset_otp.is_verified = True
            reset_otp.reset_token_hash = make_password(reset_token)

            reset_otp.save(update_fields=[
                "is_verified",
                "reset_token_hash"
            ])

        return Response({
            "message": "OTP verified successfully.",
            "reset_token": reset_token
        }, status=status.HTTP_200_OK)


# =====================================================
# CUSTOMER RESET PASSWORD - VALIDATE RESET TOKEN
# =====================================================

class CustomerResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        reset_token = request.data.get("reset_token", "")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([
            email,
            reset_token,
            new_password,
            confirm_password
        ]):
            return Response(
                {"error": "All fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            email__iexact=email,
            is_active=True,
            is_staff=False,
            is_superuser=False
        ).first()

        if not user:
            return Response(
                {"error": "Invalid password reset request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as error:
            return Response(
                {"error": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            reset_otp = PasswordResetOTP.objects.filter(
                user=user,
                is_verified=True
            ).order_by("-created_at").first()

            if not reset_otp or reset_otp.is_expired():
                return Response(
                    {"error": "Please verify a valid OTP first."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                not reset_otp.reset_token_hash
                or not check_password(
                    reset_token,
                    reset_otp.reset_token_hash
                )
            ):
                return Response(
                    {"error": "Invalid reset token."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save(update_fields=["password"])

            PasswordResetOTP.objects.filter(user=user).delete()

        return Response({
            "message": "Password reset successfully. Please log in with your new password."
        }, status=status.HTTP_200_OK)
class AdminCustomerStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, customer_id):
        customer = User.objects.filter(
            id=customer_id,
            is_staff=False,
            is_superuser=False
        ).first()

        if not customer:
            return Response(
                {"error": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        is_active = request.data.get("is_active")

        if not isinstance(is_active, bool):
            return Response(
                {"error": "is_active must be true or false."},
                status=status.HTTP_400_BAD_REQUEST
            )

        customer.is_active = is_active
        customer.save(update_fields=["is_active"])

        return Response({
            "message": (
                "Customer activated successfully."
                if is_active
                else "Customer deactivated successfully."
            ),
            "customer_id": customer.id,
            "is_active": customer.is_active,
        })