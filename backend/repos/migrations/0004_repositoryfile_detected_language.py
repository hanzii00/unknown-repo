from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('repos', '0003_repositoryfile'),
    ]

    operations = [
        migrations.AddField(
            model_name='repositoryfile',
            name='detected_language',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
