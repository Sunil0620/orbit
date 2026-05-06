import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def json_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return response

    request = context.get('request')
    view = context.get('view')
    logger.exception(
        'Unhandled API exception in %s %s',
        request.method if request else 'UNKNOWN',
        request.get_full_path() if request else repr(view),
        exc_info=exc,
    )

    return Response(
        {'detail': 'Internal server error. Check the backend logs for the traceback.'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
