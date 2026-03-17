"""
ASGI config for Orbit.
This is what enables WebSockets via Django Channels.
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.dev')

# Import channel routes AFTER setting env variable
from apps.channels_chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    # HTTP → Django views (normal)
    'http': get_asgi_application(),

    # WebSocket → Django Channels consumers
    'websocket': AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
