from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Server
from .serializers import ServerJoinSerializer, ServerSerializer


def get_server_queryset():
    return Server.objects.select_related('owner').prefetch_related('members')


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

        return Response(ServerSerializer(server).data, status=status.HTTP_200_OK)


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

    def get(self, request, *args, **kwargs):
        server = self.get_object()
        return Response(self.get_serializer(server).data)

    def patch(self, request, *args, **kwargs):
        server = self.get_object()
        self._ensure_owner(server)

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

        server.members.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
