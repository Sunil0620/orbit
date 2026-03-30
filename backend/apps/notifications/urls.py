from django.urls import path

from .views import (
    ChannelReadStateView,
    DirectConversationReadStateView,
    NotificationSummaryView,
)

urlpatterns = [
    path('summary/', NotificationSummaryView.as_view(), name='notification_summary'),
    path('channels/<int:channel_id>/read/', ChannelReadStateView.as_view(), name='channel_read'),
    path(
        'direct-conversations/<int:conversation_id>/read/',
        DirectConversationReadStateView.as_view(),
        name='direct_conversation_read',
    ),
]
