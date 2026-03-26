from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware


@database_sync_to_async
def get_user_from_token(token):
    from django.contrib.auth import get_user_model
    from django.contrib.auth.models import AnonymousUser
    from rest_framework_simplejwt.exceptions import TokenError
    from rest_framework_simplejwt.tokens import AccessToken

    User = get_user_model()

    try:
        validated_token = AccessToken(token)
        return User.objects.get(pk=validated_token['user_id'])
    except (User.DoesNotExist, KeyError, TokenError):
        return AnonymousUser()


class QueryStringJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = parse_qs(query_string).get('token', [None])[0]

        if token:
            scope['user'] = await get_user_from_token(token)

        return await super().__call__(scope, receive, send)
