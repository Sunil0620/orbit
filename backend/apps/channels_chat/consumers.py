from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.close()
    async def disconnect(self, close_code):
        pass
    async def receive(self, text_data):
        pass