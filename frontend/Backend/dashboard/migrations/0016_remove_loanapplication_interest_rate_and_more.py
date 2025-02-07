# Generated by Django 5.1.5 on 2025-02-07 16:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0015_dailyreport'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='loanapplication',
            name='interest_rate',
        ),
        migrations.AddField(
            model_name='loanapplication',
            name='agreed_repayment_amount',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
    ]
