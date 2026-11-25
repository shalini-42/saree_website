
import re
import secrets
import logging

logger = logging.getLogger(__name__)
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from .models import Order, OrderItem, ReturnExchangeRequest
from .serializers import (
    OrderSerializer,
    ReturnExchangeRequestSerializer,
    CustomerReturnExchangeCreateSerializer,
)

from cart.models import Cart
from products.models import Product

from io import BytesIO

from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from django.core.mail import send_mail
from datetime import timedelta
from store_settings.models import StoreSettings
# ==========================================
# CHECKOUT VALIDATION
# ==========================================

def validate_checkout_data(data):
    errors = {}

    full_name = str(data.get("full_name") or "").strip()
    email = str(data.get("email") or "").strip()
    phone = str(data.get("phone") or "").strip()
    address = str(data.get("address") or "").strip()
    city = str(data.get("city") or "").strip()
    state = str(data.get("state") or "").strip()
    pincode = str(data.get("pincode") or "").strip()
    payment_method = str(data.get("payment_method", "COD")).strip()

    # Full Name
    if not full_name:
        errors["full_name"] = "Full name is required."
    elif len(full_name) < 3:
        errors["full_name"] = "Name must contain at least 3 characters."
    elif len(full_name) > 150:
        errors["full_name"] = "Name cannot exceed 150 characters."
    elif not re.fullmatch(r"[a-zA-Z\s.'-]+", full_name):
        errors["full_name"] = "Enter a valid name."

    # Email
    if not email:
        errors["email"] = "Email address is required."
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = "Enter a valid email address."

    # Phone
    if not phone:
        errors["phone"] = "Phone number is required."
    elif not re.fullmatch(r"[6-9]\d{9}", phone):
        errors["phone"] = (
            "Enter a valid 10-digit Indian mobile number."
        )

    # Address
    if not address:
        errors["address"] = "Delivery address is required."
    elif len(address) < 10:
        errors["address"] = (
            "Address must contain at least 10 characters."
        )
    elif len(address) > 500:
        errors["address"] = "Address cannot exceed 500 characters."

    # City
    if not city:
        errors["city"] = "City is required."
    elif not re.fullmatch(r"[a-zA-Z\s.'-]+", city):
        errors["city"] = "Enter a valid city name."

    # State
    if not state:
        errors["state"] = "State is required."
    elif not re.fullmatch(r"[a-zA-Z\s.'-]+", state):
        errors["state"] = "Enter a valid state name."

    # PIN Code
    if not pincode:
        errors["pincode"] = "PIN code is required."
    elif not re.fullmatch(r"[1-9]\d{5}", pincode):
        errors["pincode"] = "Enter a valid 6-digit PIN code."

    # Payment Method
    if payment_method != "COD":
        errors["payment_method"] = (
            "Only Cash on Delivery is available."
        )

    return errors


# ==========================================
# ADMIN: VIEW ALL ORDERS
# ==========================================

class AdminOrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):

        orders = Order.objects.select_related(
            "customer"
        ).prefetch_related(
            "items"
        ).order_by("-created_at")

        serializer = OrderSerializer(orders, many=True)

        return Response(serializer.data)


# ==========================================
# ADMIN: VIEW AND UPDATE ORDER
# ==========================================



class AdminOrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            order = Order.objects.select_related(
                "customer"
            ).prefetch_related(
                "items"
            ).get(pk=pk)

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def send_order_status_email(self, order):
        try:
            recipient_email = order.email or order.customer.email

            if not recipient_email:
                logger.warning(
                    "No email found for order %s",
                    order.order_number
                )
                return

            subject = (
                f"SĀRIKA: Order {order.order_number} - "
                f"{order.status}"
            )

            status_messages = {
                "Pending": "Your order has been received and is awaiting confirmation.",
                "Confirmed": "Your order has been confirmed successfully.",
                "Processing": "Your order is being prepared.",
                "Shipped": "Great news! Your order has been shipped.",
                "Delivered": "Your order has been delivered successfully.",
                "Cancelled": "Your order has been cancelled.",
            }

            status_message = status_messages.get(
                order.status,
                f"Your order status is now {order.status}."
            )

            estimated_delivery = (
                order.estimated_delivery_date.strftime("%d %B %Y")
                if order.estimated_delivery_date
                else "To be confirmed"
            )

            actual_delivery = (
                timezone.localtime(order.delivered_at).strftime(
                    "%d %B %Y, %I:%M %p"
                )
                if order.delivered_at
                else "Not delivered yet"
            )

            message = f"""
Dear {order.full_name},

Your SĀRIKA order status has been updated.

ORDER DETAILS
--------------------------------
Order Number: {order.order_number}
Current Status: {order.status}
Payment Method: {order.payment_method}
Payment Status: {order.payment_status}
Total Amount: Rs. {order.total_amount:,.2f}
Estimated Delivery: {estimated_delivery}
Actual Delivery: {actual_delivery}

STATUS UPDATE
--------------------------------
{status_message}

DELIVERY ADDRESS
--------------------------------
{order.address}
{order.city}, {order.state} - {order.pincode}

Thank you for shopping with SĀRIKA.

Elegance woven into every thread.

SĀRIKA Customer Support
"""

            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[recipient_email],
                fail_silently=False
            )

        except Exception:
            logger.exception(
                "Failed to send order status email for %s",
                order.order_number
            )

    @transaction.atomic
    def patch(self, request, pk):
        try:
            order = (
                Order.objects
                .select_for_update()
                .select_related("customer")
                .get(pk=pk)
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        new_payment_status = request.data.get("payment_status")

        allowed_statuses = [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
        ]

        allowed_payment_statuses = [
            "Pending",
            "Paid",
            "Failed",
            "COD",
            "Refunded",
        ]

        old_status = order.status

        if new_status is not None:
            if new_status not in allowed_statuses:
                return Response(
                    {"error": "Invalid order status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.status = new_status

            # Record actual delivery date only once.
            if (
                new_status == "Delivered"
                and order.delivered_at is None
            ):
                order.delivered_at = timezone.now()

        if new_payment_status is not None:
            if new_payment_status not in allowed_payment_statuses:
                return Response(
                    {"error": "Invalid payment status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            order.payment_status = new_payment_status

        order.save()

        # Send email only when the order status changes.
        if new_status is not None and new_status != old_status:
            transaction.on_commit(
                lambda: self.send_order_status_email(order)
            )

        serializer = OrderSerializer(order)

        return Response({
            "message": "Order updated successfully!",
            "order": serializer.data
        })


# ==========================================
# CUSTOMER: PLACE ORDER
# ==========================================


class CustomerCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def send_order_confirmation_email(self, order):
        try:
            recipient_email = order.email

            if not recipient_email:
                logger.warning(
                    "No email address found for order %s",
                    order.order_number
                )
                return

            item_details = []

            for item in order.items.all():
                item_details.append(
                    f"""Product: {item.product_name}
Quantity: {item.quantity}
Unit Price: Rs. {item.price:,.2f}
Subtotal: Rs. {item.subtotal:,.2f}"""
                )

            products_text = "\n\n".join(item_details)

            estimated_delivery = (
                order.estimated_delivery_date.strftime("%d %B %Y")
                if order.estimated_delivery_date
                else "To be confirmed"
            )

            message = f"""Dear {order.full_name},

Thank you for shopping with SĀRIKA!
Your order has been placed successfully.

ORDER DETAILS
--------------------------------
Order Number: {order.order_number}
Order Date: {order.created_at.strftime('%d %B %Y')}
Order Status: {order.status}
Payment Method: {order.payment_method}
Estimated Delivery: {estimated_delivery}

ORDER ITEMS
--------------------------------
{products_text}

PRICE SUMMARY
--------------------------------
Subtotal: Rs. {order.subtotal:,.2f}
Shipping: Rs. {order.shipping_charge:,.2f}
Total Amount: Rs. {order.total_amount:,.2f}

DELIVERY ADDRESS
--------------------------------
{order.full_name}
{order.address}
{order.city}, {order.state} - {order.pincode}
Phone: {order.phone}

Payment Method: Cash on Delivery

Thank you for choosing SĀRIKA.
Elegance woven into every thread.

SĀRIKA Customer Support"""

            send_mail(
                subject=f"SĀRIKA: Order Confirmation - {order.order_number}",
                message=message,
                from_email=None,
                recipient_list=[recipient_email],
                fail_silently=False
            )

        except Exception:
            logger.exception(
                "Failed to send order confirmation email for order %s",
                order.order_number
            )

    def post(self, request):

        # STEP 1: VALIDATE CHECKOUT FORM

        errors = validate_checkout_data(request.data)

        if errors:
            return Response(
                {
                    **errors,
                    "error": "Please correct the checkout details."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # STEP 2: GET CLEANED FORM DATA

        full_name = str(request.data.get("full_name")).strip()
        email = str(request.data.get("email")).strip()
        phone = str(request.data.get("phone")).strip()
        address = str(request.data.get("address")).strip()
        city = str(request.data.get("city")).strip()
        state = str(request.data.get("state")).strip()
        pincode = str(request.data.get("pincode")).strip()

        try:
            with transaction.atomic():

                # STEP 3: GET STORE SETTINGS

                store_settings = StoreSettings.objects.filter(
                    pk=1
                ).first()

                if (
                    store_settings
                    and not store_settings.cod_enabled
                ):
                    return Response(
                        {
                            "error": (
                                "Cash on Delivery is currently unavailable."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # STEP 4: LOCK CUSTOMER CART

                try:
                    cart = Cart.objects.select_for_update().get(
                        user=request.user
                    )

                except Cart.DoesNotExist:
                    return Response(
                        {"error": "Your cart is empty."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                cart_items = list(
                    cart.items.select_related("product").all()
                )

                if not cart_items:
                    return Response(
                        {
                            "error": (
                                "Please add products to your cart first."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                order_products = []
                subtotal = Decimal("0.00")

                # STEP 5: CHECK PRODUCT STOCK AND DATABASE PRICE

                for cart_item in cart_items:

                    try:
                        product = Product.objects.select_for_update().get(
                            pk=cart_item.product_id
                        )

                    except Product.DoesNotExist:
                        return Response(
                            {
                                "error": (
                                    "A product in your cart is no longer available."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if not product.is_active:
                        return Response(
                            {
                                "error": (
                                    f"{product.name} is currently unavailable."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    if cart_item.quantity > product.stock:
                        return Response(
                            {
                                "error": (
                                    f"Only {product.stock} pieces of "
                                    f"{product.name} are available."
                                )
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Always use the current database price.

                    price = product.price

                    if (
                        product.discount_price
                        and product.discount_price < product.price
                    ):
                        price = product.discount_price

                    price = Decimal(str(price))

                    item_subtotal = price * cart_item.quantity
                    subtotal += item_subtotal

                    order_products.append({
                        "product": product,
                        "product_name": product.name,
                        "quantity": cart_item.quantity,
                        "price": price,
                        "subtotal": item_subtotal,
                    })

                # STEP 6: CALCULATE SHIPPING FROM ADMIN SETTINGS

                shipping_charge = Decimal("0.00")
                free_shipping_minimum = Decimal("0.00")

                if store_settings:
                    shipping_charge = Decimal(
                        str(store_settings.shipping_charge or 0)
                    )

                    free_shipping_minimum = Decimal(
                        str(store_settings.free_shipping_minimum or 0)
                    )

                # Apply free shipping when minimum is reached.
                if (
                    free_shipping_minimum > 0
                    and subtotal >= free_shipping_minimum
                ):
                    shipping_charge = Decimal("0.00")

                total_amount = subtotal + shipping_charge

                # STEP 7: GET DELIVERY DAYS FROM SETTINGS

                delivery_days = 7

                if store_settings:
                    delivery_days = (
                        store_settings.estimated_delivery_days or 7
                    )

                estimated_delivery = (
                    timezone.localdate()
                    + timedelta(days=delivery_days)
                )

                # STEP 8: DETERMINE ORDER STATUS

                order_status = "Pending"

                if (
                    store_settings
                    and store_settings.order_auto_confirm
                ):
                    order_status = "Confirmed"

                # STEP 9: GENERATE ORDER NUMBER

                order_number = (
                    f"SAR-{timezone.now().strftime('%Y%m%d')}-"
                    f"{secrets.token_hex(4).upper()}"
                )

                # STEP 10: CREATE ORDER

                order = Order.objects.create(
                    customer=request.user,
                    order_number=order_number,

                    full_name=full_name,
                    email=email,
                    phone=phone,

                    address=address,
                    city=city,
                    state=state,
                    pincode=pincode,

                    subtotal=subtotal,
                    shipping_charge=shipping_charge,
                    total_amount=total_amount,

                    payment_method="COD",
                    payment_status="COD",
                    status=order_status,

                    estimated_delivery_date=estimated_delivery,
                    delivered_at=None,
                )

                # STEP 11: CREATE ORDER ITEMS AND REDUCE STOCK

                for item in order_products:

                    OrderItem.objects.create(
                        order=order,
                        product=item["product"],
                        product_name=item["product_name"],
                        quantity=item["quantity"],
                        price=item["price"],
                        subtotal=item["subtotal"],
                    )

                    item["product"].stock -= item["quantity"]

                    item["product"].save(
                        update_fields=["stock"]
                    )

                # STEP 12: CLEAR CUSTOMER CART

                cart.items.all().delete()

                # STEP 13: SEND EMAIL IF ENABLED

                send_confirmation_email = (
                    store_settings.order_email_notification
                    if store_settings
                    else True
                )

                if send_confirmation_email:
                    transaction.on_commit(
                        lambda: self.send_order_confirmation_email(order)
                    )

                # STEP 14: RETURN ORDER DETAILS

                serializer = OrderSerializer(
                    order,
                    context={"request": request}
                )

                return Response(
                    {
                        "message": (
                            "Your order has been placed successfully!"
                        ),
                        "order": serializer.data,
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception:
            logger.exception("Order placement failed")

            return Response(
                {
                    "error": (
                        "Something went wrong while placing your order."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==========================================
# CUSTOMER: VIEW OWN ORDERS
# ==========================================

class CustomerOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        orders = Order.objects.filter(
            customer=request.user
        ).prefetch_related(
            "items"
        ).order_by("-created_at")

        serializer = OrderSerializer(orders, many=True)

        return Response(serializer.data)


# ==========================================
# CUSTOMER: VIEW SINGLE ORDER
# ==========================================

class CustomerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        try:
            order = Order.objects.prefetch_related(
                "items"
            ).get(
                pk=pk,
                customer=request.user
            )

        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = OrderSerializer(order)

        return Response(serializer.data)


class CustomerCancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def send_cancellation_email(self, order):
        try:
            recipient_email = order.email or order.customer.email

            if not recipient_email:
                logger.warning(
                    "No email found for cancelled order %s",
                    order.order_number
                )
                return

            message = f"""
Dear {order.full_name},

Your SĀRIKA order has been cancelled successfully.

ORDER DETAILS
--------------------------------
Order Number: {order.order_number}
Order Status: {order.status}
Payment Method: {order.payment_method}
Total Amount: Rs. {order.total_amount:,.2f}

DELIVERY ADDRESS
--------------------------------
{order.address}
{order.city}, {order.state} - {order.pincode}

The available product stock has been restored.

If you cancelled this order by mistake, please contact
SĀRIKA Customer Support.

Thank you for considering SĀRIKA.

Elegance woven into every thread.

SĀRIKA Customer Support
"""

            send_mail(
                subject=f"SĀRIKA: Order Cancelled - {order.order_number}",
                message=message,
                from_email=None,
                recipient_list=[recipient_email],
                fail_silently=False
            )

        except Exception:
            logger.exception(
                "Failed to send cancellation email for order %s",
                order.order_number
            )

    @transaction.atomic
    def post(self, request, pk):
        try:
            order = (
                Order.objects
                .select_for_update()
                .select_related("customer")
                .get(pk=pk, customer=request.user)
            )

            # Only pending or confirmed orders can be cancelled.
            if order.status not in ["Pending", "Confirmed"]:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "This order can no longer be cancelled "
                            "because it is already being processed or shipped."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Restore product stock.
            for item in order.items.select_related("product"):
                product = (
                    Product.objects
                    .select_for_update()
                    .get(pk=item.product_id)
                )

                product.stock += item.quantity
                product.save(update_fields=["stock"])

            # Update order status.
            order.status = "Cancelled"
            order.save(update_fields=["status", "updated_at"])

            # Send cancellation email after successful database commit.
            transaction.on_commit(
                lambda: self.send_cancellation_email(order)
            )

            return Response(
                {
                    "success": True,
                    "message": "Your order has been cancelled successfully.",
                    "order": OrderSerializer(
                        order,
                        context={"request": request}
                    ).data
                },
                status=status.HTTP_200_OK
            )

        except Order.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception:
            logger.exception("Customer order cancellation failed")

            return Response(
                {
                    "success": False,
                    "message": "Unable to cancel your order. Please try again."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CustomerOrderInvoiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        # DEBUG: Check the authenticated customer
        print("========== INVOICE DEBUG ==========")
        print("Logged-in username:", request.user.username)
        print("Logged-in user ID:", request.user.id)
        print("Requested order ID:", pk)

        print(
            "Orders for logged-in user:",
            list(
                Order.objects.filter(
                    customer=request.user
                ).values("id", "order_number")
            )
        )

        print("===================================")

        # Get only the logged-in customer's order
        order = get_object_or_404(
            Order,
            pk=pk,
            customer=request.user
        )

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=18 * mm,
            leftMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
        )

        styles = getSampleStyleSheet()

        styles.add(
            ParagraphStyle(
                name="Brand",
                parent=styles["Title"],
                fontName="Helvetica-Bold",
                fontSize=25,
                textColor=colors.HexColor("#681d31"),
                alignment=TA_CENTER,
                spaceAfter=5,
            )
        )

        styles.add(
            ParagraphStyle(
                name="InvoiceHeading",
                parent=styles["Heading2"],
                textColor=colors.HexColor("#681d31"),
                alignment=TA_CENTER,
                fontSize=15,
                spaceAfter=15,
            )
        )

        styles.add(
            ParagraphStyle(
                name="SmallText",
                parent=styles["Normal"],
                fontSize=9,
                leading=14,
            )
        )

        elements = []

        # BRAND
        elements.append(Paragraph("SĀRIKA", styles["Brand"]))
        elements.append(
            Paragraph("ORDER INVOICE", styles["InvoiceHeading"])
        )

        elements.append(Spacer(1, 8))

        # ORDER INFORMATION
        order_data = [
            [
                Paragraph(
                    f"<b>Invoice / Order Number:</b><br/>{order.order_number}",
                    styles["SmallText"],
                ),
                Paragraph(
                    f"<b>Order Date:</b><br/>{order.created_at.strftime('%d %B %Y')}",
                    styles["SmallText"],
                ),
            ],
            [
                Paragraph(
                    f"<b>Order Status:</b><br/>{order.status}",
                    styles["SmallText"],
                ),
                Paragraph(
                    f"<b>Payment Method:</b><br/>{order.payment_method}",
                    styles["SmallText"],
                ),
            ],
        ]

        info_table = Table(
            order_data,
            colWidths=[85 * mm, 85 * mm],
        )

        info_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f2ec")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5d7c9")),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5d7c9")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ])
        )

        elements.append(info_table)
        elements.append(Spacer(1, 20))

        # CUSTOMER DETAILS
        elements.append(
            Paragraph("<b>Bill To / Delivery Address</b>", styles["Heading3"])
        )

        customer_details = [
            order.full_name,
            order.email,
            order.phone,
            order.address,
            f"{order.city}, {order.state} - {order.pincode}",
        ]

        for detail in customer_details:
            elements.append(
                Paragraph(str(detail), styles["SmallText"])
            )

        elements.append(Spacer(1, 20))

        # PRODUCT TABLE
        elements.append(
            Paragraph("<b>Order Items</b>", styles["Heading3"])
        )

        item_data = [
            ["Product", "Qty", "Unit Price", "Amount"]
        ]

        for item in order.items.all():
            item_data.append([
                Paragraph(str(item.product_name), styles["SmallText"]),
                str(item.quantity),
                f"Rs. {item.price:,.2f}",
                f"Rs. {item.subtotal:,.2f}",
            ])

        product_table = Table(
            item_data,
            colWidths=[85 * mm, 20 * mm, 32 * mm, 33 * mm],
            repeatRows=1,
        )

        product_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#681d31")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("ALIGN", (1, 0), (-1, 0), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e5d7c9")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [
                    colors.white,
                    colors.HexColor("#fbf8f4"),
                ]),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ])
        )

        elements.append(product_table)
        elements.append(Spacer(1, 20))

        # PRICE SUMMARY
        summary_data = [
            ["Subtotal", f"Rs. {order.subtotal:,.2f}"],
            ["Shipping Charges", f"Rs. {order.shipping_charge:,.2f}"],
            ["Total Amount", f"Rs. {order.total_amount:,.2f}"],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[120 * mm, 50 * mm],
            hAlign="RIGHT",
        )

        summary_table.setStyle(
            TableStyle([
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, 0), (-1, 1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("LINEABOVE", (0, 2), (-1, 2), 1, colors.HexColor("#681d31")),
                ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 2), (-1, 2), colors.HexColor("#681d31")),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ])
        )

        elements.append(summary_table)
        elements.append(Spacer(1, 35))

        # FOOTER
        elements.append(
            Paragraph(
                "Thank you for shopping with SĀRIKA.",
                ParagraphStyle(
                    name="Footer",
                    parent=styles["Normal"],
                    alignment=TA_CENTER,
                    fontSize=11,
                    textColor=colors.HexColor("#681d31"),
                ),
            )
        )

        elements.append(
            Paragraph(
                "Elegance woven into every thread.",
                ParagraphStyle(
                    name="FooterTagline",
                    parent=styles["Normal"],
                    alignment=TA_CENTER,
                    fontSize=9,
                    textColor=colors.HexColor("#806e63"),
                ),
            )
        )

        document.build(elements)

        pdf = buffer.getvalue()
        buffer.close()

        response = HttpResponse(
            pdf,
            content_type="application/pdf",
        )

        response["Content-Disposition"] = (
            f'attachment; filename="SARIKA_Invoice_{order.order_number}.pdf"'
        )

        return response

# ==========================================
# CUSTOMER: CREATE RETURN / EXCHANGE REQUEST
# ==========================================

class CustomerReturnExchangeCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CustomerReturnExchangeCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        order_item = serializer.validated_data["order_item"]

        return_request = serializer.save(
            order=order_item.order,
            customer=request.user
        )

        response_serializer = ReturnExchangeRequestSerializer(
            return_request,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "message": "Your return/exchange request has been submitted.",
                "request": response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )


# ==========================================
# CUSTOMER: VIEW OWN RETURN / EXCHANGE REQUESTS
# ==========================================

class CustomerReturnExchangeListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = ReturnExchangeRequest.objects.filter(
            customer=request.user
        ).select_related(
            "order",
            "order_item"
        ).order_by("-requested_at")

        serializer = ReturnExchangeRequestSerializer(
            requests,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)


# ==========================================
# CUSTOMER: VIEW SINGLE RETURN / EXCHANGE REQUEST
# ==========================================

class CustomerReturnExchangeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            return_request = ReturnExchangeRequest.objects.select_related(
                "order",
                "order_item"
            ).get(
                pk=pk,
                customer=request.user
            )

        except ReturnExchangeRequest.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Return/exchange request not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReturnExchangeRequestSerializer(
            return_request,
            context={"request": request}
        )

        return Response(serializer.data)


# ==========================================
# ADMIN: VIEW ALL RETURN / EXCHANGE REQUESTS
# ==========================================

class AdminReturnExchangeListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        requests = ReturnExchangeRequest.objects.select_related(
            "customer",
            "order",
            "order_item"
        ).order_by("-requested_at")

        serializer = ReturnExchangeRequestSerializer(
            requests,
            many=True,
            context={"request": request}
        )

        return Response(serializer.data)


# ==========================================
# ADMIN: UPDATE RETURN / EXCHANGE REQUEST
# ==========================================

class AdminReturnExchangeDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            return_request = ReturnExchangeRequest.objects.select_related(
                "customer",
                "order",
                "order_item"
            ).get(pk=pk)

        except ReturnExchangeRequest.DoesNotExist:
            return Response(
                {"error": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReturnExchangeRequestSerializer(
            return_request,
            context={"request": request}
        )

        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            return_request = ReturnExchangeRequest.objects.select_for_update().get(
                pk=pk
            )

        except ReturnExchangeRequest.DoesNotExist:
            return Response(
                {"error": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        admin_note = request.data.get("admin_note")

        allowed_statuses = [
            "Approved",
            "Rejected",
            "Completed",
        ]

        if new_status is not None:
            if new_status not in allowed_statuses:
                return Response(
                    {
                        "error": "Invalid request status."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if return_request.status not in ["Pending", "Approved"]:
                return Response(
                    {
                        "error": "This request can no longer be updated."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                new_status == "Completed"
                and return_request.status != "Approved"
            ):
                return Response(
                    {
                        "error": "Only approved requests can be completed."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            return_request.status = new_status

        if admin_note is not None:
            return_request.admin_note = str(admin_note).strip()

        return_request.save()

        serializer = ReturnExchangeRequestSerializer(
            return_request,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "message": "Return/exchange request updated successfully.",
                "request": serializer.data
            },
            status=status.HTTP_200_OK
        )

class AdminReturnExchangeDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            return_request = ReturnExchangeRequest.objects.select_related(
                "customer",
                "order",
                "order_item"
            ).get(pk=pk)

        except ReturnExchangeRequest.DoesNotExist:
            return Response(
                {"error": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReturnExchangeRequestSerializer(
            return_request,
            context={"request": request}
        )

        return Response(serializer.data)

    def send_status_email(self, return_request):
        try:
            recipient_email = (
                return_request.order.email
                or return_request.customer.email
            )

            if not recipient_email:
                logger.warning(
                    "No email address found for return request %s",
                    return_request.id
                )
                return

            request_status = return_request.status
            request_type = return_request.request_type
            order_number = return_request.order.order_number

            if request_status == "Approved":
                subject = f"SĀRIKA: Your {request_type} Request Is Approved"
                status_message = (
                    "Good news! Your return/exchange request has been approved."
                )

            elif request_status == "Rejected":
                subject = f"SĀRIKA: Your {request_type} Request Was Rejected"
                status_message = (
                    "We are sorry. Your return/exchange request has been rejected."
                )

            elif request_status == "Completed":
                subject = f"SĀRIKA: Your {request_type} Request Is Completed"
                status_message = (
                    "Your return/exchange request has been completed successfully."
                )

            else:
                return

            admin_note = return_request.admin_note or "No additional note."

            message = f"""
Dear {return_request.order.full_name},

Your SĀRIKA {request_type.lower()} request has been updated.

Order Number: {order_number}
Request ID: {return_request.id}
Request Type: {request_type}
Current Status: {request_status}

{status_message}

Admin Note:
{admin_note}

Thank you for shopping with SĀRIKA.

Elegance woven into every thread.
SĀRIKA Customer Support
"""

            send_mail(
                subject=subject,
                message=message,
                from_email=None,
                recipient_list=[recipient_email],
                fail_silently=False
            )

        except Exception:
            logger.exception(
                "Failed to send return/exchange status email for request %s",
                return_request.id
            )

    @transaction.atomic
    def patch(self, request, pk):
        try:
            return_request = (
                ReturnExchangeRequest.objects
                .select_for_update()
                .select_related("customer", "order", "order_item")
                .get(pk=pk)
            )

        except ReturnExchangeRequest.DoesNotExist:
            return Response(
                {"error": "Request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        admin_note = request.data.get("admin_note")

        allowed_statuses = [
            "Approved",
            "Rejected",
            "Completed",
        ]

        old_status = return_request.status

        if new_status is not None:
            if new_status not in allowed_statuses:
                return Response(
                    {"error": "Invalid request status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if return_request.status not in ["Pending", "Approved"]:
                return Response(
                    {
                        "error": "This request can no longer be updated."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                new_status == "Completed"
                and return_request.status != "Approved"
            ):
                return Response(
                    {
                        "error": "Only approved requests can be completed."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            return_request.status = new_status

        if admin_note is not None:
            return_request.admin_note = str(admin_note).strip()

        return_request.save()

        # Send email only when the status actually changes.
        if new_status is not None and new_status != old_status:
            transaction.on_commit(
                lambda: self.send_status_email(return_request)
            )

        serializer = ReturnExchangeRequestSerializer(
            return_request,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "message": "Return/exchange request updated successfully.",
                "request": serializer.data
            },
            status=status.HTTP_200_OK
        )
