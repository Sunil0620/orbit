from django.urls import path

from .views import (
    ServerDetailView,
    ServerJoinView,
    ServerLeaveView,
    ServerListCreateView,
    ServerMemberRemoveView,
    ServerMemberRoleView,
)

urlpatterns = [
    path('', ServerListCreateView.as_view(), name='server_list_create'),
    path('join/', ServerJoinView.as_view(), name='server_join'),
    path('<int:pk>/', ServerDetailView.as_view(), name='server_detail'),
    path('<int:pk>/leave/', ServerLeaveView.as_view(), name='server_leave'),
    path(
        '<int:pk>/members/<int:member_id>/role/',
        ServerMemberRoleView.as_view(),
        name='server_member_role',
    ),
    path(
        '<int:pk>/members/<int:member_id>/',
        ServerMemberRemoveView.as_view(),
        name='server_member_remove',
    ),
]
