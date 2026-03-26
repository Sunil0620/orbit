from pathlib import Path

from rest_framework import serializers

from apps.accounts.models import CustomUser
from apps.utils import CloudinaryImageField

from .models import Message

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


class MessageSerializer(serializers.ModelSerializer):
    sender = MessageSenderSerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            'id',
            'channel',
            'content',
            'file_url',
            'file_name',
            'file_type',
            'is_edited',
            'created_at',
            'updated_at',
            'sender',
        )
        read_only_fields = fields


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
