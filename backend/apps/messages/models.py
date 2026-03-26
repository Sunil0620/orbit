from django.conf import settings
from django.db import models

from apps.channels_chat.models import Channel


class Message(models.Model):
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    content = models.TextField(blank=True)
    file_url = models.URLField(blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=100, blank=True)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        preview = self.content[:40] if self.content else 'file message'
        return f'{self.sender} in #{self.channel_id}: {preview}'
