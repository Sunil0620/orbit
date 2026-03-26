from django.urls import path

from .views import FileUploadView, MessageListView

urlpatterns = [
    path('', MessageListView.as_view(), name='message_list'),
    path('upload/', FileUploadView.as_view(), name='message_upload'),
]
