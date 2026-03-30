from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.channels_chat.models import Channel
from apps.messages.models import DirectConversation

from .serializers import MarkReadSerializer
from .services import (
    annotate_channels_with_unread_counts,
    annotate_direct_conversations_with_unread_counts,
    ensure_channel_read_states,
    ensure_direct_conversation_read_states,
    mark_channel_as_read,
    mark_direct_conversation_as_read,
)


class NotificationSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        channel_queryset = Channel.objects.filter(server__members=request.user).distinct()
        ensure_channel_read_states(request.user, channel_queryset)
        annotated_channels = annotate_channels_with_unread_counts(
            channel_queryset,
            request.user,
        )
        unread_channels = [
            {
                'channel_id': channel.id,
                'server_id': channel.server_id,
                'unread_count': int(getattr(channel, 'unread_count', 0) or 0),
            }
            for channel in annotated_channels
            if int(getattr(channel, 'unread_count', 0) or 0) > 0
        ]

        direct_queryset = DirectConversation.objects.filter(
            Q(user_one=request.user) | Q(user_two=request.user)
        )
        ensure_direct_conversation_read_states(request.user, direct_queryset)
        annotated_direct_conversations = annotate_direct_conversations_with_unread_counts(
            direct_queryset,
            request.user,
        )
        unread_direct_conversations = [
            {
                'direct_conversation_id': conversation.id,
                'unread_count': int(getattr(conversation, 'unread_count', 0) or 0),
            }
            for conversation in annotated_direct_conversations
            if int(getattr(conversation, 'unread_count', 0) or 0) > 0
        ]

        total_channel_unread = sum(
            item['unread_count'] for item in unread_channels
        )
        total_direct_unread = sum(
            item['unread_count'] for item in unread_direct_conversations
        )

        return Response(
            {
                'channels': unread_channels,
                'direct_conversations': unread_direct_conversations,
                'total_channel_unread': total_channel_unread,
                'total_direct_unread': total_direct_unread,
                'total_unread': total_channel_unread + total_direct_unread,
            }
        )


class ChannelReadStateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, channel_id, *args, **kwargs):
        channel = get_object_or_404(
            Channel.objects.select_related('server'),
            pk=channel_id,
            server__members=request.user,
        )
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        last_read_message_id = mark_channel_as_read(
            request.user,
            channel,
            serializer.validated_data.get('last_read_message_id'),
        )

        return Response(
            {
                'channel_id': channel.id,
                'last_read_message_id': last_read_message_id,
                'unread_count': 0,
            }
        )


class DirectConversationReadStateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id, *args, **kwargs):
        direct_conversation = get_object_or_404(
            DirectConversation.objects.select_related('user_one', 'user_two').filter(
                Q(user_one=request.user) | Q(user_two=request.user)
            ),
            pk=conversation_id,
        )
        serializer = MarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        last_read_message_id = mark_direct_conversation_as_read(
            request.user,
            direct_conversation,
            serializer.validated_data.get('last_read_message_id'),
        )

        return Response(
            {
                'direct_conversation_id': direct_conversation.id,
                'last_read_message_id': last_read_message_id,
                'unread_count': 0,
            }
        )
