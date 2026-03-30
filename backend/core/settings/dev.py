"""
Development settings — imports base, adds dev-only stuff.
"""

from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Allow local dev and tunneled dev origins
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https://.*\.ngrok-free\.dev$',
    r'^https://.*\.ngrok\.io$',
]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://*.ngrok-free.dev',
    'https://*.ngrok.io',
]

# Show emails in console during dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
