from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Server
from .serializers import ServerJoinSerializer, ServerSerializer


class ServerListCreateView(generics.ListCreateAPIView):
    serializer_class = ServerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Server.objects.filter(members=self.request.user)
            .select_related('owner')
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
            Server.objects.select_related('owner'),
            invite_code=serializer.validated_data['invite_code'],
        )
        server.members.add(request.user)

        return Response(ServerSerializer(server).data, status=status.HTTP_200_OK)


class ServerLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        server = get_object_or_404(
            Server.objects.select_related('owner').prefetch_related('members'),
            pk=pk,
            members=request.user,
        )

        if server.owner_id == request.user.id:
            raise serializers.ValidationError(
                {'detail': 'Server owners cannot leave their own server.'}
            )

        server.members.remove(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
