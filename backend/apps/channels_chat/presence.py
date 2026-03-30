from functools import lru_cache

from django.conf import settings
from redis import Redis

PRESENCE_CONNECTION_KEY_PREFIX = 'orbit:presence:user:'


def build_presence_connection_key(user_id):
    return f'{PRESENCE_CONNECTION_KEY_PREFIX}{int(user_id)}:connections'


def _resolve_redis_client():
    hosts = settings.CHANNEL_LAYERS['default']['CONFIG'].get('hosts', [])
    primary_host = hosts[0] if hosts else ('localhost', 6379)

    if isinstance(primary_host, str):
        return Redis.from_url(primary_host, decode_responses=True)

    if isinstance(primary_host, dict):
        return Redis(
            host=primary_host.get('host', 'localhost'),
            port=primary_host.get('port', 6379),
            db=primary_host.get('db', 0),
            password=primary_host.get('password'),
            decode_responses=True,
        )

    host, port = primary_host[:2]
    return Redis(host=host, port=port, decode_responses=True)


@lru_cache(maxsize=1)
def get_presence_redis_client():
    return _resolve_redis_client()


def open_presence_connection(user_id):
    connection_count = get_presence_redis_client().incr(
        build_presence_connection_key(user_id)
    )
    return int(connection_count) == 1


def close_presence_connection(user_id):
    redis_client = get_presence_redis_client()
    key = build_presence_connection_key(user_id)
    connection_count = int(redis_client.decr(key))

    if connection_count <= 0:
        redis_client.delete(key)
        return True

    return False

