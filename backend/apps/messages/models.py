from django.conf import settings
from django.db import models
from django.db.models import F, Q

from apps.channels_chat.models import Channel


class DirectConversation(models.Model):
    user_one = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='direct_conversations_started',
    )
    user_two = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='direct_conversations_received',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-updated_at', '-id')
        constraints = [
            models.UniqueConstraint(
                fields=('user_one', 'user_two'),
                name='unique_direct_conversation_pair',
            ),
            models.CheckConstraint(
                check=~Q(user_one=F('user_two')),
                name='prevent_self_direct_conversation',
            ),
        ]

    @staticmethod
    def normalize_user_ids(left_user_id, right_user_id):
        if left_user_id == right_user_id:
            raise ValueError('Direct conversations require two different users.')

        ordered_ids = sorted((int(left_user_id), int(right_user_id)))
        return ordered_ids[0], ordered_ids[1]

    def save(self, *args, **kwargs):
        if self.user_one_id and self.user_two_id and self.user_one_id > self.user_two_id:
            self.user_one_id, self.user_two_id = self.user_two_id, self.user_one_id

        super().save(*args, **kwargs)

    def includes_user(self, user):
        user_id = getattr(user, 'id', None)
        return bool(user_id and user_id in {self.user_one_id, self.user_two_id})

    def get_other_participant(self, user):
        user_id = getattr(user, 'id', None)
        if not user_id:
            return None

        if self.user_one_id == user_id:
            return self.user_two

        if self.user_two_id == user_id:
            return self.user_one

        return None

    def __str__(self):
        return f'DM {self.user_one_id}:{self.user_two_id}'


class Message(models.Model):
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True,
    )
    direct_conversation = models.ForeignKey(
        DirectConversation,
        on_delete=models.CASCADE,
        related_name='messages',
        null=True,
        blank=True,
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    content = models.TextField(blank=True)
    attachments = models.JSONField(default=list, blank=True)
    file_url = models.URLField(blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=100, blank=True)
    is_edited = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=(
                    (Q(channel__isnull=False) & Q(direct_conversation__isnull=True))
                    | (Q(channel__isnull=True) & Q(direct_conversation__isnull=False))
                ),
                name='message_requires_single_conversation_target',
            ),
        ]

    def __str__(self):
        preview = self.content[:40] if self.content else 'file message'
        if self.channel_id:
            target = f'#{self.channel_id}'
        else:
            target = f'DM:{self.direct_conversation_id}'
        return f'{self.sender} in {target}: {preview}'

    def get_realtime_group_name(self):
        if self.direct_conversation_id:
            return f'direct_{self.direct_conversation_id}'
        return f'chat_{self.channel_id}'


class MessageReaction(models.Model):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='reactions',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_reactions',
    )
    emoji = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at', 'id')
        constraints = [
            models.UniqueConstraint(
                fields=('message', 'user', 'emoji'),
                name='unique_message_reaction',
            ),
        ]

    def __str__(self):
        return f'Reaction({self.emoji}) by {self.user_id} on message {self.message_id}'
