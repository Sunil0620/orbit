from rest_framework import serializers


class MarkReadSerializer(serializers.Serializer):
    last_read_message_id = serializers.IntegerField(
        min_value=1,
        required=False,
    )
