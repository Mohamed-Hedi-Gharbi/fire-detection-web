# Generated by Django 4.2.11 on 2024-09-19 14:03

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('supervisor', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='geomp',
        ),
    ]
