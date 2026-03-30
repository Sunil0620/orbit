import os

os.environ.setdefault(
    'SECRET_KEY',
    'orbit-test-secret-key-with-32-plus-chars',
)

from .base import *  # noqa: E402,F403


DEBUG = False

ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

MEDIA_ROOT = BASE_DIR / 'test-media'
