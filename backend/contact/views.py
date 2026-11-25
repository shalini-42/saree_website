
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import status

from .models import ContactMessage
from .serializers import (
    ContactMessageSerializer,
    AdminContactMessageSerializer,
)


# ==========================================
# CUSTOMER: SUBMIT CONTACT MESSAGE
# POST: /api/contact/
# ==========================================

class ContactMessageAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ContactMessageSerializer(data=request.data)

        if serializer.is_valid():

            contact_message = serializer.save()

            # SEND EMAIL NOTIFICATION TO ADMIN
            try:
                send_mail(
                    subject=(
                        f"New Customer Enquiry - "
                        f"{contact_message.subject}"
                    ),
                    message=f"""
A new customer enquiry has been received.

Customer Name: {contact_message.name}
Customer Email: {contact_message.email}
Phone Number: {contact_message.phone or "Not provided"}

Subject: {contact_message.subject}

Message:
{contact_message.message}

Please log in to the SĀRIKA admin dashboard to respond.
""",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.DEFAULT_FROM_EMAIL],
                    fail_silently=False,
                )

            except Exception as e:
                print("Admin notification email failed:", e)

            return Response(
                {
                    "success": True,
                    "message": (
                        "Your message has been submitted successfully. "
                        "Our team will contact you soon."
                    ),
                    "data": {
                        "id": contact_message.id,
                        "name": contact_message.name,
                        "email": contact_message.email,
                        "subject": contact_message.subject,
                        "created_at": contact_message.created_at,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "success": False,
                "message": "Please correct the form errors.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


# ==========================================
# ADMIN: LIST AND SEARCH CONTACT MESSAGES
# GET: /api/admin/contact/messages/
# ==========================================

class AdminContactMessageListAPIView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request):

        messages = ContactMessage.objects.all()

        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")

        if search:

            messages = messages.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(subject__icontains=search)
            )

        if status_filter and status_filter != "All":

            messages = messages.filter(status=status_filter)

        serializer = AdminContactMessageSerializer(
            messages,
            many=True
        )

        return Response({
            "success": True,
            "count": messages.count(),
            "data": serializer.data,
        })


# ==========================================
# ADMIN: MESSAGE DETAILS
# GET: View message
# PATCH: Update status/reply
# DELETE: Delete message
# ==========================================

class AdminContactMessageDetailAPIView(APIView):

    permission_classes = [IsAdminUser]

    def get(self, request, pk):

        contact_message = get_object_or_404(
            ContactMessage,
            pk=pk
        )

        serializer = AdminContactMessageSerializer(
            contact_message
        )

        return Response({
            "success": True,
            "data": serializer.data,
        })

    # --------------------------------------
    # UPDATE STATUS AND SEND CUSTOMER REPLY
    # --------------------------------------

    def patch(self, request, pk):

        contact_message = get_object_or_404(
            ContactMessage,
            pk=pk
        )

        previous_reply = contact_message.admin_reply

        serializer = AdminContactMessageSerializer(
            contact_message,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # SAVE MESSAGE FIRST
        updated_message = serializer.save()

        email_sent = None
        email_message = "Contact message updated successfully."

        new_reply = updated_message.admin_reply.strip()

        # SEND EMAIL ONLY FOR A NEW OR CHANGED REPLY
        if (
            "admin_reply" in request.data
            and new_reply
            and new_reply != previous_reply.strip()
        ):

            email_subject = (
                f"Reply to your enquiry - {updated_message.subject}"
            )

            email_body = f"""
Dear {updated_message.name},

Thank you for contacting SĀRIKA Luxury Boutique.

Our team has responded to your enquiry.

Your original subject:
{updated_message.subject}

Our reply:
{new_reply}

Thank you for choosing SĀRIKA.

Best regards,
SĀRIKA Customer Support Team
"""

            try:

                result = send_mail(
                    subject=email_subject,
                    message=email_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[updated_message.email],
                    fail_silently=False,
                )

                if result == 1:

                    email_sent = True
                    email_message = (
                        "Reply saved and email sent successfully."
                    )

                else:

                    email_sent = False
                    email_message = (
                        "Reply saved, but email could not be sent."
                    )

            except Exception as e:

                email_sent = False

                email_message = (
                    "Reply saved successfully, but email delivery failed. "
                    "Please check your SMTP configuration."
                )

                print("Customer reply email failed:", e)

        return Response(
            {
                "success": True,
                "message": email_message,
                "email_sent": email_sent,
                "data": AdminContactMessageSerializer(
                    updated_message
                ).data,
            },
            status=status.HTTP_200_OK
        )

    # --------------------------------------
    # DELETE CONTACT MESSAGE
    # --------------------------------------

    def delete(self, request, pk):

        contact_message = get_object_or_404(
            ContactMessage,
            pk=pk
        )

        contact_message.delete()

        return Response(
            {
                "success": True,
                "message": "Contact message deleted successfully.",
            },
            status=status.HTTP_200_OK
        )
