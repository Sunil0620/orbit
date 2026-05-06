from pathlib import Path

from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.utils import CloudinaryImageField

from .models import DirectConversation, Message, MessageReaction

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {
    'jpg': {'image/jpeg', 'image/jpg'},
    'jpeg': {'image/jpeg', 'image/jpg'},
    'png': {'image/png'},
    'gif': {'image/gif'},
    'webp': {'image/webp'},
    'pdf': {'application/pdf'},
    'txt': {'text/plain'},
}
NORMALIZED_FILE_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
}


class MessageSenderSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar')


class DirectConversationParticipantSerializer(serializers.ModelSerializer):
    avatar = CloudinaryImageField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'avatar', 'is_online', 'last_seen')


class MessageAttachmentSerializer(serializers.Serializer):
    url = serializers.URLField()
    file_name = serializers.CharField(max_length=255)
    file_type = serializers.CharField(max_length=100)


def build_legacy_attachment(file_url='', file_name='', file_type=''):
    normalized_url = str(file_url or '').strip()

    if not normalized_url:
        return None

    return {
        'url': normalized_url,
        'file_name': str(file_name or '').strip() or 'Attachment',
        'file_type': str(file_type or '').strip(),
    }


def normalize_message_attachments(raw_attachments, legacy_attachment=None):
    if raw_attachments in (None, ''):
        attachments = []
    else:
        if not isinstance(raw_attachments, list):
            raise serializers.ValidationError(
                {'attachments': 'Attachments must be provided as a list.'}
            )

        attachment_serializer = MessageAttachmentSerializer(
            data=raw_attachments,
            many=True,
        )
        attachment_serializer.is_valid(raise_exception=True)
        attachments = [
            {
                'url': item['url'],
                'file_name': item['file_name'],
                'file_type': item['file_type'],
            }
            for item in attachment_serializer.validated_data
        ]

    if not attachments and legacy_attachment:
        return [legacy_attachment]

    return attachments


def build_message_attachments(message):
    return normalize_message_attachments(
        getattr(message, 'attachments', None),
        legacy_attachment=build_legacy_attachment(
            getattr(message, 'file_url', ''),
            getattr(message, 'file_name', ''),
            getattr(message, 'file_type', ''),
        ),
    )


def build_message_reaction_summary(message, current_user=None):
    raw_reactions = getattr(message, '_prefetched_objects_cache', {}).get('reactions')
    if raw_reactions is None:
        raw_reactions = message.reactions.select_related('user').all()

    current_user_id = getattr(current_user, 'id', None)
    grouped_reactions = {}

    for reaction in raw_reactions:
        group = grouped_reactions.setdefault(
            reaction.emoji,
            {
                'emoji': reaction.emoji,
                'count': 0,
                'reacted_by_current_user': False,
                'reactor_ids': [],
            },
        )
        group['count'] += 1
        group['reactor_ids'].append(reaction.user_id)
        if current_user_id and reaction.user_id == current_user_id:
            group['reacted_by_current_user'] = True

    return sorted(
        grouped_reactions.values(),
        key=lambda item: (-item['count'], item['emoji']),
    )


class MessageSerializer(serializers.ModelSerializer):
    sender = MessageSenderSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()
    channel_id = serializers.IntegerField(read_only=True)
    direct_conversation_id = serializers.IntegerField(read_only=True)
    conversation_type = serializers.SerializerMethodField()

    def get_attachments(self, obj):
        return build_message_attachments(obj)

    def get_reactions(self, obj):
        request = self.context.get('request')
        return build_message_reaction_summary(obj, current_user=getattr(request, 'user', None))

    def get_conversation_type(self, obj):
        return 'direct' if obj.direct_conversation_id else 'channel'

    class Meta:
        model = Message
        fields = (
            'id',
            'channel',
            'channel_id',
            'direct_conversation',
            'direct_conversation_id',
            'conversation_type',
            'content',
            'attachments',
            'reactions',
            'file_url',
            'file_name',
            'file_type',
            'is_edited',
            'created_at',
            'updated_at',
            'sender',
        )
        read_only_fields = fields


class DirectConversationSerializer(serializers.ModelSerializer):
    participant = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_read_message_id = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    last_message_sender_id = serializers.SerializerMethodField()
    last_message_sender_username = serializers.SerializerMethodField()
    last_message_has_attachments = serializers.SerializerMethodField()

    class Meta:
        model = DirectConversation
        fields = (
            'id',
            'participant',
            'last_message_preview',
            'last_message_at',
            'unread_count',
            'last_read_message_id',
            'message_count',
            'last_message_sender_id',
            'last_message_sender_username',
            'last_message_has_attachments',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def _get_request_user(self):
        request = self.context.get('request')
        return getattr(request, 'user', None)

    def get_participant(self, obj):
        participant = obj.get_other_participant(self._get_request_user())
        if participant is None:
            return None

        return DirectConversationParticipantSerializer(participant).data

    def _has_latest_message_annotation(self, obj):
        return hasattr(obj, 'latest_message_created_at')

    def get_last_message_preview(self, obj):
        if self._has_latest_message_annotation(obj):
            content = str(getattr(obj, 'latest_message_content', '') or '').strip()
            if content:
                return content[:120]

            file_name = str(getattr(obj, 'latest_message_file_name', '') or '').strip()
            if file_name:
                return file_name

            if getattr(obj, 'latest_message_file_url', ''):
                return 'Attachment'

            return ''

        last_message = getattr(obj, '_last_message', None)
        if last_message is None:
            last_message = obj.messages.order_by('-created_at', '-id').first()
            obj._last_message = last_message

        if last_message is None:
            return ''

        content = str(last_message.content or '').strip()
        if content:
            return content[:120]

        attachments = build_message_attachments(last_message)
        if not attachments:
            return ''

        if len(attachments) == 1:
            return attachments[0].get('file_name') or 'Attachment'

        return f'{len(attachments)} attachments'

    def get_last_message_at(self, obj):
        if self._has_latest_message_annotation(obj):
            return getattr(obj, 'latest_message_created_at', None)

        last_message = getattr(obj, '_last_message', None)
        if last_message is None:
            last_message = obj.messages.order_by('-created_at', '-id').first()
            obj._last_message = last_message

        return last_message.created_at if last_message else None

    def get_unread_count(self, obj):
        return int(getattr(obj, 'unread_count', 0) or 0)

    def get_last_read_message_id(self, obj):
        value = getattr(obj, 'last_read_message_id', None)
        if value is not None:
            return int(value)

        request_user = self._get_request_user()
        if request_user is None:
            return None

        state = obj.read_states.filter(user=request_user).only('last_read_message_id').first()
        return getattr(state, 'last_read_message_id', None)

    def get_message_count(self, obj):
        value = getattr(obj, 'message_count', None)
        if value is not None:
            return int(value)
        return obj.messages.count()

    def _get_last_message(self, obj):
        last_message = getattr(obj, '_last_message', None)
        if last_message is None:
            last_message = obj.messages.select_related('sender').order_by('-created_at', '-id').first()
            obj._last_message = last_message
        return last_message

    def get_last_message_sender_id(self, obj):
        if self._has_latest_message_annotation(obj):
            return getattr(obj, 'latest_message_sender_id', None)

        last_message = self._get_last_message(obj)
        return getattr(last_message, 'sender_id', None)

    def get_last_message_sender_username(self, obj):
        if self._has_latest_message_annotation(obj):
            return getattr(obj, 'latest_message_sender_username', '') or ''

        last_message = self._get_last_message(obj)
        if last_message is None:
            return ''
        return getattr(last_message.sender, 'username', '')

    def get_last_message_has_attachments(self, obj):
        if self._has_latest_message_annotation(obj):
            return bool(
                getattr(obj, 'latest_message_file_url', '')
                or getattr(obj, 'latest_message_file_name', '')
            )

        last_message = self._get_last_message(obj)
        if last_message is None:
            return False
        return bool(build_message_attachments(last_message))


class DirectConversationCreateSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField(min_value=1)


class MessageReactionToggleSerializer(serializers.Serializer):
    emoji = serializers.CharField(max_length=16)

    def validate_emoji(self, value):
        normalized_value = str(value).strip()
        if not normalized_value:
            raise serializers.ValidationError('Choose an emoji before reacting.')
        return normalized_value


class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate(self, attrs):
        uploaded_file = attrs['file']
        file_extension = Path(uploaded_file.name).suffix.lower().lstrip('.')

        if file_extension not in ALLOWED_UPLOAD_TYPES:
            raise serializers.ValidationError(
                {'file': 'Unsupported file type. Allowed: jpg, png, gif, webp, pdf, txt.'}
            )

        if uploaded_file.size > MAX_UPLOAD_SIZE:
            raise serializers.ValidationError({'file': 'File size must be 10MB or smaller.'})

        content_type = (getattr(uploaded_file, 'content_type', '') or '').lower()
        allowed_content_types = ALLOWED_UPLOAD_TYPES[file_extension]

        if content_type and content_type != 'application/octet-stream':
            if content_type not in allowed_content_types:
                raise serializers.ValidationError(
                    {'file': 'File content does not match the selected file type.'}
                )

        attrs['file_type'] = NORMALIZED_FILE_TYPES[file_extension]
        return attrs
