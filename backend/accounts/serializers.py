
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


from .models import CustomerProfile

# ADMIN REGISTRATION
class AdminRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({
                "email": "This email is already registered."
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            **validated_data
        )


# CUSTOMER REGISTRATION
class CustomerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    confirm_password = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({
                "email": "This email is already registered."
            })

        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            is_staff=False,
            is_superuser=False,
            **validated_data
        )


class CustomerProfileSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    first_name = serializers.CharField(
        source="user.first_name",
        required=False,
        allow_blank=True
    )

    last_name = serializers.CharField(
        source="user.last_name",
        required=False,
        allow_blank=True
    )

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "address",
            "city",
            "state",
            "pincode",
        ]
        read_only_fields = ["id", "username", "email"]

    def update(self, instance, validated_data):

        user_data = validated_data.pop("user", {})

        for field, value in user_data.items():
            setattr(instance.user, field, value)

        if user_data:
            instance.user.save()

        return super().update(instance, validated_data)