from django.db import transaction

from apps.notifications.services import create_channel_read_states_for_members

from .models import Channel


def ensure_default_channel(server):
    if server.channels.exists():
        return server.channels.order_by('created_at', 'id').first()

    with transaction.atomic():
        channel, _created = Channel.objects.get_or_create(
            server=server,
            name='general',
            defaults={
                'channel_type': Channel.ChannelType.TEXT,
            },
        )

    create_channel_read_states_for_members(channel)
    return channel
