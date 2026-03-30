from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat_messages', '0002_message_attachments'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DirectConversation',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                (
                    'user_one',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='direct_conversations_started',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    'user_two',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='direct_conversations_received',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'ordering': ('-updated_at', '-id'),
            },
        ),
        migrations.AddField(
            model_name='message',
            name='direct_conversation',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='messages',
                to='chat_messages.directconversation',
            ),
        ),
        migrations.AlterField(
            model_name='message',
            name='channel',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='messages',
                to='channels_chat.channel',
            ),
        ),
        migrations.AddConstraint(
            model_name='directconversation',
            constraint=models.UniqueConstraint(
                fields=('user_one', 'user_two'),
                name='unique_direct_conversation_pair',
            ),
        ),
        migrations.AddConstraint(
            model_name='directconversation',
            constraint=models.CheckConstraint(
                check=~models.Q(user_one=models.F('user_two')),
                name='prevent_self_direct_conversation',
            ),
        ),
        migrations.AddConstraint(
            model_name='message',
            constraint=models.CheckConstraint(
                check=(
                    (
                        models.Q(
                            channel__isnull=False,
                            direct_conversation__isnull=True,
                        )
                    )
                    | (
                        models.Q(
                            channel__isnull=True,
                            direct_conversation__isnull=False,
                        )
                    )
                ),
                name='message_requires_single_conversation_target',
            ),
        ),
    ]
