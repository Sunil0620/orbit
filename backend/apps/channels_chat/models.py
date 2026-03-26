from django.db import models

from apps.servers.models import Server


class Channel(models.Model):
    class ChannelType(models.TextChoices):
        TEXT = 'text', 'Text'
        ANNOUNCEMENT = 'announcement', 'Announcement'

    name = models.CharField(max_length=100)
    server = models.ForeignKey(
        Server,
        on_delete=models.CASCADE,
        related_name='channels',
    )
    channel_type = models.CharField(
        max_length=20,
        choices=ChannelType.choices,
        default=ChannelType.TEXT,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
