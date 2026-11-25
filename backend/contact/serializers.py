
from rest_framework import serializers
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ContactMessage

        fields = [
            "id",
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "status",
            "admin_reply",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "admin_reply",
            "created_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 2:
            raise serializers.ValidationError(
                "Name must contain at least 2 characters."
            )

        return value

    def validate_subject(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Subject must contain at least 3 characters."
            )

        return value

    def validate_message(self, value):
        value = value.strip()

        if len(value) < 10:
            raise serializers.ValidationError(
                "Message must contain at least 10 characters."
            )

        return value

        
class AdminContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "status",
            "admin_reply",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "name",
            "email",
            "phone",
            "subject",
            "message",
            "created_at",
            "updated_at",
        ]