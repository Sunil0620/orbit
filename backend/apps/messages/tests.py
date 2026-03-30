from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser
from apps.channels_chat.models import Channel
from apps.messages.models import DirectConversation, Message, MessageReaction
from apps.servers.models import Server


class DirectConversationApiTests(APITestCase):
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

    def test_cannot_start_direct_conversation_without_shared_server(self):
        self.client.force_authenticate(self.sender)

        response = self.client.post(
            reverse('direct_conversation_list_create'),
            {'recipient_id': self.recipient.pk},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('recipient_id', response.data)

    def test_existing_direct_conversation_is_reused(self):
        server = Server.objects.create(name='Orbit HQ', owner=self.sender)
        server.members.add(self.sender, self.recipient)

        self.client.force_authenticate(self.sender)
        first_response = self.client.post(
            reverse('direct_conversation_list_create'),
            {'recipient_id': self.recipient.pk},
            format='json',
        )
        second_response = self.client.post(
            reverse('direct_conversation_list_create'),
            {'recipient_id': self.recipient.pk},
            format='json',
        )

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(DirectConversation.objects.count(), 1)
        self.assertEqual(first_response.data['id'], second_response.data['id'])

    def test_direct_conversation_list_includes_dm_metadata(self):
        server = Server.objects.create(name='Orbit HQ', owner=self.sender)
        server.members.add(self.sender, self.recipient)
        conversation = DirectConversation.objects.create(
            user_one=self.sender,
            user_two=self.recipient,
        )
        Message.objects.create(
            direct_conversation=conversation,
            sender=self.recipient,
            content='See you in orbit',
        )
        self.client.force_authenticate(self.sender)

        response = self.client.get(reverse('direct_conversation_list_create'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['message_count'], 1)
        self.assertEqual(response.data[0]['last_message_sender_username'], 'recipient')
        self.assertTrue(response.data[0]['last_read_message_id'])


class MessageListApiTests(APITestCase):
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
        self.outsider = CustomUser.objects.create_user(
            username='outsider',
            email='outsider@example.com',
            password='OrbitPass123!',
        )
        self.server = Server.objects.create(name='Orbit HQ', owner=self.owner)
        self.server.members.add(self.owner, self.member)
        self.channel = Channel.objects.create(server=self.server, name='general')

    def test_message_list_requires_one_conversation_target(self):
        direct_conversation = DirectConversation.objects.create(
            user_one=self.owner,
            user_two=self.member,
        )
        self.client.force_authenticate(self.owner)

        response = self.client.get(
            reverse('message_list'),
            {
                'channel': self.channel.pk,
                'direct_conversation': direct_conversation.pk,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_channel_messages_are_returned_in_chronological_order(self):
        first_message = Message.objects.create(
            channel=self.channel,
            sender=self.owner,
            content='First',
        )
        second_message = Message.objects.create(
            channel=self.channel,
            sender=self.member,
            content='Second',
        )
        self.client.force_authenticate(self.owner)

        response = self.client.get(
            reverse('message_list'),
            {'channel': self.channel.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [message['id'] for message in response.data['results']],
            [first_message.id, second_message.id],
        )

    def test_non_member_cannot_read_channel_messages(self):
        Message.objects.create(
            channel=self.channel,
            sender=self.owner,
            content='Hidden',
        )
        self.client.force_authenticate(self.outsider)

        response = self.client.get(
            reverse('message_list'),
            {'channel': self.channel.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_message_list_includes_grouped_reactions(self):
        message = Message.objects.create(
            channel=self.channel,
            sender=self.owner,
            content='Nice work',
        )
        MessageReaction.objects.create(message=message, user=self.owner, emoji='🔥')
        MessageReaction.objects.create(message=message, user=self.member, emoji='🔥')
        self.client.force_authenticate(self.owner)

        response = self.client.get(
            reverse('message_list'),
            {'channel': self.channel.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['reactions'][0]['emoji'], '🔥')
        self.assertEqual(response.data['results'][0]['reactions'][0]['count'], 2)
        self.assertTrue(response.data['results'][0]['reactions'][0]['reacted_by_current_user'])


class MessageReactionApiTests(APITestCase):
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
        self.outsider = CustomUser.objects.create_user(
            username='outsider',
            email='outsider@example.com',
            password='OrbitPass123!',
        )
        self.server = Server.objects.create(name='Orbit HQ', owner=self.sender)
        self.server.members.add(self.sender, self.recipient)
        self.channel = Channel.objects.create(server=self.server, name='general')
        self.channel_message = Message.objects.create(
            channel=self.channel,
            sender=self.sender,
            content='Launch update',
        )
        self.direct_conversation = DirectConversation.objects.create(
            user_one=self.sender,
            user_two=self.recipient,
        )
        self.direct_message = Message.objects.create(
            direct_conversation=self.direct_conversation,
            sender=self.sender,
            content='Private launch update',
        )

    def test_member_can_toggle_channel_reaction(self):
        self.client.force_authenticate(self.recipient)

        first_response = self.client.post(
            reverse('message_reaction_toggle', kwargs={'message_id': self.channel_message.pk}),
            {'emoji': '🔥'},
            format='json',
        )
        second_response = self.client.post(
            reverse('message_reaction_toggle', kwargs={'message_id': self.channel_message.pk}),
            {'emoji': '🔥'},
            format='json',
        )

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(first_response.data['action'], 'added')
        self.assertEqual(first_response.data['reactions'][0]['count'], 1)
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.data['action'], 'removed')
        self.assertEqual(second_response.data['reactions'], [])

    def test_direct_message_participant_can_react(self):
        self.client.force_authenticate(self.recipient)

        response = self.client.post(
            reverse('message_reaction_toggle', kwargs={'message_id': self.direct_message.pk}),
            {'emoji': '👍'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['conversation_type'], 'direct')
        self.assertEqual(response.data['reactions'][0]['emoji'], '👍')

    def test_non_participant_cannot_react_to_message(self):
        self.client.force_authenticate(self.outsider)

        response = self.client.post(
            reverse('message_reaction_toggle', kwargs={'message_id': self.direct_message.pk}),
            {'emoji': '😂'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FileUploadApiTests(APITestCase):
    def test_unsupported_file_type_is_rejected_before_upload(self):
        user = CustomUser.objects.create_user(
            username='uploader',
            email='uploader@example.com',
            password='OrbitPass123!',
        )
        upload = SimpleUploadedFile(
            'payload.exe',
            b'not allowed',
            content_type='application/octet-stream',
        )
        self.client.force_authenticate(user)

        response = self.client.post(
            reverse('message_upload'),
            {'file': upload},
            format='multipart',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', response.data)
