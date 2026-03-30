from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Server
from .serializers import (
    ServerJoinSerializer,
    ServerMemberRoleSerializer,
    ServerSerializer,
)


def get_server_queryset():
    return Server.objects.select_related('owner').prefetch_related('members', 'admins')


class ServerListCreateView(generics.ListCreateAPIView):
    serializer_class = ServerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            get_server_queryset()
            .filter(members=self.request.user)
            .order_by('name', 'id')
        )

    def perform_create(self, serializer):
        server = serializer.save(owner=self.request.user)
        server.members.add(self.request.user)


class ServerJoinView(generics.GenericAPIView):
    serializer_class = ServerJoinSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        server = get_object_or_404(
            get_server_queryset(),
            invite_code=serializer.validated_data['invite_code'],
        )
        server.members.add(request.user)

        refreshed_server = get_server_queryset().get(pk=server.pk)
        return Response(
            ServerSerializer(
                refreshed_server,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_200_OK,
        )


class ServerDetailView(generics.GenericAPIView):
    serializer_class = ServerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(
            get_server_queryset(),
            pk=self.kwargs['pk'],
            members=self.request.user,
        )

    def _ensure_owner(self, server):
        if server.owner_id != self.request.user.id:
            raise PermissionDenied('Only the server owner can modify this server.')

    def _ensure_manager(self, server):
        if not server.can_manage_server(self.request.user):
            raise PermissionDenied(
                'Only the server owner or admins can modify this server.'
            )

    def get(self, request, *args, **kwargs):
        server = self.get_object()
        return Response(self.get_serializer(server).data)

    def patch(self, request, *args, **kwargs):
        server = self.get_object()
        self._ensure_manager(server)

        serializer = self.get_serializer(server, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def delete(self, request, *args, **kwargs):
        server = self.get_object()
        self._ensure_owner(server)
        server.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServerLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        server = get_object_or_404(
            get_server_queryset(),
            pk=pk,
            members=request.user,
        )

        if server.owner_id == request.user.id:
            raise serializers.ValidationError(
                {'detail': 'Server owners cannot leave their own server.'}
            )

        server.admins.remove(request.user)
        server.members.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ServerMemberRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk, member_id, *args, **kwargs):
        server = get_object_or_404(
            get_server_queryset(),
            pk=pk,
            members=request.user,
        )

        if not server.can_manage_roles(request.user):
            raise PermissionDenied('Only the server owner can change member roles.')

        member = get_object_or_404(server.members.all(), pk=member_id)

        if member.id == server.owner_id:
            raise serializers.ValidationError(
                {'detail': 'The server owner role cannot be changed.'}
            )

        serializer = ServerMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        next_role = serializer.validated_data['role']

        if next_role == Server.Role.ADMIN:
            server.admins.add(member)
        else:
            server.admins.remove(member)

        refreshed_server = get_server_queryset().get(pk=server.pk)
        return Response(
            ServerSerializer(
                refreshed_server,
                context={'request': request},
            ).data,
            status=status.HTTP_200_OK,
        )


class ServerMemberRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk, member_id, *args, **kwargs):
        server = get_object_or_404(
            get_server_queryset(),
            pk=pk,
            members=request.user,
        )

        if not server.can_manage_members(request.user):
            raise PermissionDenied(
                'Only the server owner or admins can remove members.'
            )

        member = get_object_or_404(server.members.all(), pk=member_id)

        if member.id == server.owner_id:
            raise serializers.ValidationError(
                {'detail': 'The server owner cannot be removed.'}
            )

        if member.id == request.user.id:
            raise serializers.ValidationError(
                {'detail': 'Use leave server if you want to remove yourself.'}
            )

        if (
            server.get_role_for_user(request.user) == Server.Role.ADMIN
            and server.get_role_for_user(member) == Server.Role.ADMIN
        ):
            raise PermissionDenied(
                'Only the server owner can remove another admin.'
            )

        server.admins.remove(member)
        server.members.remove(member)

        refreshed_server = get_server_queryset().get(pk=server.pk)
        return Response(
            ServerSerializer(
                refreshed_server,
                context={'request': request},
            ).data,
            status=status.HTTP_200_OK,
        )
