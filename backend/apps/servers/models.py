import uuid

from cloudinary.models import CloudinaryField
from django.conf import settings
from django.db import models


class Server(models.Model):
    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'

    name = models.CharField(max_length=100)
    icon = CloudinaryField('icon', blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_servers',
    )
    admins = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='administered_servers',
        blank=True,
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='servers',
        blank=True,
    )
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def _prefetched_user_ids(self, relation_name):
        prefetched = getattr(self, '_prefetched_objects_cache', {})
        if relation_name in prefetched:
            return {user.id for user in prefetched[relation_name]}

        return set(getattr(self, relation_name).values_list('id', flat=True))

    def get_role_for_user(self, user):
        user_id = getattr(user, 'id', None)
        if not user_id:
            return None

        if self.owner_id == user_id:
            return self.Role.OWNER

        if user_id in self._prefetched_user_ids('admins'):
            return self.Role.ADMIN

        if user_id in self._prefetched_user_ids('members'):
            return self.Role.MEMBER

        return None

    def can_manage_server(self, user):
        return self.get_role_for_user(user) in {self.Role.OWNER, self.Role.ADMIN}

    def can_manage_channels(self, user):
        return self.get_role_for_user(user) in {self.Role.OWNER, self.Role.ADMIN}

    def can_manage_members(self, user):
        return self.get_role_for_user(user) in {self.Role.OWNER, self.Role.ADMIN}

    def can_manage_roles(self, user):
        return self.get_role_for_user(user) == self.Role.OWNER

    def can_invite_members(self, user):
        return self.get_role_for_user(user) in {self.Role.OWNER, self.Role.ADMIN}

    def can_delete_server(self, user):
        return self.get_role_for_user(user) == self.Role.OWNER

    def __str__(self):
        return self.name
