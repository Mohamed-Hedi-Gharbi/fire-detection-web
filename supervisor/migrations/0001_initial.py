# Generated by Django 4.2.11 on 2024-05-28 11:27

from django.conf import settings
import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('client', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Localisation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('gouvernorat_libelle', models.CharField(blank=True, max_length=255, null=True)),
                ('delegation_libelle', models.CharField(blank=True, max_length=255, null=True)),
                ('localite_libelle', models.CharField(max_length=255)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
            ],
            options={
                'unique_together': {('gouvernorat_libelle', 'delegation_libelle', 'localite_libelle')},
            },
        ),
        migrations.CreateModel(
            name='Supervisor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('firstName', models.CharField(max_length=25)),
                ('lastName', models.CharField(max_length=25)),
                ('phoneNumber', models.CharField(max_length=12)),
                ('username', models.CharField(max_length=30)),
                ('password', models.CharField(max_length=128)),
                ('email', models.EmailField(max_length=255, unique=True)),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('name', models.CharField(max_length=30)),
                ('geomp', django.contrib.gis.db.models.fields.MultiPolygonField(null=True, srid=4326)),
                ('descp', models.TextField(null=True)),
                ('date_debut', models.DateTimeField(default=django.utils.timezone.now)),
                ('date_fin', models.DateTimeField()),
                ('piece_joindre', models.FileField(blank=True, null=True, upload_to='uploads/%Y/%m/%d/')),
                ('polygon_id', models.BigAutoField(default=None, primary_key=True, serialize=False)),
                ('city', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='projects', to='supervisor.localisation')),
                ('client', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='client.client')),
            ],
        ),
        migrations.CreateModel(
            name='Parcelle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=30)),
                ('polygon', django.contrib.gis.db.models.fields.PolygonField(null=True, srid=4326)),
                ('project', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='parcelle', to='supervisor.project')),
            ],
        ),
        migrations.CreateModel(
            name='Node',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=30)),
                ('position', django.contrib.gis.db.models.fields.PointField(null=True, srid=4326)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('reference', models.CharField(max_length=50, null=True)),
                ('node_range', models.BigIntegerField(blank=True, null=True)),
                ('sensors', models.CharField(max_length=50, null=True)),
                ('RSSI', models.BigIntegerField(null=True)),
                ('Battery_value', models.BigIntegerField(null=True)),
                ('status', models.CharField(max_length=50, null=True)),
                ('FWI', models.FloatField(default=0, null=True)),
                ('detection', models.BigIntegerField(null=True)),
                ('parcelle', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='nodes', to='supervisor.parcelle')),
            ],
        ),
        migrations.CreateModel(
            name='Data',
            fields=[
                ('idData', models.AutoField(primary_key=True, serialize=False)),
                ('temperature', models.BigIntegerField(null=True)),
                ('humidity', models.BigIntegerField(null=True)),
                ('pressur', models.BigIntegerField(null=True)),
                ('gaz', models.BigIntegerField(null=True)),
                ('detection', models.BigIntegerField(null=True)),
                ('wind', models.FloatField(default=0, null=True)),
                ('rain', models.FloatField(default=0, null=True)),
                ('ffmc', models.FloatField(null=True)),
                ('isi', models.FloatField(null=True)),
                ('fwi', models.FloatField(null=True)),
                ('published_date', models.DateTimeField(blank=True, null=True)),
                ('node', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='datas', to='supervisor.node')),
            ],
        ),
    ]
