from django.conf import settings
from django.db import models

from apps.channels_chat.models import Channel
from apps.messages.models import DirectConversation


class ChannelReadState(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='channel_read_states',
    )
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name='read_states',
    )
    last_read_message = models.ForeignKey(
        'chat_messages.Message',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'channel'),
                name='unique_channel_read_state',
            ),
        ]

    def __str__(self):
        return f'ChannelReadState(user={self.user_id}, channel={self.channel_id})'


class DirectConversationReadState(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='direct_conversation_read_states',
    )
    direct_conversation = models.ForeignKey(
        DirectConversation,
        on_delete=models.CASCADE,
        related_name='read_states',
    )
    last_read_message = models.ForeignKey(
        'chat_messages.Message',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'direct_conversation'),
                name='unique_direct_conversation_read_state',
            ),
        ]

    def __str__(self):
        return (
            'DirectConversationReadState('
            f'user={self.user_id}, '
            f'direct_conversation={self.direct_conversation_id}'
            ')'
        )
