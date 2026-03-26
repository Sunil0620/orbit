from rest_framework import serializers

from apps.accounts.models import CustomUser

from .models import Message


class MessageSenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar')


class MessageSerializer(serializers.ModelSerializer):
    sender = MessageSenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            'id',
            'channel',
            'content',
            'file_url',
            'file_name',
            'file_type',
            'is_edited',
            'created_at',
            'updated_at',
            'sender',
        )
        read_only_fields = fields
