from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.channel_id = self.scope['url_route']['kwargs'].get('channel_id')
        await self.accept()
        await self.close()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        pass
