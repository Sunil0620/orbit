from rest_framework import serializers

from .models import Channel


class ChannelSerializer(serializers.ModelSerializer):
    unread_count = serializers.SerializerMethodField()

    def get_unread_count(self, obj):
        return int(getattr(obj, 'unread_count', 0) or 0)

    class Meta:
        model = Channel
        fields = (
            'id',
            'name',
            'server',
            'channel_type',
            'unread_count',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')
