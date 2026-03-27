from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers
from rest_framework.exceptions import PermissionDenied

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
            Server.objects.prefetch_related('members'),
            pk=server_id,
            members=self.request.user,
        )

    def get_queryset(self):
        server = self.get_server()
        ensure_default_channel(server)
        return server.channels.order_by('created_at', 'id')

    def perform_create(self, serializer):
        serializer.save(server=self.get_server())


class ChannelDeleteView(generics.DestroyAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Channel.objects.select_related('server__owner')

    def get_object(self):
        channel = get_object_or_404(
            self.get_queryset(),
            pk=self.kwargs['pk'],
            server__members=self.request.user,
        )
        if channel.server.owner_id != self.request.user.id:
            raise PermissionDenied('Only the server owner can delete channels.')
        return channel
