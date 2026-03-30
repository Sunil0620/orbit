import cloudinary.uploader
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import APIException
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from apps.accounts.models import CustomUser
from apps.channels_chat.models import Channel
from apps.servers.models import Server

from .models import DirectConversation, Message
from .serializers import (
    DirectConversationCreateSerializer,
    DirectConversationSerializer,
    FileUploadSerializer,
    MessageSerializer,
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
                    'detail': 'Choose either a channel or a direct conversation, not both.',
                }
            )

        if channel:
            return 'channel', channel

        if direct_conversation:
            return 'direct', direct_conversation

        raise serializers.ValidationError(
            {
                'detail': 'A channel or direct_conversation query parameter is required.',
            }
        )

    def get_queryset(self):
        conversation_type, target = self.get_conversation_target()
        queryset = Message.objects.select_related('sender').order_by('-created_at', '-id')

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
        return (
            DirectConversation.objects.filter(
                Q(user_one=self.request.user) | Q(user_two=self.request.user)
            )
            .select_related('user_one', 'user_two')
            .order_by('-updated_at', '-id')
        )

    def get(self, request, *args, **kwargs):
        conversations = self.get_queryset()
        serializer = self.get_serializer(conversations, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        input_serializer = DirectConversationCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        recipient = get_object_or_404(
            CustomUser.objects.only('id', 'username', 'avatar', 'is_online', 'last_seen'),
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
                        'recipient_id': 'You can only start a direct message with someone who shares a server with you.',
                    }
                )

            conversation = DirectConversation.objects.create(
                user_one_id=ordered_user_ids[0],
                user_two_id=ordered_user_ids[1],
            )
            status_code = status.HTTP_201_CREATED
        else:
            status_code = status.HTTP_200_OK

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status_code)


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
