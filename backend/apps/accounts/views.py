from django.db.models import Count, Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    LogoutSerializer,
    RegisterSerializer,
    UserDirectorySerializer,
    UserProfileSerializer,
)
from .models import CustomUser


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserDirectoryView(generics.ListAPIView):
    serializer_class = UserDirectorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            CustomUser.objects.exclude(pk=self.request.user.pk)
            .annotate(
                shared_server_count=Count(
                    'servers',
                    filter=Q(servers__members=self.request.user),
                    distinct=True,
                )
            )
            .distinct()
            .order_by('-is_online', '-shared_server_count', 'username')
        )

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)


class LogoutView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_205_RESET_CONTENT)
