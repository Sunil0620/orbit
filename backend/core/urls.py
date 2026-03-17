from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/servers/', include('apps.servers.urls')),
    path('api/channels/', include('apps.channels_chat.urls')),
    path('api/messages/', include('apps.messages.urls')),
]
