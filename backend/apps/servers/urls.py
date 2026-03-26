from django.urls import path

from .views import (
    ServerDetailView,
    ServerJoinView,
    ServerLeaveView,
    ServerListCreateView,
)

urlpatterns = [
    path('', ServerListCreateView.as_view(), name='server_list_create'),
    path('join/', ServerJoinView.as_view(), name='server_join'),
    path('<int:pk>/', ServerDetailView.as_view(), name='server_detail'),
    path('<int:pk>/leave/', ServerLeaveView.as_view(), name='server_leave'),
]
