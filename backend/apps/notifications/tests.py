from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser
from apps.channels_chat.models import Channel
from apps.messages.models import DirectConversation, Message
from apps.servers.models import Server


class ChannelNotificationTests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='OrbitPass123!',
        )
        self.member = CustomUser.objects.create_user(
            username='member',
            email='member@example.com',
            password='OrbitPass123!',
        )
        self.server = Server.objects.create(name='Orbit HQ', owner=self.owner)
        self.server.members.add(self.owner, self.member)
        self.channel = Channel.objects.create(server=self.server, name='general')

    def test_channel_list_reports_unread_count_and_mark_read_clears_it(self):
        self.client.force_authenticate(self.member)

        initial_response = self.client.get(
            reverse('channel_list_create'),
            {'server': self.server.pk},
        )

        self.assertEqual(initial_response.status_code, status.HTTP_200_OK)
        self.assertEqual(initial_response.data['results'][0]['unread_count'], 0)

        message = Message.objects.create(
            channel=self.channel,
            sender=self.owner,
            content='Welcome to Orbit',
        )

        unread_response = self.client.get(
            reverse('channel_list_create'),
            {'server': self.server.pk},
        )

        self.assertEqual(unread_response.status_code, status.HTTP_200_OK)
        self.assertEqual(unread_response.data['results'][0]['unread_count'], 1)

        mark_response = self.client.post(
            reverse('channel_read', kwargs={'channel_id': self.channel.pk}),
            {'last_read_message_id': message.id},
            format='json',
        )

        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        self.assertEqual(mark_response.data['unread_count'], 0)

        cleared_response = self.client.get(
            reverse('channel_list_create'),
            {'server': self.server.pk},
        )

        self.assertEqual(cleared_response.data['results'][0]['unread_count'], 0)


class DirectConversationNotificationTests(APITestCase):
    def setUp(self):
        self.sender = CustomUser.objects.create_user(
            username='sender',
            email='sender@example.com',
            password='OrbitPass123!',
        )
        self.recipient = CustomUser.objects.create_user(
            username='recipient',
            email='recipient@example.com',
            password='OrbitPass123!',
        )
        self.server = Server.objects.create(name='Orbit HQ', owner=self.sender)
        self.server.members.add(self.sender, self.recipient)
        self.conversation = DirectConversation.objects.create(
            user_one=self.sender,
            user_two=self.recipient,
        )

    def test_direct_conversation_list_reports_unread_count_and_mark_read_clears_it(self):
        self.client.force_authenticate(self.recipient)

        initial_response = self.client.get(reverse('direct_conversation_list_create'))

        self.assertEqual(initial_response.status_code, status.HTTP_200_OK)
        self.assertEqual(initial_response.data[0]['unread_count'], 0)

        message = Message.objects.create(
            direct_conversation=self.conversation,
            sender=self.sender,
            content='Ping from orbit',
        )

        unread_response = self.client.get(reverse('direct_conversation_list_create'))

        self.assertEqual(unread_response.status_code, status.HTTP_200_OK)
        self.assertEqual(unread_response.data[0]['unread_count'], 1)

        mark_response = self.client.post(
            reverse(
                'direct_conversation_read',
                kwargs={'conversation_id': self.conversation.pk},
            ),
            {'last_read_message_id': message.id},
            format='json',
        )

        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        self.assertEqual(mark_response.data['unread_count'], 0)

        cleared_response = self.client.get(reverse('direct_conversation_list_create'))

        self.assertEqual(cleared_response.data[0]['unread_count'], 0)

    def test_notification_summary_includes_channel_and_direct_totals(self):
        channel = Channel.objects.create(server=self.server, name='general')
        self.client.force_authenticate(self.recipient)

        self.client.get(reverse('channel_list_create'), {'server': self.server.pk})
        self.client.get(reverse('direct_conversation_list_create'))

        Message.objects.create(
            channel=channel,
            sender=self.sender,
            content='Server update',
        )
        Message.objects.create(
            direct_conversation=self.conversation,
            sender=self.sender,
            content='Direct update',
        )

        response = self.client.get(reverse('notification_summary'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_channel_unread'], 1)
        self.assertEqual(response.data['total_direct_unread'], 1)
        self.assertEqual(response.data['total_unread'], 2)
