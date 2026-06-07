from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_product_measurement_mode'),
    ]

    operations = [
        migrations.CreateModel(
            name='Visit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('visitor_id', models.CharField(db_index=True, max_length=80)),
                ('path', models.CharField(max_length=500)),
                ('referrer', models.URLField(blank=True)),
                ('device_type', models.CharField(choices=[('desktop', 'Desktop'), ('mobile', 'Mobile'), ('tablet', 'Tablet'), ('other', 'Other')], db_index=True, default='other', max_length=20)),
                ('user_agent', models.TextField(blank=True)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['created_at', 'device_type'], name='api_visit_created_5bb86d_idx'),
                    models.Index(fields=['visitor_id', 'created_at'], name='api_visit_visitor_598020_idx'),
                ],
            },
        ),
    ]
