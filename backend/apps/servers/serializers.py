from rest_framework import serializers

from apps.accounts.models import CustomUser

from .models import Server


class ServerOwnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar')


class ServerSerializer(serializers.ModelSerializer):
    owner = ServerOwnerSerializer(read_only=True)

    class Meta:
        model = Server
        fields = ('id', 'name', 'icon', 'owner', 'invite_code', 'created_at')
        read_only_fields = ('id', 'owner', 'invite_code', 'created_at')


class ServerJoinSerializer(serializers.Serializer):
    invite_code = serializers.UUIDField()
