"""
Base settings — shared across all environments.
Dev and Prod settings import from here.
"""

import re
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qsl, quote, unquote, urlparse

from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def read_env_text(name):
    raw_value = config(name, default='')
    return re.split(r'\s+#', raw_value, maxsplit=1)[0].strip()


def build_database_config():
    database_url = read_env_text('DATABASE_URL')
    conn_max_age = config('DB_CONN_MAX_AGE', cast=int, default=60)
    default_database = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='orbit_db'),
        'USER': config('DB_USER', default='orbit_user'),
        'PASSWORD': config('DB_PASSWORD', default='orbit_pass'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': conn_max_age,
        'CONN_HEALTH_CHECKS': True,
    }
    sslmode = read_env_text('DB_SSLMODE')
    if sslmode:
        default_database['OPTIONS'] = {'sslmode': sslmode}

    if not database_url:
        return default_database

    parsed_url = urlparse(database_url)
    if parsed_url.scheme not in {'postgres', 'postgresql'}:
        return default_database

    database_config = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': unquote(parsed_url.path.lstrip('/')) or default_database['NAME'],
        'USER': unquote(parsed_url.username or default_database['USER']),
        'PASSWORD': unquote(parsed_url.password or default_database['PASSWORD']),
        'HOST': parsed_url.hostname or default_database['HOST'],
        'PORT': str(parsed_url.port or default_database['PORT']),
        'CONN_MAX_AGE': conn_max_age,
        'CONN_HEALTH_CHECKS': True,
    }
    raw_options = dict(parse_qsl(parsed_url.query, keep_blank_values=True))
    sslmode = raw_options.pop('sslmode', None) or sslmode
    supported_option_keys = {'options', 'target_session_attrs'}
    options = {
        key: value
        for key, value in raw_options.items()
        if key in supported_option_keys and value
    }
    if sslmode or options:
        database_config['OPTIONS'] = {}
        if sslmode:
            database_config['OPTIONS']['sslmode'] = sslmode
        database_config['OPTIONS'].update(options)

    return database_config


def build_redis_hosts():
    redis_url = read_env_text('REDIS_URL')
    if redis_url:
        return [redis_url]

    redis_host = config('REDIS_HOST', default='redis')
    redis_port = config('REDIS_PORT', cast=int, default=6379)
    redis_password = read_env_text('REDIS_PASSWORD')

    if redis_password:
        return [f'redis://:{quote(redis_password)}@{redis_host}:{redis_port}/0']

    return [(redis_host, redis_port)]

SECRET_KEY = config('SECRET_KEY')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'daphne',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'cloudinary',
    'cloudinary_storage',

    # Local apps
    'apps.accounts',
    'apps.servers',
    'apps.channels_chat',
    'apps.messages',
    'apps.notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ASGI — required for Django Channels (WebSockets)
ASGI_APPLICATION = 'core.asgi.application'

# Database — overridden in dev/prod
DATABASES = {
    'default': build_database_config()
}

# Custom user model
AUTH_USER_MODEL = 'accounts.CustomUser'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# File storage
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': read_env_text('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': read_env_text('CLOUDINARY_API_KEY'),
    'API_SECRET': read_env_text('CLOUDINARY_API_SECRET'),
}

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

if all(CLOUDINARY_STORAGE.values()):
    STORAGES['default'] = {
        'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage',
    }

# Channel layers (Redis) — overridden in dev/prod
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': build_redis_hosts(),
        },
    },
}
