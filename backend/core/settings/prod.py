"""
Production settings — imports base, locks everything down.
"""

from .base import *
from decouple import config


def read_csv_env(name, default=''):
    return config(
        name,
        default=default,
        cast=lambda value: [item.strip() for item in value.split(',') if item.strip()],
    )


DEBUG = False

ALLOWED_HOSTS = read_csv_env('ALLOWED_HOSTS')

# Only allow the real frontend URL in prod
CORS_ALLOWED_ORIGINS = read_csv_env('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = read_csv_env('CSRF_TRUSTED_ORIGINS')

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', cast=bool, default=True)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', cast=bool, default=True)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', cast=bool, default=True)
