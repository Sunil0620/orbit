from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.utils import CloudinaryImageField

from .models import Server


class ServerOwnerSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar')


class ServerMemberSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar', 'is_online', 'role')

    def get_role(self, obj):
        server = self.context.get('server')
        return server.get_role_for_user(obj) if server else Server.Role.MEMBER


class ServerSerializer(serializers.ModelSerializer):
    icon = CloudinaryImageField(required=False, allow_null=True)
    owner = ServerOwnerSerializer(read_only=True)
    members = serializers.SerializerMethodField()
    invite_code = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = (
            'id',
            'name',
            'icon',
            'owner',
            'members',
            'invite_code',
            'current_user_role',
            'permissions',
            'created_at',
        )
        read_only_fields = (
            'id',
            'owner',
            'members',
            'invite_code',
            'current_user_role',
            'permissions',
            'created_at',
        )

    def _get_request_user(self):
        request = self.context.get('request')
        return getattr(request, 'user', None)

    def get_members(self, obj):
        role_order = {
            Server.Role.OWNER: 0,
            Server.Role.ADMIN: 1,
            Server.Role.MEMBER: 2,
        }
        members = sorted(
            obj.members.all(),
            key=lambda member: (
                role_order.get(obj.get_role_for_user(member), 99),
                member.username.lower(),
                member.id,
            ),
        )
        return ServerMemberSerializer(
            members,
            many=True,
            context={
                **self.context,
                'server': obj,
            },
        ).data

    def get_invite_code(self, obj):
        user = self._get_request_user()
        if user and not obj.can_invite_members(user):
            return None
        return str(obj.invite_code)

    def get_current_user_role(self, obj):
        user = self._get_request_user()
        return obj.get_role_for_user(user)

    def get_permissions(self, obj):
        user = self._get_request_user()
        return {
            'can_manage_server': obj.can_manage_server(user),
            'can_manage_channels': obj.can_manage_channels(user),
            'can_manage_members': obj.can_manage_members(user),
            'can_manage_roles': obj.can_manage_roles(user),
            'can_invite_members': obj.can_invite_members(user),
            'can_delete_server': obj.can_delete_server(user),
        }


class ServerJoinSerializer(serializers.Serializer):
    invite_code = serializers.UUIDField()


class ServerMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=(Server.Role.ADMIN, Server.Role.MEMBER),
    )
