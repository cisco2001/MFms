# Generated by Django 5.1.4 on 2024-12-21 18:51

import django.db.models.deletion
import django_tenants.postgresql_backend.base
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Address',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('street', models.CharField(max_length=255)),
                ('city', models.CharField(max_length=100)),
                ('state', models.CharField(max_length=100)),
                ('postal_code', models.CharField(max_length=20)),
                ('country', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Microfinance',
            fields=[
                ('schema_name', models.CharField(db_index=True, max_length=63, unique=True, validators=[django_tenants.postgresql_backend.base._check_schema_name])),
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('registration_number', models.CharField(max_length=100)),
                ('tax_id', models.CharField(max_length=100)),
                ('contact_email', models.EmailField(max_length=254)),
                ('contact_phone', models.CharField(max_length=15)),
                ('date_established', models.DateField(auto_now_add=True)),
                ('status', models.CharField(choices=[('Active', 'Active'), ('Pending', 'Pending'), ('Suspended', 'Suspended'), ('Inactive', 'Inactive'), ('Closed', 'Closed')], default='Pending', max_length=10)),
                ('logo_url', models.URLField()),
                ('kyc_document_type', models.CharField(max_length=50)),
                ('kyc_document_number', models.CharField(max_length=100)),
                ('kyc_document_expiry_date', models.DateField(blank=True, null=True)),
                ('kyc_verification_status', models.BooleanField(default=False)),
                ('kyc_verification_date', models.DateField(blank=True, null=True)),
                ('kyc_document_file', models.FileField(blank=True, null=True, upload_to='kyc_documents/')),
                ('address', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='mfi_management.address')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
