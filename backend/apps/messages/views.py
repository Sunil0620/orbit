import cloudinary.uploader
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import (
    CharField,
    Count,
    DateTimeField,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
)
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import APIException
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import CustomUser
from apps.channels_chat.models import Channel
from apps.notifications.services import (
    annotate_direct_conversations_with_unread_counts,
    create_direct_conversation_read_states,
    ensure_direct_conversation_read_states,
)
from apps.servers.models import Server

from .models import DirectConversation, Message, MessageReaction
from .serializers import (
    DirectConversationCreateSerializer,
    DirectConversationSerializer,
    FileUploadSerializer,
    MessageSerializer,
    MessageReactionToggleSerializer,
    build_message_reaction_summary,
)


def build_direct_conversation_queryset(user):
    latest_message_queryset = Message.objects.filter(
        direct_conversation=OuterRef('pk'),
    ).order_by('-created_at', '-id')
    queryset = (
        DirectConversation.objects.filter(
            Q(user_one=user) | Q(user_two=user)
        )
        .select_related('user_one', 'user_two')
        .annotate(message_count=Count('messages', distinct=True))
        .annotate(
            latest_message_content=Subquery(
                latest_message_queryset.values('content')[:1],
                output_field=CharField(),
            ),
            latest_message_file_name=Subquery(
                latest_message_queryset.values('file_name')[:1],
                output_field=CharField(),
            ),
            latest_message_file_url=Subquery(
                latest_message_queryset.values('file_url')[:1],
                output_field=CharField(),
            ),
            latest_message_created_at=Subquery(
                latest_message_queryset.values('created_at')[:1],
                output_field=DateTimeField(),
            ),
            latest_message_sender_id=Subquery(
                latest_message_queryset.values('sender_id')[:1],
                output_field=IntegerField(),
            ),
            latest_message_sender_username=Subquery(
                latest_message_queryset.values('sender__username')[:1],
                output_field=CharField(),
            ),
        )
        .order_by('-updated_at', '-id')
    )
    ensure_direct_conversation_read_states(user, queryset)
    return annotate_direct_conversations_with_unread_counts(
        queryset,
        user,
    )


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_channel(self):
        channel_id = self.request.query_params.get('channel')
        if not channel_id:
            return None

        return get_object_or_404(
            Channel.objects.select_related('server'),
            pk=channel_id,
            server__members=self.request.user,
        )

    def get_direct_conversation(self):
        conversation_id = self.request.query_params.get('direct_conversation')
        if not conversation_id:
            return None

        return get_object_or_404(
            DirectConversation.objects.select_related('user_one', 'user_two').filter(
                Q(user_one=self.request.user) | Q(user_two=self.request.user)
            ),
            pk=conversation_id,
        )

    def get_conversation_target(self):
        channel = self.get_channel()
        direct_conversation = self.get_direct_conversation()

        if channel and direct_conversation:
            raise serializers.ValidationError(
                {
                    'detail': (
                        'Choose either a channel or a direct conversation, not both.'
                    ),
                }
            )

        if channel:
            return 'channel', channel

        if direct_conversation:
            return 'direct', direct_conversation

        raise serializers.ValidationError(
            {
                'detail': (
                    'A channel or direct_conversation query parameter is required.'
                ),
            }
        )

    def get_queryset(self):
        conversation_type, target = self.get_conversation_target()
        queryset = (
            Message.objects.select_related('sender')
            .prefetch_related('reactions__user')
            .order_by('-created_at', '-id')
        )

        if conversation_type == 'channel':
            return queryset.filter(channel=target)

        return queryset.filter(direct_conversation=target)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(list(reversed(page)), many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(list(reversed(queryset[:50])), many=True)
        return Response(serializer.data)


class DirectConversationListCreateView(generics.GenericAPIView):
    serializer_class = DirectConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return build_direct_conversation_queryset(
            self.request.user,
        )

    def get(self, request, *args, **kwargs):
        conversations = self.get_queryset()
        serializer = self.get_serializer(conversations, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        input_serializer = DirectConversationCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        recipient = get_object_or_404(
            CustomUser.objects.only(
                'id',
                'username',
                'avatar',
                'is_online',
                'last_seen',
            ),
            pk=input_serializer.validated_data['recipient_id'],
        )

        if recipient.id == request.user.id:
            raise serializers.ValidationError(
                {'recipient_id': 'You cannot start a direct message with yourself.'}
            )

        ordered_user_ids = DirectConversation.normalize_user_ids(
            request.user.id,
            recipient.id,
        )
        conversation = (
            DirectConversation.objects.filter(
                user_one_id=ordered_user_ids[0],
                user_two_id=ordered_user_ids[1],
            )
            .select_related('user_one', 'user_two')
            .first()
        )

        if conversation is None:
            shares_server = Server.objects.filter(members=request.user).filter(
                members=recipient
            ).exists()
            if not shares_server:
                raise serializers.ValidationError(
                    {
                        'recipient_id': (
                            'You can only start a direct message with someone who '
                            'shares a server with you.'
                        ),
                    }
                )

            conversation = DirectConversation.objects.create(
                user_one_id=ordered_user_ids[0],
                user_two_id=ordered_user_ids[1],
            )
            create_direct_conversation_read_states(conversation)
            status_code = status.HTTP_201_CREATED
        else:
            ensure_direct_conversation_read_states(request.user, [conversation])
            status_code = status.HTTP_200_OK

        conversation = (
            self.get_queryset().filter(pk=conversation.pk).first()
            or conversation
        )
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status_code)


class MessageReactionToggleView(generics.GenericAPIView):
    serializer_class = MessageReactionToggleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_message(self, message_id):
        return get_object_or_404(
            Message.objects.select_related(
                'channel__server',
                'direct_conversation',
            ).filter(
                Q(channel__server__members=self.request.user)
                | Q(direct_conversation__user_one=self.request.user)
                | Q(direct_conversation__user_two=self.request.user)
            ).distinct(),
            pk=message_id,
        )

    def _build_payload(self, message, reactions, emoji, action):
        return {
            'type': 'reaction_update',
            'message_id': message.id,
            'channel_id': message.channel_id,
            'direct_conversation_id': message.direct_conversation_id,
            'conversation_type': 'direct'
            if message.direct_conversation_id
            else 'channel',
            'emoji': emoji,
            'action': action,
            'reactions': reactions,
        }

    def _broadcast_update(self, message, payload):
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return

        async_to_sync(channel_layer.group_send)(
            message.get_realtime_group_name(),
            {
                'type': 'reaction_event',
                'message': payload,
            },
        )

    def post(self, request, message_id, *args, **kwargs):
        message = self.get_message(message_id)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        emoji = serializer.validated_data['emoji']

        reaction, created = MessageReaction.objects.get_or_create(
            message=message,
            user=request.user,
            emoji=emoji,
        )

        if created:
            action = 'added'
        else:
            reaction.delete()
            action = 'removed'

        refreshed_message = (
            Message.objects.prefetch_related('reactions__user').only(
                'id',
                'channel_id',
                'direct_conversation_id',
            ).get(pk=message.pk)
        )
        reactions = build_message_reaction_summary(
            refreshed_message,
            current_user=request.user,
        )
        payload = self._build_payload(
            refreshed_message,
            reactions,
            emoji,
            action,
        )
        self._broadcast_update(refreshed_message, payload)
        return Response(payload)


class FileUploadView(generics.GenericAPIView):
    serializer_class = FileUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']

        try:
            result = cloudinary.uploader.upload(
                uploaded_file,
                folder='orbit/message_uploads',
                resource_type='auto',
            )
        except Exception as exc:
            raise APIException('Unable to upload the selected file right now.') from exc

        return Response(
            {
                'url': result['secure_url'],
                'file_name': uploaded_file.name,
                'file_type': serializer.validated_data['file_type'],
            },
            status=status.HTTP_201_CREATED,
        )
