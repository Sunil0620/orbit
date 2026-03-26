from django.urls import path

from .views import ChannelDeleteView, ChannelListCreateView

urlpatterns = [
    path('', ChannelListCreateView.as_view(), name='channel_list_create'),
    path('<int:pk>/', ChannelDeleteView.as_view(), name='channel_delete'),
]
