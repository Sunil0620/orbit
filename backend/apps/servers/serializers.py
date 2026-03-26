from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.utils import CloudinaryImageField

from .models import Server


class ServerOwnerSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar')


class ServerMemberSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar', 'is_online')


class ServerSerializer(serializers.ModelSerializer):
    icon = CloudinaryImageField(required=False, allow_null=True)
    owner = ServerOwnerSerializer(read_only=True)
    members = ServerMemberSerializer(read_only=True, many=True)

    class Meta:
        model = Server
        fields = (
            'id',
            'name',
            'icon',
            'owner',
            'members',
            'invite_code',
            'created_at',
        )
        read_only_fields = ('id', 'owner', 'members', 'invite_code', 'created_at')


class ServerJoinSerializer(serializers.Serializer):
    invite_code = serializers.UUIDField()
