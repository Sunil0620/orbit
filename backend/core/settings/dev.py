"""
Development settings — imports base, adds dev-only stuff.
"""

from .base import *

DEBUG = True

ALLOWED_HOSTS = ['*']

# Allow React dev server
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
CORS_ALLOW_CREDENTIALS = True

# Show emails in console during dev
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
