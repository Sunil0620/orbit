from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser
from apps.utils import CloudinaryImageField


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        if CustomUser.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return normalized_email

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'avatar', 'bio', 'is_online', 'last_seen')
        read_only_fields = ('id', 'is_online', 'last_seen')

    def validate_email(self, value):
        normalized_email = value.strip().lower()
        queryset = CustomUser.objects.filter(email__iexact=normalized_email)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('A user with that email already exists.')
        return normalized_email


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate_refresh(self, value):
        try:
            self.token = RefreshToken(value)
        except Exception as exc:
            raise serializers.ValidationError('Invalid refresh token.') from exc
        return value

    def save(self, **kwargs):
        self.token.blacklist()
