from django.urls import path

from .views import ServerJoinView, ServerLeaveView, ServerListCreateView

urlpatterns = [
    path('', ServerListCreateView.as_view(), name='server_list_create'),
    path('join/', ServerJoinView.as_view(), name='server_join'),
    path('<int:pk>/leave/', ServerLeaveView.as_view(), name='server_leave'),
]
