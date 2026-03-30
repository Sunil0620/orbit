from pathlib import Path

from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.utils import CloudinaryImageField

from .models import DirectConversation, Message

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


class MessageSerializer(serializers.ModelSerializer):
    sender = MessageSenderSerializer(read_only=True)
    attachments = serializers.SerializerMethodField()
    channel_id = serializers.IntegerField(read_only=True)
    direct_conversation_id = serializers.IntegerField(read_only=True)
    conversation_type = serializers.SerializerMethodField()

    def get_attachments(self, obj):
        return build_message_attachments(obj)

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

    class Meta:
        model = DirectConversation
        fields = (
            'id',
            'participant',
            'last_message_preview',
            'last_message_at',
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

    def get_last_message_preview(self, obj):
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
        last_message = getattr(obj, '_last_message', None)
        if last_message is None:
            last_message = obj.messages.order_by('-created_at', '-id').first()
            obj._last_message = last_message

        return last_message.created_at if last_message else None


class DirectConversationCreateSerializer(serializers.Serializer):
    recipient_id = serializers.IntegerField(min_value=1)


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
