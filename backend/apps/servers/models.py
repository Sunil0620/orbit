import uuid

from cloudinary.models import CloudinaryField
from django.conf import settings
from django.db import models


class Server(models.Model):
    name = models.CharField(max_length=100)
    icon = CloudinaryField('icon', blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_servers',
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='servers',
        blank=True,
    )
    invite_code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
