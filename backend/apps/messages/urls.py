from django.urls import path

from .views import DirectConversationListCreateView, FileUploadView, MessageListView

urlpatterns = [
    path('', MessageListView.as_view(), name='message_list'),
    path(
        'direct-conversations/',
        DirectConversationListCreateView.as_view(),
        name='direct_conversation_list_create',
    ),
    path('upload/', FileUploadView.as_view(), name='message_upload'),
]
