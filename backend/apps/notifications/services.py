from django.db.models import Count, F, IntegerField, Max, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce
from rest_framework import serializers

from apps.messages.models import Message

from .models import ChannelReadState, DirectConversationReadState


def _to_list(items):
    if isinstance(items, list):
        return items
    return list(items)


def _latest_channel_message_ids(channel_ids):
    if not channel_ids:
        return {}

    return dict(
        Message.objects.filter(channel_id__in=channel_ids)
        .values('channel_id')
        .annotate(latest_message_id=Max('id'))
        .values_list('channel_id', 'latest_message_id')
    )


def _latest_direct_conversation_message_ids(conversation_ids):
    if not conversation_ids:
        return {}

    return dict(
        Message.objects.filter(direct_conversation_id__in=conversation_ids)
        .values('direct_conversation_id')
        .annotate(latest_message_id=Max('id'))
        .values_list('direct_conversation_id', 'latest_message_id')
    )


def ensure_channel_read_states(user, channels):
    channel_list = _to_list(channels)
    if not channel_list:
        return channel_list

    channel_ids = [channel.id for channel in channel_list]
    existing_channel_ids = set(
        ChannelReadState.objects.filter(
            user=user,
            channel_id__in=channel_ids,
        ).values_list('channel_id', flat=True)
    )
    latest_message_ids = _latest_channel_message_ids(channel_ids)

    ChannelReadState.objects.bulk_create(
        [
            ChannelReadState(
                user=user,
                channel_id=channel_id,
                last_read_message_id=latest_message_ids.get(channel_id),
            )
            for channel_id in channel_ids
            if channel_id not in existing_channel_ids
        ],
        ignore_conflicts=True,
    )

    return channel_list


def ensure_direct_conversation_read_states(user, conversations):
    conversation_list = _to_list(conversations)
    if not conversation_list:
        return conversation_list

    conversation_ids = [conversation.id for conversation in conversation_list]
    existing_conversation_ids = set(
        DirectConversationReadState.objects.filter(
            user=user,
            direct_conversation_id__in=conversation_ids,
        ).values_list('direct_conversation_id', flat=True)
    )
    latest_message_ids = _latest_direct_conversation_message_ids(conversation_ids)

    DirectConversationReadState.objects.bulk_create(
        [
            DirectConversationReadState(
                user=user,
                direct_conversation_id=conversation_id,
                last_read_message_id=latest_message_ids.get(conversation_id),
            )
            for conversation_id in conversation_ids
            if conversation_id not in existing_conversation_ids
        ],
        ignore_conflicts=True,
    )

    return conversation_list


def create_channel_read_states_for_members(channel):
    member_ids = list(channel.server.members.values_list('id', flat=True))
    if not member_ids:
        return

    existing_user_ids = set(
        ChannelReadState.objects.filter(
            channel=channel,
            user_id__in=member_ids,
        ).values_list('user_id', flat=True)
    )

    ChannelReadState.objects.bulk_create(
        [
            ChannelReadState(user_id=user_id, channel=channel)
            for user_id in member_ids
            if user_id not in existing_user_ids
        ],
        ignore_conflicts=True,
    )


def create_direct_conversation_read_states(conversation):
    user_ids = [conversation.user_one_id, conversation.user_two_id]
    existing_user_ids = set(
        DirectConversationReadState.objects.filter(
            direct_conversation=conversation,
            user_id__in=user_ids,
        ).values_list('user_id', flat=True)
    )

    DirectConversationReadState.objects.bulk_create(
        [
            DirectConversationReadState(
                user_id=user_id,
                direct_conversation=conversation,
            )
            for user_id in user_ids
            if user_id not in existing_user_ids
        ],
        ignore_conflicts=True,
    )


def annotate_channels_with_unread_counts(queryset, user):
    last_read_subquery = ChannelReadState.objects.filter(
        user=user,
        channel=OuterRef('pk'),
    ).values('last_read_message_id')[:1]

    return queryset.annotate(
        last_read_message_id=Coalesce(
            Subquery(last_read_subquery, output_field=IntegerField()),
            Value(0),
        )
    ).annotate(
        unread_count=Count(
            'messages',
            filter=Q(messages__id__gt=F('last_read_message_id'))
            & ~Q(messages__sender=user),
            distinct=True,
        )
    )


def annotate_direct_conversations_with_unread_counts(queryset, user):
    last_read_subquery = DirectConversationReadState.objects.filter(
        user=user,
        direct_conversation=OuterRef('pk'),
    ).values('last_read_message_id')[:1]

    return queryset.annotate(
        last_read_message_id=Coalesce(
            Subquery(last_read_subquery, output_field=IntegerField()),
            Value(0),
        )
    ).annotate(
        unread_count=Count(
            'messages',
            filter=Q(messages__id__gt=F('last_read_message_id'))
            & ~Q(messages__sender=user),
            distinct=True,
        )
    )


def _resolve_last_read_message(*, message_queryset, message_id, detail):
    if message_id is None:
        return message_queryset.order_by('-id').first()

    message = message_queryset.filter(pk=message_id).first()
    if message is None:
        raise serializers.ValidationError({'last_read_message_id': detail})

    return message


def mark_channel_as_read(user, channel, message_id=None):
    message = _resolve_last_read_message(
        message_queryset=Message.objects.filter(channel=channel),
        message_id=message_id,
        detail='The selected message does not belong to this channel.',
    )
    state, _ = ChannelReadState.objects.get_or_create(
        user=user,
        channel=channel,
    )

    if message and (state.last_read_message_id or 0) < message.id:
        state.last_read_message = message
        state.save(update_fields=['last_read_message', 'updated_at'])

    return state.last_read_message_id


def mark_direct_conversation_as_read(user, direct_conversation, message_id=None):
    message = _resolve_last_read_message(
        message_queryset=Message.objects.filter(
            direct_conversation=direct_conversation,
        ),
        message_id=message_id,
        detail='The selected message does not belong to this conversation.',
    )
    state, _ = DirectConversationReadState.objects.get_or_create(
        user=user,
        direct_conversation=direct_conversation,
    )

    if message and (state.last_read_message_id or 0) < message.id:
        state.last_read_message = message
        state.save(update_fields=['last_read_message', 'updated_at'])

    return state.last_read_message_id
