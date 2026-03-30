from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.servers.models import Server

from .models import Channel
from .serializers import ChannelSerializer


def ensure_default_channel(server):
    if server.channels.exists():
        return

    Channel.objects.create(
        server=server,
        name='general',
        channel_type=Channel.ChannelType.TEXT,
    )


class ChannelListCreateView(generics.ListCreateAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _get_server_id(self):
        if self.request.method == 'GET':
            return self.request.query_params.get('server')
        return self.request.data.get('server')

    def get_server(self):
        server_id = self._get_server_id()
        if not server_id:
            raise serializers.ValidationError(
                {'server': 'This field is required.'}
            )

        return get_object_or_404(
            Server.objects.select_related('owner').prefetch_related('members'),
            pk=server_id,
            members=self.request.user,
        )

    def get_queryset(self):
        server = self.get_server()
        ensure_default_channel(server)
        return server.channels.order_by('created_at', 'id')

    def perform_create(self, serializer):
        server = self.get_server()
        if not server.can_manage_channels(self.request.user):
            raise PermissionDenied(
                'Only the server owner or admins can create channels.'
            )
        serializer.save(server=server)


class ChannelDeleteView(generics.DestroyAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Channel.objects.select_related('server__owner').prefetch_related(
        'server__admins',
    )

    def get_object(self):
        channel = get_object_or_404(
            self.get_queryset(),
            pk=self.kwargs['pk'],
            server__members=self.request.user,
        )
        if not channel.server.can_manage_channels(self.request.user):
            raise PermissionDenied(
                'Only the server owner or admins can delete channels.'
            )
        return channel

    def destroy(self, request, *args, **kwargs):
        channel = self.get_object()
        if channel.server.channels.count() <= 1:
            raise serializers.ValidationError(
                {'detail': 'A server must keep at least one channel.'}
            )
        self.perform_destroy(channel)
        return Response(status=204)
