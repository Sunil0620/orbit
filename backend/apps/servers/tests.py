from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser
from apps.channels_chat.models import Channel
from apps.servers.models import Server


class ServerApiTests(APITestCase):
    def setUp(self):
        self.owner = CustomUser.objects.create_user(
            username='owner',
            email='owner@example.com',
            password='OrbitPass123!',
        )
        self.admin = CustomUser.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='OrbitPass123!',
        )
        self.member = CustomUser.objects.create_user(
            username='member',
            email='member@example.com',
            password='OrbitPass123!',
        )

    def test_create_server_adds_owner_as_member_with_owner_permissions(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse('server_list_create'),
            {'name': 'Orbit HQ'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        server = Server.objects.get(name='Orbit HQ')
        self.assertEqual(server.owner, self.owner)
        self.assertTrue(server.members.filter(pk=self.owner.pk).exists())
        self.assertTrue(
            Channel.objects.filter(
                server=server,
                name='general',
                channel_type=Channel.ChannelType.TEXT,
            ).exists()
        )
        self.assertEqual(response.data['current_user_role'], Server.Role.OWNER)
        self.assertTrue(response.data['permissions']['can_manage_roles'])

    def test_listing_servers_repairs_missing_default_channel(self):
        server = Server.objects.create(name='Crew', owner=self.owner)
        server.members.add(self.owner)
        self.client.force_authenticate(self.owner)

        response = self.client.get(reverse('server_list_create'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['name'], 'Crew')
        self.assertTrue(Channel.objects.filter(server=server, name='general').exists())

    def test_join_server_repairs_missing_default_channel(self):
        server = Server.objects.create(name='Crew', owner=self.owner)
        server.members.add(self.owner)
        self.client.force_authenticate(self.member)

        response = self.client.post(
            reverse('server_join'),
            {'invite_code': str(server.invite_code)},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(server.members.filter(pk=self.member.pk).exists())
        self.assertTrue(Channel.objects.filter(server=server, name='general').exists())

    def test_only_owner_can_change_member_roles(self):
        server = Server.objects.create(name='Orbit HQ', owner=self.owner)
        server.members.add(self.owner, self.admin, self.member)
        server.admins.add(self.admin)

        self.client.force_authenticate(self.admin)
        forbidden_response = self.client.patch(
            reverse(
                'server_member_role',
                kwargs={'pk': server.pk, 'member_id': self.member.pk},
            ),
            {'role': Server.Role.ADMIN},
            format='json',
        )

        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.owner)
        success_response = self.client.patch(
            reverse(
                'server_member_role',
                kwargs={'pk': server.pk, 'member_id': self.member.pk},
            ),
            {'role': Server.Role.ADMIN},
            format='json',
        )

        self.assertEqual(success_response.status_code, status.HTTP_200_OK)
        server.refresh_from_db()
        self.assertTrue(server.admins.filter(pk=self.member.pk).exists())


class ChannelApiTests(APITestCase):
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

    def test_listing_channels_creates_the_default_general_channel(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get(
            reverse('channel_list_create'),
            {'server': self.server.pk},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.server.channels.count(), 1)
        default_channel = self.server.channels.get()
        self.assertEqual(default_channel.name, 'general')
        self.assertEqual(default_channel.channel_type, Channel.ChannelType.TEXT)

    def test_member_cannot_create_channel(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(
            reverse('channel_list_create'),
            {
                'server': self.server.pk,
                'name': 'announcements',
                'channel_type': Channel.ChannelType.ANNOUNCEMENT,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_create_channel_and_read_states_are_created_for_members(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            reverse('channel_list_create'),
            {
                'server': self.server.pk,
                'name': 'announcements',
                'channel_type': Channel.ChannelType.ANNOUNCEMENT,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        channel = Channel.objects.get(server=self.server, name='announcements')
        self.assertEqual(channel.read_states.count(), 2)

    def test_last_channel_cannot_be_deleted(self):
        channel = Channel.objects.create(
            server=self.server,
            name='general',
            channel_type=Channel.ChannelType.TEXT,
        )
        self.client.force_authenticate(self.owner)

        response = self.client.delete(
            reverse('channel_delete', kwargs={'pk': channel.pk}),
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Channel.objects.filter(pk=channel.pk).exists())
