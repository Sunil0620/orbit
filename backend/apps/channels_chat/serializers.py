from rest_framework import serializers

from .models import Channel


class ChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Channel
        fields = ('id', 'name', 'server', 'channel_type', 'created_at')
        read_only_fields = ('id', 'created_at')
