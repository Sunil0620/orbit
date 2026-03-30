import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db.models import Q
from rest_framework import serializers

from .models import Channel
from apps.messages.models import DirectConversation, Message
from apps.messages.serializers import (
    build_legacy_attachment,
    normalize_message_attachments,
)
from apps.utils import build_cloudinary_asset_url
from .presence import close_presence_connection, open_presence_connection


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.connection_ready = False
        self.user = self.scope['user']
        self.group_name = 'presence_global'

        if self.user.is_anonymous:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self.connection_ready = True

        did_transition_online = await self.open_presence_connection()

        if did_transition_online:
            await self.set_user_online_state(True)
            await self.broadcast_presence(True)
            return

        await self.send(
            text_data=json.dumps(
                {
                    'type': 'presence',
                    'user_id': self.user.id,
                    'is_online': True,
                }
            )
        )

    async def disconnect(self, close_code):
        if not getattr(self, 'connection_ready', False):
            return

        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        did_transition_offline = await self.close_presence_connection()

        if did_transition_offline:
            await self.set_user_online_state(False)
            await self.broadcast_presence(False)

    async def receive(self, text_data):
        # Presence sockets stay open passively; heartbeat payloads can be ignored.
        return

    async def presence_event(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def broadcast_presence(self, is_online):
        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'presence_event',
                'message': {
                    'type': 'presence',
                    'user_id': self.user.id,
                    'is_online': is_online,
                },
            },
        )

    @database_sync_to_async
    def set_user_online_state(self, is_online):
        self.user.is_online = is_online
        self.user.save(update_fields=['is_online', 'last_seen'])

    @database_sync_to_async
    def open_presence_connection(self):
        return open_presence_connection(self.user.id)

    @database_sync_to_async
    def close_presence_connection(self):
        return close_presence_connection(self.user.id)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.connection_ready = False
        self.user = self.scope['user']
        self.channel_id = self.scope['url_route']['kwargs'].get('channel_id')
        self.direct_conversation_id = self.scope['url_route']['kwargs'].get(
            'conversation_id'
        )
        self.is_direct_conversation = self.direct_conversation_id is not None
        self.target_id = self.direct_conversation_id or self.channel_id
        group_prefix = 'direct' if self.is_direct_conversation else 'chat'
        self.group_name = f'{group_prefix}_{self.target_id}'

        if self.user.is_anonymous:
            await self.close()
            return

        if not await self.user_can_access_target():
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self.connection_ready = True

    async def disconnect(self, close_code):
        if getattr(self, 'connection_ready', False):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data or '{}')
        except json.JSONDecodeError:
            return

        message_type = payload.get('type', 'chat_message')

        if message_type == 'typing':
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'typing_event',
                    'message': {
                        'type': 'typing',
                        'channel_id': int(self.channel_id) if self.channel_id else None,
                        'direct_conversation_id': (
                            int(self.direct_conversation_id)
                            if self.direct_conversation_id
                            else None
                        ),
                        'conversation_type': (
                            'direct' if self.is_direct_conversation else 'channel'
                        ),
                        'user_id': self.scope['user'].id,
                        'username': self.scope['user'].username,
                        'is_typing': bool(payload.get('is_typing')),
                    },
                },
            )
            return

        if message_type != 'chat_message':
            return

        content = str(payload.get('content', '')).strip()
        file_url = str(payload.get('file_url', '')).strip()
        file_name = str(payload.get('file_name', '')).strip()
        file_type = str(payload.get('file_type', '')).strip()
        raw_attachments = payload.get('attachments')

        try:
            attachments = normalize_message_attachments(
                raw_attachments,
                legacy_attachment=build_legacy_attachment(file_url, file_name, file_type),
            )
        except serializers.ValidationError:
            return

        if not content and not attachments:
            return

        message = await self.create_message(content, attachments)

        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'chat_message', 'message': message},
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def user_can_access_target(self):
        if self.is_direct_conversation:
            return DirectConversation.objects.filter(
                pk=self.direct_conversation_id,
            ).filter(
                Q(user_one=self.user) | Q(user_two=self.user)
            ).exists()

        return Channel.objects.filter(
            pk=self.channel_id,
            server__members=self.user,
        ).exists()

    @database_sync_to_async
    def create_message(self, content, attachments=None):
        attachments = attachments or []
        primary_attachment = attachments[0] if attachments else {}
        message_kwargs = {
            'sender': self.user,
            'content': content,
            'attachments': attachments,
            'file_url': primary_attachment.get('url', ''),
            'file_name': primary_attachment.get('file_name', ''),
            'file_type': primary_attachment.get('file_type', ''),
        }

        if self.is_direct_conversation:
            message_kwargs['direct_conversation_id'] = self.direct_conversation_id
        else:
            message_kwargs['channel_id'] = self.channel_id

        message = Message.objects.create(**message_kwargs)

        if self.is_direct_conversation:
            DirectConversation.objects.filter(pk=self.direct_conversation_id).update(
                updated_at=message.created_at
            )

        return {
            'type': 'chat_message',
            'id': message.id,
            'channel_id': int(self.channel_id) if self.channel_id else None,
            'direct_conversation_id': (
                int(self.direct_conversation_id) if self.direct_conversation_id else None
            ),
            'conversation_type': 'direct' if self.is_direct_conversation else 'channel',
            'content': message.content,
            'attachments': attachments,
            'sender': {
                'id': self.user.id,
                'username': self.user.username,
                'avatar': build_cloudinary_asset_url(self.user.avatar),
            },
            'timestamp': message.created_at.isoformat(),
            'file_url': message.file_url,
            'file_name': message.file_name,
            'file_type': message.file_type,
        }
