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


def merge_unique_strings(*groups):
    merged_values = []
    seen = set()
    for group in groups:
        for item in group:
            if item and item not in seen:
                seen.add(item)
                merged_values.append(item)
    return merged_values


DEBUG = False

render_hostname = config('RENDER_EXTERNAL_HOSTNAME', default='').strip()
render_origin = f'https://{render_hostname}' if render_hostname else ''

ALLOWED_HOSTS = merge_unique_strings(
    read_csv_env('ALLOWED_HOSTS'),
    [render_hostname],
)

# Only allow the real frontend URL in prod
CORS_ALLOWED_ORIGINS = read_csv_env('CORS_ALLOWED_ORIGINS')
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = merge_unique_strings(
    read_csv_env('CSRF_TRUSTED_ORIGINS', default=','.join(CORS_ALLOWED_ORIGINS)),
    [render_origin],
)

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', cast=bool, default=True)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', cast=bool, default=True)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', cast=bool, default=True)

MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

STORAGES['staticfiles'] = {
    'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
}
