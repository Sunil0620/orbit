import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Channel
from apps.messages.models import Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_id = self.scope['url_route']['kwargs'].get('channel_id')
        self.group_name = f'chat_{self.channel_id}'

        if self.scope['user'].is_anonymous:
            await self.close()
            return

        if not await self.user_can_access_channel():
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
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
                        'channel_id': int(self.channel_id),
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
        if not content:
            return

        message = await self.create_message(content)

        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'chat_message', 'message': message},
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def user_can_access_channel(self):
        return Channel.objects.filter(
            pk=self.channel_id,
            server__members=self.scope['user'],
        ).exists()

    @database_sync_to_async
    def create_message(self, content):
        message = Message.objects.create(
            channel_id=self.channel_id,
            sender=self.scope['user'],
            content=content,
        )
        return {
            'type': 'chat_message',
            'id': message.id,
            'channel_id': int(self.channel_id),
            'content': message.content,
            'sender': {
                'id': self.scope['user'].id,
                'username': self.scope['user'].username,
            },
            'timestamp': message.created_at.isoformat(),
            'file_url': message.file_url,
        }
