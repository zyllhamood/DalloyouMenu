from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_product_single_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='size_mode',
            field=models.CharField(
                choices=[('SIZE', 'Size'), ('WEIGHT', 'Weight')],
                default='SIZE',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='weight_label',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AlterField(
            model_name='product',
            name='size',
            field=models.CharField(
                blank=True,
                choices=[('SMALL', 'Small'), ('MEDIUM', 'Medium'), ('LARGE', 'Large')],
                default='LARGE',
                max_length=20,
                null=True,
            ),
        ),
    ]
