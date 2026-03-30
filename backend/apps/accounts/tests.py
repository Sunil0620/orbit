from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import CustomUser
from apps.servers.models import Server


class RegisterViewTests(APITestCase):
    def test_register_normalizes_email_and_creates_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'username': 'orbituser',
                'email': '  XYZ@Orbit.dev  ',
                'password': 'OrbitPass123!',
                'password2': 'OrbitPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = CustomUser.objects.get(username='orbituser')
        self.assertEqual(user.email, 'xyz@orbit.dev')
        self.assertTrue(user.check_password('OrbitPass123!'))

    def test_register_rejects_duplicate_email_case_insensitively(self):
        CustomUser.objects.create_user(
            username='existing',
            email='xyz@orbit.dev',
            password='OrbitPass123!',
        )

        response = self.client.post(
            reverse('register'),
            {
                'username': 'another',
                'email': 'XYZ@ORBIT.dev',
                'password': 'OrbitPass123!',
                'password2': 'OrbitPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)


class LogoutViewTests(APITestCase):
    def test_logout_blacklists_refresh_token(self):
        password = 'OrbitPass123!'
        user = CustomUser.objects.create_user(
            username='orbituser',
            email='xyz@orbit.dev',
            password=password,
        )

        token_response = self.client.post(
            reverse('token_obtain'),
            {
                'username': user.username,
                'password': password,
            },
            format='json',
        )

        self.assertEqual(token_response.status_code, status.HTTP_200_OK)
        access_token = token_response.data['access']
        refresh_token = token_response.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_response = self.client.post(
            reverse('logout'),
            {'refresh': refresh_token},
            format='json',
        )

        self.assertEqual(logout_response.status_code, status.HTTP_205_RESET_CONTENT)

        refresh_response = self.client.post(
            reverse('token_refresh'),
            {'refresh': refresh_token},
            format='json',
        )

        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDirectoryViewTests(APITestCase):
    def setUp(self):
        self.password = 'OrbitPass123!'
        self.requester = CustomUser.objects.create_user(
            username='radhey',
            email='requester@orbit.dev',
            password=self.password,
        )
        self.client.force_authenticate(user=self.requester)

    def test_directory_lists_other_users_with_shared_server_metadata(self):
        reachable_user = CustomUser.objects.create_user(
            username='shared-user',
            email='shared@orbit.dev',
            password=self.password,
            is_online=True,
        )
        distant_user = CustomUser.objects.create_user(
            username='distant-user',
            email='distant@orbit.dev',
            password=self.password,
        )

        alpha = Server.objects.create(name='Alpha', owner=self.requester)
        beta = Server.objects.create(name='Beta', owner=self.requester)
        alpha.members.add(self.requester, reachable_user)
        beta.members.add(self.requester, reachable_user)

        response = self.client.get(reverse('user-directory'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        self.assertEqual(response.data[0]['username'], 'shared-user')
        self.assertEqual(response.data[0]['shared_server_count'], 2)
        self.assertTrue(response.data[0]['can_message'])

        self.assertEqual(response.data[1]['username'], 'distant-user')
        self.assertEqual(response.data[1]['shared_server_count'], 0)
        self.assertFalse(response.data[1]['can_message'])

        usernames = [entry['username'] for entry in response.data]
        self.assertNotIn(self.requester.username, usernames)

    def test_directory_includes_newly_registered_users_automatically(self):
        register_response = self.client.post(
            reverse('register'),
            {
                'username': 'newperson',
                'email': 'newperson@orbit.dev',
                'password': self.password,
                'password2': self.password,
            },
            format='json',
        )

        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)

        response = self.client.get(reverse('user-directory'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'newperson')
        self.assertEqual(response.data[0]['shared_server_count'], 0)
        self.assertFalse(response.data[0]['can_message'])
