from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers
from rest_framework.response import Response

from apps.channels_chat.models import Channel

from .models import Message
from .serializers import MessageSerializer


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_channel(self):
        channel_id = self.request.query_params.get('channel')
        if not channel_id:
            raise serializers.ValidationError(
                {'channel': 'This query parameter is required.'}
            )

        return get_object_or_404(
            Channel.objects.select_related('server'),
            pk=channel_id,
            server__members=self.request.user,
        )

    def get_queryset(self):
        channel = self.get_channel()
        return (
            Message.objects.filter(channel=channel)
            .select_related('sender')
            .order_by('-created_at', '-id')
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(list(reversed(page)), many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(list(reversed(queryset[:50])), many=True)
        return Response(serializer.data)
