from cloudinary.utils import cloudinary_url
from rest_framework import serializers


def build_cloudinary_asset_url(resource):
    if not resource:
        return None

    url = getattr(resource, 'url', None)
    if isinstance(url, str) and url:
        return url.replace('http://', 'https://', 1)

    build_url = getattr(resource, 'build_url', None)
    if callable(build_url):
        built_url = build_url(secure=True)
        if built_url:
            return built_url

    public_id = getattr(resource, 'public_id', None)
    if public_id:
        url, _ = cloudinary_url(
            public_id,
            secure=True,
            version=getattr(resource, 'version', None),
            format=getattr(resource, 'format', None),
            resource_type=getattr(resource, 'resource_type', 'image'),
            type=getattr(resource, 'type', 'upload'),
        )
        return url

    raw_value = str(resource).strip()
    if raw_value.startswith('https://'):
        return raw_value
    if raw_value.startswith('http://'):
        return raw_value.replace('http://', 'https://', 1)

    return None


class CloudinaryImageField(serializers.ImageField):
    def to_representation(self, value):
        return build_cloudinary_asset_url(value)
